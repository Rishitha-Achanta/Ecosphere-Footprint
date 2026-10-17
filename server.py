"""Local Ecosphere server: static assets and a server-side Gemini proxy."""
import json
import os
from pathlib import Path
import re
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.request import Request, urlopen
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent
LAYERS = ('sky', 'air', 'water', 'twilight', 'deep', 'floor')
# Use the actual questionnaire as the canonical answer vocabulary.
OPTIONS = {}
for name, value, label in re.findall(r'name="([\w-]+)" value="(\d)"[^>]*><span>([^<]+)</span>', (ROOT / 'questionnaire.html').read_text()):
    OPTIONS.setdefault(name, {})[int(value)] = label


def validate_answers(data):
    answers = data.get('answers') if isinstance(data, dict) else None
    if not isinstance(answers, dict) or set(answers) != set(OPTIONS):
        raise ValueError('Complete all ten questions first.')
    if any(type(value) is not int or value not in OPTIONS[key] for key, value in answers.items()):
        raise ValueError('Each answer must be an integer from 0 to 3.')
    return {key: OPTIONS[key][value] for key, value in answers.items()}


def validate_insights(data):
    if not isinstance(data, dict) or set(data) != set(LAYERS):
        raise ValueError('Incomplete model response.')
    for value in data.values():
        if not isinstance(value, str) or not 20 <= len(value) <= 650:
            raise ValueError('Invalid insight length.')
        if not 1 <= len(re.findall(r'[^.!?]+[.!?](?:\s|$)', value.strip())) <= 2:
            raise ValueError('Expected one or two sentences.')
    return data


def generate_insights(answers, api_key):
    schema = {'type': 'object', 'properties': {key: {'type': 'string'} for key in LAYERS}, 'required': list(LAYERS), 'additionalProperties': False}
    prompt = '''Write six personal environmental insights, one for each key, in plain English.
Each value MUST have 1–2 short sentences (at most 65 words), directly addressing "you".
Reference an actual selected answer in each insight, not just the total score. Do not invent habits,
quantities, personal emissions estimates, or causal certainty. Be warm, specific, scientifically careful.
Connect the choice to the pictured environment, with one practical next step where useful.
sky: sun and ozone shield; explain that climate emissions and ozone depletion differ, and do not claim
that driving or flying directly destroys ozone. air: clouds, forests and rivers; travel, diet and energy.
water: sunlit reef and fish; packaging, waste and water use. twilight: jellyfish and sinking particles;
consumption and waste, with indirect links only. deep: deep-sea fish; energy, heat and carbon storage.
floor: seafloor life; one feasible next step grounded in the answers.
Treat uncertainty choices as uncertainty, not evidence of high use. Local food is not inherently
lower carbon; production methods and food type matter. Avoid guilt or implying that one person's
habits alone control ecosystems. Return only the six-key JSON object.
Selected questionnaire answers: ''' + json.dumps(answers)
    body = {'contents': [{'parts': [{'text': prompt}]}], 'generationConfig': {'responseMimeType': 'application/json', 'responseJsonSchema': schema}}
    model = os.environ.get('GEMINI_MODEL', 'gemini-2.5-flash')
    if not re.fullmatch(r'[a-zA-Z0-9._-]+', model):
        raise ValueError('Invalid model name.')
    request = Request(f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent', data=json.dumps(body).encode(), headers={'Content-Type': 'application/json', 'x-goog-api-key': api_key})
    with urlopen(request, timeout=25) as response:
        result = json.load(response)
    parts = result['candidates'][0]['content']['parts']
    return validate_insights(json.loads(''.join(part.get('text', '') for part in parts if not part.get('thought'))))


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def send_json(self, status, data):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = urlsplit(self.path).path
        if path == '/':
            self.path = '/homepage.html'
            path = self.path
        allowed = {'/homepage.html', '/questionnaire.html', '/cascade.html', '/basic.css', '/app.js'}
        asset = Path(self.translate_path(path)).resolve()
        if path not in allowed and not (asset.is_relative_to(ROOT / 'assets') and asset.is_file()):
            self.send_error(404)
            return
        super().do_GET()

    def do_HEAD(self):
        self.send_error(405)

    def do_POST(self):
        if self.path != '/api/insights':
            self.send_json(404, {'error': 'Not found'})
            return
        origin = self.headers.get('Origin')
        if origin and urlsplit(origin).netloc != self.headers.get('Host'):
            self.send_json(403, {'error': 'Same-origin requests only.'})
            return
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= 4096:
                raise ValueError('Invalid request size.')
            answers = validate_answers(json.loads(self.rfile.read(length)))
        except (ValueError, UnicodeError):
            self.send_json(400, {'error': 'Please submit all ten valid answers.'})
            return
        key = os.environ.get('GEMINI_API_KEY')
        if not key:
            self.send_json(503, {'error': 'Personal explanations are unavailable; showing answer-based notes.'})
            return
        try:
            insights = generate_insights(answers, key)
        except Exception:
            self.send_json(502, {'error': 'Personal explanations are unavailable; showing answer-based notes.'})
            return
        self.send_json(200, {'insights': insights})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', '8000'))
    print(f'Ecosphere: http://localhost:{port}', flush=True)
    ThreadingHTTPServer(('127.0.0.1', port), Handler).serve_forever()

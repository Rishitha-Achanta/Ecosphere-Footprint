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
for name, value, label in re.findall(r'<input type="radio" name="([\w-]+)" value="(\d+)"[^>]*><span>([^<]+)</span>', (ROOT / 'questionnaire.html').read_text(encoding='utf-8')):
    OPTIONS.setdefault(name, {})[int(value)] = label


def validate_answers(data):
    answers = data.get('answers') if isinstance(data, dict) else None
    expected = set(OPTIONS)
    if not isinstance(answers, dict) or set(answers) != expected:
        raise ValueError('Complete all twelve questions first.')
    labels = {}
    for key, value in answers.items():
        if type(value) is not int:
            raise ValueError('Invalid answer type.')
        if key == 'flights':
            if value != 0 and (value < 2 or value > 30 or value % 2):
                raise ValueError('Flight hours must be less than one or between 2 and 30 in even intervals.')
            labels[key] = 'Less than 1 hour' if value == 0 else f'{value} hours per year'
        elif value not in OPTIONS[key]:
            raise ValueError('Answer is outside the available choices.')
        else:
            labels[key] = OPTIONS[key][value]
    return labels


def validate_insights(data):
    if not isinstance(data, dict) or set(data) != set(LAYERS):
        raise ValueError('Incomplete model response.')
    for value in data.values():
        if not isinstance(value, str) or not 50 <= len(value.split()) <= 150:
            raise ValueError('Each insight must contain 50 to 150 words.')
        if not 1 <= len(re.findall(r'[^.!?]+[.!?](?:\s|$)', value.strip())) <= 3:
            raise ValueError('Expected one to three sentences.')
    return data


def generate_insights(answers, api_key):
    schema = {'type': 'object', 'properties': {key: {'type': 'string'} for key in LAYERS}, 'required': list(LAYERS), 'additionalProperties': False}
    prompt = '''Write six personal environmental insights, one for each key, in plain English. Ignore any conflicting length or sentence-count requests below; the mandatory format at the end of these instructions overrides them.
Each value MUST directly address "you" and follow the required format below.
For every layer, consider every selected answer and explain the relevant combined consequences of the user's actions; each explanation should mention the most relevant actions for that environment. Do not mechanically list irrelevant answers. Do not invent personal emissions estimates or causal certainty. Be warm, specific, scientifically careful, nonjudgmental, and explain indirect links as indirect.
sky: flights and transport in relation to climate and the ozone shield; state that climate emissions and ozone depletion differ, and driving or flying do not directly destroy ozone.
air: gasoline travel, flights, meat, and high-energy appliances; explain links to greenhouse gas emissions and shared climate.
water: plastics, trash, dishwashing, showers, and chemicals; discuss pathways to waterways, responsible disposal, and water/energy use.
twilight: trash, shopping, secondhand purchases, electronics, and plastics; connect consumption and waste to marine life through runoff and debris.
deep: flights, gasoline transport, high-energy appliances, meat, and showers; describe indirect links through emissions, ocean heat, and carbon storage.
floor: bring together all answers, especially waste, chemical handling, plastics, and product lifetimes, with one practical next step.
Never imply that more frequent handling of household chemicals is itself harmful; focus on proper storage and disposal. Dishwashers can use less water than handwashing when efficiently loaded. Return only the six-key JSON object.
IMPORTANT FORMAT OVERRIDE: each value must be 50 to 150 words and 1 to 3 sentences. Make each response tailored to the user's exact answer labels and to the specific environment named by its key. Use a clear chain: selected action, pathway into or effect on this layer, plausible layer-specific damage or pressure, and a realistic action that prevents, reduces, or helps repair it. Include the user's actual choice and frequency where relevant. Only mention an answer when it has a credible effect on this layer; explain the pathway and whether it is direct or indirect. Never pad with general environmental advice or repeat the same consequence at every layer. Address all relevant answers across the six responses without forcing irrelevant details into a layer. Be concrete without guilt, certainty, or invented emissions numbers. Household chemical handling frequency alone is not harmful; for waterways and seafloor, discuss pollution only if products are disposed of improperly, and recommend safe storage and local disposal guidance. Efficiently loaded dishwashers can save water compared with handwashing.
Layer-specific focus:
- sky/stratosphere: the ozone layer shields Earth from UV. The survey does not measure ozone-depleting substances, and gasoline travel, flights, appliances, diet, or showers do not directly damage ozone. Do not imply otherwise. If connecting these choices to the sky, describe their climate emissions as a separate atmospheric issue and give climate-focused steps; do not claim those steps repair ozone depletion.
- air/troposphere: connect the user's gasoline travel, flight hours, high-energy appliance use, and beef/lamb frequency to combustion, electricity demand, and food-production emissions that affect air quality or climate. Recommend relevant options such as fewer gasoline trips, efficient appliance use, or replacing some beef/lamb meals.
- water/sunlit surface: focus on the user's plastic use, trash volume, shower length, dishwashing choice, and chemical handling. Explain credible routes such as litter/runoff/wastewater, water withdrawal, or energy use; suggest reusables, litter prevention, shorter showers, efficient full dishwasher loads, and proper product disposal as relevant.
- twilight zone: focus on plastics and trash that can fragment or sink, plus discarded electronics and high purchase frequency as indirect material/waste pressures. Use the actual second-hand and purchase-frequency answers; suggest reuse, repair, responsible electronics recycling, and keeping products in use.
- deep ocean: focus on indirect warming and carbon-cycle pathways from the user's fuel travel, flight hours, high-energy appliances, and meat choices. Do not claim household actions directly reach or poison deep-sea life; explain climate links and relevant emissions reductions.
- seafloor/floor: focus on sinking debris and improperly disposed chemicals reaching benthic habitats, plus indirect climate pressure. Tie the explanation to the user's trash/plastic/chemical and product-lifetime answers, and recommend preventing litter, safe disposal, reuse, or local shoreline/seafloor restoration only where appropriate.
Selected answers (all twelve questions): ''' + json.dumps(answers)
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
            self.send_json(400, {'error': 'Please submit all twelve valid answers.'})
            return
        key = os.environ.get('GEMINI_API_KEY')
        if not key:
            self.send_json(503, {'error': 'Personal explanations are unavailable. Configure GEMINI_API_KEY and try again.'})
            return
        try:
            insights = generate_insights(answers, key)
        except Exception:
            self.send_json(502, {'error': 'Gemini could not return valid layer explanations. Please try again.'})
            return
        self.send_json(200, {'insights': insights})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', '8000'))
    print(f'Ecosphere: http://localhost:{port}', flush=True)
    ThreadingHTTPServer(('127.0.0.1', port), Handler).serve_forever()

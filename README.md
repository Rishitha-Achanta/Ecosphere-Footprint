# Ecosphere

A twelve-question reflection using one labeled slider at a time, followed by an illustrated descent from the upper atmosphere to the seafloor. Gemini creates a tailored 50–150 word explanation in 1–3 sentences for each of the six layers, grounded in the choices relevant to that environment. Little Planet Life turns those same answers into a twelve-decision game with a starting impact score and optional Gemini hints.

Little Planet Life is available directly at http://localhost:8000/lifestyle.html. It lets the player choose one to four days, with three decisions in each day. A saved questionnaire check-in personalizes the game; without one, the game uses the questionnaire's sample responses. It has no Gemini hint feature and runs entirely through the local Python server.

## Run locally

Requires Python 3.9 or later; no packages or build step needed. Little Planet Life itself does not require Gemini or an internet connection. Start the local server with one of these commands:

Windows PowerShell:
```powershell
python server.py
```

macOS Terminal:
```bash
python3 server.py
```

Gemini is only needed for the tailored cascade reflections. To enable those, set a current key before starting the server:

Windows PowerShell:
```powershell
$env:GEMINI_API_KEY = "your-key"
python server.py
```

macOS Terminal:
```bash
GEMINI_API_KEY="your-key" python3 server.py
```

You can also put `GEMINI_API_KEY=your-rotated-key` in a local `.env` file in the project root; the server loads it, and Git ignores it. Create or replace keys in [Google AI Studio](https://aistudio.google.com/app/apikey); the website cannot issue keys. After changing `.env`, stop and restart `python server.py`.

Open http://localhost:8000. The server uses `gemini-3.8-flash` through Gemini's Interactions API by default, retries temporary network and quota errors, and tries `gemini-flash-latest` if the configured model is unavailable. Optionally set `GEMINI_MODEL` and `PORT` (default: `8000`). The API key stays on the server and is not sent to browser code. Do not commit API keys to the project.

Opening the HTML directly does not provide Gemini explanations; run the local server instead. Generated insights are cached in the browser for the submitted answers. Submitting the questionnaire again clears that cache.

The server sends the selected answer labels to Google Gemini and validates the returned six-layer JSON. Little Planet Life's score, scene order, choices, completion recap, and game session live in `server.py`; `lifestyle.js` only renders the state returned by Python. The game does not call Gemini, so it works without an API key or internet connection once the local server is running. The game page can be opened directly without first visiting the cascade or completing the questionnaire. No name or email is collected. The server binds to loopback and is intended for local development.

## Artwork

Original SVG scenery in `assets/` illustrates the atmospheric and ocean layers. The 0–50 reflection score uses ten resource-use responses; dishwashing and chemical-handling frequency are left unscored because efficiency and disposal details matter. It is not a scientific footprint measurement. Explanations describe qualitative connections, not calculated personal emissions.

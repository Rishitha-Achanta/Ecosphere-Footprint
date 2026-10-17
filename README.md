# Ecosphere

A twelve-question reflection using one labeled slider at a time, followed by an illustrated descent from the upper atmosphere to the seafloor. Gemini creates a tailored 50–150 word explanation in 1–3 sentences for each of the six layers, grounded in the choices relevant to that environment.

## Run locally

Requires Python 3.9 or later; no packages or build step needed. In PowerShell, set a current Gemini key in the server terminal, then start the server:

```powershell
$env:GEMINI_API_KEY = "your-rotated-key"
python server.py
```

You can also put `GEMINI_API_KEY=your-rotated-key` in a local `.env` file in the project root; the server loads it, and Git ignores it.

Open http://localhost:8000. The server uses `gemini-3.8-flash` through Gemini's Interactions API by default; optionally set `GEMINI_MODEL` and `PORT` (default: `8000`). The API key stays on the server and is not sent to browser code. Do not commit API keys to the project.

Opening the HTML directly does not provide Gemini explanations; run the local server instead. Generated insights are cached in the browser for the submitted answers. Submitting the questionnaire again clears that cache.

The server sends the selected answer labels to Google Gemini and validates the returned six-layer JSON. No name or email is collected. The server binds to loopback and is intended for local development.

## Artwork

Original SVG scenery in `assets/` illustrates the atmospheric and ocean layers. The 0–50 reflection score uses ten resource-use responses; dishwashing and chemical-handling frequency are left unscored because efficiency and disposal details matter. It is not a scientific footprint measurement. Explanations describe qualitative connections, not calculated personal emissions.

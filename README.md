# Ecosphere

A twelve-question reflection followed by an illustrated descent from the upper atmosphere to the seafloor. Gemini creates one or two sentences at each of the six layers using the complete set of selected answers.

## Run locally

Requires Python 3.9 or later; no packages or build step needed. Set `GEMINI_API_KEY` in your terminal environment, then run:

```sh
python server.py
```

Open http://localhost:8000. Optionally set `GEMINI_MODEL` (default: `gemini-2.5-flash`) and `PORT` (default: `8000`). The API key stays on the server and is not sent to browser code. Do not commit API keys to the project.

Opening the HTML directly does not provide Gemini explanations; run the local server instead. Generated insights are cached in the browser for the submitted answers. Submitting the questionnaire again clears that cache.

The server sends the selected answer labels to Google Gemini and validates the returned six-layer JSON. No name or email is collected. The server binds to loopback and is intended for local development.

## Artwork

Original SVG scenery in `assets/` illustrates the atmospheric and ocean layers. The score display counts the answers considered; it is not a scientific footprint measurement. Explanations describe qualitative connections, not calculated personal emissions.

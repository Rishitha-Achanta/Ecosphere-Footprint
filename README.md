# Ecosphere

A ten-question reflection followed by an illustrated descent from the upper atmosphere to the seafloor. Each layer includes a personal, one- or two-sentence explanation based on the selected choices.

## Run locally

Requires Python 3.9 or later; no packages or build step needed.

Set `GEMINI_API_KEY` in your terminal environment, then run:

```sh
python3 server.py
```

On Windows, `py server.py` also works. Open http://localhost:8000. The key is read only by the server and is never sent to browser code. Optionally set `GEMINI_MODEL` (default: `gemini-2.5-flash`) to an available model in your Google account, and `PORT` (default: 8000).

Without a key, the site still runs with answer-specific local explanations. Opening the HTML directly also works with local explanations; Gemini requires the Python server rather than Live Server. Successful Gemini results are cached in this browser for the current answers. Submitting the questionnaire again clears the cache.

The proxy uses Google's [structured output API](https://ai.google.dev/gemini-api/docs/generate-content/structured-output) and validates all answers and returned explanations. Selected answer labels are sent to Google Gemini; no name or email is collected. The local server binds to loopback and is intended for development, not public hosting.

## Scoring and artwork

The 0–30 score is a reflection tool, not a scientific footprint measurement. The explanations describe qualitative connections, not calculated personal emissions. Original SVG scenery in `assets/` takes inspiration from the supplied ocean illustration's colors and nature motifs, without using the image as a wallpaper.

## Checks

```sh
python3 -m unittest discover -s tests
```

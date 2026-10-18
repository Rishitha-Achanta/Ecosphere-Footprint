# Ecosphere

We would like to note that the GitHub repository was created on Thursday just to make sure that my(Samia) github works properly, and that the other(Mahidha, Annie, Rishita) github accounts work. No coding was done during this time. 

A twelve-question reflection using one labeled slider at a time, followed by an illustrated descent from the upper atmosphere to the seafloor. The questionnaire randomizes question order on each visit and preserves the slider answers. Gemini creates tailored explanations for each of the six layers and, when configured, fresh scenario-based scenes when a Little Planet Life game starts.

Little Planet Life is available directly at `http://127.0.0.1:<port>/lifestyle.html` using the port printed by the server. It lets the player choose one to four days, with three decisions in each day. A saved questionnaire check-in personalizes the game; without one, the game uses the questionnaire's sample responses.

## Run locally

Requires Python 3.9 or later; no packages or build step needed. The game is always playable without Gemini or an internet connection; without a Gemini key it uses built-in scenes. Start the local server with one of these commands:

Windows PowerShell:
```powershell
python server.py
```

macOS Terminal:
```bash
python3 server.py
```

Gemini is optional. It enables tailored cascade reflections and fresh Little Planet Life scenes. To enable these, set a current key before starting the server:

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

Open the exact `http://127.0.0.1:...` address printed by the server in Microsoft Edge. The default port is `8000`; if that port is already in use, the server selects a free port from `8001`–`8010` and prints the address to open. Do not open the HTML files directly or use an older server tab. The server uses `gemini-3.8-flash` through Gemini's Interactions API by default, retries temporary network and quota errors, and tries `gemini-flash-latest` if the configured model is unavailable. Optionally set `GEMINI_MODEL` and `PORT` (default: `8000`). The API key stays on the server and is not sent to browser code. Do not commit API keys to the project.

Opening the HTML directly does not connect it to the server; run the local server instead. Questionnaire questions remain the same and appear in a randomized order on each visit. Gemini generates game scenes when a new Little Planet Life story starts; the generated scene text does not change the game's fixed choices, scoring, or answer validation. If Gemini is unavailable, the game starts with built-in scenes and displays a fallback notice. Generated layer insights are cached in the browser for the submitted answers. Submitting the questionnaire again clears that cache.

The server sends selected answer labels to Google Gemini and validates the returned six-layer JSON and game-scene JSON. Little Planet Life's score, scene order, fixed choices, completion recap, and game session live in `server.py`; `lifestyle.js` only renders the state returned by Python. The game page can be opened directly without first visiting the cascade or completing the questionnaire; it uses sample answers in that case. Choose a one- to four-day story, with three decisions per day. The questionnaire includes a direct link back to the cascade. No name or email is collected. The server binds to loopback and is intended for local development.

## Artwork

Original SVG scenery in `assets/` illustrates the atmospheric and ocean layers. The 0–50 reflection score uses ten resource-use responses; dishwashing and chemical-handling frequency are left unscored because efficiency and disposal details matter. It is not a scientific footprint measurement. Explanations describe qualitative connections, not calculated personal emissions.

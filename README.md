# Cassie's Gym Coach

A personal, phone-first workout coach. One HTML file, no build step, installable on iPhone.

## Install on iPhone
1. Open the GitHub Pages link in **Safari**.
2. Tap **Share → Add to Home Screen**.
3. Open **Gym Coach** from the home screen, go to **My plan → Import backup**, and choose your latest backup file.

Do the import *inside the home-screen app*. It keeps its data separately from Safari.

## Your data
Everything is saved on the phone only. **My plan → Export backup** opens the share sheet. Choose **Save to Files** (iCloud Drive is a good spot). Export every week or two; the header reminds you after 14 days.

Backups are never committed to this repo.

## Development
```
python3 -m http.server
```
Then open http://localhost:8000. See `CLAUDE.md` for how everything works.

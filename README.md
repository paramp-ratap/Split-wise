# SplitWise Lite

A lightweight Splitwise-style web app to track group expenses, split bills, and view balances.

## Features
- Add/remove members.
- Add expenses with payer and participants.
- Automatic equal split calculation.
- Running balance per member.
- LocalStorage persistence.

## Run locally
```bash
python -m http.server 4173
```
Then open `http://localhost:4173`.

## Deploy (GitHub Pages)
This repo includes `.github/workflows/deploy.yml` that deploys the site to GitHub Pages whenever you push to `main`.

1. Push this repository to GitHub.
2. In GitHub repository settings, enable **Pages** and set source to **GitHub Actions**.
3. Push to `main` (or run the workflow manually).
4. Your app will be available at `https://<your-username>.github.io/<repo-name>/`.

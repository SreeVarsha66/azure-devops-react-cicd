# 💰 SplitMate

A React-based expense splitter app that helps you split bills with friends and roommates. Calculates minimum settlements between members using a greedy algorithm.

## Features

- Add and remove group members
- Log expenses with description, amount, payer, and split-among list
- Auto-calculates each person's balance (positive = owed money, negative = owes money)
- Smart settlement algorithm — minimum number of transactions to settle all debts
- Multiple currency support (₹, $, €)
- Browser localStorage — no backend needed
- Mobile-friendly responsive UI

## Tech Stack

- **Frontend:** React 18 + Vite
- **Styling:** Pure CSS with gradient theme
- **Container:** Multi-stage Dockerfile (Node build → Nginx serve, ~50MB final image)
- **Web Server:** Nginx (with SPA routing support)

## Cloud Architecture

- **Code Repository:** Azure Repos
- **CI/CD:** Azure DevOps YAML Pipeline
- **Image Registry:** Azure Container Registry (Basic tier)
- **Hosting:** Azure Web App for Containers (Linux B1)

## Pipeline Workflow

1. Developer commits code → pushes to feature branch
2. Pull request opened → Pipeline runs validation build
3. PR approved + merged to `main` → Pipeline auto-builds image
4. Image pushed to ACR with tag `$(Build.BuildId)` + `latest`
5. Pipeline deploys image to Azure Web App
6. App live at https://&lt;webapp-name&gt;.azurewebsites.net

## Local Development Setup (Optional)

If you have Node.js installed:

```bash
npm install
npm run dev
```

Open http://localhost:5173

If you have Docker installed:

```bash
docker build -t splitmate .
docker run -p 8080:80 splitmate
```

Open http://localhost:8080

## Project Structure

```
splitmate/
├── src/
│   ├── App.jsx          # Main component with all logic
│   ├── App.css          # Component styles
│   ├── main.jsx         # React entry point
│   └── index.css        # Global styles
├── index.html           # HTML template
├── package.json         # Dependencies
├── vite.config.js       # Vite configuration
├── Dockerfile           # Multi-stage container build
├── nginx.conf           # Nginx config (SPA routing)
├── azure-pipelines.yml  # CI/CD pipeline
└── .gitignore
```

## Branch Strategy

- `main` — production-ready code, auto-deploys to Azure Web App
- `develop` — integration branch, builds but doesn't deploy
- `feature/*` — short-lived branches for new work

## Branch Policies (main)

- Require 1 reviewer approval
- Require build validation pass
- Squash merge only
- Comment resolution required

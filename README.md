# MKN AI City

MKN AI City is a game-like command center for creating agents, testing online business ideas, controlling budgets, and expanding a simulated city as real results are recorded.

## Run locally

```bash
npm start
```

Open `http://localhost:4173`.

The city works in demo mode without paid APIs. To enable generated agent responses, set `OPENAI_API_KEY` in your environment. Never put the key in this repository or in frontend JavaScript.

## Deploy on Render

1. Push this folder to a GitHub repository.
2. In Render, create a new Blueprint and select the repository.
3. Render reads `render.yaml` and creates the web service.
4. The first deployment runs in free demo mode without an API key. Add `OPENAI_API_KEY` as a secret environment variable later when you want generated responses.
5. Open `/api/health` on the deployed URL to verify the server.

Free Render services may sleep while idle and take time to wake up. Local browser data is device-specific until a database and user accounts are added.

## Safety boundaries

- External publishing, outreach, spending, refunds, account changes, and wagering require owner approval.
- Etsy, Kalshi, and other account connections require official APIs and a secure backend OAuth flow.
- Do not commit account passwords, OAuth tokens, or API keys to GitHub.

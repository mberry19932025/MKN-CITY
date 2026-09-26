# MKN AI City

MKN AI City is a game-like command center for creating agents, testing online business ideas, controlling budgets, and expanding a simulated city as real results are recorded.

## Run locally

```bash
npm start
```

Open `http://localhost:4173`.

The city works in demo mode without paid APIs. To enable generated agent responses, set both `OPENAI_API_KEY` and `FOUNDER_ACCESS_CODE` in your environment. Never put either secret in this repository or in frontend JavaScript.

## Deploy on Render

1. Push this folder to a GitHub repository.
2. In Render, create a new Blueprint and select the repository.
3. Render reads `render.yaml` and creates the web service.
4. The first deployment runs in free demo mode without an API key.
5. When you want generated responses, add `OPENAI_API_KEY` and a long, unique `FOUNDER_ACCESS_CODE` as secret environment variables in Render.
6. Open `/api/health` on the deployed URL. `paidAiReady` is `true` only when both secrets are configured.

Before enabling billing, create a dedicated OpenAI project for MKN City and configure its spend limits and alerts. The server limits each generated answer to 400 output tokens, allows at most two simultaneous AI calls, throttles repeated requests, and never sends the OpenAI key to the browser.

Free Render services may sleep while idle and take time to wake up. Local browser data is device-specific until a database and user accounts are added.

## Safety boundaries

- External publishing, outreach, spending, refunds, account changes, and wagering require owner approval.
- Etsy, Kalshi, and other account connections require official APIs and a secure backend OAuth flow.
- Do not commit account passwords, OAuth tokens, or API keys to GitHub.

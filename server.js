const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { getPool, initializeDatabase, recordLedgerEvent, getEconomySummary, getBusinessMemories, recordBusinessMemory } = require('./database');

const port = Number(process.env.PORT || 4173);
const root = __dirname;
const buildId = String(process.env.RENDER_GIT_COMMIT || process.env.MKN_BUILD_ID || 'local').slice(0, 7);
const rateWindows = new Map();
let activeAiRequests = 0;
const RATE_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT = 20;
const MAX_CONCURRENT_AI_REQUESTS = 2;
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

function sendJson(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 50_000) request.destroy();
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

function secureEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ''));
  const rightBuffer = Buffer.from(String(right || ''));
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function clientAddress(request) {
  return String(request.headers['x-forwarded-for'] || request.socket.remoteAddress || 'unknown').split(',')[0].trim();
}

function consumeRateLimit(request) {
  const now = Date.now();
  const address = clientAddress(request);
  const record = rateWindows.get(address);
  if (!record || now - record.startedAt >= RATE_WINDOW_MS) {
    rateWindows.set(address, { startedAt: now, count: 1 });
    return true;
  }
  record.count += 1;
  return record.count <= RATE_LIMIT;
}

function founderAuthorized(request) {
  return Boolean(process.env.FOUNDER_ACCESS_CODE) && secureEqual(request.headers['x-mkn-access-code'], process.env.FOUNDER_ACCESS_CODE);
}

function cleanText(value, maxLength = 200) {
  return String(value || '').trim().slice(0, maxLength);
}

async function handleEconomy(request, response) {
  if (!founderAuthorized(request)) return sendJson(response, 401, { error: 'Founder access code required.' });
  const summary = await getEconomySummary();
  if (!summary) return sendJson(response, 200, { mode: 'demo', verified: false, message: 'Connect DATABASE_URL to enable the verified ledger.' });
  return sendJson(response, 200, { mode: 'database', verified: true, ...summary });
}

async function handleLedgerWebhook(request, response) {
  if (!process.env.LEDGER_WEBHOOK_SECRET) return sendJson(response, 503, { error: 'Ledger webhook is not configured.' });
  if (!secureEqual(request.headers['x-mkn-webhook-secret'], process.env.LEDGER_WEBHOOK_SECRET)) {
    return sendJson(response, 401, { error: 'Invalid webhook signature.' });
  }
  const payload = JSON.parse(await readBody(request));
  const event = {
    provider: cleanText(payload.provider, 40).toLowerCase(),
    providerEventId: cleanText(payload.providerEventId, 160),
    externalAccountId: cleanText(payload.externalAccountId, 160),
    businessId: cleanText(payload.businessId, 100),
    direction: cleanText(payload.direction, 20).toLowerCase(),
    status: cleanText(payload.status, 20).toLowerCase(),
    amountCents: Number(payload.amountCents),
    currency: cleanText(payload.currency || 'USD', 3).toUpperCase(),
    description: cleanText(payload.description, 300),
    occurredAt: new Date(payload.occurredAt),
    rawReference: { source: cleanText(payload.source, 100) }
  };
  const valid = event.provider && event.providerEventId && event.description
    && ['revenue', 'expense'].includes(event.direction)
    && ['pending', 'verified', 'reversed'].includes(event.status)
    && Number.isSafeInteger(event.amountCents) && event.amountCents > 0
    && /^[A-Z]{3}$/.test(event.currency) && !Number.isNaN(event.occurredAt.getTime());
  if (!valid) return sendJson(response, 400, { error: 'Invalid ledger event.' });
  const result = await recordLedgerEvent(event);
  return sendJson(response, result.inserted ? 201 : 200, { accepted: true, duplicate: !result.inserted, ledgerId: result.id });
}

async function handleMemories(request, response, pathname) {
  if (!founderAuthorized(request)) return sendJson(response, 401, { error: 'Founder access code required.' });
  if (!getPool()) return sendJson(response, 200, { mode: 'demo', memories: [] });
  if (request.method === 'GET') {
    const businessType = pathname.split('/').pop();
    return sendJson(response, 200, { mode: 'database', memories: await getBusinessMemories(businessType) });
  }
  const payload = JSON.parse(await readBody(request));
  const memory = {
    businessType: cleanText(payload.businessType, 40),
    title: cleanText(payload.title, 140),
    lesson: cleanText(payload.lesson, 1000),
    outcome: cleanText(payload.outcome, 10),
    evidenceCount: Number(payload.evidenceCount),
    confidence: Number(payload.confidence),
    status: cleanText(payload.status || 'candidate', 20),
    sourceTaskId: cleanText(payload.sourceTaskId, 100)
  };
  const valid = ['etsy', 'pod', 'fiverr_thumbnails'].includes(memory.businessType)
    && memory.title && memory.lesson && ['win', 'loss', 'mixed'].includes(memory.outcome)
    && Number.isInteger(memory.evidenceCount) && memory.evidenceCount > 0
    && Number.isFinite(memory.confidence) && memory.confidence >= 0 && memory.confidence <= 100
    && ['candidate', 'validated', 'retired'].includes(memory.status);
  if (!valid) return sendJson(response, 400, { error: 'Invalid business memory.' });
  return sendJson(response, 201, { recorded: true, ...(await recordBusinessMemory(memory)) });
}

function demoReply(message) {
  const normalized = message.toLowerCase();
  if (normalized.includes('maya')) return 'Maya: I am reviewing trend evidence and will stop once confidence is sufficient. My next report will separate facts from assumptions.';
  if (normalized.includes('approval')) return 'Director: The approval desk contains funding, staffing, and validation decisions. No external action happens without your confirmation.';
  if (normalized.includes('money') || normalized.includes('treasury')) return 'Treasurer: City cash is $168.20. The $100 emergency reserve remains locked.';
  return 'Director: Demo mode is active. I recorded your command locally. Add OPENAI_API_KEY on Render when you are ready for generated agent responses.';
}

async function handleCommand(request, response) {
  try {
    if (!consumeRateLimit(request)) return sendJson(response, 429, { error: 'Too many commands. Wait a few minutes and try again.' });
    const payload = JSON.parse(await readBody(request));
    const message = String(payload.message || '').trim().slice(0, 2000);
    if (!message) return sendJson(response, 400, { error: 'A command is required.' });
    if (!process.env.OPENAI_API_KEY) return sendJson(response, 200, { reply: demoReply(message), mode: 'demo' });
    if (!process.env.FOUNDER_ACCESS_CODE) return sendJson(response, 503, { error: 'Paid AI is locked until FOUNDER_ACCESS_CODE is configured.' });
    if (!founderAuthorized(request)) {
      return sendJson(response, 401, { error: 'Founder access code required.' });
    }
    if (activeAiRequests >= MAX_CONCURRENT_AI_REQUESTS) return sendJson(response, 429, { error: 'The Director is busy. Try again shortly.' });
    const needsWebResearch = /\b(research|trend|current|today|latest|competitor|market demand|source|verify)\b/i.test(message);

    activeAiRequests += 1;
    let apiResponse;
    try {
      apiResponse = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        signal: AbortSignal.timeout(30_000),
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: needsWebResearch ? (process.env.OPENAI_RESEARCH_MODEL || 'gpt-5.5') : (process.env.OPENAI_MODEL || 'gpt-5-mini'),
          max_output_tokens: 400,
          store: false,
          ...(needsWebResearch ? { tools: [{ type: 'web_search' }], tool_choice: 'auto', include: ['web_search_call.action.sources'] } : {}),
          input: [
            { role: 'developer', content: 'You are the Chief Director of MKN AI City. Respond concisely as an in-world business operations agent. Enforce one agent, one primary task: each worker studies and improves only within its assigned specialty, and unrelated work must be handed to the correct specialist or manager. When web search is available, cite dated sources and clearly separate observed facts, estimates, and recommendations. Before Etsy, print-on-demand, or Fiverr thumbnail work, retrieve the matching business memories and distinguish candidate lessons from validated playbooks. After a measured outcome, preserve both wins and failures with evidence, cost, date, and confidence; never turn an unverified claim into company memory. Sports analysis must use timestamped same-day sources, distinguish model probability from sportsbook implied probability, disclose uncertainty and correlation, and never fabricate odds, injuries, results, expected value, or guaranteed picks. Never claim an external action occurred unless the user confirms it. Never request or expose passwords, API keys, card data, or banking credentials. Spending, publishing, outreach, wagering, refunds, deposits, withdrawals, and account changes require Founder Michh approval. For government contracting, never fabricate eligibility, certifications, past performance, pricing evidence, registrations, or solicitation requirements. Agents may research and draft, but Michh must verify facts, approve bids, sign certifications, and submit through the official portal.' },
            { role: 'user', content: message }
          ]
        })
      });
    } finally {
      activeAiRequests -= 1;
    }

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('OpenAI request failed:', apiResponse.status, errorText.slice(0, 500));
      return sendJson(response, 200, { reply: `${demoReply(message)} Paid AI is temporarily unavailable.`, mode: 'demo-fallback' });
    }

    const data = await apiResponse.json();
    const outputContent = (data.output || [])
      .flatMap((item) => item.content || [])
      .filter((item) => item.type === 'output_text');
    const reply = outputContent.map((item) => item.text).join('\n').trim();
    const sources = [...new Map(outputContent.flatMap((item) => item.annotations || [])
      .filter((annotation) => annotation.type === 'url_citation' && annotation.url)
      .map((annotation) => [annotation.url, { title: annotation.title || annotation.url, url: annotation.url }])).values()].slice(0, 6);
    return sendJson(response, 200, {
      reply: reply || demoReply(message),
      sources,
      mode: needsWebResearch ? 'openai-live-research' : 'openai',
      usage: {
        inputTokens: data.usage?.input_tokens || 0,
        outputTokens: data.usage?.output_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      }
    });
  } catch (error) {
    console.error(error);
    return sendJson(response, 400, { error: 'The command could not be processed.' });
  }
}

const server = http.createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  if (request.method === 'POST' && pathname === '/api/command') return handleCommand(request, response);
  if (request.method === 'GET' && pathname === '/api/economy') return handleEconomy(request, response).catch((error) => {
    console.error('Economy API failed:', error);
    return sendJson(response, 500, { error: 'Verified economy data is unavailable.' });
  });
  if (request.method === 'POST' && pathname === '/api/webhooks/ledger') return handleLedgerWebhook(request, response).catch((error) => {
    console.error('Ledger webhook failed:', error);
    return sendJson(response, 500, { error: 'Ledger event could not be recorded.' });
  });
  if ((request.method === 'GET' && pathname.startsWith('/api/memories/')) || (request.method === 'POST' && pathname === '/api/memories')) {
    return handleMemories(request, response, pathname).catch((error) => {
      console.error('Memory API failed:', error);
      return sendJson(response, 500, { error: 'Business memory could not be processed.' });
    });
  }
  if (request.method === 'GET' && pathname === '/api/health') return sendJson(response, 200, {
    status: 'ok',
    build: buildId,
    openai: Boolean(process.env.OPENAI_API_KEY),
    paidAiReady: Boolean(process.env.OPENAI_API_KEY && process.env.FOUNDER_ACCESS_CODE),
    sportsDataReady: Boolean(process.env.SPORTS_DATA_API_KEY),
    verifiedLedgerReady: Boolean(getPool() && process.env.LEDGER_WEBHOOK_SECRET)
  });
  if (request.method !== 'GET' && request.method !== 'HEAD') return sendJson(response, 405, { error: 'Method not allowed.' });

  const requestPath = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.resolve(root, `.${requestPath}`);
  if (!(filePath === root || filePath.startsWith(`${root}${path.sep}`)) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return response.end('Not found');
  }
  response.writeHead(200, {
    'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream',
    'Cache-Control': ['.html', '.js', '.css'].includes(path.extname(filePath)) ? 'no-store, max-age=0' : 'public, max-age=86400'
  });
  if (request.method === 'HEAD') return response.end();
  fs.createReadStream(filePath).pipe(response);
});

initializeDatabase()
  .then((connected) => {
    if (connected) console.log('Verified ledger database connected.');
    server.listen(port, '0.0.0.0', () => console.log(`MKN AI City running on port ${port}`));
  })
  .catch((error) => {
    console.error('Database initialization failed:', error.message);
    server.listen(port, '0.0.0.0', () => console.log(`MKN AI City running without database on port ${port}`));
  });

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const port = Number(process.env.PORT || 4173);
const root = __dirname;
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
    if (!secureEqual(request.headers['x-mkn-access-code'], process.env.FOUNDER_ACCESS_CODE)) {
      return sendJson(response, 401, { error: 'Founder access code required.' });
    }
    if (activeAiRequests >= MAX_CONCURRENT_AI_REQUESTS) return sendJson(response, 429, { error: 'The Director is busy. Try again shortly.' });

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
          model: process.env.OPENAI_MODEL || 'gpt-5-mini',
          max_output_tokens: 400,
          store: false,
          input: [
            { role: 'developer', content: 'You are the Chief Director of MKN AI City. Respond concisely as an in-world business operations agent. Never claim an external action occurred unless the user confirms it. Never request or expose passwords, API keys, card data, or banking credentials. Spending, publishing, outreach, wagering, refunds, deposits, withdrawals, and account changes require Founder Michh approval.' },
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
      return sendJson(response, 502, { error: 'The city AI could not respond. Demo commands still work.' });
    }

    const data = await apiResponse.json();
    const reply = (data.output || [])
      .flatMap((item) => item.content || [])
      .filter((item) => item.type === 'output_text')
      .map((item) => item.text)
      .join('\n')
      .trim();
    return sendJson(response, 200, {
      reply: reply || demoReply(message),
      mode: 'openai',
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
  if (request.method === 'POST' && request.url === '/api/command') return handleCommand(request, response);
  if (request.method === 'GET' && request.url === '/api/health') return sendJson(response, 200, {
    status: 'ok',
    openai: Boolean(process.env.OPENAI_API_KEY),
    paidAiReady: Boolean(process.env.OPENAI_API_KEY && process.env.FOUNDER_ACCESS_CODE)
  });
  if (request.method !== 'GET' && request.method !== 'HEAD') return sendJson(response, 405, { error: 'Method not allowed.' });

  const requestPath = request.url === '/' ? '/index.html' : request.url.split('?')[0];
  const filePath = path.resolve(root, `.${requestPath}`);
  if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return response.end('Not found');
  }
  response.writeHead(200, { 'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream' });
  if (request.method === 'HEAD') return response.end();
  fs.createReadStream(filePath).pipe(response);
});

server.listen(port, '0.0.0.0', () => console.log(`MKN AI City running on port ${port}`));

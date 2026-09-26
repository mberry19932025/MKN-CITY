const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const port = Number(process.env.PORT || 4173);
const root = __dirname;
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

function demoReply(message) {
  const normalized = message.toLowerCase();
  if (normalized.includes('maya')) return 'Maya: I am reviewing trend evidence and will stop once confidence is sufficient. My next report will separate facts from assumptions.';
  if (normalized.includes('approval')) return 'Director: The approval desk contains funding, staffing, and validation decisions. No external action happens without your confirmation.';
  if (normalized.includes('money') || normalized.includes('treasury')) return 'Treasurer: City cash is $168.20. The $100 emergency reserve remains locked.';
  return 'Director: Demo mode is active. I recorded your command locally. Add OPENAI_API_KEY on Render when you are ready for generated agent responses.';
}

async function handleCommand(request, response) {
  try {
    const payload = JSON.parse(await readBody(request));
    const message = String(payload.message || '').trim().slice(0, 2000);
    if (!message) return sendJson(response, 400, { error: 'A command is required.' });
    if (!process.env.OPENAI_API_KEY) return sendJson(response, 200, { reply: demoReply(message), mode: 'demo' });

    const apiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-5-mini',
        input: [
          { role: 'developer', content: 'You are the Chief Director of MKN AI City. Respond concisely as an in-world business operations agent. Never claim an external action occurred unless the user confirms it. Spending, publishing, outreach, wagering, refunds, and account changes require Founder Michh approval.' },
          { role: 'user', content: message }
        ]
      })
    });

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
    return sendJson(response, 200, { reply: reply || demoReply(message), mode: 'openai' });
  } catch (error) {
    console.error(error);
    return sendJson(response, 400, { error: 'The command could not be processed.' });
  }
}

const server = http.createServer(async (request, response) => {
  if (request.method === 'POST' && request.url === '/api/command') return handleCommand(request, response);
  if (request.method === 'GET' && request.url === '/api/health') return sendJson(response, 200, { status: 'ok', openai: Boolean(process.env.OPENAI_API_KEY) });
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

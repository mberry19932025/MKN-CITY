const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');

const port = 43173;
const base = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, ['server.js'], {
  cwd: __dirname,
  env: { ...process.env, PORT: String(port), DATABASE_URL: '', OPENAI_API_KEY: '', FOUNDER_ACCESS_CODE: '' },
  stdio: ['ignore', 'pipe', 'pipe']
});

async function waitForServer() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${base}/api/health?smoke=1`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Server did not become ready.');
}

async function run() {
  await waitForServer();

  const health = await fetch(`${base}/api/health?smoke=1`);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).status, 'ok');

  const home = await fetch(`${base}/?smoke=1`);
  assert.equal(home.status, 200);
  const homeMarkup = await home.text();
  assert.match(homeMarkup, /MKN AI City/);
  assert.match(homeMarkup, /id="opportunity-0142-approve"/);
  assert.match(homeMarkup, /id="staffing-approve"/);
  assert.match(homeMarkup, /id="property-approval-slot"/);
  assert.match(homeMarkup, /data-view="analytics"/);
  assert.match(homeMarkup, /id="creative"/);
  assert.match(homeMarkup, /id="factories"/);
  assert.match(homeMarkup, /id="jobs"/);
  assert.match(homeMarkup, /id="job-approval-slot"/);
  assert.match(homeMarkup, /data-approval-action="opportunity-approved"/);
  assert.match(homeMarkup, /id="certification-grid"/);
  assert.match(homeMarkup, /id="run-enforcer-audit"/);
  assert.match(home.headers.get('cache-control'), /no-store/);

  const app = await fetch(`${base}/app.js?smoke=1`);
  assert.equal(app.status, 200);
  const appSource = await app.text();
  assert.match(appSource, /setCityFocus/);
  assert.match(appSource, /replaceControlledWork/);
  assert.match(appSource, /advanceAutonomousWork/);
  assert.match(appSource, /renderPropertyApproval/);
  assert.match(appSource, /createFactoryJob/);
  assert.match(appSource, /advanceCityJob/);
  assert.match(appSource, /recordCityEvent/);
  assert.match(appSource, /recoverCityJob/);
  assert.match(appSource, /data-approval-action/);
  assert.match(appSource, /mkn-agent-records/);
  assert.match(appSource, /awardAgentXp/);
  assert.match(appSource, /City Enforcer/);

  const css = await fetch(`${base}/styles.css?smoke=1`);
  assert.equal(css.status, 200);
  assert.match(await css.text(), /\[hidden\]\s*\{\s*display:\s*none\s*!important/);

  const command = await fetch(`${base}/api/command?smoke=1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'talk to Maya' })
  });
  assert.equal(command.status, 200);
  assert.equal((await command.json()).mode, 'demo');

  const missing = await fetch(`${base}/not-a-real-file`);
  assert.equal(missing.status, 404);

  console.log('MKN City smoke tests passed.');
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => child.kill('SIGTERM'));

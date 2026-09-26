const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.view');

function refreshIcons() {
  if (window.lucide?.createIcons) window.lucide.createIcons();
}

async function checkSystemHealth() {
  const status = document.querySelector('#system-status');
  const label = status.querySelector('b');
  try {
    const response = await fetch('/api/health', { cache: 'no-store' });
    if (!response.ok) throw new Error('Health check failed');
    const health = await response.json();
    label.textContent = health.paidAiReady ? 'Paid AI ready' : 'Demo AI ready';
    document.querySelector('#build-status').textContent = `Build ${health.build || 'unknown'}`;
    status.classList.toggle('demo-mode', !health.paidAiReady);
  } catch {
    label.textContent = 'City offline';
    document.querySelector('#build-status').textContent = 'Navigation only';
    status.classList.add('offline-mode');
  }
}

checkSystemHealth();

async function refreshSportsResearch() {
  const status = document.querySelector('#sports-feed-status');
  const proposal = document.querySelector('#parlay-proposal');
  status.innerHTML = '<i></i> Checking data feed';
  try {
    const response = await fetch('/api/health', { cache: 'no-store' });
    const health = await response.json();
    if (!health.sportsDataReady) {
      status.innerHTML = '<i></i> Demo · no live feed';
      proposal.className = 'parlay-proposal-empty';
      proposal.innerHTML = '<i data-lucide="circle-alert"></i><div><strong>No verified same-day proposal</strong><p>SPORTS_DATA_API_KEY is not configured. No current games, injuries, prices, or EV claims were generated.</p></div>';
      refreshIcons();
      return showToast('Sports research is in demo mode. No live proposal was created.');
    }
    status.innerHTML = '<i></i> Feed connected';
    proposal.innerHTML = '<i data-lucide="scan-search"></i><div><strong>Feed ready for an approved research job</strong><p>A production worker is still required to collect, timestamp, compare, and review same-day data.</p></div>';
    refreshIcons();
  } catch {
    status.innerHTML = '<i></i> Feed unavailable';
    showToast('The sports data feed could not be reached.');
  }
}

function openView(viewId) {
  if (viewId !== 'city' && document.body.classList.contains('city-focus-mode')) setCityFocus(false);
  views.forEach((view) => view.classList.toggle('active', view.id === viewId));
  navItems.forEach((item) => {
    const active = item.dataset.view === viewId;
    item.classList.toggle('active', active);
    item.setAttribute('aria-current', active ? 'page' : 'false');
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

navItems.forEach((item) => {
  item.addEventListener('click', () => openView(item.dataset.view));
});

document.querySelectorAll('[data-open-view]').forEach((button) => {
  button.addEventListener('click', () => openView(button.dataset.openView));
});

function getCampaignState() {
  try { return JSON.parse(localStorage.getItem('mkn-revenue-campaign') || '{"engine":"service","step":0}'); }
  catch { return { engine: 'service', step: 0 }; }
}

function renderCampaignState() {
  const state = getCampaignState();
  const engines = ['service', 'product', 'contracts'];
  document.querySelectorAll('[data-campaign]').forEach((button, index) => button.closest('.revenue-engine').classList.toggle('active-engine', engines[index] === state.engine));
  document.querySelectorAll('.campaign-missions li').forEach((mission, index) => {
    mission.classList.toggle('current', index === state.step);
    mission.classList.toggle('complete-goal', index < state.step);
  });
  document.querySelector('#campaign-rank').textContent = state.step >= 5 ? 'Rank 3 · Growth Operator' : state.step >= 2 ? 'Rank 2 · Market Tester' : 'Rank 1 · Offer Builder';
}

document.querySelectorAll('[data-campaign]').forEach((button) => button.addEventListener('click', () => {
  const state = getCampaignState();
  state.engine = button.dataset.campaign;
  state.step = Math.max(state.step, button.dataset.campaign === 'service' ? 1 : state.step);
  localStorage.setItem('mkn-revenue-campaign', JSON.stringify(state));
  renderCampaignState();
  openView('businesses');
  showToast(button.dataset.campaign === 'service' ? 'Service sprint activated. Build the offer and samples before publishing.'
    : button.dataset.campaign === 'product' ? 'Digital Product Lab opened for a controlled product test.'
    : 'Government readiness mission opened. Eligibility and submissions remain human-verified.');
}));
renderCampaignState();

const gameToast = document.querySelector('#game-toast');
let toastTimer;

const decisionKeys = ['mkn-staffing-decision', 'mkn-opportunity-0142-decision', 'mkn-validation-decision'];

function updateApprovalCount() {
  const waiting = decisionKeys.filter((key) => !localStorage.getItem(key)).length;
  document.querySelector('#founder-approval-count').textContent = waiting;
  document.querySelector('#nav-approval-count').textContent = waiting;
  document.querySelector('#approval-summary').textContent = waiting ? `${waiting} ${waiting === 1 ? 'decision' : 'decisions'} waiting` : 'All decisions reviewed';
  document.querySelector('.notification-dot').hidden = waiting === 0;
}

const autopilotMode = document.querySelector('#autopilot-mode');
const savedAutopilotMode = localStorage.getItem('mkn-autopilot-mode') || 'guarded';
autopilotMode.value = savedAutopilotMode;
autopilotMode.addEventListener('change', () => {
  localStorage.setItem('mkn-autopilot-mode', autopilotMode.value);
  showToast(`Big Boss autopilot set to ${autopilotMode.options[autopilotMode.selectedIndex].text}.`);
});

document.querySelector('#run-policy-review').addEventListener('click', () => {
  const result = document.querySelector('#policy-result');
  if (autopilotMode.value === 'manual') {
    result.textContent = 'Manual mode · no automatic decisions';
    return showToast('Manual mode leaves every decision with Michh.');
  }
  if (autopilotMode.value === 'observe') {
    result.textContent = 'Observed · 1 deny recommendation, 2 escalations';
    return showToast('Review complete. No decisions changed in Observe mode.');
  }
  if (!localStorage.getItem('mkn-opportunity-0142-decision')) resolveOpportunity0142('declined');
  result.textContent = '1 internal task approved · 1 weak test denied · 2 escalated';
  showToast('Guarded review complete. Spending and hiring remain with Michh.');
});

function showToast(message) {
  clearTimeout(toastTimer);
  gameToast.textContent = message;
  gameToast.classList.add('show');
  toastTimer = setTimeout(() => gameToast.classList.remove('show'), 3200);
}

const officeDialog = document.querySelector('#office-dialog');
const officeTitle = document.querySelector('#office-title');
const officeDistrict = document.querySelector('#office-district');
const officeDescription = document.querySelector('#office-description');
const officeFloor = document.querySelector('#office-floor');
const officeShift = document.querySelector('#office-shift');
const founderDeck = document.querySelector('.game-command-deck');
const founderCard = document.querySelector('.founder-command-card');
if (founderDeck && founderCard) founderCard.after(founderDeck);
const demoSeasonPanel = document.querySelector('#demo-season');
if (founderDeck && demoSeasonPanel) founderDeck.after(demoSeasonPanel);
const enterCityFocus = document.querySelector('#enter-city-focus');
const exitCityFocus = document.querySelector('#exit-city-focus');

function setCityFocus(active) {
  document.body.classList.toggle('city-focus-mode', active);
  enterCityFocus.setAttribute('aria-pressed', String(active));
  if (active) founderDeck.scrollIntoView({ block: 'start' });
}

enterCityFocus.addEventListener('click', () => setCityFocus(true));
exitCityFocus.addEventListener('click', () => setCityFocus(false));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && document.body.classList.contains('city-focus-mode')) setCityFocus(false);
});

const demoDayPlans = [
  { work: 'Research team mapped thumbnail demand and verified five sources.', tasks: 3, revenue: 0, expenses: 1.85, lesson: 'Buyer pain points repeat around weak branding and slow delivery.' },
  { work: 'Creative team produced three original thumbnail concepts from the research brief.', tasks: 4, revenue: 0, expenses: 3.2, lesson: 'A consistent visual system tested stronger than unrelated samples.' },
  { work: 'Commerce prepared a Fiverr gig draft and Etsy listing test for Founder review.', tasks: 3, revenue: 0, expenses: 2.1, lesson: 'Complete pricing and fees before publishing any offer.' },
  { work: 'Demo thumbnail order completed after QA and owner approval.', tasks: 5, revenue: 35, expenses: 8.4, lesson: 'Fast delivery and a focused brief reduced simulated revision time.' },
  { work: 'POD test spent its cap but produced no demo sale.', tasks: 3, revenue: 0, expenses: 12, lesson: 'Preserve the design engagement data; do not scale the supplier setup.' },
  { work: 'Thumbnail package generated a second simulated client outcome.', tasks: 5, revenue: 65, expenses: 14.75, lesson: 'Package pricing outperformed a single-image offer in this simulation.' },
  { work: 'Director consolidated the week while the contracting team completed a fictional bid/no-bid training drill.', tasks: 4, revenue: 90, expenses: 19.5, lesson: 'Scale the thumbnail service cautiously; government drafts require a real notice and verified capabilities.' }
];

const founderEdition = true;
const systemAuditChecks = [
  { id: 'navigation', label: 'Navigation and district routing', test: () => Boolean(document.querySelector('[data-open-view="agents"]') && document.querySelector('[data-office="research"]')) },
  { id: 'memory', label: 'Agent and city memory storage', test: () => { localStorage.setItem('mkn-audit-memory', 'ready'); return localStorage.getItem('mkn-audit-memory') === 'ready'; } },
  { id: 'builder', label: 'Room, hallway, and city builder', test: () => Boolean(document.querySelector('#toggle-build-mode') && document.querySelector('[data-build-tool="wall"]')) },
  { id: 'workforce', label: 'Agent creation and hiring tools', test: () => Boolean(document.querySelector('[data-open-view="agents"]') && Object.values(officeData).some((office) => office.agents.length > 0)) },
  { id: 'orders', label: 'Customer orders and profit ledger', test: () => Boolean(document.querySelector('#customer-ledger') || document.querySelector('[data-open-view="businesses"]')) },
  { id: 'treasury', label: 'Treasury limits and growth plan', test: () => { const plan = getGrowthPlan(); return plan.reserve + plan.activeCapital <= plan.capital && plan.experimentCap <= plan.activeCapital; } },
  { id: 'contracts', label: 'Government bid intake and safeguards', test: () => Boolean(document.querySelector('#bid-intake-form') && document.querySelector('#bid-notice') && document.querySelector('#bid-capability')) },
  { id: 'ai', label: 'OpenAI command and live research route', external: true }
];

function renderSystemsAudit(results = []) {
  const resultMap = new Map(results.map((result) => [result.id, result]));
  const passed = results.filter((result) => result.status === 'pass').length;
  const setup = results.filter((result) => result.status === 'setup').length;
  document.querySelector('#systems-audit-score').textContent = results.length ? `${passed}/${systemAuditChecks.length} ready${setup ? ` · ${setup} setup` : ''}` : 'Not run';
  document.querySelector('#systems-audit-results').innerHTML = systemAuditChecks.map((check) => {
    const result = resultMap.get(check.id) || { status: 'pending', detail: 'Waiting to test' };
    const icon = result.status === 'pass' ? 'check' : result.status === 'setup' ? 'key-round' : result.status === 'fail' ? 'x' : 'clock-3';
    return `<article class="audit-${result.status}"><i data-lucide="${icon}"></i><div><strong>${safeDemoText(check.label)}</strong><span>${safeDemoText(result.detail)}</span></div></article>`;
  }).join('');
  refreshIcons();
}

async function runSystemsAudit({ quiet = false } = {}) {
  const results = systemAuditChecks.filter((check) => !check.external).map((check) => {
    try {
      const passed = check.test();
      return { id: check.id, status: passed ? 'pass' : 'fail', detail: passed ? 'Local tool passed' : 'Tool control missing' };
    }
    catch { return { id: check.id, status: 'fail', detail: 'Local check failed' }; }
  });
  try {
    const response = await fetch('/api/health', { headers: { Accept: 'application/json' } });
    const health = response.ok ? await response.json() : {};
    results.push({ id: 'ai', status: health.openai ? 'pass' : 'setup', detail: health.openai ? 'Live AI route connected' : 'Route ready · OpenAI key required' });
  } catch {
    results.push({ id: 'ai', status: 'setup', detail: 'Backend unavailable in this preview' });
  }
  localStorage.setItem('mkn-systems-audit', JSON.stringify({ checkedAt: new Date().toISOString(), results }));
  renderSystemsAudit(results);
  if (!quiet) showToast(`${results.filter((result) => result.status === 'pass').length} city systems passed. External setup is labeled separately.`);
  return results;
}

function getDemoSeason() {
  try { return JSON.parse(localStorage.getItem('mkn-demo-season') || '{"day":0,"records":[]}'); }
  catch { return { day: 0, records: [] }; }
}

const defaultGrowthPlan = { capital: 200, reserve: 100, activeCapital: 40, experimentCap: 20, revenueGoal: 300, reinvest: 25 };
function getGrowthPlan() {
  try { return { ...defaultGrowthPlan, ...JSON.parse(localStorage.getItem('mkn-growth-plan') || '{}') }; }
  catch { return defaultGrowthPlan; }
}

function formatPlanMoney(value) {
  return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function renderGrowthPlan(totals = { revenue: 0, expenses: 0 }) {
  const plan = getGrowthPlan();
  const net = totals.revenue - totals.expenses;
  const progress = Math.max(0, Math.min(100, (totals.revenue / plan.revenueGoal) * 100));
  document.querySelector('#founder-reserve').textContent = formatPlanMoney(plan.reserve);
  document.querySelector('#command-city-cash').textContent = formatPlanMoney(plan.capital);
  document.querySelector('#command-city-profit').textContent = `${net < 0 ? '-' : ''}$${Math.abs(net).toFixed(2)}`;
  document.querySelector('#mission-starting-capital').textContent = formatPlanMoney(plan.capital);
  document.querySelector('#mission-active-capital').textContent = formatPlanMoney(plan.activeCapital);
  document.querySelector('#mission-protected-reserve').textContent = formatPlanMoney(plan.reserve);
  document.querySelector('#mission-exposed-capital').textContent = formatPlanMoney(plan.activeCapital);
  document.querySelector('#mission-revenue-target').textContent = `${formatPlanMoney(plan.revenueGoal)}+`;
  document.querySelector('#mission-progress-fill').style.width = `${progress}%`;
  document.querySelector('#mission-progress-copy').textContent = `${formatPlanMoney(totals.revenue)} of ${formatPlanMoney(plan.revenueGoal)} demo revenue · ${formatPlanMoney(Math.max(0, plan.revenueGoal - totals.revenue))} remaining`;
  document.querySelector('#mission-status').textContent = progress >= 100 ? 'Target reached' : net > 0 ? 'Positive · validating' : 'Validating';
  document.querySelector('#mission-net-goal').textContent = `Reach ${formatPlanMoney(plan.revenueGoal)} revenue with positive unit economics`;
  document.querySelector('#mission-net-progress').textContent = `${formatPlanMoney(net)} demo net · ${progress.toFixed(1)}% of revenue target`;
  document.querySelector('#treasury-city-cash').textContent = formatPlanMoney(plan.capital);
  document.querySelector('#treasury-city-cash-copy').textContent = `${formatPlanMoney(plan.capital)} starting capital · ${formatPlanMoney(plan.reserve)} protected · demo results separate`;
  document.querySelector('#growth-active-capital').textContent = formatPlanMoney(plan.activeCapital);
  document.querySelector('#growth-revenue-target').textContent = `${formatPlanMoney(plan.revenueGoal)}+`;
  document.querySelector('#growth-reinvest-rate').textContent = `${plan.reinvest}%`;
  document.querySelector('#growth-target-percent').textContent = `${progress.toFixed(1)}% of revenue goal`;
  document.querySelector('#growth-progress-fill').style.width = `${progress}%`;
  document.querySelector('#growth-recorded').textContent = `${formatPlanMoney(totals.revenue)} demo revenue recorded`;
  document.querySelector('#growth-remaining').textContent = `${formatPlanMoney(Math.max(0, plan.revenueGoal - totals.revenue))} remaining`;
}

function safeDemoText(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

function renderDemoSeason() {
  const season = getDemoSeason();
  const totals = season.records.reduce((sum, record) => ({ tasks: sum.tasks + record.tasks, revenue: sum.revenue + record.revenue, expenses: sum.expenses + record.expenses }), { tasks: 0, revenue: 0, expenses: 0 });
  const net = totals.revenue - totals.expenses;
  const health = Math.max(0, Math.min(100, Math.round(50 + (net / 4) + (totals.tasks * .35))));
  document.querySelector('#season-day').textContent = `${season.day} / 7`;
  document.querySelector('#season-tasks').textContent = totals.tasks;
  document.querySelector('#season-revenue').textContent = `$${totals.revenue.toFixed(2)}`;
  document.querySelector('#season-expenses').textContent = `$${totals.expenses.toFixed(2)}`;
  document.querySelector('#season-net').textContent = `${net < 0 ? '-' : ''}$${Math.abs(net).toFixed(2)}`;
  document.querySelector('#season-health').textContent = health;
  document.querySelector('#season-health-fill').style.width = `${health}%`;
  renderGrowthPlan(totals);
  updateCityGrowth(net);
  document.querySelector('#season-ledger').innerHTML = season.records.length ? season.records.slice().reverse().map((record) => `<article><b>Day ${record.day}</b><div><strong>${safeDemoText(record.work)}</strong><span>${safeDemoText(record.lesson)}</span></div><small>${record.tasks} tasks · $${record.revenue.toFixed(2)} revenue · $${record.expenses.toFixed(2)} cost</small></article>`).join('') : '<p>No simulated workdays recorded yet.</p>';
  document.querySelector('#advance-demo-day').disabled = season.day >= 7;
  document.querySelector('#advance-demo-day').innerHTML = season.day >= 7 ? '<i data-lucide="check"></i> Week complete' : '<i data-lucide="play"></i> Run next demo day';
  refreshIcons();
}

function updateCityGrowth(netProfit) {
  const stage = netProfit >= 250 ? 4 : netProfit >= 100 ? 3 : netProfit >= 25 ? 2 : 1;
  const stageNames = ['Starter Block', 'Working District', 'Business City', 'Full MKN City'];
  document.querySelector('#growth-stage').textContent = stageNames[stage - 1];
  document.querySelectorAll('.city-growth-path li').forEach((item, index) => {
    item.classList.toggle('growth-current', index + 1 === stage);
    item.classList.toggle('growth-complete', index + 1 < stage);
  });
  document.querySelectorAll('[data-unlock-profit]').forEach((district) => {
    const unlocked = founderEdition || netProfit >= Number(district.dataset.unlockProfit);
    district.classList.toggle('locked-district', !unlocked);
    district.setAttribute('aria-disabled', String(!unlocked));
  });
  const factoryState = document.querySelector('#factory-state');
  factoryState.innerHTML = founderEdition || netProfit >= 25 ? '<i></i> Founder production district online' : '<i></i> Locked until $25 demo profit';
}

const demoAutonomy = document.querySelector('#demo-autonomy');
const demoAutonomyStatus = document.querySelector('#demo-autonomy-status');
demoAutonomy.checked = localStorage.getItem('mkn-demo-autonomy') !== 'paused';

function updateDemoAutonomyStatus() {
  const season = getDemoSeason();
  demoAutonomyStatus.textContent = season.day >= 7 ? 'Proof week complete · Director review ready'
    : demoAutonomy.checked ? 'Autopilot active · next shift runs automatically'
    : 'Autopilot paused by Founder';
}

function runDemoDay(source = 'manual') {
  const season = getDemoSeason();
  if (season.day >= 7) return false;
  const plan = demoDayPlans[season.day];
  season.day += 1;
  season.records.push({ day: season.day, recordedAt: new Date().toISOString(), source, ...plan });
  localStorage.setItem('mkn-demo-season', JSON.stringify(season));
  localStorage.setItem('mkn-demo-last-run', new Date().toISOString());
  renderDemoSeason();
  updateDemoAutonomyStatus();
  runSystemsAudit({ quiet: true });
  showToast(`${source === 'autonomous' ? 'Autonomous shift' : 'Demo Day'} ${season.day} recorded. City health recalculated.`);
  return true;
}

document.querySelector('#advance-demo-day').addEventListener('click', () => runDemoDay('manual'));
document.querySelector('#run-systems-audit').addEventListener('click', () => runSystemsAudit());

demoAutonomy.addEventListener('change', () => {
  localStorage.setItem('mkn-demo-autonomy', demoAutonomy.checked ? 'active' : 'paused');
  updateDemoAutonomyStatus();
  showToast(demoAutonomy.checked ? 'Autonomous demo shifts enabled.' : 'Autonomous demo shifts paused.');
});

document.querySelector('#reset-demo-season').addEventListener('click', () => {
  if (!window.confirm('Reset all seven-day demo records on this device?')) return;
  localStorage.removeItem('mkn-demo-season');
  localStorage.removeItem('mkn-demo-last-run');
  renderDemoSeason();
  updateDemoAutonomyStatus();
  showToast('Seven-day demo season reset.');
});

const growthDialog = document.querySelector('#growth-dialog');
const growthForm = document.querySelector('#growth-form');
document.querySelector('#configure-growth-plan').addEventListener('click', () => {
  const plan = getGrowthPlan();
  document.querySelector('#plan-capital').value = plan.capital;
  document.querySelector('#plan-reserve').value = plan.reserve;
  document.querySelector('#plan-active-capital').value = plan.activeCapital;
  document.querySelector('#plan-experiment-cap').value = plan.experimentCap;
  document.querySelector('#plan-revenue-goal').value = plan.revenueGoal;
  document.querySelector('#plan-reinvest').value = plan.reinvest;
  growthDialog.showModal();
});

growthForm.addEventListener('submit', (event) => {
  if (event.submitter?.value === 'cancel') return;
  const plan = {
    capital: Number(document.querySelector('#plan-capital').value),
    reserve: Number(document.querySelector('#plan-reserve').value),
    activeCapital: Number(document.querySelector('#plan-active-capital').value),
    experimentCap: Number(document.querySelector('#plan-experiment-cap').value),
    revenueGoal: Number(document.querySelector('#plan-revenue-goal').value),
    reinvest: Number(document.querySelector('#plan-reinvest').value)
  };
  if (Object.values(plan).some((value) => !Number.isFinite(value) || value < 0)) {
    event.preventDefault();
    return showToast('Enter valid positive growth-plan amounts.');
  }
  if (plan.reserve + plan.activeCapital > plan.capital) {
    event.preventDefault();
    return showToast('Protected reserve plus active capital cannot exceed starting capital.');
  }
  if (plan.experimentCap > plan.activeCapital) {
    event.preventDefault();
    return showToast('The per-experiment cap cannot exceed active capital.');
  }
  localStorage.setItem('mkn-growth-plan', JSON.stringify(plan));
  renderDemoSeason();
  showToast('Founder growth plan saved. Revenue targets are goals, not spending caps or guarantees.');
});

renderDemoSeason();
updateDemoAutonomyStatus();
setTimeout(() => {
  if (demoAutonomy.checked) runDemoDay('autonomous');
}, 12000);
setInterval(() => {
  if (demoAutonomy.checked && document.visibilityState === 'visible') runDemoDay('autonomous');
}, 90000);
const officeData = {
  research: { district: 'Research District', title: 'Market Intelligence Lab', description: 'Evidence collection, source checks, and opportunity reports.', zone: 'Evidence Bay', zoneDetail: 'Trend wall active · source verification in progress', zoneIcon: 'scan-search', agents: [
    { name: 'Maya', role: 'Trend Researcher', task: 'Find and verify one product trend', sprite: 'research-sprite', status: 'Researching' },
    { name: 'Atlas', role: 'Market Explorer', task: 'Map one market and its active competitors', sprite: 'operations-sprite', status: 'Exploring' },
    { name: 'Sage', role: 'Evidence Verifier', task: 'Verify the sources in one research report', sprite: 'business-sprite', status: 'Studying sources' }
  ] },
  creative: { district: 'Creative District', title: 'Production Studio', description: 'Focused visual production and controlled design tests.', zone: 'Edit Suite', zoneDetail: 'Three concept bays · quality proofing online', zoneIcon: 'clapperboard', agents: [
    { name: 'Marcus', role: 'Thumbnail Designer', task: 'Create one approved thumbnail assignment', sprite: 'creative-sprite', status: 'Designing' }
  ] },
  business: { district: 'Commerce & Operations', title: 'Commerce Operations Floor', description: 'Listings, order flow, capacity, and customer operations.', zone: 'Order Control', zoneDetail: 'Listings, customer care, and delivery queues', zoneIcon: 'shopping-bag', agents: [
    { name: 'Avery', role: 'Listing / SEO Specialist', task: 'Prepare one compliant marketplace listing', sprite: 'business-sprite', status: 'Optimizing' },
    { name: 'Nova', role: 'Operations Specialist', task: 'Monitor one active production queue', sprite: 'operations-sprite', status: 'Monitoring' }
  ] },
  factory: { district: 'Industrial District', title: 'MKN Production Works', description: 'Approved work orders move through creation, quality control, and delivery.', zone: 'Production Line', zoneDetail: 'Create · inspect · package · release', zoneIcon: 'factory', agents: [
    { name: 'Forge', role: 'Production Manager', task: 'Move one approved work order through production', sprite: 'operations-sprite', status: 'Scheduling' },
    { name: 'Quinn', role: 'Quality Inspector', task: 'Inspect one completed output against its brief', sprite: 'business-sprite', status: 'Inspecting' }
  ] },
  founder: { district: 'Downtown', title: 'Founder Tower', description: 'City oversight, approvals, budgets, and department coordination.', zone: 'Command Deck', zoneDetail: 'Treasury, approvals, and city intelligence', zoneIcon: 'crown', agents: [
    { name: 'Director', role: 'Chief Director', task: 'Review city performance and escalate decisions', sprite: 'director-sprite', status: 'Reviewing' }
  ] },
  university: { district: 'North MKN City', title: 'AI University', description: 'Classroom instruction, practical work samples, exams, certification, and formal retraining.', zone: 'Skills Campus', zoneDetail: 'Classroom, practical lab, exams, and certification', zoneIcon: 'graduation-cap', agents: [
    { name: 'Dean Ellis', role: 'Training Director', task: 'Evaluate one probationary agent work sample', sprite: 'director-sprite', status: 'Teaching' },
    { name: 'Imani', role: 'Skills Coach', task: 'Train one agent on source verification', sprite: 'research-sprite', status: 'Leading class' },
    { name: 'Jordan', role: 'Probationary Analyst', task: 'Complete one supervised market research exam', sprite: 'operations-sprite', status: 'Taking exam' }
  ] },
  government: { district: 'Government Contracting District', title: 'Capture & Proposal Center', description: 'Opportunity qualification, compliant proposal development, and human-controlled submissions.', zone: 'Secure Proposal Room', zoneDetail: 'Qualification · compliance · pricing · red team', zoneIcon: 'shield-check', agents: [
    { name: 'Grant', role: 'Opportunity Scout', task: 'Find one solicitation that matches verified capabilities', sprite: 'research-sprite', status: 'Scanning' },
    { name: 'Carmen', role: 'Capture Analyst', task: 'Produce one evidence-based bid or no-bid brief', sprite: 'operations-sprite', status: 'Qualifying' },
    { name: 'Clara', role: 'Compliance Specialist', task: 'Build one solicitation compliance matrix', sprite: 'business-sprite', status: 'Checking' },
    { name: 'Perry', role: 'Pricing Analyst', task: 'Build one documented cost and price model', sprite: 'director-sprite', status: 'Modeling' },
    { name: 'Wren', role: 'Proposal Writer', task: 'Draft one proposal section from verified facts', sprite: 'creative-sprite', status: 'Drafting' },
    { name: 'Redd', role: 'Red Team Reviewer', task: 'Review one proposal package against its requirements', sprite: 'director-sprite', status: 'Reviewing' }
  ] }
};

try {
  const savedAudit = JSON.parse(localStorage.getItem('mkn-systems-audit') || '{}');
  renderSystemsAudit(Array.isArray(savedAudit.results) ? savedAudit.results : []);
} catch {
  renderSystemsAudit();
}

const defaultCityIdentity = { name: 'MICHH', title: 'Founder' };
function getCityIdentity() {
  try { return { ...defaultCityIdentity, ...JSON.parse(localStorage.getItem('mkn-city-identity') || '{}') }; }
  catch { return defaultCityIdentity; }
}

function renderCityIdentity() {
  const identity = getCityIdentity();
  document.querySelectorAll('[data-leader-name]').forEach((node) => { node.textContent = identity.name; });
  document.querySelectorAll('[data-leader-title]').forEach((node) => { node.textContent = identity.title; });
  return identity;
}

renderCityIdentity();

function renderOffice(officeId) {
  const office = officeData[officeId];
  if (!office) return;
  const now = new Date();
  const displayHour = cityTimeMode === 'day' ? 12 : cityTimeMode === 'night' ? 23 : now.getHours();
  const period = getCityPeriod(displayHour);
  const isNightCycle = period.schedule === 5;
  officeDistrict.textContent = office.district;
  officeTitle.textContent = office.title;
  officeDescription.textContent = office.description;
  officeShift.innerHTML = `<i></i>${isNightCycle ? 'Low-cost night cycle' : period.phase}`;
  officeDialog.dataset.office = officeId;
  const zone = `<aside class="office-zone"><i data-lucide="${office.zoneIcon}"></i><div><small>Active location</small><strong>${office.zone}</strong><span>${office.zoneDetail}</span></div><b><i></i> Online</b></aside>`;
  const desks = office.agents.map((agent) => {
    const liveStatus = isNightCycle && agent.name !== 'Director' ? 'Consolidating memory'
      : period.schedule === 4 ? 'Knowledge exchange'
      : period.schedule === 3 ? 'Filing daily report'
      : agent.status;
    return `
    <article class="office-desk occupied-desk">
      <div class="desk-workstation"><i data-lucide="monitor"></i><span></span></div>
      <div class="office-agent"><span class="office-agent-sprite ${agent.sprite}"></span><div><small>${agent.role}</small><strong>${agent.name}</strong><span><i></i>${liveStatus}</span></div></div>
      <div class="desk-task"><small>Focus-locked task</small><p>${agent.task}</p></div>
      <button type="button" data-office-command="${agent.name}"><i data-lucide="message-square"></i><span>Command</span></button>
    </article>
  `;
  }).join('');
  const identity = getCityIdentity();
  const ownerDesk = officeId === 'founder' ? `
    <article class="office-desk owner-desk">
      <div class="owner-office-seal"><i data-lucide="crown"></i></div>
      <small>${escapeHtml(identity.title)} / Final Authority</small><strong>${escapeHtml(identity.name)}</strong>
      <p>Final authority for money, hiring, external actions, and city expansion.</p>
      <div><span>Capital control</span><span>Final approval</span><span>Director oversight</span></div>
      <button type="button" data-owner-approvals><i data-lucide="badge-check"></i><span>Open approvals</span></button>
    </article>
  ` : '';
  const vacantCount = Math.max(1, 3 - office.agents.length);
  const vacancies = Array.from({ length: vacantCount }, (_, index) => `
    <article class="office-desk vacant-desk"><i data-lucide="armchair"></i><strong>${officeId === 'university' ? 'Training station' : `Desk ${office.agents.length + index + 1}`}</strong><span>${officeId === 'university' ? 'Ready for a candidate' : 'Vacant'}</span></article>
  `).join('');
  officeFloor.innerHTML = zone + ownerDesk + desks + vacancies;
  refreshIcons();
  officeDialog.showModal();
  let discovered;
  try { discovered = new Set(JSON.parse(localStorage.getItem('mkn-discovered-offices') || '[]')); }
  catch { discovered = new Set(); }
  if (!discovered.has(officeId)) {
    discovered.add(officeId);
    localStorage.setItem('mkn-discovered-offices', JSON.stringify([...discovered]));
    showToast(`Location discovered: ${office.title}`);
  }
}

document.querySelectorAll('[data-office]').forEach((district) => district.addEventListener('click', () => {
  if (document.querySelector('.city-map')?.classList.contains('build-mode')) return;
  const thresholds = { factory: 25, university: 100, government: 250 };
  const threshold = thresholds[district.dataset.office];
  const records = getDemoSeason().records;
  const net = records.reduce((total, record) => total + record.revenue - record.expenses, 0);
  if (!founderEdition && threshold && net < threshold) return showToast(`This district unlocks at $${threshold} cumulative demo net.`);
  renderOffice(district.dataset.office);
}));
document.querySelector('[data-enter-founder-office]').addEventListener('click', () => renderOffice('founder'));
officeFloor.addEventListener('click', (event) => {
  const approvalsButton = event.target.closest('[data-owner-approvals]');
  if (approvalsButton) {
    officeDialog.close();
    return openView('approvals');
  }
  const button = event.target.closest('[data-office-command]');
  if (!button) return;
  officeDialog.close();
  setConsole(true);
  submitCommand(`talk to ${button.dataset.officeCommand}`);
});

const workflowSteps = document.querySelectorAll('.workflow-steps li');
const researchAgent = document.querySelector('#research-agent');
const workflowStatus = document.querySelector('#workflow-status');
const replayWorkflow = document.querySelector('#replay-workflow');
let workflowTimers = [];

function runResearchHandoff() {
  workflowTimers.forEach(clearTimeout);
  workflowTimers = [];
  workflowSteps.forEach((step, index) => {
    step.classList.toggle('complete', index === 0);
    step.classList.toggle('active', index === 1);
  });
  workflowStatus.textContent = 'In progress';
  workflowStatus.classList.remove('review');
  researchAgent.classList.remove('moving');
  void researchAgent.offsetWidth;
  researchAgent.classList.add('moving');

  [1300, 3100, 5000, 6200].forEach((delay, offset) => {
    workflowTimers.push(setTimeout(() => {
      workflowSteps.forEach((step, index) => {
        step.classList.toggle('complete', index <= offset + 1);
        step.classList.toggle('active', index === offset + 2);
      });
      if (offset === 3) {
        workflowSteps[4].classList.add('active');
        workflowStatus.textContent = 'Director review';
        workflowStatus.classList.add('review');
      }
    }, delay));
  });
}

replayWorkflow.addEventListener('click', runResearchHandoff);
runResearchHandoff();

const cityMap = document.querySelector('.city-map');
const cityDistricts = [...cityMap.querySelectorAll('.district')];
const blueprintControls = document.querySelector('#blueprint-controls');
const blueprintSelect = document.querySelector('#city-blueprint');
const roadStyleSelect = document.querySelector('#road-style');
const cityTime = document.querySelector('#city-time');
const cityPhase = document.querySelector('#city-phase');
const cityClockIcon = document.querySelector('.city-clock > i');
const timeModeButtons = document.querySelectorAll('[data-time-mode]');
const schedulePhases = document.querySelectorAll('#schedule-timeline article');
let cityTimeMode = localStorage.getItem('mkn-city-time-mode') || 'night';
const cityBlueprints = {
  founder: { university: [13, 15], research: [20, 38], founder: [44, 46], creative: [12, 67], business: [70, 23], government: [82, 48], factory: [60, 70] },
  grid: { university: [12, 18], research: [34, 18], founder: [56, 18], creative: [12, 58], business: [34, 58], government: [56, 58], factory: [76, 58] },
  campus: { university: [39, 14], research: [18, 31], founder: [43, 43], creative: [17, 66], business: [67, 31], government: [68, 62], factory: [43, 73] }
};

function districtKey(district) {
  return [...district.classList].find((name) => cityBlueprints.founder[name]);
}

function applyBlueprintLayout(layout) {
  cityDistricts.forEach((district) => {
    const position = layout[districtKey(district)];
    if (!position) return;
    district.style.left = `${position[0]}%`;
    district.style.top = `${position[1]}%`;
    district.style.right = 'auto';
    district.style.bottom = 'auto';
  });
}

function readCurrentLayout() {
  return Object.fromEntries(cityDistricts.map((district) => [districtKey(district), [Number.parseFloat(district.style.left), Number.parseFloat(district.style.top)]]));
}

function setBuildMode(active) {
  cityMap.classList.toggle('build-mode', active);
  blueprintControls.hidden = !active;
  document.querySelector('#toggle-build-mode').classList.toggle('active', active);
  showToast(active ? 'Build mode active. Drag district markers to redesign MKN City.' : 'City blueprint editor closed.');
}

let savedBlueprint = null;
try { savedBlueprint = JSON.parse(localStorage.getItem('mkn-city-blueprint') || 'null'); }
catch { localStorage.removeItem('mkn-city-blueprint'); }
if (savedBlueprint?.layout) {
  applyBlueprintLayout(savedBlueprint.layout);
  blueprintSelect.value = savedBlueprint.template || 'founder';
  roadStyleSelect.value = savedBlueprint.roads || 'boulevard';
}
cityMap.dataset.roads = roadStyleSelect.value;

document.querySelector('#toggle-build-mode').addEventListener('click', () => setBuildMode(!cityMap.classList.contains('build-mode')));
document.querySelector('#close-build-mode').addEventListener('click', () => setBuildMode(false));
blueprintSelect.addEventListener('change', () => {
  applyBlueprintLayout(cityBlueprints[blueprintSelect.value]);
  showToast(`${blueprintSelect.options[blueprintSelect.selectedIndex].text} applied. Save to keep it.`);
});
roadStyleSelect.addEventListener('change', () => { cityMap.dataset.roads = roadStyleSelect.value; });
document.querySelector('#save-blueprint').addEventListener('click', () => {
  localStorage.setItem('mkn-city-blueprint', JSON.stringify({ template: blueprintSelect.value, roads: roadStyleSelect.value, layout: readCurrentLayout(), savedAt: new Date().toISOString() }));
  showToast('City blueprint saved on this device.');
});
document.querySelector('#reset-blueprint').addEventListener('click', () => {
  blueprintSelect.value = 'founder';
  roadStyleSelect.value = 'boulevard';
  cityMap.dataset.roads = 'boulevard';
  applyBlueprintLayout(cityBlueprints.founder);
  localStorage.removeItem('mkn-city-blueprint');
  showToast('Founder City blueprint restored.');
});

cityDistricts.forEach((district) => {
  district.addEventListener('pointerdown', (event) => {
    if (!cityMap.classList.contains('build-mode')) return;
    event.preventDefault();
    district.setPointerCapture(event.pointerId);
    district.classList.add('district-dragging');
  });
  district.addEventListener('pointermove', (event) => {
    if (!district.classList.contains('district-dragging')) return;
    const bounds = cityMap.getBoundingClientRect();
    const left = Math.max(3, Math.min(88, ((event.clientX - bounds.left) / bounds.width) * 100));
    const top = Math.max(8, Math.min(82, ((event.clientY - bounds.top) / bounds.height) * 100));
    district.style.left = `${left.toFixed(1)}%`;
    district.style.top = `${top.toFixed(1)}%`;
    district.style.right = 'auto';
    district.style.bottom = 'auto';
  });
  district.addEventListener('pointerup', () => district.classList.remove('district-dragging'));
  district.addEventListener('pointercancel', () => district.classList.remove('district-dragging'));
});

const interiorDialog = document.querySelector('#interior-builder-dialog');
const interiorForm = document.querySelector('#interior-builder-form');
const interiorGrid = document.querySelector('#interior-grid');
const interiorBuilding = document.querySelector('#interior-building');
const interiorTemplate = document.querySelector('#interior-template');
const interiorCells = [];
let interiorTool = 'floor';
let interiorPainting = false;
let currentInterior = [];

function createInteriorTemplate(type) {
  const tiles = Array(96).fill('empty');
  if (type === 'blank') return tiles;
  const bounds = type === 'starter' ? { left: 2, right: 9, top: 1, bottom: 6 } : { left: 0, right: 11, top: 0, bottom: 7 };
  for (let row = bounds.top; row <= bounds.bottom; row += 1) {
    for (let column = bounds.left; column <= bounds.right; column += 1) {
      const edge = row === bounds.top || row === bounds.bottom || column === bounds.left || column === bounds.right;
      tiles[(row * 12) + column] = edge ? 'wall' : 'floor';
    }
  }
  const hallRow = type === 'starter' ? 4 : 4;
  for (let column = bounds.left + 1; column < bounds.right; column += 1) tiles[(hallRow * 12) + column] = 'hall';
  tiles[(hallRow * 12) + bounds.left] = 'door';
  tiles[((bounds.top + 2) * 12) + bounds.left + 2] = 'desk';
  tiles[((bounds.top + 2) * 12) + bounds.right - 2] = 'desk';
  if (type === 'founder') {
    tiles[(2 * 12) + 5] = 'wall'; tiles[(3 * 12) + 5] = 'door';
    tiles[(5 * 12) + 7] = 'desk'; tiles[(6 * 12) + 9] = 'desk';
  }
  return tiles;
}

function getInteriorLayouts() {
  try { return JSON.parse(localStorage.getItem('mkn-interior-layouts') || '{}'); }
  catch { return {}; }
}

function renderInterior() {
  currentInterior.forEach((tile, index) => {
    interiorCells[index].dataset.tile = tile;
    interiorCells[index].setAttribute('aria-label', `Row ${Math.floor(index / 12) + 1}, column ${(index % 12) + 1}: ${tile}`);
  });
  document.querySelector('#interior-tile-count').textContent = String(currentInterior.filter((tile) => tile !== 'empty').length);
}

function loadInterior() {
  const saved = getInteriorLayouts()[interiorBuilding.value];
  currentInterior = Array.isArray(saved?.tiles) && saved.tiles.length === 96 ? saved.tiles.slice() : createInteriorTemplate(interiorBuilding.value === 'founder' ? 'founder' : 'starter');
  interiorTemplate.value = saved?.template || (interiorBuilding.value === 'founder' ? 'founder' : 'starter');
  renderInterior();
}

function paintInteriorCell(cell) {
  const index = Number(cell.dataset.cell);
  currentInterior[index] = interiorTool === 'erase' ? 'empty' : interiorTool;
  cell.dataset.tile = currentInterior[index];
  cell.setAttribute('aria-label', `Row ${Math.floor(index / 12) + 1}, column ${(index % 12) + 1}: ${currentInterior[index]}`);
  document.querySelector('#interior-tile-count').textContent = String(currentInterior.filter((tile) => tile !== 'empty').length);
}

for (let index = 0; index < 96; index += 1) {
  const cell = document.createElement('button');
  cell.type = 'button';
  cell.className = 'interior-cell';
  cell.dataset.cell = String(index);
  cell.dataset.tile = 'empty';
  cell.addEventListener('pointerdown', (event) => { event.preventDefault(); interiorPainting = true; paintInteriorCell(cell); });
  cell.addEventListener('pointerenter', () => { if (interiorPainting) paintInteriorCell(cell); });
  interiorCells.push(cell);
  interiorGrid.append(cell);
}
document.addEventListener('pointerup', () => { interiorPainting = false; });

document.querySelectorAll('[data-build-tool]').forEach((button) => button.addEventListener('click', () => {
  interiorTool = button.dataset.buildTool;
  document.querySelectorAll('[data-build-tool]').forEach((tool) => tool.classList.toggle('active', tool === button));
}));

document.querySelector('#open-interior-builder').addEventListener('click', () => {
  loadInterior();
  interiorDialog.showModal();
});
interiorBuilding.addEventListener('change', loadInterior);
interiorTemplate.addEventListener('change', () => {
  currentInterior = createInteriorTemplate(interiorTemplate.value);
  renderInterior();
});
document.querySelector('#reset-interior').addEventListener('click', () => {
  currentInterior = createInteriorTemplate(interiorTemplate.value);
  renderInterior();
  showToast('Interior reset to the selected template.');
});
interiorForm.addEventListener('submit', (event) => {
  if (event.submitter?.value === 'cancel') return;
  const layouts = getInteriorLayouts();
  layouts[interiorBuilding.value] = { template: interiorTemplate.value, tiles: currentInterior, savedAt: new Date().toISOString() };
  localStorage.setItem('mkn-interior-layouts', JSON.stringify(layouts));
  showToast(`${interiorBuilding.options[interiorBuilding.selectedIndex].text} interior saved.`);
});

function getCityPeriod(hour) {
  if (hour >= 6 && hour < 10) return { className: 'time-morning', phase: 'Morning research + planning', schedule: 0, icon: 'sunrise' };
  if (hour >= 10 && hour < 15) return { className: 'time-day', phase: 'Production + operations', schedule: 1, icon: 'sun' };
  if (hour >= 15 && hour < 18) return { className: 'time-day', phase: 'Reviews + collaboration', schedule: 2, icon: 'users-round' };
  if (hour >= 18 && hour < 21) return { className: 'time-evening', phase: 'Reports + learning', schedule: 3, icon: 'sunset' };
  if (hour >= 21 && hour < 23) return { className: 'time-evening', phase: 'Recreation + maintenance', schedule: 4, icon: 'gamepad-2' };
  return { className: 'time-night', phase: 'Memory + low-cost mode', schedule: 5, icon: 'moon-star' };
}

function updateCityTime() {
  const now = new Date();
  const displayHour = cityTimeMode === 'day' ? 12 : cityTimeMode === 'night' ? 23 : now.getHours();
  const period = getCityPeriod(displayHour);
  cityMap.classList.remove('time-morning', 'time-day', 'time-evening', 'time-night');
  cityMap.classList.add(period.className);
  cityMap.dataset.schedule = String(period.schedule);
  cityTime.textContent = cityTimeMode === 'auto'
    ? now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : cityTimeMode === 'day' ? '12:00 PM' : '11:00 PM';
  cityPhase.textContent = period.phase;
  cityClockIcon.setAttribute('data-lucide', period.icon);
  schedulePhases.forEach((phase, index) => phase.classList.toggle('active-phase', index === period.schedule));
  timeModeButtons.forEach((button) => button.classList.toggle('active', button.dataset.timeMode === cityTimeMode));
  refreshIcons();
}

timeModeButtons.forEach((button) => button.addEventListener('click', () => {
  cityTimeMode = button.dataset.timeMode;
  localStorage.setItem('mkn-city-time-mode', cityTimeMode);
  updateCityTime();
  showToast(cityTimeMode === 'auto' ? 'City lighting now follows local time.' : `${cityTimeMode === 'day' ? 'Day' : 'Night'} preview enabled.`);
}));
updateCityTime();
setInterval(updateCityTime, 60000);

const roamingAgents = [...document.querySelectorAll('.map-agent')];
const agentWaypoints = [
  [16, 24], [27, 35], [42, 40], [53, 51], [68, 35], [77, 25],
  [72, 61], [57, 69], [41, 66], [25, 70], [33, 52], [60, 43]
];
const phaseWaypoints = {
  0: [[18, 31], [25, 40], [34, 46], [67, 31]],
  1: [[18, 66], [55, 61], [70, 63], [78, 29]],
  2: [[39, 50], [47, 55], [55, 50], [62, 46]],
  3: [[43, 42], [49, 47], [56, 43], [67, 34]],
  4: [[22, 74], [34, 72], [45, 70], [57, 72]],
  5: [[13, 75], [18, 78], [23, 74], [28, 77]]
};
const phaseLines = [
  'Planning today\'s assignment.', 'Working the focus task.', 'Reviewing with the team.',
  'Saving today\'s lesson.', 'Off shift. Sharing ideas.', 'Memory consolidation active.'
];
const roamingLines = {
  Maya: ['Checking a new signal.', 'Taking research downtown.', 'Evidence first, Founder.'],
  Marcus: ['Heading to the studio.', 'New concept in progress.', 'Reviewing Design #7.'],
  Avery: ['Updating the listings.', 'Checking conversion data.', 'SEO report is moving.'],
  Nova: ['Production queue checked.', 'Capacity looks stable.', 'Moving to operations.'],
  Director: ['Reviewing city performance.', 'Approval queue checked.', 'Watching the departments.']
};

function moveAgent(agent, index) {
  if (agent.dataset.meeting === 'true') return;
  const moveId = Number(agent.dataset.moveId || 0) + 1;
  agent.dataset.moveId = String(moveId);
  const currentLeft = Number.parseFloat(agent.style.left || getComputedStyle(agent).left) || 0;
  const schedule = Number(cityMap.dataset.schedule || 1);
  const activeWaypoints = phaseWaypoints[schedule] || agentWaypoints;
  const point = activeWaypoints[(Math.floor(Math.random() * activeWaypoints.length) + index) % activeWaypoints.length];
  const duration = cityMap.classList.contains('time-night') ? 7 + Math.random() * 4 : 4 + Math.random() * 4;
  const mapWidth = cityMap.clientWidth || 1;
  const targetPixels = mapWidth * point[0] / 100;
  agent.style.setProperty('--face', targetPixels < currentLeft ? -1 : 1);
  agent.style.transitionDuration = `${duration}s`;
  agent.classList.add('walking');
  requestAnimationFrame(() => {
    agent.style.left = `${point[0]}%`;
    agent.style.top = `${point[1]}%`;
  });
  setTimeout(() => {
    if (Number(agent.dataset.moveId) !== moveId) return;
    agent.classList.remove('walking');
    if (agent.dataset.meeting === 'true') return;
    if (Math.random() > .56) {
      const lines = roamingLines[agent.dataset.agentChat] || ['On my way, Founder.'];
      agent.querySelector('.speech-bubble').textContent = Math.random() > .45 ? phaseLines[schedule] : lines[Math.floor(Math.random() * lines.length)];
      agent.classList.add('speaking');
      setTimeout(() => agent.classList.remove('speaking'), 2600);
    }
    setTimeout(() => moveAgent(agent, index), 1400 + Math.random() * 3000);
  }, duration * 1000);
}

roamingAgents.forEach((agent, index) => setTimeout(() => moveAgent(agent, index), 900 + index * 650));

const agentConversations = [
  { agents: ['Maya', 'Marcus'], first: 'Demand evidence is ready.', second: 'I will turn it into one test concept.' },
  { agents: ['Marcus', 'Avery'], first: 'The new design variant is ready.', second: 'I will prepare the listing and keywords.' },
  { agents: ['Avery', 'Nova'], first: 'Orders increased this afternoon.', second: 'I am checking production capacity now.' },
  { agents: ['Maya', 'Director'], first: 'Confidence reached the submit threshold.', second: 'Good. Send the report for Founder review.' },
  { agents: ['Nova', 'Director'], first: 'The queue is within safe capacity.', second: 'Keep spending inside the approved limit.' }
];
let conversationIndex = 0;

function showAgentExchange() {
  if (cityMap.dataset.schedule === '5' || document.visibilityState === 'hidden') return;
  const exchange = agentConversations[conversationIndex % agentConversations.length];
  conversationIndex += 1;
  const first = roamingAgents.find((agent) => agent.dataset.agentChat === exchange.agents[0]);
  const second = roamingAgents.find((agent) => agent.dataset.agentChat === exchange.agents[1]);
  if (!first || !second) return;
  [first, second].forEach((agent) => {
    agent.dataset.moveId = String(Number(agent.dataset.moveId || 0) + 1);
    agent.dataset.meeting = 'true';
    agent.classList.add('walking', 'agent-meeting');
    agent.style.transitionDuration = '2.4s';
  });
  first.style.setProperty('--face', 1);
  second.style.setProperty('--face', -1);
  first.style.left = '44%';
  first.style.top = '54%';
  second.style.left = '50%';
  second.style.top = '54%';
  setTimeout(() => {
    first.classList.remove('walking');
    second.classList.remove('walking');
    first.querySelector('.speech-bubble').textContent = exchange.first;
    first.classList.add('speaking');
  }, 2600);
  setTimeout(() => {
    first.classList.remove('speaking');
    second.querySelector('.speech-bubble').textContent = exchange.second;
    second.classList.add('speaking');
  }, 5600);
  setTimeout(() => {
    second.classList.remove('speaking');
    [first, second].forEach((agent, index) => {
      agent.classList.remove('agent-meeting');
      agent.dataset.meeting = 'false';
      moveAgent(agent, index);
    });
  }, 9000);
}

setTimeout(showAgentExchange, 4500);
setInterval(showAgentExchange, 19000);

const propertyDialog = document.querySelector('#property-dialog');
const dialogPropertyName = document.querySelector('#dialog-property-name');

document.querySelectorAll('[data-property]').forEach((button) => {
  button.addEventListener('click', () => {
    dialogPropertyName.textContent = button.dataset.property;
    propertyDialog.querySelector('.eyebrow').textContent = 'Commercial property';
    propertyDialog.querySelector('.dialog-property-status').innerHTML = '<span></span> Vacant and available';
    propertyDialog.querySelector('p:not(.eyebrow)').textContent = 'A building can be reserved only for an approved business proposal. Reserving property does not publish or launch the business.';
    propertyDialog.querySelector('label').hidden = false;
    propertyDialog.querySelector('input').hidden = false;
propertyDialog.querySelector('#reserve-property').textContent = 'Request reservation';
    propertyDialog.showModal();
  });
});

document.querySelectorAll('[data-business]').forEach((button) => {
  button.addEventListener('click', () => {
    dialogPropertyName.textContent = button.dataset.business;
    propertyDialog.querySelector('.eyebrow').textContent = 'Building 001';
    propertyDialog.querySelector('.dialog-property-status').innerHTML = '<span></span> Testing';
    propertyDialog.querySelector('p:not(.eyebrow)').textContent = 'Founded 09/20/2026 · 3 employees · $0 revenue · $0 expenses. This business is completing its first validation test.';
    propertyDialog.querySelector('label').hidden = true;
    propertyDialog.querySelector('input').hidden = true;
    propertyDialog.querySelector('#reserve-property').textContent = 'Close';
    propertyDialog.showModal();
  });
});

document.querySelector('.expand-action').addEventListener('click', () => {
  openView('city');
  setBuildMode(true);
  cityMap.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

const marketDialog = document.querySelector('#market-dialog');
const marketDialogTitle = document.querySelector('#market-dialog-title');
const marketDialogLabel = document.querySelector('#market-dialog-label');
const manualEntryFields = document.querySelector('#manual-entry-fields');
const marketForm = document.querySelector('#market-form');
const marketSubmit = document.querySelector('#market-submit');
const ledgerContent = document.querySelector('#ledger-content');
const ledgerCount = document.querySelector('#ledger-count');
let marketMode = 'manual';

function getMarketEntries() {
  try { return JSON.parse(localStorage.getItem('mkn-market-entries') || '[]'); }
  catch { return []; }
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);
}

function renderMarketLedger() {
  const entries = getMarketEntries();
  ledgerCount.textContent = `${entries.length} ${entries.length === 1 ? 'record' : 'records'}`;
  if (!entries.length) {
    ledgerContent.className = 'ledger-empty';
    ledgerContent.innerHTML = '<i data-lucide="notebook-tabs"></i><p>No entries recorded yet.</p>';
  } else {
    ledgerContent.className = '';
    ledgerContent.innerHTML = `<ul class="ledger-list">${entries.map((entry) => `<li><div><strong>${escapeHtml(entry.description)}</strong><small>PrizePicks · ${escapeHtml(entry.date)}</small></div><b>$${entry.risk.toFixed(2)}</b></li>`).join('')}</ul>`;
  }
  refreshIcons();
}

document.querySelectorAll('[data-market-action]').forEach((button) => {
  button.addEventListener('click', () => {
    const manual = button.dataset.marketAction === 'manual';
    marketMode = manual ? 'manual' : 'kalshi';
    marketDialogLabel.textContent = manual ? 'Personal tracker' : 'Official API boundary';
    marketDialogTitle.textContent = manual ? 'Add manual entry' : 'Kalshi connection details';
    manualEntryFields.innerHTML = manual
      ? '<p>Record an entry after you place it yourself on the platform. Never enter your platform password here.</p><label for="entry-description">Entry description</label><input id="entry-description" placeholder="Example: NBA two-pick entry" autocomplete="off"><label for="entry-risk">Amount risked</label><input id="entry-risk" inputmode="decimal" placeholder="$0.00" autocomplete="off">'
      : '<p>Kalshi offers an official REST API. A future connection will use a private server route and encrypted environment variables on Render. API credentials will never be stored in browser code or committed to GitHub.</p>';
    marketSubmit.textContent = manual ? 'Save locally' : 'Close';
    marketDialog.showModal();
  });
});

marketForm.addEventListener('submit', (event) => {
  if (marketMode !== 'manual' || event.submitter?.value === 'cancel') return;
  const description = document.querySelector('#entry-description')?.value.trim();
  const risk = Number(document.querySelector('#entry-risk')?.value.replace(/[$,]/g, ''));
  if (!description || !Number.isFinite(risk) || risk <= 0) {
    event.preventDefault();
    return;
  }
  const entries = getMarketEntries();
  entries.unshift({ description, risk, date: new Date().toLocaleDateString() });
  localStorage.setItem('mkn-market-entries', JSON.stringify(entries));
  renderMarketLedger();
});

renderMarketLedger();
document.querySelector('#refresh-sports-research').addEventListener('click', refreshSportsResearch);
refreshSportsResearch();

const orderDialog = document.querySelector('#order-dialog');
const orderForm = document.querySelector('#order-form');
const customerLedgerBody = document.querySelector('#customer-ledger-body');

function getCustomerOrders() {
  try { return JSON.parse(localStorage.getItem('mkn-customer-orders') || '[]'); }
  catch { return []; }
}

function money(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0));
}

function renderCustomerLedger() {
  const orders = getCustomerOrders();
  const totals = orders.reduce((summary, order) => {
    summary.revenue += Number(order.revenue);
    summary.expenses += Number(order.expenses);
    summary.profit += Number(order.profit);
    return summary;
  }, { revenue: 0, expenses: 0, profit: 0 });
  document.querySelector('#customer-order-count').textContent = String(orders.length);
  document.querySelector('#customer-ledger-revenue').textContent = money(totals.revenue);
  document.querySelector('#customer-ledger-expenses').textContent = money(totals.expenses);
  const profitNode = document.querySelector('#customer-ledger-profit');
  profitNode.textContent = money(totals.profit);
  profitNode.className = totals.profit < 0 ? 'profit-negative' : 'profit-positive';
  if (!orders.length) {
    customerLedgerBody.innerHTML = '<tr><td colspan="8" class="ledger-empty">No customer orders recorded.</td></tr>';
  } else {
    customerLedgerBody.innerHTML = orders.map((order) => `
      <tr><td><strong>${escapeHtml(String(order.customer))}</strong><br><small>${escapeHtml(String(order.business))}</small></td><td>${escapeHtml(String(order.product))}</td><td>${escapeHtml(String(order.status))}</td><td>${money(order.revenue)}</td><td>${money(order.expenses)}</td><td class="${order.profit < 0 ? 'profit-negative' : 'profit-positive'}">${money(order.profit)}</td><td><span class="record-chip ${order.recordType}">${order.recordType === 'demo' ? 'Demo' : 'Pending verification'}</span></td><td><button class="delete-order" type="button" data-delete-order="${escapeHtml(String(order.id))}" title="Delete order" aria-label="Delete order"><i data-lucide="trash-2"></i></button></td></tr>
    `).join('');
  }
  refreshIcons();
}

document.querySelector('#add-customer-order').addEventListener('click', () => {
  orderForm.reset();
  ['order-revenue', 'order-production', 'order-fees', 'order-other-cost', 'order-refund'].forEach((id) => { document.querySelector(`#${id}`).value = '0.00'; });
  orderDialog.showModal();
  document.querySelector('#order-customer').focus();
});

orderForm.addEventListener('submit', (event) => {
  if (event.submitter?.value === 'cancel') return;
  const customer = document.querySelector('#order-customer').value.trim();
  const product = document.querySelector('#order-product').value.trim();
  const revenue = Number(document.querySelector('#order-revenue').value || 0);
  const production = Number(document.querySelector('#order-production').value || 0);
  const fees = Number(document.querySelector('#order-fees').value || 0);
  const other = Number(document.querySelector('#order-other-cost').value || 0);
  const refund = Number(document.querySelector('#order-refund').value || 0);
  if (!customer || !product || [revenue, production, fees, other, refund].some((value) => !Number.isFinite(value) || value < 0)) {
    event.preventDefault();
    return showToast('Complete the customer, purchase, and valid money fields.');
  }
  if (refund > revenue) {
    event.preventDefault();
    return showToast('A refund cannot exceed the amount paid.');
  }
  const expenses = production + fees + other + refund;
  const orders = getCustomerOrders();
  orders.unshift({ id: `ORD-${Date.now()}`, customer, business: document.querySelector('#order-business').value, product, revenue, production, fees, other, refund, expenses, profit: revenue - expenses, status: document.querySelector('#order-status').value, recordType: document.querySelector('#order-record-type').value, createdAt: new Date().toISOString() });
  localStorage.setItem('mkn-customer-orders', JSON.stringify(orders));
  renderCustomerLedger();
  showToast('Customer order saved to the commerce ledger.');
});

customerLedgerBody.addEventListener('click', (event) => {
  const button = event.target.closest('[data-delete-order]');
  if (!button || !window.confirm('Delete this customer order record?')) return;
  const orders = getCustomerOrders().filter((order) => String(order.id) !== button.dataset.deleteOrder);
  localStorage.setItem('mkn-customer-orders', JSON.stringify(orders));
  renderCustomerLedger();
  showToast('Customer order deleted.');
});

renderCustomerLedger();

const agentDialog = document.querySelector('#agent-dialog');
const agentForm = document.querySelector('#agent-form');
const agentName = document.querySelector('#agent-name');
const agentRole = document.querySelector('#agent-role');
const agentTask = document.querySelector('#agent-task');
const agentDepartment = document.querySelector('#agent-department');
const agentBuilding = document.querySelector('#agent-building');
const agentShift = document.querySelector('#agent-shift');
const agentPersonality = document.querySelector('#agent-personality');
const agentTraits = document.querySelector('#agent-traits');
const agentCount = document.querySelector('#agent-count');
const candidateRosterList = document.querySelector('#candidate-roster-list');
const candidateRosterCount = document.querySelector('#candidate-roster-count');
const rosterSearch = document.querySelector('#agent-roster-search');
const rosterDepartment = document.querySelector('#agent-roster-department');
const rosterWindow = document.querySelector('#agent-roster-window');
const rosterPageStatus = document.querySelector('#agent-page-status');
const rosterPageSize = 12;
let rosterPage = 1;

function renderCandidateRoster() {
  const candidates = JSON.parse(localStorage.getItem('mkn-agent-candidates') || '[]');
  const totalWorkforce = 8 + candidates.length;
  document.querySelector('#workforce-total').textContent = String(totalWorkforce);
  const scaleState = document.querySelector('#workforce-scale-state');
  scaleState.textContent = totalWorkforce > 60 ? 'Create department divisions' : totalWorkforce > 24 ? 'Add another manager' : 'Capacity healthy';
  scaleState.classList.toggle('needs-scale', totalWorkforce > 24);
  candidateRosterCount.textContent = `${candidates.length} candidate${candidates.length === 1 ? '' : 's'}`;
  const query = rosterSearch.value.trim().toLowerCase();
  const department = rosterDepartment.value;
  const filtered = candidates.filter((candidate) => {
    const departmentMatch = department === 'all' || candidate.department === department;
    const searchText = `${candidate.name} ${candidate.role} ${candidate.primaryTask} ${candidate.building || ''} ${candidate.shift || ''}`.toLowerCase();
    return departmentMatch && (!query || searchText.includes(query));
  }).reverse();
  const pageCount = Math.max(1, Math.ceil(filtered.length / rosterPageSize));
  rosterPage = Math.min(rosterPage, pageCount);
  const start = (rosterPage - 1) * rosterPageSize;
  const visible = filtered.slice(start, start + rosterPageSize);
  rosterWindow.textContent = `Showing ${visible.length} of ${filtered.length}`;
  rosterPageStatus.textContent = `Page ${rosterPage} of ${pageCount}`;
  document.querySelector('#agent-page-prev').disabled = rosterPage <= 1;
  document.querySelector('#agent-page-next').disabled = rosterPage >= pageCount;
  if (!visible.length) {
    candidateRosterList.innerHTML = `<p class="empty-roster">${candidates.length ? 'No agents match this workforce filter.' : 'No custom candidates created yet.'}</p>`;
    return;
  }
  candidateRosterList.innerHTML = visible.map((candidate) => `
    <article><div class="candidate-avatar">${escapeHtml(candidate.name.slice(0, 1).toUpperCase())}</div><div><small>${escapeHtml(candidate.department)} · ${escapeHtml(candidate.building || 'Unassigned')} · ${escapeHtml(candidate.shift || 'Workday')}</small><strong>${escapeHtml(candidate.name)}</strong><p>${escapeHtml(candidate.role)} · ${escapeHtml(candidate.primaryTask)}</p><div class="candidate-traits">${(candidate.traits || []).map((trait) => `<span>${escapeHtml(trait)}</span>`).join('')}</div></div><b>30-task probation</b></article>
  `).join('');
}

[rosterSearch, rosterDepartment].forEach((control) => control.addEventListener('input', () => { rosterPage = 1; renderCandidateRoster(); }));
document.querySelector('#agent-page-prev').addEventListener('click', () => { rosterPage = Math.max(1, rosterPage - 1); renderCandidateRoster(); });
document.querySelector('#agent-page-next').addEventListener('click', () => { rosterPage += 1; renderCandidateRoster(); });

document.querySelectorAll('.template-card button').forEach((button) => {
  button.addEventListener('click', () => {
    const template = button.closest('.template-card');
    agentName.value = '';
    agentRole.value = template.dataset.template;
    agentTask.value = template.dataset.template === 'Trend Scout' ? 'Find and verify one product trend at a time'
      : template.dataset.template === 'Thumbnail Designer' ? 'Create one approved thumbnail assignment at a time'
      : template.dataset.template === 'Etsy Listing Specialist' ? 'Prepare one compliant Etsy listing at a time'
      : '';
    agentDepartment.value = template.dataset.department;
    agentBuilding.value = template.dataset.department === 'Research' ? 'Research Lab'
      : template.dataset.department === 'Creative' ? 'Creative Studio'
      : template.dataset.department === 'Business' ? 'Commerce Office' : 'Unassigned';
    agentShift.value = template.dataset.department === 'Research' ? 'Morning' : 'Workday';
    agentPersonality.value = template.dataset.department === 'Creative' ? 'Creative' : template.dataset.department === 'Research' ? 'Skeptical' : 'Analytical';
    agentTraits.value = '';
    agentDialog.showModal();
    agentName.focus();
  });
});

agentForm.addEventListener('submit', (event) => {
  if (event.submitter?.value === 'cancel') return;
  const primaryTask = agentTask.value.trim();
  if (primaryTask.length < 10) {
    event.preventDefault();
    agentTask.focus();
    return showToast('Give this candidate one clear primary task.');
  }
  const createdAgents = JSON.parse(localStorage.getItem('mkn-agent-candidates') || '[]');
  const traits = agentTraits.value.split(',').map((trait) => trait.trim()).filter(Boolean).slice(0, 3);
  createdAgents.push({ name: agentName.value.trim(), role: agentRole.value.trim(), department: agentDepartment.value, building: agentBuilding.value, shift: agentShift.value, personality: agentPersonality.value, traits, primaryTask, status: 'probation', tasksCompleted: 0, createdAt: new Date().toISOString() });
  localStorage.setItem('mkn-agent-candidates', JSON.stringify(createdAgents));
  const current = Number(localStorage.getItem('mkn-created-agents') || '0') + 1;
  localStorage.setItem('mkn-created-agents', String(current));
  agentCount.textContent = `8 active · ${current} probation`;
  renderCandidateRoster();
  showToast(`${agentName.value.trim()} created with one focus-locked task.`);
});

const savedAgentCount = Number(localStorage.getItem('mkn-created-agents') || '0');
agentCount.textContent = `8 active · ${savedAgentCount} probation`;
renderCandidateRoster();

const connectionDialog = document.querySelector('#connection-dialog');
const connectionTitle = document.querySelector('#connection-title');
const connectionCopy = document.querySelector('#connection-copy');
const connectionDetails = {
  openai: { title: 'Configure OpenAI API', copy: '<p>OpenAI application access uses an API project key, not a ChatGPT password.</p><ul><li>Store the key as a private Render environment variable.</li><li>Never put it in browser code or GitHub.</li><li>Set project spend limits before enabling agents.</li></ul>' },
  etsy: { title: 'Connect Etsy', copy: '<p>Etsy uses OAuth 2.0 with explicit scopes.</p><ul><li>Start with a Seller App for your own shop.</li><li>Use read-only scopes first.</li><li>A private backend is required for token exchange and refresh.</li></ul>' },
  fiverr: { title: 'Set Up Fiverr Assisted Mode', copy: '<p>MKN City will not request or store your Fiverr password. A generally available seller-control API has not been verified for this build.</p><ul><li>Researchers may study approved public evidence and information you provide.</li><li>Agents create original MKN concepts, gig drafts, FAQs, packages, and delivery drafts.</li><li>You manually review and perform publishing, messaging, pricing, offers, and delivery on Fiverr.</li><li>If Fiverr grants official OAuth credentials later, connect them only through the private Render backend.</li></ul>' },
  kalshi: { title: 'Configure Kalshi API', copy: '<p>Kalshi provides an official API for market and personal account data.</p><ul><li>Credentials stay on the Render backend.</li><li>Begin with read-only analysis.</li><li>Keep all trading actions behind owner approval.</li></ul>' }
};

document.querySelectorAll('[data-connection]').forEach((button) => {
  button.addEventListener('click', () => {
    const details = connectionDetails[button.dataset.connection];
    connectionTitle.textContent = details.title;
    connectionCopy.innerHTML = details.copy;
    connectionDialog.showModal();
  });
});

const sellingPrice = document.querySelector('#selling-price');
const costFields = document.querySelectorAll('.cost-field');
const totalProductCost = document.querySelector('#total-product-cost');
const trueProfit = document.querySelector('#true-profit');
const profitMargin = document.querySelector('#profit-margin');
const profitResult = document.querySelector('.profit-result');

function calculateTrueProfit() {
  const price = Number(sellingPrice.value) || 0;
  const costs = [...costFields].reduce((sum, field) => sum + (Number(field.value) || 0), 0);
  const profit = price - costs;
  const margin = price > 0 ? (profit / price) * 100 : 0;
  totalProductCost.textContent = `$${costs.toFixed(2)}`;
  trueProfit.textContent = `${profit < 0 ? '-' : ''}$${Math.abs(profit).toFixed(2)}`;
  profitMargin.textContent = `${margin.toFixed(1)}% margin`;
  profitResult.classList.toggle('loss-result', profit < 0);
}

document.querySelectorAll('.profit-input').forEach((input) => input.addEventListener('input', calculateTrueProfit));
calculateTrueProfit();

document.querySelectorAll('.validation-request').forEach((request) => {
  const status = request.querySelector('header > span');
  const approve = request.querySelector('.approve-button');
  const decline = request.querySelector('.decline-button');
  const resolve = (decision) => {
    status.textContent = decision === 'approved' ? 'Approved by Michh' : 'Declined by Michh';
    status.style.background = decision === 'approved' ? 'var(--green-soft)' : '#f8e7e3';
    status.style.color = decision === 'approved' ? 'var(--green)' : '#9b3d31';
    approve.disabled = true;
    decline.disabled = true;
    localStorage.setItem('mkn-validation-decision', decision);
    updateApprovalCount();
  };
  approve.addEventListener('click', () => {
    resolve('approved');
    showToast('Approved by Michh. The decision was saved.');
  });
  decline.addEventListener('click', () => resolve('declined'));
  const savedDecision = localStorage.getItem('mkn-validation-decision');
  if (savedDecision) resolve(savedDecision);
});

const reviewMemory = document.querySelector('#review-memory');
const memoryAlert = document.querySelector('#memory-alert');

function markMemoryReviewed() {
  reviewMemory.innerHTML = '<i data-lucide="check"></i><span>Prior experiment reviewed</span>';
  memoryAlert.classList.add('reviewed');
  memoryAlert.classList.remove('needs-attention');
  refreshIcons();
}

reviewMemory.addEventListener('click', () => {
  localStorage.setItem('mkn-memory-00241-reviewed', 'true');
  markMemoryReviewed();
});

if (localStorage.getItem('mkn-memory-00241-reviewed') === 'true') markMemoryReviewed();

const staffingRequest = document.querySelector('.staffing-request');
const staffingStatus = staffingRequest.querySelector('header > span');
const staffingApprove = staffingRequest.querySelector('.approve-button');
const staffingDecline = staffingRequest.querySelector('.decline-button');

function resolveStaffing(decision) {
  staffingStatus.textContent = decision === 'approved' ? 'Approved by Michh' : 'Declined by Michh';
  staffingStatus.style.color = decision === 'approved' ? 'var(--green)' : '#9b3d31';
  staffingApprove.disabled = true;
  staffingDecline.disabled = true;
  localStorage.setItem('mkn-staffing-decision', decision);
  updateApprovalCount();
}

staffingApprove.addEventListener('click', () => { resolveStaffing('approved'); showToast('Staffing approved. Decision saved.'); });
staffingDecline.addEventListener('click', () => { resolveStaffing('declined'); showToast('Staffing declined. Decision saved.'); });
const savedStaffingDecision = localStorage.getItem('mkn-staffing-decision');
if (savedStaffingDecision) resolveStaffing(savedStaffingDecision);

const opportunity0142 = document.querySelector('#opportunity-0142');
const opportunity0142Status = opportunity0142.querySelector('header > span');
const opportunity0142Approve = opportunity0142.querySelector('.approve-button');
const opportunity0142Decline = opportunity0142.querySelector('.decline-button');

function resolveOpportunity0142(decision) {
  opportunity0142Status.textContent = decision === 'approved' ? 'Approved by Michh' : 'Declined by Michh';
  opportunity0142Status.style.background = decision === 'approved' ? 'var(--green-soft)' : '#f8e7e3';
  opportunity0142Status.style.color = decision === 'approved' ? 'var(--green)' : '#9b3d31';
  opportunity0142Approve.disabled = true;
  opportunity0142Decline.disabled = true;
  localStorage.setItem('mkn-opportunity-0142-decision', decision);
  updateApprovalCount();
}

opportunity0142Approve.addEventListener('click', () => { resolveOpportunity0142('approved'); showToast('Opportunity test approved. Decision saved.'); });
opportunity0142Decline.addEventListener('click', () => { resolveOpportunity0142('declined'); showToast('Opportunity declined. Decision saved.'); });
const savedOpportunity0142 = localStorage.getItem('mkn-opportunity-0142-decision');
if (savedOpportunity0142) resolveOpportunity0142(savedOpportunity0142);

document.querySelector('#reset-demo-decisions').addEventListener('click', () => {
  decisionKeys.forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem('mkn-memory-00241-reviewed');
  window.location.reload();
});

updateApprovalCount();

const commandLauncher = document.querySelector('#command-launcher');
const commandConsole = document.querySelector('#command-console');
const closeConsole = document.querySelector('#close-console');
const commandForm = document.querySelector('#command-form');
const commandInput = document.querySelector('#command-input');
const consoleMessages = document.querySelector('#console-messages');

function setConsole(open) {
  commandConsole.classList.toggle('open', open);
  commandConsole.setAttribute('aria-hidden', String(!open));
  commandLauncher.setAttribute('aria-expanded', String(open));
  if (open) commandInput.focus();
}

function addConsoleMessage(speaker, text, user = false) {
  const message = document.createElement('div');
  message.className = `console-message ${user ? 'user-message' : 'agent-message'}`;
  const label = document.createElement('span');
  const copy = document.createElement('p');
  label.textContent = speaker;
  copy.textContent = text;
  message.append(label, copy);
  consoleMessages.append(message);
  consoleMessages.scrollTop = consoleMessages.scrollHeight;
  return message;
}

function addConsoleSources(sources) {
  if (!Array.isArray(sources) || !sources.length) return;
  const message = document.createElement('div');
  message.className = 'console-message agent-message source-message';
  const label = document.createElement('span');
  label.textContent = 'Research sources';
  const list = document.createElement('div');
  sources.forEach((source) => {
    const link = document.createElement('a');
    link.href = source.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = source.title || source.url;
    list.append(link);
  });
  message.append(label, list);
  consoleMessages.append(message);
  consoleMessages.scrollTop = consoleMessages.scrollHeight;
}

function speakAsAgent(agent, text) {
  const mapAgent = document.querySelector(`[data-agent-chat="${agent}"]`);
  if (!mapAgent) return;
  mapAgent.querySelector('.speech-bubble').textContent = text.slice(0, 90);
  mapAgent.classList.add('speaking');
  setTimeout(() => mapAgent.classList.remove('speaking'), 5000);
}

function runLocalCommand(command) {
  const normalized = command.toLowerCase().trim();
  if (normalized.includes('start demo autopilot') || normalized.includes('resume demo city')) {
    demoAutonomy.checked = true;
    demoAutonomy.dispatchEvent(new Event('change'));
    return { handled: true, reply: 'Autonomous demo shifts resumed. External actions and real spending remain approval-gated.' };
  }
  if (normalized.includes('pause demo autopilot') || normalized.includes('pause demo city')) {
    demoAutonomy.checked = false;
    demoAutonomy.dispatchEvent(new Event('change'));
    return { handled: true, reply: 'Autonomous demo shifts paused by Founder command.' };
  }
  const routes = [
    { terms: ['show agents', 'view agents', 'go to agents'], view: 'agents', reply: 'Opening the Employment Center and agent roster.' },
    { terms: ['show businesses', 'view businesses', 'go to business'], view: 'businesses', reply: 'Opening the Business District.' },
    { terms: ['government contract', 'contracting center', 'show government', 'sam.gov', 'sam gov'], view: 'businesses', office: 'government', reply: 'Opening the Government Contracting Center. Readiness must be verified before any bid is submitted.' },
    { terms: ['show approvals', 'view approvals', 'go to approvals'], view: 'approvals', reply: 'Opening your approval queue.' },
    { terms: ['autopilot off', 'manual approvals'], view: 'approvals', reply: 'Opening Approvals. Set Big Boss Autopilot to Manual to keep every decision with you.' },
    { terms: ['autopilot on', 'guarded autopilot', 'run policy review'], view: 'approvals', reply: 'Opening Big Boss Guarded Autopilot. Internal zero-spend tasks may be automated; external actions remain yours.' },
    { terms: ['show memory', 'view memory', 'go to memory'], view: 'memory', reply: 'Opening the Memory Archive.' },
    { terms: ['show treasury', 'view treasury', 'go to treasury'], view: 'treasury', reply: 'Opening Treasury. The emergency reserve remains locked.' },
    { terms: ['show money ecosystem', 'money ecosystem', 'show money flow'], view: 'treasury', reply: 'Opening the Money Ecosystem. Demo, pending, and verified funds remain separate.' },
    { terms: ['open founder tower', 'show founder office', 'big boss office'], view: 'city', office: 'founder', reply: 'Opening Founder Tower.' },
    { terms: ['show markets', 'view markets', 'go to markets'], view: 'markets', reply: 'Opening the personal Markets Desk.' },
    { terms: ['show account', 'view account', 'privacy', 'payment methods', 'responsible gaming', 'responsible play', 'deposit', 'withdrawal'], view: 'account', reply: 'Opening Account & Safety. MKN does not hold wagering funds; deposits and withdrawals stay on the licensed platform.' },
    { terms: ['show city', 'view city', 'go home'], view: 'city', reply: 'Returning to the City Command Center.' }
  ];
  const route = routes.find((item) => item.terms.some((term) => normalized.includes(term)));
  if (route) {
    openView(route.view);
    if (route.office) renderOffice(route.office);
    return { handled: true, reply: route.reply };
  }
  if (normalized === 'help' || normalized.includes('what can i do')) {
    return { handled: true, reply: 'Try: city status, government contracts, show agents, show approvals, show treasury, show account, talk to Maya, or ask the Director a business question.' };
  }
  if (normalized.includes('city status') || normalized === 'status') {
    const plan = getGrowthPlan();
    const season = getDemoSeason();
    const totals = season.records.reduce((sum, record) => ({ revenue: sum.revenue + record.revenue, expenses: sum.expenses + record.expenses }), { revenue: 0, expenses: 0 });
    return { handled: true, reply: `Founder plan starts with ${formatPlanMoney(plan.capital)}, protects ${formatPlanMoney(plan.reserve)}, and exposes at most ${formatPlanMoney(plan.activeCapital)}. Demo net is ${formatPlanMoney(totals.revenue - totals.expenses)}. Two businesses and eight agents are active.` };
  }
  if (normalized.includes('talk to maya') || normalized === 'maya') {
    speakAsAgent('Maya', 'I am checking the strongest evidence now.');
    return { handled: true, reply: 'Maya: I am researching active opportunities. My manager rule is to submit once confidence is sufficient.' };
  }
  if (normalized.includes('talk to marcus') || normalized === 'marcus') {
    speakAsAgent('Marcus', 'I am preparing the next design test.');
    return { handled: true, reply: 'Marcus: Design #7 remains the creative benchmark. I am preparing one controlled variation for review.' };
  }
  if (normalized.includes('talk to avery') || normalized === 'avery') {
    speakAsAgent('Avery', 'I am checking listing performance.');
    return { handled: true, reply: 'Avery: Listings are organized. I will flag keyword or conversion changes before recommending a budget increase.' };
  }
  if (normalized.includes('talk to nova') || normalized === 'nova') {
    speakAsAgent('Nova', 'I am checking production capacity.');
    return { handled: true, reply: 'Nova: The production queue is stable. I will request temporary workers if demand exceeds safe capacity.' };
  }
  if (normalized.includes('talk to director')) {
    speakAsAgent('Director', 'I am reviewing the whole city.');
    return { handled: true, reply: 'Director: I am monitoring departments, budgets, approvals, and agent performance. No external action proceeds without your approval.' };
  }
  return { handled: false };
}

async function submitCommand(command, { skipLocal = false } = {}) {
  addConsoleMessage('Michh', command, true);
  const local = skipLocal ? { handled: false } : runLocalCommand(command);
  if (local.handled) return addConsoleMessage('Director', local.reply);
  const thinking = addConsoleMessage('Director', 'Reviewing your command...');
  thinking.classList.add('thinking');
  try {
    const requestCommand = () => fetch('/api/command', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(sessionStorage.getItem('mkn-founder-access') ? { 'X-MKN-Access-Code': sessionStorage.getItem('mkn-founder-access') } : {})
      },
      body: JSON.stringify({ message: command })
    });
    let response = await requestCommand();
    if (response.status === 401) {
      const accessCode = window.prompt('Enter the Founder access code for paid AI:');
      if (!accessCode) throw new Error('Founder access cancelled.');
      sessionStorage.setItem('mkn-founder-access', accessCode);
      response = await requestCommand();
    }
    const data = await response.json();
    thinking.remove();
    if (!response.ok) {
      if (response.status === 401) sessionStorage.removeItem('mkn-founder-access');
      return addConsoleMessage('Director', data.error || 'The city AI could not respond.');
    }
    addConsoleMessage(String(data.mode).startsWith('openai') ? 'Chief Director AI' : 'Director · Demo Mode', data.reply || data.error || 'No response received.');
    addConsoleSources(data.sources);
  } catch {
    thinking.remove();
    addConsoleMessage('Director · Offline', 'The server is unavailable. Navigation commands still work locally.');
  }
}

const bidIntakeForm = document.querySelector('#bid-intake-form');
bidIntakeForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const notice = document.querySelector('#bid-notice').value.trim();
  const capability = document.querySelector('#bid-capability').value.trim();
  if (!notice || !capability) return showToast('Add the exact notice and a verified capability summary first.');
  const intake = { notice, capability, createdAt: new Date().toISOString(), status: 'research-requested' };
  localStorage.setItem('mkn-bid-intake', JSON.stringify(intake));
  let liveAi = false;
  try {
    const healthResponse = await fetch('/api/health', { headers: { Accept: 'application/json' } });
    liveAi = healthResponse.ok && Boolean((await healthResponse.json()).openai);
  } catch {}
  document.querySelector('#bid-output').innerHTML = liveAi
    ? '<i data-lucide="loader-circle"></i><div><strong>Live source review sent to the contracting team</strong><p>First deliverable: sourced bid/no-bid brief. Drafting remains blocked until requirements and capability evidence are verified.</p></div>'
    : '<i data-lucide="key-round"></i><div><strong>Demo intake saved · live research not started</strong><p>The workflow is ready, but an OpenAI API key is required to inspect the notice and return sourced findings.</p></div>';
  refreshIcons();
  submitCommand(`Research this government solicitation using the official notice and current attachments: ${notice}. Our verified capability summary is: ${capability}. Return a sourced bid/no-bid brief first. Identify every missing fact and do not invent qualifications, past performance, pricing, or compliance.`, { skipLocal: true });
  showToast(liveAi ? 'Contracting team started a live source-controlled review.' : 'Bid intake saved in demo mode. Add the key for live research.');
});

commandLauncher.addEventListener('click', () => setConsole(!commandConsole.classList.contains('open')));
closeConsole.addEventListener('click', () => setConsole(false));
commandForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const command = commandInput.value.trim();
  if (!command) return;
  commandInput.value = '';
  submitCommand(command);
});
document.querySelectorAll('[data-command]').forEach((button) => button.addEventListener('click', () => {
  setConsole(true);
  submitCommand(button.dataset.command);
}));
document.querySelectorAll('[data-memory-brief]').forEach((button) => button.addEventListener('click', () => {
  const business = button.dataset.memoryBrief;
  localStorage.setItem('mkn-last-memory-brief', JSON.stringify({ business, reviewedAt: new Date().toISOString() }));
  button.innerHTML = '<i data-lucide="check"></i> Brief attached';
  button.disabled = true;
  refreshIcons();
  showToast(`${business} lessons attached to the next matching task.`);
}));
document.querySelectorAll('[data-agent-chat]').forEach((agent) => agent.addEventListener('click', () => {
  setConsole(true);
  submitCommand(`talk to ${agent.dataset.agentChat}`);
}));

const tutorialDialog = document.querySelector('#tutorial-dialog');
const tutorialTitle = document.querySelector('#tutorial-title');
const tutorialCopy = document.querySelector('#tutorial-copy');
const tutorialNext = document.querySelector('#tutorial-next');
const tutorialSkip = document.querySelector('#tutorial-skip');
const tutorialProgress = document.querySelectorAll('#tutorial-progress i');
const tutorialSteps = [
  { title: 'Welcome, Founder Michh', copy: 'This is your Command Center. Monitor money, agents, experiments, and approvals from here.', view: 'city' },
  { title: 'Talk to your agents', copy: 'Tap an agent on the map or open Founder Command. Agents can answer questions and receive text instructions.', view: 'city' },
  { title: 'Control every risk', copy: 'Hiring, spending, publishing, outreach, and account actions wait in Approvals until you decide.', view: 'approvals' },
  { title: 'Grow through evidence', copy: 'Complete missions, earn profit, unlock levels, hire specialists, and expand MKN City one proven step at a time.', view: 'businesses' }
];
let tutorialStep = 0;

function narrate(text) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.96;
  utterance.pitch = 0.92;
  speechSynthesis.speak(utterance);
}

function showTutorialStep() {
  const step = tutorialSteps[tutorialStep];
  tutorialTitle.textContent = step.title;
  tutorialCopy.textContent = step.copy;
  tutorialNext.textContent = tutorialStep === tutorialSteps.length - 1 ? 'Enter city' : 'Next';
  tutorialProgress.forEach((dot, index) => dot.classList.toggle('active', index <= tutorialStep));
  openView(step.view);
  narrate(`${step.title}. ${step.copy}`);
}

document.querySelector('#start-tutorial').addEventListener('click', () => {
  tutorialStep = 0;
  tutorialDialog.showModal();
  showTutorialStep();
});
tutorialNext.addEventListener('click', () => {
  if (tutorialStep === tutorialSteps.length - 1) {
    tutorialDialog.close();
    localStorage.setItem('mkn-tutorial-complete', 'true');
    window.speechSynthesis?.cancel();
    return;
  }
  tutorialStep += 1;
  showTutorialStep();
});
tutorialSkip.addEventListener('click', () => {
  tutorialDialog.close();
  localStorage.setItem('mkn-tutorial-complete', 'true');
  window.speechSynthesis?.cancel();
});

if (!localStorage.getItem('mkn-tutorial-complete')) {
  setTimeout(() => {
    tutorialDialog.showModal();
    showTutorialStep();
  }, 500);
}

const propertyForm = document.querySelector('#property-form');
propertyForm.addEventListener('submit', (event) => {
  if (event.submitter?.value === 'cancel') return;
  const businessName = document.querySelector('#business-name').value.trim();
  if (!businessName || document.querySelector('#business-name').hidden) return;
  localStorage.setItem('mkn-property-request', JSON.stringify({ building: dialogPropertyName.textContent, business: businessName }));
  showToast(`${dialogPropertyName.textContent} reservation sent to Approvals for ${businessName}.`);
});

document.querySelector('.icon-button').addEventListener('click', () => {
  openView('approvals');
  showToast('Approval desk opened. Two decisions need Founder review.');
});

document.querySelectorAll('.fund-card > button').forEach((button) => button.addEventListener('click', () => {
  showToast('Fund settings are owner-controlled. Editing unlocks with persistent accounts in the next city upgrade.');
}));

document.querySelector('.agent-profile header button').addEventListener('click', () => {
  openView('agents');
  setConsole(true);
  addConsoleMessage('Maya', 'My profile is active. You can assign research through this command console.');
});

const safetyInputs = document.querySelectorAll('[data-safety-setting]');
const leaderNameInput = document.querySelector('#leader-name');
const leaderTitleInput = document.querySelector('#leader-title');
const savedIdentity = getCityIdentity();
leaderNameInput.value = savedIdentity.name;
leaderTitleInput.value = savedIdentity.title;
document.querySelector('#save-city-identity').addEventListener('click', () => {
  const name = leaderNameInput.value.trim().slice(0, 28);
  const title = leaderTitleInput.value.trim().slice(0, 24);
  if (name.length < 2) return showToast('Enter a leader name with at least two characters.');
  if (title.length < 2) return showToast('Enter a leadership title with at least two characters.');
  const identity = { name, title };
  localStorage.setItem('mkn-city-identity', JSON.stringify(identity));
  renderCityIdentity();
  showToast(`${identity.title} ${identity.name} now leads the city.`);
});

const savedSafety = JSON.parse(localStorage.getItem('mkn-safety-settings') || '{}');
safetyInputs.forEach((input) => {
  const savedValue = savedSafety[input.dataset.safetySetting];
  if (savedValue === undefined) return;
  if (input.type === 'checkbox') input.checked = savedValue;
  else input.value = savedValue;
});

const privacyConsent = document.querySelector('#privacy-consent');
privacyConsent.checked = localStorage.getItem('mkn-privacy-consent') === 'true';
privacyConsent.addEventListener('change', () => {
  localStorage.setItem('mkn-privacy-consent', String(privacyConsent.checked));
  showToast(privacyConsent.checked ? 'Agreement acknowledgement saved on this device.' : 'Agreement acknowledgement removed.');
});

const eligibilityConsent = document.querySelector('#eligibility-consent');
eligibilityConsent.checked = localStorage.getItem('mkn-eligibility-consent') === 'true';
eligibilityConsent.addEventListener('change', () => localStorage.setItem('mkn-eligibility-consent', String(eligibilityConsent.checked)));

const demoWalletBalance = document.querySelector('#demo-wallet-balance');
const demoWalletHistory = document.querySelector('#demo-wallet-history');
let demoWallet = JSON.parse(localStorage.getItem('mkn-demo-wallet') || '{"balance":200,"transactions":[]}');

function renderDemoWallet() {
  demoWalletBalance.textContent = `$${Number(demoWallet.balance).toFixed(2)}`;
  if (!demoWallet.transactions.length) {
    demoWalletHistory.innerHTML = '<span>No demo transactions yet.</span>';
    return;
  }
  demoWalletHistory.innerHTML = demoWallet.transactions.slice(0, 8).map((transaction) => `
    <article class="${transaction.type}"><div><strong>Demo ${transaction.type}</strong><small>${escapeHtml(transaction.date)} · simulated only</small></div><b>${transaction.type === 'deposit' ? '+' : '-'}$${transaction.amount.toFixed(2)}</b></article>
  `).join('');
}

document.querySelectorAll('[data-demo-wallet]').forEach((button) => button.addEventListener('click', () => {
  const type = button.dataset.demoWallet;
  if (type === 'deposit') {
    const settings = JSON.parse(localStorage.getItem('mkn-safety-settings') || '{}');
    if (settings.coolOff) return showToast('Cool-off mode blocks new demo deposits. Demo withdrawals remain available.');
    if (!privacyConsent.checked || !eligibilityConsent.checked) return showToast('Acknowledge both agreements before practicing deposits.');
  }
  const entered = window.prompt(`Enter demo ${type} amount:`, '10');
  if (entered === null) return;
  const amount = Number(entered);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100) return showToast('Enter a demo amount from $0.01 to $100.');
  if (type === 'withdraw' && amount > demoWallet.balance) return showToast('Demo withdrawal cannot exceed the available balance.');
  if (type === 'deposit') {
    const settings = JSON.parse(localStorage.getItem('mkn-safety-settings') || '{}');
    const depositLimit = Number(settings.depositLimit || 25);
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const weeklyDeposits = demoWallet.transactions
      .filter((transaction) => transaction.type === 'deposit' && Number(transaction.createdAt || 0) >= weekAgo)
      .reduce((total, transaction) => total + Number(transaction.amount), 0);
    if (weeklyDeposits + amount > depositLimit) return showToast(`This would exceed your $${depositLimit.toFixed(2)} weekly demo-deposit limit.`);
  }
  demoWallet.balance = Number(demoWallet.balance) + (type === 'deposit' ? amount : -amount);
  demoWallet.transactions.unshift({ type, amount, date: new Date().toLocaleString(), createdAt: Date.now() });
  localStorage.setItem('mkn-demo-wallet', JSON.stringify(demoWallet));
  renderDemoWallet();
  showToast(`Demo ${type} recorded. No real money moved.`);
}));
renderDemoWallet();

const formatCents = (cents) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(cents || 0) / 100);

async function refreshVerifiedEconomy() {
  const status = document.querySelector('#ledger-state');
  const message = document.querySelector('#verified-economy-message');
  let accessCode = sessionStorage.getItem('mkn-founder-access');
  if (!accessCode) {
    accessCode = window.prompt('Enter the Founder access code to view verified finances:');
    if (!accessCode) return;
    sessionStorage.setItem('mkn-founder-access', accessCode);
  }
  status.textContent = 'Checking';
  try {
    const response = await fetch('/api/economy', { headers: { 'X-MKN-Access-Code': accessCode } });
    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401) sessionStorage.removeItem('mkn-founder-access');
      throw new Error(data.error || 'Ledger unavailable.');
    }
    if (!data.verified) {
      status.textContent = 'Demo only';
      status.classList.remove('connected');
      message.textContent = data.message;
      return;
    }
    document.querySelector('#verified-revenue').textContent = formatCents(data.verifiedRevenueCents);
    document.querySelector('#verified-expenses').textContent = formatCents(data.verifiedExpensesCents);
    document.querySelector('#verified-profit').textContent = formatCents(data.verifiedProfitCents);
    document.querySelector('#pending-net').textContent = formatCents(data.pendingRevenueCents - data.pendingExpensesCents);
    status.textContent = 'Provider verified';
    status.classList.add('connected');
    message.textContent = `${data.recent.length} recent provider records loaded. Demo Credits remain separate.`;
  } catch (error) {
    status.textContent = 'Unavailable';
    status.classList.remove('connected');
    message.textContent = error.message;
  }
}

document.querySelector('#refresh-economy').addEventListener('click', refreshVerifiedEconomy);

document.querySelector('#save-safety').addEventListener('click', () => {
  const settings = {};
  safetyInputs.forEach((input) => {
    settings[input.dataset.safetySetting] = input.type === 'checkbox' ? input.checked : Number(input.value);
  });
  localStorage.setItem('mkn-safety-settings', JSON.stringify(settings));
  showToast('Responsible-play limits saved on this device.');
});

document.querySelector('#export-data').addEventListener('click', () => {
  const exportData = {};
  Object.keys(localStorage).filter((key) => key.startsWith('mkn-')).forEach((key) => {
    try { exportData[key] = JSON.parse(localStorage.getItem(key)); }
    catch { exportData[key] = localStorage.getItem(key); }
  });
  const file = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(file);
  link.download = `mkn-city-data-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  showToast('Your browser-local MKN data was exported.');
});

document.querySelector('#clear-local-data').addEventListener('click', () => {
  if (!window.confirm('Clear all MKN City data stored in this browser? This cannot be undone.')) return;
  Object.keys(localStorage).filter((key) => key.startsWith('mkn-')).forEach((key) => localStorage.removeItem(key));
  window.location.reload();
});

refreshIcons();

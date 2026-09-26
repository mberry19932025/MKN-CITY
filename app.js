const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.view');

function openView(viewId) {
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

const gameToast = document.querySelector('#game-toast');
let toastTimer;

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
const officeData = {
  research: { district: 'Research District', title: 'Market Intelligence Lab', description: 'Evidence collection, source checks, and opportunity reports.', agents: [
    { name: 'Maya', role: 'Trend Researcher', task: 'Find and verify one product trend', sprite: 'research-sprite', status: 'Researching' }
  ] },
  creative: { district: 'Creative District', title: 'Production Studio', description: 'Focused visual production and controlled design tests.', agents: [
    { name: 'Marcus', role: 'Thumbnail Designer', task: 'Create one approved thumbnail assignment', sprite: 'creative-sprite', status: 'Designing' }
  ] },
  business: { district: 'Commerce & Operations', title: 'Commerce Operations Floor', description: 'Listings, order flow, capacity, and customer operations.', agents: [
    { name: 'Avery', role: 'Listing / SEO Specialist', task: 'Prepare one compliant marketplace listing', sprite: 'business-sprite', status: 'Optimizing' },
    { name: 'Nova', role: 'Operations Specialist', task: 'Monitor one active production queue', sprite: 'operations-sprite', status: 'Monitoring' }
  ] },
  founder: { district: 'Downtown', title: 'Founder Tower', description: 'City oversight, approvals, budgets, and department coordination.', agents: [
    { name: 'Director', role: 'Chief Director', task: 'Review city performance and escalate decisions', sprite: 'director-sprite', status: 'Reviewing' }
  ] },
  university: { district: 'North MKN City', title: 'AI University', description: 'Training, work samples, certification, and formal retraining.', agents: [] },
  government: { district: 'Government Contracting District', title: 'Capture & Proposal Center', description: 'Opportunity qualification, compliant proposal development, and human-controlled submissions.', agents: [
    { name: 'Grant', role: 'Opportunity Scout', task: 'Find one solicitation that matches verified capabilities', sprite: 'research-sprite', status: 'Scanning' },
    { name: 'Carmen', role: 'Capture Analyst', task: 'Produce one evidence-based bid or no-bid brief', sprite: 'operations-sprite', status: 'Qualifying' },
    { name: 'Clara', role: 'Compliance Specialist', task: 'Build one solicitation compliance matrix', sprite: 'business-sprite', status: 'Checking' },
    { name: 'Perry', role: 'Pricing Analyst', task: 'Build one documented cost and price model', sprite: 'director-sprite', status: 'Modeling' },
    { name: 'Wren', role: 'Proposal Writer', task: 'Draft one proposal section from verified facts', sprite: 'creative-sprite', status: 'Drafting' },
    { name: 'Redd', role: 'Red Team Reviewer', task: 'Review one proposal package against its requirements', sprite: 'director-sprite', status: 'Reviewing' }
  ] }
};

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
  const ownerDesk = officeId === 'founder' ? `
    <article class="office-desk owner-desk">
      <div class="owner-office-seal"><i data-lucide="crown"></i></div>
      <small>Founder / Big Boss</small><strong>MICHH</strong>
      <p>Final authority for money, hiring, external actions, and city expansion.</p>
      <div><span>Capital control</span><span>Final approval</span><span>Director oversight</span></div>
      <button type="button" data-owner-approvals><i data-lucide="badge-check"></i><span>Open approvals</span></button>
    </article>
  ` : '';
  const vacantCount = Math.max(1, 3 - office.agents.length);
  const vacancies = Array.from({ length: vacantCount }, (_, index) => `
    <article class="office-desk vacant-desk"><i data-lucide="armchair"></i><strong>${officeId === 'university' ? 'Training station' : `Desk ${office.agents.length + index + 1}`}</strong><span>${officeId === 'university' ? 'Ready for a candidate' : 'Vacant'}</span></article>
  `).join('');
  officeFloor.innerHTML = ownerDesk + desks + vacancies;
  lucide.createIcons();
  officeDialog.showModal();
}

document.querySelectorAll('[data-office]').forEach((district) => district.addEventListener('click', () => renderOffice(district.dataset.office)));
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
const cityTime = document.querySelector('#city-time');
const cityPhase = document.querySelector('#city-phase');
const cityClockIcon = document.querySelector('.city-clock > i');
const timeModeButtons = document.querySelectorAll('[data-time-mode]');
const schedulePhases = document.querySelectorAll('#schedule-timeline article');
let cityTimeMode = localStorage.getItem('mkn-city-time-mode') || 'night';

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
  cityTime.textContent = cityTimeMode === 'auto'
    ? now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : cityTimeMode === 'day' ? '12:00 PM' : '11:00 PM';
  cityPhase.textContent = period.phase;
  cityClockIcon.setAttribute('data-lucide', period.icon);
  schedulePhases.forEach((phase, index) => phase.classList.toggle('active-phase', index === period.schedule));
  timeModeButtons.forEach((button) => button.classList.toggle('active', button.dataset.timeMode === cityTimeMode));
  lucide.createIcons();
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
  const point = agentWaypoints[(Math.floor(Math.random() * agentWaypoints.length) + index) % agentWaypoints.length];
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
      agent.querySelector('.speech-bubble').textContent = lines[Math.floor(Math.random() * lines.length)];
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
  if (!cityMap.classList.contains('time-night') && document.visibilityState === 'hidden') return;
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

document.querySelector('.expand-action').addEventListener('click', () => openView('businesses'));

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
  lucide.createIcons();
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

const agentDialog = document.querySelector('#agent-dialog');
const agentForm = document.querySelector('#agent-form');
const agentName = document.querySelector('#agent-name');
const agentRole = document.querySelector('#agent-role');
const agentTask = document.querySelector('#agent-task');
const agentDepartment = document.querySelector('#agent-department');
const agentCount = document.querySelector('#agent-count');

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
  createdAgents.push({ name: agentName.value.trim(), role: agentRole.value.trim(), department: agentDepartment.value, primaryTask, status: 'probation' });
  localStorage.setItem('mkn-agent-candidates', JSON.stringify(createdAgents));
  const current = Number(localStorage.getItem('mkn-created-agents') || '0') + 1;
  localStorage.setItem('mkn-created-agents', String(current));
  agentCount.textContent = `${6 + current} active`;
  showToast(`${agentName.value.trim()} created with one focus-locked task.`);
});

const savedAgentCount = Number(localStorage.getItem('mkn-created-agents') || '0');
agentCount.textContent = `${6 + savedAgentCount} active`;

const connectionDialog = document.querySelector('#connection-dialog');
const connectionTitle = document.querySelector('#connection-title');
const connectionCopy = document.querySelector('#connection-copy');
const connectionDetails = {
  openai: { title: 'Configure OpenAI API', copy: '<p>OpenAI application access uses an API project key, not a ChatGPT password.</p><ul><li>Store the key as a private Render environment variable.</li><li>Never put it in browser code or GitHub.</li><li>Set project spend limits before enabling agents.</li></ul>' },
  etsy: { title: 'Connect Etsy', copy: '<p>Etsy uses OAuth 2.0 with explicit scopes.</p><ul><li>Start with a Seller App for your own shop.</li><li>Use read-only scopes first.</li><li>A private backend is required for token exchange and refresh.</li></ul>' },
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
  };
  approve.addEventListener('click', () => resolve('approved'));
  decline.addEventListener('click', () => resolve('declined'));
  const savedDecision = localStorage.getItem('mkn-validation-decision');
  if (savedDecision) resolve(savedDecision);
});

const reviewMemory = document.querySelector('#review-memory');
const memoryAlert = document.querySelector('#memory-alert');
const validationApprove = document.querySelector('.validation-request .approve-button');

function markMemoryReviewed() {
  reviewMemory.innerHTML = '<i data-lucide="check"></i><span>Prior experiment reviewed</span>';
  memoryAlert.classList.add('reviewed');
  if (!localStorage.getItem('mkn-validation-decision')) {
    validationApprove.disabled = false;
    validationApprove.title = '';
    validationApprove.innerHTML = '<i data-lucide="check"></i><span>Approve $10</span>';
  }
  lucide.createIcons();
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
}

staffingApprove.addEventListener('click', () => resolveStaffing('approved'));
staffingDecline.addEventListener('click', () => resolveStaffing('declined'));
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
}

opportunity0142Approve.addEventListener('click', () => resolveOpportunity0142('approved'));
opportunity0142Decline.addEventListener('click', () => resolveOpportunity0142('declined'));
const savedOpportunity0142 = localStorage.getItem('mkn-opportunity-0142-decision');
if (savedOpportunity0142) resolveOpportunity0142(savedOpportunity0142);

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

function speakAsAgent(agent, text) {
  const mapAgent = document.querySelector(`[data-agent-chat="${agent}"]`);
  if (!mapAgent) return;
  mapAgent.querySelector('.speech-bubble').textContent = text.slice(0, 90);
  mapAgent.classList.add('speaking');
  setTimeout(() => mapAgent.classList.remove('speaking'), 5000);
}

function runLocalCommand(command) {
  const normalized = command.toLowerCase().trim();
  const routes = [
    { terms: ['show agents', 'view agents', 'go to agents'], view: 'agents', reply: 'Opening the Employment Center and agent roster.' },
    { terms: ['show businesses', 'view businesses', 'go to business'], view: 'businesses', reply: 'Opening the Business District.' },
    { terms: ['government contract', 'contracting center', 'show government', 'sam.gov', 'sam gov'], view: 'businesses', office: 'government', reply: 'Opening the Government Contracting Center. Readiness must be verified before any bid is submitted.' },
    { terms: ['show approvals', 'view approvals', 'go to approvals'], view: 'approvals', reply: 'Opening your approval queue.' },
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
    return { handled: true, reply: 'City cash is $168.20. Two businesses and six agents are active. The 60-day mission has completed Goals 1 and 2.' };
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

async function submitCommand(command) {
  addConsoleMessage('Michh', command, true);
  const local = runLocalCommand(command);
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
    addConsoleMessage(data.mode === 'openai' ? 'Chief Director AI' : 'Director · Demo Mode', data.reply || data.error || 'No response received.');
  } catch {
    thinking.remove();
    addConsoleMessage('Director · Offline', 'The server is unavailable. Navigation commands still work locally.');
  }
}

commandLauncher.addEventListener('click', () => setConsole(!commandConsole.classList.contains('open')));
closeConsole.addEventListener('click', () => setConsole(false));
commandForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const command = commandInput.value.trim();
  if (!command) return;
  commandInput.value = '';
  submitCommand(command);
});
document.querySelectorAll('[data-command]').forEach((button) => button.addEventListener('click', () => submitCommand(button.dataset.command)));
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
let demoWallet = JSON.parse(localStorage.getItem('mkn-demo-wallet') || '{"balance":150,"transactions":[]}');

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

lucide.createIcons();

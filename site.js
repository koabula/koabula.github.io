'use strict';

const input = document.querySelector('#command');
const historyPane = document.querySelector('#history');
const terminalBody = document.querySelector('.terminal-main');
const completions = document.querySelector('#completions');
const commandHelp = {
  help: 'List commands',
  projects: 'Open-source repositories',
  socials: 'GitHub and email',
  clear: 'Clear the terminal',
  coffee: ''
};
const commands = [];
let historyIndex = 0;
let draft = '';

function listLinks(selector, output) {
  for (const link of document.querySelectorAll(selector)) {
    const row = document.createElement('div');
    const copy = document.createElement('a');
    copy.href = link.href;
    copy.textContent = link.textContent.trim();
    row.append(copy);
    output.append(row);
  }
}

function showHelp(output) {
  const list = document.createElement('dl');
  list.className = 'command-list';
  for (const [name, description] of Object.entries(commandHelp)) {
    const term = document.createElement('dt');
    term.textContent = name;
    const definition = document.createElement('dd');
    definition.textContent = description;
    list.append(term, definition);
  }
  output.append(list);
}

function printCommand(value) {
  const command = value.toLowerCase();
  if (command === 'clear') {
    historyPane.replaceChildren();
    return;
  }
  const echo = document.createElement('div');
  echo.className = 'cmd';
  const symbol = document.createElement('b');
  symbol.textContent = '➜ ~';
  echo.append(symbol, ' ' + value);
  const reply = document.createElement('div');
  reply.className = 'reply';
  if (command === 'help') showHelp(reply);
  else if (command === 'projects') listLinks('.projects a', reply);
  else if (command === 'socials' || command === 'social') listLinks('.socials a', reply);
  else if (command === 'coffee') reply.textContent = 'Making a coffee for you ...\nCompilation speed +200% (˶ᵔ ᵕ ᵔ˶) ☕';
  else if (command.startsWith('fuck')) reply.textContent = 'FUCK';
  else if (command.startsWith('hi') || command.startsWith('hello')) reply.textContent = 'Hello 👋';
  else reply.textContent = 'Unknown command. Try help.';
  historyPane.append(echo, reply);
  terminalBody.scrollTop = terminalBody.scrollHeight;
}

printCommand('help');
document.querySelector('#prompt').addEventListener('submit', event => {
  event.preventDefault();
  const value = input.value.trim();
  if (!value) return;
  commands.push(value);
  historyIndex = commands.length;
  draft = '';
  input.value = '';
  completions.textContent = '';
  printCommand(value);
});
document.querySelector('.terminal').addEventListener('click', event => {
  if (event.target.closest('a, input, label') || !window.getSelection().isCollapsed) return;
  input.focus({ preventScroll: true });
  terminalBody.scrollTop = terminalBody.scrollHeight;
});
input.addEventListener('input', () => { completions.textContent = ''; });
input.addEventListener('blur', () => { completions.textContent = ''; });
input.addEventListener('keydown', event => {
  if (event.key === 'Tab' && !event.shiftKey && !event.isComposing) {
    const prefix = input.value.trimStart().toLowerCase();
    if (!prefix || completions.textContent) return;
    const matches = Object.keys(commandHelp).filter(name => name.startsWith(prefix));
    if (!matches.length || (matches.length === 1 && matches[0] === input.value)) return;
    event.preventDefault();
    if (matches.length === 1) input.value = matches[0];
    else completions.textContent = matches.join('    ');
    terminalBody.scrollTop = terminalBody.scrollHeight;
    return;
  }
  if (!commands.length || !['ArrowUp', 'ArrowDown'].includes(event.key)) return;
  event.preventDefault();
  if (historyIndex === commands.length) draft = input.value;
  historyIndex = Math.min(commands.length, Math.max(0, historyIndex + (event.key === 'ArrowUp' ? -1 : 1)));
  input.value = commands[historyIndex] ?? draft;
  completions.textContent = '';
});

const dayMs = 86400000;
const cacheKey = 'koabula-contributions-v1';
const calendar = document.querySelector('#calendar');
const detail = document.querySelector('#day-detail');
const formatter = options => new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'UTC' });
const fullDate = formatter({ month: 'short', day: 'numeric', year: 'numeric' });
const monthName = formatter({ month: 'short' });
const dayTime = date => Date.parse(date + 'T00:00:00Z');
const bundledDays = bundledActivity.days.map(([count, level], index) => ({
  date: new Date(dayTime(bundledActivity.firstDate) + index * dayMs).toISOString().slice(0, 10),
  count, level
}));

function validDays(days) {
  if (!Array.isArray(days) || days.length < 365 || days.length > 371) return false;
  return days.every((day, index) => day && /^\d{4}-\d{2}-\d{2}$/.test(day.date) &&
    Number.isFinite(dayTime(day.date)) && (!index || dayTime(day.date) - dayTime(days[index-1].date) === dayMs) &&
    Number.isInteger(day.count) && day.count >= 0 && Number.isInteger(day.level) && day.level >= 0 && day.level <= 4);
}

function renderCalendar(days) {
  const offset = new Date(dayTime(days[0].date)).getUTCDay();
  const weeks = Math.ceil((days.length + offset) / 7);
  calendar.style.gridTemplateColumns = '25px repeat(' + weeks + ', minmax(0,1fr))';
  const grid = document.createDocumentFragment();
  function label(text, className, col, row) {
    const node = document.createElement('span');
    node.className = className;
    node.textContent = text;
    node.style.gridColumn = col;
    node.style.gridRow = row;
    grid.append(node);
  }
  [['Mon',3], ['Wed',5], ['Fri',7]].forEach(([name,row]) => label(name,'weekday',1,row));
  let lastMonthColumn = -5;
  days.forEach((day, index) => {
    const date = new Date(dayTime(day.date));
    const col = 2 + Math.floor((index + offset) / 7);
    if ((!index || date.getUTCDate() === 1) && col - lastMonthColumn >= 3 && col < weeks + 1) {
      label(monthName.format(date), 'month', col, 1);
      lastMonthColumn = col;
    }
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'day';
    cell.dataset.level = day.level;
    cell.dataset.index = index;
    cell.tabIndex = index === days.length - 1 ? 0 : -1;
    cell.style.gridColumn = col;
    cell.style.gridRow = 2 + date.getUTCDay();
    cell.title = fullDate.format(date) + ' · ' + day.count + (day.count === 1 ? ' contribution' : ' contributions');
    cell.setAttribute('aria-label', cell.title);
    grid.append(cell);
  });
  calendar.replaceChildren(grid);
  document.querySelector('#total').textContent = days.reduce((sum, day) => sum + day.count, 0).toLocaleString('en-US') + ' contributions';
  document.querySelector('#period').textContent = fullDate.format(dayTime(days[0].date)) + ' – ' + fullDate.format(dayTime(days.at(-1).date));
  const scroller = document.querySelector('#chart-scroll');
  scroller.scrollLeft = scroller.scrollWidth;
}

for (const event of ['pointerover', 'focusin', 'click']) {
  calendar.addEventListener(event, e => {
    if (!e.target.matches('.day')) return;
    detail.textContent = e.target.title;
    if (event === 'focusin') {
      calendar.querySelector('.day[tabindex="0"]').tabIndex = -1;
      e.target.tabIndex = 0;
    }
  });
}
calendar.addEventListener('keydown', event => {
  const move = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 };
  if (!event.target.matches('.day') || !Object.hasOwn(move, event.key)) return;
  event.preventDefault();
  const index = Number(event.target.dataset.index) + move[event.key];
  calendar.querySelector('[data-index="' + index + '"]')?.focus();
});

async function loadActivity() {
  let cached;
  try { cached = JSON.parse(localStorage.getItem(cacheKey)); } catch {}
  const useCache = validDays(cached?.days) && cached.days.at(-1).date >= bundledDays.at(-1).date;
  const current = useCache ? cached.days : bundledDays;
  renderCalendar(current);
  if (useCache && cached.updated <= Date.now() && Date.now() - cached.updated < dayMs) return;
  try {
    const response = await fetch('https://github-contributions-api.jogruber.de/v4/koabula?y=last', { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return;
    const { contributions: days } = await response.json();
    if (!validDays(days) || days.at(-1).date < current.at(-1).date) return;
    if (JSON.stringify(days) !== JSON.stringify(current)) renderCalendar(days);
    localStorage.setItem(cacheKey, JSON.stringify({ days, updated: Date.now() }));
  } catch {
    // The displayed snapshot remains usable offline or when storage is unavailable.
  }
}
loadActivity();

const fs = require('fs');
const vm = require('vm');

function extractScript(html) {
  const start = html.indexOf('(function () {');
  const end = html.lastIndexOf('})();');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Cannot locate mistakes page main IIFE');
  }
  return html.slice(start, end + '})();'.length);
}

function createHarness(nowIso) {
  const store = {};
  const elements = {};
  const created = [];
  function makeElement(id) {
    return elements[id] || (elements[id] = {
      id,
      value: '',
      textContent: '',
      innerHTML: '',
      style: {},
      classList: { toggle() {} },
      setAttribute() {},
      getAttribute(name) { return this[name]; },
      appendChild(child) { created.push(child); },
      remove() {},
      select() {},
      setSelectionRange() {},
      addEventListener() {},
      click() {}
    });
  }
  const ids = [
    'f-subject','f-type','f-topic','f-review','f-problem','f-answer','f-notes',
    'filter-bar','stats-row','stat-concept','stat-calc','stat-careless','stat-reading','stat-format','stat-memory',
    'review-panel','review-list','error-list','empty-state','empty-msg','zk-btn-export','ml-streak'
  ];
  ids.forEach(makeElement);
  const RealDate = Date;
  function MockDate(...args) {
    if (!(this instanceof MockDate)) return new RealDate(nowIso).toString();
    return args.length ? new RealDate(...args) : new RealDate(nowIso);
  }
  MockDate.UTC = RealDate.UTC;
  MockDate.parse = RealDate.parse;
  MockDate.now = () => new RealDate(nowIso).getTime();
  MockDate.prototype = RealDate.prototype;
  const context = {
    console,
    Date: MockDate,
    setTimeout(fn) { if (typeof fn === 'function') fn(); return 1; },
    requestAnimationFrame(fn) { if (typeof fn === 'function') fn(); },
    confirm() { return true; },
    Blob: function(parts, opts) { return { parts, opts }; },
    URL: { createObjectURL() { return 'blob:test'; }, revokeObjectURL() {} },
    FileReader: function() {},
    navigator: { clipboard: { writeText() { return Promise.resolve(); } } },
    localStorage: {
      get length() { return Object.keys(store).length; },
      key(i) { return Object.keys(store)[i] || null; },
      getItem(k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
      setItem(k, v) { store[k] = String(v); },
      removeItem(k) { delete store[k]; }
    },
    document: {
      readyState: 'complete',
      getElementById: makeElement,
      querySelectorAll() { return []; },
      createElement(tag) { return makeElement('created-' + tag + '-' + created.length); },
      body: makeElement('body'),
      addEventListener() {},
      execCommand() { return true; }
    }
  };
  context.window = context;
  context.globalThis = context;
  return { context, elements, store };
}

const html = fs.readFileSync('mistakes.html', 'utf8');
const script = extractScript(html);
const { context, elements, store } = createHarness('2026-06-04T09:00:00+08:00');
vm.runInNewContext(script, context, { filename: 'mistakes.html' });

function setForm(values) {
  Object.keys(values).forEach((id) => { elements[id].value = values[id]; });
}

setForm({
  'f-subject': 'math',
  'f-type': 'format',
  'f-topic': '函数图像压轴题',
  'f-review': 'tomorrow',
  'f-problem': '坐标轴单位没看清，导致图像交点写错',
  'f-answer': '先标关键点，再代入检验',
  'f-notes': '图像题先看坐标单位和定义域'
});
context.addError();
let mistakes = JSON.parse(store['zk-mistakes']);
if (mistakes.length !== 1) throw new Error('Expected one mistake');
if (mistakes[0].topic !== '函数图像压轴题') throw new Error('Topic not saved');
if (mistakes[0].reviewPlan !== 'tomorrow') throw new Error('Review plan not saved');
if (!elements['error-list'].innerHTML.includes('函数图像压轴题')) throw new Error('Topic not rendered in card');
if (String(elements['stat-format'].textContent) !== '1') throw new Error('Format stat not updated');

store['zk-mistakes'] = JSON.stringify([
  { id: 1, subject: 'physics', errorType: 'memory', topic: '欧姆定律', reviewPlan: 'ebbinghaus', problem: 'R=U/I 忘记单位', answer: 'Ω', notes: '', date: '2026-06-03' },
  { id: 2, subject: 'english', errorType: 'reading', topic: '完形填空', reviewPlan: 'weekly', problem: '上下文转折没看出', answer: 'however', notes: '', date: '2026-06-01' }
]);
context.setFilter('all');
if (elements['review-panel'].style.display !== 'block') throw new Error('Due review panel should be visible');
if (!elements['review-list'].innerHTML.includes('欧姆定律')) throw new Error('Due review item missing');
if (elements['review-list'].innerHTML.includes('完形填空')) throw new Error('Weekly item should not be due yet');
if (String(elements['stat-memory'].textContent) !== '1') throw new Error('Memory stat not updated');

store['zk-mistakes'] = JSON.stringify([
  { id: 3, subject: 'math', errorType: '\"><img src=x onerror=alert(1)>', topic: '<b>危险考点</b>', reviewPlan: '\"><svg onload=alert(1)>', problem: '<script>alert(1)</script>', answer: '<img src=x>', notes: '<u>x</u>', date: '<img src=x onerror=alert(1)>' }
]);
context.setFilter('all');
if (elements['error-list'].innerHTML.includes('<script>')) throw new Error('Problem field not escaped');
if (elements['error-list'].innerHTML.includes('<svg')) throw new Error('Injected svg tag leaked into card HTML');
if (elements['error-list'].innerHTML.includes('<img')) throw new Error('Injected image tag leaked into card HTML');

console.log('mistakes behavior tests passed');

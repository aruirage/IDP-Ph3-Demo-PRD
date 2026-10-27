import { marked } from '/vendor/marked.js';
import mermaid from '/vendor/mermaid.js';
import { enhanceDiagrams } from '/diagram-zoom.js';
import {createPrdVersionUi} from '/prd-version-ui.js';
import {createPrdReading} from './prd-reading.js';
import {enablePrototypeWindow} from './prototype-window.js';
import {createReviewCollaboration} from './prd-collaboration.js';
import {createCanvasEditor} from '/canvas-editor.js';

mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'loose', flowchart: { htmlLabels: false, useMaxWidth: false } });

const state = { annotationDraft:null, dragging:false, ignoreAnnotationClick:0, prototypeZoom:1, manifest: null, module: null, page: null, view: 'document', annotations: [], annotate: false, showAnnotations: false, selectedAnnotation: null, frame: null, prototypeExpanded: false, inspectorTab: 'prd', inspectorOpen: true, currentMarkdown: '', zoom: .6, canvasPositions: new Map(), snapshots: new Map(), editorDirty: false };
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const reading=createPrdReading({api,state,toast,selectModule,setView});
const collaboration=createReviewCollaboration({api,state,toast});
const prdVersions=createPrdVersionUi({api,state,getFile,renderDocument,toast});
const canvasEditor=createCanvasEditor({state,saveFile,redraw:updateCanvasGeometry,reload:renderCanvas,onRename:renderPageSelect,toast});

async function api(url, options) {
  const response = await fetch(url, options);
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || `HTTP ${response.status}`);
  return value;
}

async function getFile(path) {
  const result = await api(`/api/file?path=${encodeURIComponent(path)}`);
  state.snapshots.set(path, result.content);
  return result.content;
}

async function saveFile(path, content) {
  await api('/api/file', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path, content, expectedContent:state.snapshots.get(path) }) });
  state.snapshots.set(path, content);
  setStatus(`已保存 ${path}`);
  if(path.startsWith('prd/'))await prdVersions.refresh();
}

function setStatus(message) { $('#save-state').textContent = message; }
function toast(message) { const node = $('#toast'); node.textContent = message; node.classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => node.classList.remove('show'), 2400); }

async function boot() {
  state.manifest = await api('/api/manifest');
  $('#product-name').textContent = state.manifest.product.name;
  $('#product-type').textContent = `${state.manifest.product.type} / ${state.manifest.product.status}`;
  syncDeploymentUi();
  renderNav();
  bind();
  await selectModule(firstVisibleModule()?.id);
  await prdVersions.refresh();
  setInterval(refreshExternalChanges, 2500);
}

function syncDeploymentUi(){
  const readonly=state.manifest.deployment?.cloud&&!state.manifest.deployment.writable;
  let notice=document.querySelector('.prd-deployment-notice');
  if(readonly){if(!notice){notice=document.createElement('div');notice.className='prd-deployment-notice';document.querySelector('.topbar').after(notice)}notice.textContent='只读预览 · 连接持久化存储后可编辑、评论和发布。'}else notice?.remove();
  $('#edit-button').disabled=!!readonly;$('#edit-button').title=readonly?'连接持久化存储后可编辑':'';
}

function moduleKind(module) { return module.kind || 'prd'; }
function visibleModules() { return state.manifest.modules.filter((module) => !module.hidden); }
function firstVisibleModule() { return visibleModules().find((module) => moduleKind(module) === 'prd') || visibleModules()[0] || null; }
function moduleNavNumber(module) {
  if (module.navNumber) return module.navNumber;
  if (module.kind === 'process') return '00';
  const formalModules = state.manifest.modules.filter((item) => moduleKind(item) === 'prd');
  return String(formalModules.indexOf(module) + 1).padStart(2, '0');
}

function updateProcessToggle() {
  const processModules = state.manifest.modules.filter((module) => module.kind === 'process');
  const button = $('#process-toggle');
  button.hidden = processModules.length === 0;
  if (!processModules.length) return;
  const allHidden = processModules.every((module) => module.hidden);
  button.textContent = allHidden ? '显示过程产物' : '隐藏过程产物';
  button.classList.toggle('active', !allHidden);
  button.setAttribute('aria-pressed', String(!allHidden));
}

function renderNav() {
  const groups = [
    { title: '正式 PRD', kinds: ['prd'], details:false },
    { title: '功能详细说明 · 按页面', kinds: ['prd'], details:true },
    { title: '产品研究与参考', kinds: ['shaping', 'reference'] },
    { title: '作业过程', kinds: ['process'] },
  ];
  $('#nav-items').innerHTML = groups.map((group) => {
    const modules = visibleModules().filter((module) => group.kinds.includes(moduleKind(module)) && (group.details === undefined || (module.group === 'details') === group.details));
    if (!modules.length) return '';
    return `<section class="nav-section"><div class="nav-section-title">${group.title}</div>${modules.map((module) => `<button class="nav-item${module.group === 'details' && module.id !== 'chapter-06' ? ' nav-child' : ''}" data-module="${module.id}"><span class="nav-index">${escapeHtml(moduleNavNumber(module))}</span><span>${escapeHtml(module.title)}</span></button>`).join('')}</section>`;
  }).join('');
  $$('.nav-item').forEach((button) => button.addEventListener('click', () => selectModule(button.dataset.module)));
  updateProcessToggle();
}

async function toggleProcessModules() {
  const processModules = state.manifest.modules.filter((module) => module.kind === 'process');
  if (!processModules.length) return;
  const hide = processModules.some((module) => !module.hidden);
  processModules.forEach((module) => { module.hidden = hide; });
  await saveFile('interaction-prd.json', `${JSON.stringify(state.manifest, null, 2)}\n`);
  renderNav();
  if (state.module?.kind === 'process' && state.module.hidden) {
    const next = firstVisibleModule();
    if (next) await selectModule(next.id);
  }
  toast(hide ? '已隐藏过程产物，文件仍保留' : '已显示过程产物');
}

async function selectModule(id) {
  state.module = state.manifest.modules.find((item) => item.id === id);
  if (!state.module) return;
  $$('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.module === id));
  await renderDocument();
  renderPageSelect();
  renderChapterSelect();
  const isDetail=state.module.id.startsWith('detail-');
  const firstPage=isDetail?state.manifest.pages.find(page=>state.module.pages.includes(page.id)):null;
  if(firstPage)await selectPage(firstPage.id);
  else if(state.page)$('#page-select').value=state.page.id;
  $('#compare-button').disabled = !state.manifest.pages.length;
  const compareTab=document.querySelector('[data-view=prototype]');compareTab.disabled=!state.manifest.pages.length;compareTab.title='左右对照 PRD 和原型';
  $('#inspector-module-title').textContent=state.module.title;
  $('#compare-button').textContent = firstPage ? '对照原型' : '暂无原型';
  const kind = moduleKind(state.module);
  $('#document-context').textContent = state.module.title;
  $('#export-button').disabled = kind === 'process';
  $('#export-button').textContent = '下载 PRD';
  if (state.view === 'canvas') renderCanvas();
}

async function renderDocument(content) {
  await collaboration.markCurrent();
  content ??= await getFile(state.module.prd);
  state.currentMarkdown = content;
  await renderMarkdownInto($('#markdown'), content);
  await renderMarkdownInto($('#split-markdown'), content);
  reading.applyRole();
  await collaboration.annotateDocument();
}

async function renderMarkdownInto(container, content) {
  if (!container) return;
  container.innerHTML = marked.parse(content);
  container.querySelectorAll('table').forEach(table => {
    const headings = [...table.querySelectorAll('thead th')].map(cell => cell.textContent.trim());
    table.querySelectorAll('tbody tr').forEach(row => [...row.children].forEach((cell,index) => {
      cell.dataset.columnLabel = headings[index] || '';
    }));
  });
  container.querySelectorAll('pre > code.language-mermaid').forEach((code) => {
    const div = document.createElement('div'); div.className = 'mermaid'; div.textContent = code.textContent; code.parentElement.replaceWith(div);
  });
  const diagrams = [...container.querySelectorAll('.mermaid')];
  // Mermaid measures SVG text; display:none panels cannot provide valid geometry.
  const staging = document.createElement('div');
  Object.assign(staging.style,{position:'absolute',left:'-100000px',top:'0',width:'1400px',display:'block',visibility:'visible',pointerEvents:'none'});
  document.body.append(staging);
  const anchors=diagrams.map(diagram=>{const anchor=document.createComment('diagram');diagram.before(anchor);staging.append(diagram);return anchor});
  try { await mermaid.run({ nodes: diagrams }); } catch (error) { toast(`Mermaid: ${error.message}`); }
  finally {diagrams.forEach((diagram,index)=>anchors[index].replaceWith(diagram));staging.remove();}
  enhanceDiagrams(container);
}

function renderPageSelect(){const pages=state.manifest.pages;$('#page-select').innerHTML=pages.map(page=>`<option value="${page.id}">${escapeHtml(page.title)}</option>`).join('')}
function renderChapterSelect(){const chapters=state.manifest.modules.filter(module=>module.kind==='prd'&&!module.hidden);$('#prd-section-select').innerHTML=chapters.map(module=>`<option value="${module.id}">${escapeHtml(module.navNumber?module.navNumber+' '+module.title:module.title)}</option>`).join('');$('#prd-section-select').value=state.module.id}

async function selectPage(id) {
  if (state.module?.group === 'details' && !state.module.pages.includes(id)) {
    const target = state.manifest.modules.find(module => module.id === state.manifest.pages.find(page=>page.id===id)?.moduleId) || state.manifest.modules.find(module => module.group === 'details' && module.id!=='chapter-06' && module.pages.includes(id));
    if (target) return selectModule(target.id);
  }
  state.page = state.manifest.pages.find((item) => item.id === id);
  if (!state.page) return;
  state.annotate = false;
  state.annotationDraft = null;
  state.showAnnotations = false;
  state.selectedAnnotation = null;
  state.frame = null;
  
  $('#page-select').value = id;
  const standalone=$('#open-prototype-tab');standalone.href='/content/'+encodeURI(state.page.file);standalone.hidden=false;standalone.title=state.page.title+' · 完整原型';
  $('#viewport-label').textContent = `${state.page.device} / ${state.page.viewport.width} × ${state.page.viewport.height}`;
  renderPrototype();
}

function clearPrototype() {
  state.page = null; state.annotations = []; state.frame = null; state.showAnnotations = false; state.selectedAnnotation = null;
  
  $('#open-prototype-tab').hidden=true;
  $('#prototype-stage').innerHTML = '<div class="empty">该模块没有原型页。</div>';
  
}

function renderPrototype() {
  if (!state.page) return clearPrototype();
  const stage = $('#prototype-stage');
  const available = Math.max(560, stage.clientWidth - 40);
  const scale = Math.min(1, available / state.page.viewport.width, 660 / state.page.viewport.height) * state.prototypeZoom;
  if($('#prototype-zoom-value')) $('#prototype-zoom-value').textContent=Math.round(state.prototypeZoom*100)+'%';
  const width = state.page.viewport.width * scale, height = state.page.viewport.height * scale;
  stage.innerHTML = `<div class="frame-wrap" style="width:${width}px;height:${height}px"><iframe title="${escapeHtml(state.page.title)}" src="/content/${encodeURI(state.page.file)}?v=${Date.now()}" style="width:${state.page.viewport.width}px;height:${state.page.viewport.height}px;transform:scale(${scale});transform-origin:top left"></iframe></div>`;
  const frame = stage.querySelector('iframe');
  state.frame = frame;
  frame.addEventListener('load', () => {
    bindPrototypeNavigation(frame);
    try {
      const relative = decodeURIComponent(frame.contentWindow.location.pathname).replace(/^\/content\//, '');
      const navigated = state.manifest.pages.find((page) => page.file === relative);
      if (navigated && navigated.id !== state.page.id) selectPage(navigated.id);
    } catch {}
    
  });
  
}

function resizePrototype(){if(!state.frame||!state.page)return;const stage=$('#prototype-stage'),available=Math.max(560,stage.clientWidth-40),scale=Math.min(1,available/state.page.viewport.width,660/state.page.viewport.height)*state.prototypeZoom,wrap=stage.querySelector('.frame-wrap');wrap.style.width=state.page.viewport.width*scale+'px';wrap.style.height=state.page.viewport.height*scale+'px';state.frame.style.transform=`scale(${scale})`;$('#prototype-zoom-value').textContent=Math.round(state.prototypeZoom*100)+'%';}

function bindPrototypeNavigation(frame) {
  frame.contentDocument?.addEventListener('click', (event) => {
    const target = event.target.closest('[data-nav]');
    if (!target) return;
    const next = state.manifest.pages.find((page) => page.id === target.dataset.nav);
    if (next) { const module = state.manifest.modules.find((item) => item.id === next.moduleId); if (module.id !== state.module.id) selectModule(module.id).then(() => { setView('prototype'); selectPage(next.id); }); else selectPage(next.id); }
  });
}

function setView(view) {
  const enteringPrototype=view==='prototype'&&state.view!=='prototype';
  state.view = view;
  document.body.classList.toggle('view-prototype',view==='prototype');
  document.dispatchEvent(new CustomEvent('prd-view-change',{detail:view}));
  $$('.view').forEach((node) => node.classList.toggle('active', node.id === `${view}-view`));
  $$('.tab').forEach((node) => node.classList.toggle('active', node.dataset.view === view));
  $$('.tab').forEach(node=>node.setAttribute('aria-selected',String(node.dataset.view===view)));
  $('#review-tools').hidden=view==='canvas';
  $('.prd-role-picker').hidden=view==='canvas';
  if (view === 'prototype') {updateReviewLayout();if(enteringPrototype&&!state.module?.id.startsWith('detail-')){const page=state.page||state.manifest.pages[0];if(page)selectModule(page.moduleId);else clearPrototype()}else renderPrototype()}
  if (view === 'canvas') renderCanvas();
}

function setInspectorTab(tab) {
  state.inspectorTab = tab;
  state.inspectorOpen = true;
  updateReviewLayout();
}

function updateReviewLayout() {
  const layout = $('#review-layout'); if (!layout) return;
  layout.classList.toggle('expanded', state.prototypeExpanded);
  layout.classList.toggle('inspector-open', !state.prototypeExpanded || state.inspectorOpen);
  $$('.inspector-tab').forEach((button) => button.classList.toggle('active', button.dataset.inspector === state.inspectorTab));
  $('#inspector-prd').classList.toggle('active', state.inspectorTab === 'prd');
}

function renderCanvas() {
  const pages = state.manifest.pages;
  ensureCanvasPositions();
  const canvas = $('#canvas');
  canvas.style.transform = `scale(${state.zoom})`;
  const cards = pages.map((page) => `<article class="canvas-card" data-page="${page.id}"><header><strong>${escapeHtml(page.title)}</strong><span class="canvas-card-tools"><span class="mono">${page.device}</span><button data-rename-page type="button" aria-label="修改原型名称">✎</button></span></header><iframe src="/content/${encodeURI(page.file)}"></iframe></article>`).join('');
  canvas.innerHTML = `<svg><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#666"/></marker></defs><g id="canvas-relations"></g></svg>${cards}`;
  canvas.querySelectorAll('.canvas-card').forEach((card) => {
    bindCanvasDrag(card);
    canvasEditor.bindCard(card);
    card.addEventListener('click', async (event) => {
      if(event.target.closest('header'))return;
      if (card.dataset.dragged === 'true') { card.dataset.dragged = 'false'; return; }
      const page = state.manifest.pages.find((p) => p.id === card.dataset.page); await selectModule(page.moduleId); await selectPage(page.id); setView('prototype');
    });
  });
  canvasEditor.bind();
  updateCanvasGeometry();
  $('#zoom-label').textContent = `${Math.round(state.zoom * 100)}%`;
}

function ensureCanvasPositions() {
  const pages = state.manifest.pages;
  const ids = new Set(pages.map((page) => page.id));
  const stale = state.canvasPositions.size !== pages.length || [...state.canvasPositions.keys()].some((id) => !ids.has(id));
  if (!stale) return;
  const saved = new Map(pages.map((page) => [page.id, { x: Number(page.canvas?.x), y: Number(page.canvas?.y) }]));
  state.canvasPositions = canvasPositionsValid(saved, pages) ? saved : computeAutoLayout();
  if (!canvasPositionsValid(saved, pages)) setStatus('检测到画布坐标缺失或重叠，已自动排列');
}

function canvasPositionsValid(positions, pages) {
  const cardW = 440, cardH = 300, gap = 40;
  if (pages.some((page) => { const p = positions.get(page.id); return !p || !Number.isFinite(p.x) || !Number.isFinite(p.y) || p.x < 0 || p.y < 0; })) return false;
  for (let index = 0; index < pages.length; index++) for (let next = index + 1; next < pages.length; next++) {
    const a = positions.get(pages[index].id), b = positions.get(pages[next].id);
    if (a.x < b.x + cardW + gap && a.x + cardW + gap > b.x && a.y < b.y + cardH + gap && a.y + cardH + gap > b.y) return false;
  }
  return true;
}

function computeAutoLayout() {
  const pages = state.manifest.pages;
  const pageOrder = new Map(pages.map((page, index) => [page.id, index]));
  const outgoing = new Map(pages.map((page) => [page.id, []]));
  const indegree = new Map(pages.map((page) => [page.id, 0]));
  for (const relation of state.manifest.relations) if (outgoing.has(relation.from) && indegree.has(relation.to)) { outgoing.get(relation.from).push(relation.to); indegree.set(relation.to, indegree.get(relation.to) + 1); }
  const rank = new Map();
  const queue = pages.filter((page) => indegree.get(page.id) === 0).map((page) => page.id);
  if (!queue.length && pages[0]) queue.push(pages[0].id);
  for (const id of queue) rank.set(id, 0);
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const id = queue[cursor];
    for (const target of outgoing.get(id) || []) {
      rank.set(target, Math.max(rank.get(target) || 0, (rank.get(id) || 0) + 1));
      indegree.set(target, indegree.get(target) - 1);
      if (indegree.get(target) === 0) queue.push(target);
    }
  }
  const maxRank = Math.max(0, ...rank.values());
  for (const page of pages) if (!rank.has(page.id)) rank.set(page.id, maxRank + 1);
  const columns = new Map();
  for (const page of pages) { const value = rank.get(page.id); if (!columns.has(value)) columns.set(value, []); columns.get(value).push(page); }
  const positions = new Map();
  for (const [column, items] of [...columns.entries()].sort((a, b) => a[0] - b[0])) {
    items.sort((a, b) => pageOrder.get(a.id) - pageOrder.get(b.id));
    items.forEach((page, row) => positions.set(page.id, { x: 80 + column * 620, y: 80 + row * 400 }));
  }
  return positions;
}

function updateCanvasGeometry() {
  const cardW = 440, cardH = 300;
  const canvas = $('#canvas'); if (!canvas) return;
  const positions = [...state.canvasPositions.values()];
  const width = Math.max(1200, ...positions.map((p) => p.x + cardW + 120));
  const height = Math.max(700, ...positions.map((p) => p.y + cardH + 120));
  canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
  const svg = canvas.querySelector('svg'); svg.setAttribute('width', width); svg.setAttribute('height', height);
  for (const card of canvas.querySelectorAll('.canvas-card')) { const p = state.canvasPositions.get(card.dataset.page); card.style.left = `${p.x}px`; card.style.top = `${p.y}px`; }
  canvasEditor.renderRelations();
}

function bindCanvasDrag(card) {
  const handle = card.querySelector('header');
  handle.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || event.target.closest('button,[contenteditable="true"]')) return;
    const origin = { ...state.canvasPositions.get(card.dataset.page) };
    const start = { x: event.clientX, y: event.clientY };
    let moved = false;
    card.classList.add('dragging');
    const move = (next) => {
      const dx = (next.clientX - start.x) / state.zoom, dy = (next.clientY - start.y) / state.zoom;
      if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
      state.canvasPositions.set(card.dataset.page, { x: Math.max(0, Math.round(origin.x + dx)), y: Math.max(0, Math.round(origin.y + dy)) });
      updateCanvasGeometry();
    };
    const up = async () => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); card.classList.remove('dragging');
      if (moved) { card.dataset.dragged = 'true'; await persistCanvasPositions(); }
    };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up, { once: true });
  });
}

async function persistCanvasPositions() {
  for (const page of state.manifest.pages) page.canvas = { ...state.canvasPositions.get(page.id) };
  const content = JSON.stringify(state.manifest, null, 2) + '\n';
  await saveFile('interaction-prd.json', content);
  toast('画布布局已保存');
}

async function autoLayoutCanvas() {
  state.canvasPositions = computeAutoLayout();
  renderCanvas();
  await persistCanvasPositions();
}

function editorOptions() {
  const options = [{ label: `文档 / ${state.module.title}`, path: state.module.prd }];
  if (state.page&&!state.manifest.deployment?.cloud) { options.push({ label: `HTML / ${state.page.title}`, path: state.page.file });  }
  return options;
}

async function openEditor() {
  const options = editorOptions();
  $('#editor-file').innerHTML = options.map((item) => `<option value="${item.path}">${escapeHtml(item.label)}</option>`).join('');
  $('#editor-content').value = await getFile(options[0].path); state.editorDirty = false; $('#editor').showModal();
}

async function loadEditorFile() { $('#editor-content').value = await getFile($('#editor-file').value); state.editorDirty = false; }

async function saveEditor() {
  const path = $('#editor-file').value, content = $('#editor-content').value;
  await saveFile(path, content); state.editorDirty = false;
  if (path === state.module.prd) await renderDocument(content);
  if (state.page && path === state.page.file) renderPrototype();
  toast('已保存并更新视图');
}

function downloadBlob(blob,name){const link=document.createElement('a'),url=URL.createObjectURL(blob);link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
let downloadDialog;
async function exportModule(){
 if(state.editorDirty){toast('请先保存编辑内容，再下载PRD');return}
 if(!downloadDialog){downloadDialog=document.createElement('dialog');downloadDialog.className='prd-download-dialog';downloadDialog.innerHTML='<div class="prd-version-heading"><strong>下载 PRD</strong><button class="button" data-close>取消</button></div><form><label>版本<select name="version"></select></label><label>阅读视角<select name="role"><option value="all">全局</option><option value="frontend">前端</option><option value="backend">后端</option><option value="test">测试</option></select></label><label>文件格式<select name="format"><option value="html">HTML 网页（含流程图）</option><option value="md">Markdown（.md）</option></select></label><label>范围<select name="scope"><option value="all">整份PRD</option><option value="module">当前章节</option></select></label><p>HTML可直接阅读；Markdown保留流程图源代码。</p><div class="prd-version-footer"><button class="button primary" type="submit">下载</button></div></form>';document.body.append(downloadDialog);downloadDialog.querySelector('[data-close]').onclick=()=>downloadDialog.close()}
 const status=await api('/api/prd-history'),version=downloadDialog.querySelector('[name=version]');version.replaceChildren();for(const entry of status.entries.filter(e=>e.kind==='publish')){const option=document.createElement('option');option.value=entry.id;option.textContent='V'+entry.version+' · '+new Date(entry.createdAt).toLocaleDateString();version.append(option)}const draft=document.createElement('option');draft.value='draft';draft.textContent='最新草稿';version.append(draft);downloadDialog.querySelector('[name=role]').value=$('#prd-role-select').value;downloadDialog.showModal();
 const module=state.module;
 downloadDialog.querySelector('form').onsubmit=async event=>{event.preventDefault();const form=event.target,submit=form.querySelector('[type=submit]');submit.disabled=true;submit.textContent='生成中…';let staging;try{const role=form.elements.role.value,data=await api('/api/prd-download',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({version:form.elements.version.value,scope:form.elements.scope.value,path:module.prd})});if(form.elements.format.value==='md'){const roleName={all:'全局',frontend:'前端',backend:'后端',test:'测试'}[role],markdown='<!-- '+data.version+' · '+roleName+'视角 -->\n\n'+reading.roleMarkdown(data.content,role);downloadBlob(new Blob([markdown],{type:'text/markdown;charset=utf-8'}),(data.title+'-'+data.version+'-'+roleName).replace(/[\\/:*?"<>|]/g,'-')+'.md');downloadDialog.close();toast('PRD已下载');return}staging=document.createElement('article');staging.className='markdown';Object.assign(staging.style,{position:'absolute',left:'-100000px',top:'0',width:'1100px'});document.body.append(staging);await renderMarkdownInto(staging,data.content);reading.applyRoleTo(staging,role);staging.querySelectorAll('.diagram-viewer').forEach(viewer=>{const diagram=viewer.querySelector('.mermaid');if(diagram)viewer.replaceWith(diagram)});staging.querySelectorAll('script,iframe,object,embed,.prd-comment-pin').forEach(n=>n.remove());for(const node of staging.querySelectorAll('*'))for(const attr of [...node.attributes])if(/^on/i.test(attr.name)||(/^(href|src)$/i.test(attr.name)&&/^javascript:/i.test(attr.value)))node.removeAttribute(attr.name);const zoom=(await(await fetch('/diagram-zoom.js')).text()).replace('export function enhanceDiagrams','function enhanceDiagrams'),styles=await(await fetch('/styles.css')).text(),roleName={all:'全局',frontend:'前端',backend:'后端',test:'测试'}[role],html='<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escapeHtml(data.title)+'</title><style>'+styles+'body{min-width:0;padding:24px}.markdown{max-width:1100px;margin:auto}.download-meta{max-width:1100px;margin:0 auto 20px;color:#667085;font-size:14px}.mermaid{overflow:auto}.mermaid svg{max-width:100%;height:auto}</style><body><p class="download-meta">'+escapeHtml(data.version+' · '+roleName+'视角')+'</p><article class="markdown" data-role="'+role+'">'+staging.innerHTML+'</article><script>'+zoom+';enhanceDiagrams(document);<\/script></body></html>';downloadBlob(new Blob([html],{type:'text/html;charset=utf-8'}),(data.title+'-'+data.version+'-'+roleName).replace(/[\\/:*?"<>|]/g,'-')+'.html');downloadDialog.close();toast('PRD已下载')}catch(error){toast('下载失败：'+error.message)}finally{staging?.remove();submit.disabled=false;submit.textContent='下载'}}
}
async function captureCurrentPrototype(){const button=$('#capture-prototype-button');if(button.disabled||!state.frame||!state.page)return;button.disabled=true;button.textContent='截图中…';try{const frameWindow=state.frame.contentWindow,frameDocument=state.frame.contentDocument;await inlineFrameStyles(frameDocument);await waitForFrameAssets(frameWindow,frameDocument);const html2canvas=await loadFrameHtml2Canvas(frameWindow,frameDocument),canvas=await html2canvas(frameDocument.body,{width:frameWindow.innerWidth,height:frameWindow.innerHeight,windowWidth:frameWindow.innerWidth,windowHeight:frameWindow.innerHeight,scrollX:frameWindow.scrollX,scrollY:frameWindow.scrollY,scale:1,useCORS:true,allowTaint:false,backgroundColor:'#fff',logging:false});const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('图片生成失败');downloadBlob(blob,state.page.id+'-'+Date.now()+'.png');toast('原型截图已下载')}catch(error){toast('截图失败：'+error.message)}finally{button.disabled=false;button.textContent='截图'}}

function capturePage(page) {
  return new Promise((resolve, reject) => {
    const frame = document.createElement('iframe'); frame.className = 'capture-frame'; frame.width = page.viewport.width; frame.height = page.viewport.height; frame.src = `/content/${encodeURI(page.file)}?capture=${Date.now()}`; document.body.appendChild(frame);
    frame.onload = async () => {
      try {
        const frameWindow = frame.contentWindow, frameDocument = frame.contentDocument;
        await inlineFrameStyles(frameDocument);
        await waitForFrameAssets(frameWindow, frameDocument);
        const html2canvas = await loadFrameHtml2Canvas(frameWindow, frameDocument);
        frameWindow.scrollTo(0, 0);
        const background = frameWindow.getComputedStyle(frameDocument.body).backgroundColor || '#ffffff';
        const canvas = await html2canvas(frameDocument.body, { width:page.viewport.width, height:page.viewport.height, windowWidth:page.viewport.width, windowHeight:page.viewport.height, scrollX:0, scrollY:0, x:0, y:0, scale:1, useCORS:true, allowTaint:false, backgroundColor:background, logging:false });
        resolve(canvas.toDataURL('image/png'));
      } catch (error) { reject(error); } finally { frame.remove(); }
    };
    frame.onerror = () => { frame.remove(); reject(new Error(`无法加载 ${page.title}`)); };
  });
}

async function inlineFrameStyles(frameDocument) {
  const links = [...frameDocument.querySelectorAll('link[rel="stylesheet"]')];
  for (const link of links) {
    const response = await fetch(link.href, { cache:'no-store' });
    if (!response.ok) throw new Error(`无法读取原型样式：${link.href}`);
    const css = rebaseCssUrls(await response.text(), link.href);
    const style = frameDocument.createElement('style');
    style.dataset.exportStylesheet = link.href;
    style.textContent = css;
    link.after(style);
  }
}

function rebaseCssUrls(css, stylesheetUrl) {
  return css.replace(/url\(\s*(['"]?)([^'"\)]+)\1\s*\)/g, (match, quote, value) => {
    const resource = value.trim();
    if (!resource || /^(data:|blob:|https?:|\/)/i.test(resource)) return match;
    return `url("${new URL(resource, stylesheetUrl).href}")`;
  });
}

async function waitForFrameAssets(frameWindow, frameDocument) {
  await frameDocument.fonts?.ready;
  await Promise.all([...frameDocument.images].map(async (image) => {
    if (image.complete) { try { await image.decode?.(); } catch {} return; }
    await new Promise((resolve) => { image.addEventListener('load', resolve, { once:true }); image.addEventListener('error', resolve, { once:true }); });
  }));
  await new Promise((resolve) => frameWindow.requestAnimationFrame(() => frameWindow.requestAnimationFrame(resolve)));
}

function loadFrameHtml2Canvas(frameWindow, frameDocument) {
  if (frameWindow.html2canvas) return Promise.resolve(frameWindow.html2canvas);
  return new Promise((resolve, reject) => {
    const script = frameDocument.createElement('script');
    script.src = '/vendor/html2canvas.umd.js';
    script.onload = () => frameWindow.html2canvas ? resolve(frameWindow.html2canvas) : reject(new Error('截图组件未初始化'));
    script.onerror = () => reject(new Error('无法加载截图组件'));
    frameDocument.head.appendChild(script);
  });
}

async function refreshExternalChanges() {
  if(await collaboration.checkLatest())return;
  if (!state.module || state.editorDirty || $('#editor').open || canvasEditor.isBusy()) return;
  try {
    const manifest = await api('/api/manifest');
    if (JSON.stringify(manifest) !== JSON.stringify(state.manifest)) { const moduleId = state.module.id; state.manifest = manifest; syncDeploymentUi(); await prdVersions.refresh(); state.canvasPositions = new Map(); renderNav(); const current = manifest.modules.find((module) => module.id === moduleId && !module.hidden); await selectModule(current?.id || firstVisibleModule()?.id); toast('已加载 Agent 更新的项目结构'); return; }
    const watched = [state.module.prd, state.page?.file].filter(Boolean);
    for (const path of watched) {
      const result = await api(`/api/file?path=${encodeURIComponent(path)}`);
      if (state.snapshots.has(path) && state.snapshots.get(path) !== result.content) {
        state.snapshots.set(path, result.content);
        if (path === state.module.prd) {await renderDocument(result.content);await prdVersions.refresh();}
        if (state.page && path === state.page.file) renderPrototype();
        setStatus('已加载 Agent 更新');
      }
    }
  } catch (error) { setStatus(`同步失败：${error.message}`); }
}

function bind() {
  $$('.tab').forEach((button) => button.addEventListener('click', () => setView(button.dataset.view)));
  enablePrototypeWindow(resizePrototype);
  $('#page-select').addEventListener('change',event=>{const page=state.manifest.pages.find(p=>p.id===event.target.value);if(page)selectModule(page.moduleId)});
  $('#prd-section-select').addEventListener('change',event=>selectModule(event.target.value));
  $('#compare-button').addEventListener('click', () => { if (state.page) { state.prototypeExpanded = false; state.inspectorOpen = true; state.inspectorTab = 'prd'; setView('prototype'); } });
  $('#exit-compare').addEventListener('click', () => setView('document'));
  $$('.inspector-tab').forEach((button) => button.addEventListener('click', () => setInspectorTab(button.dataset.inspector)));
  $('#prototype-zoom-in').onclick=()=>{state.prototypeZoom=Math.min(2,state.prototypeZoom+.1);resizePrototype()};$('#prototype-zoom-out').onclick=()=>{state.prototypeZoom=Math.max(.5,state.prototypeZoom-.1);resizePrototype()};
  $('#process-toggle').addEventListener('click', toggleProcessModules);
  $('#edit-button').addEventListener('click', openEditor);  $('#editor-file').addEventListener('change', loadEditorFile); $('#save-editor').addEventListener('click', (event) => { event.preventDefault(); saveEditor().catch(error=>toast(error.message)); });
  $('#editor-content').addEventListener('input', () => { state.editorDirty = true; });
  $('#export-button').addEventListener('click',()=>exportModule().catch(error=>toast(error.message)));
  $('#capture-prototype-button').addEventListener('click',captureCurrentPrototype);
  $('#auto-layout').addEventListener('click', autoLayoutCanvas);
  $('#zoom-in').addEventListener('click', () => { state.zoom = Math.min(1, state.zoom + .1); renderCanvas(); });
  $('#zoom-out').addEventListener('click', () => { state.zoom = Math.max(.3, state.zoom - .1); renderCanvas(); });
  window.addEventListener('message', async (event) => {
    if (event.origin !== window.location.origin || event.source !== state.frame?.contentWindow || event.data?.type !== 'interaction-prd:navigate') return;
    const next = state.manifest.pages.find((page) => page.id === event.data.pageId);
    if (!next) {
      state.annotations = []; state.annotationDraft = null; state.annotate = false;
       
      return;
    }
    const showAnnotations = state.showAnnotations;
    const module = state.manifest.modules.find(item => item.id === next.moduleId)
      || state.manifest.modules.find(item => item.pages.includes(next.id));
    if (module && !state.module.pages.includes(next.id)) await selectModule(module.id);
    await selectPage(next.id);
    state.showAnnotations = showAnnotations;
     
    setView('prototype');
  });
  window.addEventListener('resize', () => { if (state.view === 'prototype') renderPrototype(); });
}

function escapeHtml(value='') { return String(value).replace(/[&<>"]/g, (character) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[character])); }

boot().catch((error) => { document.body.innerHTML = `<pre style="padding:32px">${escapeHtml(error.stack || error.message)}</pre>`; });

/* ============================================
   STORY BRAIN — app.js
   All state in localStorage under key: storybrain_v1
   ============================================ */

'use strict';

// ═══════════════════════════════════════════
// STATE & PERSISTENCE
// ═══════════════════════════════════════════

const STORAGE_KEY = 'storybrain_v1';

const defaultState = () => ({
  projects: [],
  characters: [],     // global pool; each character has projectId (or 'universe')
  worldEntries: [],   // locations, magic, factions, timeline
  universe: {         // shared universe metadata
    name: 'My Universe',
    notes: ''
  },
  dailyGoal: {
    target: 500,
    todayCount: 0,
    lastDate: ''
  },
  deletedItems: [],   // trash
  archivedItems: [],  // archive
});

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    // merge missing keys from defaultState
    return Object.assign(defaultState(), parsed);
  } catch (e) {
    return defaultState();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    showAutosave();
  } catch (e) {
    showToast('Storage error — data may not save.', 'error');
  }
}

let state = loadState();

// Reset daily word count if new day
(function checkDailyReset() {
  const today = new Date().toDateString();
  if (state.dailyGoal.lastDate !== today) {
    state.dailyGoal.todayCount = 0;
    state.dailyGoal.lastDate = today;
    saveState();
  }
})();

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function now() {
  return new Date().toISOString();
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function wordCount(text = '') {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function escHtml(s = '') {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function totalWordCount(projectId) {
  if (!projectId) return 0;
  const proj = state.projects.find(p => p.id === projectId);
  if (!proj) return 0;
  let total = 0;
  (proj.acts || []).forEach(act => {
    (act.chapters || []).forEach(ch => {
      (ch.scenes || []).forEach(sc => {
        total += wordCount(sc.content || '');
      });
    });
  });
  return total;
}

// ═══════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════

let currentPage = 'dashboard';

function navigate(page) {
  currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.classList.add('active');

  const navEl = document.querySelector(`[data-page="${page}"]`);
  if (navEl) navEl.classList.add('active');

  closeDropdowns();
  renderPage(page);
}

function renderPage(page) {
  switch (page) {
    case 'dashboard':    renderDashboard();   break;
    case 'editor':       renderEditor();      break;
    case 'characters':   renderCharacters();  break;
    case 'atlas':        renderAtlas();       break;
    case 'archive':      renderArchive();     break;
    case 'trash':        renderTrash();       break;
  }
  updateBadges();
}

// ═══════════════════════════════════════════
// BADGES
// ═══════════════════════════════════════════

function updateBadges() {
  const set = (id, count) => {
    const el = document.getElementById(id);
    if (el) el.textContent = count || '';
  };
  set('badge-projects',   state.projects.length);
  set('badge-characters', state.characters.length);
  set('badge-archive',    state.archivedItems.length);
  set('badge-trash',      state.deletedItems.length);
}

// ═══════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════

function renderDashboard() {
  // Stats
  const totalWords = state.projects.reduce((s, p) => s + totalWordCount(p.id), 0);
  document.getElementById('stat-projects').textContent  = state.projects.length;
  document.getElementById('stat-words').textContent     = totalWords.toLocaleString();
  document.getElementById('stat-chars').textContent     = state.characters.length;
  document.getElementById('stat-entries').textContent   = state.worldEntries.length;

  // Daily goal
  const dg = state.dailyGoal;
  const dailyPct = Math.min(100, Math.round((dg.todayCount / (dg.target || 500)) * 100));
  document.getElementById('daily-progress-fill').style.width  = dailyPct + '%';
  document.getElementById('daily-progress-text').textContent  =
    `${dg.todayCount.toLocaleString()} / ${(dg.target || 500).toLocaleString()} words today (${dailyPct}%)`;

  // Projects grid
  const container = document.getElementById('projects-grid');
  const search = (document.getElementById('dashSearch') || {}).value || '';
  const genreFilter = (document.getElementById('genreFilter') || {}).value || '';

  let projects = [...state.projects];

  if (search) {
    const q = search.toLowerCase();
    projects = projects.filter(p =>
      p.title.toLowerCase().includes(q) ||
      (p.genre || '').toLowerCase().includes(q) ||
      (p.synopsis || '').toLowerCase().includes(q)
    );
  }
  if (genreFilter) {
    projects = projects.filter(p => p.genre === genreFilter);
  }

  if (projects.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">📚</div>
        <div class="empty-title">${state.projects.length === 0 ? 'No projects yet' : 'No projects match your search'}</div>
        <div class="empty-desc">${state.projects.length === 0 ? 'Create your first novel to get started.' : 'Try a different search or filter.'}</div>
        ${state.projects.length === 0 ? '<div class="empty-action"><button class="btn btn-primary" onclick="openNewProjectModal()">＋ New Project</button></div>' : ''}
      </div>`;
    return;
  }

  container.innerHTML = projects.map(p => {
    const wc = totalWordCount(p.id);
    const target = p.wordTarget || 80000;
    const pct = Math.min(100, Math.round((wc / target) * 100));
    const charCount = state.characters.filter(c => c.projectId === p.id || (p.universeLinked && c.projectId === 'universe')).length;

    return `
    <div class="card project-card" onclick="handleProjectCardClick('${p.id}', event)">
      <div class="project-card-accent" style="background: linear-gradient(90deg, ${p.color1 || '#818cf8'}, ${p.color2 || '#a78bfa'})"></div>
      <div class="project-card-body">
        <div class="project-card-header">
          <div class="project-card-title">${escHtml(p.title)}</div>
          <div class="project-card-menu">
            <button class="card-menu-btn" onclick="toggleDropdown('dd-${p.id}', event)" title="Options">⋯</button>
            <div class="card-dropdown" id="dd-${p.id}">
              <button onclick="openEditProjectModal('${p.id}')">✏️ Edit</button>
              <button onclick="openProjectInEditor('${p.id}')">📝 Open Editor</button>
              <button onclick="exportProject('${p.id}')">⬇️ Export</button>
              <button onclick="archiveProject('${p.id}')">📦 Archive</button>
              <button class="danger" onclick="deleteProject('${p.id}')">🗑️ Delete</button>
            </div>
          </div>
        </div>
        <div class="project-tags">
          ${p.genre ? `<span class="tag tag-genre">${escHtml(p.genre)}</span>` : ''}
          ${p.universeLinked ? `<span class="tag tag-universe">🌐 ${escHtml(state.universe.name)}</span>` : `<span class="tag tag-standalone">Standalone</span>`}
        </div>
        <div class="project-meta">
          <span class="meta-item">📝 ${wc.toLocaleString()} words</span>
          <span class="meta-item">👤 ${charCount} chars</span>
          <span class="meta-item">🕐 ${fmtDate(p.updatedAt)}</span>
        </div>
        <div class="progress-wrap">
          <div class="progress-label">
            <span>Overall goal</span>
            <span>${pct}% of ${target.toLocaleString()}</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>
      </div>
    </div>`;
  }).join('');
}

function handleProjectCardClick(id, e) {
  if (e.target.closest('.card-dropdown') || e.target.closest('.card-menu-btn')) return;
  openProjectInEditor(id);
}

function openProjectInEditor(id) {
  state._editorProjectId = id;
  navigate('editor');
}

// ── New Project Modal ──

function openNewProjectModal(prefill = {}) {
  fillProjectModal(null, prefill);
  openModal('modal-project');
}
function openEditProjectModal(id) {
  const proj = state.projects.find(p => p.id === id);
  if (!proj) return;
  fillProjectModal(id, proj);
  openModal('modal-project');
}
function fillProjectModal(id, data = {}) {
  document.getElementById('projectModalTitle').textContent = id ? 'Edit Project' : 'New Project';
  document.getElementById('projectId').value      = id || '';
  document.getElementById('projectTitle').value   = data.title || '';
  document.getElementById('projectGenre').value   = data.genre || '';
  document.getElementById('projectSynopsis').value= data.synopsis || '';
  document.getElementById('projectWordTarget').value = data.wordTarget || 80000;
  document.getElementById('projectUniverseLinked').checked = !!data.universeLinked;
}
function saveProjectModal() {
  const id       = document.getElementById('projectId').value;
  const title    = document.getElementById('projectTitle').value.trim();
  const genre    = document.getElementById('projectGenre').value.trim();
  const synopsis = document.getElementById('projectSynopsis').value.trim();
  const target   = parseInt(document.getElementById('projectWordTarget').value) || 80000;
  const linked   = document.getElementById('projectUniverseLinked').checked;

  if (!title) { showToast('Please enter a project title.', 'error'); return; }

  const accentPairs = [
    ['#818cf8','#a78bfa'], ['#34d399','#6ee7b7'], ['#f472b6','#e879f9'],
    ['#fb923c','#fbbf24'], ['#38bdf8','#818cf8'],
  ];
  const pair = accentPairs[Math.floor(Math.random() * accentPairs.length)];

  if (id) {
    const idx = state.projects.findIndex(p => p.id === id);
    if (idx !== -1) {
      state.projects[idx] = { ...state.projects[idx], title, genre, synopsis, wordTarget: target, universeLinked: linked, updatedAt: now() };
    }
  } else {
    const proj = {
      id: uid(), title, genre, synopsis, wordTarget: target, universeLinked: linked,
      color1: pair[0], color2: pair[1],
      createdAt: now(), updatedAt: now(),
      acts: [
        { id: uid(), title: 'Act I', chapters: [
          { id: uid(), title: 'Chapter 1', scenes: [
            { id: uid(), title: 'Opening Scene', content: '' }
          ]}
        ]}
      ],
      notes: ''
    };
    state.projects.unshift(proj);
  }
  saveState();
  closeModal('modal-project');
  renderPage(currentPage);
  showToast(id ? 'Project updated.' : 'Project created! ✨', 'success');
}

function archiveProject(id) {
  const idx = state.projects.findIndex(p => p.id === id);
  if (idx === -1) return;
  const [proj] = state.projects.splice(idx, 1);
  state.archivedItems.push({ ...proj, archivedAt: now(), type: 'project' });
  saveState();
  renderPage(currentPage);
  showToast('Project archived.', 'success');
}

function deleteProject(id) {
  openConfirm('Delete this project?', 'This will move the project to Trash. You can restore it later.', () => {
    const idx = state.projects.findIndex(p => p.id === id);
    if (idx === -1) return;
    const [proj] = state.projects.splice(idx, 1);
    state.deletedItems.push({ ...proj, deletedAt: now(), type: 'project' });
    saveState();
    renderPage(currentPage);
    showToast('Project moved to Trash.');
  });
}

function exportProject(id) {
  const proj = state.projects.find(p => p.id === id);
  if (!proj) return;
  let text = `${proj.title}\n${'='.repeat(proj.title.length)}\n\n`;
  if (proj.synopsis) text += `Synopsis: ${proj.synopsis}\n\n`;
  (proj.acts || []).forEach(act => {
    text += `\n## ${act.title}\n\n`;
    (act.chapters || []).forEach(ch => {
      text += `### ${ch.title}\n\n`;
      (ch.scenes || []).forEach(sc => {
        if (sc.title) text += `#### ${sc.title}\n\n`;
        text += (sc.content || '') + '\n\n';
      });
    });
  });
  downloadText(text, proj.title.replace(/\s+/g, '_') + '.md');
  showToast('Exported as Markdown.', 'success');
}

function downloadText(content, filename) {
  const a = document.createElement('a');
  a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content);
  a.download = filename;
  a.click();
}

// ═══════════════════════════════════════════
// MANUSCRIPT EDITOR
// ═══════════════════════════════════════════

let editorAutosaveTimer = null;
let currentScenePath = null; // { actIdx, chapterIdx, sceneIdx }

function renderEditor() {
  const projId = state._editorProjectId;
  // Populate project picker
  const picker = document.getElementById('editorProjectPicker');
  picker.innerHTML = '<option value="">— select a project —</option>' +
    state.projects.map(p => `<option value="${p.id}" ${p.id === projId ? 'selected' : ''}>${escHtml(p.title)}</option>`).join('');

  if (!projId || !state.projects.find(p => p.id === projId)) {
    renderEditorStructure(null);
    return;
  }
  renderEditorStructure(projId);
  updateEditorWordCountChip();
}

function renderEditorStructure(projId) {
  const list = document.getElementById('structureList');
  if (!projId) {
    list.innerHTML = '<div class="text-muted" style="padding:12px">Select a project to begin.</div>';
    clearEditorContent();
    return;
  }
  const proj = state.projects.find(p => p.id === projId);
  if (!proj) return;

  // Universe chip
  const chip = document.getElementById('universeChip');
  if (proj.universeLinked) {
    chip.textContent = `🌐 ${state.universe.name}`;
    chip.classList.remove('hidden');
  } else { chip.classList.add('hidden'); }

  list.innerHTML = (proj.acts || []).map((act, ai) => `
    <div class="structure-act">
      <button class="structure-act-header" onclick="toggleAct('act-${ai}')">
        <span class="toggle" id="act-arrow-${ai}">▼</span>
        <span>${escHtml(act.title)}</span>
        <button class="btn btn-ghost btn-sm btn-icon" style="margin-left:auto;font-size:.7rem" onclick="addChapter('${projId}',${ai},event)" title="Add chapter">＋</button>
      </button>
      <div class="structure-chapters" id="act-${ai}">
        ${(act.chapters || []).map((ch, ci) => `
          <div class="structure-chapter">
            <button class="structure-chapter-header ${currentScenePath?.actIdx===ai && currentScenePath?.chapterIdx===ci ? 'active' : ''}"
              onclick="toggleChapter('ch-${ai}-${ci}', ${ai}, ${ci})">
              <span>▸</span> ${escHtml(ch.title)}
              <button class="btn btn-ghost btn-sm btn-icon" style="margin-left:auto;font-size:.7rem" onclick="addScene('${projId}',${ai},${ci},event)" title="Add scene">＋</button>
            </button>
            <div class="structure-scenes" id="ch-${ai}-${ci}">
              ${(ch.scenes || []).map((sc, si) => `
                <button class="structure-scene ${currentScenePath?.actIdx===ai && currentScenePath?.chapterIdx===ci && currentScenePath?.sceneIdx===si ? 'active' : ''}"
                  onclick="openScene('${projId}',${ai},${ci},${si})">
                  ✦ ${escHtml(sc.title || 'Untitled Scene')}
                </button>`).join('')}
            </div>
          </div>`).join('')}
      </div>
    </div>`).join('');

  // If no scene is open, open first scene automatically
  if (!currentScenePath && proj.acts?.[0]?.chapters?.[0]?.scenes?.[0]) {
    openScene(projId, 0, 0, 0);
  } else if (currentScenePath) {
    loadSceneContent(projId);
  }

  // Render notes panel characters
  renderEditorCharPanel(projId);
}

function toggleAct(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = el.style.display === 'none' ? '' : 'none';
}
function toggleChapter(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = el.style.display === 'none' ? '' : 'none';
}

function openScene(projId, ai, ci, si) {
  saveCurrentScene(); // save before switching
  currentScenePath = { projId, actIdx: ai, chapterIdx: ci, sceneIdx: si };
  loadSceneContent(projId);
  renderEditorStructure(projId); // re-render to update active states
}

function loadSceneContent(projId) {
  const { actIdx: ai, chapterIdx: ci, sceneIdx: si } = currentScenePath;
  const proj = state.projects.find(p => p.id === projId);
  const scene = proj?.acts?.[ai]?.chapters?.[ci]?.scenes?.[si];
  if (!scene) return;

  document.getElementById('sceneTitleInput').value = scene.title || '';
  document.getElementById('mainEditor').value = scene.content || '';
  updateEditorWordCount();

  const ch = proj.acts[ai].chapters[ci];
  document.getElementById('toolbarSceneName').textContent =
    `${proj.acts[ai].title} › ${ch.title} › ${scene.title || 'Untitled Scene'}`;
}

function clearEditorContent() {
  document.getElementById('sceneTitleInput').value = '';
  document.getElementById('mainEditor').value = '';
  document.getElementById('toolbarSceneName').textContent = '';
  document.getElementById('editorWordCount').textContent = '0 words';
  currentScenePath = null;
}

function saveCurrentScene() {
  if (!currentScenePath) return;
  const { projId, actIdx: ai, chapterIdx: ci, sceneIdx: si } = currentScenePath;
  const proj = state.projects.find(p => p.id === projId);
  if (!proj) return;
  const scene = proj?.acts?.[ai]?.chapters?.[ci]?.scenes?.[si];
  if (!scene) return;

  const oldContent = scene.content || '';
  const newContent = document.getElementById('mainEditor').value;
  const titleVal   = document.getElementById('sceneTitleInput').value.trim();

  scene.title = titleVal || scene.title;
  scene.content = newContent;
  proj.updatedAt = now();

  // Add to daily word count
  const added = wordCount(newContent) - wordCount(oldContent);
  if (added > 0) {
    state.dailyGoal.todayCount += added;
  }
}

function editorChanged() {
  updateEditorWordCount();
  clearTimeout(editorAutosaveTimer);
  editorAutosaveTimer = setTimeout(() => {
    saveCurrentScene();
    saveState();
    updateEditorWordCountChip();
  }, 1200);
}

function updateEditorWordCount() {
  const text = document.getElementById('mainEditor').value;
  document.getElementById('editorWordCount').textContent = wordCount(text).toLocaleString() + ' words';
}

function updateEditorWordCountChip() {
  const projId = state._editorProjectId;
  const chip = document.getElementById('totalWordCountChip');
  if (chip && projId) chip.textContent = totalWordCount(projId).toLocaleString() + ' total words';
}

// ── Add structure items ──

function addAct(e) {
  if (e) e.stopPropagation();
  const projId = state._editorProjectId;
  if (!projId) return;
  const proj = state.projects.find(p => p.id === projId);
  if (!proj) return;
  const n = (proj.acts || []).length + 1;
  proj.acts.push({ id: uid(), title: `Act ${toRoman(n)}`, chapters: [] });
  proj.updatedAt = now();
  saveState();
  renderEditorStructure(projId);
}

function addChapter(projId, ai, e) {
  if (e) e.stopPropagation();
  const proj = state.projects.find(p => p.id === projId);
  if (!proj) return;
  const ch = proj.acts[ai].chapters;
  ch.push({ id: uid(), title: `Chapter ${ch.length + 1}`, scenes: [{ id: uid(), title: 'New Scene', content: '' }] });
  proj.updatedAt = now();
  saveState();
  renderEditorStructure(projId);
}

function addScene(projId, ai, ci, e) {
  if (e) e.stopPropagation();
  const proj = state.projects.find(p => p.id === projId);
  if (!proj) return;
  const scenes = proj.acts[ai].chapters[ci].scenes;
  scenes.push({ id: uid(), title: `Scene ${scenes.length + 1}`, content: '' });
  proj.updatedAt = now();
  saveState();
  renderEditorStructure(projId);
}

function toRoman(n) {
  const r = ['I','II','III','IV','V','VI','VII','VIII','IX','X'];
  return r[n-1] || n;
}

// ── Notes panel ──

function renderEditorCharPanel(projId) {
  const proj = state.projects.find(p => p.id === projId);
  const container = document.getElementById('editorCharList');
  const chars = state.characters.filter(c =>
    c.projectId === projId || (proj?.universeLinked && c.projectId === 'universe')
  );
  if (chars.length === 0) {
    container.innerHTML = `<div class="text-muted" style="padding:8px 0">No characters yet. <button class="btn btn-ghost btn-sm" onclick="navigate('characters')">Add one ↗</button></div>`;
    return;
  }
  container.innerHTML = chars.map(c => `
    <div class="char-mini-card" onclick="navigate('characters')">
      <div class="char-avatar">${initials(c.name)}</div>
      <div class="char-mini-info">
        <div class="char-mini-name">${escHtml(c.name)}</div>
        <div class="char-mini-role">${escHtml(c.role || '—')}</div>
      </div>
    </div>`).join('');
}

// ── Toolbar formatting (basic) ──
function execFormat(cmd) {
  document.getElementById('mainEditor').focus();
  // For textarea: insert markdown-style
  const ta = document.getElementById('mainEditor');
  const start = ta.selectionStart, end = ta.selectionEnd;
  const sel = ta.value.slice(start, end);
  const map = { bold: `**${sel}**`, italic: `_${sel}_`, h1: `\n# ${sel}`, h2: `\n## ${sel}`, h3: `\n### ${sel}` };
  const replacement = map[cmd] || sel;
  ta.setRangeText(replacement, start, end, 'end');
  editorChanged();
}

// ── Project notes ──
function saveProjectNotes() {
  const projId = state._editorProjectId;
  if (!projId) return;
  const proj = state.projects.find(p => p.id === projId);
  if (proj) {
    proj.notes = document.getElementById('projectNotesArea').value;
    proj.updatedAt = now();
    saveState();
  }
}

function loadProjectNotes() {
  const projId = state._editorProjectId;
  const ta = document.getElementById('projectNotesArea');
  if (!ta) return;
  const proj = state.projects.find(p => p.id === projId);
  ta.value = proj?.notes || '';
}

// ── Editor project change ──
document.addEventListener('DOMContentLoaded', () => {
  const picker = document.getElementById('editorProjectPicker');
  if (picker) {
    picker.addEventListener('change', e => {
      saveCurrentScene();
      state._editorProjectId = e.target.value || null;
      currentScenePath = null;
      renderEditorStructure(e.target.value);
      loadProjectNotes();
      updateEditorWordCountChip();
    });
  }
});

// ═══════════════════════════════════════════
// CHARACTER WORKSHOP
// ═══════════════════════════════════════════

function renderCharacters() {
  const container = document.getElementById('characters-grid');
  const search    = (document.getElementById('charSearch') || {}).value || '';
  const projFilter= (document.getElementById('charProjectFilter') || {}).value || '';
  const roleFilter= (document.getElementById('charRoleFilter') || {}).value || '';

  // Populate project filter
  const pf = document.getElementById('charProjectFilter');
  if (pf && pf.children.length <= 1) {
    state.projects.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id; opt.textContent = p.title;
      pf.appendChild(opt);
    });
  }

  let chars = [...state.characters];
  if (search) {
    const q = search.toLowerCase();
    chars = chars.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.role || '').toLowerCase().includes(q) ||
      (c.backstory || '').toLowerCase().includes(q)
    );
  }
  if (projFilter) chars = chars.filter(c => c.projectId === projFilter);
  if (roleFilter) chars = chars.filter(c => c.characterRole === roleFilter);

  if (chars.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">👥</div>
        <div class="empty-title">${state.characters.length === 0 ? 'No characters yet' : 'No characters match'}</div>
        <div class="empty-desc">${state.characters.length === 0 ? 'Build your cast of characters here.' : 'Try adjusting your filters.'}</div>
        ${state.characters.length === 0 ? '<div class="empty-action"><button class="btn btn-primary" onclick="openNewCharModal()">＋ New Character</button></div>' : ''}
      </div>`;
    return;
  }

  container.innerHTML = chars.map(c => {
    const proj = state.projects.find(p => p.id === c.projectId);
    const rels = (c.relationships || []);
    const roleClass = { protagonist:'role-protagonist', antagonist:'role-antagonist', supporting:'role-supporting', minor:'role-minor' }[c.characterRole] || 'role-minor';
    return `
    <div class="card char-card">
      <div class="char-card-body">
        <div class="char-card-header">
          <div class="char-avatar-lg">${initials(c.name)}</div>
          <div class="char-info" style="flex:1">
            <div class="char-name">${escHtml(c.name)}</div>
            <div class="char-role">${escHtml(c.role || '—')}</div>
            <span class="char-role-badge ${roleClass}">${c.characterRole || 'minor'}</span>
          </div>
          <div class="project-card-menu">
            <button class="card-menu-btn" onclick="toggleDropdown('cdd-${c.id}', event)">⋯</button>
            <div class="card-dropdown" id="cdd-${c.id}">
              <button onclick="openEditCharModal('${c.id}')">✏️ Edit</button>
              <button class="danger" onclick="deleteCharacter('${c.id}')">🗑️ Delete</button>
            </div>
          </div>
        </div>
        <div class="char-details">
          ${c.age ? `<div class="char-detail-row"><span class="char-detail-label">Age:</span> ${escHtml(c.age)}</div>` : ''}
          ${c.appearance ? `<div class="char-detail-row"><span class="char-detail-label">Looks:</span> ${escHtml(c.appearance.slice(0,80))}${c.appearance.length>80?'…':''}</div>` : ''}
          ${proj ? `<div class="char-detail-row"><span class="char-detail-label">Project:</span> ${escHtml(proj.title)}</div>` : c.projectId === 'universe' ? `<div class="char-detail-row"><span class="char-detail-label">Project:</span> <span class="universe-chip">🌐 Universe</span></div>` : ''}
        </div>
        ${c.backstory ? `<div class="char-snippet">${escHtml(c.backstory)}</div>` : ''}
        ${rels.length > 0 ? `
          <div style="margin-top:10px">
            <div class="text-muted" style="font-size:.72rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;margin-bottom:5px">Relationships</div>
            ${rels.slice(0,3).map(r => {
              const other = state.characters.find(ch => ch.id === r.targetId);
              return `<div class="rel-item"><span class="rel-arrow">→</span><strong>${escHtml(other?.name || r.targetName || '?')}</strong><span class="rel-type">${escHtml(r.type)}</span></div>`;
            }).join('')}
            ${rels.length > 3 ? `<div class="text-muted" style="font-size:.75rem">+${rels.length-3} more</div>` : ''}
          </div>` : ''}
      </div>
      <div class="char-card-footer">
        <button class="btn btn-secondary btn-sm" onclick="openEditCharModal('${c.id}')">✏️ Edit</button>
        <button class="btn btn-ghost btn-sm" onclick="deleteCharacter('${c.id}')">🗑️</button>
      </div>
    </div>`;
  }).join('');
}

function openNewCharModal() {
  fillCharModal(null, {});
  openModal('modal-character');
}
function openEditCharModal(id) {
  const c = state.characters.find(c => c.id === id);
  if (!c) return;
  fillCharModal(id, c);
  openModal('modal-character');
}

function fillCharModal(id, data = {}) {
  document.getElementById('charModalTitle').textContent = id ? 'Edit Character' : 'New Character';
  document.getElementById('charId').value             = id || '';
  document.getElementById('charName').value           = data.name || '';
  document.getElementById('charAge').value            = data.age || '';
  document.getElementById('charRole').value           = data.role || '';
  document.getElementById('charCharacterRole').value  = data.characterRole || 'supporting';
  document.getElementById('charAppearance').value     = data.appearance || '';
  document.getElementById('charPersonality').value    = data.personality || '';
  document.getElementById('charBackstory').value      = data.backstory || '';

  // Project assignment
  const pa = document.getElementById('charProjectAssign');
  pa.innerHTML = '<option value="universe">🌐 Shared Universe</option>' +
    state.projects.map(p => `<option value="${p.id}">${escHtml(p.title)}</option>`).join('');
  pa.value = data.projectId || 'universe';

  // Relationships
  renderRelationshipBuilder(data.relationships || []);

  // Switch to first tab
  switchModalTab('charTab-basic', 'charTabPane-basic');
}

function renderRelationshipBuilder(rels) {
  const container = document.getElementById('relBuilder');
  container.innerHTML = rels.map((r, i) => `
    <div class="rel-row" id="rel-row-${i}">
      <select class="form-select" id="rel-target-${i}">
        <option value="">— select character —</option>
        ${state.characters.filter(c => c.id !== document.getElementById('charId').value).map(c =>
          `<option value="${c.id}" ${c.id === r.targetId ? 'selected' : ''}>${escHtml(c.name)}</option>`
        ).join('')}
      </select>
      <input class="form-input" id="rel-type-${i}" value="${escHtml(r.type || '')}" placeholder="e.g. rival, friend, mentor">
      <button class="rel-remove" onclick="removeRelRow(${i})">✕</button>
    </div>`).join('');
  document.getElementById('relCount').value = rels.length;
}

function addRelRow() {
  const count = parseInt(document.getElementById('relCount').value) || 0;
  const container = document.getElementById('relBuilder');
  const div = document.createElement('div');
  div.className = 'rel-row';
  div.id = `rel-row-${count}`;
  div.innerHTML = `
    <select class="form-select" id="rel-target-${count}">
      <option value="">— select character —</option>
      ${state.characters.filter(c => c.id !== document.getElementById('charId').value).map(c =>
        `<option value="${c.id}">${escHtml(c.name)}</option>`
      ).join('')}
    </select>
    <input class="form-input" id="rel-type-${count}" placeholder="e.g. rival, friend, mentor">
    <button class="rel-remove" onclick="removeRelRow(${count})">✕</button>`;
  container.appendChild(div);
  document.getElementById('relCount').value = count + 1;
}

function removeRelRow(i) {
  const el = document.getElementById(`rel-row-${i}`);
  if (el) el.remove();
}

function saveCharModal() {
  const id   = document.getElementById('charId').value;
  const name = document.getElementById('charName').value.trim();
  if (!name) { showToast('Character must have a name.', 'error'); return; }

  const count = parseInt(document.getElementById('relCount').value) || 0;
  const relationships = [];
  for (let i = 0; i < count + 10; i++) { // iterate possible rows
    const targetEl = document.getElementById(`rel-target-${i}`);
    const typeEl   = document.getElementById(`rel-type-${i}`);
    if (!targetEl) continue;
    if (targetEl.value) {
      const other = state.characters.find(c => c.id === targetEl.value);
      relationships.push({ targetId: targetEl.value, targetName: other?.name || '', type: typeEl?.value || '' });
    }
  }

  const charData = {
    name,
    age:            document.getElementById('charAge').value.trim(),
    role:           document.getElementById('charRole').value.trim(),
    characterRole:  document.getElementById('charCharacterRole').value,
    appearance:     document.getElementById('charAppearance').value.trim(),
    personality:    document.getElementById('charPersonality').value.trim(),
    backstory:      document.getElementById('charBackstory').value.trim(),
    projectId:      document.getElementById('charProjectAssign').value,
    relationships,
    updatedAt:      now()
  };

  if (id) {
    const idx = state.characters.findIndex(c => c.id === id);
    if (idx !== -1) state.characters[idx] = { ...state.characters[idx], ...charData };
  } else {
    state.characters.unshift({ id: uid(), createdAt: now(), ...charData });
  }
  saveState();
  closeModal('modal-character');
  renderPage(currentPage);
  showToast(id ? 'Character updated.' : 'Character created! 🌟', 'success');
}

function deleteCharacter(id) {
  openConfirm('Delete this character?', 'The character will be removed permanently.', () => {
    state.characters = state.characters.filter(c => c.id !== id);
    saveState();
    renderPage(currentPage);
    showToast('Character deleted.');
  });
}

// ═══════════════════════════════════════════
// WORLD-BUILDING ATLAS
// ═══════════════════════════════════════════

const ATLAS_TYPES = ['locations', 'magic', 'factions', 'timeline'];

function renderAtlas() {
  ATLAS_TYPES.forEach(type => {
    const container = document.getElementById(`atlas-${type}-list`);
    const entries = state.worldEntries.filter(e => e.type === type);
    if (entries.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">${atlasIcon(type)}</div>
        <div class="empty-title">No ${type} yet</div>
        <div class="empty-desc">Add your first entry to build out your world.</div>
        <div class="empty-action"><button class="btn btn-primary" onclick="openNewWorldModal('${type}')">＋ Add Entry</button></div></div>`;
      return;
    }
    container.innerHTML = type === 'timeline'
      ? renderTimeline(entries)
      : entries.map(e => renderLoreCard(e)).join('');
  });
}

function atlasIcon(type) {
  return { locations:'🗺️', magic:'✨', factions:'⚔️', timeline:'📜' }[type] || '📖';
}

function renderLoreCard(e) {
  return `
    <div class="card lore-card">
      <div class="lore-card-body">
        <div class="lore-card-header">
          <div class="lore-title">${escHtml(e.title)}</div>
          <div style="display:flex;align-items:center;gap:8px">
            <span class="lore-type-badge lore-${e.type}">${e.subtype || e.type}</span>
            <button class="card-menu-btn" onclick="toggleDropdown('wdd-${e.id}',event)">⋯</button>
            <div class="card-dropdown" id="wdd-${e.id}">
              <button onclick="openEditWorldModal('${e.id}')">✏️ Edit</button>
              <button class="danger" onclick="deleteWorldEntry('${e.id}')">🗑️ Delete</button>
            </div>
          </div>
        </div>
        ${e.description ? `<div class="lore-desc">${escHtml(e.description)}</div>` : ''}
        ${e.details ? `<div class="lore-desc" style="margin-top:6px;font-style:italic">${escHtml(e.details)}</div>` : ''}
      </div>
    </div>`;
}

function renderTimeline(entries) {
  const sorted = [...entries].sort((a, b) => (a.year || 0) - (b.year || 0));
  return `<div style="padding:8px 0">` +
    sorted.map(e => `
      <div class="timeline-entry">
        <div class="timeline-dot"></div>
        <div class="timeline-content">
          <div class="timeline-year">${e.year ? 'Year ' + e.year : 'Date unknown'}</div>
          <div class="timeline-event">${escHtml(e.title)}
            <button class="btn btn-ghost btn-sm" style="margin-left:8px" onclick="openEditWorldModal('${e.id}')">✏️</button>
            <button class="btn btn-ghost btn-sm btn-danger" onclick="deleteWorldEntry('${e.id}')">🗑️</button>
          </div>
          ${e.description ? `<div class="timeline-desc">${escHtml(e.description)}</div>` : ''}
        </div>
      </div>`).join('') + '</div>';
}

let _atlasCurrentType = 'locations';

function openNewWorldModal(type) {
  _atlasCurrentType = type || getCurrentAtlasTab();
  fillWorldModal(null, { type: _atlasCurrentType });
  openModal('modal-world');
}
function openEditWorldModal(id) {
  const e = state.worldEntries.find(e => e.id === id);
  if (!e) return;
  _atlasCurrentType = e.type;
  fillWorldModal(id, e);
  openModal('modal-world');
}
function getCurrentAtlasTab() {
  return document.querySelector('.atlas-tab.active')?.dataset?.type || 'locations';
}

function fillWorldModal(id, data = {}) {
  document.getElementById('worldModalTitle').textContent = id ? 'Edit Entry' : 'New World Entry';
  document.getElementById('worldId').value          = id || '';
  document.getElementById('worldTitle').value       = data.title || '';
  document.getElementById('worldType').value        = data.type || _atlasCurrentType;
  document.getElementById('worldSubtype').value     = data.subtype || '';
  document.getElementById('worldDescription').value = data.description || '';
  document.getElementById('worldDetails').value     = data.details || '';
  document.getElementById('worldYear').value        = data.year || '';

  // show year field only for timeline
  const yearRow = document.getElementById('worldYearRow');
  if (yearRow) yearRow.style.display = data.type === 'timeline' ? '' : 'none';
  document.getElementById('worldType').addEventListener('change', e => {
    if (yearRow) yearRow.style.display = e.target.value === 'timeline' ? '' : 'none';
  });
}

function saveWorldModal() {
  const id    = document.getElementById('worldId').value;
  const title = document.getElementById('worldTitle').value.trim();
  if (!title) { showToast('Entry must have a title.', 'error'); return; }
  const entry = {
    title,
    type:        document.getElementById('worldType').value,
    subtype:     document.getElementById('worldSubtype').value.trim(),
    description: document.getElementById('worldDescription').value.trim(),
    details:     document.getElementById('worldDetails').value.trim(),
    year:        document.getElementById('worldYear').value ? parseInt(document.getElementById('worldYear').value) : null,
    updatedAt:   now()
  };
  if (id) {
    const idx = state.worldEntries.findIndex(e => e.id === id);
    if (idx !== -1) state.worldEntries[idx] = { ...state.worldEntries[idx], ...entry };
  } else {
    state.worldEntries.unshift({ id: uid(), createdAt: now(), ...entry });
  }
  saveState();
  closeModal('modal-world');
  renderPage(currentPage);
  showToast(id ? 'Entry updated.' : 'Entry added! 🗺️', 'success');
}

function deleteWorldEntry(id) {
  openConfirm('Delete this entry?', 'This will permanently remove the world entry.', () => {
    state.worldEntries = state.worldEntries.filter(e => e.id !== id);
    saveState();
    renderPage(currentPage);
    showToast('Entry deleted.');
  });
}

// ── Atlas tabs ──
function switchAtlasTab(type) {
  document.querySelectorAll('.atlas-tab').forEach(t => t.classList.toggle('active', t.dataset.type === type));
  document.querySelectorAll('.atlas-pane').forEach(p => p.classList.toggle('active', p.dataset.type === type));
}

// ═══════════════════════════════════════════
// ARCHIVE
// ═══════════════════════════════════════════

function renderArchive() {
  const container = document.getElementById('archive-list');
  if (state.archivedItems.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">📦</div>
      <div class="empty-title">Archive is empty</div>
      <div class="empty-desc">Archived projects will appear here.</div></div>`;
    return;
  }
  container.innerHTML = state.archivedItems.map(item => `
    <div class="list-item">
      <div class="list-item-icon">📚</div>
      <div class="list-item-info">
        <div class="list-item-title">${escHtml(item.title)}</div>
        <div class="list-item-meta">Archived ${fmtDate(item.archivedAt)} · ${item.genre || 'No genre'}</div>
      </div>
      <div class="list-item-actions">
        <button class="btn btn-secondary btn-sm" onclick="restoreArchived('${item.id}')">♻️ Restore</button>
        <button class="btn btn-danger btn-sm" onclick="permanentDeleteArchived('${item.id}')">🗑️ Delete</button>
      </div>
    </div>`).join('');
}

function restoreArchived(id) {
  const idx = state.archivedItems.findIndex(i => i.id === id);
  if (idx === -1) return;
  const [item] = state.archivedItems.splice(idx, 1);
  delete item.archivedAt; delete item.type;
  state.projects.unshift(item);
  saveState();
  renderPage(currentPage);
  showToast('Project restored!', 'success');
}

function permanentDeleteArchived(id) {
  openConfirm('Permanently delete?', 'This cannot be undone.', () => {
    state.archivedItems = state.archivedItems.filter(i => i.id !== id);
    saveState();
    renderPage(currentPage);
    showToast('Deleted permanently.');
  });
}

// ═══════════════════════════════════════════
// TRASH
// ═══════════════════════════════════════════

function renderTrash() {
  const container = document.getElementById('trash-list');
  if (state.deletedItems.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">🗑️</div>
      <div class="empty-title">Trash is empty</div>
      <div class="empty-desc">Deleted projects will appear here for recovery.</div></div>`;
    return;
  }
  container.innerHTML = state.deletedItems.map(item => `
    <div class="list-item">
      <div class="list-item-icon">📄</div>
      <div class="list-item-info">
        <div class="list-item-title">${escHtml(item.title)}</div>
        <div class="list-item-meta">Deleted ${fmtDate(item.deletedAt)} · ${item.genre || 'No genre'}</div>
      </div>
      <div class="list-item-actions">
        <button class="btn btn-secondary btn-sm" onclick="restoreFromTrash('${item.id}')">♻️ Restore</button>
        <button class="btn btn-danger btn-sm" onclick="permanentDeleteTrash('${item.id}')">✕ Remove</button>
      </div>
    </div>`).join('');
}

function restoreFromTrash(id) {
  const idx = state.deletedItems.findIndex(i => i.id === id);
  if (idx === -1) return;
  const [item] = state.deletedItems.splice(idx, 1);
  delete item.deletedAt; delete item.type;
  state.projects.unshift(item);
  saveState();
  renderPage(currentPage);
  showToast('Project restored!', 'success');
}

function permanentDeleteTrash(id) {
  openConfirm('Permanently delete?', 'This cannot be undone. The project will be gone forever.', () => {
    state.deletedItems = state.deletedItems.filter(i => i.id !== id);
    saveState();
    renderPage(currentPage);
    showToast('Deleted permanently.');
  });
}

function emptyTrash() {
  openConfirm('Empty Trash?', 'All items in trash will be permanently deleted. This cannot be undone.', () => {
    state.deletedItems = [];
    saveState();
    renderPage(currentPage);
    showToast('Trash emptied.');
  });
}

// ═══════════════════════════════════════════
// GLOBAL SEARCH
// ═══════════════════════════════════════════

let searchDebounce = null;

function handleGlobalSearch(e) {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => performSearch(e.target.value.trim()), 200);
}

function performSearch(query) {
  const resultsEl = document.getElementById('searchResults');
  if (!query) { resultsEl.classList.add('hidden'); return; }
  resultsEl.classList.remove('hidden');

  const q = query.toLowerCase();
  const results = [];

  state.projects.forEach(p => {
    if (p.title.toLowerCase().includes(q) || (p.synopsis || '').toLowerCase().includes(q))
      results.push({ type: 'Project', name: p.title, sub: p.genre || '', action: () => openProjectInEditor(p.id) });
  });
  state.characters.forEach(c => {
    if (c.name.toLowerCase().includes(q) || (c.backstory || '').toLowerCase().includes(q))
      results.push({ type: 'Character', name: c.name, sub: c.role || '', action: () => navigate('characters') });
  });
  state.worldEntries.forEach(e => {
    if (e.title.toLowerCase().includes(q) || (e.description || '').toLowerCase().includes(q))
      results.push({ type: 'World', name: e.title, sub: e.type, action: () => navigate('atlas') });
  });

  if (results.length === 0) {
    resultsEl.innerHTML = '<div class="search-no-results">No results found.</div>';
    return;
  }
  resultsEl.innerHTML = results.slice(0, 12).map((r, i) => `
    <div class="search-result-item" onclick="selectSearchResult(${i})">
      <span class="search-result-type">${r.type}</span>
      <div>
        <div class="search-result-name">${escHtml(r.name)}</div>
        ${r.sub ? `<div class="search-result-sub">${escHtml(r.sub)}</div>` : ''}
      </div>
    </div>`).join('');

  // Store actions for click handlers
  window._searchResults = results;
}

function selectSearchResult(i) {
  const r = window._searchResults?.[i];
  if (r) { r.action(); closeSearch(); }
}

function closeSearch() {
  const el = document.getElementById('searchResults');
  if (el) el.classList.add('hidden');
  const input = document.getElementById('globalSearch');
  if (input) input.value = '';
}

// ═══════════════════════════════════════════
// DAILY GOAL MODAL
// ═══════════════════════════════════════════

function openGoalModal() {
  document.getElementById('goalTarget').value    = state.dailyGoal.target || 500;
  document.getElementById('goalTodayCount').value = state.dailyGoal.todayCount || 0;
  openModal('modal-goal');
}

function saveGoalModal() {
  state.dailyGoal.target     = parseInt(document.getElementById('goalTarget').value) || 500;
  state.dailyGoal.todayCount = parseInt(document.getElementById('goalTodayCount').value) || 0;
  saveState();
  closeModal('modal-goal');
  renderPage(currentPage);
  showToast('Goals updated.', 'success');
}

// ═══════════════════════════════════════════
// UNIVERSE MODAL
// ═══════════════════════════════════════════

function openUniverseModal() {
  document.getElementById('universeName').value  = state.universe.name || '';
  document.getElementById('universeNotes').value = state.universe.notes || '';
  openModal('modal-universe');
}
function saveUniverseModal() {
  state.universe.name  = document.getElementById('universeName').value.trim() || 'My Universe';
  state.universe.notes = document.getElementById('universeNotes').value.trim();
  saveState();
  closeModal('modal-universe');
  renderPage(currentPage);
  showToast('Universe updated.', 'success');
}

// ═══════════════════════════════════════════
// MODAL HELPERS
// ═══════════════════════════════════════════

function openModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.add('open'); closeDropdowns(); }
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

let _confirmCallback = null;
function openConfirm(title, desc, callback) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmDesc').textContent  = desc;
  _confirmCallback = callback;
  openModal('modal-confirm');
}
function doConfirm() {
  closeModal('modal-confirm');
  if (_confirmCallback) _confirmCallback();
  _confirmCallback = null;
}

function switchModalTab(tabId, paneId) {
  const modal = document.getElementById(tabId)?.closest('.modal');
  if (!modal) return;
  modal.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
  modal.querySelectorAll('.modal-tab-pane').forEach(p => p.classList.remove('active'));
  document.getElementById(tabId)?.classList.add('active');
  document.getElementById(paneId)?.classList.add('active');
}

// ═══════════════════════════════════════════
// DROPDOWNS
// ═══════════════════════════════════════════

function toggleDropdown(id, e) {
  if (e) e.stopPropagation();
  const target = document.getElementById(id);
  const wasOpen = target?.classList.contains('open');
  closeDropdowns();
  if (!wasOpen && target) target.classList.add('open');
}
function closeDropdowns() {
  document.querySelectorAll('.card-dropdown.open').forEach(d => d.classList.remove('open'));
}

// ═══════════════════════════════════════════
// AUTOSAVE INDICATOR
// ═══════════════════════════════════════════

let autosaveTimeout = null;
function showAutosave() {
  const dot = document.getElementById('autosaveDot');
  const txt = document.getElementById('autosaveText');
  if (!dot || !txt) return;
  dot.classList.add('saving');
  txt.textContent = 'Saving…';
  clearTimeout(autosaveTimeout);
  autosaveTimeout = setTimeout(() => {
    dot.classList.remove('saving');
    txt.textContent = 'Saved';
  }, 800);
}

// ═══════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════

function showToast(msg, type = '') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✓', error: '⚠' };
  toast.innerHTML = `${icons[type] || 'ℹ'} ${escHtml(msg)}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ═══════════════════════════════════════════
// GLOBAL EVENT LISTENERS
// ═══════════════════════════════════════════

document.addEventListener('click', e => {
  if (!e.target.closest('.project-card-menu') && !e.target.closest('.card-dropdown')) closeDropdowns();
  if (!e.target.closest('.sidebar-search') && !e.target.closest('.search-results')) closeSearch();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
    closeDropdowns();
    closeSearch();
  }
});

// ─── init ───
document.addEventListener('DOMContentLoaded', () => {
  navigate('dashboard');
});

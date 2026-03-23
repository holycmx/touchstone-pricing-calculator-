// ============================================
// STORY BRAIN - Shared State Management
// Centralized localStorage persistence and utilities
// ============================================

// Default initial state structure
const DEFAULT_STATE = {
  projects: [],
  currentProjectId: null,
  characters: [],
  plotThreads: [],
  scenes: [],
  worldData: [],
  archivedProjects: [],
  archivedCharacters: [],
  archivedWorldEntries: [],
  archivedPlotThreads: [],
  trashedProjects: [],
  trashedCharacters: [],
  trashedWorldEntries: [],
  trashedPlotThreads: [],
  settings: {
    darkMode: false,
    autoSave: true,
    wordTarget: 50000
  }
};

// Global state object
let state = { ...DEFAULT_STATE };

// ============================================
// CORE STATE FUNCTIONS
// ============================================

// Load state from localStorage
function loadState() {
  try {
    const savedState = localStorage.getItem('storyBrainState');
    if (savedState) {
      const parsed = JSON.parse(savedState);
      // Merge with defaults to ensure all fields exist
      state = { ...DEFAULT_STATE, ...parsed };
    } else {
      // Initialize with sample data for demo
      initializeSampleData();
    }
  } catch (error) {
    console.error('Error loading state:', error);
    initializeSampleData();
  }
  return state;
}

// Save current state to localStorage
function saveState() {
  try {
    localStorage.setItem('storyBrainState', JSON.stringify(state));
    // Dispatch event for other pages/tabs to sync
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'storyBrainState',
      newValue: JSON.stringify(state)
    }));
  } catch (error) {
    console.error('Error saving state:', error);
  }
}

// Initialize with sample data for first-time users
function initializeSampleData() {
  const sampleProject = {
    id: 'sample1',
    title: 'The Last Ember',
    wordCount: 4280,
    targetWordCount: 50000,
    status: 'active',
    manuscriptContent: `Chapter 1: The Awakening\n\nThe city of Verenthia had always been a place of shadows, but tonight, the darkness felt alive. Elara pressed herself against the cold stone wall, her heart pounding like a war drum in her chest.\n\n"The Inquisitors are coming," she whispered to herself. "They're always coming."\n\nShe had stolen the ember—a small, pulsating crystal that held the last remnants of magic in a world that had burned all its witches. Now, with it pressed against her skin, she could feel the ancient power humming through her veins, begging to be released.\n\nFootsteps echoed in the alley behind her. Three pairs. Maybe four. She didn't dare look back.\n\n*Run*, the crystal seemed to whisper. *You know what you must become.*`,
    lastEdited: new Date().toISOString()
  };
  
  const sampleCharacters = [
    {
      id: 'char1',
      name: 'Elara Vance',
      role: 'Protagonist',
      wants: 'To restore magic to the world',
      needs: 'To trust others and accept help',
      fear: 'Becoming like the witches she read about—alone and hunted',
      secret: 'Her grandmother was the last Archmage, executed by the Inquisition',
      contradiction: 'Desperate for connection but pushes everyone away',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'char2',
      name: 'Kaelen Ashworth',
      role: 'Mentor',
      wants: 'To protect Elara at any cost',
      needs: 'To forgive himself for past failures',
      fear: 'Watching another apprentice die',
      secret: 'He helped create the Inquisition before defecting',
      contradiction: 'Preaches caution but takes reckless risks',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'char3',
      name: 'Sister Moraine',
      role: 'Antagonist',
      wants: 'To eradicate all magic from the realm',
      needs: 'To confront her own magical heritage',
      fear: 'Losing control of the Inquisition',
      secret: 'She possesses dormant magical abilities',
      contradiction: 'Destroys magic but secretly studies ancient texts',
      updatedAt: new Date().toISOString()
    }
  ];
  
  const samplePlotThreads = [
    {
      id: 'thread1',
      name: 'The Ember\'s Secret',
      description: 'The crystal contains more than just magic—it holds the consciousness of the last Archmage',
      status: 'developing',
      linkedCharacters: 'Elara, Kaelen',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'thread2',
      name: 'The Inquisition Betrayal',
      description: 'A faction within the Inquisition wants to use magic, not destroy it',
      status: 'introduced',
      linkedCharacters: 'Sister Moraine',
      updatedAt: new Date().toISOString()
    }
  ];
  
  const sampleWorldData = [
    {
      id: 'world1',
      type: 'location',
      title: 'Verenthia',
      description: 'A sprawling city of spires and slums, where the Inquisition watches from every shadow. Once a center of magical learning, now a monument to suppression.',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'world2',
      type: 'rules',
      title: 'The Ember Magic System',
      description: 'Magic is channeled through Ember crystals, which amplify latent abilities. Users must balance control with surrender—too much control limits power, too much surrender risks possession.',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'world3',
      type: 'history',
      title: 'The Burning Years',
      description: 'A decade-long purge when the Inquisition hunted and executed all known magic users. Thousands died. The last Archmage fell in the final siege of Verenthia.',
      updatedAt: new Date().toISOString()
    }
  ];
  
  state = {
    ...DEFAULT_STATE,
    projects: [sampleProject],
    currentProjectId: sampleProject.id,
    characters: sampleCharacters,
    plotThreads: samplePlotThreads,
    worldData: sampleWorldData,
    scenes: []
  };
  
  saveState();
}

// ============================================
// DARK MODE - Professional Dark Theme
// Matching your design system with dark mode colors
// ============================================

// Dark mode color palette based on your design system
// Light mode: Primary #A57982, Secondary #B98EA7, Tertiary #590004
// Dark mode: Adjusted for readability and contrast

const DARK_MODE_COLORS = {
  // Primary becomes brighter for contrast
  primary: '#D48C9B',
  primaryHover: '#E29CAB',
  // Secondary remains similar but slightly brighter
  secondary: '#CB9DB8',
  // Tertiary becomes more vibrant
  tertiary: '#B84C4C',
  // Background colors
  background: '#0D0D0D',
  surface: '#1A1A1A',
  surfaceElevated: '#242424',
  surfaceHighest: '#2A2A2A',
  // Text colors
  textPrimary: '#F0F0F0',
  textSecondary: '#B0B0B0',
  textMuted: '#6B7280',
  // Border colors
  border: '#2A2A2A',
  borderLight: '#333333',
  // Status colors
  success: '#2E7D64',
  warning: '#B45309',
  error: '#B91C1C'
};

// Initialize dark mode when page loads
function initDarkMode() {
  // Check localStorage for saved preference
  const savedMode = localStorage.getItem('darkMode');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Set dark mode if saved as true OR if no saved preference and system prefers dark
  const shouldBeDark = savedMode === 'true' || (savedMode === null && prefersDark);
  
  if (shouldBeDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  
  updateDarkModeButton();
}

// Toggle dark mode on/off
function toggleDarkMode() {
  if (document.documentElement.classList.contains('dark')) {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('darkMode', 'false');
    showNotification('☀️ Light mode enabled', 'info');
  } else {
    document.documentElement.classList.add('dark');
    localStorage.setItem('darkMode', 'true');
    showNotification('🌙 Dark mode enabled', 'info');
  }
  updateDarkModeButton();
}

// Update the button icon based on current mode
function updateDarkModeButton() {
  const buttons = document.querySelectorAll('.dark-mode-toggle');
  const isDark = document.documentElement.classList.contains('dark');
  
  buttons.forEach(btn => {
    btn.innerHTML = isDark ? 
      '<span class="material-symbols-outlined">light_mode</span>' : 
      '<span class="material-symbols-outlined">dark_mode</span>';
  });
}

// addDarkModeStyles() 

function addDarkModeStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* ============================================
       DARK MODE - HIGH CONTRAST PROFESSIONAL THEME
       WCAG AA Compliant (4.5:1 contrast ratio minimum)
    ============================================ */
    
    .dark {
      color-scheme: dark;
    }
    
    /* Base Background - Dark but not pure black */
    .dark body {
      background-color: #121212 !important;
      color: #FFFFFF !important;
    }
    
    /* Main Containers */
    .dark .bg-[#FDF9F4],
    .dark .bg-background,
    .dark body {
      background-color: #121212 !important;
    }
    
    /* Cards and Surfaces - Slightly lighter than background */
    .dark .bg-white,
    .dark .bg-surface,
    .dark .bg-surface-container,
    .dark .bg-surface-container-low,
    .dark .bg-surface-container-lowest,
    .dark .bg-surface-container-high,
    .dark .bg-surface-container-highest,
    .dark .rounded-xl,
    .dark .rounded-2xl,
    .dark [class*="bg-white"] {
      background-color: #1E1E1E !important;
    }
    
    /* Semi-transparent backgrounds */
    .dark .bg-white/90,
    .dark .bg-white/80,
    .dark .bg-white/70,
    .dark .bg-white/60,
    .dark .bg-white/50,
    .dark .bg-white/40,
    .dark .bg-white/30,
    .dark .bg-white/20,
    .dark .bg-white/10 {
      background-color: rgba(30, 30, 30, 0.95) !important;
    }
    
    /* Borders - Visible but subtle */
    .dark .border,
    .dark .border-t,
    .dark .border-b,
    .dark .border-l,
    .dark .border-r,
    .dark .border-[#EADDF0],
    .dark .border-primary\/10,
    .dark .border-primary\/20,
    .dark .border-primary\/30,
    .dark .border-gray-200,
    .dark .border-gray-300 {
      border-color: #3A3A3A !important;
    }
    
    /* TEXT COLORS - HIGH CONTRAST */
    /* Primary text - pure white for maximum contrast */
    .dark .text-gray-800,
    .dark .text-gray-700,
    .dark .text-on-surface,
    .dark h1, .dark h2, .dark h3, .dark h4,
    .dark .font-bold,
    .dark .font-semibold,
    .dark .font-headline,
    .dark .text-on-surface {
      color: #FFFFFF !important;
    }
    
    /* Secondary text - light gray, still high contrast */
    .dark .text-gray-600,
    .dark .text-gray-500,
    .dark .text-on-surface-variant,
    .dark .text-secondary,
    .dark p:not(.text-primary),
    .dark .text-sm:not(.text-primary) {
      color: #E0E0E0 !important;
    }
    
    /* Muted text - lighter but readable (contrast ~5:1 on dark bg) */
    .dark .text-gray-400,
    .dark .text-gray-300,
    .dark .text-xs,
    .dark .text-gray-500 {
      color: #B0B0B0 !important;
    }
    
    /* PRIMARY COLOR - Brighter for better visibility */
    .dark .bg-primary {
      background-color: #C97B8A !important;
    }
    
    .dark .bg-primary\/10 {
      background-color: rgba(201, 123, 138, 0.2) !important;
    }
    
    .dark .bg-primary\/20 {
      background-color: rgba(201, 123, 138, 0.3) !important;
    }
    
    .dark .text-primary {
      color: #E29CAB !important;
    }
    
    .dark .hover\:bg-primary\/10:hover {
      background-color: rgba(201, 123, 138, 0.25) !important;
    }
    
    .dark .hover\:bg-primary\/20:hover {
      background-color: rgba(201, 123, 138, 0.35) !important;
    }
    
    /* SECONDARY COLOR */
    .dark .bg-secondary {
      background-color: #D4A5C0 !important;
    }
    
    .dark .text-secondary {
      color: #E2B8D0 !important;
    }
    
    /* TERTIARY COLOR */
    .dark .bg-tertiary {
      background-color: #C55A5A !important;
    }
    
    .dark .text-tertiary {
      color: #E07A7A !important;
    }
    
    /* Stats Cards - Slightly elevated background */
    .dark .bg-\[#FAF2FE\],
    .dark .bg-gray-50,
    .dark .bg-gray-100 {
      background-color: #2A2A2A !important;
    }
    
    /* Buttons */
    .dark button:not(.bg-primary):not(.bg-red-500):not(.bg-green-500):not(.bg-blue-500) {
      background-color: #2A2A2A !important;
      color: #FFFFFF !important;
    }
    
    .dark button:not(.bg-primary):not(.bg-red-500):not(.bg-green-500):not(.bg-blue-500):hover {
      background-color: #3A3A3A !important;
    }
    
    /* Input Fields - Clear visibility */
    .dark input,
    .dark textarea,
    .dark select {
      background-color: #2A2A2A !important;
      border-color: #4A4A4A !important;
      color: #FFFFFF !important;
    }
    
    .dark input:focus,
    .dark textarea:focus,
    .dark select:focus {
      border-color: #E29CAB !important;
      outline: none !important;
      box-shadow: 0 0 0 2px rgba(226, 156, 171, 0.3) !important;
    }
    
    .dark input::placeholder,
    .dark textarea::placeholder {
      color: #9CA3AF !important;
    }
    
    /* Sidebar */
    .dark aside,
    .dark .fixed.left-0 {
      background-color: #0A0A0A !important;
      border-right-color: #2A2A2A !important;
    }
    
    .dark nav a {
      color: #E0E0E0 !important;
    }
    
    .dark nav a:hover {
      background-color: #2A2A2A !important;
      color: #FFFFFF !important;
    }
    
    .dark nav a.bg-primary\/10 {
      background-color: rgba(201, 123, 138, 0.2) !important;
      color: #E29CAB !important;
    }
    
    /* Modals */
    .dark .fixed.bg-white,
    .dark .modal-content,
    .dark [class*="fixed"] > .bg-white {
      background-color: #1E1E1E !important;
      border-color: #3A3A3A !important;
    }
    
    /* Progress Bars */
    .dark .bg-gray-100,
    .dark .bg-gray-200 {
      background-color: #2A2A2A !important;
    }
    
    /* Status Badges - High contrast colors */
    .dark .bg-green-100 {
      background-color: #0F3B2C !important;
      color: #A3E9C4 !important;
    }
    
    .dark .bg-green-50 {
      background-color: #0F3B2C !important;
    }
    
    .dark .text-green-600,
    .dark .text-green-500 {
      color: #A3E9C4 !important;
    }
    
    .dark .bg-amber-100 {
      background-color: #4D3A1A !important;
      color: #FFD966 !important;
    }
    
    .dark .bg-red-100 {
      background-color: #5C1E1E !important;
      color: #FFA5A5 !important;
    }
    
    .dark .bg-red-50 {
      background-color: #5C1E1E !important;
    }
    
    .dark .text-red-600,
    .dark .text-red-500 {
      color: #FFA5A5 !important;
    }
    
    .dark .bg-blue-100 {
      background-color: #1C3B5C !important;
      color: #9AC8FF !important;
    }
    
    /* Links */
    .dark a:not(.text-primary) {
      color: #E0E0E0 !important;
    }
    
    .dark a:not(.text-primary):hover {
      color: #E29CAB !important;
    }
    
    /* Quill Editor Dark Mode */
    .dark .ql-toolbar {
      background-color: #1E1E1E !important;
      border-color: #3A3A3A !important;
    }
    
    .dark .ql-toolbar button {
      color: #FFFFFF !important;
    }
    
    .dark .ql-toolbar button .ql-stroke {
      stroke: #FFFFFF !important;
    }
    
    .dark .ql-toolbar button .ql-fill {
      fill: #FFFFFF !important;
    }
    
    .dark .ql-toolbar button:hover {
      background-color: #2A2A2A !important;
    }
    
    .dark .ql-editor {
      background-color: #1E1E1E !important;
      color: #FFFFFF !important;
    }
    
    .dark .ql-picker {
      color: #FFFFFF !important;
    }
    
    .dark .ql-picker-options {
      background-color: #2A2A2A !important;
      color: #FFFFFF !important;
    }
    
    /* Toast Notifications */
    .dark .bg-green-500 {
      background-color: #0F3B2C !important;
      color: #FFFFFF !important;
    }
    
    .dark .bg-red-500 {
      background-color: #5C1E1E !important;
      color: #FFFFFF !important;
    }
    
    .dark .bg-blue-500 {
      background-color: #1C3B5C !important;
      color: #FFFFFF !important;
    }
    
    /* Scrollbar */
    .dark ::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }
    
    .dark ::-webkit-scrollbar-track {
      background: #1E1E1E;
    }
    
    .dark ::-webkit-scrollbar-thumb {
      background: #4A4A4A;
      border-radius: 5px;
    }
    
    .dark ::-webkit-scrollbar-thumb:hover {
      background: #5A5A5A;
    }
    
    /* Dropdown menus */
    .dark select option {
      background-color: #2A2A2A;
      color: #FFFFFF;
    }
    
    /* Icons */
    .dark .material-symbols-outlined {
      color: inherit;
    }
    
    /* Dividers */
    .dark hr {
      border-color: #3A3A3A !important;
    }
    
    /* Cards with hover effects */
    .dark .card-hover:hover,
    .dark .hover\:shadow-lg:hover {
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5) !important;
      background-color: #2A2A2A !important;
    }
    
    /* Progress bar fill */
    .dark .bg-primary.rounded-full {
      background-color: #E29CAB !important;
    }
    
    /* Project cards */
    .dark [data-project-id] {
      background-color: #1E1E1E !important;
    }
    
    .dark [data-project-id]:hover {
      background-color: #2A2A2A !important;
    }
    
    /* Sidebar active state */
    .dark .bg-primary\/10 {
      background-color: rgba(201, 123, 138, 0.2) !important;
    }
  `;
  document.head.appendChild(style);
}

// Simple notification helper
function showNotification(message, type = 'info') {
  const notif = document.createElement('div');
  notif.className = `fixed bottom-4 right-4 p-3 rounded-lg shadow-lg z-50 animate-slide-in ${
    type === 'success' ? 'bg-green-500 text-white' : 
    type === 'error' ? 'bg-red-500 text-white' : 
    'bg-primary text-white'
  }`;
  notif.innerHTML = message;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 3000);
}

// ============================================
// PROJECT MANAGEMENT FUNCTIONS
// ============================================

// Get current active project
function getCurrentProject() {
  if (!state.currentProjectId) return null;
  return state.projects.find(p => p.id === state.currentProjectId) || null;
}

// Update current project data
function updateProject(projectId, updates) {
  const index = state.projects.findIndex(p => p.id === projectId);
  if (index !== -1) {
    state.projects[index] = { ...state.projects[index], ...updates, lastEdited: new Date().toISOString() };
    saveState();
    return true;
  }
  return false;
}

// Create new project
function createProject(title, targetWordCount = 50000) {
  const newProject = {
    id: Date.now().toString(),
    title: title || `New Project ${state.projects.length + 1}`,
    wordCount: 0,
    targetWordCount: targetWordCount,
    status: 'active',
    manuscriptContent: '',
    lastEdited: new Date().toISOString()
  };
  state.projects.push(newProject);
  state.currentProjectId = newProject.id;
  saveState();
  return newProject;
}

// Delete project (move to trash)
function deleteProject(projectId) {
  const project = state.projects.find(p => p.id === projectId);
  if (project) {
    state.projects = state.projects.filter(p => p.id !== projectId);
    state.trashedProjects = state.trashedProjects || [];
    state.trashedProjects.push({ ...project, trashedAt: new Date().toISOString() });
    if (state.currentProjectId === projectId) state.currentProjectId = null;
    saveState();
  }
}

// Move to Trash
function moveToTrash(type, id) {
  let item = null;
  switch(type) {
    case 'project':
      item = state.projects.find(p => p.id === id);
      if (item) {
        state.projects = state.projects.filter(p => p.id !== id);
        state.trashedProjects = state.trashedProjects || [];
        state.trashedProjects.push({ ...item, trashedAt: new Date().toISOString() });
        if (state.currentProjectId === id) state.currentProjectId = null;
      }
      break;
    case 'character':
      item = state.characters.find(c => c.id === id);
      if (item) {
        state.characters = state.characters.filter(c => c.id !== id);
        state.trashedCharacters = state.trashedCharacters || [];
        state.trashedCharacters.push({ ...item, trashedAt: new Date().toISOString() });
      }
      break;
    case 'world':
      item = state.worldData.find(w => w.id === id);
      if (item) {
        state.worldData = state.worldData.filter(w => w.id !== id);
        state.trashedWorldEntries = state.trashedWorldEntries || [];
        state.trashedWorldEntries.push({ ...item, trashedAt: new Date().toISOString() });
      }
      break;
    case 'thread':
      item = state.plotThreads.find(t => t.id === id);
      if (item) {
        state.plotThreads = state.plotThreads.filter(t => t.id !== id);
        state.trashedPlotThreads = state.trashedPlotThreads || [];
        state.trashedPlotThreads.push({ ...item, trashedAt: new Date().toISOString() });
      }
      break;
  }
  if (item) {
    saveState();
    return true;
  }
  return false;
}

function restoreFromArchive(type, id) {
  let item = null;
  switch(type) {
    case 'project':
      item = state.archivedProjects?.find(p => p.id === id);
      if (item) {
        state.archivedProjects = state.archivedProjects.filter(p => p.id !== id);
        state.projects.push(item);
      }
      break;
    case 'character':
      item = state.archivedCharacters?.find(c => c.id === id);
      if (item) {
        state.archivedCharacters = state.archivedCharacters.filter(c => c.id !== id);
        state.characters.push(item);
      }
      break;
    case 'world':
      item = state.archivedWorldEntries?.find(w => w.id === id);
      if (item) {
        state.archivedWorldEntries = state.archivedWorldEntries.filter(w => w.id !== id);
        state.worldData.push(item);
      }
      break;
    case 'thread':
      item = state.archivedPlotThreads?.find(t => t.id === id);
      if (item) {
        state.archivedPlotThreads = state.archivedPlotThreads.filter(t => t.id !== id);
        state.plotThreads.push(item);
      }
      break;
  }
  if (item) {
    saveState();
    return true;
  }
  return false;
}

// ============================================
// CHARACTER MANAGEMENT FUNCTIONS
// ============================================

function addCharacter(character) {
  const newCharacter = {
    id: Date.now().toString(),
    ...character,
    updatedAt: new Date().toISOString()
  };
  state.characters.push(newCharacter);
  saveState();
  return newCharacter;
}

function updateCharacter(characterId, updates) {
  const index = state.characters.findIndex(c => c.id === characterId);
  if (index !== -1) {
    state.characters[index] = { ...state.characters[index], ...updates, updatedAt: new Date().toISOString() };
    saveState();
    return true;
  }
  return false;
}

function deleteCharacter(characterId) {
  state.characters = state.characters.filter(c => c.id !== characterId);
  saveState();
}

// ============================================
// PLOT THREAD MANAGEMENT
// ============================================

function addPlotThread(thread) {
  const newThread = {
    id: Date.now().toString(),
    ...thread,
    updatedAt: new Date().toISOString()
  };
  state.plotThreads.push(newThread);
  saveState();
  return newThread;
}

function updatePlotThread(threadId, updates) {
  const index = state.plotThreads.findIndex(t => t.id === threadId);
  if (index !== -1) {
    state.plotThreads[index] = { ...state.plotThreads[index], ...updates, updatedAt: new Date().toISOString() };
    saveState();
    return true;
  }
  return false;
}

// ============================================
// WORLD DATA MANAGEMENT
// ============================================

function addWorldEntry(entry) {
  const newEntry = {
    id: Date.now().toString(),
    ...entry,
    updatedAt: new Date().toISOString()
  };
  state.worldData.push(newEntry);
  saveState();
  return newEntry;
}

function updateWorldEntry(entryId, updates) {
  const index = state.worldData.findIndex(w => w.id === entryId);
  if (index !== -1) {
    state.worldData[index] = { ...state.worldData[index], ...updates, updatedAt: new Date().toISOString() };
    saveState();
    return true;
  }
  return false;
}

// ============================================
// SCENE MANAGEMENT
// ============================================

function addScene(scene) {
  const newScene = {
    id: Date.now().toString(),
    ...scene,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  state.scenes.push(newScene);
  saveState();
  return newScene;
}

// ============================================
// AI-READY GENERATION FUNCTIONS (Placeholders)
// ============================================

// Scene engine placeholder
function generateSceneIdeas(description, characters = []) {
  const ideas = [
    `🎬 Open with: ${description.substring(0, 50)}... The atmosphere should immediately establish the emotional stakes. Consider starting with sensory details that reflect the characters' inner states.`,
    `💥 Conflict injection: Introduce a misunderstanding or reveal a hidden agenda. One character has been keeping a secret that now threatens to surface.`,
    `❤️ Emotional beat: A moment of vulnerability. Someone shows weakness or unexpected strength, revealing a new dimension to their character.`,
    `🌀 Plot twist: An external event interrupts the scene—a messenger arrives, a storm hits, or an antagonist appears earlier than expected.`,
    `⚡ Escalation: Raise the stakes by introducing a time limit or a consequence for failure.`,
    `🔮 Resolution: End with a decision or discovery that propels the story forward.`
  ];
  return ideas;
}

// I'm Stuck placeholder
function generateTwists(lastEvent, characters = [], plotThreads = []) {
  const twists = [
    `🔀 Plot Twist: The character you trust most has been working against you the entire time.`,
    `💔 Emotional Twist: A deep secret from someone's past is revealed, changing how everyone sees them.`,
    `🌀 Reality Twist: What your character believes to be true about the world is fundamentally wrong.`
  ];
  
  const escalations = [
    `⚡ Raise Stakes: Add a time limit—if they don't succeed by dawn, something terrible happens.`,
    `⚡ Introduce Danger: A new threat emerges that's more dangerous than the original conflict.`,
    `⚡ Complicate Relationships: Someone they love is now directly in danger because of their actions.`
  ];
  
  const wildcard = `🌀 Wildcard: A seemingly minor character from earlier returns with crucial information that changes everything.`;
  
  return { twists, escalations, wildcard };
}

// Deepen character placeholder
function deepenCharacter(character) {
  const traits = [
    `has a secret hobby that contradicts their public persona`,
    `maintains a relationship with someone the reader would never expect`,
    `carries guilt from a past decision that mirrors the current conflict`,
    `possesses a skill that seems useless but will become crucial later`,
    `believes in something that puts them at odds with everyone they care about`
  ];
  
  const randomTrait = traits[Math.floor(Math.random() * traits.length)];
  return `${character.name} ${randomTrait}. This adds layers to their motivation and creates potential for rich dramatic irony.`;
}

// Make character messier placeholder
function makeMessier(character) {
  const flaws = [
    `jealousy that clouds their judgment at critical moments`,
    `a tendency to lie even when the truth would serve them better`,
    `addiction to a vice that others would judge harshly`,
    `cowardice that surfaces when courage is most needed`,
    `pride that prevents them from asking for help or admitting mistakes`
  ];
  
  const randomFlaw = flaws[Math.floor(Math.random() * flaws.length)];
  return `${character.name} now struggles with ${randomFlaw}. This creates internal conflict and opportunities for character growth.`;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Calculate total words across all projects
function getTotalWords() {
  return state.projects.reduce((total, project) => total + (project.wordCount || 0), 0);
}

// Get project statistics
function getProjectStats() {
  const totalProjects = state.projects.length;
  const activeProjects = state.projects.filter(p => p.status === 'active').length;
  const completedProjects = state.projects.filter(p => p.wordCount >= p.targetWordCount).length;
  const totalWords = getTotalWords();
  
  return { totalProjects, activeProjects, completedProjects, totalWords };
}

// Export all data
function exportAllData() {
  return JSON.stringify(state, null, 2);
}

// Import data (merge or replace)
function importData(jsonData, replace = false) {
  try {
    const imported = JSON.parse(jsonData);
    if (replace) {
      state = { ...DEFAULT_STATE, ...imported };
    } else {
      // Merge arrays
      state.projects = [...state.projects, ...(imported.projects || [])];
      state.characters = [...state.characters, ...(imported.characters || [])];
      state.plotThreads = [...state.plotThreads, ...(imported.plotThreads || [])];
      state.worldData = [...state.worldData, ...(imported.worldData || [])];
    }
    saveState();
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
}

// Clear all data (with confirmation)
function resetAllData() {
  if (confirm('⚠️ WARNING: This will delete ALL your data. This cannot be undone. Continue?')) {
    state = { ...DEFAULT_STATE };
    saveState();
    window.location.reload();
  }
}

// Escape HTML for safe display
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================
// INITIALIZATION
// ============================================

// Load state when script loads
loadState();

// Initialize dark mode
initDarkMode();
addDarkModeStyles();

// Listen for storage events to sync across tabs
window.addEventListener('storage', (e) => {
  if (e.key === 'storyBrainState' && e.newValue) {
    try {
      state = { ...DEFAULT_STATE, ...JSON.parse(e.newValue) };
      // Trigger a custom event for pages to refresh
      window.dispatchEvent(new CustomEvent('storyBrainStateUpdated'));
    } catch (error) {
      console.error('Error syncing state:', error);
    }
  }
});

// Make functions globally available
window.state = state;
window.loadState = loadState;
window.saveState = saveState;
window.getCurrentProject = getCurrentProject;
window.updateProject = updateProject;
window.createProject = createProject;
window.deleteProject = deleteProject;
window.addCharacter = addCharacter;
window.updateCharacter = updateCharacter;
window.deleteCharacter = deleteCharacter;
window.addPlotThread = addPlotThread;
window.updatePlotThread = updatePlotThread;
window.addWorldEntry = addWorldEntry;
window.updateWorldEntry = updateWorldEntry;
window.addScene = addScene;
window.generateSceneIdeas = generateSceneIdeas;
window.generateTwists = generateTwists;
window.deepenCharacter = deepenCharacter;
window.makeMessier = makeMessier;
window.getTotalWords = getTotalWords;
window.getProjectStats = getProjectStats;
window.exportAllData = exportAllData;
window.importData = importData;
window.resetAllData = resetAllData;
window.escapeHtml = escapeHtml;
window.moveToTrash = moveToTrash;
window.restoreFromArchive = restoreFromArchive;
window.toggleDarkMode = toggleDarkMode;
window.initDarkMode = initDarkMode;
window.showNotification = showNotification;

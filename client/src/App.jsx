import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, CheckCircle, Circle, Trash2, ExternalLink, Home, Star,
  Hash, LayoutGrid, BookOpen, Globe, PenTool, BrainCircuit,
  AlertCircle, Check, User,
  Cpu, Database, Layers, Monitor, Target, Zap,
  Code, Command, Compass, Briefcase, Heart, MoveRight, MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Constants ───────────────────────────────────────────────────────────────

const PREBUILT_CONFIGS = {
  DSA:     { subtitle: 'Algorithms',        IconComp: BookOpen,     className: 'folder-dsa'     },
  WAP:     { subtitle: 'Web & Programming', IconComp: Globe,        className: 'folder-wap'     },
  Maths:   { subtitle: 'Mathematics',       IconComp: PenTool,      className: 'folder-maths'   },
  FOAI:    { subtitle: 'AI Foundations',    IconComp: BrainCircuit, className: 'folder-foai'    },
  General: { subtitle: 'General Notes',     IconComp: Layers,       className: 'folder-general' },
};

const DIFFICULTY_CFG = {
  Easy:   { bg: '#dcfce7', text: '#16a34a', dot: '#22c55e' },
  Medium: { bg: '#fef9c3', text: '#ca8a04', dot: '#eab308' },
  Hard:   { bg: '#fee2e2', text: '#dc2626', dot: '#ef4444' },
};
const DIFF_ORDER = { Easy: 1, Medium: 2, Hard: 3 };

const GRADIENTS = [
  'linear-gradient(135deg,#f43f5e,#fb923c)',
  'linear-gradient(135deg,#10b981,#3b82f6)',
  'linear-gradient(135deg,#8b5cf6,#ec4899)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#06b6d4,#3b82f6)',
];
const ICONS = [Cpu, Database, Layers, Monitor, Target, Zap, Code, Command, Compass, Briefcase];

const hash = (str) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h);
};
const folderGradient = (n) => GRADIENTS[hash(n) % GRADIENTS.length];
const folderIcon     = (n, sz = 64) => { const I = ICONS[hash(n) % ICONS.length]; return <I size={sz} strokeWidth={1.5} />; };

// ─── Default Data ─────────────────────────────────────────────────────────────

const DEFAULT_FOLDERS = ['General', 'DSA', 'WAP', 'Maths', 'FOAI'];
const DEFAULT_SUBFOLDERS = {
  General: ['All'],
  DSA:     ['All', 'Arrays', 'Graphs', 'Trees', 'DP'],
  WAP:     ['All', 'React', 'CSS', 'JavaScript'],
  Maths:   ['All'],
  FOAI:    ['All'],
};

// ─── localStorage helpers ────────────────────────────────────────────────────

const loadQuestions = () => {
  try {
    const saved = localStorage.getItem('nn_questions');
    let questions = saved ? JSON.parse(saved) : [];
    
    // If we have no questions, try migrating from legacy key
    if (questions.length === 0) {
      const legacy = localStorage.getItem('newton_notes_data');
      if (legacy) {
        const legacyData = JSON.parse(legacy);
        questions = legacyData
          .filter(q => q.title !== '__FOLDER__')
          .map(q => ({
            id: q.id || String(Date.now() + Math.random()),
            title: q.title || 'Untitled',
            url: q.url || '#',
            difficulty: q.difficulty || 'Medium',
            folder: q.topic || 'General',
            subfolder: (q.subtopic && !['Uncategorized','General'].includes(q.subtopic)) ? q.subtopic : 'All',
            liked: q.isStarred || q.liked || false,
            status: q.status || 'unsolved',
            createdAt: q.createdAt || new Date().toISOString(),
          }));
      }
    }
    
    // Seed a welcome question if still empty
    if (questions.length === 0) {
      questions = [{
        id: 'welcome',
        title: 'Welcome to CN Track! Add your first question.',
        url: 'https://github.com',
        difficulty: 'Easy',
        folder: 'General',
        subfolder: 'All',
        liked: true,
        status: 'unsolved',
        createdAt: new Date().toISOString()
      }];
    }

    return questions;
  } catch (e) { console.error('Load questions error:', e); return []; }
};

const loadFolders = () => {
  try {
    const saved = localStorage.getItem('nn_folders');
    let currentFolders = saved ? JSON.parse(saved) : [...DEFAULT_FOLDERS];
    
    // Check legacy data for additional topics
    const legacy = localStorage.getItem('newton_notes_data');
    if (legacy) {
      const legacyData = JSON.parse(legacy);
      const topics = [...new Set(legacyData.filter(q => q.title !== '__FOLDER__' && q.topic).map(q => q.topic))];
      topics.forEach(t => { 
        if (t && !currentFolders.find(f => f.toLowerCase() === t.toLowerCase())) {
          currentFolders.push(t);
        }
      });
    }
    
    return currentFolders;
  } catch (e) { return [...DEFAULT_FOLDERS]; }
};


const loadSubfolders = () => {
  try {
    const saved = localStorage.getItem('nn_subfolders');
    if (saved) { const p = JSON.parse(saved); if (p && typeof p === 'object') return p; }
  } catch (e) { /* ignore */ }
  return { ...DEFAULT_SUBFOLDERS };
};

// ─── Landing Screen ───────────────────────────────────────────────────────────

const LandingScreen = ({ onEnter }) => {
  const [opening, setOpening] = useState(false);
  const open = () => { setOpening(true); setTimeout(onEnter, 800); };
  return (
    <motion.div className="landing-screen" animate={{ opacity: opening ? 0 : 1 }} transition={{ duration: 0.5, delay: 0.3 }}>
      <div className="notebook-wrapper">
        <motion.div className="cover-half cover-left"  animate={{ x: opening ? -300 : 0 }} transition={{ duration: 0.8, ease: 'easeInOut' }} />
        <motion.div className="cover-half cover-right" animate={{ x: opening ?  300 : 0 }} transition={{ duration: 0.8, ease: 'easeInOut' }} />
        {!opening && (
          <div style={{ position: 'absolute', zIndex: 100 }}>
            <button className="open-notebook-btn" onClick={open}>Open Notebook</button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ─── Popover wrapper ──────────────────────────────────────────────────────────

const Pop = ({ children, open, from = 'bottom', style = {} }) => {
  const isTop = from === 'top';
  const init = isTop ? { opacity: 0, y: -10 } : { opacity: 0, y: 10 };
  
  return (
    <AnimatePresence>
      {open && (
        <motion.div 
          initial={init} 
          animate={{ opacity: 1, y: 0 }} 
          exit={init}
          style={{ 
            position: 'absolute', 
            [isTop ? 'bottom' : 'top']: 'calc(100% + 0.5rem)',
            right: 0,
            background: '#fff', 
            padding: '1.25rem', 
            borderRadius: '1.25rem',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', 
            zIndex: 1000, 
            border: '1px solid #f1f5f9',
            minWidth: '220px',
            ...style 
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};


// ─── Main App ─────────────────────────────────────────────────────────────────

function App() {
  const [hasEntered,       setHasEntered]       = useState(sessionStorage.getItem('hasEntered') === 'true');
  const [view,             setView]             = useState('home');
  const [questions,        setQuestions]        = useState(loadQuestions);
  const [folders,          setFolders]          = useState(loadFolders);
  const [subfolders,       setSubfolders]       = useState(loadSubfolders);
  const [selectedFolder,   setSelectedFolder]   = useState('All');
  const [selectedSubfolder,setSelectedSubfolder]= useState('All');
  const [searchQuery,      setSearchQuery]      = useState('');
  const [jsonInput,        setJsonInput]        = useState('');
  const [toast,            setToast]            = useState(null);
  const [activePopover,    setActivePopover]    = useState(null);
  const [nfName,           setNfName]           = useState('');
  const [sortOrder,        setSortOrder]        = useState('none'); // 'none', 'asc', 'desc'

  // ── Persistence ──────────────────────────────────────────────────────────
  useEffect(() => { localStorage.setItem('nn_questions',  JSON.stringify(questions));  }, [questions]);
  useEffect(() => { localStorage.setItem('nn_folders',    JSON.stringify(folders));    }, [folders]);
  useEffect(() => { localStorage.setItem('nn_subfolders', JSON.stringify(subfolders)); }, [subfolders]);

  useEffect(() => { setSelectedSubfolder('All'); }, [selectedFolder, view]);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleJSONAdd = () => {
    try {
      if (!jsonInput.trim()) return showToast('Please enter JSON', 'error');
      const parsed = JSON.parse(jsonInput);
      const items = Array.isArray(parsed) ? parsed : [parsed];

      const isInSpecificFolder = selectedFolder !== 'All' && selectedFolder !== 'Important';
      const isInSpecificSubfolder = selectedSubfolder !== 'All';

      const validItems = items
        .filter(item => item.title && item.url)
        .filter(item => !questions.find(q => q.url === item.url))
        .map(item => ({
          id: Date.now().toString() + Math.random(),
          title: item.title,
          url: item.url,
          difficulty: item.difficulty || 'Medium',
          folder: isInSpecificFolder ? selectedFolder : (item.folder || 'General'),
          subfolder: isInSpecificSubfolder ? selectedSubfolder : (item.subfolder || 'All'),
          liked: item.liked || false,
          status: 'unsolved',
          createdAt: new Date().toISOString()
        }));

      if (validItems.length === 0) return showToast('No valid or new questions found', 'error');

      setQuestions(prev => [...prev, ...validItems]);
      setJsonInput('');
      showToast(`${validItems.length} items added!`);
    } catch (e) {
      showToast('Invalid JSON format', 'error');
    }
  };

  const addFolder = () => {
    const name = nfName.trim();
    if (!name) return showToast('Folder name required', 'error');
    if (folders.includes(name)) return showToast('Folder already exists', 'error');
    setFolders(prev => [...prev, name]);
    setSubfolders(prev => ({ ...prev, [name]: ['All'] }));
    setNfName('');
    setActivePopover(null);
    showToast('Folder Created');
  };

  const updateQuestion = (id, data) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...data } : q));
    setActivePopover(null);
  };

  const deleteQuestion = (id) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
    showToast('Removed');
  };

  const toggleStar = (id) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, liked: !q.liked } : q));
  };

  const addSubfolder = (folderName, subName) => {
    const existing = subfolders[folderName] || ['All'];
    if (existing.includes(subName)) return showToast('Exists', 'error');
    setSubfolders(prev => ({ ...prev, [folderName]: [...existing, subName] }));
  };

  const deleteFolder = (folderName) => {
    if (folderName === 'All' || folderName === 'General') return showToast('Cannot delete system folder', 'error');
    setFolders(prev => prev.filter(f => f !== folderName));
    setSubfolders(prev => {
      const copy = { ...prev };
      delete copy[folderName];
      return copy;
    });
    setQuestions(prev => prev.filter(q => q.folder !== folderName));
    setSelectedFolder('All');
    showToast(`Folder "${folderName}" deleted`);
    setActivePopover(null);
  };

  const deleteSubfolder = (folderName, subName) => {
    if (subName === 'All') return showToast('Cannot delete default subfolder', 'error');
    setSubfolders(prev => ({
      ...prev,
      [folderName]: (prev[folderName] || ['All']).filter(s => s !== subName)
    }));
    setQuestions(prev => prev.map(q => 
      (q.folder === folderName && q.subfolder === subName) ? { ...q, subfolder: 'All' } : q
    ));
    setSelectedSubfolder('All');
    showToast(`Subfolder "${subName}" removed`);
    setActivePopover(null);
  };

  // ── Filtering Logic ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let base = questions.filter(q => {
      if (selectedFolder === 'Important') return q.liked;
      return (selectedFolder === 'All' || q.folder === selectedFolder) &&
             (selectedSubfolder === 'All' || q.subfolder === selectedSubfolder);
    });
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      base = base.filter(item => 
        item.title.toLowerCase().includes(q) || 
        item.folder.toLowerCase().includes(q) || 
        item.subfolder.toLowerCase().includes(q)
      );
    }
    
    if (sortOrder !== 'none') {
      base.sort((a, b) => {
        const valA = DIFF_ORDER[a.difficulty] || 2;
        const valB = DIFF_ORDER[b.difficulty] || 2;
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      });
    }
    return base;
  }, [questions, selectedFolder, selectedSubfolder, searchQuery, sortOrder]);

  const stats = useMemo(() => {
    const c = {};
    questions.forEach(q => { c[q.folder] = (c[q.folder] || 0) + 1; });
    return c;
  }, [questions]);

  // ── Shared input style ────────────────────────────────────────────────────
  const inputStyle = {
    width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.6rem',
    border: '1px solid #e2e8f0', outline: 'none', fontWeight: '600',
    fontSize: '0.85rem', marginBottom: '0.5rem', background: '#f8fafc',
  };
  const selectStyle = { ...inputStyle, cursor: 'pointer' };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  const renderToast = () => (
    <AnimatePresence>
      {toast && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
          className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </motion.div>
      )}
    </AnimatePresence>
  );



  const renderCard = (q) => {
    const dc  = DIFFICULTY_CFG[q.difficulty] || DIFFICULTY_CFG.Medium;
    const isSettingsOpen = activePopover === `settings-${q.id}`;
    const isDeleteOpen   = activePopover === `delete-${q.id}`;

    return (
      <div key={q.id} className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: '800', background: dc.bg, color: dc.text, padding: '0.15rem 0.5rem', borderRadius: '1rem', border: `1px solid ${dc.dot}`, textTransform: 'uppercase' }}>
                {q.difficulty}
              </span>
              {q.subfolder !== 'All' && (
                <span style={{ fontSize: '0.65rem', fontWeight: '800', background: '#e0e7ff', color: '#4338ca', padding: '0.15rem 0.5rem', borderRadius: '1rem', border: '1px solid #6366f1' }}>
                  {q.subfolder.toUpperCase()}
                </span>
              )}
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#000', lineHeight: '1.4' }}>{q.title}</h3>
          </div>
          
          <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
            {/* Star Toggle */}
            <button className="sidebar-item" 
              style={{ background: 'transparent', padding: '0.4rem', borderRadius: '0.5rem' }}
              onClick={() => toggleStar(q.id)}>
              <Star size={18} color={q.liked ? '#fbbf24' : '#64748b'} fill={q.liked ? '#fbbf24' : 'transparent'} />
            </button>

            {/* Hidden Settings (Folder/Subfolder) */}
            <div style={{ position: 'relative' }}>
              <button className={`sidebar-item ${isSettingsOpen ? 'active' : ''}`}
                style={{ background: 'transparent', padding: '0.4rem', borderRadius: '0.5rem' }}
                onClick={() => setActivePopover(isSettingsOpen ? null : `settings-${q.id}`)}>
                <MoreVertical size={18} color="#64748b" />
              </button>
              <Pop open={isSettingsOpen} from="bottom" style={{ width: '240px' }}>
                <p style={{ fontWeight: '800', fontSize: '0.75rem', marginBottom: '0.75rem', opacity: 0.5 }}>MOVE TO...</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <select className="search-input" style={{ ...inputStyle, padding: '0.4rem' }}
                    value={q.folder} onChange={e => updateQuestion(q.id, { folder: e.target.value, subfolder: 'All' })}>
                    {folders.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <select className="search-input" style={{ ...inputStyle, padding: '0.4rem' }}
                    value={q.subfolder} onChange={e => updateQuestion(q.id, { subfolder: e.target.value })}>
                    {(subfolders[q.folder] || ['All']).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </Pop>
            </div>

            {/* Confirm Delete */}
            <div style={{ position: 'relative' }}>
              <button className="sidebar-item"
                style={{ background: 'transparent', padding: '0.4rem', borderRadius: '0.5rem' }}
                onClick={() => setActivePopover(isDeleteOpen ? null : `delete-${q.id}`)}>
                <Trash2 size={16} color="#ef4444" />
              </button>
              <Pop open={isDeleteOpen} from="bottom" style={{ width: '200px' }}>
                <p style={{ fontWeight: '800', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#dc2626' }}>Delete Permanently?</p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="sidebar-item" style={{ background: '#f1f5f9', flex: 1, fontSize: '0.8rem' }} onClick={() => setActivePopover(null)}>No</button>
                  <button className="sidebar-item" style={{ background: '#dc2626', color: '#fff', flex: 1, fontSize: '0.8rem' }} 
                    onClick={() => { deleteQuestion(q.id); setActivePopover(null); }}>Yes</button>
                </div>
              </Pop>
            </div>
          </div>
        </div>

        <a href={q.url} target="_blank" rel="noreferrer" className="sidebar-item" 
           style={{ background: '#000', color: '#fff', justifyContent: 'center', marginTop: '1.25rem' }}>
          Open Question <ExternalLink size={14} style={{ marginLeft: '0.5rem' }} />
        </a>
      </div>
    );
  };

  // ── Dashboard View ────────────────────────────────────────────────────────
  const renderDashboard = () => (
    <div className="animate-slide">
      <header className="header-top" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div className="nav-links">
            <span className="nav-link" onClick={() => setView('home')} style={{ cursor: 'pointer', opacity: 0.5 }}>HOME</span>
            <span className="nav-link active" style={{ fontWeight: 800 }}>{selectedFolder.toUpperCase()}</span>
          </div>
          <div className="search-bar-modern" style={{ width: '350px' }}>
            <Search size={18} color="#64748b" />
            <input className="search-input" placeholder="Search questions..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', width: '100%', alignItems: 'center', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.5 }}>DIFFICULTY SORT:</span>
          <button className={`sidebar-item ${sortOrder === 'asc' ? 'active' : ''}`}
            style={{ padding: '0.4rem 1rem', fontSize: '0.75rem' }}
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'none' : 'asc')}>
            Asc ↑
          </button>
          <button className={`sidebar-item ${sortOrder === 'desc' ? 'active' : ''}`}
            style={{ padding: '0.4rem 1rem', fontSize: '0.75rem' }}
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'none' : 'desc')}>
            Desc ↓
          </button>
        </div>

        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '1.5rem', width: '100%', border: '1px solid #e2e8f0' }}>
          <p style={{ fontWeight: '800', fontSize: '0.85rem', marginBottom: '0.75rem', opacity: 0.6 }}>PASTE JSON DATA</p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <textarea 
              style={{ ...inputStyle, flex: 1, minHeight: '80px', fontFamily: 'monospace', resize: 'vertical' }}
              placeholder='[ { "title": "Example", "url": "https://..." } ]'
              value={jsonInput} onChange={e => setJsonInput(e.target.value)}
            />
            <button className="sidebar-item" 
              style={{ background: '#000', color: '#fff', height: 'fit-content', padding: '0.8rem 1.5rem' }}
              onClick={handleJSONAdd}>
              Add Question
            </button>
          </div>
        </div>
      </header>

      {/* Subfolder Toggle */}
      {selectedFolder !== 'All' && (
        <div style={{ display: 'flex', gap: '0.75rem', margin: '2rem 0', flexWrap: 'wrap' }}>
          {(subfolders[selectedFolder] || ['All']).map(sub => (
            <button key={sub} className={`sidebar-item ${selectedSubfolder === sub ? 'active' : ''}`}
              style={{ borderRadius: '999px', fontSize: '1rem', padding: '0.7rem 1.75rem', fontWeight: '800' }}
              onClick={() => setSelectedSubfolder(sub)}>
              {sub}
            </button>
          ))}
          <button className="sidebar-item" style={{ borderRadius: '999px', fontSize: '1rem', padding: '0.7rem 1.5rem', background: '#f1f5f9', fontWeight: '800' }}
            onClick={() => {
              const res = prompt('Subfolder name:');
              if (res) addSubfolder(selectedFolder, res);
            }}>
            + Add Subfolder
          </button>
        </div>
      )}

      <div className="question-grid">
        {filtered.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem 0', color: 'var(--text-secondary)' }}>
            <AlertCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
            <p style={{ fontWeight: '800', fontSize: '1.2rem' }}>No questions found.</p>
          </div>
        ) : (
          filtered.map(q => renderCard(q))
        )}
      </div>
    </div>
  );

  const renderHome = () => (
    <div className="animate-slide">
      <header style={{ marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: '900', color: '#000' }}>Question Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Full functional study base control.</p>
      </header>
      
      <div className="folder-grid">
        {folders.map(name => {
          const cfg = PREBUILT_CONFIGS[name] || { className: 'folder-general' };
          return (
            <div key={name} className={`folder-card ${cfg.className}`}
              onClick={() => { setSelectedFolder(name); setView('dashboard'); }}>
              <div className="pop-out-icon">
                {folderIcon(name)}
              </div>
              <h3 className="folder-name">{name}</h3>
              <p style={{ fontWeight: '800', fontSize: '0.9rem' }}>{stats[name] || 0} ITEMS</p>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="app-layout">
      <AnimatePresence>
        {!hasEntered && (
          <LandingScreen onEnter={() => { setHasEntered(true); sessionStorage.setItem('hasEntered', 'true'); }} />
        )}
      </AnimatePresence>

      {renderToast()}

      <div className={`main-container ${!hasEntered ? 'blur-sm' : ''}`}>
        <aside className="sidebar">
          <div className="sidebar-logo" onClick={() => setView('home')} style={{ cursor: 'pointer' }}>QS.Dash</div>
          
          <nav className="sidebar-menu">
            <div className={`sidebar-item ${view === 'home' ? 'active' : ''}`}
              onClick={() => setView('home')}>
              <Home size={18} /> Home
            </div>
            <div className={`sidebar-item ${selectedFolder === 'All' && view === 'dashboard' ? 'active' : ''}`}
              style={{ fontSize: '1.1rem', padding: '1rem 1.5rem', marginBottom: '0.5rem' }}
              onClick={() => { setView('dashboard'); setSelectedFolder('All'); }}>
              <Hash size={22} /> All Questions
            </div>
            <div className={`sidebar-item ${selectedFolder === 'Important' && view === 'dashboard' ? 'active' : ''}`}
              onClick={() => { setView('dashboard'); setSelectedFolder('Important'); }}>
              <Star size={18} /> Important
            </div>
            {folders.map(f => (
              <div key={f} className={`sidebar-item ${selectedFolder === f && view === 'dashboard' ? 'active' : ''}`}
                onClick={() => { setView('dashboard'); setSelectedFolder(f); }}>
                #{f}
              </div>
            ))}
          </nav>

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* Delete current Subfolder if selected */}
            {view === 'dashboard' && selectedFolder !== 'All' && selectedSubfolder !== 'All' && (
              <div style={{ position: 'relative' }}>
                <button className="sidebar-item" style={{ background: '#fee2e2', color: '#dc2626', width: '100%', fontSize: '0.75rem' }}
                  onClick={() => setActivePopover(activePopover === 'delSF' ? null : 'delSF')}>
                  <Trash2 size={14} /> Delete Subfolder: {selectedSubfolder}
                </button>
                <Pop open={activePopover === 'delSF'} from="top" style={{ width: '220px' }}>
                  <p style={{ fontWeight: '800', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#dc2626' }}>Confirm Delete?</p>
                  <p style={{ fontSize: '0.75rem', marginBottom: '0.75rem', opacity: 0.7 }}>Questions will be moved to "All".</p>
                  <button className="sidebar-item" style={{ background: '#dc2626', color: '#fff', width: '100%' }} 
                    onClick={() => deleteSubfolder(selectedFolder, selectedSubfolder)}>Delete Subfolder</button>
                </Pop>
              </div>
            )}

            {/* Delete current Folder if selected */}
            {view === 'dashboard' && !['All', 'General', 'Important'].includes(selectedFolder) && (
              <div style={{ position: 'relative' }}>
                <button className="sidebar-item" style={{ background: '#fee2e2', color: '#dc2626', width: '100%', fontSize: '0.75rem' }}
                  onClick={() => setActivePopover(activePopover === 'delF' ? null : 'delF')}>
                  <Trash2 size={14} /> Delete Folder: {selectedFolder}
                </button>
                <Pop open={activePopover === 'delF'} from="top" style={{ width: '220px' }}>
                  <p style={{ fontWeight: '800', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#dc2626' }}>Delete "{selectedFolder}"?</p>
                  <p style={{ fontSize: '0.75rem', marginBottom: '0.75rem', opacity: 0.7 }}>ALL questions in this folder will be PERMANENTLY DELETED.</p>
                  <button className="sidebar-item" style={{ background: '#dc2626', color: '#fff', width: '100%' }} 
                    onClick={() => deleteFolder(selectedFolder)}>Delete Everything</button>
                </Pop>
              </div>
            )}

            <div style={{ position: 'relative' }}>
              <button className="sidebar-item" style={{ background: '#f1f5f9', width: '100%' }}
                onClick={() => setActivePopover(activePopover === 'addF' ? null : 'addF')}>
                + Add Folder
              </button>
              <Pop open={activePopover === 'addF'} from="top" style={{ width: '220px' }}>
                <p style={{ fontWeight: '800', marginBottom: '0.5rem', fontSize: '0.85rem' }}>New Folder Name</p>
                <input style={inputStyle} value={nfName} onChange={e => setNfName(e.target.value)} placeholder="DSA, WAP..." />
                <button className="sidebar-item" style={{ background: '#000', color: '#fff', width: '100%', marginTop: '0.5rem' }} onClick={addFolder}>Create</button>
              </Pop>
            </div>
          </div>
        </aside>

        <main className="main-content">
          {view === 'home' ? renderHome() : renderDashboard()}
        </main>
      </div>
    </div>
  );
}

export default App;

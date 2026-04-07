import React, { useState, useEffect, useMemo } from 'react';

import { 
  Search, CheckCircle, Circle, Trash2, ExternalLink, 
  Star, Hash, LayoutGrid, Bookmark, ArrowRight,
  FolderOpen, Settings, Filter, MoreVertical,
  ChevronLeft, BookOpen, Globe, PenTool, BrainCircuit,
  Info, X, AlertCircle, Check, Home, Menu, User,
  Cpu, Database, Layers, Monitor, Target, Zap, 
  Code, Command, Compass, Briefcase
} from 'lucide-react';
// eslint-disable-next-line
import { motion, AnimatePresence } from 'framer-motion';


const MagicBookImg = '/magic_book.png'; // Handled via public folder or relative path

const PREBUILT_FOLDERS = [
  { id: 'DSA', name: 'DSA', subtitle: 'Algorithms', icon: <BookOpen size={64} strokeWidth={1.5} />, className: 'folder-dsa' },
  { id: 'WAP', name: 'WAP', subtitle: 'Web & Programming', icon: <Globe size={64} strokeWidth={1.5} />, className: 'folder-wap' },
  { id: 'Maths', name: 'Maths', subtitle: 'Mathematics', icon: <PenTool size={64} strokeWidth={1.5} />, className: 'folder-maths' },
  { id: 'FOAI', name: 'FOAI', subtitle: 'AI Foundations', icon: <BrainCircuit size={64} strokeWidth={1.5} />, className: 'folder-foai' },
];

const CUSTOM_COLORS = [
  '#f43f5e', // Rose
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#06b6d4'  // Cyan
];

const CUSTOM_GRADIENTS = [
  'linear-gradient(135deg, #f43f5e, #fb923c)', // Rose-Orange
  'linear-gradient(135deg, #10b981, #3b82f6)', // Emerald-Blue
  'linear-gradient(135deg, #8b5cf6, #ec4899)', // Violet-Pink
  'linear-gradient(135deg, #f59e0b, #ef4444)', // Amber-Red
  'linear-gradient(135deg, #06b6d4, #3b82f6)'  // Cyan-Blue
];

const RANDOM_ICONS = [
  <Cpu size={64} strokeWidth={1.5} />,
  <Database size={64} strokeWidth={1.5} />,
  <Layers size={64} strokeWidth={1.5} />,
  <Monitor size={64} strokeWidth={1.5} />,
  <Target size={64} strokeWidth={1.5} />,
  <Zap size={64} strokeWidth={1.5} />,
  <Code size={64} strokeWidth={1.5} />,
  <Command size={64} strokeWidth={1.5} />,
  <Compass size={64} strokeWidth={1.5} />,
  <Briefcase size={64} strokeWidth={1.5} />
];

const getGradientForTopic = (folderName) => {
  let hash = 0;
  for (let i = 0; i < folderName.length; i++) hash = folderName.charCodeAt(i) + ((hash << 5) - hash);
  return CUSTOM_GRADIENTS[Math.abs(hash) % CUSTOM_GRADIENTS.length];
};

const getIconForTopic = (folderName) => {
  let hash = 0;
  for (let i = 0; i < folderName.length; i++) hash = folderName.charCodeAt(i) + ((hash << 5) - hash);
  return RANDOM_ICONS[Math.abs(hash) % RANDOM_ICONS.length];
};

const LandingScreen = ({ onEnter }) => {
  const [isOpening, setIsOpening] = useState(false);

  const handleOpen = () => {
    setIsOpening(true);
    setTimeout(() => {
      onEnter();
    }, 800);
  };

  return (
    <motion.div 
      className="landing-screen"
      animate={{ opacity: isOpening ? 0 : 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="notebook-wrapper">
        <motion.div 
          className="cover-half cover-left" 
          animate={{ x: isOpening ? -300 : 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
        <motion.div 
          className="cover-half cover-right" 
          animate={{ x: isOpening ? 300 : 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
        
        {!isOpening && (
          <div style={{ position: 'absolute', zIndex: 100 }}>
             <button className="open-notebook-btn" onClick={handleOpen}>
               Open Notebook
             </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

function App() {
  const [hasEntered, setHasEntered] = useState(sessionStorage.getItem('hasEntered') === 'true');
  const [view, setView] = useState('home'); 
  
  const [questions, setQuestions] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('all');
  
  // Feedback states
  const [toast, setToast] = useState(null);
  
  // Anchor Popover State replaces all modals
  const [activePopover, setActivePopover] = useState(null); 
  const [newQuestion, setNewQuestion] = useState({ title: '', url: '', difficulty: 'Medium' });
  const [newFolder, setNewFolder] = useState({ name: '' });

  useEffect(() => {
    const normalizeData = (data) => {
      if (!Array.isArray(data)) return [];
      return data.map(q => ({
        ...q,
        folder: q.folder || 'General',
        liked: q.liked || false
      }));
    };

    if (window.chrome && window.chrome.storage && window.chrome.storage.local) {
      // Load initial
      window.chrome.storage.local.get(['questions'], (result) => {
        setQuestions(normalizeData(result.questions));
      });

      // Listen for changes
      const handleStorageChange = (changes, areaName) => {
        if (areaName === 'local' && changes.questions) {
          setQuestions(normalizeData(changes.questions.newValue));
        }
      };
      
      window.chrome.storage.onChanged.addListener(handleStorageChange);
      return () => window.chrome.storage.onChanged.removeListener(handleStorageChange);
    } else {
      // Fallback
      const saved = localStorage.getItem('questions');
      if (saved) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setQuestions(normalizeData(JSON.parse(saved)));
      }
    }
  }, []);

  const updateStorage = (newQuestions) => {
    setQuestions(newQuestions); // Optimistic UI update
    if (window.chrome && window.chrome.storage && window.chrome.storage.local) {
      window.chrome.storage.local.set({ questions: newQuestions });
    } else {
      localStorage.setItem('questions', JSON.stringify(newQuestions));
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Derived state calculations
  const folders = useMemo(() => {
    const uniqueTopics = new Set(questions.map(q => q.folder).filter(Boolean));
    return Array.from(uniqueTopics);
  }, [questions]);

    
  const stats = useMemo(() => {
    return questions.reduce((acc, q) => {
      if (q.title !== '__FOLDER__') {
        acc[q.folder] = (acc[q.folder] || 0) + 1;
      }
      if (q.liked) {
        acc['liked'] = (acc['liked'] || 0) + 1;
      }
      return acc;
    }, {});
  }, [questions]);

  // Derived questions view
  
  const displayQuestions = useMemo(() => {
    let filtered = questions.filter(q => q.title !== '__FOLDER__');
    
    // Folder filtering
    if (selectedFolder === 'liked') {
      filtered = filtered.filter(q => q.liked);
    } else if (selectedFolder !== 'all') {
      filtered = filtered.filter(q => q.folder === selectedFolder);
    }
    
    // Search filtering
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(q => 
        q.title.toLowerCase().includes(s) || 
        q.folder.toLowerCase().includes(s)
      );
    }
    
    return filtered;
  }, [questions, selectedFolder, search]);

  const ALL_FOLDERS = useMemo(() => {
    const initialMap = PREBUILT_FOLDERS.reduce((acc, f) => {
      acc[f.id] = f;
      return acc;
    }, {});

    return Object.values(
      folders.reduce((acc, t) => {
        if (!acc[t]) {
          acc[t] = { 
             id: t, name: t, subtitle: 'User Collection', 
             icon: getIconForTopic(t), 
             className: 'folder-general',
             dynamicBackground: getGradientForTopic(t)
          };
        }
        return acc;
      }, initialMap)
    );
  }, [folders]);

  const updateQuestion = (id, data) => {
    updateStorage(questions.map(q => q.id === id ? { ...q, ...data } : q));
    showToast('Updated successfully');
  };

  const handleAddQuestion = () => {
    if (!newQuestion.title || !newQuestion.url) {
      showToast('Title and URL required', 'error');
      return;
    }
    
    const newId = Date.now().toString();
    const payload = {
       ...newQuestion,
       id: newId,
       folder: selectedFolder !== 'all' && selectedFolder !== 'liked' ? selectedFolder : 'General',
       difficulty: newQuestion.difficulty || 'Medium',
       liked: false
    };
    
    updateStorage([payload, ...questions]);
    setActivePopover(null);
    setNewQuestion({ title: '', url: '', folder: '' });
    showToast('Question Added');
  };

  const handleAddFolder = () => {
    if (!newFolder.name) {
      showToast('Folder name required', 'error');
      return;
    }
    
    const newId = Date.now().toString();
    const payload = { id: newId, title: '__FOLDER__', url: '#', folder: newFolder.name };
      
    updateStorage([payload, ...questions]);
    setActivePopover(null);
    setNewFolder({ name: '' });
    showToast(view === 'home' ? 'Folder Created' : 'Sub-folder Created');
  };

  const confirmDeleteAction = (type, targetId) => {
    if (type === 'folder') {
      updateStorage(questions.filter(q => q.folder !== targetId));
      setActivePopover(null);
      setView('home');
      showToast('Folder Deleted');
    } else if (type === 'question') {
      updateStorage(questions.filter(q => q.id !== targetId));
      setActivePopover(null);
      showToast('Removed Successfully');
    }
  };

  const getTopicClass = (folder) => {
    const pFolder = PREBUILT_FOLDERS.find(f => f.id === folder);
    return pFolder ? `card-${pFolder.id.toLowerCase()}` : 'card-general';
  };

  const renderToast = () => (
    <AnimatePresence>
      {toast && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </motion.div>
      )}
    </AnimatePresence>
  );



  const renderHomeScreen = () => (
    <div className="animate-slide">
      <header style={{ marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '3.5rem', fontWeight: '900', color: '#000' }}>Characters</h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Master your data structures and algorithms.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
           <div style={{ position: 'relative' }}>
             <button className="sidebar-item hover-scale" style={{ background: '#8b5cf6', color: '#fff', fontWeight: '700' }} onClick={() => setActivePopover(activePopover === 'addFolderHome' ? null : 'addFolderHome')}>+ New Folder</button>
             <AnimatePresence>
               {activePopover === 'addFolderHome' && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} 
                             style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', background: '#fff', padding: '1rem', borderRadius: '1rem', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', zIndex: 100, width: '300px' }}>
                   <p style={{ fontWeight: '800', marginBottom: '1rem' }}>Create New Folder</p>
                   <input className="search-input" style={{ width: '100%', paddingLeft: '1rem', marginBottom: '1rem' }} placeholder="Folder Name..." value={newFolder.name} onChange={(e) => setNewFolder({ name: e.target.value })} />
                   <div style={{ display: 'flex', gap: '0.5rem' }}>
                     <button className="btn sidebar-item" style={{ background: '#f1f5f9', flex: 1 }} onClick={() => setActivePopover(null)}>Cancel</button>
                     <button className="btn sidebar-item" style={{ background: '#3b82f6', color: '#fff', flex: 1 }} onClick={handleAddFolder}>Create</button>
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>
           </div>
           
           <div className="search-bar-modern">
             <Search size={20} color="#64748b" />
             <input className="search-input" placeholder="Search my base..." value={search} onChange={(e) => setSearch(e.target.value)} />
           </div>
           <button className="sidebar-item" style={{ background: '#000', color: '#fff' }}><User size={18} /> Profile</button>
        </div>
      </header>
      
      <div className="folder-grid">
        {ALL_FOLDERS.map((f) => (
          <div key={f.id} className={`folder-card ${f.className} animate-slide`} 
               style={f.dynamicBackground ? { background: f.dynamicBackground } : {}} 
               onClick={() => { setSelectedFolder(f.id); setView('dashboard'); }}>
            <div className="pop-out-icon">
              {f.icon}
            </div>
            <div>
              <h3 className="folder-name">{f.name}</h3>
              <p className="folder-subtitle">{f.subtitle}</p>
            </div>
            <p style={{ marginTop: '1.5rem', fontWeight: '800', fontSize: '0.9rem' }}>{stats[f.id] || 0} ITEMS</p>
          </div>
        ))}
      </div>

      <footer style={{ marginTop: '5rem', display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontWeight: '700' }}>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <span>DSA.Lab</span>
          <span>WAP.Studio</span>
        </div>
        <div style={{ display: 'flex', gap: '2rem', color: '#000' }}>
          <span style={{ opacity: 0.4 }}>PREV</span>
          <span>NEXT &gt;</span>
        </div>
      </footer>
    </div>
  );

  const renderQuestionCard = (q) => (
    <motion.div layout key={q.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card animate-slide">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className={`card-accent-bar ${getTopicClass(q.folder)}`}></div>
        <button className={`star-btn ${q.liked ? 'active' : ''}`} style={{ position: 'relative', top: 0, right: 0 }} onClick={() => updateQuestion(q.id, { liked: !q.liked })}>
          <Star size={20} fill={q.liked ? "#fbbf24" : "none"} color={q.liked ? "#fbbf24" : "#cbd5e1"} />
        </button>
      </div>
      
      <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '0.5rem', color: '#000' }}>{q.title}</h3>
      
        <select 
          className="folder-dropdown sidebar-item" 
          value={q.folder} 
          onChange={(e) => updateQuestion(q.id, { folder: e.target.value })}
          style={{ background: '#f8fafc', padding: '0.2rem 0.5rem', borderRadius: '0.5rem', fontSize: '0.8rem', border: '1px solid #e2e8f0', appearance: 'auto', cursor: 'pointer' }}
        >
          {ALL_FOLDERS.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>

      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto' }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="sidebar-item" style={{ padding: '0.4rem 0.8rem', background: '#f1f5fslate-1009', fontSize: '0.8rem' }} onClick={() => updateQuestion(q.id, { status: q.status === 'solved' ? 'unsolved' : 'solved' })}>
            {q.status === 'solved' ? <CheckCircle size={14} color="#10b981" /> : <Circle size={14} color="#cbd5e1" />}
          </button>
          <a href={q.url} target="_blank" rel="noreferrer" className="sidebar-item" style={{ padding: '0.4rem 0.8rem', background: '#f8fafc' }}>
            <ExternalLink size={14} color="#000" />
          </a>
        </div>
        <div style={{ position: 'relative' }}>
          <button className="sidebar-item" style={{ padding: '0.4rem 0.8rem', background: 'transparent' }} onClick={() => setActivePopover(activePopover === `deleteQuestion-${q.id}` ? null : `deleteQuestion-${q.id}`)}>
            <Trash2 size={16} color="#ef4444" />
          </button>
          <AnimatePresence>
             {activePopover === `deleteQuestion-${q.id}` && (
               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} 
                           style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: '0.5rem', background: '#fff', padding: '1rem', borderRadius: '1rem', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', zIndex: 100, width: '220px' }}>
                 <p style={{ fontWeight: '800', marginBottom: '1rem', fontSize: '0.9rem' }}>Delete this question?</p>
                 <div style={{ display: 'flex', gap: '0.5rem' }}>
                   <button className="btn sidebar-item" style={{ background: '#f1f5f9', flex: 1, padding: '0.4rem' }} onClick={() => setActivePopover(null)}>Cancel</button>
                   <button className="btn sidebar-item" style={{ background: '#ef4444', color: '#fff', flex: 1, padding: '0.4rem' }} onClick={() => confirmDeleteAction('question', q.id)}>Delete</button>
                 </div>
               </motion.div>
             )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="app-layout">
      <AnimatePresence>
        {!hasEntered && (
          <LandingScreen onEnter={() => {
            setHasEntered(true);
            sessionStorage.setItem('hasEntered', 'true');
          }} />
        )}
      </AnimatePresence>

      {renderToast()}
      
      <div className={`main-container animate-slide ${!hasEntered ? 'blur-sm' : ''}`}>
        <aside className="sidebar">
          <div className="sidebar-logo" onClick={() => setView('home')} style={{ cursor: 'pointer' }}>CN.Track</div>
          <nav className="sidebar-menu">
            <div className={`sidebar-item ${view === 'home' ? 'active' : ''}`} onClick={() => setView('home')}>
              <LayoutGrid size={20} /> Dashboard
            </div>
            <div className={`sidebar-item ${selectedFolder === 'all' && view === 'dashboard' ? 'active' : ''}`} onClick={() => { setView('dashboard'); setSelectedFolder('all'); }}>
              <Hash size={20} /> All Lab
            </div>
            <div className={`sidebar-item ${selectedFolder === 'starred' ? 'active' : ''}`} onClick={() => { setView('dashboard'); setSelectedFolder('starred'); }}>
              <Star size={20} /> Favorites
            </div>
          </nav>
          
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
             <div>
               <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '1px', marginBottom: '1.5rem' }}>POPULAR</p>
               <div className="folder-list" style={{ paddingLeft: 0, border: 'none' }}>
                {folders.slice(0, 5).map(t => (
                  <div key={t} className={`sidebar-item ${selectedFolder === t ? 'active' : ''}`} onClick={() => { setView('dashboard'); setSelectedFolder(t); }} style={{ fontSize: '0.9rem' }}>#{t}</div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
              

              {view === 'dashboard' && selectedFolder !== 'all' && selectedFolder !== 'starred' && !PREBUILT_FOLDERS.find(f => f.id === selectedFolder) && (
                <div style={{ position: 'relative' }}>
                  <button className="sidebar-item hover-scale" style={{ background: '#ef4444', color: '#fff', width: '100%', justifyContent: 'flex-start' }} 
                          onClick={() => setActivePopover(activePopover === 'deleteFolder' ? null : 'deleteFolder')}>
                    <Trash2 size={16} style={{ marginRight: '0.5rem' }} /> Delete Folder
                  </button>
                  <AnimatePresence>
                     {activePopover === 'deleteFolder' && (
                       <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} 
                                   style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: '0.5rem', background: '#fff', padding: '1rem', borderRadius: '1rem', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', zIndex: 100, width: '100%' }}>
                         <p style={{ fontWeight: '800', marginBottom: '1rem', fontSize: '0.9rem', color: '#ef4444' }}>Warning: This deletes the entire folder and everything inside it forever.</p>
                         <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                           <button className="btn sidebar-item" style={{ background: '#000', color: '#fff', width: '100%' }} onClick={() => confirmDeleteAction('folder', selectedFolder)}>Delete Everything</button>
                           <button className="btn sidebar-item" style={{ background: '#f1f5f9', width: '100%' }} onClick={() => setActivePopover(null)}>Keep It</button>
                         </div>
                       </motion.div>
                     )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </aside>

        <main className="main-content">
          {view === 'home' ? (
            renderHomeScreen()
          ) : (
            <div className="animate-slide">
              <header className="header-top">
                <div className="nav-links">
                  <span className="nav-link" onClick={() => setView('home')} style={{ cursor: 'pointer' }}>HOME</span>
                  <span className="nav-link active">{selectedFolder.toUpperCase()}</span>
                </div>
                <div className="search-bar-modern">


                  <div style={{ position: 'relative' }}>
                    <button className="sidebar-item" style={{ background: '#000', color: '#fff', padding: '0.4rem 1rem' }} onClick={() => setActivePopover(activePopover === 'addQuestion' ? null : 'addQuestion')}>+ Question</button>
                    <AnimatePresence>
                       {activePopover === 'addQuestion' && (
                         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} 
                                     style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', background: '#fff', padding: '1.25rem', borderRadius: '1rem', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', zIndex: 100, width: '350px' }}>
                           <p style={{ fontWeight: '800', marginBottom: '1rem' }}>Add Question to "{selectedFolder}"</p>
                           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                             <input className="search-input" style={{ width: '100%', paddingLeft: '1rem', padding: '0.5rem 1rem' }} placeholder="Question Title..." value={newQuestion.title} onChange={(e) => setNewQuestion({...newQuestion, title: e.target.value})} />
                             <input className="search-input" style={{ width: '100%', paddingLeft: '1rem', padding: '0.5rem 1rem' }} placeholder="URL Link..." value={newQuestion.url} onChange={(e) => setNewQuestion({...newQuestion, url: e.target.value})} />
                             <input className="search-input" style={{ width: '100%', paddingLeft: '1rem', padding: '0.5rem 1rem' }} placeholder="Difficulty (Easy/Medium/Hard)" value={newQuestion.difficulty || ''} onChange={(e) => setNewQuestion({...newQuestion, difficulty: e.target.value})} />
                           </div>
                           <div style={{ display: 'flex', gap: '0.5rem' }}>
                             <button className="btn sidebar-item" style={{ background: '#f1f5f9', flex: 1 }} onClick={() => setActivePopover(null)}>Cancel</button>
                             <button className="btn sidebar-item" style={{ background: '#000', color: '#fff', flex: 1 }} onClick={handleAddQuestion}>Add</button>
                           </div>
                         </motion.div>
                       )}
                     </AnimatePresence>
                  </div>
                  
                  <Search size={20} color="#64748b" />
                  <input className="search-input" placeholder="Search lab..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
              </header>

              <div className="folder-container">
                {selectedFolder !== 'all' && selectedFolder !== 'starred' && (
                   <div className="folder-row" style={{ paddingBottom: '1rem' }}>

                   </div>
                )}

                <div className="question-grid">
                  <AnimatePresence>
                    {displayQuestions.map(q => renderQuestionCard(q))}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;

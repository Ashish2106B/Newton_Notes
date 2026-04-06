import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Search, CheckCircle, Circle, Trash2, ExternalLink, 
  Star, Hash, LayoutGrid, Bookmark, ArrowRight,
  FolderOpen, Settings, Filter, MoreVertical,
  ChevronLeft, BookOpen, Globe, PenTool, BrainCircuit,
  Info, X, AlertCircle, Check, Home, Menu, User,
  Cpu, Database, Layers, Monitor, Target, Zap, 
  Code, Command, Compass, Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
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

const getColorForTopic = (topicName) => {
  let hash = 0;
  for (let i = 0; i < topicName.length; i++) hash = topicName.charCodeAt(i) + ((hash << 5) - hash);
  return CUSTOM_COLORS[Math.abs(hash) % CUSTOM_COLORS.length];
};

const getGradientForTopic = (topicName) => {
  let hash = 0;
  for (let i = 0; i < topicName.length; i++) hash = topicName.charCodeAt(i) + ((hash << 5) - hash);
  return CUSTOM_GRADIENTS[Math.abs(hash) % CUSTOM_GRADIENTS.length];
};

const getIconForTopic = (topicName) => {
  let hash = 0;
  for (let i = 0; i < topicName.length; i++) hash = topicName.charCodeAt(i) + ((hash << 5) - hash);
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
  const [topics, setTopics] = useState([]);
  const [stats, setStats] = useState({});
  const [search, setSearch] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [activeSubtopic, setActiveSubtopic] = useState('All');
  const [sortBy, setSortBy] = useState('latest');
  const [loading, setLoading] = useState(true);
  
  // Feedback states
  const [toast, setToast] = useState(null);
  
  // Anchor Popover State replaces all modals
  const [activePopover, setActivePopover] = useState(null); 
  const [newQuestion, setNewQuestion] = useState({ title: '', url: '', subtopic: '' });
  const [newFolder, setNewFolder] = useState({ name: '' });
  const [subtopics, setSubtopics] = useState([]);

  // Fetch Data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [questionsRes, topicsRes, statsRes, subtopicsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/questions`, {
          params: { search, topic: selectedTopic === 'all' || selectedTopic === 'starred' ? 'all' : selectedTopic, starred: selectedTopic === 'starred' ? 'true' : 'false', sortBy }
        }),
        axios.get(`${API_BASE_URL}/topics`),
        axios.get(`${API_BASE_URL}/stats`),
        axios.get(`${API_BASE_URL}/subtopics`, { params: { topic: selectedTopic }})
      ]);
      setQuestions(questionsRes.data.filter(q => q.title !== '__FOLDER__'));
      setTopics(topicsRes.data);
      setSubtopics(subtopicsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Connection Refused', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedTopic, search, view, sortBy]);

  useEffect(() => {
    setActiveSubtopic('All');
  }, [selectedTopic, view]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const ALL_FOLDERS = useMemo(() => {
    const foldersMap = {};
    PREBUILT_FOLDERS.forEach(f => { foldersMap[f.id] = f; });
    topics.forEach(t => {
      if (!foldersMap[t]) {
        foldersMap[t] = { 
           id: t, name: t, subtitle: 'User Collection', 
           icon: getIconForTopic(t), 
           className: 'folder-general',
           dynamicBackground: getGradientForTopic(t)
        };
      }
    });
    return Object.values(foldersMap);
  }, [topics]);

  const updateQuestion = async (id, data) => {
    try {
      await axios.patch(`${API_BASE_URL}/question/${id}`, data);
      setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...data } : q));
      fetchData();
    } catch (error) {
      showToast('Update Failed', 'error');
    }
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.title || !newQuestion.url) {
      showToast('Title and URL required', 'error');
      return;
    }
    try {
      const payload = {
         ...newQuestion,
         topic: selectedTopic,
         subtopic: newQuestion.subtopic || (activeSubtopic !== 'All' ? activeSubtopic : 'General')
      };
      await axios.post(`${API_BASE_URL}/save`, payload);
      setActivePopover(null);
      setNewQuestion({ title: '', url: '', subtopic: '' });
      showToast('Question Added');
      fetchData();
    } catch (error) {
      showToast('Failed to add item', 'error');
    }
  };

  const handleAddFolder = async () => {
    if (!newFolder.name) {
      showToast('Folder name required', 'error');
      return;
    }
    try {
      const payload = view === 'home' 
        ? { title: '__FOLDER__', url: '#', topic: newFolder.name } 
        : { title: '__FOLDER__', url: '#', topic: selectedTopic, subtopic: newFolder.name };
        
      await axios.post(`${API_BASE_URL}/save`, payload);
      setActivePopover(null);
      setNewFolder({ name: '' });
      showToast(view === 'home' ? 'Folder Created' : 'Sub-folder Created');
      fetchData();
    } catch (error) {
      showToast('Failed to create folder', 'error');
    }
  };

  const confirmDeleteAction = async (type, targetId) => {
    if (type === 'folder') {
      try {
        await axios.delete(`${API_BASE_URL}/topic/${targetId}`);
        setActivePopover(null);
        setView('home');
        showToast('Folder Deleted');
        fetchData();
      } catch (e) {
        showToast('Delete Failed', 'error');
      }
    } else if (type === 'subfolder') {
      try {
        await axios.delete(`${API_BASE_URL}/topic/${targetId.topic}/subtopic/${targetId.subtopic}`);
        setActivePopover(null);
        setActiveSubtopic('All');
        showToast('Sub-Folder Deleted');
        fetchData();
      } catch (e) {
        showToast('Delete Failed', 'error');
      }
    } else if (type === 'question') {
      const id = targetId;
      const originalQuestions = [...questions];
      setQuestions(prev => prev.filter(q => q.id !== id));
      setActivePopover(null);
      try {
        await axios.delete(`${API_BASE_URL}/question/${id}`);
        showToast('Removed Successfully');
        fetchData();
      } catch (error) {
        setQuestions(originalQuestions);
        showToast('Delete Failed', 'error');
      }
    }
  };

  const getTopicClass = (topic) => {
    const folder = PREBUILT_FOLDERS.find(f => f.id === topic);
    return folder ? `card-${folder.id.toLowerCase()}` : 'card-general';
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
               onClick={() => { setSelectedTopic(f.id); setView('dashboard'); }}>
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
        <div className={`card-accent-bar ${getTopicClass(q.topic)}`}></div>
        <button className={`star-btn ${q.isStarred ? 'active' : ''}`} style={{ position: 'relative', top: 0, right: 0 }} onClick={() => updateQuestion(q.id, { isStarred: !q.isStarred })}>
          <Star size={20} fill={q.isStarred ? "#fbbf24" : "none"} color={q.isStarred ? "#fbbf24" : "#cbd5e1"} />
        </button>
      </div>
      
      <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '0.5rem', color: '#000' }}>{q.title}</h3>
      <p style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '600', marginBottom: '1.5rem' }}>{q.topic} • {q.subtopic}</p>
      
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
            <div className={`sidebar-item ${selectedTopic === 'all' && view === 'dashboard' ? 'active' : ''}`} onClick={() => { setView('dashboard'); setSelectedTopic('all'); }}>
              <Hash size={20} /> All Lab
            </div>
            <div className={`sidebar-item ${selectedTopic === 'starred' ? 'active' : ''}`} onClick={() => { setView('dashboard'); setSelectedTopic('starred'); }}>
              <Star size={20} /> Favorites
            </div>
          </nav>
          
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
             <div>
               <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '1px', marginBottom: '1.5rem' }}>POPULAR</p>
               <div className="topic-list" style={{ paddingLeft: 0, border: 'none' }}>
                {topics.slice(0, 5).map(t => (
                  <div key={t} className={`sidebar-item ${selectedTopic === t ? 'active' : ''}`} onClick={() => { setView('dashboard'); setSelectedTopic(t); }} style={{ fontSize: '0.9rem' }}>#{t}</div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
              {view === 'dashboard' && activeSubtopic !== 'All' && (
                <div style={{ position: 'relative' }}>
                  <button className="sidebar-item hover-scale" style={{ background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', width: '100%', justifyContent: 'flex-start' }} 
                          onClick={() => setActivePopover(activePopover === 'deleteSubfolder' ? null : 'deleteSubfolder')}>
                    <Trash2 size={16} style={{ marginRight: '0.5rem' }} /> Delete Sub-Folder
                  </button>
                  <AnimatePresence>
                     {activePopover === 'deleteSubfolder' && (
                       <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} 
                                   style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: '0.5rem', background: '#fff', padding: '1rem', borderRadius: '1rem', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', zIndex: 100, width: '100%' }}>
                         <p style={{ fontWeight: '800', marginBottom: '1rem', fontSize: '0.9rem' }}>Delete '{activeSubtopic}'?</p>
                         <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                           <button className="btn sidebar-item" style={{ background: '#ef4444', color: '#fff', width: '100%' }} onClick={() => confirmDeleteAction('subfolder', { topic: selectedTopic, subtopic: activeSubtopic })}>Confirm Delete</button>
                           <button className="btn sidebar-item" style={{ background: '#f1f5f9', width: '100%' }} onClick={() => setActivePopover(null)}>Cancel</button>
                         </div>
                       </motion.div>
                     )}
                  </AnimatePresence>
                </div>
              )}

              {view === 'dashboard' && selectedTopic !== 'all' && selectedTopic !== 'starred' && !PREBUILT_FOLDERS.find(f => f.id === selectedTopic) && (
                <div style={{ position: 'relative' }}>
                  <button className="sidebar-item hover-scale" style={{ background: '#ef4444', color: '#fff', width: '100%', justifyContent: 'flex-start' }} 
                          onClick={() => setActivePopover(activePopover === 'deleteFolder' ? null : 'deleteFolder')}>
                    <Trash2 size={16} style={{ marginRight: '0.5rem' }} /> Delete Folder
                  </button>
                  <AnimatePresence>
                     {activePopover === 'deleteFolder' && (
                       <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} 
                                   style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: '0.5rem', background: '#fff', padding: '1rem', borderRadius: '1rem', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', zIndex: 100, width: '100%' }}>
                         <p style={{ fontWeight: '800', marginBottom: '1rem', fontSize: '0.9rem', color: '#ef4444' }}>Warning: This deletes the entire topic and everything inside it forever.</p>
                         <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                           <button className="btn sidebar-item" style={{ background: '#000', color: '#fff', width: '100%' }} onClick={() => confirmDeleteAction('folder', selectedTopic)}>Delete Everything</button>
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
                  <span className="nav-link active">{selectedTopic.toUpperCase()}</span>
                </div>
                <div className="search-bar-modern">
                  <div style={{ position: 'relative' }}>
                    <button className="sidebar-item" style={{ background: '#8b5cf6', color: '#fff', padding: '0.4rem 1rem' }} onClick={() => setActivePopover(activePopover === 'addSubFolder' ? null : 'addSubFolder')}>+ Sub-Folder</button>
                    <AnimatePresence>
                       {activePopover === 'addSubFolder' && (
                         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} 
                                     style={{ position: 'absolute', top: '100%', left: 0, marginTop: '0.5rem', background: '#fff', padding: '1rem', borderRadius: '1rem', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', zIndex: 100, width: '300px' }}>
                           <p style={{ fontWeight: '800', marginBottom: '1rem' }}>Create Sub-Folder in "{selectedTopic}"</p>
                           <input className="search-input" style={{ width: '100%', paddingLeft: '1rem', marginBottom: '1rem' }} placeholder="Sub-folder Name..." value={newFolder.name} onChange={(e) => setNewFolder({ name: e.target.value })} />
                           <div style={{ display: 'flex', gap: '0.5rem' }}>
                             <button className="btn sidebar-item" style={{ background: '#f1f5f9', flex: 1 }} onClick={() => setActivePopover(null)}>Cancel</button>
                             <button className="btn sidebar-item" style={{ background: '#3b82f6', color: '#fff', flex: 1 }} onClick={handleAddFolder}>Create</button>
                           </div>
                         </motion.div>
                       )}
                     </AnimatePresence>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <button className="sidebar-item" style={{ background: '#000', color: '#fff', padding: '0.4rem 1rem' }} onClick={() => setActivePopover(activePopover === 'addQuestion' ? null : 'addQuestion')}>+ Question</button>
                    <AnimatePresence>
                       {activePopover === 'addQuestion' && (
                         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} 
                                     style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', background: '#fff', padding: '1.25rem', borderRadius: '1rem', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', zIndex: 100, width: '350px' }}>
                           <p style={{ fontWeight: '800', marginBottom: '1rem' }}>Add Question to "{selectedTopic}"</p>
                           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                             <input className="search-input" style={{ width: '100%', paddingLeft: '1rem', padding: '0.5rem 1rem' }} placeholder="Question Title..." value={newQuestion.title} onChange={(e) => setNewQuestion({...newQuestion, title: e.target.value})} />
                             <input className="search-input" style={{ width: '100%', paddingLeft: '1rem', padding: '0.5rem 1rem' }} placeholder="URL Link..." value={newQuestion.url} onChange={(e) => setNewQuestion({...newQuestion, url: e.target.value})} />
                             <input className="search-input" style={{ width: '100%', paddingLeft: '1rem', padding: '0.5rem 1rem' }} placeholder={`Subtopic (${activeSubtopic !== 'All' ? activeSubtopic : 'General'})`} value={newQuestion.subtopic} onChange={(e) => setNewQuestion({...newQuestion, subtopic: e.target.value})} />
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

              <div className="subtopic-container">
                {selectedTopic !== 'all' && selectedTopic !== 'starred' && (
                   <div className="subfolder-row" style={{ paddingBottom: '1rem' }}>
                      <div className={`subfolder-tile hover-scale ${activeSubtopic === 'All' ? 'active' : ''}`} 
                           style={{ 
                             border: '2px solid var(--text-secondary)', 
                             color: activeSubtopic === 'All' ? '#fff' : 'var(--text-secondary)',
                             background: activeSubtopic === 'All' ? 'var(--text-secondary)' : '#fff',
                             padding: '0.8rem 1.5rem', 
                             fontSize: '1rem' 
                           }}
                           onClick={() => setActiveSubtopic('All')}>
                          <FolderOpen size={20} /> <span style={{ fontWeight: 800 }}>All Notes</span>
                      </div>
                      {subtopics.map(sub => {
                         const subColor = getColorForTopic(sub);
                         const isActive = activeSubtopic === sub;
                         return (
                           <div key={sub} className={`subfolder-tile hover-scale ${isActive ? 'active' : ''}`} 
                                style={{ 
                                  border: `3px solid ${subColor}`, 
                                  color: isActive ? '#fff' : subColor,
                                  background: isActive ? subColor : '#fff',
                                  padding: '0.8rem 1.5rem', 
                                  fontSize: '1rem' 
                                }}
                                onClick={() => setActiveSubtopic(sub)}>
                               <FolderOpen size={20} /> <span style={{ fontWeight: 800 }}>{sub}</span>
                           </div>
                         );
                      })}
                   </div>
                )}

                <div className="question-grid">
                  <AnimatePresence>
                    {questions
                      .filter(q => activeSubtopic === 'All' || (q.subtopic || 'General') === activeSubtopic)
                      .map(q => renderQuestionCard(q))}
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

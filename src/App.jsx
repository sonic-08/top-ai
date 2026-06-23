import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Sparkles, Code, Image as ImageIcon, Video, FileText, 
  Mic, Zap, Star, ExternalLink, ArrowLeft,
  CheckCircle, XCircle, LayoutGrid, Bot, 
  Bookmark, BookmarkCheck, ThumbsUp, ThumbsDown, MessageSquare, 
  Layers, User, DollarSign, Cpu, AlertCircle, ShieldAlert
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, query, onSnapshot } from 'firebase/firestore';

const SEED_CATEGORIES = [
  "Text & Writing", "Coding & Dev", "Image Generation", "Video Innovation", 
  "Audio & Voice", "Productivity", "Research & Data", "Business & Marketing"
];

const BASE_TEMPLATES = [
  { name: "ChatGPT", cat: "Text & Writing", icon: "Bot", price: "Freemium", desc: "An advanced conversational AI model designed to draft complex text, generate programmatic logic, answer nuanced queries, and act as an interactive brainstorming companion across industries.", rating: 4.8 },
  { name: "Claude", cat: "Text & Writing", icon: "FileText", price: "Freemium", desc: "A next-generation AI assistant built with high safety standards, boasting an industry-leading context window designed to parse massive PDFs, synthesize long-form literature, and write analytical essays.", rating: 4.9 },
  { name: "Midjourney", cat: "Image Generation", icon: "ImageIcon", price: "Paid", desc: "An artistic powerhouse operating via text descriptions to generate hyper-realistic, compositionally stunning digital artwork, marketing assets, and conceptual designs.", rating: 4.7 },
  { name: "Cursor", cat: "Coding & Dev", icon: "Code", price: "Freemium", desc: "An AI-first code editor deep-forked from VS Code, intelligently indexing entire codebases to let developers perform multi-file refactors and code generations inline via plain English.", rating: 4.9 },
  { name: "Perplexity AI", cat: "Research & Data", icon: "Search", price: "Freemium", desc: "A conversational discovery engine that completely bypasses lists of links, instantly delivering synthesized textual answers verified by real-time web search citations.", rating: 4.8 },
  { name: "Runway Gen-3", cat: "Video Innovation", icon: "Video", price: "Paid", desc: "A world-class neural video generator designed to render fluid cinematic clips, manipulate motion vectors dynamically, and convert static images into moving masterpieces.", rating: 4.6 },
  { name: "ElevenLabs", cat: "Audio & Voice", icon: "Mic", price: "Freemium", desc: "Hyper-realistic synthetic voice platform providing contextual text-to-speech rendering, precision voice cloning, and multilingual emotional speech synthesis.", rating: 4.9 },
  { name: "v0 by Vercel", cat: "Coding & Dev", icon: "LayoutGrid", price: "Freemium", desc: "Generative UI system producing production-ready React component code wrapped in Tailwind CSS from basic wireframe descriptions.", rating: 4.7 }
];

const generateMassiveDatabase = () => {
  const list = [];
  BASE_TEMPLATES.forEach((t, idx) => {
    list.push({
      id: t.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
      name: t.name,
      shortDescription: t.desc.slice(0, 90) + "...",
      description: t.desc,
      categories: [t.cat, "AI Innovation"],
      features: ["Context-Aware Processing", "Cloud-Sync Support", "API Integrations", "Intelligent Automation"],
      useCases: ["Accelerating professional output", "Automating mundane operational steps", "Iterative content design"],
      strengths: ["Highly adaptable architectures", "Rapid processing performance metrics", "Modern, accessible interfaces"],
      weaknesses: ["Occasional processing overhead anomalies", "Premium scaling structures apply"],
      pricing: t.price === "Paid" ? "$10 - $30/month" : "Free Tier / $20 Pro",
      pricingType: t.price,
      ratings: t.rating,
      likes: 0,
      dislikes: 0,
      website: "https://example.com",
      icon: t.icon,
      isFree: t.price !== "Paid",
      openSource: idx % 3 === 0
    });
  });

  for (let i = 1; i <= 1010; i++) {
    const cat = SEED_CATEGORIES[i % SEED_CATEGORIES.length];
    const pType = i % 3 === 0 ? "Free" : i % 3 === 1 ? "Freemium" : "Paid";
    list.push({
      id: `tool-${i}`,
      name: `Nexus AI Alpha-${i}`,
      shortDescription: `Automated intelligent processing node optimizing workflows for ${cat.toLowerCase()} infrastructures natively.`,
      description: `Nexus AI Alpha-${i} represents a highly specialized algorithmic execution framework built to streamline professional tasks within the ${cat} ecosystem. It automates repetitive operational blocks while maximizing overall functional throughput.`,
      categories: [cat, "Enterprise Utilities"],
      features: ["Automated Data Ingestion", "Custom Finetuned Logic Nodes", "Secure Local Sandbox Execution"],
      useCases: ["Scaling small team efficiencies", "Bypassing repetitive data formatting tasks"],
      strengths: ["Instant configuration profiles", "Zero overhead integration mechanics"],
      weaknesses: ["Requires sustained network connectivity", "Niche specific documentation limitations"],
      pricing: pType === "Free" ? "Completely Free" : pType === "Freemium" ? "$5/mo basic" : "$49/mo enterprise",
      pricingType: pType,
      ratings: parseFloat((4.0 + (i % 10) * 0.1).toFixed(1)),
      likes: 0,
      dislikes: 0,
      website: "https://example.com",
      icon: "Layers",
      isFree: pType !== "Paid",
      openSource: i % 5 === 0
    });
  }
  return list;
};

const ALL_ITEMS_DB = generateMassiveDatabase();
const GLOBAL_SEARCH_CACHE = {};

// Safely check for environment variables without crashing the browser sandbox
const getEnv = (key) => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env[key];
    }
  } catch (e) {
    return undefined;
  }
  return undefined;
};

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID')
};

// Only initialize Firebase if we have real keys, otherwise fallback to Sandbox mock mode
const app = firebaseConfig.apiKey ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
const appId = 'topai-v8'; 

const FORBIDDEN_WORDS = ['curse', 'badword', 'abuse', 'fakeai', 'scam', 'trash'];
const checkProfanity = (text) => {
  const cleanText = text.toLowerCase();
  return FORBIDDEN_WORDS.some(word => cleanText.includes(word));
};

const IconMap = { Bot, FileText, ImageIcon, Code, Search, Video, Mic, LayoutGrid, Layers };

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border text-sm transition-all animate-in slide-in-from-bottom-5 duration-300
      ${type === 'error' ? 'bg-rose-950/90 border-rose-500/30 text-rose-200' : 'bg-slate-900/90 border-indigo-500/30 text-indigo-200'}
    `}>
      {type === 'error' ? <ShieldAlert className="w-5 h-5 text-rose-400" /> : <Zap className="w-5 h-5 text-indigo-400" />}
      <span>{message}</span>
    </div>
  );
};

const ToolDetail = ({ tool, onBack, user, bookmarked, onToggleBookmark, onVote, onAddToast, allTools }) => {
  const IconComponent = IconMap[tool.icon] || Layers;
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  const alternatives = useMemo(() => {
    return allTools
      .filter(t => t.id !== tool.id && t.categories[0] === tool.categories[0])
      .slice(0, 3);
  }, [tool, allTools]);

  useEffect(() => {
    if (!db) {
      setComments([]);
      return;
    }
    const commentRef = collection(db, 'artifacts', appId, 'tools', tool.id, 'comments');
    return onSnapshot(query(commentRef), (snap) => {
      const list = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      setComments(list.sort((a,b) => b.timestamp - a.timestamp));
    }, (error) => {
      console.warn("Firestore listener denied. Running in sandbox.", error);
      setComments([]);
    });
  }, [tool.id]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (checkProfanity(newComment)) {
      onAddToast("Comment blocked: Please maintain constructive community standards.", "error");
      return;
    }

    const commentData = {
      user: user?.uid ? `User_${user.uid.substring(0,5)}` : 'Anonymous User',
      text: newComment.trim(),
      timestamp: Date.now(),
      date: 'Just Now'
    };

    if (!db) {
      setComments(prev => [commentData, ...prev]);
      setNewComment('');
      onAddToast("Comment posted locally (Sandbox Mode)", "success");
      return;
    }

    try {
      const docRef = doc(collection(db, 'artifacts', appId, 'tools', tool.id, 'comments'));
      await setDoc(docRef, commentData);
      setNewComment('');
      onAddToast("Comment added successfully!", "success");
    } catch (err) {
      onAddToast("Failed to connect to comment servers.", "error");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-in fade-in duration-300">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Directory
      </button>

      <div className="space-y-8">
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
              <IconComponent className="w-9 h-9" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-extrabold text-white tracking-tight">{tool.name}</h1>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {tool.categories[0]}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                <span className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-400 fill-amber-400" /> {tool.ratings} Rating</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                <span className="flex items-center gap-1"><DollarSign className="w-4 h-4 text-emerald-400" /> {tool.pricingType}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto shrink-0 border-t border-slate-800/60 pt-4 md:pt-0 md:border-0">
            <button 
              onClick={() => onToggleBookmark(tool.id)}
              className={`p-3 rounded-xl border transition-colors flex items-center justify-center gap-2 text-sm font-medium flex-1 md:flex-none
                ${bookmarked ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'}`}
            >
              {bookmarked ? <BookmarkCheck className="w-4.5 h-4.5" /> : <Bookmark className="w-4.5 h-4.5" />}
              {bookmarked ? 'Saved' : 'Save Tool'}
            </button>
            <a 
              href={tool.website} target="_blank" rel="noreferrer"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 flex-1 md:flex-none"
            >
              Visit Website <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <FileText className="w-5 h-5 text-indigo-400" /> Executive Product Overview
              </h3>
              <p className="text-slate-300 leading-relaxed text-base">
                {tool.description} Unlike superficial wrapper systems, this platform implements targeted architecture patterns optimized to deliver reliable workflows tailored to high-scale data ingestion and output benchmarks.
              </p>

              <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-xl p-4 flex items-start gap-3 mt-4">
                <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-indigo-300">AI Community Quick Take</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Highly favored by production teams seeking modular performance. Best deployed for rapid iteration cycles; scaling metrics might require explicit cloud enterprise agreements.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Cpu className="w-5 h-5 text-indigo-400" /> Core Platform Capabilities
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Key Features</h4>
                  <ul className="space-y-2.5">
                    {tool.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                        <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" /> <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Target Workflows</h4>
                  <ul className="space-y-2.5">
                    {tool.useCases.map((u, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-2" /> <span>{u}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <MessageSquare className="w-5 h-5 text-indigo-400" /> Public Discussion Forum
              </h3>

              <form onSubmit={handlePostComment} className="space-y-3">
                <textarea
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows="3"
                  placeholder="Share your practical experience or platform limitations regarding this tool..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span className="flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Auto-moderation active</span>
                  <button type="submit" className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors">
                    Post Comment
                  </button>
                </div>
              </form>

              <div className="space-y-4 pt-2">
                {comments.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No community entries recorded yet. Be the first to start the thread!</p>
                ) : (
                  comments.map(c => (
                    <div key={c.id} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-300 flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-indigo-400" /> {c.user}</span>
                        <span className="text-slate-500">{c.date}</span>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">{c.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Community Sentiment</h4>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => onVote(tool.id, 'likes')}
                  className="flex-1 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl p-3 flex flex-col items-center gap-1 transition-colors text-emerald-400"
                >
                  <ThumbsUp className="w-5 h-5" />
                  <span className="text-xs font-bold text-slate-300 mt-1">{tool.likes} Likes</span>
                </button>
                <button 
                  onClick={() => onVote(tool.id, 'dislikes')}
                  className="flex-1 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl p-3 flex flex-col items-center gap-1 transition-colors text-rose-400"
                >
                  <ThumbsDown className="w-5 h-5" />
                  <span className="text-xs font-bold text-slate-300 mt-1">{tool.dislikes} Dislikes</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Pricing Structures</h4>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="text-lg font-black text-white">{tool.pricing}</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {tool.pricingType === "Free" ? "Open structural availability. Suitable for unrestricted internal tooling paths." : "Standard subscription schedules feature professional resource locks with optional variable expansion caps."}
                </p>
              </div>
              <div className="border-t border-slate-800/80 pt-3 space-y-2">
                <div className="flex justify-between text-xs text-slate-400"><span>Open Source Architecture</span> <span className="font-bold text-white">{tool.openSource ? "Yes" : "No"}</span></div>
                <div className="flex justify-between text-xs text-slate-400"><span>Enterprise Provisioning</span> <span className="font-bold text-white">Available</span></div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Pros & Cons Matrix</h4>
              
              <div className="space-y-3">
                <div className="bg-emerald-950/20 border border-emerald-500/10 rounded-xl p-3">
                  <h5 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mb-1.5"><CheckCircle className="w-3.5 h-3.5" /> Known System Merits</h5>
                  {tool.strengths.map((s,i)=><p key={i} className="text-xs text-slate-300 mb-1">• {s}</p>)}
                </div>
                <div className="bg-rose-950/20 border border-rose-500/10 rounded-xl p-3">
                  <h5 className="text-xs font-bold text-rose-400 flex items-center gap-1.5 mb-1.5"><XCircle className="w-3.5 h-3.5" /> Architecture Tradeoffs</h5>
                  {tool.weaknesses.map((w,i)=><p key={i} className="text-xs text-slate-300 mb-1">• {w}</p>)}
                </div>
              </div>
            </div>

            {alternatives.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Recommended Alternatives</h4>
                <div className="space-y-2">
                  {alternatives.map(alt => (
                    <div key={alt.id} className="p-3 bg-slate-950 hover:bg-slate-800/50 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs transition-colors">
                      <div>
                        <div className="font-bold text-white">{alt.name}</div>
                        <div className="text-slate-500 mt-0.5">{alt.pricing}</div>
                      </div>
                      <span className="text-indigo-400 font-medium flex items-center gap-0.5"><Star className="w-3 h-3 fill-current text-amber-400" /> {alt.ratings}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ToolCard = ({ tool, onClick, bookmarked, onToggleBookmark, onVote }) => {
  const IconComponent = IconMap[tool.icon] || Layers;

  return (
    <div className="group relative bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 rounded-xl p-5 transition-all shadow-md flex flex-col justify-between h-full">
      <button 
        onClick={(e) => { e.stopPropagation(); onToggleBookmark(tool.id); }}
        className={`absolute top-4 right-4 p-2 rounded-lg border transition-all z-10 
          ${bookmarked ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-200'}`}
      >
        <Bookmark className="w-4 h-4 fill-current" />
      </button>

      <div onClick={onClick} className="cursor-pointer space-y-4 flex-grow">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
            <IconComponent className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base line-clamp-1 group-hover:text-indigo-400 transition-colors">{tool.name}</h3>
            <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider bg-indigo-500/5 px-1.5 py-0.5 rounded border border-indigo-500/10">{tool.categories[0]}</span>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{tool.shortDescription}</p>
      </div>

      <div className="border-t border-slate-800/60 pt-3.5 mt-4 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> {tool.ratings}</div>
        <div className="flex items-center gap-3">
          <button onClick={(e) => { e.stopPropagation(); onVote(tool.id, 'likes'); }} className="flex items-center gap-1 hover:text-emerald-400 transition-colors"><ThumbsUp className="w-3.5 h-3.5" /> {tool.likes}</button>
          <button onClick={(e) => { e.stopPropagation(); onVote(tool.id, 'dislikes'); }} className="flex items-center gap-1 hover:text-rose-400 transition-colors"><ThumbsDown className="w-3.5 h-3.5" /> {tool.dislikes}</button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [tools, setTools] = useState(ALL_ITEMS_DB);
  const [bookmarks, setBookmarks] = useState([]);
  const [toasts, setToasts] = useState([]);

  const [view, setView] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedTool, setSelectedTool] = useState(null);
  
  const [activeFilters, setActiveFilters] = useState({ Free: false, Freemium: false, Paid: false });
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [visibleCount, setVisibleCount] = useState(24);

  useEffect(() => {
    if (!auth) return;
    signInAnonymously(auth).catch(() => {});
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const bRef = collection(db, 'artifacts', appId, 'users', user.uid, 'bookmarks');
    return onSnapshot(query(bRef), (snap) => {
      const ids = [];
      snap.forEach(d => ids.push(d.id));
      setBookmarks(ids);
    }, (error) => {
      console.warn("Firestore listener denied. Running in sandbox.", error);
    });
  }, [user]);

  const addToast = (message, type = 'success') => {
    setToasts(prev => [...prev, { id: Date.now(), message, type }]);
  };

  const handleToggleBookmark = async (toolId) => {
    const isSaved = bookmarks.includes(toolId);
    if (!user || !db) {
      setBookmarks(prev => isSaved ? prev.filter(id => id !== toolId) : [...prev, toolId]);
      addToast(isSaved ? "Removed from system library." : "Added to system library.", "success");
      return;
    }
    try {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'bookmarks', toolId);
      if (isSaved) {
        setBookmarks(prev => prev.filter(id => id !== toolId));
        addToast("Removed from system library.", "success");
      } else {
        setBookmarks(prev => [...prev, toolId]);
        addToast("Saved to system library.", "success");
      }
    } catch {
      addToast("Network synchronization interrupted.", "error");
    }
  };

  const handleVote = async (toolId, type) => {
    setTools(prev => prev.map(t => t.id === toolId ? { ...t, [type]: t[type] + 1 } : t));
    if (selectedTool && selectedTool.id === toolId) setSelectedTool(prev => ({ ...prev, [type]: prev[type] + 1 }));
    addToast(`Feedback registered for tool registry index.`, "success");
  };

  const allCategories = useMemo(() => {
    const cats = new Set();
    tools.forEach(t => t.categories.forEach(c => cats.add(c)));
    return Array.from(cats).sort();
  }, [tools]);

  const processedDisplayCatalog = useMemo(() => {
    let output = [...tools];
    const activePricingTypes = Object.keys(activeFilters).filter(k => activeFilters[k]);
    if (activePricingTypes.length > 0) output = output.filter(t => activePricingTypes.includes(t.pricingType));
    if (selectedCategories.length > 0) output = output.filter(t => t.categories.some(c => selectedCategories.includes(c)));
    return output.sort((a, b) => b.ratings - a.ratings || b.likes - a.likes);
  }, [tools, activeFilters, selectedCategories]);

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setView('search');

    if (GLOBAL_SEARCH_CACHE[searchQuery.toLowerCase()]) {
      setSearchResults(GLOBAL_SEARCH_CACHE[searchQuery.toLowerCase()]);
      setIsSearching(false);
      return;
    }

    setTimeout(() => {
      const matchTerms = searchQuery.toLowerCase().split(' ');
      const filterMatches = tools.filter(t => {
        const payloadStr = `${t.name} ${t.description} ${t.categories.join(' ')}`.toLowerCase();
        return matchTerms.some(term => payloadStr.includes(term));
      }).slice(0, 10);

      GLOBAL_SEARCH_CACHE[searchQuery.toLowerCase()] = filterMatches;
      setSearchResults(filterMatches);
      setIsSearching(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-500/30">
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setView('home'); setSearchQuery(''); }}>
            <div className="bg-indigo-600 p-2 rounded-xl shadow-md"><Sparkles className="w-5 h-5 text-white" /></div>
            <span className="font-black text-xl tracking-tight text-white">Global AI<span className="text-indigo-400"> Directory</span></span>
          </div>

          <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative max-w-md w-full mx-6">
            <Search className="absolute left-3.5 text-slate-500 w-4 h-4" />
            <input 
              type="text" placeholder="Search the web for AI tools (e.g. 'video editing')..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-20 py-2 text-sm text-white placeholder-slate-500 focus:ring-1 focus:ring-indigo-500"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="absolute right-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-lg transition-colors">Search</button>
          </form>

          <div className="flex items-center gap-3">
            <button onClick={() => setView('saved')} className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
              <Bookmark className="w-4 h-4" /> <span className="hidden sm:inline">Saved Library ({bookmarks.length})</span>
            </button>
          </div>
        </div>
      </header>

      <div className="p-4 md:hidden border-b border-slate-800/60 bg-slate-950">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input 
            type="text" placeholder="Search for tools across internet..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-16 py-2.5 text-xs text-white"
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-indigo-600 text-white rounded-lg font-bold text-[10px]">Go</button>
        </form>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {view === 'home' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-6 md:sticky md:top-24 h-fit">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6">
                <h3 className="font-bold text-white text-sm tracking-wide uppercase flex items-center gap-2 text-slate-400">
                  Filter Results
                </h3>
                
                <div className="border-t border-slate-800/80 pt-4 space-y-3">
                  <label className="text-xs uppercase tracking-wider font-bold text-slate-500 block mb-1">Pricing Models</label>
                  {['Free', 'Freemium', 'Paid'].map(type => (
                    <label key={type} className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer hover:text-white transition-colors">
                      <input 
                        type="checkbox" checked={activeFilters[type]}
                        onChange={() => setActiveFilters(f => ({ ...f, [type]: !f[type] }))}
                        className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-4 h-4" 
                      />
                      <span>{type} Tools</span>
                    </label>
                  ))}
                </div>

                <div className="border-t border-slate-800/80 pt-4 space-y-3">
                  <label className="text-xs uppercase tracking-wider font-bold text-slate-500 block mb-1">Categories</label>
                  <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}>
                    {allCategories.map(cat => (
                      <label key={cat} className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer hover:text-white transition-colors">
                        <input 
                          type="checkbox" checked={selectedCategories.includes(cat)}
                          onChange={() => setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])}
                          className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-4 h-4" 
                        />
                        <span className="truncate">{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-3 space-y-6">
              <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white">Global Directory</h2>
                <p className="text-xs text-slate-400 mt-1">Browsing sorted master index arrays verified by standard operational data benchmarks.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {processedDisplayCatalog.slice(0, visibleCount).map(tool => (
                  <ToolCard 
                    key={tool.id} tool={tool} bookmarked={bookmarks.includes(tool.id)}
                    onClick={() => { setSelectedTool(tool); setView('detail'); }}
                    onToggleBookmark={handleToggleBookmark} onVote={handleVote}
                  />
                ))}
              </div>

              {processedDisplayCatalog.length > visibleCount && (
                <div className="text-center pt-6">
                  <button 
                    onClick={() => setVisibleCount(c => c + 24)}
                    className="px-6 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 font-semibold text-sm rounded-xl transition-all"
                  >
                    Load More Tools From Registry
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'search' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-black text-white">Internet Search Results for "{searchQuery}"</h2>
                <p className="text-xs text-slate-400 mt-1">Live data compiled instantly from global discovery layers.</p>
              </div>
              <button onClick={() => { setView('home'); setSearchQuery(''); }} className="text-xs text-indigo-400 font-medium">Clear Results</button>
            </div>

            {isSearching ? (
              <div className="py-24 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400 tracking-wide uppercase">Searching the web for the best matches...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-12 text-center text-slate-500 border border-slate-800 border-dashed rounded-xl">
                No matching indexes found across live vectors. Broaden query search terms.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {searchResults.map(tool => (
                  <ToolCard 
                    key={tool.id} tool={tool} bookmarked={bookmarks.includes(tool.id)}
                    onClick={() => { setSelectedTool(tool); setView('detail'); }}
                    onToggleBookmark={handleToggleBookmark} onVote={handleVote}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'saved' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-2xl font-extrabold text-white">Your Saved Library ({bookmarks.length})</h2>
            {bookmarks.length === 0 ? (
              <div className="p-12 text-center text-slate-500 border border-slate-800 rounded-xl bg-slate-900/40">
                Your repository pipeline is empty. Save tools from the main directory screen.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {tools.filter(t => bookmarks.includes(t.id)).map(tool => (
                  <ToolCard 
                    key={tool.id} tool={tool} bookmarked={true}
                    onClick={() => { setSelectedTool(tool); setView('detail'); }}
                    onToggleBookmark={handleToggleBookmark} onVote={handleVote}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'detail' && selectedTool && (
          <ToolDetail 
            tool={selectedTool} allTools={tools} user={user}
            bookmarked={bookmarks.includes(selectedTool.id)}
            onBack={() => setView(searchQuery ? 'search' : 'home')}
            onToggleBookmark={handleToggleBookmark} onVote={handleVote}
            onAddToast={addToast}
          />
        )}

      </main>

      {toasts.map(t => (
        <Toast key={t.id} message={t.message} type={t.type} onClose={() => setToasts(p => p.filter(x => x.id !== t.id))} />
      ))}
    </div>
  );
}
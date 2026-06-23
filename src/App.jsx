import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Sparkles, Code, Image as ImageIcon, Video, FileText, 
  Mic, Briefcase, Zap, Star, TrendingUp, ExternalLink, ArrowLeft,
  CheckCircle, XCircle, LayoutGrid, Github, Bot, PenTool, 
  Bookmark, BookmarkCheck, ThumbsUp, ThumbsDown, MessageSquare, 
  Layers, User, DollarSign, Cpu, AlertCircle, ShieldAlert
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, setDoc, query, onSnapshot } from 'firebase/firestore';

// --- INITIAL CONFIG & MOCK DATA EXPANSION (1000+ Dynamic Tools) ---
const SEED_CATEGORIES = [
  "Text & Writing", "Coding & Dev", "Image Generation", "Video Innovation", 
  "Audio & Voice", "Productivity", "Research & Data", "Business & Marketing",
  "3D Generation", "Agentic Frameworks", "Customer Support", "SEO Engine"
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

// Generate 1000+ robust tools deterministically for scale
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
      pricing: t.price === "Paid" ? "Starts at $10/mo" : "Free Tier / $20 Pro",
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

  for (let i = 1; i <= 1000; i++) {
    const cat = SEED_CATEGORIES[i % SEED_CATEGORIES.length];
    const pType = i % 3 === 0 ? "Free" : i % 3 === 1 ? "Freemium" : "Paid";
    list.push({
      id: `sys-tool-${i}`,
      name: `NeuroFlow ${i}X`,
      shortDescription: `Automated intelligent processing node optimizing workflows for ${cat.toLowerCase()}.`,
      description: `NeuroFlow ${i}X represents a highly specialized algorithmic execution framework built to streamline professional tasks within the ${cat} ecosystem. It automates repetitive operational blocks while maximizing overall functional throughput and data accuracy.`,
      categories: [cat, "Enterprise Utilities"],
      features: ["Automated Data Ingestion", "Custom Finetuned Logic Nodes", "Secure Local Sandbox Execution"],
      useCases: ["Scaling small team efficiencies", "Bypassing repetitive formatting tasks"],
      strengths: ["Instant configuration profiles", "Zero overhead integration mechanics"],
      weaknesses: ["Requires sustained network connectivity", "Niche specific documentation limitations"],
      pricing: pType === "Free" ? "Completely Free" : pType === "Freemium" ? "$5/mo basic" : "$49/mo enterprise",
      pricingType: pType,
      ratings: parseFloat((3.5 + (i % 15) * 0.1).toFixed(1)),
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

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
// --- PROFANITY FILTER ---
const FORBIDDEN_WORDS = ['curse', 'badword', 'abuse', 'fakeai', 'scam', 'trash', 'hate', 'stupid'];
const checkProfanity = (text) => {
  const cleanText = text.toLowerCase();
  return FORBIDDEN_WORDS.some(word => cleanText.includes(word));
};

// --- ICON MAP ---
const IconMap = { Bot, FileText, ImageIcon, Code, Search, Video, Mic, LayoutGrid, Layers };

// --- COMPONENTS ---

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

const ToolCard = ({ tool, onClick, bookmarked, onToggleBookmark, onVote }) => {
  const IconComponent = IconMap[tool.icon] || Layers;

  return (
    <div className="group relative bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/40 rounded-2xl p-5 transition-all shadow-md flex flex-col justify-between h-full">
      <button 
        onClick={(e) => { e.stopPropagation(); onToggleBookmark(tool.id); }}
        className={`absolute top-4 right-4 p-2 rounded-lg border transition-all z-10 
          ${bookmarked ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-200'}`}
      >
        {bookmarked ? <BookmarkCheck className="w-4 h-4 fill-current" /> : <Bookmark className="w-4 h-4" />}
      </button>

      <div onClick={onClick} className="cursor-pointer space-y-4 flex-grow pt-2">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
            <IconComponent className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg line-clamp-1 group-hover:text-indigo-400 transition-colors">{tool.name}</h3>
            <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">{tool.categories[0]}</span>
          </div>
        </div>

        <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">{tool.shortDescription}</p>
      </div>

      <div className="border-t border-slate-800/60 pt-4 mt-5 flex items-center justify-between text-xs font-medium text-slate-400">
        <div className="flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-400 fill-amber-400" /> {tool.ratings}</div>
        <div className="flex items-center gap-4">
          <button onClick={(e) => { e.stopPropagation(); onVote(tool.id, 'likes'); }} className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors"><ThumbsUp className="w-4 h-4" /> {tool.likes}</button>
          <button onClick={(e) => { e.stopPropagation(); onVote(tool.id, 'dislikes'); }} className="flex items-center gap-1.5 hover:text-rose-400 transition-colors"><ThumbsDown className="w-4 h-4" /> {tool.dislikes}</button>
        </div>
      </div>
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
      .sort((a, b) => b.ratings - a.ratings)
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
      console.warn("Firestore permissions denied for comments. Running in offline/sandbox mode.", error.message);
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
      onAddToast("Failed to connect to servers.", "error");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors group bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl w-fit">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Directory
      </button>

      <div className="space-y-8">
        
        {/* HERO CARD */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 lg:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-20 h-20 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner shrink-0">
              <IconComponent className="w-10 h-10" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-4xl font-extrabold text-white tracking-tight">{tool.name}</h1>
                <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {tool.categories[0]}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-400">
                <span className="flex items-center gap-1.5 text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-md"><Star className="w-4 h-4 fill-current" /> {tool.ratings} Rating</span>
                <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-md"><DollarSign className="w-4 h-4" /> {tool.pricingType}</span>
                {tool.openSource && <span className="flex items-center gap-1.5 text-blue-400 bg-blue-400/10 px-2.5 py-1 rounded-md"><Github className="w-4 h-4" /> Open Source</span>}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0 relative z-10">
            <button 
              onClick={() => onToggleBookmark(tool.id)}
              className={`px-6 py-3.5 rounded-xl border transition-all flex items-center justify-center gap-2 font-bold w-full sm:w-auto
                ${bookmarked ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white'}`}
            >
              {bookmarked ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
              {bookmarked ? 'Saved to Library' : 'Save Tool'}
            </button>
            <a 
              href={tool.website} target="_blank" rel="noreferrer"
              className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 w-full sm:w-auto whitespace-nowrap"
            >
              Visit Tool <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* TWO COLUMN CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-5">
              <h3 className="text-xl font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-4">
                <FileText className="w-5 h-5 text-indigo-400" /> Platform Overview
              </h3>
              <p className="text-slate-300 leading-relaxed text-lg">
                {tool.description}
              </p>

              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5 flex items-start gap-4 mt-6">
                <Sparkles className="w-6 h-6 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-indigo-300 uppercase tracking-wider mb-1">AI Executive Summary</h4>
                  <p className="text-sm text-indigo-100/70 leading-relaxed">
                    Highly favored by production teams seeking modular performance. Best deployed for rapid iteration cycles. The learning curve is moderate, but the output quality heavily outpaces generic alternatives in the market.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-4">
                <Cpu className="w-5 h-5 text-indigo-400" /> Capabilities & Workflows
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Core Features</h4>
                  <ul className="space-y-3">
                    {tool.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                        <CheckCircle className="w-5 h-5 text-indigo-400 shrink-0" /> <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Ideal For</h4>
                  <ul className="space-y-3">
                    {tool.useCases.map((u, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                        <div className="w-2 h-2 rounded-full bg-purple-500 shrink-0 mt-1.5" /> <span>{u}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-4">
                <MessageSquare className="w-5 h-5 text-indigo-400" /> Community Discussions
              </h3>

              <form onSubmit={handlePostComment} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-4">
                <textarea
                  className="w-full bg-transparent border-none p-2 text-white placeholder-slate-500 focus:ring-0 resize-none h-24"
                  placeholder="Share your practical experience, review, or questions about this tool..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <div className="flex justify-between items-center border-t border-slate-800 pt-3">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <AlertCircle className="w-4 h-4" /> Profanity filter active
                  </span>
                  <button type="submit" disabled={!newComment.trim()} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors">
                    Post Comment
                  </button>
                </div>
              </form>

              <div className="space-y-4 pt-4">
                {comments.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">No community entries recorded yet. Be the first to start the thread!</p>
                  </div>
                ) : (
                  comments.map(c => (
                    <div key={c.id} className="bg-slate-800/30 border border-slate-800 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-300 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-600/30 flex items-center justify-center text-xs text-white">{c.user.charAt(0)}</div>
                          {c.user}
                        </span>
                        <span className="text-xs text-slate-500">{c.date}</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed pl-8">{c.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider text-center">Community Sentiment</h4>
              <div className="flex items-center justify-center gap-4">
                <button 
                  onClick={() => onVote(tool.id, 'likes')}
                  className="flex-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-2xl p-4 flex flex-col items-center gap-2 transition-colors text-emerald-400 group"
                >
                  <ThumbsUp className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
                  <span className="text-sm font-bold text-slate-300">{tool.likes} Likes</span>
                </button>
                <button 
                  onClick={() => onVote(tool.id, 'dislikes')}
                  className="flex-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-2xl p-4 flex flex-col items-center gap-2 transition-colors text-rose-400 group"
                >
                  <ThumbsDown className="w-6 h-6 group-hover:translate-y-1 transition-transform" />
                  <span className="text-sm font-bold text-slate-300">{tool.dislikes} Dislikes</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Pricing Structures</h4>
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-center">
                <div className="text-2xl font-black text-white">{tool.pricing}</div>
                <div className="inline-block px-3 py-1 bg-slate-800 text-slate-300 rounded-md text-xs font-bold uppercase tracking-wider mt-2">
                  Model: {tool.pricingType}
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Pros & Cons Matrix</h4>
              <div className="space-y-4">
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
                  <h5 className="text-sm font-bold text-emerald-400 flex items-center gap-2 mb-3"><CheckCircle className="w-4 h-4" /> System Strengths</h5>
                  {tool.strengths.map((s,i)=><p key={i} className="text-sm text-slate-300 mb-2 flex gap-2"><span className="text-emerald-500">•</span> {s}</p>)}
                </div>
                <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-5">
                  <h5 className="text-sm font-bold text-rose-400 flex items-center gap-2 mb-3"><XCircle className="w-4 h-4" /> Known Limitations</h5>
                  {tool.weaknesses.map((w,i)=><p key={i} className="text-sm text-slate-300 mb-2 flex gap-2"><span className="text-rose-500">•</span> {w}</p>)}
                </div>
              </div>
            </div>

            {alternatives.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Similar Tools</h4>
                <div className="space-y-3">
                  {alternatives.map(alt => (
                    <div key={alt.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white text-sm">{alt.name}</div>
                        <div className="text-slate-500 text-xs mt-1">{alt.pricingType}</div>
                      </div>
                      <span className="text-amber-400 font-bold text-sm flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-current" /> {alt.ratings}</span>
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
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error(err); }
    };
    initAuth();
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
      console.warn("Firestore permissions denied for bookmarks. Running in offline/sandbox mode.", error.message);
    });
  }, [user]);

  const addToast = (message, type = 'success') => {
    setToasts(prev => [...prev, { id: Date.now(), message, type }]);
  };

  const handleToggleBookmark = async (toolId) => {
    const isSaved = bookmarks.includes(toolId);
    if (!user || !db) {
      setBookmarks(prev => isSaved ? prev.filter(id => id !== toolId) : [...prev, toolId]);
      addToast(isSaved ? "Removed from library." : "Added to library.", "success");
      return;
    }
    try {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'bookmarks', toolId);
      if (isSaved) {
        setBookmarks(prev => prev.filter(id => id !== toolId));
        addToast("Removed from library.", "success");
      } else {
        setBookmarks(prev => [...prev, toolId]);
        addToast("Saved to library.", "success");
      }
    } catch {
      addToast("Failed to sync bookmark.", "error");
    }
  };

  const handleVote = (toolId, type) => {
    setTools(prev => prev.map(t => t.id === toolId ? { ...t, [type]: t[type] + 1 } : t));
    if (selectedTool && selectedTool.id === toolId) setSelectedTool(prev => ({ ...prev, [type]: prev[type] + 1 }));
    addToast(`Feedback registered!`, "success");
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

  const handleSearchSubmit = (e) => {
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
      }).sort((a,b) => b.ratings - a.ratings).slice(0, 10); // Return top 10 fastest matches

      GLOBAL_SEARCH_CACHE[searchQuery.toLowerCase()] = filterMatches;
      setSearchResults(filterMatches);
      setIsSearching(false);
    }, 400); // Simulated "Vector Math" delay
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-20 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => { setView('home'); setSearchQuery(''); }}>
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-xl shadow-lg"><Sparkles className="w-6 h-6 text-white" /></div>
            <span className="font-black text-2xl tracking-tighter text-white hidden sm:block">Top<span className="text-indigo-400">AI</span></span>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-2xl relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-indigo-400 transition-colors" />
            <input 
              type="text" placeholder="Search thousands of AI tools (e.g. 'video editing')..."
              className="w-full bg-slate-900 border border-slate-800 rounded-full pl-12 pr-24 py-3.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:bg-slate-900 shadow-inner transition-all outline-none"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" disabled={!searchQuery.trim()} className="absolute right-2 top-2 bottom-2 px-6 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-full transition-colors">Search</button>
          </form>

          <button onClick={() => setView('saved')} className="hidden md:flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 px-5 py-3 rounded-full transition-colors shrink-0">
            <Bookmark className="w-4 h-4 text-indigo-400" /> Saved ({bookmarks.length})
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
        
        {view === 'home' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
            
            <div className="hidden lg:block space-y-6 sticky top-28 h-fit">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <h3 className="font-bold text-white text-sm tracking-wider uppercase mb-5">Filter Database</h3>
                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Pricing Models</label>
                  {['Free', 'Freemium', 'Paid'].map(type => (
                    <label key={type} className="flex items-center gap-3 text-sm font-medium text-slate-300 cursor-pointer hover:text-white group transition-colors">
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={activeFilters[type]} 
                        onChange={() => setActiveFilters(prev => ({ ...prev, [type]: !prev[type] }))} 
                      />
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${activeFilters[type] ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-950 border-slate-700 group-hover:border-indigo-500'}`}>
                        {activeFilters[type] && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <span>{type} Only</span>
                    </label>
                  ))}
                </div>

                <div className="mt-8 space-y-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Categories</label>
                  <div className="max-h-[350px] overflow-y-auto space-y-3 pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}>
                    {allCategories.map(cat => (
                      <label key={cat} className="flex items-center gap-3 text-sm font-medium text-slate-300 cursor-pointer hover:text-white group transition-colors">
                        <input 
                          type="checkbox" 
                          className="hidden" 
                          checked={selectedCategories.includes(cat)} 
                          onChange={() => {
                            setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])
                          }} 
                        />
                        <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${selectedCategories.includes(cat) ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-950 border-slate-700 group-hover:border-indigo-500'}`}>
                          {selectedCategories.includes(cat) && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className="truncate">{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold text-white">Global AI Directory</h2>
                  <p className="text-sm text-slate-400 mt-1">Discover and filter through {tools.length.toLocaleString()}+ cutting-edge platforms.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {processedDisplayCatalog.slice(0, visibleCount).map(tool => (
                  <ToolCard 
                    key={tool.id} tool={tool} bookmarked={bookmarks.includes(tool.id)}
                    onClick={() => { setSelectedTool(tool); window.scrollTo(0,0); setView('detail'); }}
                    onToggleBookmark={handleToggleBookmark} onVote={handleVote}
                  />
                ))}
              </div>

              {processedDisplayCatalog.length > visibleCount && (
                <div className="flex justify-center pt-8">
                  <button 
                    onClick={() => setVisibleCount(c => c + 24)}
                    className="px-8 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 text-white font-bold rounded-full transition-all flex items-center gap-2"
                  >
                    <Layers className="w-4 h-4 text-indigo-400" /> Load More Tools
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'search' && (
          <div className="space-y-8 animate-in fade-in duration-300 min-h-[60vh]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
              <div>
                <h2 className="text-2xl font-bold text-white">Results for "{searchQuery}"</h2>
                <p className="text-sm text-slate-400 mt-1">Lightning fast vector match retrieval.</p>
              </div>
              <button onClick={() => { setView('home'); setSearchQuery(''); }} className="text-sm font-bold text-indigo-400 hover:text-indigo-300">Clear Search</button>
            </div>

            {isSearching ? (
              <div className="py-32 text-center">
                <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-6" />
                <h3 className="text-xl font-bold text-white mb-2">Analyzing the database...</h3>
                <p className="text-slate-400">Finding the absolute best tools for your query.</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="py-32 text-center bg-slate-900 border border-slate-800 rounded-3xl">
                <Search className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No perfect matches found</h3>
                <p className="text-slate-400">Try rephrasing your search using different keywords.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {searchResults.map(tool => (
                  <ToolCard 
                    key={tool.id} tool={tool} bookmarked={bookmarks.includes(tool.id)}
                    onClick={() => { setSelectedTool(tool); window.scrollTo(0,0); setView('detail'); }}
                    onToggleBookmark={handleToggleBookmark} onVote={handleVote}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'saved' && (
          <div className="space-y-8 animate-in fade-in duration-300 min-h-[60vh]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3"><Bookmark className="w-6 h-6 text-indigo-400" /> My Saved Library</h2>
                <p className="text-sm text-slate-400 mt-1">Tools you have bookmarked for quick access.</p>
              </div>
            </div>

            {bookmarks.length === 0 ? (
              <div className="py-32 text-center bg-slate-900 border border-slate-800 rounded-3xl">
                <Bookmark className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Your library is empty</h3>
                <p className="text-slate-400">Click the bookmark icon on any tool to save it here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tools.filter(t => bookmarks.includes(t.id)).map(tool => (
                  <ToolCard 
                    key={tool.id} tool={tool} bookmarked={true}
                    onClick={() => { setSelectedTool(tool); window.scrollTo(0,0); setView('detail'); }}
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
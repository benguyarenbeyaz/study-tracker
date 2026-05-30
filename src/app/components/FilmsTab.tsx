"use client";

import React, { useState, useMemo } from 'react';

interface FilmItem {
  id: string;
  title: string;
  type: 'Movie' | 'TV Series' | 'Documentary' | 'Opera' | 'Ballet' | 'Theatre';
  status: 'Plan to Watch' | 'Watching' | 'Completed';
  platform?: string;
  rating: number; // 0 to 5
  currentProgress: number; // Episode or Act
  totalProgress: number;   // Total episodes or acts
  notes?: string;
}

export default function FilmsTab({ appState }: { appState?: any }) {
  const [items, setItems] = useState<FilmItem[]>([
    { id: '1', title: 'Inception', type: 'Movie', status: 'Completed', platform: 'Netflix', rating: 5, currentProgress: 1, totalProgress: 1, notes: 'Masterpiece storytelling.' },
    { id: '2', title: 'Succession', type: 'TV Series', status: 'Watching', platform: 'HBO Max', rating: 4, currentProgress: 6, totalProgress: 10, notes: 'Incredible acting.' },
    { id: '3', title: 'The Nutcracker', type: 'Ballet', status: 'Plan to Watch', platform: 'Royal Opera House', rating: 0, currentProgress: 0, totalProgress: 3 },
    { id: '4', title: 'Hamlet', type: 'Theatre', status: 'Plan to Watch', platform: 'National Theatre', rating: 0, currentProgress: 0, totalProgress: 5 },
  ]);

  const [activeStatus, setActiveStatus] = useState<string>('All');
  const [activeType, setActiveType] = useState<string>('All');
  
  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<FilmItem['type']>('Movie');
  const [newStatus, setNewStatus] = useState<FilmItem['status']>('Plan to Watch');
  const [newPlatform, setNewPlatform] = useState('');
  const [newTotalProgress, setNewTotalProgress] = useState(1);

  const handleSyncLetterboxd = () => {
    alert("Letterboxd API Webhook Placeholder: Ready for secure authentication pairing.");
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newItem: FilmItem = {
      id: Date.now().toString(),
      title: newTitle,
      type: newType,
      status: newStatus,
      platform: newPlatform || undefined,
      rating: 0,
      currentProgress: newStatus === 'Completed' ? newTotalProgress : 0,
      totalProgress: newTotalProgress,
    };
    setItems([newItem, ...items]);
    setNewTitle('');
    setNewPlatform('');
    setNewTotalProgress(1);
    setShowAddForm(false);
  };

  const updateProgress = (id: string, increment: boolean) => {
    setItems(items.map(item => {
      if (item.id !== id) return item;
      const nextProgress = increment 
        ? Math.min(item.currentProgress + 1, item.totalProgress)
        : Math.max(item.currentProgress - 1, 0);
      const nextStatus = nextProgress === item.totalProgress ? 'Completed' : 'Watching';
      return { ...item, currentProgress: nextProgress, status: nextStatus as FilmItem['status'] };
    }));
  };

  const updateRating = (id: string, rating: number) => {
    setItems(items.map(item => item.id === id ? { ...item, rating } : item));
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchStatus = activeStatus === 'All' || item.status === activeStatus;
      const matchType = activeType === 'All' || item.type === activeType;
      return matchStatus && matchType;
    });
  }, [items, activeStatus, activeType]);

  const TYPES = ['Movie', 'TV Series', 'Documentary', 'Opera', 'Ballet', 'Theatre'];

  return (
    <div className="flex flex-col h-full text-neutral-300 p-4">
      
      {/* Top Controls Header */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold text-white transition-colors outline-none shadow-md"
          >
            {showAddForm ? '✕ Close Form' : '＋ Add Show / Movie'}
          </button>
          
          <div className="flex bg-neutral-800/40 border border-neutral-800/60 rounded-md p-0.5">
            {['All', 'Plan to Watch', 'Watching', 'Completed'].map((st) => (
              <button
                key={st} onClick={() => setActiveStatus(st)}
                className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${activeStatus === st ? 'bg-neutral-800 text-neutral-100 shadow-sm' : 'text-neutral-500 hover:text-neutral-300'}`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Letterboxd Button Integration Hook */}
        <button 
          onClick={handleSyncLetterboxd}
          className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-700/40 hover:border-neutral-600 rounded-lg text-xs font-semibold text-neutral-300 transition-all"
        >
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          Sync Letterboxd
        </button>
      </div>

      {/* Quick Type Filter Row */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 shrink-0 custom-scrollbar">
        <button 
          onClick={() => setActiveType('All')}
          className={`px-3 py-1 text-xs font-medium rounded-full border transition-all shrink-0 ${activeType === 'All' ? 'bg-neutral-200 text-neutral-900 border-neutral-200 font-bold' : 'bg-transparent border-neutral-800 text-neutral-400 hover:text-neutral-200'}`}
        >
          All Mediums
        </button>
        {TYPES.map(t => (
          <button 
            key={t} onClick={() => setActiveType(t)}
            className={`px-3 py-1 text-xs font-medium rounded-full border transition-all shrink-0 ${activeType === t ? 'bg-indigo-900/40 text-indigo-300 border-indigo-500/40 font-bold' : 'bg-transparent border-neutral-800 text-neutral-400 hover:text-neutral-200'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Add Entry Inline Panel */}
      {showAddForm && (
        <form onSubmit={handleAddItem} className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end shadow-2xl animate-fadeIn">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1.5">Title</label>
            <input type="text" placeholder="Title name..." value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-200 focus:border-neutral-700 outline-none" required />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1.5">Type</label>
            <select value={newType} onChange={e => setNewType(e.target.value as any)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-200 focus:border-neutral-700 outline-none">
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1.5">Status</label>
            <select value={newStatus} onChange={e => setNewStatus(e.target.value as any)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-200 focus:border-neutral-700 outline-none">
              <option value="Plan to Watch">Plan to Watch</option>
              <option value="Watching">Watching</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1.5">Episodes/Acts count</label>
            <input type="number" min={1} value={newTotalProgress} onChange={e => setNewTotalProgress(parseInt(e.target.value) || 1)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-200 focus:border-neutral-700 outline-none" />
          </div>
          <button type="submit" className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 font-semibold text-xs rounded-lg text-neutral-200 transition-colors border border-neutral-700/50">Save Entry</button>
        </form>
      )}

      {/* Planner Card Matrix Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-6">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-neutral-600 text-sm font-medium tracking-wide">No matching productions in this view.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredItems.map((item) => {
              const isDone = item.status === 'Completed';
              return (
                <div key={item.id} className={`p-4 border rounded-xl flex flex-col justify-between transition-all bg-neutral-900/80 ${isDone ? 'border-neutral-900 opacity-60' : 'border-neutral-800/80 shadow-md'}`}>
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        item.type === 'Movie' ? 'bg-sky-900/30 text-sky-300 border border-sky-500/20' :
                        item.type === 'TV Series' ? 'bg-indigo-900/30 text-indigo-300 border border-indigo-500/20' :
                        item.type === 'Documentary' ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-500/20' :
                        item.type === 'Theatre' ? 'bg-purple-900/30 text-purple-300 border border-purple-500/20' :
                        'bg-amber-900/30 text-amber-300 border border-amber-500/20' // Opera & Ballet fallback
                      }`}>
                        {item.type}
                      </span>
                      <button onClick={() => deleteItem(item.id)} className="text-neutral-600 hover:text-rose-400 text-base leading-none transition-colors outline-none" title="Remove">×</button>
                    </div>
                    
                    <h3 className={`font-bold text-sm text-neutral-200 truncate ${isDone ? 'line-through text-neutral-500' : ''}`} title={item.title}>
                      {isDone && <span className="text-emerald-500 mr-1 font-bold">✓</span>}
                      {item.title}
                    </h3>
                    
                    {item.platform && <p className="text-[10px] text-neutral-500 mt-0.5 font-medium">Available on: {item.platform}</p>}
                  </div>

                  {/* Progress Slider/Counters */}
                  <div className="mt-4 pt-3 border-t border-neutral-800/60">
                    <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400 mb-2">
                      <span>Progress</span>
                      <span>{item.currentProgress} / {item.totalProgress} {item.type === 'Movie' ? 'Part' : item.type === 'TV Series' ? 'Ep' : 'Act'}</span>
                    </div>
                    
                    {/* Visual Progress Line */}
                    <div className="w-full h-1 bg-neutral-950 rounded-full overflow-hidden mb-3">
                      <div className="h-full bg-indigo-500 transition-all" style={{ width: `${(item.currentProgress / item.totalProgress) * 100}%` }} />
                    </div>

                    <div className="flex justify-between items-center gap-2 mt-2">
                      {/* Active Star Rating Handler */}
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button 
                            key={star} onClick={() => updateRating(item.id, star)}
                            className={`text-xs outline-none transition-colors ${star <= item.rating ? 'text-amber-400' : 'text-neutral-700 hover:text-neutral-500'}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-1">
                        <button disabled={item.currentProgress <= 0} onClick={() => updateProgress(item.id, false)} className="px-2 py-1 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded disabled:opacity-30 text-[10px] font-bold outline-none">-</button>
                        <button disabled={isDone} onClick={() => updateProgress(item.id, true)} className="px-2 py-1 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded disabled:opacity-30 text-[10px] font-bold outline-none">+</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
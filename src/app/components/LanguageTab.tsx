"use client";

import React, { useState, useMemo } from 'react';

interface LanguageProfile {
  id: string;
  language: string;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  vocabCount: number;
  vocabTarget: number;
  skills: {
    listening: number; // 0-100
    speaking: number;
    reading: number;
    writing: number;
  };
  immersionMinutes: number;
}

interface ImmersionLog {
  id: string;
  langId: string;
  activity: string;
  type: 'Immersion' | 'Grammar' | 'Vocabulary' | 'Reading' | 'Speaking Output';
  duration: number; // in minutes
  date: string;
}

export default function LanguageTab({ appState }: { appState?: any }) {
  // Profiles State
  const [profiles, setProfiles] = useState<LanguageProfile[]>([
    { id: '1', language: 'Japanese', cefrLevel: 'N4', vocabCount: 1250, vocabTarget: 3000, skills: { listening: 45, speaking: 20, reading: 35, writing: 15 }, immersionMinutes: 1420 },
    { id: '2', language: 'Spanish', cefrLevel: 'B2', vocabCount: 4500, vocabTarget: 6000, skills: { listening: 75, speaking: 60, reading: 80, writing: 55 }, immersionMinutes: 4890 },
  ]);
  
  const [activeLangId, setActiveLangId] = useState<string>('1');

  // Logs State
  const [logs, setLogs] = useState<ImmersionLog[]>([
    { id: '1', langId: '1', activity: 'NHK Easy News Reading', type: 'Reading', duration: 20, date: 'Today' },
    { id: '2', langId: '1', activity: 'Anki Core 2k Flashcards', type: 'Vocabulary', duration: 15, date: 'Today' },
    { id: '3', langId: '2', activity: 'Listening to Radio Ambulante podcast', type: 'Immersion', duration: 40, date: 'Yesterday' },
  ]);

  // Form Entry State
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [newLangName, setNewLangName] = useState('');
  const [newCefr, setNewCefr] = useState<LanguageProfile['cefrLevel']>('A1');
  const [newVocabTarget, setNewVocabTarget] = useState(2000);

  const [showAddLog, setShowAddLog] = useState(false);
  const [logActivity, setLogActivity] = useState('');
  const [logType, setLogType] = useState<ImmersionLog['type']>('Immersion');
  const [logDuration, setLogDuration] = useState(25);

  const activeProfile = useMemo(() => {
    return profiles.find(p => p.id === activeLangId) || profiles[0];
  }, [profiles, activeLangId]);

  const activeLogs = useMemo(() => {
    return logs.filter(l => l.langId === activeLangId);
  }, [logs, activeLangId]);

  const handleAddProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLangName.trim()) return;
    const newProf: LanguageProfile = {
      id: Date.now().toString(),
      language: newLangName,
      cefrLevel: newCefr,
      vocabCount: 0,
      vocabTarget: newVocabTarget,
      skills: { listening: 0, speaking: 0, reading: 0, writing: 0 },
      immersionMinutes: 0
    };
    setProfiles([...profiles, newProf]);
    setActiveLangId(newProf.id);
    setNewLangName('');
    setShowAddProfile(false);
  };

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logActivity.trim() || !activeProfile) return;

    const newLog: ImmersionLog = {
      id: Date.now().toString(),
      langId: activeProfile.id,
      activity: logActivity,
      type: logType,
      duration: logDuration,
      date: 'Just now'
    };

    setLogs([newLog, ...logs]);
    
    // Dynamically update total immersion time inside the profile state
    setProfiles(profiles.map(p => {
      if (p.id !== activeProfile.id) return p;
      
      // Calculate micro skill impacts based on activity type
      const skillUpdates = { ...p.skills };
      if (logType === 'Immersion') skillUpdates.listening = Math.min(100, skillUpdates.listening + 1);
      if (logType === 'Grammar') skillUpdates.writing = Math.min(100, skillUpdates.writing + 1);
      if (logType === 'Reading') skillUpdates.reading = Math.min(100, skillUpdates.reading + 1);
      if (logType === 'Vocabulary') skillUpdates.reading = Math.min(100, skillUpdates.reading + 1);
      if (logType === 'Speaking Output') skillUpdates.speaking = Math.min(100, skillUpdates.speaking + 2);

      return {
        ...p,
        immersionMinutes: p.immersionMinutes + logDuration,
        skills: skillUpdates
      };
    }));

    setLogActivity('');
    setShowAddLog(false);
  };

  const adjustVocab = (increment: number) => {
    if (!activeProfile) return;
    setProfiles(profiles.map(p => p.id === activeProfile.id ? {
      ...p,
      vocabCount: Math.max(0, p.vocabCount + increment)
    }: p));
  };

  return (
    <div className="flex flex-col h-full text-neutral-300 p-4">
      
      {/* Top Profile Strip toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-900 pb-5 mb-6 shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          {profiles.map(p => (
            <button
              key={p.id} onClick={() => setActiveLangId(p.id)}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${activeLangId === p.id ? 'bg-teal-950/40 text-teal-400 border-teal-500/40 shadow-md' : 'bg-neutral-900/40 border-neutral-800 text-neutral-500 hover:text-neutral-300'}`}
            >
              🌐 {p.language} <span className="ml-1 px-1 py-0.2 bg-black/40 rounded text-[10px] opacity-80">{p.cefrLevel}</span>
            </button>
          ))}
          <button 
            onClick={() => setShowAddProfile(!showAddProfile)}
            className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs rounded-xl font-medium text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            {showAddProfile ? '✕' : '＋ Add Target Language'}
          </button>
        </div>
      </div>

      {/* Profile Creation Panel */}
      {showAddProfile && (
        <form onSubmit={handleAddProfile} className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl mb-6 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end shadow-2xl animate-fadeIn">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1.5">Language Name</label>
            <input type="text" placeholder="e.g. German, French" value={newLangName} onChange={e => setNewLangName(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-200 focus:border-neutral-700 outline-none" required />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1.5">Current Level</label>
            <select value={newCefr} onChange={e => setNewCefr(e.target.value as any)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-200 focus:border-neutral-700 outline-none">
              {['A1','A2','B1','B2','C1','C2','N5','N4','N3','N2','N1'].map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1.5">Vocab Goal Size</label>
            <input type="number" step={500} value={newVocabTarget} onChange={e => setNewVocabTarget(parseInt(e.target.value) || 1000)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-200 focus:border-neutral-700 outline-none" />
          </div>
          <button type="submit" className="py-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-lg transition-colors shadow-md">Initialize Track</button>
        </form>
      )}

      {activeProfile ? (
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start pb-6">
          
          {/* Main Analytics Hub Left Column */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Pillars of Competence Card */}
            <div className="bg-neutral-900/50 border border-neutral-800/80 rounded-xl p-5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-3 bg-teal-500 rounded-full" />
                Fluency Dimension Bars
              </h3>
              
              <div className="space-y-4">
                {Object.entries(activeProfile.skills).map(([skillName, value]) => (
                  <div key={skillName}>
                    <div className="flex justify-between items-center text-xs text-neutral-400 mb-1 capitalize">
                      <span className="font-medium text-neutral-300">{skillName} Development</span>
                      <span className="font-mono text-[11px]">{value}%</span>
                    </div>
                    <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-900">
                      <div className="h-full bg-teal-500 rounded-full transition-all duration-500" style={{ width: `${value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Immersion Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Vocab Target Machine */}
              <div className="bg-neutral-900/50 border border-neutral-800/80 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">Lexicon / Vocabulary Vault</h4>
                  <p className="text-2xl font-mono font-bold text-neutral-100">{activeProfile.vocabCount} <span className="text-xs text-neutral-600 font-normal">/ {activeProfile.vocabTarget} items</span></p>
                  
                  {/* Vocabulary Gauge */}
                  <div className="w-full h-1.5 bg-neutral-950 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, (activeProfile.vocabCount / activeProfile.vocabTarget) * 100)}%` }} />
                  </div>
                </div>

                <div className="flex gap-1 mt-4">
                  <button onClick={() => adjustVocab(-50)} className="flex-1 py-1 bg-neutral-950 hover:bg-neutral-800 text-[10px] font-mono border border-neutral-800 rounded-md">-50</button>
                  <button onClick={() => adjustVocab(50)} className="flex-1 py-1 bg-neutral-950 hover:bg-neutral-800 text-[10px] font-mono border border-neutral-800 rounded-md">+50</button>
                </div>
              </div>

              {/* Total Deep Focus Hours */}
              <div className="bg-neutral-900/50 border border-neutral-800/80 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">Accumulated Exposure</h4>
                  <p className="text-2xl font-mono font-bold text-neutral-100">
                    {Math.round((activeProfile.immersionMinutes / 60) * 10) / 10} <span className="text-xs text-neutral-600 font-normal">Immersion Hours</span>
                  </p>
                  <p className="text-[10px] text-neutral-500 mt-1 font-medium">Auto-calculates weight increments through logged study sessions.</p>
                </div>
                <div className="text-[9px] font-bold tracking-wider text-teal-500 uppercase mt-4">Status: Active Progression</div>
              </div>

            </div>
          </div>

          {/* Immersion Feed System Right Column */}
          <div className="space-y-4">
            <div className="bg-neutral-900/50 border border-neutral-800/80 rounded-xl p-5 flex flex-col h-full max-h-[420px]">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Activity Immersion Log</h3>
                <button 
                  onClick={() => setShowAddLog(!showAddLog)}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-[10px] font-bold text-neutral-200 rounded-md transition-colors"
                >
                  {showAddLog ? '✕ Cancel' : '＋ Log Input'}
                </button>
              </div>

              {showAddLog && (
                <form onSubmit={handleAddLog} className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl mb-4 space-y-2 animate-fadeIn shrink-0">
                  <input 
                    type="text" placeholder="Activity name (e.g. Reading Manga, Podcast)"
                    value={logActivity} onChange={e => setLogActivity(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-xs text-neutral-200 outline-none focus:border-neutral-700" required
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select value={logType} onChange={e => setLogType(e.target.value as any)} className="bg-neutral-900 border border-neutral-800 rounded p-1.5 text-xs text-neutral-200 outline-none">
                      <option value="Immersion">Listening/Immersion</option>
                      <option value="Grammar">Grammar Review</option>
                      <option value="Reading">Reading Practice</option>
                      <option value="Vocabulary">Vocabulary Build</option>
                      <option value="Speaking Output">Speaking Output</option>
                    </select>
                    <input 
                      type="number" min={5} step={5} placeholder="Minutes"
                      value={logDuration} onChange={e => setLogDuration(parseInt(e.target.value) || 0)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-xs font-mono text-neutral-200 outline-none" required
                    />
                  </div>
                  <button type="submit" className="w-full py-1.5 bg-teal-600 hover:bg-teal-500 font-bold text-[10px] text-white uppercase rounded transition-colors">Submit Session</button>
                </form>
              )}

              {/* Feed items scroll container */}
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                {activeLogs.length === 0 ? (
                  <div className="text-center py-8 text-neutral-600 text-xs font-medium">No activity logged for this language yet.</div>
                ) : (
                  activeLogs.map(log => (
                    <div key={log.id} className="p-2.5 bg-neutral-950/40 border border-neutral-900 rounded-lg flex justify-between items-center gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-neutral-200 truncate" title={log.activity}>{log.activity}</p>
                        <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">{log.type}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-mono font-bold text-teal-400">+{log.duration}m</span>
                        <p className="text-[8px] text-neutral-600 font-mono mt-0.5">{log.date}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="text-center py-12 text-neutral-600 text-sm font-medium tracking-wide">
          Click "Add Target Language" above to begin tracking fluencies.
        </div>
      )}
    </div>
  );
}
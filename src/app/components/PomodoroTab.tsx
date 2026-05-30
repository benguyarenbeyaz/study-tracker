"use client";

import React, { useState, useEffect, useRef } from "react";

// === PREMIUM CUSTOM DROPDOWN COMPONENT ===
const CustomSelect = ({ value, onChange, options, placeholder, className = "" }: any) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <div 
        onClick={() => setOpen(!open)}
        className="w-full h-full bg-neutral-900/60 hover:bg-neutral-800/40 border border-neutral-800/80 hover:border-neutral-700/80 rounded-lg p-2.5 text-xs text-neutral-200 cursor-pointer flex justify-between items-center transition-all outline-none shadow-sm"
      >
        <span className="truncate pr-2 font-medium">{value || placeholder}</span>
        <span className="text-[10px] text-neutral-500 shrink-0 transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
      </div>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-full bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto custom-scrollbar overflow-hidden">
          {placeholder && (
            <div onClick={() => { onChange(""); setOpen(false); }} className="p-2.5 text-xs text-neutral-500 hover:bg-neutral-800 cursor-pointer transition-colors italic">
              {placeholder}
            </div>
          )}
          {options.map((opt: string) => (
            <div key={opt} onClick={() => { onChange(opt); setOpen(false); }} className="p-2.5 text-xs text-neutral-200 hover:bg-neutral-800 cursor-pointer transition-colors font-medium">
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function PomodoroTab({ appState, onSave }: { appState: any, onSave: (state: any) => void }) {
  // === DATA PREPARATION ===
  const categories: string[] = appState?.categories || ["Other"];
  const studyData: any[] = appState?.study_data || [];
  const datelessData: any[] = appState?.dateless_data || [];
  const subtaskDict: any = appState?.subtask_dict || {};
  const activeTasks = [...studyData, ...datelessData].filter(t => t.Status !== "Completed");

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const formatDate = (d: Date) => {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const todayStr = formatDate(today);
  const tomorrowStr = formatDate(tomorrow);
  const currentMonthStr = todayStr.substring(3); 

  // Advanced Filtering: Check Parent Task Date OR Subtask/Session Date
  const getRelevantTasks = (targetDateStr: string) => {
    return activeTasks.map(t => {
      const isTaskDated = t.Date === targetDateStr;
      const relevantSessions = (t.sessions || []).filter((s:any) => s.date === targetDateStr && s.status !== "Completed");
      const relevantSubtasks = (subtaskDict[t.Name] || []).filter((s:any) => s.date === targetDateStr && !s.done);
      
      if (isTaskDated || relevantSessions.length > 0 || relevantSubtasks.length > 0) {
        return { ...t, isTaskDated, relevantSessions, relevantSubtasks };
      }
      return null;
    }).filter(Boolean);
  };

  const todayTasksList = getRelevantTasks(todayStr);
  const tomorrowTasksList = getRelevantTasks(tomorrowStr);
  
  const parseDate = (dStr: string) => {
    if (!dStr) return 0;
    const [d, m, y] = dStr.split('/');
    return new Date(Number(y), Number(m) - 1, Number(d)).getTime();
  };
  
  const dueThisMonthList = activeTasks
    .filter(t => t.Due && t.Due.includes(currentMonthStr))
    .sort((a, b) => parseDate(a.Due) - parseDate(b.Due));

  // === UI & STORAGE STATE ===
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedCat, setSelectedCat] = useState("All"); 
  const [selectedTask, setSelectedTask] = useState("");
  const [newTaskName, setNewTaskName] = useState("");
  const [clockTab, setClockTab] = useState<"Pomodoro" | "Counter">("Pomodoro");
  const [showDatelessSubtasks, setShowDatelessSubtasks] = useState(true);
  const [showMiniCal, setShowMiniCal] = useState(false);
  
  const [randomPool, setRandomPool] = useState<"Master Log" | "Backlog" | "Both">("Master Log");
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  // Active Session Integration
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);

  // === ROBUST TIMER STATE ===
  const [isRunning, setIsRunning] = useState(false);
  const [pomoMode, setPomoMode] = useState("Work");
  const [baseTimeLeft, setBaseTimeLeft] = useState(25 * 60); 
  const [baseTimeElapsed, setBaseTimeElapsed] = useState(0); 
  const [runStartTimestamp, setRunStartTimestamp] = useState<number | null>(null); 

  const [displayTimeLeft, setDisplayTimeLeft] = useState(25 * 60);
  const [displayTimeElapsed, setDisplayTimeElapsed] = useState(0);
  
  // Celebration State
  const [showBalloons, setShowBalloons] = useState(false);

  // === LOCAL STORAGE SYNC ===
  useEffect(() => {
    const saved = localStorage.getItem("studyTrackerClock");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        setClockTab(p.clockTab || "Pomodoro");
        setPomoMode(p.pomoMode || "Work");
        setSelectedTask(p.selectedTask || "");
        setNewTaskName(p.newTaskName || "");
        setActiveSessionId(p.activeSessionId || null);
        setSessionStartTime(p.sessionStartTime || null);
        
        setBaseTimeLeft(p.baseTimeLeft ?? 25 * 60);
        setBaseTimeElapsed(p.baseTimeElapsed ?? 0);
        
        if (p.isRunning && p.runStartTimestamp) {
          setIsRunning(true);
          setRunStartTimestamp(p.runStartTimestamp);
        }
      } catch(e) {}
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("studyTrackerClock", JSON.stringify({
      clockTab, pomoMode, selectedTask, newTaskName, activeSessionId, sessionStartTime,
      isRunning, baseTimeLeft, baseTimeElapsed, runStartTimestamp
    }));
  }, [isLoaded, clockTab, pomoMode, selectedTask, newTaskName, activeSessionId, sessionStartTime, isRunning, baseTimeLeft, baseTimeElapsed, runStartTimestamp]);

  // === CLOCK ENGINE ===
  const playDing = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch(e) { console.error("Audio block", e) }
  };

  const triggerCompletion = () => {
    setIsRunning(false);
    setRunStartTimestamp(null);
    setBaseTimeLeft(0);
    playDing();
    setShowBalloons(true);
    setTimeout(() => setShowBalloons(false), 6000);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && runStartTimestamp) {
      interval = setInterval(() => {
        const now = Date.now();
        const deltaSecs = Math.floor((now - runStartTimestamp) / 1000);
        
        if (clockTab === "Pomodoro") {
          const newTime = baseTimeLeft - deltaSecs;
          if (newTime <= 0) {
            setDisplayTimeLeft(0);
            triggerCompletion();
          } else {
            setDisplayTimeLeft(newTime);
          }
        } else {
          setDisplayTimeElapsed(baseTimeElapsed + deltaSecs);
        }
      }, 500);
    } else {
      setDisplayTimeLeft(baseTimeLeft);
      setDisplayTimeElapsed(baseTimeElapsed);
    }
    return () => clearInterval(interval);
  }, [isRunning, runStartTimestamp, baseTimeLeft, baseTimeElapsed, clockTab]);

  const handleStartPause = () => {
    if (isRunning) {
      setIsRunning(false);
      if (runStartTimestamp) {
        const deltaSecs = Math.floor((Date.now() - runStartTimestamp) / 1000);
        if (clockTab === "Pomodoro") setBaseTimeLeft(Math.max(0, baseTimeLeft - deltaSecs));
        else setBaseTimeElapsed(baseTimeElapsed + deltaSecs);
      }
      setRunStartTimestamp(null);
    } else {
      if (!sessionStartTime) {
        const now = new Date();
        setSessionStartTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
      }
      if (clockTab === "Pomodoro" && baseTimeLeft === 0) {
        setBaseTimeLeft(pomoMode === "Work" ? 25*60 : pomoMode === "Short Break" ? 5*60 : 15*60);
      }
      setIsRunning(true);
      setRunStartTimestamp(Date.now());
    }
  };

  const setTimerMode = (mode: string, mins: number) => {
    setPomoMode(mode);
    setIsRunning(false);
    setRunStartTimestamp(null);
    setBaseTimeLeft(mins * 60);
  };

  const formatTitleTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const formatStopwatch = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  useEffect(() => {
    if (isRunning) {
      document.title = clockTab === "Pomodoro" ? `(${formatTitleTime(displayTimeLeft)}) ${pomoMode}` : `(${formatTitleTime(displayTimeElapsed)}) Stopwatch`;
    } else {
      document.title = "Study Tracker";
    }
    return () => { document.title = "Study Tracker"; };
  }, [displayTimeLeft, displayTimeElapsed, isRunning, clockTab, pomoMode]);

  const filteredTasks = selectedCat === "All" ? activeTasks : activeTasks.filter(t => t.Category === selectedCat);

  const pickRandomTask = () => {
    let pool = [];
    if (randomPool === "Master Log") pool = studyData;
    else if (randomPool === "Backlog") pool = datelessData;
    else pool = [...studyData, ...datelessData];

    pool = pool.filter(t => t.Status !== "Completed");
    if (selectedCat !== "All") pool = pool.filter(t => t.Category === selectedCat);

    if (pool.length === 0) return alert(`No active tasks found in ${selectedCat === "All" ? "any category" : selectedCat}.`);
    
    const random = pool[Math.floor(Math.random() * pool.length)];
    setSelectedCat(random.Category || "Other"); 
    setSelectedTask(random.Name);
    setNewTaskName("");
    setActiveSessionId(null);
  };

  const activateTaskFromSidebar = (task: any) => {
    setSelectedCat(task.Category || "Other");
    setSelectedTask(task.Name);
    setNewTaskName("");
    setActiveSessionId(null);
  };

  const toggleDatelessSubtask = (taskName: string, subIndex: number) => {
    const currentSubtasks = [...(subtaskDict[taskName] || [])];
    currentSubtasks[subIndex].done = !currentSubtasks[subIndex].done;
    onSave({ ...appState, subtask_dict: { ...subtaskDict, [taskName]: currentSubtasks } });
  };

  const handleDragStart = (e: any, taskName: string) => {
    setDraggedTask(taskName);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e: any) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  
  const handleDrop = (e: any, targetTaskName: string) => {
    e.preventDefault();
    if (!draggedTask || draggedTask === targetTaskName) return;

    const newStudyData = [...studyData];
    const dragIdx = newStudyData.findIndex(t => t.Name === draggedTask);
    const targetIdx = newStudyData.findIndex(t => t.Name === targetTaskName);

    if (dragIdx >= 0 && targetIdx >= 0) {
      const [item] = newStudyData.splice(dragIdx, 1);
      const insertIdx = newStudyData.findIndex(t => t.Name === targetTaskName);
      newStudyData.splice(insertIdx, 0, item);
      onSave({ ...appState, study_data: newStudyData });
    }
    setDraggedTask(null);
  };

  const handleDiscard = () => {
    if (!confirm("Are you sure you want to discard this session? All progress will be lost.")) return;
    setIsRunning(false);
    setRunStartTimestamp(null);
    setSessionStartTime(null);
    setDisplayTimeElapsed(0);
    setBaseTimeElapsed(0);
    if (clockTab === "Pomodoro") {
      const resetTime = pomoMode === "Work" ? 25 * 60 : pomoMode === "Short Break" ? 5 * 60 : 15 * 60;
      setBaseTimeLeft(resetTime);
      setDisplayTimeLeft(resetTime);
    } else {
      setBaseTimeLeft(0);
    }
  };

  const logSession = () => {
    const finalTaskName = newTaskName.trim() || selectedTask;
    if (!finalTaskName) return alert("Please select or write a task name before logging!");

    let minutesSpent = 0;
    if (clockTab === "Pomodoro") {
      const startingSecs = pomoMode === "Work" ? 25*60 : pomoMode === "Short Break" ? 5*60 : 15*60;
      minutesSpent = (startingSecs - displayTimeLeft) / 60;
    } else {
      minutesSpent = displayTimeElapsed / 60;
    }

    if (minutesSpent < 1) return alert("Session too short to log (less than 1 minute).");
    minutesSpent = Math.round(minutesSpent);

    const now = new Date();
    const endTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let updatedStudy = [...studyData];
    let updatedDateless = [...datelessData];
    const finalCat = selectedCat === "All" ? "Other" : selectedCat;

    const sIdx = updatedStudy.findIndex(t => t.Name === finalTaskName);
    if (sIdx >= 0) {
      if (activeSessionId) {
        const sessIdx = updatedStudy[sIdx].sessions?.findIndex((s:any) => s.id === activeSessionId);
        if (sessIdx >= 0) {
          updatedStudy[sIdx].sessions[sessIdx].time_logged = (Number(updatedStudy[sIdx].sessions[sessIdx].time_logged) || 0) + minutesSpent;
          updatedStudy[sIdx].sessions[sessIdx].date = todayStr;
          updatedStudy[sIdx].sessions[sessIdx].start_time = sessionStartTime || updatedStudy[sIdx].sessions[sessIdx].start_time || "";
          updatedStudy[sIdx].sessions[sessIdx].end_time = endTimeStr;
        }
      } else {
        const pomsEarned = Number((minutesSpent / 25).toFixed(1));
        updatedStudy[sIdx]["Pomodoros (done)"] = (Number(updatedStudy[sIdx]["Pomodoros (done)"]) || 0) + pomsEarned;
      }
    } else {
      const dIdx = updatedDateless.findIndex(t => t.Name === finalTaskName);
      if (dIdx >= 0) {
        const pomsEarned = Number((minutesSpent / 25).toFixed(1));
        updatedDateless[dIdx]["Pomodoros (done)"] = (Number(updatedDateless[dIdx]["Pomodoros (done)"]) || 0) + pomsEarned;
      } else {
        const pomsEarned = Number((minutesSpent / 25).toFixed(1));
        updatedStudy.unshift({ 
          Name: finalTaskName, Category: finalCat, Date: todayStr, 
          "Pomodoros (done)": pomsEarned, "Est. Time": "", Due: "", Priority: "Medium", Status: "Active", Notes: "", sessions: [] 
        });
      }
    }

    onSave({ ...appState, study_data: updatedStudy, dateless_data: updatedDateless });
    
    setIsRunning(false); 
    setRunStartTimestamp(null);
    setSessionStartTime(null);

    if (clockTab === "Pomodoro") setBaseTimeLeft(pomoMode === "Work" ? 25*60 : pomoMode === "Short Break" ? 5*60 : 15*60);
    else setBaseTimeElapsed(0);
  };

  const activeTaskTarget = newTaskName.trim() || selectedTask;
  const activeTaskObj = activeTasks.find(t => t.Name === activeTaskTarget);
  const activeDatelessSubtasks = subtaskDict[activeTaskTarget] || [];
  const activeStructuredSessions = activeTaskObj?.sessions?.filter((s: any) => s.status !== "Completed") || [];

  // Mini Calendar Render Logic
  const renderMiniCalendar = () => {
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const shift = firstDay === 0 ? 6 : firstDay - 1; // Start on Monday
    
    const dueDays = new Set(dueThisMonthList.map(t => parseInt(t.Due.split('/')[0], 10)));
    const cells = [];
    const currentDay = today.getDate();
    
    for (let i = 0; i < shift; i++) cells.push(<div key={`empty-${i}`} className="h-6"></div>);
    for (let i = 1; i <= daysInMonth; i++) {
      const isDue = dueDays.has(i);
      const isToday = i === currentDay;
      
      let cellClass = 'text-neutral-500 hover:bg-neutral-800 transition-colors';
      if (isToday && isDue) {
        cellClass = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold shadow-sm ring-1 ring-rose-500';
      } else if (isDue) {
        cellClass = 'bg-rose-500/20 text-rose-300 border border-rose-500/50 font-bold shadow-sm';
      } else if (isToday) {
        cellClass = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold shadow-sm';
      }

      cells.push(
        <div key={i} className={`flex items-center justify-center text-[10px] h-6 rounded-md ${cellClass}`}>
          {i}
        </div>
      );
    }
    return cells;
  };

  return (
    <>
      {showBalloons && (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="absolute bottom-[-100px] text-5xl" style={{ left: `${Math.random() * 100}%`, animation: `floatUp ${3 + Math.random() * 2.5}s ease-in forwards`, animationDelay: `${Math.random() * 1.5}s` }}>
              {['🎈', '🎉', '🎊', '✨'][Math.floor(Math.random() * 4)]}
            </div>
          ))}
          <style>{`
            @keyframes floatUp { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(-110vh) rotate(${Math.random() > 0.5 ? 360 : -360}deg); opacity: 0; } }
          `}</style>
        </div>
      )}

      <div className="flex flex-col gap-6 text-neutral-300 min-h-[85vh] p-1">
        
        {/* ================= TOP ROW: TASK SELECTION, MIDDLE SPACE, CLOCK ================= */}
        {/* Uses the exact same 3-column grid as the panels below to ensure perfect width matching */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full items-start">
          
          {/* 1. TASK SELECTION (Left - No Box, Vertical Stack) */}
          <div className="flex flex-col justify-start">
            <h2 className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center h-[34px]">Task Selection</h2>
            
            <div className="flex gap-3 mb-3 items-end">
              <div className="flex-1 flex flex-col">
                <label className="text-[10px] font-bold text-neutral-500 mb-1 tracking-wider">Select Category</label>
                <CustomSelect 
                  value={selectedCat === "All" ? "" : selectedCat} 
                  onChange={(v: string) => { setSelectedCat(v || "All"); setSelectedTask(""); setNewTaskName(""); setActiveSessionId(null); }} 
                  options={[...categories].sort()} 
                  placeholder="All categories" 
                  className="h-[34px]"
                />
              </div>

              <div className="flex flex-col shrink-0 w-[140px]">
                <label className="text-[10px] font-bold text-neutral-500 mb-1 tracking-wider">1. Random Task</label>
                <div className="flex h-[34px] shadow-sm rounded-lg overflow-hidden border border-neutral-800">
                  <div className="flex flex-col w-[50px] bg-neutral-950 shrink-0">
                    <button onClick={() => setRandomPool("Master Log")} className={`flex-1 text-[7px] font-bold tracking-widest transition-all border-b border-neutral-800/60 ${randomPool === "Master Log" ? "bg-neutral-800 text-neutral-100 font-extrabold" : "text-neutral-500 hover:bg-neutral-900"}`}>Master Log</button>
                    <button onClick={() => setRandomPool("Backlog")} className={`flex-1 text-[7px] font-bold tracking-widest transition-all border-b border-neutral-800/60 ${randomPool === "Backlog" ? "bg-neutral-800 text-neutral-100 font-extrabold" : "text-neutral-500 hover:bg-neutral-900"}`}>Backlog</button>
                    <button onClick={() => setRandomPool("Both")} className={`flex-1 text-[7px] font-bold tracking-widest transition-all ${randomPool === "Both" ? "bg-neutral-800 text-neutral-100 font-extrabold" : "text-neutral-500 hover:bg-neutral-900"}`}>Both</button>
                  </div>
                  <button onClick={pickRandomTask} className="flex-1 bg-neutral-900 hover:bg-neutral-800/80 text-neutral-300 hover:text-neutral-100 font-semibold transition-colors text-[10px] border-l border-neutral-800 outline-none">🎲 Pick for me</button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-neutral-500 mb-1 tracking-wider">2. Existing Task</label>
                <CustomSelect 
                  value={selectedTask} 
                  onChange={(v: string) => { setSelectedTask(v); setNewTaskName(""); setActiveSessionId(null); }} 
                  options={[...new Set(filteredTasks.map(t => t.Name))].sort()} 
                  placeholder="Choose task..." 
                  className="h-[34px]"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-neutral-500 mb-1 tracking-wider">3. Create New Task</label>
                <input 
                  type="text" 
                  value={newTaskName} 
                  onChange={(e) => {setNewTaskName(e.target.value); setSelectedTask(""); setActiveSessionId(null);}} 
                  placeholder="Task name..." 
                  className="w-full bg-neutral-900/60 hover:bg-neutral-800/20 border border-neutral-800/80 focus:border-neutral-700/80 rounded-lg p-2.5 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none transition-all h-[34px] shadow-sm font-medium" 
                />
              </div>
            </div>
          </div>

          {/* 2. TARGET TASK (Middle - Fill the nameless space when selected) */}
          <div className="flex flex-col h-full min-h-[250px]">
            {activeTaskTarget && (
              <div className="bg-neutral-900/20 border border-neutral-800/40 rounded-2xl p-5 shadow-sm flex flex-col h-full animate-in fade-in zoom-in-95 duration-200">
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Target task</p>
                <p className="text-neutral-200 font-semibold text-sm mb-4 truncate pb-2 border-b border-neutral-800/40">{activeTaskTarget}</p>
                
                {/* Structured Sessions */}
                {activeStructuredSessions.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-2">Study Sessions</p>
                    <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                      {activeStructuredSessions.map((sess: any) => (
                        <div 
                          key={sess.id}
                          onClick={() => setActiveSessionId(sess.id)}
                          className={`p-2 rounded-lg border text-[11px] cursor-pointer transition-all ${activeSessionId === sess.id ? 'bg-indigo-950/40 border-indigo-500/40 shadow-sm' : 'bg-neutral-950/40 border-neutral-800/70 hover:border-neutral-700'}`}
                        >
                          <div className="flex justify-between items-center gap-2">
                            <span className={`font-semibold truncate ${activeSessionId === sess.id ? 'text-indigo-300' : 'text-neutral-300'}`}>{sess.name}</span>
                            {activeSessionId === sess.id && <span className="text-[8px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-bold border border-indigo-500/30 shrink-0">SELECTED</span>}
                          </div>
                          <div className="flex gap-2 mt-1 text-[9px] font-mono text-neutral-500">
                            {sess.est_time && <span>Est: {sess.est_time}</span>}
                            {sess.time_logged > 0 && <span className="text-emerald-500/90 font-medium">Log: {sess.time_logged}m</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dateless Subtasks Checkboxes */}
                {activeDatelessSubtasks.length > 0 && (
                  <div className="pb-1 mt-auto">
                    <div 
                      className="flex justify-between items-center cursor-pointer mb-2 group select-none bg-neutral-950/40 p-2 rounded-lg border border-neutral-800/40 hover:bg-neutral-800/40 transition-colors w-fit" 
                      onClick={() => setShowDatelessSubtasks(!showDatelessSubtasks)}
                    >
                      <p className="text-[9px] font-bold text-neutral-500 group-hover:text-neutral-300 uppercase tracking-widest transition-colors pl-1">Dateless Subtasks</p>
                      <span className="text-neutral-500 text-[9px] transition-transform duration-200 px-2" style={{ transform: showDatelessSubtasks ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                    </div>
                    {showDatelessSubtasks && (
                      <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1 custom-scrollbar pl-1 mt-2">
                        {activeDatelessSubtasks.map((sub: any, idx: number) => (
                          <label key={idx} className="flex items-center gap-2.5 cursor-pointer group select-none">
                            <input 
                              type="checkbox" 
                              checked={sub.done} 
                              onChange={() => toggleDatelessSubtask(activeTaskTarget, idx)} 
                              className="appearance-none w-3.5 h-3.5 bg-neutral-950 border border-neutral-700 rounded-[4px] checked:bg-neutral-700 checked:border-neutral-600 cursor-pointer shrink-0 flex items-center justify-center after:content-['✓'] after:text-neutral-100 after:text-[8px] after:opacity-0 checked:after:opacity-100 transition-all outline-none" 
                            />
                            <span className={`text-[11px] transition-colors font-medium ${sub.done ? "text-neutral-600 line-through" : "text-neutral-400 group-hover:text-neutral-200"}`}>{sub.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {activeStructuredSessions.length === 0 && activeDatelessSubtasks.length === 0 && (
                  <p className="text-[11px] text-neutral-600 italic mt-auto">No scheduled sessions or subtasks attached.</p>
                )}
              </div>
            )}
          </div>

          {/* 3. CLOCK (Right - Left Aligned to Grid, Wrapped to 260px) */}
          <div className="flex flex-col items-start justify-start w-full h-full min-h-[250px]">
            
            <div className="flex flex-col w-full max-w-[260px]">
              
              {/* Sliding Switch matches total width */}
              <div className="relative flex w-full bg-neutral-900/20 rounded-lg p-1 mb-5 h-[34px] shadow-sm">
                <div 
                  className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-neutral-800/80 rounded-md shadow-sm transition-transform duration-300 ease-in-out ${clockTab === "Pomodoro" ? "translate-x-0" : "translate-x-[calc(100%+8px)]"}`}
                />
                <button onClick={() => {setClockTab("Pomodoro"); setIsRunning(false); setRunStartTimestamp(null);}} className={`relative z-10 flex-1 py-1 text-[9px] font-bold tracking-widest uppercase transition-colors outline-none ${clockTab === "Pomodoro" ? "text-neutral-100" : "text-neutral-500 hover:text-neutral-300"}`}>Pomodoro</button>
                <button onClick={() => {setClockTab("Counter"); setIsRunning(false); setRunStartTimestamp(null);}} className={`relative z-10 flex-1 py-1 text-[9px] font-bold tracking-widest uppercase transition-colors outline-none ${clockTab === "Counter" ? "text-neutral-100" : "text-neutral-500 hover:text-neutral-300"}`}>Stopwatch</button>
              </div>

              {/* Centered Digits */}
              <div className="flex flex-col items-center justify-center w-full mb-6">
                <h1 className="text-5xl md:text-6xl font-light tracking-tighter tabular-nums text-neutral-100 select-none mb-3">
                  {clockTab === "Pomodoro" ? formatTitleTime(displayTimeLeft) : formatStopwatch(displayTimeElapsed)}
                </h1>
                <div className="h-[20px] flex items-center justify-center gap-2">
                  {clockTab === "Pomodoro" && (
                    <>
                      <button onClick={() => setTimerMode("Work", 25)} className={`text-[9px] px-3 py-1 rounded-full font-semibold tracking-wider transition-all outline-none ${pomoMode === "Work" ? "bg-neutral-800 text-neutral-100 shadow-sm border border-neutral-700" : "bg-transparent text-neutral-500 border border-neutral-800 hover:text-neutral-300"}`}>Work (25m)</button>
                      <button onClick={() => setTimerMode("Short Break", 5)} className={`text-[9px] px-3 py-1 rounded-full font-semibold tracking-wider transition-all outline-none ${pomoMode === "Short Break" ? "bg-neutral-800 text-neutral-100 shadow-sm border border-neutral-700" : "bg-transparent text-neutral-500 border border-neutral-800 hover:text-neutral-300"}`}>Break (5m)</button>
                    </>
                  )}
                </div>
              </div>

              {/* 3 Buttons fill max width */}
              <div className="flex gap-2 w-full">
                <button onClick={handleStartPause} className={`flex-[1.2] font-bold py-2.5 px-3 rounded-lg transition-colors shadow-md outline-none text-[11px] tracking-wide ${!isRunning ? "bg-pink-300 hover:bg-pink-200 text-neutral-900" : "bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700"}`}>
                  {isRunning ? "❚❚ Pause" : (sessionStartTime ? "Continue" : "▶ Start")}
                </button>
                <button onClick={logSession} className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold py-2.5 px-2 rounded-lg border border-neutral-800 transition-colors shadow-sm outline-none text-[11px] tracking-wide">
                  Stop & Log
                </button>
                <button onClick={handleDiscard} className="px-3 bg-neutral-900/50 hover:bg-rose-950/30 border border-neutral-800 hover:border-rose-900/50 text-neutral-500 hover:text-rose-400 py-2.5 rounded-lg text-xs font-bold transition-all outline-none" title="Discard Session">
                  ✕
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* ================= BOTTOM ROW: SCHEDULE PANELS ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full mt-2">
          
          {/* TODAY PANEL */}
          <div className="flex flex-col min-h-[300px] max-h-[400px] bg-neutral-900/10 border border-neutral-800/40 rounded-2xl p-4">
            <h3 className="font-bold text-neutral-400 mb-3 text-[11px] uppercase tracking-widest shrink-0 flex items-center justify-between">
              <span>Today Tasks</span>
              <span className="text-neutral-500 font-mono text-[10px] font-normal tracking-normal lowercase">{todayStr}</span>
            </h3>
            <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 pr-1 content-start custom-scrollbar">
              {todayTasksList.map((t, i) => (
                <div 
                  key={t.Name + i} 
                  draggable 
                  onDragStart={(e) => handleDragStart(e, t.Name)} 
                  onDragOver={handleDragOver} 
                  onDrop={(e) => handleDrop(e, t.Name)} 
                  onClick={() => activateTaskFromSidebar(t)}
                  className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800/70 text-sm cursor-grab active:cursor-grabbing hover:bg-neutral-800/30 hover:border-neutral-700 transition-all shadow-sm group flex flex-col justify-start gap-1"
                >
                  <p className="font-semibold text-neutral-200 group-hover:text-neutral-100 transition-colors break-words leading-tight">{t.Name}</p>
                  
                  {/* Show specific subtasks/sessions that triggered it to appear today */}
                  {(!t.isTaskDated && t.relevantSessions?.length > 0) && (
                    <div className="mt-1 space-y-1">
                      {t.relevantSessions.map((s:any, idx:number) => (
                        <p key={idx} className="text-[10px] text-indigo-400 font-medium truncate">└ {s.name}</p>
                      ))}
                    </div>
                  )}
                  {(!t.isTaskDated && t.relevantSubtasks?.length > 0) && (
                    <div className="mt-1 space-y-1">
                      {t.relevantSubtasks.map((s:any, idx:number) => (
                        <p key={idx} className="text-[10px] text-emerald-400/80 font-medium truncate">└ {s.name}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {todayTasksList.length === 0 && (
                <div className="col-span-1 sm:col-span-2 py-6 border border-dashed border-neutral-800/60 rounded-xl text-center flex items-center justify-center">
                  <p className="text-xs text-neutral-600 italic">No tasks or subtasks for today.</p>
                </div>
              )}
            </div>
          </div>

          {/* TOMORROW PANEL */}
          <div className="flex flex-col min-h-[300px] max-h-[400px] bg-neutral-900/10 border border-neutral-800/40 rounded-2xl p-4">
            <h3 className="font-bold text-neutral-400 mb-3 text-[11px] uppercase tracking-widest shrink-0 flex items-center justify-between">
              <span>Tomorrow Tasks</span>
              <span className="text-neutral-500 font-mono text-[10px] font-normal tracking-normal lowercase">{tomorrowStr}</span>
            </h3>
            <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 pr-1 content-start custom-scrollbar">
              {tomorrowTasksList.map((t, i) => (
                <div 
                  key={t.Name + i} 
                  draggable 
                  onDragStart={(e) => handleDragStart(e, t.Name)} 
                  onDragOver={handleDragOver} 
                  onDrop={(e) => handleDrop(e, t.Name)} 
                  onClick={() => activateTaskFromSidebar(t)}
                  className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800/70 text-sm cursor-grab active:cursor-grabbing hover:bg-neutral-800/30 hover:border-neutral-700 transition-all shadow-sm group flex flex-col justify-start gap-1"
                >
                  <p className="font-semibold text-neutral-200 group-hover:text-neutral-100 transition-colors break-words leading-tight">{t.Name}</p>
                  
                  {(!t.isTaskDated && t.relevantSessions?.length > 0) && (
                    <div className="mt-1 space-y-1">
                      {t.relevantSessions.map((s:any, idx:number) => (
                        <p key={idx} className="text-[10px] text-indigo-400 font-medium truncate">└ {s.name}</p>
                      ))}
                    </div>
                  )}
                  {(!t.isTaskDated && t.relevantSubtasks?.length > 0) && (
                    <div className="mt-1 space-y-1">
                      {t.relevantSubtasks.map((s:any, idx:number) => (
                        <p key={idx} className="text-[10px] text-emerald-400/80 font-medium truncate">└ {s.name}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {tomorrowTasksList.length === 0 && (
                <div className="col-span-1 sm:col-span-2 py-6 border border-dashed border-neutral-800/60 rounded-xl text-center flex items-center justify-center">
                  <p className="text-xs text-neutral-600 italic">No tasks or subtasks for tomorrow.</p>
                </div>
              )}
            </div>
          </div>

          {/* DUE THIS MONTH PANEL (With Hover Mini Calendar) */}
          <div 
            className="relative flex flex-col min-h-[300px] max-h-[400px] bg-neutral-900/10 border border-neutral-800/40 rounded-2xl p-4"
            onMouseEnter={() => setShowMiniCal(true)}
            onMouseLeave={() => setShowMiniCal(false)}
          >
            {showMiniCal && (
              <div className="absolute bottom-[calc(100%+10px)] right-0 z-50 bg-neutral-900/95 backdrop-blur-md border border-neutral-700/80 p-4 rounded-xl shadow-2xl w-64 transition-opacity animate-in fade-in zoom-in-95 duration-200">
                <div className="text-[11px] font-bold text-neutral-300 uppercase tracking-widest mb-3 text-center">
                  {today.toLocaleString('default', { month: 'long' })} {today.getFullYear()}
                </div>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                    <div key={i} className="text-center text-[9px] font-bold text-neutral-500">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {renderMiniCalendar()}
                </div>
              </div>
            )}

            <h3 className="font-bold text-neutral-400 mb-3 text-[11px] uppercase tracking-widest shrink-0">Due This Month</h3>
            <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 pr-1 content-start custom-scrollbar">
              {dueThisMonthList.map((t, i) => (
                <div 
                  key={t.Name + i} 
                  onClick={() => activateTaskFromSidebar(t)}
                  className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800/70 text-sm hover:bg-neutral-800/30 hover:border-neutral-700 cursor-pointer transition-all shadow-sm group flex flex-col justify-between"
                >
                  <p className="font-semibold text-neutral-200 group-hover:text-neutral-100 transition-colors break-words leading-tight mb-2">{t.Name}</p>
                  <span className="text-[10px] font-mono font-bold bg-rose-950/40 border border-rose-900/50 text-rose-300 px-2 py-0.5 rounded-md w-fit tracking-wide">
                    📅 {t.Due}
                  </span>
                </div>
              ))}
              {dueThisMonthList.length === 0 && (
                <div className="col-span-1 sm:col-span-2 py-6 border border-dashed border-neutral-800/60 rounded-xl text-center flex items-center justify-center">
                  <p className="text-xs text-neutral-600 italic">No tasks due this month.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
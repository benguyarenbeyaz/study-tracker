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
        className="w-full h-full bg-neutral-900/60 hover:bg-neutral-800/40 border border-neutral-800/80 hover:border-neutral-700/80 rounded-xl p-3.5 text-sm text-neutral-200 cursor-pointer flex justify-between items-center transition-all outline-none shadow-sm"
      >
        <span className="truncate pr-2 font-medium">{value || placeholder}</span>
        <span className="text-[10px] text-neutral-500 shrink-0 transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
      </div>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-full bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto custom-scrollbar overflow-hidden">
          {placeholder && (
            <div onClick={() => { onChange(""); setOpen(false); }} className="p-3 text-sm text-neutral-500 hover:bg-neutral-800 cursor-pointer transition-colors italic">
              {placeholder}
            </div>
          )}
          {options.map((opt: string) => (
            <div key={opt} onClick={() => { onChange(opt); setOpen(false); }} className="p-3 text-sm text-neutral-200 hover:bg-neutral-800 cursor-pointer transition-colors font-medium">
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

  const todayTasksList = studyData.filter(t => t.Date === todayStr && t.Status !== "Completed");
  const tomorrowTasksList = studyData.filter(t => t.Date === tomorrowStr && t.Status !== "Completed");
  
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
  const [expandedSidebarTask, setExpandedSidebarTask] = useState<string | null>(null);
  
  const [randomPool, setRandomPool] = useState<"Master Log" | "Backlog" | "Both">("Master Log");
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  // Active Session Integration
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);

  // === PARKING LOT STATE ===
  const [parkText, setParkText] = useState("");
  const [parkCat, setParkCat] = useState(categories[0] || "Other");

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

  // === CLOCK ENGINE (Absolute Math) ===
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

  // Time Formatters
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
      document.title = clockTab === "Pomodoro" 
        ? `(${formatTitleTime(displayTimeLeft)}) ${pomoMode}` 
        : `(${formatTitleTime(displayTimeElapsed)}) Stopwatch`;
    } else {
      document.title = "Study Tracker";
    }
    return () => { document.title = "Study Tracker"; };
  }, [displayTimeLeft, displayTimeElapsed, isRunning, clockTab, pomoMode]);

  // === HANDLERS ===
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
    setExpandedSidebarTask(expandedSidebarTask === task.Name ? null : task.Name);
  };

  const expandDueTask = (task: any) => {
    setExpandedSidebarTask(expandedSidebarTask === task.Name ? null : task.Name);
  };

  const handlePark = () => {
    if (!parkText.trim()) return;
    const newRow = { 
      Name: parkText, Category: parkCat, Date: "", "Est. Time": "", Due: "",
      "Pomodoros (done)": 0, Priority: "Medium", Status: "Active", Notes: "Parked from Pomodoro", sessions: []
    };
    onSave({ ...appState, dateless_data: [newRow, ...datelessData] });
    setParkText("");
  };

  const toggleDatelessSubtask = (taskName: string, subIndex: number) => {
    const currentSubtasks = [...(subtaskDict[taskName] || [])];
    currentSubtasks[subIndex].done = !currentSubtasks[subIndex].done;
    onSave({ ...appState, subtask_dict: { ...subtaskDict, [taskName]: currentSubtasks } });
  };

  // Drag and Drop
  const handleDragStart = (e: any, taskName: string) => {
    setDraggedTask(taskName);
    e.dataTransfer.effectAllowed = "move";
  };
  
  const handleDragOver = (e: any) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  
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

  return (
    <>
      {showBalloons && (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute bottom-[-100px] text-5xl"
              style={{
                left: `${Math.random() * 100}%`,
                animation: `floatUp ${3 + Math.random() * 2.5}s ease-in forwards`,
                animationDelay: `${Math.random() * 1.5}s`,
              }}
            >
              {['🎈', '🎉', '🎊', '✨'][Math.floor(Math.random() * 4)]}
            </div>
          ))}
          <style>{`
            @keyframes floatUp {
              0% { transform: translateY(0) rotate(0deg); opacity: 1; }
              100% { transform: translateY(-110vh) rotate(${Math.random() > 0.5 ? 360 : -360}deg); opacity: 0; }
            }
          `}</style>
        </div>
      )}

      <div className="flex flex-col xl:flex-row gap-12 text-neutral-300 min-h-[85vh] p-1">
        
        {/* ================= LEFT MAIN COLUMN ================= */}
        <div className="xl:w-[46%] flex flex-col gap-10">
          
          {/* 1. TASK SELECTION */}
          <div className="">
            <h2 className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-4">Task Selection</h2>
            
            <div className="mb-5">
              <CustomSelect 
                value={selectedCat === "All" ? "" : selectedCat} 
                onChange={(v: string) => { setSelectedCat(v || "All"); setSelectedTask(""); setNewTaskName(""); setActiveSessionId(null); }} 
                options={[...categories].sort()} 
                placeholder="All categories" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-neutral-500 mb-2 tracking-wider">1. Random Task</label>
                <div className="flex h-[46px] shadow-sm rounded-xl overflow-hidden border border-neutral-800">
                  <div className="flex flex-col w-[70px] bg-neutral-950 shrink-0">
                    <button onClick={() => setRandomPool("Master Log")} className={`flex-1 text-[9px] font-bold tracking-wider transition-all border-b border-neutral-800/60 ${randomPool === "Master Log" ? "bg-neutral-800 text-neutral-100 font-extrabold" : "text-neutral-500 hover:bg-neutral-900"}`}>Master Log</button>
                    <button onClick={() => setRandomPool("Backlog")} className={`flex-1 text-[9px] font-bold tracking-wider transition-all border-b border-neutral-800/60 ${randomPool === "Backlog" ? "bg-neutral-800 text-neutral-100 font-extrabold" : "text-neutral-500 hover:bg-neutral-900"}`}>Backlog</button>
                    <button onClick={() => setRandomPool("Both")} className={`flex-1 text-[9px] font-bold tracking-wider transition-all ${randomPool === "Both" ? "bg-neutral-800 text-neutral-100 font-extrabold" : "text-neutral-500 hover:bg-neutral-900"}`}>Both</button>
                  </div>
                  <button onClick={pickRandomTask} className="flex-1 bg-neutral-900 hover:bg-neutral-800/80 text-neutral-300 hover:text-neutral-100 font-semibold transition-colors text-xs border-l border-neutral-800 outline-none">🎲 Pick for me</button>
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-neutral-500 mb-2 tracking-wider">2. Existing Task</label>
                <CustomSelect 
                  value={selectedTask} 
                  onChange={(v: string) => { setSelectedTask(v); setNewTaskName(""); setActiveSessionId(null); }} 
                  options={[...new Set(filteredTasks.map(t => t.Name))].sort()} 
                  placeholder="Choose task..." 
                  className="h-[46px]"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-neutral-500 mb-2 tracking-wider">3. Create New</label>
                <input 
                  type="text" 
                  value={newTaskName} 
                  onChange={(e) => {setNewTaskName(e.target.value); setSelectedTask(""); setActiveSessionId(null);}} 
                  placeholder="Task name..." 
                  className="w-full bg-neutral-900/60 hover:bg-neutral-800/20 border border-neutral-800/80 focus:border-neutral-700/80 rounded-xl p-3 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none transition-all h-[46px] shadow-sm font-medium" 
                />
              </div>
            </div>

            {/* Target Session Panel */}
            {activeTaskTarget && (
              <div className="mt-5 border-l-2 border-indigo-500/70 pl-4 py-0.5 bg-neutral-900/20 rounded-r-xl pr-2">
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Target task</p>
                <p className="text-neutral-200 font-semibold text-sm mb-3.5 truncate">{activeTaskTarget}</p>
                
                {/* Structured Sessions */}
                {activeStructuredSessions.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">Study Sessions</p>
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                      {activeStructuredSessions.map((sess: any) => (
                        <div 
                          key={sess.id}
                          onClick={() => setActiveSessionId(sess.id)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${activeSessionId === sess.id ? 'bg-indigo-950/40 border-indigo-500/40 shadow-sm' : 'bg-neutral-950/40 border-neutral-800/70 hover:border-neutral-700'}`}
                        >
                          <div className="flex justify-between items-center gap-2">
                            <span className={`font-semibold truncate ${activeSessionId === sess.id ? 'text-indigo-300' : 'text-neutral-300'}`}>{sess.name}</span>
                            {activeSessionId === sess.id && <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-bold border border-indigo-500/30 shrink-0">SELECTED</span>}
                          </div>
                          <div className="flex gap-3 mt-1 text-[10px] font-mono text-neutral-500">
                            {sess.est_time && <span>Est: {sess.est_time}</span>}
                            {sess.time_logged > 0 && <span className="text-emerald-500/90 font-medium">Logged: {sess.time_logged}m</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dateless Subtasks Checkboxes */}
                {activeDatelessSubtasks.length > 0 && (
                  <div className="pb-1">
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Dateless Subtasks</p>
                    <div className="space-y-2 max-h-28 overflow-y-auto pr-2 custom-scrollbar">
                      {activeDatelessSubtasks.map((sub: any, idx: number) => (
                        <label key={idx} className="flex items-center gap-3 cursor-pointer group select-none">
                          <input 
                            type="checkbox" 
                            checked={sub.done} 
                            onChange={() => toggleDatelessSubtask(activeTaskTarget, idx)} 
                            className="appearance-none w-4 h-4 bg-neutral-950 border border-neutral-700 rounded-md checked:bg-neutral-700 checked:border-neutral-600 cursor-pointer shrink-0 flex items-center justify-center after:content-['✓'] after:text-neutral-100 after:text-[9px] after:opacity-0 checked:after:opacity-100 transition-all outline-none" 
                          />
                          <span className={`text-xs transition-colors font-medium ${sub.done ? "text-neutral-600 line-through" : "text-neutral-400 group-hover:text-neutral-200"}`}>{sub.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. CLOCK */}
          <div className="bg-neutral-900/30 border border-neutral-800/50 rounded-2xl flex flex-col items-center w-full overflow-hidden shadow-sm">
            <div className="flex w-full border-b border-neutral-800 bg-neutral-950/20">
              <button onClick={() => {setClockTab("Pomodoro"); setIsRunning(false); setRunStartTimestamp(null);}} className={`flex-1 py-3.5 text-xs font-bold tracking-widest uppercase transition-all border-b-2 outline-none ${clockTab === "Pomodoro" ? "text-neutral-200 border-neutral-400 bg-neutral-900/20" : "text-neutral-500 border-transparent hover:text-neutral-300"}`}>Pomodoro</button>
              <button onClick={() => {setClockTab("Counter"); setIsRunning(false); setRunStartTimestamp(null);}} className={`flex-1 py-3.5 text-xs font-bold tracking-widest uppercase transition-all border-b-2 outline-none ${clockTab === "Counter" ? "text-neutral-200 border-neutral-400 bg-neutral-900/20" : "text-neutral-500 border-transparent hover:text-neutral-300"}`}>Stopwatch</button>
            </div>

            <div className="p-8 w-full flex flex-col items-center">
              {clockTab === "Pomodoro" ? (
                <>
                  <h1 className="text-7xl md:text-8xl font-light mb-5 tracking-tighter tabular-nums text-neutral-100 select-none">
                    {formatTitleTime(displayTimeLeft)}
                  </h1>
                  <div className="flex gap-2 mb-8">
                    <button onClick={() => setTimerMode("Work", 25)} className={`text-[11px] px-4 py-1.5 rounded-full font-semibold tracking-wider transition-all outline-none ${pomoMode === "Work" ? "bg-neutral-800 text-neutral-100 shadow-sm border border-neutral-700" : "bg-neutral-950/50 text-neutral-500 border border-neutral-900 hover:text-neutral-300"}`}>Work (25m)</button>
                    <button onClick={() => setTimerMode("Short Break", 5)} className={`text-[11px] px-4 py-1.5 rounded-full font-semibold tracking-wider transition-all outline-none ${pomoMode === "Short Break" ? "bg-neutral-800 text-neutral-100 shadow-sm border border-neutral-700" : "bg-neutral-950/50 text-neutral-500 border border-neutral-900 hover:text-neutral-300"}`}>Break (5m)</button>
                  </div>
                </>
              ) : (
                <h1 className="text-7xl md:text-8xl font-light mb-12 tracking-tighter tabular-nums text-neutral-100 select-none">
                  {formatStopwatch(displayTimeElapsed)}
                </h1>
              )}

              <div className="flex gap-3 w-full max-w-sm">
                <button onClick={handleStartPause} className={`flex-[1.3] font-bold py-3.5 px-4 rounded-xl transition-colors shadow-md outline-none text-sm tracking-wide ${!isRunning ? "bg-pink-300 hover:bg-pink-200 text-neutral-900" : "bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700"}`}>
                  {isRunning ? "❚❚ Pause" : (sessionStartTime ? "Continue" : "▶ Start")}
                </button>
                <button onClick={logSession} className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold py-3.5 px-4 rounded-xl border border-neutral-800 transition-colors shadow-sm outline-none text-sm tracking-wide">
                  Stop & Log
                </button>
                <button onClick={handleDiscard} className="px-4 bg-neutral-950 hover:bg-rose-950/30 border border-neutral-900 hover:border-rose-900/50 text-neutral-600 hover:text-rose-400 py-3.5 rounded-xl text-sm font-bold transition-all outline-none shadow-inner" title="Discard Session">
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT SIDEBAR ================= */}
        <div className="xl:w-[54%] flex flex-col gap-8 h-full min-h-[80vh]">
          
          {/* TODAY PANEL */}
          <div className="flex flex-col flex-1 min-h-0 bg-neutral-900/10 border border-neutral-800/40 rounded-2xl p-4">
            <h3 className="font-bold text-neutral-400 mb-3 text-[11px] uppercase tracking-widest shrink-0 flex items-center justify-between">
              <span>Today Tasks</span>
              <span className="text-neutral-500 font-mono text-[10px] font-normal tracking-normal lowercase">{todayStr}</span>
            </h3>
            <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 pr-1 content-start custom-scrollbar">
              {todayTasksList.map((t, i) => {
                const activeSessCount = t.sessions?.filter((s:any) => s.status !== "Completed").length || 0;
                return (
                  <div 
                    key={t.Name + i} 
                    draggable 
                    onDragStart={(e) => handleDragStart(e, t.Name)} 
                    onDragOver={handleDragOver} 
                    onDrop={(e) => handleDrop(e, t.Name)} 
                    onClick={() => activateTaskFromSidebar(t)}
                    className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800/70 text-sm cursor-grab active:cursor-grabbing hover:bg-neutral-800/30 hover:border-neutral-700 transition-all shadow-sm group flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-neutral-200 group-hover:text-neutral-100 transition-colors truncate">{t.Name}</p>
                        <span className="inline-block text-[10px] font-bold tracking-wider text-neutral-500 mt-1 bg-neutral-950 px-2 py-0.5 rounded-md border border-neutral-800/40">{t.Category || "Other"}</span>
                      </div>
                      {activeSessCount > 0 && (
                        <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-md border border-indigo-500/20 font-bold shrink-0 shadow-sm">
                          {activeSessCount} SESS
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {todayTasksList.length === 0 && (
                <div className="col-span-2 py-6 border border-dashed border-neutral-800/60 rounded-xl text-center">
                  <p className="text-xs text-neutral-600 italic">No tasks scheduled for today.</p>
                </div>
              )}
            </div>
          </div>

          {/* TOMORROW PANEL */}
          <div className="flex flex-col flex-1 min-h-0 bg-neutral-900/10 border border-neutral-800/40 rounded-2xl p-4">
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
                  className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800/70 text-sm cursor-grab active:cursor-grabbing hover:bg-neutral-800/30 hover:border-neutral-700 transition-all shadow-sm group"
                >
                  <p className="font-semibold text-neutral-200 group-hover:text-neutral-100 transition-colors truncate">{t.Name}</p>
                  <span className="inline-block text-[10px] font-bold tracking-wider text-neutral-500 mt-1 bg-neutral-950 px-2 py-0.5 rounded-md border border-neutral-800/40">{t.Category || "Other"}</span>
                </div>
              ))}
              {tomorrowTasksList.length === 0 && (
                <div className="col-span-2 py-6 border border-dashed border-neutral-800/60 rounded-xl text-center">
                  <p className="text-xs text-neutral-600 italic">No tasks scheduled for tomorrow.</p>
                </div>
              )}
            </div>
          </div>

          {/* DUE THIS MONTH PANEL */}
          <div className="flex flex-col flex-1 min-h-0 bg-neutral-900/10 border border-neutral-800/40 rounded-2xl p-4">
            <h3 className="font-bold text-neutral-400 mb-3 text-[11px] uppercase tracking-widest shrink-0">Due This Month</h3>
            <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 pr-1 content-start custom-scrollbar">
              {dueThisMonthList.map((t, i) => (
                <div 
                  key={t.Name + i} 
                  onClick={() => expandDueTask(t)}
                  className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800/70 text-sm hover:bg-neutral-800/30 hover:border-neutral-700 cursor-pointer transition-all shadow-sm group"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-neutral-200 group-hover:text-neutral-100 transition-colors truncate">{t.Name}</p>
                      <span className="inline-block text-[10px] font-bold tracking-wider text-neutral-500 mt-1 bg-neutral-950 px-2 py-0.5 rounded-md border border-neutral-800/40">{t.Category || "Other"}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-rose-950/40 border border-rose-900/50 text-rose-300 px-2.5 py-1 rounded-md whitespace-nowrap shrink-0 shadow-sm tracking-wide">
                       {t.Due}
                    </span>
                  </div>
                </div>
              ))}
              {dueThisMonthList.length === 0 && (
                <div className="col-span-2 py-6 border border-dashed border-neutral-800/60 rounded-xl text-center">
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
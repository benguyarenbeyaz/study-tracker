"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";

// === DATE CONVERSION UTILS ===
const toInputDate = (d: string) => {
  if (!d) return "";
  const parts = d.split('/');
  if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  return "";
};
const fromInputDate = (d: string) => {
  if (!d) return "";
  const parts = d.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return "";
};

// === AUTO-EXPANDING TEXTAREA ===
const AutoTextarea = ({ value, onChange, className = "", placeholder = "" }: any) => (
  <div className="grid min-w-0 w-full">
    <div className={`col-start-1 row-start-1 invisible whitespace-pre-wrap break-words min-w-0 w-full ${className}`} aria-hidden="true">
      {value + '\u200B'}
    </div>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`col-start-1 row-start-1 resize-none overflow-hidden w-full h-full bg-transparent focus:outline-none min-w-0 placeholder-slate-600 ${className}`}
      rows={1}
    />
  </div>
);

// === SLEEK CUSTOM DROPDOWN COMPONENT ===
const CustomSelect = ({ value, onChange, options, placeholder, className = "", listClassName = "", hideArrow = false, getOptionColor, textSize="text-[13px]" }: any) => {
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
    <div className={`relative text-left ${className}`} ref={ref}>
      <div 
        onClick={() => setOpen(!open)}
        className={`w-full h-full bg-transparent rounded px-2 py-1.5 ${textSize} cursor-pointer flex justify-between items-center transition-colors outline-none hover:bg-white/[0.04]`}
      >
        <span className={`pr-2 text-left whitespace-normal break-words leading-snug ${getOptionColor ? getOptionColor(value) : "text-slate-200"}`}>
          {value || placeholder}
        </span>
        {!hideArrow && <span className="text-[10px] text-slate-500 shrink-0">▼</span>}
      </div>
      {open && (
        <div className={`absolute top-full left-0 mt-1 w-full min-w-[140px] bg-[#0f1115] border border-slate-700/80 rounded shadow-2xl z-[999] max-h-48 overflow-y-auto custom-scrollbar text-left ${listClassName}`}>
          {placeholder && (
            <div onClick={() => { onChange(""); setOpen(false); }} className={`p-2 ${textSize} text-slate-500 hover:bg-slate-800/50 cursor-pointer transition-colors italic text-left`}>
              {placeholder}
            </div>
          )}
          {options.map((opt: string) => (
            <div 
              key={opt} 
              onClick={() => { onChange(opt); setOpen(false); }} 
              className={`p-2 ${textSize} hover:bg-slate-800/80 cursor-pointer transition-colors whitespace-normal break-words leading-snug text-left border-b border-slate-800/30 last:border-0 ${getOptionColor ? getOptionColor(opt) : "text-slate-300"}`}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// === HYBRID DATE PICKER ===
const CustomDatePicker = ({ value, onChange, placeholder = "DD/MM/YYYY", className = "" }: any) => {
  const dateRef = useRef<HTMLInputElement>(null);
  const handleInput = (e: any) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 8) val = val.substring(0, 8);
    if (val.length > 4) val = val.slice(0, 2) + '/' + val.slice(2, 4) + '/' + val.slice(4);
    else if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2);
    onChange(val);
  };
  const handleOpenPicker = () => {
    try {
      if (dateRef.current && 'showPicker' in HTMLInputElement.prototype) {
        dateRef.current.showPicker();
      }
    } catch (err) {}
  };
  return (
    <div className={`relative flex items-center w-full group ${className}`}>
      <input 
        type="text" 
        value={value || ""} 
        onChange={handleInput} 
        onClick={handleOpenPicker}
        placeholder={placeholder} 
        className="w-full bg-transparent focus:outline-none text-[12px] font-mono text-slate-300 placeholder-slate-600 text-center relative z-10 px-1 py-1.5" 
      />
      <input 
        type="date" 
        ref={dateRef}
        value={toInputDate(value)} 
        onChange={(e) => onChange(fromInputDate(e.target.value))} 
        className="absolute w-0 h-0 opacity-0 pointer-events-none" 
        style={{ colorScheme: 'dark' }}
        tabIndex={-1}
      />
    </div>
  );
};

// === HYBRID TIME PICKER ===
const CustomTimePicker = ({ value, onChange, placeholder = "00:00", className = "" }: any) => {
  const timeRef = useRef<HTMLInputElement>(null);
  const handleInput = (e: any) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 4) val = val.substring(0, 4);
    if (val.length > 2) val = val.slice(0, 2) + ':' + val.slice(2);
    onChange(val);
  };
  const handleOpenPicker = () => {
    try {
      if (timeRef.current && 'showPicker' in HTMLInputElement.prototype) {
        timeRef.current.showPicker();
      }
    } catch (err) {}
  };
  return (
    <div className={`relative flex items-center w-full group ${className}`}>
      <input 
        type="text" 
        value={value || ""} 
        onChange={handleInput} 
        onClick={handleOpenPicker}
        placeholder={placeholder} 
        className="w-full bg-transparent focus:outline-none text-[12px] font-mono text-slate-300 placeholder-slate-600 text-center relative z-10 px-1 py-1.5" 
      />
      <input 
        type="time" 
        ref={timeRef}
        value={value || ""} 
        onChange={(e) => onChange(e.target.value)} 
        className="absolute w-0 h-0 opacity-0 pointer-events-none" 
        style={{ colorScheme: 'dark' }}
        tabIndex={-1}
      />
    </div>
  );
};

export default function MasterLogTab({ appState, onSave }: { appState: any; onSave: (state: any) => void }) {
  const categories: string[] = appState?.categories || ["Other"];
  const sortedCategories = [...new Set(categories)].sort((a, b) => a.localeCompare(b)); 
  const studyData: any[] = appState?.study_data || [];
  const subtaskDict: any = appState?.subtask_dict || {};

  useEffect(() => {
    const names = studyData.map((t: any) => t.Name?.trim().toLowerCase() || "");
    const hasDuplicates = new Set(names).size !== names.length;
    if (hasDuplicates) {
      const uniqueTasks = new Map();
      const newStudyData: any[] = [];
      studyData.forEach((t: any) => {
        const nameKey = t.Name?.trim().toLowerCase() || "";
        if (uniqueTasks.has(nameKey)) {
          const existing = uniqueTasks.get(nameKey);
          existing["Pomodoros (done)"] = (Number(existing["Pomodoros (done)"]) || 0) + (Number(t["Pomodoros (done)"]) || 0);
          if (t.sessions) existing.sessions = [...(existing.sessions || []), ...t.sessions];
        } else {
          const clone = { ...t, sessions: t.sessions || [] };
          uniqueTasks.set(nameKey, clone);
          newStudyData.push(clone);
        }
      });
      onSave({ ...appState, study_data: newStudyData });
    }
  }, [studyData.length]);
  
  const activeStudyData = studyData.filter((t: any) => t.Status !== "Completed");

  // === UI STATE ===
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string, dir: 'asc'|'desc' } | null>(null);
  const [filterCat, setFilterCat] = useState("All Categories");
  const [showSubtasks, setShowSubtasks] = useState<boolean>(true);

  useEffect(() => {
    const saved = localStorage.getItem("masterLogUIState");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.activeTask !== undefined) setActiveTask(p.activeTask);
        if (p.expandedRow !== undefined) setExpandedRow(p.expandedRow);
        if (p.sortConfig !== undefined) setSortConfig(p.sortConfig);
        if (p.filterCat !== undefined) setFilterCat(p.filterCat);
        if (p.showSubtasks !== undefined) setShowSubtasks(p.showSubtasks);
      } catch(e) {}
    }
    setIsLoaded(true);
  }, []);
  
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("masterLogUIState", JSON.stringify({ activeTask, expandedRow, sortConfig, filterCat, showSubtasks }));
  }, [isLoaded, activeTask, expandedRow, sortConfig, filterCat, showSubtasks]);
  
  const [newSubtask, setNewSubtask] = useState("");
  const [qaName, setQaName] = useState("");
  const [qaCat, setQaCat] = useState(sortedCategories[0] || "Other");
  const [qaDate, setQaDate] = useState("");
  const [qaStart, setQaStart] = useState("");
  const [qaEnd, setQaEnd] = useState("");
  const [qaEstTime, setQaEstTime] = useState("");
  const [qaDue, setQaDue] = useState("");
  const [qaPriority, setQaPriority] = useState("Medium");
  const [qaNotes, setQaNotes] = useState("");
  const [draggedRowTask, setDraggedRowTask] = useState<string | null>(null);
  const [draggedSubtask, setDraggedSubtask] = useState<{taskName: string, idx: number} | null>(null);
  const [aiModalTask, setAiModalTask] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiPreview, setAiPreview] = useState<any[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // === HELPERS ===
  const priorityWeight: Record<string, number> = { "Urgent": 1, "High": 2, "Medium": 3, "Low": 4 };
  const cleanPriority = (pStr: string) => pStr?.replace(/^\d+\s*-\s*/, '') || "Medium";
  const getPriorityColor = (opt: string) => {
    const cleanOpt = cleanPriority(opt);
    if (cleanOpt === "Urgent") return "text-rose-400 font-bold";
    if (cleanOpt === "High") return "text-rose-400 font-semibold";
    return "text-slate-300";
  };
  const getStatusColor = (opt: string) => {
    return opt === "Completed" ? "text-emerald-500 font-bold" : "text-slate-300";
  };
  const getUrl = (text: string) => {
    const match = text?.match(/(https?:\/\/[^\s]+)/);
    return match ? match[0] : null;
  };

  const parseTimeStr = (timeStr: string) => {
    if (!timeStr) return 0;
    const str = String(timeStr).trim();
    if (/^\d+$/.test(str)) return parseInt(str, 10);
    let mins = 0;
    const hMatch = str.match(/(\d+(?:\.\d+)?)\s*h/i);
    const mMatch = str.match(/(\d+(?:\.\d+)?)\s*m/i);
    if (hMatch) mins += parseFloat(hMatch[1]) * 60;
    if (mMatch) mins += parseFloat(mMatch[1]);
    return mins;
  };

  const calcDiff = (start: string, end: string) => {
    if (!start || !end) return 0;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return 0;
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff < 0) diff += 24 * 60; 
    return diff;
  };
  
  const minsToStr = (totalMins: number) => {
    if (!totalMins || isNaN(totalMins) || totalMins <= 0) return "0m";
    const h = Math.floor(totalMins / 60);
    const m = Math.round(totalMins % 60);
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };
  
  const pomsToTime = (poms: number) => minsToStr((Number(poms) || 0) * 25);
  
  const calculateTaskTotals = (task: any) => {
    let sessionLogMins = 0;
    let sessionEstMins = 0;
    
    if (task.sessions && task.sessions.length > 0) {
      task.sessions.forEach((s: any) => {
        if (s.subsessions && s.subsessions.length > 0) {
           s.subsessions.forEach((sub: any) => {
              sessionLogMins += (parseTimeStr(String(sub.time_logged || "")) || calcDiff(sub.start_time, sub.end_time) || 0);
              sessionEstMins += parseTimeStr(sub.est_time || "0m");
           });
        } else {
           sessionLogMins += (parseTimeStr(String(s.time_logged || "")) || calcDiff(s.start_time, s.end_time) || 0);
           sessionEstMins += parseTimeStr(s.est_time || "0m");
        }
      });
    }
    
    let totalLogMins = sessionLogMins;
    let totalEstMins = sessionEstMins;

    // Manual overrides
    if (task["Time Logged"] !== undefined && String(task["Time Logged"]).trim() !== "") {
        totalLogMins = parseTimeStr(task["Time Logged"]);
    } else if (!task.sessions || task.sessions.length === 0) {
        totalLogMins += calcDiff(task.Start, task.End);
    }
    
    totalLogMins += (Number(task["Pomodoros (done)"]) || 0) * 25;

    if (task["Est. Time"] !== undefined && String(task["Est. Time"]).trim() !== "") {
        totalEstMins = parseTimeStr(task["Est. Time"]);
    }
    
    return { 
      logged: minsToStr(totalLogMins), 
      est: minsToStr(totalEstMins), 
      rawLogged: totalLogMins, 
      rawEst: totalEstMins,
      sessionLogMins,
      sessionEstMins
    };
  };
  
  const parseDateDDMMYYYY = (dStr: string) => {
    if (!dStr) return 0;
    const parts = dStr.split(/[\/\-\.]/);
    if (parts.length >= 3) {
      let y = parseInt(parts[2], 10);
      if (y < 100) y += 2000;
      return new Date(y, parseInt(parts[1], 10) - 1, parseInt(parts[0], 10)).getTime();
    }
    return 0;
  };

  // === HANDLERS ===
  const handleQuickAdd = () => {
    if (!qaName.trim()) return alert("Task name is required.");
    const existingIdx = studyData.findIndex((t: any) => t.Name.trim().toLowerCase() === qaName.trim().toLowerCase());
    if (existingIdx >= 0) return alert("A task with this name already exists.");
    const newRow = {
      Name: qaName.trim(), Category: qaCat, Date: qaDate.trim(), Start: qaStart.trim(), End: qaEnd.trim(), 
      "Pomodoros (done)": 0, "Est. Time": qaEstTime.trim(), Due: qaDue.trim(), Priority: qaPriority, 
      Notes: qaNotes.trim(), Status: "Active", sessions: []
    };
    onSave({ ...appState, study_data: [newRow, ...studyData] });
    setQaName(""); setQaDate(""); setQaStart(""); setQaEnd(""); setQaEstTime(""); setQaDue(""); setQaNotes("");
  };
  
  const updateTaskField = (taskName: string, field: string, value: any) => {
    const updated = studyData.map((t: any) => {
      if (t.Name === taskName) return { ...t, [field]: value };
      return t;
    });
    if (field === "Name" && value !== taskName) {
      const updatedSubDict = { ...subtaskDict };
      updatedSubDict[value] = updatedSubDict[taskName] || [];
      delete updatedSubDict[taskName];
      onSave({ ...appState, study_data: updated, subtask_dict: updatedSubDict });
      if (activeTask === taskName) setActiveTask(value);
      if (expandedRow === taskName) setExpandedRow(value);
    } else {
      onSave({ ...appState, study_data: updated });
    }
  };

  const deleteTask = (taskName: string) => {
    if (!confirm(`WARNING: Permanently delete "${taskName}"? All sessions and subtasks will be lost.`)) return;
    const updated = studyData.filter((t: any) => t.Name !== taskName);
    const updatedSubDict = { ...subtaskDict };
    delete updatedSubDict[taskName];
    onSave({ ...appState, study_data: updated, subtask_dict: updatedSubDict });
    if (activeTask === taskName) setActiveTask(null);
  };
  
  const handleSort = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) setSortConfig({ key, dir: 'asc' });
    else if (sortConfig.dir === 'asc') setSortConfig({ key, dir: 'desc' });
    else setSortConfig(null);
  };
  
  // -- Master Log Row Drop & Subtask-to-Task Drop --
  const handleRowDragStart = (e: any, taskName: string) => { 
    setDraggedRowTask(taskName);
    e.dataTransfer.effectAllowed = "move"; 
  };
  const handleRowDragOver = (e: any) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  
  const handleRowDrop = (e: any, targetTaskName: string) => {
    e.preventDefault();
    if (draggedSubtask) {
      if (draggedSubtask.taskName === targetTaskName) return; 
      const updatedSubDict = { ...subtaskDict };
      const sourceSubs = [...(updatedSubDict[draggedSubtask.taskName] || [])];
      const targetSubs = [...(updatedSubDict[targetTaskName] || [])];
      const [movedSub] = sourceSubs.splice(draggedSubtask.idx, 1);
      targetSubs.push(movedSub);
      updatedSubDict[draggedSubtask.taskName] = sourceSubs;
      updatedSubDict[targetTaskName] = targetSubs;
      onSave({ ...appState, subtask_dict: updatedSubDict });
      setDraggedSubtask(null);
    } else if (draggedRowTask && draggedRowTask !== targetTaskName) {
      const newStudyData = [...studyData];
      const dragIdx = newStudyData.findIndex((t: any) => t.Name === draggedRowTask);
      const targetIdx = newStudyData.findIndex((t: any) => t.Name === targetTaskName);
      if (dragIdx >= 0 && targetIdx >= 0) {
        const [item] = newStudyData.splice(dragIdx, 1);
        const insertIdx = newStudyData.findIndex((t: any) => t.Name === targetTaskName);
        newStudyData.splice(insertIdx, 0, item);
        onSave({ ...appState, study_data: newStudyData });
      }
      setDraggedRowTask(null);
    }
  };
  
  // -- Subtask Handlers --
  const handleAddSubtask = () => {
    if (!activeTask || !newSubtask.trim()) return;
    const currentSubs = subtaskDict[activeTask] || [];
    onSave({ ...appState, subtask_dict: { ...subtaskDict, [activeTask]: [{ name: newSubtask.trim(), done: false }, ...currentSubs] } });
    setNewSubtask("");
  };
  
  const updateSubtaskName = (idx: number, newName: string) => {
    if (!activeTask) return;
    let subs = [...(subtaskDict[activeTask] || [])];
    subs[idx].name = newName;
    onSave({ ...appState, subtask_dict: { ...subtaskDict, [activeTask]: subs } });
  };
  
  const toggleSubtask = (idx: number) => {
    if (!activeTask) return;
    let subs = [...(subtaskDict[activeTask] || [])];
    subs[idx].done = !subs[idx].done;
    onSave({ ...appState, subtask_dict: { ...subtaskDict, [activeTask]: subs } });
  };
  
  const deleteSubtask = (idx: number) => {
    if (!activeTask || !confirm("Delete this subtask permanently?")) return;
    let subs = [...(subtaskDict[activeTask] || [])];
    subs.splice(idx, 1);
    onSave({ ...appState, subtask_dict: { ...subtaskDict, [activeTask]: subs } });
  };
  
  const handleSubtaskDragStart = (e: any, idx: number) => { 
    if (!activeTask) return;
    setDraggedSubtask({ taskName: activeTask, idx }); 
    e.dataTransfer.effectAllowed = "move"; 
  };
  
  const handleSubtaskDrop = (e: any, dropIdx: number) => {
    e.preventDefault();
    if (!draggedSubtask || draggedSubtask.idx === dropIdx || !activeTask) return;
    if (draggedSubtask.taskName === activeTask) {
       let subs = [...(subtaskDict[activeTask] || [])];
       const [moved] = subs.splice(draggedSubtask.idx, 1);
       subs.splice(dropIdx, 0, moved);
       onSave({ ...appState, subtask_dict: { ...subtaskDict, [activeTask]: subs } });
    }
    setDraggedSubtask(null);
  };

  // -- Session & Subsession Handlers --
  const updateSessionField = (taskName: string, sIdx: number, field: string, value: any) => {
    const updated = studyData.map((t: any) => {
      if (t.Name === taskName) {
        const newSess = [...(t.sessions || [])];
        let sess = { ...newSess[sIdx], [field]: value };

        if ((field === "est_time" || field === "start_time") && sess.est_time && sess.start_time) {
           const estMins = parseTimeStr(sess.est_time);
           if (estMins > 0) {
             const [sh, sm] = sess.start_time.split(':').map(Number);
             if (!isNaN(sh) && !isNaN(sm)) {
               const totalMins = sh * 60 + sm + estMins;
               const eh = Math.floor(totalMins / 60) % 24;
               const em = totalMins % 60;
               sess.end_time = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
             }
           }
        }

        if ((field === "start_time" || field === "end_time") && sess.start_time && sess.end_time) {
             const diff = calcDiff(sess.start_time, sess.end_time);
             if (diff > 0 && !sess.est_time) sess.est_time = minsToStr(diff);
        }

        newSess[sIdx] = sess;
        const updatedTask = { ...t, sessions: newSess };
        
        // Clear manual overrides to force the task to sync from sessions
        if (field === "time_logged") delete updatedTask["Time Logged"];
        if (field === "est_time") delete updatedTask["Est. Time"];
        
        return updatedTask;
      }
      return t;
    });
    onSave({ ...appState, study_data: updated });
  };

  const addManualSession = (taskName: string) => {
    const updated = studyData.map((t: any) => {
      if (t.Name === taskName) {
        const newSess = { id: Date.now(), name: "", date: "", start_time: "", end_time: "", est_time: "", time_logged: "", notes: "", status: "Active" };
        return { ...t, sessions: [newSess, ...(t.sessions || [])] };
      }
      return t;
    });
    onSave({ ...appState, study_data: updated });
  };

  const deleteSession = (taskName: string, sIdx: number) => {
    if (!confirm("Delete this planned session permanently?")) return;
    const updated = studyData.map((t: any) => {
      if (t.Name === taskName) {
        const newSess = [...(t.sessions || [])];
        newSess.splice(sIdx, 1);
        return { ...t, sessions: newSess };
      }
      return t;
    });
    onSave({ ...appState, study_data: updated });
  };

  const addSubsession = (taskName: string, sIdx: number) => {
    const updated = studyData.map((t: any) => {
      if (t.Name === taskName) {
        const newSess = [...(t.sessions || [])];
        const sess = { ...newSess[sIdx] };
        const newSub = { 
           id: Date.now(), 
           name: sess.name, 
           date: sess.date, 
           start_time: "", 
           end_time: "", 
           est_time: "", 
           time_logged: "", 
           notes: "" 
        };
        sess.subsessions = [...(sess.subsessions || []), newSub];
        newSess[sIdx] = sess;
        return { ...t, sessions: newSess };
      }
      return t;
    });
    onSave({ ...appState, study_data: updated });
  };

  const updateSubsessionField = (taskName: string, sIdx: number, subIdx: number, field: string, value: any) => {
    const updated = studyData.map((t: any) => {
      if (t.Name === taskName) {
        const newSess = [...(t.sessions || [])];
        const sess = { ...newSess[sIdx] };
        const newSubs = [...(sess.subsessions || [])];
        let sub = { ...newSubs[subIdx], [field]: value };

        if ((field === "est_time" || field === "start_time") && sub.est_time && sub.start_time) {
           const estMins = parseTimeStr(sub.est_time);
           if (estMins > 0) {
             const [sh, sm] = sub.start_time.split(':').map(Number);
             if (!isNaN(sh) && !isNaN(sm)) {
               const totalMins = sh * 60 + sm + estMins;
               const eh = Math.floor(totalMins / 60) % 24;
               const em = totalMins % 60;
               sub.end_time = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
             }
           }
        }
        
        if ((field === "start_time" || field === "end_time") && sub.start_time && sub.end_time) {
             const diff = calcDiff(sub.start_time, sub.end_time);
             if (diff > 0 && !sub.est_time) sub.est_time = minsToStr(diff);
        }

        newSubs[subIdx] = sub;
        sess.subsessions = newSubs;
        newSess[sIdx] = sess;
        const updatedTask = { ...t, sessions: newSess };
        
        // Clear manual overrides to force the task to sync from subsessions
        if (field === "time_logged") delete updatedTask["Time Logged"];
        if (field === "est_time") delete updatedTask["Est. Time"];
        
        return updatedTask;
      }
      return t;
    });
    onSave({ ...appState, study_data: updated });
  };
  
  const deleteSubsession = (taskName: string, sIdx: number, subIdx: number) => {
    if (!confirm("Delete this subsession permanently?")) return;
    const updated = studyData.map((t: any) => {
      if (t.Name === taskName) {
        const newSess = [...(t.sessions || [])];
        const sess = { ...newSess[sIdx] };
        const newSubs = [...(sess.subsessions || [])];
        newSubs.splice(subIdx, 1);
        sess.subsessions = newSubs;
        newSess[sIdx] = sess;
        return { ...t, sessions: newSess };
      }
      return t;
    });
    onSave({ ...appState, study_data: updated });
  };

  // === AI ENGINE ===
  const runAIGenerator = async () => {
    if (!aiModalTask) return;
    const task = studyData.find((t: any) => t.Name === aiModalTask);
    if (!task) return;

    const apiKey = appState?.api_key || appState?.openai_api_key || localStorage.getItem("openai_api_key") || "";

    setIsGenerating(true);
    try {
      // 1. Collect deep context from the target task
      const taskSubtasks = (subtaskDict[aiModalTask] || []).map((s: any) => `- [${s.done ? 'X' : ' '}] ${s.name}`).join('\n');
      const taskNotes = task.Notes || "None";
      const taskSessions = (task.sessions || []).map((s: any, idx: number) => 
        `Session ${idx + 1}: ${s.name || 'Unnamed'} (Slots: ${s.slots || 1}, Est: ${s.est_time || 'N/A'}, Date: ${s.date || 'N/A'}, Time: ${s.start_time || 'N/A'}-${s.end_time || 'N/A'})`
      ).join('\n');

      // 2. Map out the full agenda to avoid date/hour overlaps
      const overallAgenda = studyData.map((t: any) => {
        const sessionsInfo = (t.sessions || []).map((s: any) => `Date: ${s.date || 'N/A'} (${s.start_time || 'N/A'}-${s.end_time || 'N/A'})`).join(', ');
        return `- Task: ${t.Name} | Busy Times: ${sessionsInfo || 'None'}`;
      }).join('\n');

      const systemPrompt = `You are an expert AI Study Planner. Create a targeted schedule layout for the task "${aiModalTask}" matching this request: "${aiPrompt}".
      
CRITICAL RULES:
1. Every item name you generate MUST strictly begin with the emoji prefix "🤖: ".
2. Look at the "Busy Times" in the Overall Agenda. Schedule dates ("DD/MM/YYYY") and times ("HH:MM") dynamically to completely avoid overlapping with existing items.

Task Context Details:
- Target Notes: ${taskNotes}
- Existing Subtasks:\n${taskSubtasks || 'None'}
- Current Scheduled Sessions:\n${taskSessions || 'None'}

Overall Agenda (Do not conflict with these slots):\n${overallAgenda}

Respond strictly with a valid JSON array of session objects. Do not include markdown text blocks or backticks.
Format: [{"name": "🤖: Precise Action Name", "slots": 1, "est_time": "1h 30m", "date": "DD/MM/YYYY", "start_time": "HH:MM", "end_time": "HH:MM"}]`;

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}` // Ensure your state variable for the key is accessible here
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Generate a smart, conflict-free plan following the prompt: "${aiPrompt}"` }
          ],
          temperature: 0.5
        })
      });

      if (!res.ok) throw new Error("AI Generation failed");
      const data = await res.json();
      let text = data.choices[0].message.content.trim();
      if (text.startsWith("```")) {
        text = text.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      }

      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        // Safety formatter ensuring prefix rule is strictly followed
        const formatted = parsed.map(s => ({
          ...s,
          name: s.name.startsWith("🤖:") ? s.name : `🤖: ${s.name}`
        }));
        setAiPreview(formatted);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to build plan. Verify API access and formatting constraints.");
    } finally {
      setIsGenerating(false);
    }
  };
  
  const sortedData = useMemo(() => {
    return [...activeStudyData]
      .filter((t: any) => filterCat === "All Categories" || t.Category === filterCat)
      .sort((a: any, b: any) => {
        if (!sortConfig) return 0;
        const { key, dir } = sortConfig;
        const mod = dir === 'asc' ? 1 : -1;
        if (key === 'Date' || key === 'Due') return (parseDateDDMMYYYY(a[key]) - parseDateDDMMYYYY(b[key])) * mod;
        if (key === 'Priority') return (priorityWeight[cleanPriority(a.Priority)] - priorityWeight[cleanPriority(b.Priority)]) * mod;
        if (key === 'Time Logged') return (calculateTaskTotals(a).rawLogged - calculateTaskTotals(b).rawLogged) * mod;
        const strA = String(a[key] || '').toLowerCase();
        const strB = String(b[key] || '').toLowerCase();
        if (strA < strB) return -1 * mod;
        if (strA > strB) return 1 * mod;
        return 0;
      });
  }, [activeStudyData, filterCat, sortConfig]);
  
  return (
    <div className="flex w-full text-[13px] text-slate-300 h-full max-h-[85vh] overflow-hidden bg-[#050505]">
      
      <style>{`
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>

      {/* AI GENERATOR MODAL */}
      {aiModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-[#080a0f] border border-slate-800 rounded-xl p-6 w-full max-w-lg shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
              <h2 className="text-lg font-bold text-indigo-400">✨ AI Study Planner</h2>
              <button onClick={() => {setAiModalTask(null); setAiPreview(null);}} className="text-slate-500 hover:text-slate-200">✕</button>
            </div>
            <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="How do you want to study this? e.g., 'Finish Quantum Mechanics Chapter 1'" className="w-full h-24 bg-[#0a0d14] border border-slate-800 rounded-md p-3 text-[13px] text-slate-200 focus:outline-none focus:border-indigo-500 resize-none" />
            {!aiPreview ? (
              <button onClick={runAIGenerator} disabled={isGenerating} className="bg-pink-300 hover:bg-pink-200 text-neutral-900 text-white py-2.5 rounded-md text-[13px] font-bold transition-colors shadow-lg">
                {isGenerating ? "Analyzing History & Structuring..." : "Generate Custom Plan"}
              </button>
            ) : (
              <div className="bg-[#0a0d14] border border-slate-800 rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Preview Plan</p>
                {aiPreview.map((s, i) => (
                  <div key={i} className="flex justify-between text-[12px] bg-[#050505] p-2 rounded border border-slate-800/60">
                    <span className="text-slate-300 font-medium whitespace-pre-wrap break-words pr-2 flex-1">{s.name}</span>
                    <span className="text-indigo-400 font-mono shrink-0">{s.est_time}</span>
                  </div>
                ))}
              </div>
            )}
            {aiPreview && (
              <div className="flex gap-3 mt-2">
                <button onClick={() => {
                  const updated = studyData.map((t: any) => t.Name === aiModalTask ? { ...t, sessions: [...(t.sessions || []), ...aiPreview] } : t);
                  onSave({ ...appState, study_data: updated });
                  setAiModalTask(null); setAiPrompt(""); setAiPreview(null);
                }} className="flex-1 bg-pink-300 hover:bg-pink-200 text-neutral-900 text-white py-2 rounded text-[13px] font-bold transition-colors">Accept & Log Plan</button>
                <button onClick={() => setAiPreview(null)} className="flex-1 bg-transparent hover:bg-slate-800 border border-slate-700 text-slate-300 py-2 rounded text-[13px] font-bold transition-colors">Discard</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MAIN TABLE ================= */}
      <div className="flex-1 min-w-0 flex flex-col h-full bg-transparent border-r border-slate-800/40 relative">
        <div className="flex justify-between items-center shrink-0 px-4 py-3 border-b border-slate-800/60 bg-[#080a0f]">
          <div>
            <h2 className="text-[13px] font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
              Master Study Log
              <span className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[10px]">{sortedData.length}</span>
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-48 bg-[#0a0d14] border border-slate-700/80 rounded shadow-sm hover:border-slate-500 transition-colors">
              <CustomSelect value={filterCat} onChange={setFilterCat} options={["All Categories", ...sortedCategories]} />
            </div>
            <button 
              onClick={() => setShowSubtasks(!showSubtasks)} 
              className={`text-[12px] px-3 py-1.5 rounded border transition-colors ${showSubtasks ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' : 'bg-[#0a0d14] border-slate-700/80 text-slate-400 hover:text-slate-200 hover:border-slate-500'}`}
            >
              {showSubtasks ? 'Hide Subtasks' : 'Show Subtasks'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 px-4 py-3 border-b border-slate-800/60 bg-[#06080c] w-full">
          <input type="text" value={qaName} onChange={(e) => setQaName(e.target.value)} placeholder="New Task Name..." className="flex-[3] min-w-[200px] bg-transparent border border-slate-800 hover:border-slate-700 focus:border-indigo-500/50 rounded-md px-3 py-1.5 text-[13px] text-slate-200 transition-colors outline-none font-medium" />
          <div className="w-[140px] border border-slate-800 hover:border-slate-700 rounded-md transition-colors">
            <CustomSelect value={qaCat} onChange={setQaCat} options={sortedCategories} placeholder="Category" />
          </div>
          <div className="w-[110px] border border-slate-800 hover:border-slate-700 rounded-md transition-colors">
            <CustomDatePicker value={qaDate} onChange={setQaDate} placeholder="Date" />
          </div>
          <div className="w-[85px] border border-slate-800 hover:border-slate-700 rounded-md transition-colors">
            <CustomTimePicker value={qaStart} onChange={setQaStart} placeholder="Start" />
          </div>
          <div className="w-[85px] border border-slate-800 hover:border-slate-700 rounded-md transition-colors">
            <CustomTimePicker value={qaEnd} onChange={setQaEnd} placeholder="End" />
          </div>
          <input type="text" value={qaEstTime} onChange={(e) => setQaEstTime(e.target.value)} placeholder="Est." className="w-[70px] bg-transparent border border-slate-800 hover:border-slate-700 focus:border-indigo-500/50 rounded-md px-3 py-1.5 text-[13px] text-slate-200 transition-colors outline-none text-center" />
          <div className="w-[110px] border border-slate-800 hover:border-slate-700 rounded-md transition-colors">
            <CustomDatePicker value={qaDue} onChange={setQaDue} placeholder="Due" />
          </div>
          <div className="w-[110px] border border-slate-800 hover:border-slate-700 rounded-md transition-colors">
            <CustomSelect value={qaPriority} onChange={setQaPriority} options={["Urgent", "High", "Medium", "Low"]} placeholder="Priority" getOptionColor={getPriorityColor} />
          </div>
          <input type="text" value={qaNotes} onChange={(e) => setQaNotes(e.target.value)} placeholder="Notes..." className="flex-[2] min-w-[150px] bg-transparent border border-slate-800 hover:border-slate-700 focus:border-indigo-500/50 rounded-md px-3 py-1.5 text-[13px] text-slate-200 transition-colors outline-none" />
          <button onClick={handleQuickAdd} className="bg-pink-300 hover:bg-pink-200 text-neutral-900 px-5 py-1.5 rounded-md text-[13px] font-bold transition-colors outline-none shadow-md">Add</button>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar pb-20">
          <table className="w-full text-left whitespace-nowrap min-w-[1250px] table-fixed">
            <thead className="bg-[#050505] sticky top-0 z-10 shadow-sm border-b border-slate-800/80">
              <tr className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <th className="px-2 py-3 w-[3%] text-center"></th>
                <th onClick={() => handleSort('Name')} className="px-2 py-3 text-left w-[20%] cursor-pointer hover:text-slate-300 select-none">Name {sortConfig?.key === 'Name' ? (sortConfig.dir === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('Category')} className="px-2 py-3 text-left w-[11%] cursor-pointer hover:text-slate-300 select-none">Category {sortConfig?.key === 'Category' ? (sortConfig.dir === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('Date')} className="px-2 py-3 text-center w-[7%] cursor-pointer hover:text-slate-300 select-none">Date {sortConfig?.key === 'Date' ? (sortConfig.dir === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('Start')} className="px-2 py-3 text-center w-[5%] cursor-pointer hover:text-slate-300 select-none">Start {sortConfig?.key === 'Start' ? (sortConfig.dir === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('End')} className="px-2 py-3 text-center w-[5%] cursor-pointer hover:text-slate-300 select-none">End {sortConfig?.key === 'End' ? (sortConfig.dir === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('Time Logged')} className="px-2 py-3 text-center w-[6%] cursor-pointer hover:text-slate-300 select-none">Logged {sortConfig?.key === 'Time Logged' ? (sortConfig.dir === 'asc' ? '↑' : '↓') : ''}</th>
                <th className="px-2 py-3 text-center w-[5%]">Est.</th>
                <th onClick={() => handleSort('Due')} className="px-2 py-3 text-center w-[7%] cursor-pointer hover:text-slate-300 select-none">Due {sortConfig?.key === 'Due' ? (sortConfig.dir === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('Priority')} className="px-2 py-3 text-center w-[7%] cursor-pointer hover:text-slate-300 select-none">Priority {sortConfig?.key === 'Priority' ? (sortConfig.dir === 'asc' ? '↑' : '↓') : ''}</th>
                <th className="px-2 py-3 text-left w-[14%]">Notes</th>
                <th className="px-2 py-3 text-center w-[8%]">Status</th>
                <th className="px-2 py-3 w-[2%]"></th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((task: any, idx: number) => {
                const isExpanded = expandedRow === task.Name;
                const cPriority = cleanPriority(task.Priority);
                const isActive = activeTask === task.Name;
                const totals = calculateTaskTotals(task);
                
                let upcomingSessions: any[] = [];
                let todaySessions: any[] = [];
                let pastSessions: any[] = [];

                if (isExpanded && task.sessions && task.sessions.length > 0) {
                  const today = new Date();
                  const todayStr = `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}/${today.getFullYear()}`;
                  const todayMs = parseDateDDMMYYYY(todayStr);
                  
                  const processedSessions = task.sessions.map((sess: any, originalIdx: number) => {
                     let totalEstMins = parseTimeStr(sess.est_time);
                     let totalLogMins = parseTimeStr(sess.time_logged);
                     
                     if (sess.subsessions && sess.subsessions.length > 0) {
                         totalEstMins = 0;
                         totalLogMins = 0;
                         sess.subsessions.forEach((sub: any) => {
                             totalEstMins += parseTimeStr(sub.est_time);
                             totalLogMins += parseTimeStr(sub.time_logged);
                         });
                     }
                     return { ...sess, originalIdx, calcEst: totalEstMins, calcLog: totalLogMins };
                  });

                  upcomingSessions = processedSessions.filter((s: any) => s.date !== todayStr && parseDateDDMMYYYY(s.date) > todayMs).sort((a: any, b: any) => parseDateDDMMYYYY(a.date) - parseDateDDMMYYYY(b.date) || (parseTimeStr(a.start_time) || 0) - (parseTimeStr(b.start_time) || 0));
                  
                  todaySessions = processedSessions.filter((s: any) => s.date === todayStr).sort((a: any, b: any) => (parseTimeStr(a.start_time) || 0) - (parseTimeStr(b.start_time) || 0));
                  
                  pastSessions = processedSessions.filter((s: any) => s.date !== todayStr && (!s.date || parseDateDDMMYYYY(s.date) < todayMs)).sort((a: any, b: any) => parseDateDDMMYYYY(b.date) - parseDateDDMMYYYY(a.date) || (parseTimeStr(b.start_time) || 0) - (parseTimeStr(a.start_time) || 0));
                }

                const renderSessionRow = (sess: any, isSub: boolean = false, subIdx: number = -1, parentIdx: number = -1) => {
                   const displayEst = isSub ? sess.est_time : (sess.subsessions?.length ? minsToStr(sess.calcEst) : sess.est_time);
                   const displayLogged = isSub ? sess.time_logged : (sess.subsessions?.length ? minsToStr(sess.calcLog) : sess.time_logged);
                   
                   const onChange = (field: string, val: any) => {
                      if (isSub) updateSubsessionField(task.Name, parentIdx, subIdx, field, val);
                      else updateSessionField(task.Name, sess.originalIdx, field, val);
                   };

                   return (
                    <div key={isSub ? `sub-${parentIdx}-${subIdx}` : `sess-${sess.originalIdx}`} className={`flex gap-2 items-center text-[12px] py-1.5 px-2 hover:bg-slate-800/30 rounded transition-colors group ${isSub ? 'ml-6 border-l-2 border-slate-700/50 pl-4 bg-slate-900/40' : ''}`}>
                      <div className="flex-[3] min-w-[120px]">
                        <AutoTextarea value={sess.name} onChange={(val: string) => onChange("name", val)} className={`text-slate-300 font-medium ${isSub ? 'text-[11px] text-slate-400' : ''}`} placeholder="Session Name" />
                      </div>
                      <div className="w-[85px]">
                        <CustomDatePicker value={sess.date} onChange={(val: string) => onChange("date", val)} placeholder="-" className="w-full text-center" />
                      </div>
                      <div className="w-[60px]">
                        <CustomTimePicker value={sess.start_time} onChange={(val: string) => onChange("start_time", val)} placeholder="-" className="w-full text-center" />
                      </div>
                      <div className="w-[60px]">
                        <CustomTimePicker value={sess.end_time} onChange={(val: string) => onChange("end_time", val)} placeholder="-" className="w-full text-center" />
                      </div>
                      <div className="w-[60px]">
                        <input type="text" value={displayEst} onChange={(e) => onChange("est_time", e.target.value)} onBlur={(e) => { const parsed = parseTimeStr(e.target.value); if(e.target.value.trim() !== "" && parsed > 0) onChange("est_time", minsToStr(parsed)); }} placeholder="-" className={`w-full bg-transparent focus:outline-none text-center ${sess.subsessions?.length && !isSub ? 'text-indigo-300 font-bold' : 'text-slate-400'}`} disabled={!isSub && sess.subsessions?.length > 0} />
                      </div>
                      <div className="w-[70px]">
                        <input type="text" value={displayLogged} onChange={(e) => onChange("time_logged", e.target.value)} onBlur={(e) => { const parsed = parseTimeStr(e.target.value); if(e.target.value.trim() !== "" && parsed > 0) onChange("time_logged", minsToStr(parsed)); }} placeholder="-" className={`w-full bg-transparent focus:outline-none text-center font-mono ${sess.subsessions?.length && !isSub ? 'text-slate-300 font-bold' : 'text-slate-400'}`} disabled={!isSub && sess.subsessions?.length > 0} />
                      </div>
                      <div className="flex-[2] min-w-[100px] pl-2">
                        <AutoTextarea value={sess.notes || ""} onChange={(val: string) => onChange("notes", val)} className="text-slate-400 text-[11px]" placeholder="Notes..." />
                      </div>
                      
                      {!isSub ? (
                        <div className="w-[85px]">
                          <CustomSelect hideArrow={true} value={sess.status} onChange={(val: string) => onChange("status", val)} options={["Active", "Completed"]} getOptionColor={getStatusColor} className="w-full text-center font-bold" />
                        </div>
                      ) : (
                        <div className="w-[85px]"></div>
                      )}
                      
                      <div className="w-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                        {!isSub && <button onClick={() => addSubsession(task.Name, sess.originalIdx)} className="text-indigo-400 hover:text-indigo-300 text-[14px]" title="Add Subsession">+</button>}
                        <button onClick={() => { if(!isSub) deleteSession(task.Name, sess.originalIdx); else deleteSubsession(task.Name, parentIdx, subIdx); }} className="text-rose-500/70 hover:text-rose-400 text-xs" title="Delete">🗑️</button>
                      </div>
                    </div>
                   );
                };

                return (
                  <React.Fragment key={`row-group-${idx}`}>
                    <tr 
                      draggable 
                      onDragStart={(e) => handleRowDragStart(e, task.Name)} 
                      onDragOver={handleRowDragOver} 
                      onDrop={(e) => handleRowDrop(e, task.Name)}
                      onClick={() => setActiveTask(isActive ? null : task.Name)} 
                      className={`transition-colors cursor-pointer group ${isActive ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"}`}
                    >
                      <td className="px-2 py-3 text-center align-top min-w-[32px]" onClick={(e) => { e.stopPropagation(); setExpandedRow(isExpanded ? null : task.Name); }}>
                        <span className="text-slate-500 hover:text-slate-300 font-bold text-xs cursor-pointer transition-colors px-1 mt-1 block">
                          {isExpanded ? "▼" : "▶"}
                        </span>
                      </td>
                      <td className="px-2 py-3 align-top min-w-0">
                        <AutoTextarea value={task.Name} onChange={(val: string) => updateTaskField(task.Name, "Name", val)} className={isActive ? 'text-indigo-200' : 'text-slate-200'} />
                      </td>
                      <td className="px-1 py-2 align-top pt-2.5 min-w-0">
                        <CustomSelect hideArrow={true} value={task.Category} onChange={(v: string) => updateTaskField(task.Name, "Category", v)} options={sortedCategories} className="w-full" />
                      </td>
                      <td className="px-1 py-2 align-top pt-2.5 min-w-0">
                        <CustomDatePicker value={task.Date} onChange={(v: string) => updateTaskField(task.Name, "Date", v)} placeholder="-" className="w-full" />
                      </td>
                      <td className="px-1 py-2 align-top pt-2.5 min-w-0">
                        <CustomTimePicker value={task.Start || ""} onChange={(v: string) => updateTaskField(task.Name, "Start", v)} placeholder="-" className="w-full" />
                      </td>
                      <td className="px-1 py-2 align-top pt-2.5 min-w-0">
                        <CustomTimePicker value={task.End || ""} onChange={(v: string) => updateTaskField(task.Name, "End", v)} placeholder="-" className="w-full" />
                      </td>
                      <td className="px-2 py-3 align-top pt-2.5 min-w-0">
                        <input 
                          type="text" 
                          value={task["Time Logged"] !== undefined ? task["Time Logged"] : (totals.sessionLogMins > 0 ? minsToStr(totals.sessionLogMins) : "")} 
                          onChange={(e) => updateTaskField(task.Name, "Time Logged", e.target.value)} 
                          placeholder={totals.sessionLogMins > 0 ? minsToStr(totals.sessionLogMins) : "-"}
                          className="w-full bg-transparent focus:outline-none text-center text-[12px] font-mono text-slate-300 font-medium placeholder-slate-500" 
                        />
                      </td>
                      <td className="px-2 py-3 align-top pt-2.5 min-w-0">
                        <input 
                          type="text" 
                          value={task["Est. Time"] !== undefined ? task["Est. Time"] : (totals.sessionEstMins > 0 ? minsToStr(totals.sessionEstMins) : "")} 
                          onChange={(e) => updateTaskField(task.Name, "Est. Time", e.target.value)} 
                          placeholder={totals.sessionEstMins > 0 ? minsToStr(totals.sessionEstMins) : "-"}
                          className="w-full bg-transparent focus:outline-none text-center text-[12px] font-mono text-slate-300 font-medium placeholder-slate-500" 
                        />
                      </td>
                      <td className="px-1 py-2 align-top pt-2.5 min-w-0">
                        <CustomDatePicker value={task.Due} onChange={(v: string) => updateTaskField(task.Name, "Due", v)} placeholder="-" className="w-full" />
                      </td>
                      <td className="px-1 py-2 align-top pt-2.5 min-w-0">
                        <CustomSelect hideArrow={true} value={task.Priority} onChange={(v: string) => updateTaskField(task.Name, "Priority", v)} options={["Urgent", "High", "Medium", "Low"]} getOptionColor={getPriorityColor} className="w-full text-center" />
                      </td>
                      <td className="px-2 py-3 align-top min-w-0">
                        <AutoTextarea value={task.Notes} onChange={(val: string) => updateTaskField(task.Name, "Notes", val)} className="text-slate-400 text-[12px]" />
                      </td>
                      <td className="px-1 py-2 align-top pt-2.5 min-w-0">
                        <CustomSelect hideArrow={true} value={task.Status} onChange={(v: string) => updateTaskField(task.Name, "Status", v)} options={["Active", "Completed"]} getOptionColor={getStatusColor} className="w-full text-center font-bold" />
                      </td>
                      <td className="px-2 py-3 align-top pt-3.5 min-w-0 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-1 justify-end">
                          <button onClick={(e) => { e.stopPropagation(); deleteTask(task.Name); }} className="text-rose-500/70 hover:text-rose-400 text-xs transition-colors" title="Delete permanently">🗑️</button>
                        </div>
                      </td>
                    </tr>
                    
                    {isExpanded && (
                      <tr className="bg-transparent border-b border-slate-800/60 shadow-inner">
                        <td colSpan={13} className="px-12 py-4">
                          <div className="flex flex-col w-full">
                            <div className="flex-1 bg-[#06080c] rounded-lg border border-slate-800/80 p-3 shadow-sm flex flex-col">
                              <div className="flex justify-between items-center mb-2 border-b border-slate-800/50 pb-2">
                                <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Sessions</h3>
                                <div className="flex items-center gap-2">
                                  <button onClick={() => { setAiModalTask(task.Name); setAiPrompt(""); }} className="bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 px-3 py-1 rounded text-[11px] font-bold transition-colors">✨ AI Session Planner</button>
                                  <button onClick={() => addManualSession(task.Name)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded text-[11px] font-bold transition-colors shadow-sm">+ Session</button>
                                </div>
                              </div>
                              
                              <div className="space-y-0">
                                {task.sessions && task.sessions.length > 0 && (
                                  <div className="flex gap-2 text-[10px] uppercase font-bold text-slate-500 tracking-wider px-2 pb-1 border-b border-slate-800/30 mb-1">
                                    <div className="flex-[3] min-w-[120px]">Session Name</div>
                                    <div className="w-[85px] text-center">Date</div>
                                    <div className="w-[60px] text-center">Start</div>
                                    <div className="w-[60px] text-center">End</div>
                                    <div className="w-[60px] text-center">Est.</div>
                                    <div className="w-[70px] text-center">Logged</div>
                                    <div className="flex-[2] min-w-[100px] text-left pl-2">Notes</div>
                                    <div className="w-[85px] text-center">Status</div>
                                    <div className="w-10"></div>
                                  </div>
                                )}
                                
                                {task.sessions && task.sessions.length > 0 ? (
                                  <div className="flex flex-col gap-4">
                                    {upcomingSessions.length > 0 && (
                                      <div>
                                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1 px-2 border-b border-slate-700/50 pb-1">Upcoming</div>
                                        {upcomingSessions.map((sess: any) => (
                                          <React.Fragment key={`upcoming-frag-${sess.originalIdx}`}>
                                            {renderSessionRow(sess)}
                                            {sess.subsessions?.map((sub: any, sIdx: number) => renderSessionRow(sub, true, sIdx, sess.originalIdx))}
                                          </React.Fragment>
                                        ))}
                                      </div>
                                    )}
                                    {todaySessions.length > 0 && (
                                      <div>
                                        <div className="text-[10px] text-indigo-400/80 uppercase font-bold tracking-widest mb-1 px-2 border-b border-indigo-500/20 pb-1 mt-2">Today</div>
                                        {todaySessions.map((sess: any) => (
                                          <React.Fragment key={`today-frag-${sess.originalIdx}`}>
                                            {renderSessionRow(sess)}
                                            {sess.subsessions?.map((sub: any, sIdx: number) => renderSessionRow(sub, true, sIdx, sess.originalIdx))}
                                          </React.Fragment>
                                        ))}
                                      </div>
                                    )}
                                    {pastSessions.length > 0 && (
                                      <div>
                                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1 px-2 border-b border-slate-700/50 pb-1 mt-2">Past</div>
                                        {pastSessions.map((sess: any) => (
                                          <React.Fragment key={`past-frag-${sess.originalIdx}`}>
                                            {renderSessionRow(sess)}
                                            {sess.subsessions?.map((sub: any, sIdx: number) => renderSessionRow(sub, true, sIdx, sess.originalIdx))}
                                          </React.Fragment>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-center py-6 text-slate-600/50 text-[12px] italic">No planned sessions.</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {sortedData.length === 0 && (
                <tr>
                  <td colSpan={13} className="text-center py-12 text-slate-500 italic text-[13px]">
                    No tasks match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= RIGHT SIDEBAR ================= */}
      {showSubtasks && (
        <div className="w-[300px] shrink-0 bg-[#080a0f] flex flex-col border-l border-slate-800/80 shadow-2xl relative z-10">
          <div className="px-4 py-3 border-b border-slate-800/60 flex justify-between items-center bg-[#06080c]">
            <h2 className="text-[12px] font-bold text-slate-300 uppercase tracking-widest">
              Subtasks
            </h2>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
              {activeTask ? (subtaskDict[activeTask] || []).filter((s: any) => !s.done).length : 0}
            </span>
          </div>

          <div className="flex-1 overflow-hidden relative">
            {activeTask ? (() => {
              const currentSubs = (subtaskDict[activeTask] || []).map((sub: any, originalIdx: number) => ({ ...sub, originalIdx }));
              const sortedSubs = [...currentSubs].sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1));

              return (
                <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-3 space-y-1">
                  <div className="mb-4 bg-[#0a0d14] rounded-lg border border-slate-700/50 p-3 shadow-inner">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Task Name</p>
                    <AutoTextarea 
                      value={activeTask} 
                      onChange={(val: string) => {
                        if (val && val.trim() !== "") {
                          updateTaskField(activeTask, "Name", val);
                        }
                      }}
                      className="text-[13px] font-bold text-indigo-300 tracking-wider leading-snug w-full"
                    />
                  </div>
                  
                  <div className="flex gap-2 mb-3">
                    <input 
                      type="text" 
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                      placeholder="Add subtask..."
                      className="flex-1 bg-[#0a0d14] border border-slate-700 rounded px-2.5 py-1.5 text-[12px] text-slate-200 focus:border-indigo-500 focus:outline-none transition-colors"
                    />
                    <button onClick={handleAddSubtask} className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 px-3 rounded font-bold text-[16px] transition-colors pb-0.5">+</button>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-0.5">
                    {sortedSubs.map((sub: any) => (
                      <div 
                        key={`sub-${sub.originalIdx}`} 
                        draggable 
                        onDragStart={(e) => handleSubtaskDragStart(e, sub.originalIdx)}
                        onDragOver={handleRowDragOver}
                        onDrop={(e) => handleSubtaskDrop(e, sub.originalIdx)}
                        className="flex items-start gap-2.5 py-2 px-1 group cursor-grab active:cursor-grabbing hover:bg-white/[0.03] rounded transition-colors text-left"
                      >
                        <input 
                          type="checkbox" 
                          checked={sub.done} 
                          onChange={() => toggleSubtask(sub.originalIdx)} 
                          className="appearance-none w-3.5 h-3.5 bg-transparent border border-slate-600 rounded-sm checked:bg-indigo-500 checked:border-indigo-500 shrink-0 mt-0.5 relative cursor-pointer
                          after:content-[''] after:absolute after:hidden checked:after:block after:w-[3px] after:h-[7px] after:border-r-2 after:border-b-2 after:border-white after:rotate-45 after:left-[4px] after:top-[1px] transition-colors"
                        />
                        <div className="flex-1 min-w-0 pt-[1px] flex flex-col">
                          <AutoTextarea 
                            value={sub.name} 
                            onChange={(val: string) => updateSubtaskName(sub.originalIdx, val)}
                            className={`leading-relaxed ${sub.done ? "text-slate-500/60 line-through" : "text-slate-300"}`}
                          />
                          {getUrl(sub.name) && <a href={getUrl(sub.name)!} target="_blank" rel="noreferrer" title="Open Link" className="text-indigo-400/70 hover:text-indigo-300 text-[10px] shrink-0 mt-1 transition-colors">🔗</a>}
                        </div>
                        <button onClick={() => deleteSubtask(sub.originalIdx)} className="opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 text-xs mt-0.5" title="Delete subtask">🗑️</button>
                        <span className="text-slate-600/50 cursor-grab select-none shrink-0 opacity-0 group-hover:opacity-100 mt-0.5 text-[14px]">⋮⋮</span>
                      </div>
                    ))}
                    {sortedSubs.length === 0 && <p className="text-[12px] text-slate-600 italic py-4 text-center">No subtasks yet.</p>}
                  </div>
                </div>
              );
            })() : (
              <div className="absolute inset-0 flex items-center justify-center p-8 text-center pointer-events-none">
                <p className="text-[13px] text-slate-500/50 italic font-medium leading-relaxed">
                  Select a task to view <br/>or add its subtasks.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
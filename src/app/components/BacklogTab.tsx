"use client";

import React, { useState, useEffect, useRef } from "react";

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
const CustomSelect = ({ value, onChange, options, placeholder, className = "", listClassName = "", hideArrow = false, getOptionColor }: any) => {
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
        className="w-full h-full bg-transparent rounded px-2 py-1.5 text-[13px] cursor-pointer flex justify-between items-center transition-colors outline-none hover:bg-white/[0.04]"
      >
        <span className={`pr-2 text-left whitespace-normal break-words leading-snug ${getOptionColor ? getOptionColor(value) : "text-slate-200"}`}>
          {value || placeholder}
        </span>
        {!hideArrow && <span className="text-[10px] text-slate-500 shrink-0">▼</span>}
      </div>
      {open && (
        <div className={`absolute top-full left-0 mt-1 w-full min-w-[140px] bg-[#0f1115] border border-slate-700/80 rounded shadow-2xl z-[999] max-h-48 overflow-y-auto custom-scrollbar text-left ${listClassName}`}>
          {placeholder && (
            <div onClick={() => { onChange(""); setOpen(false); }} className="p-2 text-[13px] text-slate-500 hover:bg-slate-800/50 cursor-pointer transition-colors italic text-left">
              {placeholder}
            </div>
          )}
          {options.map((opt: string) => (
            <div 
              key={opt} 
              onClick={() => { onChange(opt); setOpen(false); }} 
              className={`p-2 text-[13px] hover:bg-slate-800/80 cursor-pointer transition-colors whitespace-normal break-words leading-snug text-left border-b border-slate-800/30 last:border-0 ${getOptionColor ? getOptionColor(opt) : "text-slate-300"}`}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// === HYBRID DATE PICKER (Allows Typing & Dark Mode Native Picker) ===
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
        className="w-full bg-transparent focus:outline-none text-[12px] font-mono text-slate-300 placeholder-slate-600 text-center relative z-10 px-2 py-1.5" 
      />
      {/* Hidden Dark Mode Date Input */}
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

export default function BacklogTab({ appState, onSave }: { appState: any; onSave: (state: any) => void }) {
  const categories: string[] = appState?.categories || ["Other"];
  const sortedCategories = [...new Set(categories)].sort((a, b) => a.localeCompare(b)); 
  
  const datelessData: any[] = appState?.dateless_data || [];
  const studyData: any[] = appState?.study_data || []; 
  const subtaskDict: any = appState?.subtask_dict || {};

  useEffect(() => {
    const names = datelessData.map((t: any) => t.Name?.trim().toLowerCase() || "");
    const hasDuplicates = new Set(names).size !== names.length;
    if (hasDuplicates) {
      const uniqueTasks = new Map();
      const newDatelessData: any[] = [];
      datelessData.forEach((t: any) => {
        const nameKey = t.Name?.trim().toLowerCase() || "";
        if (uniqueTasks.has(nameKey)) {
          const existing = uniqueTasks.get(nameKey);
          existing["Pomodoros (done)"] = (Number(existing["Pomodoros (done)"]) || 0) + (Number(t["Pomodoros (done)"]) || 0);
        } else {
          const clone = { ...t };
          uniqueTasks.set(nameKey, clone);
          newDatelessData.push(clone);
        }
      });
      onSave({ ...appState, dateless_data: newDatelessData });
    }
  }, [datelessData.length]);

  const activeDatelessData = datelessData.filter((t: any) => t.Status !== "Completed");

  // === UI & MEMORY STATE ===
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string, dir: 'asc'|'desc' } | null>(null);
  const [catFilter, setCatFilter] = useState<string>("All Categories");
  const [showSubtasks, setShowSubtasks] = useState<boolean>(true);

  useEffect(() => {
    const saved = localStorage.getItem("backlogUIState");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.activeTask !== undefined) setActiveTask(p.activeTask);
        if (p.sortConfig !== undefined) setSortConfig(p.sortConfig);
        if (p.catFilter !== undefined) setCatFilter(p.catFilter);
        if (p.showSubtasks !== undefined) setShowSubtasks(p.showSubtasks);
      } catch(e) {}
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("backlogUIState", JSON.stringify({ activeTask, sortConfig, catFilter, showSubtasks }));
  }, [isLoaded, activeTask, sortConfig, catFilter, showSubtasks]);

  const [newSubtask, setNewSubtask] = useState("");
  const [qaName, setQaName] = useState("");
  const [qaCat, setQaCat] = useState(sortedCategories[0] || "Other");
  const [qaDate, setQaDate] = useState("");
  const [qaDue, setQaDue] = useState("");
  const [qaPriority, setQaPriority] = useState("Medium");
  const [qaNotes, setQaNotes] = useState("");

  const [draggedRowTask, setDraggedRowTask] = useState<string | null>(null);
  const [draggedSubtaskIdx, setDraggedSubtaskIdx] = useState<number | null>(null);

  const priorityWeight: Record<string, number> = { "Urgent": 1, "High": 2, "Medium": 3, "Low": 4 };
  const cleanPriority = (pStr: string) => pStr?.replace(/^\d+\s*-\s*/, '') || "Medium";

  // Soft Red coloring for High/Urgent Priorities
  const getPriorityColor = (opt: string) => {
    const cleanOpt = cleanPriority(opt);
    if (cleanOpt === "Urgent") return "text-rose-400 font-bold";
    if (cleanOpt === "High") return "text-rose-400 font-semibold";
    return "text-slate-300";
  };

  // Only color "Completed", leave everything else standard slate
  const getStatusColor = (opt: string) => {
    return opt === "Completed" ? "text-emerald-500" : "text-slate-300";
  };

  const getUrl = (text: string) => {
    const match = text?.match(/(https?:\/\/[^\s]+)/);
    return match ? match[0] : null;
  };

  const handleQuickAdd = () => {
    if (!qaName.trim()) return alert("Task name is required.");
    const existingIdx = datelessData.findIndex((t: any) => t.Name.trim().toLowerCase() === qaName.trim().toLowerCase());
    if (existingIdx >= 0) return alert("A task with this name already exists.");
    
    const newRow = {
      Name: qaName.trim(), Category: qaCat, Date: qaDate.trim(),
      Due: qaDue.trim(), Priority: qaPriority, Notes: qaNotes.trim(), Status: "Active", sessions: []
    };
    onSave({ ...appState, dateless_data: [newRow, ...datelessData] });
    setQaName(""); setQaDate(""); setQaDue(""); setQaNotes("");
  };

  const updateTaskField = (taskName: string, field: string, value: any) => {
    const updated = datelessData.map((t: any) => {
      if (t.Name === taskName) return { ...t, [field]: value };
      return t;
    });
    if (field === "Name" && value !== taskName) {
      const updatedSubDict = { ...subtaskDict };
      updatedSubDict[value] = updatedSubDict[taskName] || [];
      delete updatedSubDict[taskName];
      onSave({ ...appState, dateless_data: updated, subtask_dict: updatedSubDict });
      if (activeTask === taskName) setActiveTask(value);
    } else {
      onSave({ ...appState, dateless_data: updated });
    }
  };

  const deleteTask = (taskName: string) => {
    if (!confirm(`Are you sure you want to delete "${taskName}" permanently?`)) return;
    const updated = datelessData.filter((t: any) => t.Name !== taskName);
    const updatedSubDict = { ...subtaskDict };
    delete updatedSubDict[taskName];
    onSave({ ...appState, dateless_data: updated, subtask_dict: updatedSubDict });
    if (activeTask === taskName) setActiveTask(null);
  };

  const moveToMasterLog = (taskName: string) => {
    const taskIdx = datelessData.findIndex((t: any) => t.Name === taskName);
    if (taskIdx < 0) return;
    
    const taskToMove = datelessData[taskIdx];
    const existingIdx = studyData.findIndex((t: any) => t.Name.trim().toLowerCase() === taskName.trim().toLowerCase());
    
    let newStudyData = [...studyData];
    
    if (existingIdx >= 0) {
      if (!confirm(`A task named "${taskName}" already exists in the Master Log. Merge them together?`)) return;
      newStudyData[existingIdx]["Pomodoros (done)"] = (Number(newStudyData[existingIdx]["Pomodoros (done)"]) || 0) + (Number(taskToMove["Pomodoros (done)"]) || 0);
    } else {
      newStudyData.unshift({ 
        ...taskToMove, 
        sessions: taskToMove.sessions || [], 
        "Est. Time": taskToMove["Est. Time"] || "" 
      });
    }
    
    const newDatelessData = [...datelessData];
    newDatelessData.splice(taskIdx, 1);
    
    onSave({ ...appState, dateless_data: newDatelessData, study_data: newStudyData });
    if (activeTask === taskName) setActiveTask(null);
  };

  const handleSort = (key: string) => {
    if (sortConfig && sortConfig.key === key) {
      if (sortConfig.dir === 'asc') setSortConfig({ key, dir: 'desc' });
      else setSortConfig(null); 
    } else {
      setSortConfig({ key, dir: 'asc' }); 
    }
  };

  const handleRowDragStart = (e: any, taskName: string) => { setDraggedRowTask(taskName); e.dataTransfer.effectAllowed = "move"; };
  const handleRowDragOver = (e: any) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const handleRowDrop = (e: any, targetTaskName: string) => {
    e.preventDefault();
    if (!draggedRowTask || draggedRowTask === targetTaskName) return;
    const newDatelessData = [...datelessData];
    const dragIdx = newDatelessData.findIndex((t: any) => t.Name === draggedRowTask);
    const targetIdx = newDatelessData.findIndex((t: any) => t.Name === targetTaskName);
    if (dragIdx >= 0 && targetIdx >= 0) {
      const [item] = newDatelessData.splice(dragIdx, 1);
      const insertIdx = newDatelessData.findIndex((t: any) => t.Name === targetTaskName);
      newDatelessData.splice(insertIdx, 0, item);
      onSave({ ...appState, dateless_data: newDatelessData });
    }
    setDraggedRowTask(null);
  };

  const handleAddSubtask = () => {
    if (!activeTask || !newSubtask.trim()) return;
    const currentSubs = subtaskDict[activeTask] || [];
    const activeSubs = currentSubs.filter((s: any) => !s.done);
    const doneSubs = currentSubs.filter((s: any) => s.done);
    onSave({ ...appState, subtask_dict: { ...subtaskDict, [activeTask]: [...activeSubs, { name: newSubtask.trim(), done: false }, ...doneSubs] } });
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
    const activeSubs = subs.filter((s: any) => !s.done);
    const doneSubs = subs.filter((s: any) => s.done);
    onSave({ ...appState, subtask_dict: { ...subtaskDict, [activeTask]: [...activeSubs, ...doneSubs] } });
  };
  
  const deleteSubtask = (idx: number) => {
    if (!activeTask || !confirm("Delete this subtask permanently?")) return;
    let subs = [...(subtaskDict[activeTask] || [])];
    subs.splice(idx, 1);
    onSave({ ...appState, subtask_dict: { ...subtaskDict, [activeTask]: subs } });
  };

  const handleSubtaskDragStart = (e: any, idx: number) => { setDraggedSubtaskIdx(idx); e.dataTransfer.effectAllowed = "move"; };
  const handleSubtaskDrop = (e: any, dropIdx: number) => {
    e.preventDefault();
    if (draggedSubtaskIdx === null || draggedSubtaskIdx === dropIdx || !activeTask) return;
    let subs = [...(subtaskDict[activeTask] || [])];
    const [moved] = subs.splice(draggedSubtaskIdx, 1);
    subs.splice(dropIdx, 0, moved);
    onSave({ ...appState, subtask_dict: { ...subtaskDict, [activeTask]: subs } });
    setDraggedSubtaskIdx(null);
  };

  // Filter & Sort
  const filteredData = activeDatelessData.filter((t: any) => catFilter === "All Categories" || t.Category === catFilter);
  const sortedData = [...filteredData].sort((a: any, b: any) => {
    if (!sortConfig) return 0;
    const { key, dir } = sortConfig;
    const modifier = dir === 'asc' ? 1 : -1;
    
    if (key === 'Priority') {
      return (priorityWeight[cleanPriority(a.Priority)] - priorityWeight[cleanPriority(b.Priority)]) * modifier;
    }
    if (key === 'Date' || key === 'Due') {
      const parseDateStr = (dStr: string) => {
        if (!dStr) return 0;
        const parts = dStr.split('/');
        if (parts.length === 3) return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
        return 0;
      };
      return (parseDateStr(a[key]) - parseDateStr(b[key])) * modifier;
    }
    const strA = String(a[key] || '').toLowerCase();
    const strB = String(b[key] || '').toLowerCase();
    if (strA < strB) return -1 * modifier;
    if (strA > strB) return 1 * modifier;
    return 0;
  });

  return (
    <div className="flex w-full text-[13px] text-slate-300 h-full max-h-[85vh] overflow-hidden bg-[#050505]">
      
      {/* ================= MAIN TABLE ================= */}
      <div className="flex-1 min-w-0 flex flex-col h-full bg-transparent border-r border-slate-800/40 relative">
        
        {/* Header & Controls */}
        <div className="flex justify-between items-center shrink-0 px-4 py-3 border-b border-slate-800/60 bg-[#080a0f]">
          <div>
            <h2 className="text-[13px] font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
              Backlog <span className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[10px]">{sortedData.length}</span>
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-48 bg-[#0a0d14] border border-slate-700/80 rounded shadow-sm hover:border-slate-500 transition-colors">
              <CustomSelect value={catFilter} onChange={setCatFilter} options={["All Categories", ...sortedCategories]} />
            </div>
            <button 
              onClick={() => setShowSubtasks(!showSubtasks)}
              className={`text-[12px] px-3 py-1.5 rounded border transition-colors ${showSubtasks ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' : 'bg-[#0a0d14] border-slate-700/80 text-slate-400 hover:text-slate-200 hover:border-slate-500'}`}
            >
              {showSubtasks ? 'Hide Subtasks' : 'Show Subtasks'}
            </button>
          </div>
        </div>

        {/* Normal, Professional Quick Add Bar */}
        <div className="flex flex-wrap items-center gap-3 shrink-0 px-4 py-3 border-b border-slate-800/60 bg-[#06080c] w-full">
          <input type="text" value={qaName} onChange={(e) => setQaName(e.target.value)} placeholder="Task name..." className="flex-[2] min-w-[200px] bg-transparent border border-slate-800 hover:border-slate-700 focus:border-indigo-500/50 rounded-md px-3 py-1.5 text-[13px] text-slate-200 transition-colors outline-none" />
          
          <div className="w-[140px] border border-slate-800 hover:border-slate-700 rounded-md transition-colors">
            <CustomSelect value={qaCat} onChange={setQaCat} options={sortedCategories} placeholder="Category" />
          </div>
          
          <div className="w-[110px] border border-slate-800 hover:border-slate-700 rounded-md">
            <CustomDatePicker value={qaDate} onChange={setQaDate} placeholder="Date" />
          </div>
          
          <div className="w-[110px] border border-slate-800 hover:border-slate-700 rounded-md">
            <CustomDatePicker value={qaDue} onChange={setQaDue} placeholder="Due" />
          </div>

          <div className="w-[120px] border border-slate-800 hover:border-slate-700 rounded-md transition-colors">
            <CustomSelect value={qaPriority} onChange={setQaPriority} options={["Urgent", "High", "Medium", "Low"]} placeholder="Priority" getOptionColor={getPriorityColor} />
          </div>

          <input type="text" value={qaNotes} onChange={(e) => setQaNotes(e.target.value)} placeholder="Notes..." className="flex-[3] min-w-[200px] bg-transparent border border-slate-800 hover:border-slate-700 focus:border-indigo-500/50 rounded-md px-3 py-1.5 text-[13px] text-slate-200 transition-colors outline-none" />
          
          <button onClick={handleQuickAdd} className="bg-pink-300 hover:bg-pink-200 text-neutral-900 px-5 py-1.5 rounded-md text-[13px] font-bold transition-colors outline-none shadow-md">Add</button>
        </div>

        {/* Seamless Grid Area */}
        <div className="flex-1 overflow-auto custom-scrollbar pb-20">
          <table className="w-full text-left whitespace-nowrap min-w-[950px] table-fixed">
            <thead className="bg-[#050505] sticky top-0 z-10 shadow-sm border-b border-slate-800/80">
              <tr className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <th onClick={() => handleSort('Name')} className="px-4 py-3 text-left w-[34%] cursor-pointer hover:text-slate-300 select-none">Name {sortConfig?.key === 'Name' ? (sortConfig.dir === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('Category')} className="px-2 py-3 text-left w-[14%] cursor-pointer hover:text-slate-300 select-none">Category {sortConfig?.key === 'Category' ? (sortConfig.dir === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('Date')} className="px-2 py-3 text-center w-[6%] cursor-pointer hover:text-slate-300 select-none">Date {sortConfig?.key === 'Date' ? (sortConfig.dir === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('Due')} className="px-2 py-3 text-center w-[6%] cursor-pointer hover:text-slate-300 select-none">Due {sortConfig?.key === 'Due' ? (sortConfig.dir === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('Priority')} className="px-2 py-3 text-left w-[8%] cursor-pointer hover:text-slate-300 select-none">Priority {sortConfig?.key === 'Priority' ? (sortConfig.dir === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('Notes')} className="px-2 py-3 text-left w-[24%] cursor-pointer hover:text-slate-300 select-none">Notes {sortConfig?.key === 'Notes' ? (sortConfig.dir === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('Status')} className="px-2 py-3 text-left w-[6%] select-none">Status</th>
                <th className="px-4 py-3 text-right w-[2%] select-none"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-left">
              {sortedData.map((task: any, idx: number) => {
                const cPriority = cleanPriority(task.Priority);
                const isActive = activeTask === task.Name;

                return (
                  <tr 
                    key={`row-main-${idx}`} 
                    draggable 
                    onDragStart={(e) => handleRowDragStart(e, task.Name)} 
                    onDragOver={handleRowDragOver} 
                    onDrop={(e) => handleRowDrop(e, task.Name)} 
                    onClick={() => setActiveTask(isActive ? null : task.Name)} 
                    className={`transition-colors cursor-pointer group ${isActive ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"}`}
                  >
                    <td className="px-4 py-3 align-top min-w-0">
                      <AutoTextarea 
                        value={task.Name} 
                        onChange={(val: string) => updateTaskField(task.Name, "Name", val)}
                        className={isActive ? 'text-indigo-200' : 'text-slate-200'}
                      />
                    </td>
                    
                    <td className="px-2 py-2 align-top pt-2.5 min-w-0">
                      <CustomSelect hideArrow={true} value={task.Category} onChange={(v: string) => updateTaskField(task.Name, "Category", v)} options={sortedCategories} className="w-full" />
                    </td>
                    
                    <td className="px-2 py-2 align-top pt-2.5 min-w-0">
                      <CustomDatePicker value={task.Date} onChange={(v: string) => updateTaskField(task.Name, "Date", v)} placeholder="-" className="w-full" />
                    </td>
                    
                    <td className="px-2 py-2 align-top pt-2.5 min-w-0">
                      <CustomDatePicker value={task.Due} onChange={(v: string) => updateTaskField(task.Name, "Due", v)} placeholder="-" className="w-full" />
                    </td>
                    
                    <td className="px-2 py-2 align-top pt-2.5 min-w-0">
                      <CustomSelect hideArrow={true} value={cPriority} onChange={(v: string) => updateTaskField(task.Name, "Priority", v)} options={["Urgent", "High", "Medium", "Low"]} getOptionColor={getPriorityColor} className="w-full" />
                    </td>
                    
                    <td className="px-2 py-3 align-top pr-4 min-w-0">
                      <div className="flex items-start gap-1 w-full min-w-0">
                        <AutoTextarea 
                          value={task.Notes || ""} 
                          onChange={(val: string) => updateTaskField(task.Name, "Notes", val)}
                          placeholder="-"
                          className="text-slate-400/80 text-[12px]"
                        />
                        {getUrl(task.Notes) && <a href={getUrl(task.Notes)!} target="_blank" rel="noreferrer" title="Open Link" className="text-indigo-400 hover:text-indigo-300 text-[10px] shrink-0 mt-1">🔗</a>}
                      </div>
                    </td>
                    
                    <td className="px-2 py-2 align-top pt-2.5 min-w-0">
                       <CustomSelect hideArrow={true} value={task.Status} onChange={(v: string) => updateTaskField(task.Name, "Status", v)} options={["Active", "Completed"]} getOptionColor={getStatusColor} className="w-full text-[12px]" />
                    </td>
                    
                    <td className="px-4 py-2 align-top pt-3 min-w-0">
                      <div className="flex items-center justify-end gap-3 w-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); moveToMasterLog(task.Name); }} className="text-slate-500 hover:text-indigo-400 transition-colors text-[16px] leading-none" title="Move to Master Log">↗</button>
                        <button onClick={(e) => { e.stopPropagation(); deleteTask(task.Name); }} className="hover:scale-110 transition-transform text-[14px] leading-none" title="Delete permanently">🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {sortedData.length === 0 && <tr><td colSpan={8} className="text-left py-16 px-4 text-slate-500/50 text-[13px] italic font-light tracking-wide">No tasks matched your criteria.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= COLLAPSIBLE SUBTASK PANEL ================= */}
      {showSubtasks && (
        <div className="w-[320px] shrink-0 flex flex-col h-full bg-[#080B10] border-l border-slate-800 shadow-2xl transition-all duration-300 ease-in-out">
          
          <div className="px-5 py-4 border-b border-slate-800/80 bg-transparent shrink-0 flex justify-between items-center">
            <h2 className="text-[11px] font-bold text-slate-200 uppercase tracking-widest">Subtasks</h2>
            <button onClick={() => setShowSubtasks(false)} className="text-slate-500 hover:text-slate-300 xl:hidden">✕</button>
          </div>

          <div className="flex-1 flex flex-col min-h-0 relative p-4">
            {activeTask ? (
              <>
                <div className="mb-5 shrink-0 border-b border-slate-800 pb-1">
                  <AutoTextarea 
                    value={activeTask} 
                    onChange={(val: string) => updateTaskField(activeTask, "Name", val)}
                    className="text-slate-200 font-semibold text-[14px] leading-snug"
                  />
                </div>
                
                <div className="flex gap-2 mb-4 shrink-0 bg-[#0f121a] border border-slate-800/80 rounded px-2 py-1.5 focus-within:border-indigo-500/50 transition-colors">
                  <input type="text" value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()} placeholder="Add a subtask..." className="flex-1 bg-transparent text-[13px] text-slate-300 focus:outline-none placeholder-slate-600" />
                  <button onClick={handleAddSubtask} className="text-slate-500 hover:text-indigo-400 font-medium transition-colors outline-none px-1">↵</button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-0.5">
                  {(subtaskDict[activeTask] || []).map((sub: any, idx: number) => (
                    <div key={`sub-${idx}`} draggable onDragStart={(e) => handleSubtaskDragStart(e, idx)} onDragOver={handleRowDragOver} onDrop={(e) => handleSubtaskDrop(e, idx)} className="flex items-start gap-2.5 py-2 px-1 group cursor-grab active:cursor-grabbing hover:bg-white/[0.03] rounded transition-colors text-left">
                      <input type="checkbox" checked={sub.done} onChange={() => toggleSubtask(idx)} className="appearance-none w-3.5 h-3.5 bg-transparent border border-slate-600 rounded-sm checked:bg-indigo-500 checked:border-indigo-500 cursor-pointer shrink-0 mt-[3px] flex items-center justify-center after:content-['✓'] after:text-white after:text-[10px] after:font-bold after:opacity-0 checked:after:opacity-100 transition-all" />
                      <div className="flex-1 flex items-start gap-2 min-w-0">
                        <AutoTextarea 
                          value={sub.name} 
                          onChange={(val: string) => updateSubtaskName(idx, val)}
                          className={`leading-relaxed ${sub.done ? "text-slate-500/60 line-through" : "text-slate-300"}`}
                        />
                        {getUrl(sub.name) && <a href={getUrl(sub.name)!} target="_blank" rel="noreferrer" title="Open Link" className="text-indigo-400/70 hover:text-indigo-300 text-[10px] shrink-0 mt-1 transition-colors">🔗</a>}
                      </div>
                      <button onClick={() => deleteSubtask(idx)} className="opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 text-[12px] mt-0.5" title="Delete subtask">🗑️</button>
                      <span className="text-slate-600/50 cursor-grab select-none shrink-0 opacity-0 group-hover:opacity-100 mt-0.5 text-[14px]">⋮⋮</span>
                    </div>
                  ))}
                  {(subtaskDict[activeTask] || []).length === 0 && <p className="text-[12px] text-slate-600 italic py-4 text-center">No subtasks yet.</p>}
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center p-8 text-center pointer-events-none">
                <p className="text-[13px] text-slate-500/50 italic font-light tracking-wide leading-relaxed">
                  Select a task row to manage its subtasks.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
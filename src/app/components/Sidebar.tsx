"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';

// Sleek Expander Component
const Expander = ({ title, children, defaultOpen = false }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-neutral-800/60 rounded-xl overflow-hidden mb-4 bg-neutral-900/20 shadow-sm transition-all">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex justify-between items-center p-3.5 text-sm font-bold text-neutral-300 hover:bg-neutral-800/40 hover:text-neutral-100 transition-colors outline-none"
      >
        <span className="tracking-wide text-sm">{title}</span>
        <span className="text-neutral-500 text-[10px] transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
      </button>
      {isOpen && <div className="p-4 border-t border-neutral-800/60 bg-neutral-900/10">{children}</div>}
    </div>
  );
};

export default function Sidebar({ 
  isOpen, 
  onClose, 
  appState, 
  onSave, 
  onLogout, 
  userEmail 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  appState: any, 
  onSave: (state: any) => void, 
  onLogout: () => void, 
  userEmail?: string 
}) {
  
  // -- HELPERS for Time Formatting --
  const minsToStr = (m: number) => {
    if (!m || m <= 0 || isNaN(m)) return "0m";
    const h = Math.floor(m / 60);
    const min = Math.round(m % 60);
    if (h === 0) return `${min}m`;
    if (min === 0) return `${h}h`;
    return `${h}h ${min}m`;
  };

  const parseTimeStr = (t: string) => {
    if (!t) return 0;
    let m = 0;
    const hMatch = String(t).match(/(\d+(?:\.\d+)?)\s*h/i);
    const mMatch = String(t).match(/(\d+(?:\.\d+)?)\s*m/i);
    if (hMatch) m += parseFloat(hMatch[1]) * 60;
    if (mMatch) m += parseFloat(mMatch[1]);
    return m;
  };

  // Robust DD/MM/YYYY parser for flawless sorting
  const parseDateDDMMYYYY = (dStr: string) => {
    if (!dStr) return 0;
    const parts = dStr.split(/[\/\-\.]/);
    if (parts.length >= 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      let y = parseInt(parts[2], 10);
      if (y < 100) y += 2000;
      return new Date(y, m, d).getTime();
    }
    return 0;
  };

  // -- POMODORO SETTINGS --
  const [pomoSettings, setPomoSettings] = useState({ work: 25, break: 5, longBreak: 15, interval: 4 });

  useEffect(() => {
    const saved = localStorage.getItem("pomoSettings");
    if (saved) setPomoSettings(JSON.parse(saved));
  }, []);

  const updatePomo = (key: string, val: number) => {
    const newSettings = { ...pomoSettings, [key]: val };
    setPomoSettings(newSettings);
    localStorage.setItem("pomoSettings", JSON.stringify(newSettings));
  };

  // -- CATEGORY MANAGEMENT --
  const [newCat, setNewCat] = useState("");
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editCatValue, setEditCatValue] = useState("");
  const categories = appState?.categories || ["Other"];

  const addCategory = () => {
    if (!newCat.trim() || categories.includes(newCat.trim())) return;
    onSave({ ...appState, categories: [...categories, newCat.trim()] });
    setNewCat("");
  };

  const startEditCategory = (cat: string) => {
    setEditingCat(cat);
    setEditCatValue(cat);
  };

  const saveCategoryEdit = (oldCat: string) => {
    const trimmed = editCatValue.trim();
    if (!trimmed || trimmed === oldCat || categories.includes(trimmed)) {
      setEditingCat(null);
      return;
    }
    
    const newCats = categories.map((c: string) => c === oldCat ? trimmed : c);
    const updateTasks = (tasks: any[]) => tasks.map(t => t.Category === oldCat ? { ...t, Category: trimmed } : t);

    onSave({ 
      ...appState, 
      categories: newCats,
      study_data: updateTasks(appState.study_data || []),
      dateless_data: updateTasks(appState.dateless_data || [])
    });
    setEditingCat(null);
  };

  const deleteCategory = (cat: string) => {
    if (cat === "Other") return alert("Cannot delete 'Other' category.");
    if (!window.confirm(`Are you sure you want to delete "${cat}"? Tasks in this category will be safely moved to 'Other'.`)) return;

    const newCats = categories.filter((c: string) => c !== cat);
    const updateTasks = (tasks: any[]) => tasks.map(t => t.Category === cat ? { ...t, Category: "Other" } : t);

    onSave({ 
      ...appState, 
      categories: newCats,
      study_data: updateTasks(appState.study_data || []),
      dateless_data: updateTasks(appState.dateless_data || [])
    });
  };

  // -- COMPLETED TASKS LOGIC --
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [expandedCompletedTask, setExpandedCompletedTask] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{key: string, dir: number}>({ key: '', dir: 0 });

  // Edit Mode States
  const [editingTaskName, setEditingTaskName] = useState<string | null>(null);
  const [editFields, setEditFields] = useState({ name: "", date: "", est: "" });

  const [editingSub, setEditingSub] = useState<string | null>(null);
  const [editSubValue, setEditSubValue] = useState("");

  const [editingSess, setEditingSess] = useState<string | null>(null);
  const [editSessValue, setEditSessValue] = useState("");

  const allTasks = [...(appState?.study_data || []), ...(appState?.dateless_data || [])];
  const completedTasks = allTasks.filter(t => t.Status === "Completed" || t.status === "Completed");

  // Filtering
  const filteredCompleted = completedTasks.filter(t => 
    (filterCat === "All" || t.Category === filterCat) &&
    (t.Name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     t.Category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     t.Date?.includes(searchTerm))
  );

  // Sorting
  const sortedCompleted = useMemo(() => {
    let sorted = [...filteredCompleted];
    if (sortConfig.key && sortConfig.dir !== 0) {
      sorted.sort((a, b) => {
        if (sortConfig.key === 'name') {
          return (a.Name || '').localeCompare(b.Name || '') * sortConfig.dir;
        }
        if (sortConfig.key === 'date') {
          const dateA = parseDateDDMMYYYY(a.Date || a["Due Date"] || "");
          const dateB = parseDateDDMMYYYY(b.Date || b["Due Date"] || "");
          return (dateA - dateB) * sortConfig.dir;
        }
        if (sortConfig.key === 'log') {
          let aLog = (Number(a["Pomodoros (done)"]) || 0) * 25;
          (a.sessions || []).forEach((s: any) => aLog += (Number(s.time_logged) || 0));
         
          let bLog = (Number(b["Pomodoros (done)"]) || 0) * 25;
          (b.sessions || []).forEach((s: any) => bLog += (Number(s.time_logged) || 0));
          return (aLog - bLog) * sortConfig.dir;
        }
        return 0;
      });
    }
    return sorted;
  }, [filteredCompleted, sortConfig]);

  // 3-way sort toggle (Ascending -> Descending -> Off)
  const requestSort = (key: string) => {
    if (sortConfig.key === key) {
      if (sortConfig.dir === 1) setSortConfig({ key, dir: -1 });
      else if (sortConfig.dir === -1) setSortConfig({ key: '', dir: 0 }); // Turn off sort
    } else {
      setSortConfig({ key, dir: 1 });
    }
  };

  // Close custom dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setCatDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Actions
  const restoreTask = (taskName: string) => {
    const updateArr = (arr: any[]) => arr.map(t => t.Name === taskName ? { ...t, Status: "Active", status: "Active" } : t);
    onSave({
      ...appState,
      study_data: updateArr(appState?.study_data || []),
      dateless_data: updateArr(appState?.dateless_data || [])
    });
  };

  const deleteTask = (taskName: string) => {
    if (!window.confirm(`Permanently delete "${taskName}"? This action cannot be undone.`)) return;
    onSave({
      ...appState,
      study_data: (appState?.study_data || []).filter((t: any) => t.Name !== taskName),
      dateless_data: (appState?.dateless_data || []).filter((t: any) => t.Name !== taskName)
    });
  };

  const startEditTask = (task: any) => {
    setEditingTaskName(task.Name);
    setEditFields({
      name: task.Name || "",
      date: task.Date || task["Due Date"] || "",
      est: task["Est. Time"] || task.est_time || ""
    });
  };

  const saveTaskEdit = (oldName: string) => {
    if (!editFields.name.trim()) return alert("Name cannot be empty.");

    let updatedSubtasks = { ...(appState.subtask_dict || {}) };
    if (oldName !== editFields.name.trim() && updatedSubtasks[oldName]) {
      updatedSubtasks[editFields.name.trim()] = updatedSubtasks[oldName];
      delete updatedSubtasks[oldName];
    }

    const updateArr = (arr: any[]) => arr.map(t => 
      t.Name === oldName 
        ? { ...t, Name: editFields.name.trim(), Date: editFields.date.trim(), "Est. Time": editFields.est.trim() }
        : t
    );

    onSave({
      ...appState,
      study_data: updateArr(appState?.study_data || []),
      dateless_data: updateArr(appState?.dateless_data || []),
      subtask_dict: updatedSubtasks
    });
    setEditingTaskName(null);
  };

  const saveSubtaskEdit = (taskName: string, subIdx: number) => {
    const currentSubtasks = [...(appState?.subtask_dict?.[taskName] || [])];
    currentSubtasks[subIdx].name = editSubValue.trim();
    onSave({ ...appState, subtask_dict: { ...appState.subtask_dict, [taskName]: currentSubtasks } });
    setEditingSub(null);
  };

  const saveSessionEdit = (taskName: string, sessIdx: number) => {
    const updateArr = (arr: any[]) => arr.map(t => {
      if (t.Name === taskName) {
        const newSessions = [...(t.sessions || [])];
        newSessions[sessIdx].name = editSessValue.trim();
        return { ...t, sessions: newSessions };
      }
      return t;
    });

    onSave({
      ...appState,
      study_data: updateArr(appState?.study_data || []),
      dateless_data: updateArr(appState?.dateless_data || [])
    });
    setEditingSess(null);
  };

  // -- IMPORT / EXPORT --
  const handleExport = () => {
    const headers = ["Name", "Category", "Date", "Status", "Priority", "Due Date", "Time Logged", "Pomodoros"];
    const rows = allTasks.map(t => [
      `"${t.Name || ''}"`, `"${t.Category || ''}"`, `"${t.Date || ''}"`, `"${t.Status || ''}"`, 
      `"${t.Priority || ''}"`, `"${t.Due || t["Due Date"] || ''}"`, `"${t["Time Logged"] || t.sessions?.reduce((acc: number, s:any) => acc + (Number(s.time_logged) || 0), 0) || 0}"`, `"${t["Pomodoros (done)"] || 0}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `study_tracker_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim() !== '');
      if (lines.length < 2) return alert("Invalid CSV file.");

      const newStudyData = [...(appState?.study_data || [])];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
        if (cols.length >= 4) {
          newStudyData.push({
            Name: cols[0], Category: cols[1], Date: cols[2], Status: cols[3], Priority: cols[4] || "Medium",
            Due: cols[5] || "", "Pomodoros (done)": Number(cols[7]) || 0, sessions: []
          });
        }
      }
      onSave({ ...appState, study_data: newStudyData });
      alert("Data imported successfully!");
    };
    reader.readAsText(file);
  };

  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      {/* Overlay Background */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/70 z-[90] backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <div className={`fixed top-0 left-0 h-full w-full sm:w-[520px] bg-[#050505] border-r border-neutral-800 z-[100] transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-neutral-800/80 bg-transparent">
          <h2 className="text-lg font-bold text-neutral-200 tracking-wide">Menu</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300 text-2xl font-light leading-none transition-colors outline-none">×</button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2">
          
          <Expander title="Pomodoro Settings">
            <div className="space-y-4">
              {[
                { label: "Work Duration (min)", key: "work", val: pomoSettings.work },
                { label: "Short Break (min)", key: "break", val: pomoSettings.break },
                { label: "Long Break (min)", key: "longBreak", val: pomoSettings.longBreak },
                { label: "Pomodoros before Long Break", key: "interval", val: pomoSettings.interval },
              ].map(setting => (
                <div key={setting.key} className="flex justify-between items-center">
                  <label className="text-sm text-neutral-400 font-medium">{setting.label}</label>
                  <input 
                    type="number" min="1" max="120"
                    value={setting.val}
                    onChange={(e) => updatePomo(setting.key, Number(e.target.value))}
                    className="w-16 bg-neutral-900/50 border border-neutral-800 rounded-lg p-1.5 text-center text-neutral-200 text-sm focus:border-neutral-600 outline-none transition-colors"
                  />
                </div>
              ))}
            </div>
          </Expander>

          <Expander title="Manage Categories">
            <div className="flex gap-2 mb-4">
              <input 
                type="text" value={newCat} onChange={e => setNewCat(e.target.value)}
                placeholder="New category..." 
                className="flex-1 bg-neutral-900/50 border border-neutral-800 rounded-lg p-2.5 text-sm text-neutral-200 focus:border-neutral-600 outline-none transition-colors"
              />
              <button onClick={addCategory} className="bg-neutral-800 hover:bg-neutral-700 px-5 rounded-lg text-sm font-semibold text-neutral-200 transition-colors outline-none">Add</button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {[...categories].sort((a, b) => a.localeCompare(b)).map((c: string) => (
                <div key={c} className="flex justify-between items-center p-2.5 border border-neutral-800/80 rounded-lg bg-neutral-900/30 hover:bg-neutral-900/50 transition-colors group">
                  {editingCat === c ? (
                    <div className="flex flex-1 gap-2 mr-2">
                      <input 
                        type="text" autoFocus
                        value={editCatValue} onChange={e => setEditCatValue(e.target.value)}
                        className="flex-1 bg-neutral-950 border border-neutral-700 rounded p-1 text-sm text-neutral-200 outline-none"
                      />
                      <button onClick={() => saveCategoryEdit(c)} className="text-xs font-bold text-emerald-500 hover:text-emerald-400 outline-none">Save</button>
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-neutral-300 truncate pr-2">{c}</span>
                  )}
                  
                  {c !== "Other" && editingCat !== c && (
                    <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEditCategory(c)} className="text-neutral-500 hover:text-neutral-300 transition-colors outline-none" title="Edit">✎</button>
                      <button onClick={() => deleteCategory(c)} className="text-neutral-500 hover:text-rose-500 text-lg leading-none transition-colors outline-none" title="Delete">×</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Expander>

          <Expander title="Completed Tasks Log">
            <div className="flex gap-2 mb-3">
              <input 
                type="text" 
                placeholder="Search completed tasks..." 
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="flex-[2] bg-neutral-900/50 border border-neutral-800 rounded-lg p-2.5 text-sm text-neutral-200 focus:border-neutral-600 outline-none transition-colors"
              />
              
              {/* Custom Clean Dropdown */}
              <div className="relative flex-[1]" ref={dropdownRef}>
                <div 
                  onClick={() => setCatDropdownOpen(!catDropdownOpen)}
                  className="w-full h-full bg-neutral-900/50 border border-neutral-800 rounded-lg p-2.5 text-sm text-neutral-400 cursor-pointer flex justify-between items-center outline-none hover:border-neutral-600 transition-colors"
                >
                  <span className="truncate pr-1">{filterCat === "All" ? "All categories" : filterCat}</span>
                  <span className="text-[10px] text-neutral-500 shrink-0">▼</span>
                </div>
                
                {catDropdownOpen && (
                  <div className="absolute top-full right-0 mt-1.5 w-full bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto custom-scrollbar">
                    <div 
                      onClick={() => { setFilterCat("All"); setCatDropdownOpen(false); }} 
                      className="p-2.5 text-sm text-neutral-500 italic hover:bg-neutral-800 cursor-pointer transition-colors"
                    >
                      All categories
                    </div>
                    {[...categories].sort((a, b) => a.localeCompare(b)).map((c: string) => (
                      <div 
                        key={c}
                        onClick={() => { setFilterCat(c); setCatDropdownOpen(false); }} 
                        className="p-2.5 text-sm text-neutral-300 font-medium hover:bg-neutral-800 cursor-pointer transition-colors"
                      >
                        {c}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="h-[500px] overflow-auto border border-neutral-800/80 rounded-xl custom-scrollbar bg-neutral-900/20">
              <table className="w-full text-left text-[11px] text-neutral-400 border-collapse table-fixed">
                <thead className="sticky top-0 bg-neutral-900/90 backdrop-blur-md text-neutral-300 shadow-sm z-10">
                  <tr>
                    <th className="w-8 border-b border-neutral-800"></th>
                    <th className="p-2.5 border-b border-neutral-800 font-semibold cursor-pointer hover:text-white w-2/5 select-none transition-colors" onClick={() => requestSort('name')}>
                      Name {sortConfig.key === 'name' ? (sortConfig.dir === 1 ? '↓' : sortConfig.dir === -1 ? '↑' : '') : ''}
                    </th>
                    <th className="p-2.5 border-b border-neutral-800 font-semibold cursor-pointer hover:text-white select-none transition-colors" onClick={() => requestSort('date')}>
                      Date {sortConfig.key === 'date' ? (sortConfig.dir === 1 ? '↓' : sortConfig.dir === -1 ? '↑' : '') : ''}
                    </th>
                    <th className="p-2.5 border-b border-neutral-800 font-semibold cursor-pointer hover:text-white text-right select-none transition-colors" onClick={() => requestSort('log')}>
                      Log (Est) {sortConfig.key === 'log' ? (sortConfig.dir === 1 ? '↓' : sortConfig.dir === -1 ? '↑' : '') : ''}
                    </th>
                    <th className="w-16 p-2.5 border-b border-neutral-800 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCompleted.length > 0 ? sortedCompleted.map((t, i) => {
                    let logMins = (Number(t["Pomodoros (done)"]) || 0) * 25;
                    (t.sessions || []).forEach((s: any) => logMins += (Number(s.time_logged) || 0));
                    const loggedText = logMins > 0 ? minsToStr(logMins) : "-";
                    
                    const estMins = parseTimeStr(t["Est. Time"]);
                    const estText = estMins > 0 ? minsToStr(estMins) : "-";
                    
                    const isExpanded = expandedCompletedTask === t.Name;
                    const isEditing = editingTaskName === t.Name;
                    
                    const taskSessions = t.sessions || [];
                    const taskSubtasks = appState?.subtask_dict?.[t.Name] || [];

                    return (
                      <React.Fragment key={i}>
                        <tr 
                          onClick={() => { if (!isEditing) setExpandedCompletedTask(isExpanded ? null : t.Name); }}
                          className="hover:bg-neutral-800/40 border-b border-neutral-800/50 transition-colors cursor-pointer group"
                        >
                          <td className="p-2 text-center text-neutral-600 text-[10px] transition-transform">{isExpanded ? "▼" : "▶"}</td>
                          
                          {/* NAME & CATEGORY */}
                          <td className="p-2.5">
                            {isEditing ? (
                              <input 
                                autoFocus
                                value={editFields.name} onChange={e => setEditFields({...editFields, name: e.target.value})}
                                className="w-full bg-neutral-950 border border-neutral-700 rounded px-1.5 py-0.5 text-neutral-200 outline-none mb-1"
                              />
                            ) : (
                              <div className="font-semibold text-neutral-300 break-words whitespace-normal leading-tight">{t.Name}</div>
                            )}
                            <div className="text-[9px] text-neutral-500 mt-1 tracking-wider font-bold">{t.Category}</div>
                          </td>

                          {/* DATE */}
                          <td className="p-2.5 whitespace-nowrap">
                            {isEditing ? (
                              <input 
                                value={editFields.date} onChange={e => setEditFields({...editFields, date: e.target.value})}
                                className="w-[70px] bg-neutral-950 border border-neutral-700 rounded px-1.5 py-0.5 text-neutral-200 outline-none"
                                placeholder="dd/mm/yyyy"
                              />
                            ) : (
                              <span className="text-neutral-400 font-medium">{t.Date || t["Due Date"] || "Dateless"}</span>
                            )}
                          </td>

                          {/* LOG (EST) */}
                          <td className="p-2.5 text-right whitespace-nowrap">
                            {isEditing ? (
                              <div className="flex justify-end gap-1 items-center">
                                <span className="text-emerald-500 text-[10px] font-medium">{loggedText} /</span>
                                <input 
                                  value={editFields.est} onChange={e => setEditFields({...editFields, est: e.target.value})}
                                  className="w-[45px] bg-neutral-950 border border-neutral-700 rounded px-1.5 py-0.5 text-neutral-200 outline-none text-right"
                                  placeholder="e.g. 2h"
                                />
                              </div>
                            ) : (
                              <>
                                <span className="text-emerald-500 font-medium">{loggedText}</span>
                                <span className="text-neutral-600 mx-1">/</span>
                                <span>{estText}</span>
                              </>
                            )}
                          </td>

                          {/* ACTIONS */}
                          <td className="p-2.5 text-right whitespace-nowrap">
                            {isEditing ? (
                              <div className="flex justify-end gap-2">
                                <button onClick={(e) => { e.stopPropagation(); saveTaskEdit(t.Name); }} className="text-emerald-500 hover:text-emerald-400 font-bold text-sm" title="Save">✓</button>
                                <button onClick={(e) => { e.stopPropagation(); setEditingTaskName(null); }} className="text-rose-500 hover:text-rose-400 font-bold text-sm" title="Cancel">✕</button>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); startEditTask(t); }} className="text-neutral-500 hover:text-white transition-colors" title="Edit">✎</button>
                                <button onClick={(e) => { e.stopPropagation(); restoreTask(t.Name); }} className="text-neutral-500 hover:text-indigo-400 transition-colors" title="Restore to Master Log">⟲</button>
                                <button onClick={(e) => { e.stopPropagation(); deleteTask(t.Name); }} className="text-neutral-500 hover:text-rose-500 transition-colors" title="Delete Permanently">🗑</button>
                              </div>
                            )}
                          </td>
                        </tr>

                        {/* Expandable Sub-panel */}
                        {isExpanded && !isEditing && (
                          <tr className="bg-[#050505] border-b border-neutral-800/40">
                            <td colSpan={5} className="p-4 pl-10">
                              
                              {taskSessions.length > 0 && (
                                <div className="mb-3">
                                  <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Study Sessions</p>
                                  {taskSessions.map((s: any, idx: number) => {
                                    const sessId = `${t.Name}-${idx}`;
                                    const isEditingSess = editingSess === sessId;
                                    return (
                                      <div key={idx} className="flex justify-between items-center text-[10px] text-neutral-400 bg-neutral-900/50 p-2 rounded-lg mb-1 border border-neutral-800/80 group/sess transition-colors hover:bg-neutral-800/50">
                                        {isEditingSess ? (
                                          <div className="flex flex-1 gap-2 mr-2">
                                            <input 
                                              autoFocus value={editSessValue} onChange={e => setEditSessValue(e.target.value)}
                                              className="flex-1 bg-neutral-950 border border-neutral-700 rounded px-1.5 py-0.5 text-neutral-200 outline-none"
                                            />
                                            <button onClick={() => saveSessionEdit(t.Name, idx)} className="text-emerald-500 font-bold">✓</button>
                                            <button onClick={() => setEditingSess(null)} className="text-rose-500 font-bold">✕</button>
                                          </div>
                                        ) : (
                                          <>
                                            <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                                              <span className="break-words whitespace-normal leading-tight font-medium text-neutral-300">{s.name}</span>
                                              <button onClick={() => { setEditingSess(sessId); setEditSessValue(s.name); }} className="text-neutral-500 hover:text-white opacity-0 group-hover/sess:opacity-100 transition-opacity shrink-0">✎</button>
                                            </div>
                                            <div className="flex gap-3 text-right shrink-0">
                                              <span className="whitespace-nowrap">{s.date}</span>
                                              <span className="text-emerald-500 font-medium w-10 text-right">{minsToStr(Number(s.time_logged))}</span>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {taskSubtasks.length > 0 && (
                                <div>
                                  <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Subtasks</p>
                                  {taskSubtasks.map((sub: any, idx: number) => {
                                    const subId = `${t.Name}-${idx}`;
                                    const isEditingSub = editingSub === subId;
                                    return (
                                      <div key={idx} className="flex items-center gap-2 text-[10px] text-neutral-400 bg-neutral-900/50 p-2 rounded-lg mb-1 border border-neutral-800/80 group/sub transition-colors hover:bg-neutral-800/50">
                                        {isEditingSub ? (
                                          <div className="flex w-full gap-2 items-center">
                                            <input 
                                              autoFocus value={editSubValue} onChange={e => setEditSubValue(e.target.value)}
                                              className="flex-1 bg-neutral-950 border border-neutral-700 rounded px-1.5 py-0.5 text-neutral-200 outline-none"
                                            />
                                            <button onClick={() => saveSubtaskEdit(t.Name, idx)} className="text-emerald-500 font-bold">✓</button>
                                            <button onClick={() => setEditingSub(null)} className="text-rose-500 font-bold">✕</button>
                                          </div>
                                        ) : (
                                          <>
                                            <span className={`text-[10px] shrink-0 font-bold ${sub.done ? "text-emerald-500" : "text-neutral-600"}`}>
                                              {sub.done ? '✓' : '○'}
                                            </span>
                                            <span className={`break-words whitespace-normal flex-1 font-medium ${sub.done ? 'line-through text-neutral-500' : 'text-neutral-300'}`}>{sub.name}</span>
                                            <button onClick={() => { setEditingSub(subId); setEditSubValue(sub.name); }} className="text-neutral-500 hover:text-white opacity-0 group-hover/sub:opacity-100 transition-opacity shrink-0">✎</button>
                                          </>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {taskSessions.length === 0 && taskSubtasks.length === 0 && (
                                <p className="text-[10px] text-neutral-600 italic">No structured sessions or subtasks recorded.</p>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  }) : (
                    <tr><td colSpan={5} className="p-5 text-center italic text-neutral-600">No completed tasks found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Expander>

          <Expander title="Import & Export Data">
            <div className="flex flex-col gap-3 pt-1">
              <button onClick={handleExport} className="w-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 p-3 rounded-xl text-sm font-semibold transition-colors flex justify-center items-center outline-none shadow-sm">
                Export Data (CSV)
              </button>
              
              <div className="relative w-full mt-2">
                <input 
                  type="file" accept=".csv" onChange={handleImport}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-full bg-neutral-900/30 border border-neutral-700 border-dashed hover:border-neutral-500 text-neutral-400 p-3 rounded-xl text-sm font-medium text-center transition-colors hover:text-neutral-300 cursor-pointer">
                  Click to Import CSV
                </div>
              </div>
              <p className="text-[10px] text-neutral-500 text-center mt-1">Importing appends data to your existing lists.</p>
            </div>
          </Expander>

        </div>

        {/* Footer: User Info & Settings Toggle */}
        <div className="p-5 border-t border-neutral-800/80 bg-transparent shrink-0">
          
          {showSettings && (
            <div className="mb-5 p-5 bg-neutral-900/50 border border-neutral-800 rounded-xl space-y-4 shadow-inner">
              <div>
                <label className="text-[10px] text-neutral-500 font-bold tracking-widest uppercase">Update Email</label>
                <input type="email" placeholder="New email address..." className="w-full mt-1.5 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-lg p-2.5 text-sm text-neutral-200 outline-none focus:border-neutral-500 transition-colors shadow-sm" />
              </div>
              <div>
                <label className="text-[10px] text-neutral-500 font-bold tracking-widest uppercase">New Password</label>
                <input type="password" placeholder="••••••••" className="w-full mt-1.5 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-lg p-2.5 text-sm text-neutral-200 outline-none focus:border-neutral-500 transition-colors shadow-sm" />
              </div>
              <div>
                <label className="text-[10px] text-neutral-500 font-bold tracking-widest uppercase">Retype Password</label>
                <input type="password" placeholder="••••••••" className="w-full mt-1.5 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-lg p-2.5 text-sm text-neutral-200 outline-none focus:border-neutral-500 transition-colors shadow-sm" />
              </div>
              <button className="w-full mt-2 bg-neutral-200 hover:bg-white text-black font-bold text-sm p-2.5 rounded-lg transition-colors outline-none shadow-sm">
                Save changes
              </button>
            </div>
          )}

          <div className="mb-4">
            <p className="text-[10px] text-neutral-500 font-bold tracking-widest mb-1">Logged in as:</p>
            <p className="text-sm font-medium text-neutral-300 truncate">{userEmail || "Loading..."}</p>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => setShowSettings(!showSettings)} 
              className={`px-4 py-2 rounded-xl transition-colors text-lg flex items-center justify-center outline-none border ${showSettings ? 'bg-neutral-800 text-white border-neutral-700' : 'bg-neutral-900/50 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border-neutral-800'}`}
              title="Settings"
            >
              ⚙️
            </button>
            <button 
              onClick={() => { if (typeof onLogout === 'function') onLogout(); }} 
              className="flex-1 bg-neutral-900/50 hover:bg-neutral-800 text-neutral-300 font-bold py-2 rounded-xl text-sm transition-colors outline-none border border-neutral-800 shadow-sm"
            >
              Log out
            </button>
          </div>
        </div>

      </div>
    </>
  );
}
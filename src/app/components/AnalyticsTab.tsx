"use client";

import React, { useState, useMemo, WheelEvent, useRef, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// === CUSTOM SELECT (FROM CALENDAR TAB) ===
const CustomSelect = ({ value, onChange, options, className = "" }: any) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const clickOutside = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <div onClick={() => setOpen(!open)} className="w-full bg-transparent hover:bg-white/[0.05] rounded p-1.5 text-sm text-neutral-200 cursor-pointer flex justify-between items-center transition-colors">
        <span className="truncate pr-2 font-semibold">{options.find((o:any)=>o.value === value)?.label || value}</span>
        <span className="text-[10px] text-neutral-500 shrink-0">▼</span>
      </div>
      {open && (
        <div 
          className="absolute top-full right-0 mt-1 min-w-[140px] w-full bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl z-[999] max-h-48 overflow-y-auto custom-scrollbar"
          onWheel={(e) => e.stopPropagation()} // Prevents scrolling from zooming the graph
        >
          {options.map((opt: any) => (
            <div key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }} className="p-2.5 text-sm text-neutral-300 hover:bg-neutral-800 cursor-pointer transition-colors">
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function AnalyticsTab({ appState }: { appState: any }) {
  const categories = appState?.categories || ["Other"];
  const studyData = appState?.study_data || [];

  const [catFilter, setCatFilter] = useState<string>("All");
  const [timeFilter, setTimeFilter] = useState<"Day" | "Month" | "Year">("Day");
  
  const [selectedDate, setSelectedDate] = useState<string>("All"); 
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  
  // Zoom states
  const [zoomRange, setZoomRange] = useState({ start: 0, end: 100 });
  const [pieZoom, setPieZoom] = useState<number>(1); 
  
  const sortedCategories = useMemo(() => [...categories].sort((a, b) => a.localeCompare(b)), [categories]);

  // Professional, eye-friendly muted palette
  const getCategoryColor = (catName: string) => {
    if (catName === "Unlogged") return "#2e2e2e"; // Slightly lighter for readability
    const idx = sortedCategories.indexOf(catName);
    const professionalPalette = [
      '#6366f1', // Indigo
      '#8b5cf6', // Violet
      '#10b981', // Emerald
      '#0ea5e9', // Sky Blue
      '#f59e0b', // Amber
      '#f43f5e', // Rose
      '#14b8a6', // Teal
      '#84cc16', // Lime
      '#ec4899', // Pink
      '#3b82f6', // Blue
      '#f97316', // Orange
      '#64748b'  // Slate
    ];
    return professionalPalette[Math.max(0, idx) % professionalPalette.length];
  };

  const minsToStr = (m: number) => {
    if (!m || m <= 0 || isNaN(m)) return "0m";
    const h = Math.floor(m / 60);
    const min = Math.round(m % 60);
    return h > 0 ? `${h}h ${min > 0 ? min + 'm' : ''}` : `${min}m`;
  };

  const parseDateStr = (dateStr: string) => {
    if (!dateStr) return new Date(0);
    if (dateStr.includes('-')) {
      const [y, m, d] = dateStr.split('-');
      return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    }
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return new Date(dateStr);
  };

  const formatDDMMYYYY = (date: Date) => {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  const allEvents = useMemo(() => {
    let events: any[] = [];
    studyData.forEach((task: any) => {
      const fallbackDate = task.Date || new Date().toLocaleDateString('en-GB');
      const poms = Number(task["Pomodoros (done)"]) || 0;
      if (poms > 0) events.push({ date: fallbackDate, cat: task.Category || "Other", name: task.Name, mins: poms * 25 });
      (task.sessions || []).forEach((s: any) => {
        if (Number(s.time_logged) > 0) events.push({ date: s.date || fallbackDate, cat: task.Category || "Other", name: task.Name, mins: Number(s.time_logged) });
      });
    });
    return events.sort((a, b) => parseDateStr(a.date).getTime() - parseDateStr(b.date).getTime());
  }, [studyData]);

  const trendData = useMemo(() => {
    if (allEvents.length === 0) return [];
    const grouped: any = {};
    
    // Fill in 0 hours for past days logically up to today
    if (timeFilter === "Day") {
      const firstDate = parseDateStr(allEvents[0].date);
      const today = new Date();
      for (let d = new Date(firstDate); d <= today; d.setDate(d.getDate() + 1)) {
        const dayStr = formatDDMMYYYY(d);
        grouped[dayStr] = { date: dayStr, totalMins: 0, tasks: {} };
      }
    }

    allEvents.forEach(ev => {
      if (catFilter !== "All" && ev.cat !== catFilter) return;
      
      const d = parseDateStr(ev.date);
      let key = ev.date; 
      if (timeFilter === "Month") key = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      if (timeFilter === "Year") key = `${d.getFullYear()}`;

      if (!grouped[key]) grouped[key] = { date: key, totalMins: 0, tasks: {} };
      grouped[key].totalMins += ev.mins;
      grouped[key].tasks[ev.name] = (grouped[key].tasks[ev.name] || 0) + ev.mins;
    });

    return Object.values(grouped).sort((a: any, b: any) => parseDateStr(a.date).getTime() - parseDateStr(b.date).getTime());
  }, [allEvents, catFilter, timeFilter]);

  const handleLineWheel = (e: WheelEvent) => {
    e.preventDefault();
    const step = 5;
    setZoomRange(prev => {
      const newRange = e.deltaY > 0 
        ? { start: Math.max(0, prev.start + step), end: Math.min(100, prev.end - step) }
        : { start: Math.max(0, prev.start - step), end: Math.min(100, prev.end + step) };
      if (newRange.start >= newRange.end) return prev; 
      return newRange;
    });
  };

  const handlePieWheel = (e: WheelEvent) => {
    e.preventDefault();
    setPieZoom(prev => Math.min(Math.max(0.5, prev + (e.deltaY > 0 ? -0.1 : 0.1)), 2.5));
  };

  const filteredTrend = useMemo(() => {
    const total = trendData.length;
    if (total === 0) return [];
    const startIdx = Math.floor((zoomRange.start / 100) * total);
    const endIdx = Math.ceil((zoomRange.end / 100) * total);
    return trendData.slice(startIdx, Math.max(startIdx + 1, endIdx));
  }, [trendData, zoomRange]);

  const pieData = useMemo(() => {
    let evs = allEvents;
    if (selectedDate !== "All") {
      const selectedTime = parseDateStr(selectedDate).getTime();
      evs = allEvents.filter(ev => parseDateStr(ev.date).getTime() === selectedTime);
    }
    
    const catMap: any = {};
    let totalStudied = 0;
    evs.forEach(ev => { 
      catMap[ev.cat] = (catMap[ev.cat] || 0) + ev.mins; 
      totalStudied += ev.mins; 
    });
    
    const data = Object.entries(catMap).map(([name, val]: any) => ({ name, value: val }));
    
    if (selectedDate !== "All") {
      data.push({ name: "Unlogged", value: Math.max(0, 1440 - totalStudied) });
    }
    return data.sort((a, b) => b.value - a.value);
  }, [allEvents, selectedDate]);

  const tableData = useMemo(() => {
    const stats: any = {};
    studyData.forEach((t: any) => {
      // ONLY CALCULATE ACTIVE TASKS
      if (t.Status === "Completed") return; 

      const cat = t.Category || "Other";
      if (!stats[cat]) stats[cat] = { logged: 0, est: 0, activeTasks: [] };
      let logged = (Number(t["Pomodoros (done)"]) || 0) * 25;
      (t.sessions || []).forEach((s: any) => logged += Number(s.time_logged || 0));
      const est = (Number(t["Est. Time"]?.replace(/h|m/g, '')) || 0) * (t["Est. Time"]?.includes('h') ? 60 : 1);
      
      stats[cat].logged += logged;
      stats[cat].est += est;
      stats[cat].activeTasks.push({ name: t.Name, logged, est });
    });
    return stats;
  }, [studyData]);

  // Synchronize internal DD/MM/YYYY to HTML input Date YYYY-MM-DD
  const dateForInput = useMemo(() => {
    if (selectedDate === "All" || !selectedDate) return "";
    const parts = selectedDate.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return selectedDate;
  }, [selectedDate]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; 
    if (!val) {
      setSelectedDate("All");
    } else {
      const [y, m, d] = val.split('-');
      setSelectedDate(`${d}/${m}/${y}`);
    }
  };

  const CustomLineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#111] border border-neutral-700 p-3 rounded shadow-lg min-w-[150px] z-50">
          <p className="font-bold text-white mb-1 text-xs">{label}</p>
          <p className="text-indigo-400 mb-2 font-semibold text-xs">Total: {minsToStr(data.totalMins)}</p>
          <div className="space-y-1">
            {Object.entries(data.tasks).map(([taskName, mins]: any) => (
              <div key={taskName} className="flex justify-between text-xs text-neutral-300 gap-4">
                <span className="truncate max-w-[200px]">- {taskName}</span>
                <span className="text-neutral-400">{minsToStr(mins)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Highly professional text wrapping for pie chart labels
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, value }: any) => {
    const pct = percent || 0; 
    if (pct < 0.05) return null; // Avoid overlapping small labels
    
    const RADIAN = Math.PI / 180;
    // Push the label slightly outwards to give it breathing room
    const radius = innerRadius + (outerRadius - innerRadius) * 0.55; 
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    // Dynamic text wrapping logic
    const parts = name.split(' ');
    let line1 = name;
    let line2 = "";
    if (name.length > 12 && parts.length > 1) {
      const mid = Math.ceil(parts.length / 2);
      line1 = parts.slice(0, mid).join(' ');
      line2 = parts.slice(mid).join(' ');
    }
    
    return (
      <text 
        x={x} y={y} 
        fill="#111" 
        textAnchor="middle" 
        dominantBaseline="central" 
        fontSize={11} 
        fontWeight="800"
      >
        <tspan x={x} dy={line2 ? "-14" : "-7"}>{line1}</tspan>
        {line2 && <tspan x={x} dy="12">{line2}</tspan>}
        <tspan x={x} dy="14">{minsToStr(value)}</tspan>
        <tspan x={x} dy="12">{`${(pct * 100).toFixed(0)}%`}</tspan>
      </text>
    );
  };

  return (
    <div className="p-8 text-neutral-300">
      
      {/* 1. Line Graph */}
      <div className="w-full h-[400px] mb-24" onWheel={handleLineWheel}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-lg">Study Habits Trend</h2>
          <div className="flex items-center gap-1 bg-neutral-800/40 border border-neutral-800/60 rounded-md p-0.5 shadow-sm z-20">
            <CustomSelect 
              value={catFilter} 
              onChange={setCatFilter} 
              options={[{ label: "All Categories", value: "All" }, ...sortedCategories.map(c => ({ label: c, value: c }))]} 
              className="w-40"
            />
            <CustomSelect 
              value={timeFilter} 
              onChange={setTimeFilter} 
              options={[{ label: "Day", value: "Day" }, { label: "Month", value: "Month" }, { label: "Year", value: "Year" }]} 
              className="w-24"
            />
          </div>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredTrend} onClick={(e: any) => e?.activePayload && setSelectedDate(e.activePayload[0].payload.date)}>
            <CartesianGrid stroke="#262626" vertical={false} />
            <XAxis dataKey="date" stroke="#737373" fontSize={11} angle={-90} textAnchor="end" height={80} tickMargin={5} />
            <YAxis tickFormatter={(m) => `${(m/60).toFixed(0)}h`} stroke="#737373" fontSize={12} />
            <Tooltip cursor={false} content={<CustomLineTooltip />} />
            <Line type="monotone" connectNulls={true} dataKey="totalMins" stroke="#6366f1" strokeWidth={3} dot={{ r: 2 }} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 2. Bottom Row: Pie Chart + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        
        {/* Pie Chart Section */}
        <div className="h-[450px] flex flex-col" onWheel={handlePieWheel}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold">Distribution: {selectedDate === "All" ? "All Time" : selectedDate}</h2>
            <div className="flex items-center gap-2 z-10">
              <div className="relative flex items-center bg-transparent border border-neutral-700 hover:border-neutral-500 rounded px-3 py-1.5 text-xs text-neutral-200 cursor-pointer outline-none transition-colors">
                <span className="truncate pr-3 font-semibold">
                  {selectedDate === "All" ? "DD/MM/YYYY" : selectedDate}
                </span>
                <span className="text-[10px] text-neutral-500 shrink-0">▼</span>
                <input 
                  type="date" 
                  value={dateForInput} 
                  onChange={handleDateChange} 
                  style={{ colorScheme: 'dark' }} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              {selectedDate !== "All" && (
                <button onClick={() => setSelectedDate("All")} className="text-xs bg-neutral-800 px-3 py-1.5 rounded border border-neutral-700 hover:bg-neutral-700 transition-colors">Clear</button>
              )}
            </div>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={pieData} 
                innerRadius={0} 
                outerRadius={140 * pieZoom} 
                dataKey="value" 
                stroke="#111" 
                strokeWidth={1}
                labelLine={false} 
                label={renderCustomizedLabel} 
              >
                {pieData.map((e, i) => <Cell key={i} fill={getCategoryColor(e.name)} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto pt-10">
          <p className="text-xs text-neutral-500 italic mb-3">Note: Statistics below reflect Active Tasks only.</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-neutral-500 uppercase text-xs border-b border-neutral-800">
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-center">Total</th>
                <th className="p-3 text-center">Est</th>
                <th className="p-3 text-center">%</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(tableData).sort(([catA], [catB]) => catA.localeCompare(catB)).map(([cat, d]: any) => (
                <React.Fragment key={cat}>
                  <tr onClick={() => setExpandedCat(expandedCat === cat ? null : cat)} className="cursor-pointer hover:bg-[#111] transition-colors">
                    <td className="p-3 font-bold flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: getCategoryColor(cat) }}></span>
                      {cat}
                    </td>
                    <td className="p-3 text-center font-medium">{minsToStr(d.logged)}</td>
                    <td className="p-3 text-center">{d.est > 0 ? minsToStr(d.est) : "-"}</td>
                    <td className="p-3 text-center">{d.est > 0 ? Math.round((d.logged / d.est) * 100) : 0}%</td>
                  </tr>
                  {expandedCat === cat && d.activeTasks.map((t: any, i: number) => (
                    <tr key={i} className="text-xs text-neutral-500 bg-[#0a0a0a]">
                      <td className="p-3 pl-8">└ {t.name}</td>
                      <td className="p-3 text-center">{minsToStr(t.logged)}</td>
                      <td className="p-3 text-center">{t.est > 0 ? minsToStr(t.est) : "-"}</td>
                      <td className="p-3 text-center">{t.est > 0 ? Math.round((t.logged / t.est) * 100) : 0}%</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { startOfMonth, eachDayOfInterval, format, isToday, startOfWeek, endOfWeek, addMonths, subMonths, setMonth, setYear, isSameMonth } from 'date-fns';
import { useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { Client } from "@microsoft/microsoft-graph-client";

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
        <div className="absolute top-full left-0 mt-1 w-full bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl z-[999] max-h-48 overflow-y-auto custom-scrollbar">
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

export default function CalendarTab({ appState }: { appState: any }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showOutlook, setShowOutlook] = useState(false);
  const [outlookEvents, setOutlookEvents] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("syncOutlook");
      if (saved === "true") setShowOutlook(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("syncOutlook", String(showOutlook));
  }, [showOutlook]);

  useEffect(() => {
    if (todayRef.current) todayRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const { instance, accounts, inProgress } = useMsal();

  const { allDays, fetchStart, fetchEnd } = useMemo(() => {
    const sDate = startOfWeek(startOfMonth(subMonths(new Date(), 6)), { weekStartsOn: 1 });
    const eDate = endOfWeek(startOfMonth(addMonths(new Date(), 6)), { weekStartsOn: 1 });
    return { allDays: eachDayOfInterval({ start: sDate, end: eDate }), fetchStart: sDate, fetchEnd: eDate };
  }, []);

  const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => ({ label: m, value: i }));
  const YEARS = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => ({ label: String(y), value: y }));

  const standardizeDate = (dateVal: any) => {
    if (!dateVal) return null;
    let str = String(dateVal).trim();
    if (str.includes('T')) str = str.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    const match = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
    if (match) return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
    const match2 = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
    if (match2) return `${match2[1]}-${match2[2].padStart(2, '0')}-${match2[3].padStart(2, '0')}`;
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) return format(parsed, 'yyyy-MM-dd');
    return null;
  };

  const parseTimeStr = (timeStr: string) => {
    if (!timeStr) return 0;
    const match = String(timeStr).match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (match) {
      let h = parseInt(match[1]);
      const m = parseInt(match[2]);
      const ampm = match[3]?.toUpperCase();
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    }
    return 0;
  };

  useEffect(() => {
    if (showOutlook && accounts.length > 0) {
      const fetchOutlook = async () => {
        try {
          const response = await instance.acquireTokenSilent({ scopes: ["Calendars.Read"], account: accounts[0] })
            .catch(async (err) => {
              if (err.name === "InteractionRequiredAuthError") await instance.acquireTokenRedirect({ scopes: ["Calendars.Read"] });
              throw err;
            });
          const graphClient = Client.init({ authProvider: (done) => done(null, response.accessToken) });
          const start = format(fetchStart, "yyyy-MM-dd'T'00:00:00'Z'");
          const end = format(fetchEnd, "yyyy-MM-dd'T'23:59:59'Z'");

          const res = await graphClient.api('/me/calendarview').query({ startDateTime: start, endDateTime: end }).top(200).get();

          const events = res.value.map((e: any) => {
            const utcDate = new Date(e.start.dateTime + 'Z'); 
            const utcEndDate = new Date(e.end.dateTime + 'Z');
            const localStart = new Date(utcDate.getTime() + (3 * 60 * 60 * 1000));
            const localEnd = new Date(utcEndDate.getTime() + (3 * 60 * 60 * 1000));

            const datePart = localStart.toISOString().split('T')[0];
            const startStr = `${String(localStart.getUTCHours()).padStart(2,'0')}:${String(localStart.getUTCMinutes()).padStart(2,'0')}`;
            const endStr = `${String(localEnd.getUTCHours()).padStart(2,'0')}:${String(localEnd.getUTCMinutes()).padStart(2,'0')}`;
            
            return { type: 'outlook', name: e.subject, timeValue: parseTimeStr(startStr), timeLabel: `${startStr} - ${endStr}`, date: datePart };
          });
          setOutlookEvents(events);
        } catch (err) { console.error("Outlook fetch failed:", err); }
      };
      fetchOutlook();
    } else { setOutlookEvents([]); }
  }, [showOutlook, fetchStart, fetchEnd, instance, accounts]);

  const calendarData = useMemo(() => {
    const data: Record<string, any[]> = {};
    const addEvent = (dateKey: string, event: any) => {
      if (!data[dateKey]) data[dateKey] = [];
      const exists = data[dateKey].find(e => e.name === event.name && e.type === event.type);
      if (!exists) data[dateKey].push(event);
    };

    let allTasks: any[] = [];
    if (appState && typeof appState === 'object') {
      Object.values(appState).forEach((val: any) => {
        if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && (val[0].Name || val[0].Task || val[0].Title)) {
          allTasks = [...allTasks, ...val];
        }
      });
    }
    
    allTasks.forEach((task: any) => {
      const name = task.Name || task.Task || task.Title || "Untitled";
      const category = task.Category || "Other";
      const status = task.Status || task.status || "Active";
      const isCompleted = status === "Completed" || status === "Done";
      
      const rawDueDate = task["Due Date"] || task.Due || task.Deadline;
      const dueDateKey = standardizeDate(rawDueDate);
      if (dueDateKey) {
        const rawDueTime = task["Due Time"] || task.time || "";
        addEvent(dueDateKey, { type: 'due', name, category, status, isCompleted, timeValue: parseTimeStr(rawDueTime), timeLabel: rawDueTime });
      }

      const logEvent = (dateKey: string, startTime: string, endTime: string, sessionName?: string) => {
        let label = startTime || "";
        if (startTime && endTime) label = `${startTime} - ${endTime}`;
        addEvent(dateKey, { type: 'logged', name, category, sessionName, status, isCompleted, timeValue: parseTimeStr(startTime), timeLabel: label });
      };

      const loggedDateKey = standardizeDate(task.Date || task.date);
      if (loggedDateKey) {
        logEvent(loggedDateKey, task.Start || task["Start Time"] || task.Time || "", task.End || task["End Time"] || "");
      }
      
      (task.sessions || []).forEach((s: any) => {
        const sessionKey = standardizeDate(s.date || s.Date);
        if (sessionKey) logEvent(sessionKey, s.start_time || s.time, s.end_time, s.name);
      });
    });

    outlookEvents.forEach((ev: any) => { if (ev.date) addEvent(ev.date, ev); });
    Object.keys(data).forEach(dateKey => data[dateKey].sort((a, b) => a.timeValue - b.timeValue));
    return data;
  }, [appState, outlookEvents]);

  const jumpToMonth = (mIdx: number) => {
    setCurrentDate(setMonth(currentDate, mIdx));
    const targetDate = format(setMonth(currentDate, mIdx), 'yyyy-MM-01');
    const el = document.getElementById(`cal-day-${targetDate}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const jumpToYear = (y: number) => {
    setCurrentDate(setYear(currentDate, y));
    const targetDate = format(setYear(currentDate, y), 'yyyy-MM-01');
    const el = document.getElementById(`cal-day-${targetDate}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleToggleOutlook = async () => {
    if (inProgress !== InteractionStatus.None) return;
    if (accounts.length === 0) {
      try { await instance.loginRedirect({ scopes: ["Calendars.Read"], prompt: "select_account" }); } 
      catch (err: any) { setShowOutlook(false); }
    } else { setShowOutlook(!showOutlook); }
  };

  return (
    <div className="flex flex-col h-full text-neutral-300 p-4">
      
      {/* Boxless Toolbar */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div className="flex gap-1 items-center">
          <div className="flex items-center gap-1 bg-neutral-800/40 border border-neutral-800/60 rounded-md p-0.5 shadow-sm">
            <CustomSelect value={currentDate.getMonth()} onChange={jumpToMonth} options={MONTHS} className="w-32" />
            <CustomSelect value={currentDate.getFullYear()} onChange={jumpToYear} options={YEARS} className="w-24" />
          </div>
          <button onClick={() => { setCurrentDate(new Date()); todayRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }} className="ml-3 px-3 py-1.5 hover:bg-white/[0.05] rounded-md transition-colors text-sm font-semibold text-neutral-400 hover:text-neutral-200 outline-none">Today</button>
        </div>

        <div onClick={handleToggleOutlook} className="flex items-center gap-3 cursor-pointer group select-none transition-all">
          <span className={`text-sm font-semibold transition-colors duration-300 ${showOutlook ? 'text-neutral-300' : 'text-neutral-500 group-hover:text-neutral-400'}`}>
            Sync Outlook
          </span>
          <div className={`relative w-9 h-5 rounded-full transition-colors duration-300 ${showOutlook ? 'bg-neutral-400' : 'bg-neutral-700'}`}>
            <div className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform duration-300 ${showOutlook ? 'translate-x-4' : ''}`} />
          </div>
        </div>
      </div>

      {/* Header Row */}
      <div className="grid grid-cols-7 gap-2 shrink-0 mb-2 pr-2">
        {WEEKDAYS.map(d => <div key={d} className="font-bold text-center text-neutral-500 uppercase tracking-widest text-xs">{d}</div>)}
      </div>
      
      {/* Continuous Scroll Calendar Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10" ref={scrollRef}>
        <div className="grid grid-cols-7 gap-2">
          {allDays.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayEvents = calendarData[dateKey] || [];
            const isFirstOfMonth = day.getDate() === 1;
            const isTdy = isToday(day);
            const isFaded = !isSameMonth(day, currentDate);
            
            return (
              <div 
                key={dateKey} 
                id={`cal-day-${dateKey}`}
                ref={isTdy ? todayRef : null}
                className={`min-h-[140px] p-2 border rounded-xl flex flex-col overflow-hidden transition-colors
                  ${isTdy && !isFaded ? 'bg-neutral-800/80 border-indigo-500/50 shadow-inner' : 
                    isFaded ? 'bg-[#0a0a0a] border-neutral-900 opacity-40' : 'bg-neutral-900/80 border-neutral-800'}
                `}
              >
                <div className={`text-xs font-bold px-1 mb-2 flex justify-between ${isTdy && !isFaded ? 'text-indigo-400' : isFaded ? 'text-neutral-600' : 'text-neutral-300'}`}>
                  <span>{format(day, 'd')}</span>
                  {isFirstOfMonth && <span className="text-[10px] uppercase tracking-widest text-neutral-500">{format(day, 'MMM')}</span>}
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                  {dayEvents.map((evt, i) => {
                    const timeStr = evt.timeLabel ? `${evt.timeLabel} ` : '';
                    let bgClass = "bg-neutral-800/60";
                    let borderClass = "border border-neutral-700/50";
                    let textClass = "text-neutral-200";

                    if (evt.isCompleted) {
                      bgClass = "bg-transparent";
                      textClass = "text-neutral-500 line-through decoration-neutral-600";
                    } else if (evt.type === 'due') {
                      bgClass = "bg-rose-900/30";
                      borderClass = "border border-rose-500/30";
                      textClass = "text-rose-200";
                    } else if (evt.type === 'outlook') {
                      bgClass = "bg-sky-900/30";
                      borderClass = "border border-sky-500/30";
                      textClass = "text-sky-200";
                    } else {
                      bgClass = "bg-indigo-900/30";
                      borderClass = "border border-indigo-500/30";
                      textClass = "text-indigo-200";
                    }

                    return (
                      <div key={i} className={`text-[11px] px-2 py-1.5 rounded flex flex-col leading-tight whitespace-normal break-words shadow-sm ${bgClass} ${borderClass} ${textClass}`}>
                        {timeStr && <span className={`font-mono mb-0.5 ${evt.isCompleted ? 'text-neutral-600' : 'text-neutral-400'}`}>{timeStr}</span>}
                        {evt.type === 'due' && !evt.isCompleted && <span className="font-bold text-rose-400 mb-0.5 tracking-wider text-[10px]">🚩 DUE</span>}
                        <span className="font-bold w-full">{evt.name}</span>
                        {evt.sessionName && <span className="w-full text-[10px] font-medium italic opacity-80 mt-0.5 break-words">({evt.sessionName})</span>}
                        {evt.category && <span className="text-[9px] opacity-60 mt-auto pt-1 block tracking-wider">{evt.category}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
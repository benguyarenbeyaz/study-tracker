"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isToday, addWeeks, subWeeks } from 'date-fns';
import { useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { Client } from "@microsoft/microsoft-graph-client";

export default function TimelapseTab({ appState }: { appState: any }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showOutlook, setShowOutlook] = useState(false);
  const [outlookEvents, setOutlookEvents] = useState<any[]>([]);
  
  const weekDateRef = useRef<HTMLInputElement>(null);
  
  // 1. Independent Scroll Refs Map and Clock Tracker
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [liveMins, setLiveMins] = useState<number>(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("syncOutlook");
      if (saved === "true") setShowOutlook(true);
    }
    
    const updateClock = () => {
      const now = new Date();
      setLiveMins(now.getHours() * 60 + now.getMinutes());
    };
    updateClock();
    const ticker = setInterval(updateClock, 60000);
    return () => clearInterval(ticker);
  }, []);

  const { instance, accounts, inProgress } = useMsal();

  const { startDate, endDate, days } = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return { startDate: start, endDate: end, days: eachDayOfInterval({ start, end }) };
  }, [currentDate]);

  // Restore scrolls for each active column whenever the displayed days change
  useEffect(() => {
    if (typeof window !== "undefined") {
      days.forEach((day) => {
        const dateKey = format(day, 'yyyy-MM-dd');
        const savedScroll = localStorage.getItem(`timelapseScroll_${dateKey}`);
        if (savedScroll && scrollRefs.current[dateKey]) {
          scrollRefs.current[dateKey]!.scrollTop = parseInt(savedScroll, 10);
        }
      });
    }
  }, [days]);

  const WEEKDAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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

  const parseTimeInterval = (startTimeStr?: string, endTimeStr?: string, mixedTimeStr?: string) => {
    const parseMins = (ts: string) => {
      const match = String(ts).trim().match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (match) {
        let h = parseInt(match[1]);
        const m = parseInt(match[2]);
        const ampm = match[3]?.toUpperCase();
        if (ampm === 'PM' && h < 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;
        return h * 60 + m;
      }
      return null;
    };
    
    let start = parseMins(startTimeStr || "");
    let end = parseMins(endTimeStr || "");
    
    if (mixedTimeStr && (!start || !end)) {
      const parts = String(mixedTimeStr).split(/[-to~]/i);
      if (!start && parts[0]) start = parseMins(parts[0]);
      if (!end && parts[1]) end = parseMins(parts[1]);
    }
    
    let hasTime = true;
    if (start === null && end === null) {
      hasTime = false;
      start = 0; 
      end = 0;
    } else if (start !== null && end === null) {
      end = start + 60;
    }
    
    return { start, end, hasTime };
  };

  // Outlook cache memory management
  useEffect(() => {
    if (showOutlook) {
      const fetchOutlook = async () => {
        try {
          const cachedToken = localStorage.getItem("outlook_token");
          const expiryTime = localStorage.getItem("outlook_token_expiry");
          const now = new Date().getTime();
          let tokenToUse = cachedToken;

          if (!cachedToken || !expiryTime || now >= parseInt(expiryTime, 10)) {
            if (accounts.length === 0) return;
            const response = await instance.acquireTokenSilent({ scopes: ["Calendars.Read"], account: accounts[0] })
              .catch(async (err) => {
                if (err.name === "InteractionRequiredAuthError") await instance.acquireTokenRedirect({ scopes: ["Calendars.Read"] });
                throw err;
              });
            tokenToUse = response.accessToken;
            localStorage.setItem("outlook_token", tokenToUse);
            localStorage.setItem("outlook_token_expiry", (now + 3000000).toString()); // ~50 mins validity
          }

          if (!tokenToUse) return;

          const graphClient = Client.init({ authProvider: (done) => done(null, tokenToUse) });
          const startIso = format(startDate, "yyyy-MM-dd'T'00:00:00'Z'");
          const endIso = format(endDate, "yyyy-MM-dd'T'23:59:59'Z'");

          const res = await graphClient.api('/me/calendarview').query({ startDateTime: startIso, endDateTime: endIso }).top(100).get();

          const events = res.value.map((e: any) => {
            const utcDate = new Date(e.start.dateTime + 'Z'); 
            const utcEndDate = new Date(e.end.dateTime + 'Z');
            const localStart = new Date(utcDate.getTime() + (3 * 60 * 60 * 1000));
            const localEnd = new Date(utcEndDate.getTime() + (3 * 60 * 60 * 1000));

            return {
              type: 'outlook',
              name: e.subject,
              date: localStart.toISOString().split('T')[0],
              start: localStart.getUTCHours() * 60 + localStart.getUTCMinutes(),
              end: localEnd.getUTCHours() * 60 + localEnd.getUTCMinutes(),
              hasTime: true,
              isCompleted: false
            };
          });
          setOutlookEvents(events);
        } catch (err) { 
          console.error("Outlook fetch failed:", err);
          localStorage.removeItem("outlook_token");
        }
      };
      fetchOutlook();
    } else { setOutlookEvents([]); }
  }, [showOutlook, startDate, endDate, instance, accounts]);

  // Session-Aware Timeline Data Generation
  const timelineData = useMemo(() => {
    const data: Record<string, any[]> = {};
    const addEvent = (dateKey: string, event: any) => {
      if (!data[dateKey]) data[dateKey] = [];
      data[dateKey].push(event);
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
      const taskCompleted = status === "Completed" || status === "Done";
      
      const rawDueDate = task["Due Date"] || task.Due || task.Deadline;
      const dueDateKey = standardizeDate(rawDueDate);
      if (dueDateKey) {
        const times = parseTimeInterval(task["Due Time"] || task.DueTime || task.time);
        addEvent(dueDateKey, { type: 'due', name, category, isCompleted: taskCompleted, start: times.start, end: times.end, hasTime: times.hasTime });
      }

      // Check primary parent task logged Date
      const loggedDateKey = standardizeDate(task.Date || task.date);
      if (loggedDateKey && (!task.sessions || task.sessions.length === 0)) {
         const times = parseTimeInterval(task.Start || task["Start Time"], task.End || task["End Time"], task.Time || task.time);
         addEvent(loggedDateKey, { type: 'logged', name, category, isCompleted: taskCompleted, start: times.start, end: times.end, hasTime: times.hasTime });
      }
      
      // Check individual sessions 
      (task.sessions || []).forEach((s: any) => {
        const sessionKey = standardizeDate(s.date || s.Date);
        if (sessionKey) {
            const times = parseTimeInterval(s.start_time, s.end_time, s.time || s.Time);
            const sCompleted = s.status === "Completed" || s.Status === "Completed" || s.completed === true;
            addEvent(sessionKey, { type: 'logged', name, sessionName: s.name, category, isCompleted: sCompleted, start: times.start, end: times.end, hasTime: times.hasTime });
        }
        
        // Subs-sessions
        (s.subsessions || []).forEach((sub: any) => {
           const subKey = standardizeDate(sub.date || sub.Date);
           if (subKey) {
              const times = parseTimeInterval(sub.start_time, sub.end_time, sub.time || sub.Time);
              const subCompleted = sub.status === "Completed" || sub.Status === "Completed" || sub.completed === true;
              addEvent(subKey, { type: 'logged', name, sessionName: sub.name, category, isCompleted: subCompleted, start: times.start, end: times.end, hasTime: times.hasTime });
           }
        });
      });
    });

    outlookEvents.forEach((ev: any) => { if (ev.date) addEvent(ev.date, ev); });
    return data;
  }, [appState, outlookEvents]);

  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1));

  const handleToggleOutlook = async () => {
    if (inProgress !== InteractionStatus.None) return;
    if (accounts.length === 0) {
      try { await instance.loginRedirect({ scopes: ["Calendars.Read"], prompt: "select_account" }); } 
      catch (err: any) { setShowOutlook(false); }
    } else { setShowOutlook(!showOutlook); }
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="flex flex-col h-full text-neutral-300 p-4">
      
      <div className="flex justify-between items-center mb-6 shrink-0 px-2">
        <div className="flex gap-1 items-center relative">
          <button onClick={prevWeek} className="text-neutral-400 hover:text-neutral-200 px-3 py-1 text-lg font-bold transition-colors outline-none hover:bg-white/[0.05] rounded">&lt;</button>
          
          <div 
            className="group flex items-center justify-center px-2 cursor-pointer relative"
            onClick={() => {
              try { if (weekDateRef.current && 'showPicker' in HTMLInputElement.prototype) weekDateRef.current.showPicker(); } catch (err) {}
            }}
          >
            <h2 className="text-base font-bold text-neutral-200 tracking-tight transition-colors group-hover:text-neutral-400">
              Timelapse of week of {format(startDate, 'MMMM d, yyyy')}
            </h2>
            <input 
              type="date" 
              ref={weekDateRef}
              className="absolute w-0 h-0 opacity-0 pointer-events-none"
              style={{ colorScheme: 'dark' }} 
              value={format(currentDate, 'yyyy-MM-dd')}
              onChange={(e) => { if (e.target.value) setCurrentDate(new Date(e.target.value + 'T12:00:00')); }}
              tabIndex={-1}
            />
          </div>
          
          <button onClick={nextWeek} className="text-neutral-400 hover:text-neutral-200 px-3 py-1 text-lg font-bold transition-colors outline-none hover:bg-white/[0.05] rounded">&gt;</button>
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

      <div className="flex-1 flex gap-4 overflow-x-auto custom-scrollbar pb-4 min-h-0 px-2 relative">
        {days.map((day, i) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayEvents = timelineData[dateKey] || [];
          const isTodayFlag = isToday(day);
          
          const timelessEvents = dayEvents.filter(e => !e.hasTime);
          const timedEvents = dayEvents.filter(e => e.hasTime);

          return (
            <div key={dateKey} className="flex-1 flex flex-col min-w-[180px] max-w-[320px] h-full relative">
              <div className="mb-2 shrink-0 px-2 sticky top-0 z-50 bg-[#050505] pt-1">
                <div className={`font-bold text-base ${isTodayFlag ? 'text-indigo-400' : 'text-neutral-200'}`}>{WEEKDAYS_SHORT[i]}</div>
                <div className={`text-xs ${isTodayFlag ? 'text-indigo-300 font-semibold' : 'text-neutral-500'}`}>{format(day, 'dd/MM')}</div>
              </div>

              {/* INDEPENDENT SCROLL CONTAINER FOR THE DAY TIMELAPSE */}
              <div 
                ref={(el) => { scrollRefs.current[dateKey] = el; }}
                onScroll={(e) => {
                  localStorage.setItem(`timelapseScroll_${dateKey}`, e.currentTarget.scrollTop.toString());
                }}
                className={`flex-1 overflow-y-auto custom-scrollbar rounded-xl border relative shadow-sm ${isTodayFlag ? 'bg-neutral-800/30 border-indigo-500/30' : 'bg-[#0a0a0a] border-neutral-800'}`}
              >
                
                {timelessEvents.length > 0 && (
                  <div className="px-2 pt-2 pb-2 space-y-1.5 shrink-0 border-b border-neutral-800/50 relative z-20">
                    {timelessEvents.map((evt, idx) => {
                      let bgClass = "bg-neutral-800/60";
                      let borderClass = "border-neutral-700/50";
                      let textClass = "text-neutral-200";

                      if (evt.isCompleted) {
                        bgClass = "bg-transparent";
                        borderClass = "border-neutral-700/50";
                        textClass = "text-neutral-500 line-through decoration-neutral-600";
                      } else if (evt.type === 'due') {
                        bgClass = "bg-rose-900/30";
                        borderClass = "border-rose-500/30";
                        textClass = "text-rose-200";
                      } else {
                        bgClass = "bg-indigo-900/30";
                        borderClass = "border-indigo-500/30";
                        textClass = "text-indigo-200";
                      }

                      return (
                        <div key={`timeless-${dateKey}-${idx}`} className={`p-1.5 rounded shadow-sm border text-[11px] leading-snug break-words whitespace-normal overflow-y-auto max-h-16 custom-scrollbar ${bgClass} ${borderClass} ${textClass}`}>
                          <div className="flex items-start gap-1">
                            {evt.isCompleted && <span className="text-emerald-600 font-bold shrink-0">✓</span>}
                            <div className="flex flex-col flex-1 min-w-0">
                              {evt.type === 'due' && !evt.isCompleted && <span className="font-bold text-rose-400 mb-0.5 tracking-wider text-[9px] block">🚩 DUE</span>}
                              <span className="font-bold">{evt.name}</span>
                              {evt.sessionName && <span className="opacity-70 mt-0.5 italic font-medium">({evt.sessionName})</span>}
                              {evt.category && <span className="text-[9px] opacity-60 mt-1 block tracking-wider">{evt.category}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="relative h-[1440px] w-full mt-1 overflow-hidden">
                  {hours.map(h => (
                    <div key={`line-${h}`} className="absolute w-full flex items-start border-t border-neutral-800/50" style={{ top: `${h * 60}px`, height: '60px' }}>
                      <span className="text-[10px] text-neutral-600 font-mono pl-2 pt-1 select-none">{String(h).padStart(2, '0')}:00</span>
                    </div>
                  ))}

                  {/* LIVE LINE INDICATOR */}
                  {isTodayFlag && (
                    <div 
                      className="absolute left-10 right-0 border-t border-red-500/80 z-40 pointer-events-none flex items-center transition-all duration-500 shadow-sm shadow-red-500/20"
                      style={{ top: `${liveMins}px` }}
                    >
                      <span className="bg-red-500 text-white font-extrabold tracking-wider text-[8px] px-1 py-[1px] rounded-sm -mt-2 -ml-2">LIVE</span>
                    </div>
                  )}

                  {timedEvents.map((evt, idx) => {
                    const startMins = evt.start || 0;
                    let endMins = evt.end || (startMins + 30);
                    if (startMins === 0 && endMins === 0) endMins = 30;
                    const heightMins = Math.max(endMins - startMins, 45); 

                    let bgClass = "bg-neutral-800/60";
                    let borderClass = "border border-neutral-700/50";
                    let textClass = "text-neutral-200";

                    if (evt.isCompleted) {
                      bgClass = "bg-transparent";
                      borderClass = "border border-neutral-700/50";
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
                      <div 
                        key={`evt-${dateKey}-${idx}`} 
                        className={`absolute left-10 right-2 rounded shadow-sm p-1.5 z-10 hover:z-30 hover:shadow-lg transition-all flex flex-col overflow-hidden ${bgClass} ${borderClass} ${textClass}`}
                        style={{ top: `${startMins}px`, height: `${heightMins}px` }}
                        title={`${evt.name} (${Math.floor(startMins/60)}:${String(startMins%60).padStart(2,'0')} - ${Math.floor(endMins/60)}:${String(endMins%60).padStart(2,'0')})`}
                      >
                        <div className="w-full h-full overflow-y-auto custom-scrollbar flex flex-col pr-1">
                          <span className={`text-[10px] font-mono mb-0.5 shrink-0 ${evt.isCompleted ? 'text-neutral-600' : 'text-neutral-400'}`}>
                            {evt.isCompleted && <span className="mr-1 text-emerald-600 font-bold">✓</span>}
                            {Math.floor(startMins/60)}:{String(startMins%60).padStart(2,'0')} - {Math.floor(endMins/60)}:{String(endMins%60).padStart(2,'0')}
                          </span>
                          
                          {evt.type === 'due' && !evt.isCompleted && <span className="font-bold text-rose-400 mb-0.5 tracking-wider text-[9px] shrink-0">🚩 DUE</span>}
                          
                          <span className="text-xs font-bold leading-tight whitespace-normal break-words">
                            {evt.name}
                          </span>
                          
                          {evt.sessionName && <span className="text-[10px] opacity-70 block mt-0.5 whitespace-normal break-words font-medium italic">({evt.sessionName})</span>}
                          {evt.category && <span className="text-[9px] opacity-60 mt-auto pt-1 block tracking-wider shrink-0">{evt.category}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
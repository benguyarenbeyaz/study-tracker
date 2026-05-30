"use client";

import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import PomodoroTab from "./components/PomodoroTab";
import MasterLogTab from "./components/MasterLogTab";
import BacklogTab from "./components/BacklogTab";
import AnalyticsTab from "./components/AnalyticsTab";
import CalendarTab from "./components/CalendarTab";
import TimelapseTab from "./components/TimelapseTab";
import Sidebar from './components/Sidebar';
import FilmsTab from './components/FilmsTab';
import BooksTab from './components/BooksTab';
import LanguageTab from './components/LanguageTab';

const TABS = ["Pomodoro", "Master Log", "Backlog", "Analytics", "Calendar", "Timelapse", "Films", "Books", "Language"];

// === PREMIUM INLINE AUTH COMPONENT ===
const ProfessionalAuth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccessMsg("Check your email for the confirmation link.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-black text-neutral-300 font-sans relative overflow-hidden">
      {/* Subtle Ambient Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md p-8 relative z-10">
        <div className="bg-neutral-900/40 border border-neutral-800/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-neutral-100 tracking-tight mb-2">
              {isSignUp ? "Create your workspace" : "Welcome back"}
            </h1>
            <p className="text-sm text-neutral-500">
              {isSignUp ? "Sign up to start tracking your study sessions" : "Enter your credentials to access your dashboard"}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-black border border-neutral-800 hover:border-neutral-700 focus:border-neutral-500 rounded-lg p-3.5 text-sm text-neutral-200 outline-none transition-colors shadow-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black border border-neutral-800 hover:border-neutral-700 focus:border-neutral-500 rounded-lg p-3.5 text-sm text-neutral-200 outline-none transition-colors shadow-sm"
              />
            </div>

            {!isSignUp && (
              <div className="flex items-center justify-between mt-2">
                <label className="flex items-center gap-2 cursor-pointer group select-none">
                  <input 
                    type="checkbox" 
                    checked={rememberMe} 
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="appearance-none w-4 h-4 bg-black border border-neutral-700 rounded-sm checked:bg-neutral-700 checked:border-neutral-600 cursor-pointer flex items-center justify-center after:content-['✓'] after:text-white after:text-[9px] after:opacity-0 checked:after:opacity-100 transition-all outline-none" 
                  />
                  <span className="text-xs text-neutral-400 group-hover:text-neutral-300 transition-colors">Keep me signed in</span>
                </label>
                <a href="#" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">Forgot password?</a>
              </div>
            )}

            {errorMsg && <div className="p-3 bg-rose-950/30 border border-rose-900/50 rounded-lg text-xs text-rose-400 text-center font-medium">{errorMsg}</div>}
            {successMsg && <div className="p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-lg text-xs text-emerald-400 text-center font-medium">{successMsg}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-neutral-200 hover:bg-white text-black font-bold py-3.5 rounded-lg text-sm transition-colors shadow-md disabled:opacity-50 mt-4 outline-none"
            >
              {loading ? "Authenticating..." : isSignUp ? "Sign Up" : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-neutral-500">
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <button 
              onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(null); setSuccessMsg(null); }} 
              className="text-neutral-300 hover:text-white font-bold transition-colors outline-none"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


// === MAIN APP COMPONENT ===
export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState("Pomodoro");
  const [appState, setAppState] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  
  // State to control Sidebar open/close directly from the nav bar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserData(session.user.id);
    });
    supabase.auth.onAuthStateChange((_, session) => setSession(session));
  }, []);

  const fetchUserData = async (userId: string) => {
    const { data } = await supabase.from("user_data").select("app_state").eq("user_id", userId).single();
    setAppState(data?.app_state || { categories: ["Other"], study_data: [], dateless_data: [], subtask_dict: {} });
    setLoadingData(false);
  };

  const saveCloudData = async (updatedState: any) => {
    if (!session) return;
    setAppState(updatedState);
    await supabase.from("user_data").upsert({ user_id: session.user.id, app_state: updatedState });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Serve the new Professional Auth Screen if not logged in
  if (!session) return <ProfessionalAuth />;
  
  if (loadingData) return (
    <div className="flex h-screen items-center justify-center bg-black text-neutral-600 font-bold tracking-widest text-sm uppercase">
      Syncing Workspace...
    </div>
  );

  return (
    <div className="flex h-screen bg-black text-neutral-300 overflow-hidden font-sans relative">
      
      {/* Global Scrollbar override */}
      <style jsx global>{`
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #262626; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #404040; }
      `}</style>

      {/* The Sidebar Drawer */}
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        appState={appState} 
        onSave={saveCloudData} 
        onLogout={handleLogout} 
        userEmail={session.user.email}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navigation Bar with Integrated Hamburger */}
        {/* Changed background to pure black */}
        <div className="bg-black border-b border-neutral-800 flex items-center overflow-x-auto scrollbar-hide">
          
          {/* Box-less Hamburger Button Aligned with Tabs */}
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="px-6 py-4 text-neutral-500 hover:text-neutral-200 transition-colors text-lg flex items-center justify-center border-b-2 border-transparent"
            aria-label="Open Sidebar"
          >
            ☰
          </button>
          
          {TABS.map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)} 
              className={`px-6 py-4 text-sm font-medium tracking-wide whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab 
                  ? "border-neutral-500 text-neutral-200 bg-neutral-900/40" // Much darker, blended active state
                  : "border-transparent text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/20"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        {/* Tab Content Router */}
        <div className="flex-1 p-8 overflow-y-auto bg-black">
          <div className="w-full mx-auto h-full">
            <div className={activeTab === "Pomodoro" ? "block h-full" : "hidden"}>
              <PomodoroTab appState={appState} onSave={saveCloudData} />
            </div>

            {activeTab === "Master Log" && <MasterLogTab appState={appState} onSave={saveCloudData} />}
            {activeTab === "Backlog" && <BacklogTab appState={appState} onSave={saveCloudData} />}
            {activeTab === "Analytics" && <AnalyticsTab appState={appState} />}
            {activeTab === "Calendar" && <CalendarTab appState={appState} />}
            {activeTab === "Timelapse" && <TimelapseTab appState={appState} />}
            {activeTab === "Films" && <FilmsTab appState={appState} />}
            {activeTab === "Books" && <BooksTab appState={appState} />}
            {activeTab === "Language" && <LanguageTab appState={appState} />}
          </div>
        </div>

      </div>
    </div>
  );
}
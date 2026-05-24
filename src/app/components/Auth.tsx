"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault(); // Stops the browser from refreshing the page!
    setLoading(true);
    setMessage("");

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setMessage(error.message);
      else setMessage("Account created! You can now log in.");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-slate-100 p-4">
      <div className="w-full max-w-md bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-700">
        <h1 className="text-3xl font-bold text-center mb-6">Study Tracker</h1>
        
        {/* The Tabs */}
        <div className="flex mb-6 border-b border-slate-700">
          <button 
            className={`flex-1 pb-2 font-semibold transition-colors ${isLogin ? 'text-green-500 border-b-2 border-green-500' : 'text-slate-400 hover:text-slate-200'}`}
            onClick={() => {setIsLogin(true); setMessage("");}}
          >
            Login
          </button>
          <button 
            className={`flex-1 pb-2 font-semibold transition-colors ${!isLogin ? 'text-green-500 border-b-2 border-green-500' : 'text-slate-400 hover:text-slate-200'}`}
            onClick={() => {setIsLogin(false); setMessage("");}}
          >
            Create Account
          </button>
        </div>

        {/* The Form */}
        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 focus:outline-none focus:border-green-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 focus:outline-none focus:border-green-500"
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded mt-2 transition-colors disabled:opacity-50"
          >
            {loading ? "Loading..." : (isLogin ? "Login" : "Sign Up")}
          </button>
        </form>

        {/* Status Messages */}
        {message && (
          <div className={`mt-4 p-3 rounded text-sm text-center ${message.includes("created") ? "bg-green-900/50 text-green-400 border border-green-800" : "bg-red-900/50 text-red-400 border border-red-800"}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
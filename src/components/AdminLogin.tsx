import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Activity, ArrowLeft } from "lucide-react";
import axios from "axios";

export default function AdminLogin({ onLoginSuccess }: { onLoginSuccess: (user: any) => void }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@smartcare.org");
  const [password, setPassword] = useState("adminpassword");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post("/api/auth/login", {
        email,
        password,
        role: "ADMIN"
      });
      onLoginSuccess(res.data.user);
      navigate("/admin/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid administrator credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Back button layer */}
      <div className="absolute top-6 left-6 z-50">
        <Link to="/" className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-brand-primary transition-colors bg-white/80 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200/50 shadow-xs">
          <ArrowLeft size={14} /> Back to Home
        </Link>
      </div>

      {/* Left Image Area */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-50 overflow-hidden border-r border-slate-100">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 via-indigo-100/20 to-white/60 z-10 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent z-10" />
        <img 
          src="https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?q=80&w=2676&auto=format&fit=crop" 
          alt="Server dashboard and statistics" 
          className="absolute inset-0 object-cover w-full h-full opacity-90"
          referrerPolicy="no-referrer"
        />
        <div className="absolute bottom-16 left-16 right-16 z-20 text-slate-900">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/80 backdrop-blur-sm border border-slate-200 text-sm font-medium mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-brand-primary shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
            Infrastructure Control
          </div>
          <h3 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Enterprise Level<br/>Management.</h3>
          <p className="text-lg text-slate-700 leading-relaxed max-w-lg font-medium">Full access control, granular analytics, and comprehensive operational tools to manage your entire healthcare infrastructure.</p>
        </div>
      </div>

      {/* Right Form Area */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 border-r border-slate-100 relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8 space-y-6 text-center shadow-brand-primary/5"
        >
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-1.5 font-bold text-xl tracking-tight text-slate-900">
              <Activity size={20} className="text-brand-primary" />
              <span>SmartCare <span className="text-slate-500 font-medium">Admin</span></span>
            </div>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-slate-900 font-sans">System Administration</h2>
            <p className="text-slate-500 text-sm">Secure operation configurations</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-650 rounded-xl border border-red-100 text-xs font-semibold text-left">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-sm font-medium text-slate-900">Admin Email</label>
              <div className="mt-1.5">
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all text-slate-800 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900">Master Password</label>
              <div className="mt-1.5">
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all text-slate-800 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-4 bg-brand-primary hover:bg-brand-secondary disabled:opacity-75 text-white font-semibold text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? "Authenticating..." : "Establish Secure Session"}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

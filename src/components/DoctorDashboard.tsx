import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import AiAssistant from "./AiAssistant";
import {
  Activity,
  Calendar,
  Clock,
  User,
  LogOut,
  CheckCircle,
  XCircle,
  ArrowRight,
  TrendingUp,
  Award,
  Users,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  Trash2
} from "lucide-react";
import axios from "axios";
import { Appointment, Doctor } from "../types";

const sidebarContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    }
  }
};

const sidebarItemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 120, damping: 15 } }
};

const contentVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } }
};

const cardsContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    }
  }
};

const cardItemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 14 } }
};

export default function DoctorDashboard({ doctorUser, onLogout }: { doctorUser: any; onLogout: () => void }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"summary" | "appointments" | "patients" | "history" | "profile">("summary");
  
  // States
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [docProfile, setDocProfile] = useState<Doctor | null>(null);
  const [currentQueueToken, setCurrentQueueToken] = useState<number>(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDoctorData = async () => {
    try {
      // Fetch appointments for this doctor
      const apptsRes = await axios.get(`/api/appointments?role=DOCTOR&doctorId=${doctorUser.id}`);
      setAppointments(apptsRes.data);

      // Get resident doctors list to search for own profile bio
      const docsRes = await axios.get("/api/doctors");
      const found = docsRes.data.find((d: Doctor) => d.id === doctorUser.id);
      if (found) {
        setDocProfile(found);
      }

      // Fetch running queue token status
      const queueRes = await axios.get(`/api/queue/status/${doctorUser.id}`);
      setCurrentQueueToken(queueRes.data.currentRunningToken);
    } catch (err) {
      console.error("Error loaded doctor statistics", err);
    }
  };

  useEffect(() => {
    fetchDoctorData();
  }, [doctorUser]);

  const handleUpdateStatus = async (apptId: string, nextStatus: 'APPROVED' | 'Confirmed' | 'Checked-in' | 'CANCELLED' | 'COMPLETED') => {
    setActionLoading(apptId);
    try {
      await axios.put(`/api/appointments/${apptId}/status`, { status: nextStatus });
      await fetchDoctorData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAdvanceQueue = async () => {
    try {
      const res = await axios.post(`/api/queue/next/${doctorUser.id}`);
      setCurrentQueueToken(res.data.currentRunningToken);
      fetchDoctorData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetQueue = async () => {
    if (!confirm("Are you sure you want to reset today's queue status to token #1?")) return;
    try {
      const res = await axios.post(`/api/queue/reset/${doctorUser.id}`);
      setCurrentQueueToken(res.data.currentRunningToken);
      fetchDoctorData();
    } catch (err) {
      console.error(err);
    }
  };

  // Filter computations
  const todayStr = new Date().toISOString().split("T")[0];
  const todaysAppointments = appointments.filter((a) => a.date === todayStr);
  const approvedToday = todaysAppointments.filter((a) => a.status === "APPROVED" || a.status === "Confirmed" || a.status === "Checked-in");
  const completedCount = appointments.filter((a) => a.status === "COMPLETED").length;
  const waitingPatients = todaysAppointments.filter((a) => (a.status === "APPROVED" || a.status === "Confirmed" || a.status === "Checked-in") && a.tokenNumber > currentQueueToken);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Sidebar navigation */}
      <aside className="w-full lg:w-72 bg-slate-900 text-white flex flex-col shrink-0 text-left">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <span className="p-1 bg-emerald-600 text-white rounded-lg">
              <Activity size={18} />
            </span>
            <span>Smart<span className="text-emerald-400">Care</span></span>
          </Link>
          <span className="px-2 py-0.5 bg-emerald-500/20 rounded text-[10px] text-emerald-400 font-bold">PHYSICIAN</span>
        </div>

        <div className="p-6 border-b border-white/5 bg-white/5 flex items-center gap-3">
          <img
            src={docProfile?.imageUrl || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face"}
            alt="Doctor"
            className="w-10 h-10 rounded-full object-cover border border-emerald-555"
          />
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-slate-100 truncate">{doctorUser?.name || "Dr. Staff"}</p>
            <p className="text-[10px] text-slate-450 truncate">{docProfile?.specialization || "Generalist"}</p>
          </div>
        </div>

        <motion.nav 
          variants={sidebarContainerVariants}
          initial="hidden"
          animate="visible"
          className="flex-1 p-4 space-y-1"
        >
          <motion.button
            variants={sidebarItemVariants}
            onClick={() => setActiveTab("summary")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer ${activeTab === "summary" ? "bg-emerald-600 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
          >
            <Activity size={16} /> Clinical Summary
          </motion.button>
          <motion.button
            variants={sidebarItemVariants}
            onClick={() => setActiveTab("appointments")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer ${activeTab === "appointments" ? "bg-emerald-600 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
          >
            <Calendar size={16} /> Today's Waitlist
          </motion.button>
          <motion.button
            variants={sidebarItemVariants}
            onClick={() => setActiveTab("patients")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer ${activeTab === "patients" ? "bg-emerald-600 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
          >
            <Users size={16} /> Outpatient Matrix
          </motion.button>
          <motion.button
            variants={sidebarItemVariants}
            onClick={() => setActiveTab("history")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer ${activeTab === "history" ? "bg-emerald-600 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
          >
            <Clock size={16} /> Diagnostic Logs
          </motion.button>
          <motion.button
            variants={sidebarItemVariants}
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer ${activeTab === "profile" ? "bg-emerald-600 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
          >
            <User size={16} /> Professional Bio
          </motion.button>
        </motion.nav>

        <div className="p-4 border-t border-white/5">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider text-rose-450 hover:bg-rose-500/10 transition-colors cursor-pointer text-rose-350">
            <LogOut size={16} /> Logout Staff
          </button>
        </div>
      </aside>

      {/* Main dashboard panel */}
      <main className="flex-1 p-6 md:p-10 space-y-8 overflow-y-auto max-h-screen text-left">
        {/* Banner greeting */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-sans text-slate-900 tracking-tight">Clinical Console</h1>
            <p className="text-slate-400 text-xs mt-0.5">Welcome, {doctorUser?.name || "Doctor"}. Track your calling queue instantly.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdvanceQueue}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw size={13} /> Advance Queue Token
            </button>
            <button
              onClick={handleResetQueue}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-xl transition-all cursor-pointer"
            >
              Reset to #1
            </button>
          </div>
        </header>

        {activeTab === "summary" && (
          <motion.div 
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* KPI Cards */}
            <motion.div 
              variants={cardsContainerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <motion.div variants={cardItemVariants} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <span className="p-3 bg-emerald-100/30 text-emerald-600 rounded-xl shrink-0">
                  <Calendar size={20} />
                </span>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Today's Booked</p>
                  <p className="text-2xl font-black text-slate-850 mt-0.5">{todaysAppointments.length} Outpatients</p>
                </div>
              </motion.div>

              <motion.div variants={cardItemVariants} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <span className="p-3 bg-indigo-50/55 text-indigo-600 rounded-xl shrink-0">
                  <Users size={20} />
                </span>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Waiting in Desk</p>
                  <p className="text-2xl font-black text-slate-850 mt-0.5">{waitingPatients.length} Ahead</p>
                </div>
              </motion.div>

              <motion.div variants={cardItemVariants} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <span className="p-3 bg-amber-500/10 text-amber-500 rounded-xl shrink-0">
                  <CheckCircle size={20} />
                </span>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-semibold">Completed Visits</p>
                  <p className="text-2xl font-black text-slate-850 mt-0.5">{completedCount} Patients</p>
                </div>
              </motion.div>

              <motion.div variants={cardItemVariants} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <span className="p-3 bg-rose-500/10 text-rose-500 rounded-xl shrink-0">
                  <Activity size={20} />
                </span>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-semibold">Active Token Line</p>
                  <p className="text-2xl font-black text-emerald-600 mt-0.5">#{currentQueueToken}</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Main waiting room rows */}
            <motion.div 
              variants={cardsContainerVariants}
              initial="hidden"
              animate="visible"
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                <h3 className="text-sm font-bold text-slate-800 tracking-tight uppercase">Active Lobby Waitlist Slots</h3>
                <span className="px-2.5 py-0.5 bg-brand-primary/10 rounded-full text-[10px] font-bold text-brand-primary">Lobby Active</span>
              </div>

              <div className="space-y-4">
                {todaysAppointments.filter((a) => a.status === "PENDING" || a.status === "APPROVED" || a.status === "Confirmed" || a.status === "Checked-in").length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No active appointments waiting in the clinic queue lobby for you today.
                  </div>
                ) : (
                  todaysAppointments
                    .filter((a) => a.status === "PENDING" || a.status === "APPROVED" || a.status === "Confirmed" || a.status === "Checked-in")
                    .map((app) => (
                      <motion.div variants={cardItemVariants} key={app.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-800 text-sm">{app.patientName}</h4>
                            <span className="text-[10px] text-slate-400">({app.patientAge} years, {app.patientGender})</span>
                          </div>
                          <p className="text-xs text-slate-500 font-semibold">Token Rank: <span className="text-brand-primary">#{app.tokenNumber}</span> | Reason: "{app.reason}"</p>
                          <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded leading-none ${app.status === 'APPROVED' || app.status === 'Confirmed' || app.status === 'Checked-in' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"}`}>
                            {app.status === 'APPROVED' || app.status === 'Confirmed' ? "Approved (Waiting Queue)" : app.status === 'Checked-in' ? "Checked-In" : "Pending Admin Review"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {app.status === "PENDING" && (
                            <button
                              onClick={() => handleUpdateStatus(app.id, "APPROVED")}
                              disabled={actionLoading === app.id}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                            >
                              Approve Waitlist
                            </button>
                          )}
                          
                          {(app.status === "APPROVED" || app.status === "Confirmed" || app.status === "Checked-in") && app.tokenNumber === currentQueueToken && (
                            <button
                              onClick={() => handleUpdateStatus(app.id, "COMPLETED")}
                              disabled={actionLoading === app.id}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <CheckCircle size={12} /> Complete Consultation
                            </button>
                          )}

                          <button
                            onClick={() => handleUpdateStatus(app.id, "CANCELLED")}
                            disabled={actionLoading === app.id}
                            className="px-3 py-1.5 border border-red-100 text-red-650 hover:bg-red-50 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                          >
                            Decline/Cancel Slot
                          </button>
                        </div>
                      </motion.div>
                    ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {activeTab === "appointments" && (
          <motion.div 
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6"
          >
            <div>
              <h2 className="text-lg font-bold text-slate-850">Lobby Registry Dashboard</h2>
              <p className="text-xs text-slate-400 mt-0.5">Control patient flows, finalize appointments, and manage room waitlists.</p>
            </div>

            <div className="space-y-4">
              {appointments.filter((a) => a.date === todayStr).length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No appointments booked for today.
                </div>
              ) : (
                appointments
                  .filter((a) => a.date === todayStr)
                  .map((app) => (
                    <div key={app.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/40 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{app.patientName}</p>
                        <p className="text-xs text-slate-400">Token Number: #{app.tokenNumber} | Reason: {app.reason}</p>
                        <p className="text-[10px] uppercase font-bold text-brand-primary mt-1">Status: {app.status}</p>
                      </div>

                      <div className="flex gap-2">
                        {app.status === "PENDING" && (
                          <button
                            onClick={() => handleUpdateStatus(app.id, "APPROVED")}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold"
                          >
                            Approve
                          </button>
                        )}
                        {app.status === "APPROVED" && (
                          <button
                            onClick={() => handleUpdateStatus(app.id, "COMPLETED")}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-850 text-white rounded text-xs font-bold"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "patients" && (
          <motion.div 
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6"
          >
            <div>
              <h2 className="text-lg font-bold text-slate-850">Your Scheduled Patients</h2>
              <p className="text-xs text-slate-400 mt-0.5 font-normal">Active outpatients mapped onto your specialty dashboard.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {appointments.length === 0 ? (
                <div className="col-span-2 text-center py-10 text-slate-400 text-xs">
                  No active outpatients documented in your records yet.
                </div>
              ) : (
                Array.from(new Set(appointments.map(a => a.patientId))).map(pId => {
                  const representativeAppt = appointments.find(a => a.patientId === pId);
                  return (
                    <div key={pId} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                          {representativeAppt?.patientName?.charAt(0) || "P"}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-800">{representativeAppt?.patientName || "Unknown Patient"}</h4>
                          <p className="text-[10px] text-slate-400">Gender: {representativeAppt?.patientGender} | Age: {representativeAppt?.patientAge} yrs</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 font-medium bg-white/70 p-2 rounded border border-slate-100">
                        Consulted on latest: {representativeAppt?.date} ({representativeAppt?.reason})
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "history" && (
          <motion.div 
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6"
          >
            <div>
              <h2 className="text-lg font-bold text-slate-850">Diagnostic Session logs</h2>
              <p className="text-xs text-slate-400 mt-0.5 font-normal">All previous outpatient profiles that have successfully concluded.</p>
            </div>

            <div className="space-y-4">
              {appointments.filter((a) => a.status === "COMPLETED").length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No completed consultations yet.
                </div>
              ) : (
                appointments
                  .filter((a) => a.status === "COMPLETED")
                  .map((app) => (
                    <div key={app.id} className="p-4 rounded-xl bg-emerald-50/10 border border-emerald-100/50 flex justify-between items-center text-xs">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-805">{app.patientName}</p>
                        <p className="text-slate-450">Session Date: {app.date} | Consultation: "{app.reason}"</p>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded font-bold text-[10px] uppercase">Concluded</span>
                    </div>
                  ))
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "profile" && (
          <motion.div 
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6"
          >
            <div className="border-b border-slate-50 pb-4">
              <h3 className="text-base font-bold text-slate-850 leading-tight">Professional Bio Information</h3>
              <p className="text-xs text-slate-400">These details are shown publicly on the homepage scheduler.</p>
            </div>

            {docProfile ? (
              <div className="space-y-6">
                <div className="flex gap-4 items-center">
                  <img
                    src={docProfile.imageUrl}
                    alt={docProfile.name}
                    className="w-20 h-20 rounded-2xl object-cover ring-4 ring-emerald-50"
                  />
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{docProfile.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{docProfile.specialization} Speciality Desk</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-500">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest leading-none">Experience</p>
                    <p className="text-base font-bold text-slate-800 mt-1.5">{docProfile.experience} Years Active</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest leading-none">Office Hours</p>
                    <p className="text-base font-bold text-slate-800 mt-1.5">{docProfile.availability}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div>Loading profile statistics...</div>
            )}
          </motion.div>
        )}
      </main>
      <AiAssistant />
    </div>
  );
}

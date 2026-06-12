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
  Users,
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  Mail,
  Sliders,
  CheckCircle,
  AlertTriangle,
  Send,
  Check,
  RefreshCw
} from "lucide-react";
import axios from "axios";
import { Appointment, Doctor, Patient, EmailLog } from "../types";
import { emailService } from "../services/emailService";
import { QueueCardView } from "./QueueCardView";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

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

export default function AdminDashboard({ adminUser, onLogout }: { adminUser: any; onLogout: () => void }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"summary" | "doctors" | "patients" | "appointments" | "queue" | "notifs">("summary");

  // State
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [emails, setEmails] = useState<EmailLog[]>([]);

  // Search parameters
  const [patientSearch, setPatientSearch] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");

  // Create/Edit doctor modal/form state
  const [showDocForm, setShowDocForm] = useState(false);
  const [docForm, setDocForm] = useState({
    id: "",
    name: "",
    email: "",
    password: "password123",
    specialization: "General Medicine" as any,
    experience: 8,
    availability: "09:00 AM - 10:00 PM"
  });

  // Edit patient modal/form state
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  // Reschedule state
  const [reschedulingAppt, setReschedulingAppt] = useState<Appointment | null>(null);
  const [rescheduleData, setRescheduleData] = useState({ date: "", time: "09:00 AM" });

  // EmailJS Integration states persistently loaded from servers
  const [emailKeys, setEmailKeys] = useState({
    serviceId: "",
    templateId: "",
    publicKey: "",
    privateKey: "",
    receiverEmail: "poojitalakkakula09@gmail.com",
    isEnabled: true
  });
  const [formPrivateKey, setFormPrivateKey] = useState("");
  const [testerEmail, setTesterEmail] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchEmailJSSettings = async () => {
    try {
      const res = await axios.get("/api/settings/emailjs");
      setEmailKeys(res.data);
      setFormPrivateKey(res.data.privateKey);
      setTesterEmail(res.data.receiverEmail || "poojitalakkakula09@gmail.com");
    } catch (err) {
      console.error("Failed to load backend EmailJS settings", err);
    }
  };

  const saveEmailSettings = async () => {
    setSaveResult(null);
    try {
      const payload = {
        ...emailKeys,
        privateKey: formPrivateKey,
        receiverEmail: testerEmail
      };
      const res = await axios.post("/api/settings/emailjs", payload);
      if (res.data.success) {
        setEmailKeys(res.data.settings);
        setFormPrivateKey(res.data.settings.privateKey);
        setSaveResult({ success: true, message: "EmailJS persistence configurations saved successfully!" });
        
        // Dynamic fallback initialization in current browser session
        emailService.configure({
          serviceId: res.data.settings.serviceId,
          templateId: res.data.settings.templateId,
          publicKey: res.data.settings.publicKey
        });
      }
    } catch (err: any) {
      setSaveResult({ success: false, message: err?.response?.data?.error || "Failed to update EmailJS configurations." });
    }
  };

  const triggerEmailJSTest = async () => {
    if (!testerEmail) {
      setTestResult({ success: false, message: "Please enter a valid receiver email to trigger the connection test." });
      return;
    }
    setTestLoading(true);
    setTestResult(null);
    try {
      // Automatically save first
      const payload = {
        ...emailKeys,
        privateKey: formPrivateKey,
        receiverEmail: testerEmail
      };
      await axios.post("/api/settings/emailjs", payload);
      
      const res = await axios.post("/api/settings/emailjs/test", { testEmail: testerEmail });
      if (res.data.success) {
        setTestResult({ success: true, message: res.data.message });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.response?.data?.error || err?.message || "EmailJS diagnostic test failed. Verify access credentials."
      });
    } finally {
      setTestLoading(false);
    }
  };

  const handleKeyChange = (key: "serviceId" | "templateId" | "publicKey" | "receiverEmail", value: string) => {
    setEmailKeys((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const clearEmailJSKeys = () => {
    setEmailKeys({
      serviceId: "",
      templateId: "",
      publicKey: "",
      privateKey: "",
      receiverEmail: "poojitalakkakula09@gmail.com",
      isEnabled: true
    });
    setFormPrivateKey("");
    setTestResult(null);
    setSaveResult(null);
  };

  const loadAllAdminData = async () => {
    try {
      const docRes = await axios.get("/api/doctors");
      setDoctors(docRes.data);

      const patRes = await axios.get("/api/patients");
      setPatients(patRes.data);

      const apptsRes = await axios.get("/api/appointments");
      setAppointments(apptsRes.data);

      const emailRes = await axios.get("/api/emails");
      setEmails(emailRes.data);

      await fetchEmailJSSettings();
    } catch (err) {
      console.error("Failed loading data", err);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const handleCreateOrUpdateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (docForm.id) {
        // Edit
        await axios.put(`/api/doctors/${docForm.id}`, docForm);
      } else {
        // Create
        await axios.post("/api/doctors", docForm);
      }
      setShowDocForm(false);
      setDocForm({ id: "", name: "", email: "", password: "password123", specialization: "General Medicine", experience: 8, availability: "09:00 AM - 10:00 PM" });
      loadAllAdminData();
    } catch (err: any) {
      alert(err.response?.data?.error || "Error modifying doctor roster.");
    }
  };

  const handleDoctorEditClick = (doc: Doctor) => {
    setDocForm({
      id: doc.id,
      name: doc.name,
      email: doc.email,
      password: "", // hide password
      specialization: doc.specialization,
      experience: doc.experience,
      availability: doc.availability
    });
    setShowDocForm(true);
  };

  const handleDoctorDelete = async (docId: string) => {
    if (!confirm("Are you sure you want to remove this doctor from the registry?")) return;
    try {
      await axios.delete(`/api/doctors/${docId}`);
      loadAllAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePatientEditClick = (pat: Patient) => {
    setEditingPatient(pat);
  };

  const handlePatientUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;
    try {
      await axios.put(`/api/patients/${editingPatient.id}`, editingPatient);
      setEditingPatient(null);
      loadAllAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePatientDelete = async (patId: string) => {
    if (!confirm("Are you sure you want to remove this patient file?")) return;
    try {
      await axios.delete(`/api/patients/${patId}`);
      loadAllAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusUpdate = async (apptId: string, status: string) => {
    try {
      await axios.put(`/api/appointments/${apptId}/status`, { status });
      loadAllAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedulingAppt) return;
    try {
      await axios.put(`/api/appointments/${reschedulingAppt.id}/reschedule`, rescheduleData);
      setReschedulingAppt(null);
      loadAllAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdvanceQueue = async (doctorId: string) => {
    try {
      await axios.post(`/api/queue/next/${doctorId}`);
      loadAllAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetQueue = async (doctorId: string) => {
    try {
      await axios.post(`/api/queue/reset/${doctorId}`);
      loadAllAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  // Filter lists based on search
  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.email.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const filteredDoctors = doctors.filter(
    (d) =>
      d.name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
      d.specialization.toLowerCase().includes(doctorSearch.toLowerCase())
  );

  const apptStatsData = [
    { name: 'Pending', count: appointments.filter(a => a.status === 'PENDING').length },
    { name: 'Approved', count: appointments.filter(a => a.status === 'APPROVED' || a.status === 'Confirmed').length },
    { name: 'Checked-in', count: appointments.filter(a => a.status === 'Checked-in').length },
    { name: 'Cancelled', count: appointments.filter(a => a.status === 'CANCELLED').length },
  ];

  const specCounts = doctors.reduce((acc, doc) => {
    acc[doc.specialization] = (acc[doc.specialization] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const docSpecData = Object.keys(specCounts).map(spec => ({ name: spec, value: specCounts[spec] }));
  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4'];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Sidebar navigation */}
      <aside className="w-full lg:w-72 bg-slate-900 text-white flex flex-col shrink-0 text-left">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <span className="p-1 bg-slate-800 text-white rounded-lg">
              <Activity size={18} />
            </span>
            <span>Smart<span className="text-white/60">Care</span></span>
          </Link>
          <span className="px-2 py-0.5 bg-slate-700/50 text-slate-300 rounded text-[10px] font-bold">ADMIN</span>
        </div>

        <div className="p-6 border-b border-white/5 bg-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-850 flex items-center justify-center font-bold text-white shrink-0">
            A
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100">{adminUser?.name || "Administrator"}</p>
            <p className="text-[10px] text-slate-450 uppercase tracking-widest mt-0.5 font-bold">General manager</p>
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
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer ${activeTab === "summary" ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
          >
            <Activity size={16} /> Console Core
          </motion.button>
          <motion.button
            variants={sidebarItemVariants}
            onClick={() => setActiveTab("doctors")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer ${activeTab === "doctors" ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
          >
            <ShieldCheck size={16} /> Dr. Management
          </motion.button>
          <motion.button
            variants={sidebarItemVariants}
            onClick={() => setActiveTab("patients")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer ${activeTab === "patients" ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
          >
            <Users size={16} /> Patient Matrix
          </motion.button>
          <motion.button
            variants={sidebarItemVariants}
            onClick={() => setActiveTab("appointments")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer ${activeTab === "appointments" ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
          >
            <Calendar size={16} /> Appointment Desk
          </motion.button>
          <motion.button
            variants={sidebarItemVariants}
            onClick={() => setActiveTab("queue")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer ${activeTab === "queue" ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
          >
            <Clock size={16} /> Queue Monitors
          </motion.button>
          <motion.button
            variants={sidebarItemVariants}
            onClick={() => setActiveTab("notifs")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer ${activeTab === "notifs" ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
          >
            <Mail size={16} /> Email Logs
          </motion.button>
        </motion.nav>

        <div className="p-4 border-t border-white/5">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider text-rose-455 hover:bg-rose-500/10 transition-colors cursor-pointer text-rose-350">
            <LogOut size={16} /> Exit Superuser
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 p-6 md:p-10 space-y-8 overflow-y-auto max-h-screen text-left">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-sans text-slate-900 tracking-tight">Superuser Operations</h1>
            <p className="text-slate-400 text-xs mt-0.5">Comprehensive diagnostic controls, doctor allocations, and real-time email logs tracking.</p>
          </div>
          <div className="flex gap-2 text-xs font-semibold text-slate-500 bg-white border border-slate-150 p-2.5 rounded-xl shadow-xs">
            Admin Database Status: <span className="text-emerald-600 font-bold">Synchronised</span>
          </div>
        </header>

        {activeTab === "summary" && (
          <motion.div 
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* KPI Metrics */}
            <motion.div 
              variants={cardsContainerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <motion.div variants={cardItemVariants} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <span className="p-3 bg-brand-primary/10 text-brand-primary rounded-xl shrink-0">
                  <Users size={20} />
                </span>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Registered Patients</p>
                  <p className="text-2xl font-black text-slate-800 mt-1.5">{patients.length} Patient files</p>
                </div>
              </motion.div>

              <motion.div variants={cardItemVariants} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <span className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl shrink-0">
                  <ShieldCheck size={20} />
                </span>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Resident Clinicians</p>
                  <p className="text-2xl font-black text-slate-800 mt-1.5">{doctors.length} Doctors</p>
                </div>
              </motion.div>

              <motion.div variants={cardItemVariants} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <span className="p-3 bg-amber-500/10 text-amber-500 rounded-xl shrink-0">
                  <Calendar size={20} />
                </span>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Schedule Roster</p>
                  <p className="text-2xl font-black text-slate-800 mt-1.5">{appointments.length} Bookings</p>
                </div>
              </motion.div>

              <motion.div variants={cardItemVariants} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <span className="p-3 bg-violet-500/10 text-violet-500 rounded-xl shrink-0">
                  <Clock size={20} />
                </span>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Today's Active Queue</p>
                  <p className="text-2xl font-black text-slate-800 mt-1.5">
                    {appointments.filter(a => a.date === new Date().toISOString().split("T")[0] && a.status === "APPROVED").length} Tokens
                  </p>
                </div>
              </motion.div>
            </motion.div>

            {/* Charts Section */}
            <motion.div
              variants={cardsContainerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <motion.div variants={cardItemVariants} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center">
                <div className="w-full mb-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Appointments Overview</h3>
                </div>
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={apptStatsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                      <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              <motion.div variants={cardItemVariants} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center">
                <div className="w-full mb-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Doctor Specialties</h3>
                </div>
                <div className="w-full h-64">
                  {docSpecData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={docSpecData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          {docSpecData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-medium">No doctors registered</div>
                  )}
                </div>
              </motion.div>
            </motion.div>

            {/* Quick action grid */}
            <motion.div 
              variants={cardsContainerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"
            >
              <motion.div variants={cardItemVariants} className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Admin Commands</h3>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => { setDocForm({ id: "", name: "", email: "", password: "password123", specialization: "General Medicine", experience: 8, availability: "09:00 AM - 10:00 PM" }); setShowDocForm(true); setActiveTab("doctors"); }} className="px-4 py-2.5 bg-brand-primary text-white font-semibold text-xs rounded-xl hover:bg-brand-secondary transition-colors cursor-pointer flex items-center gap-1.5">
                    <Plus size={14} /> Add Clinician
                  </button>
                  <button onClick={() => setActiveTab("appointments")} className="px-4 py-2.5 bg-slate-900 text-white font-semibold text-xs rounded-xl hover:bg-slate-850 transition-colors cursor-pointer">
                    Appoint Desk Review
                  </button>
                  <button onClick={() => setActiveTab("queue")} className="px-4 py-2.5 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                    Live Queue Control
                  </button>
                </div>
              </motion.div>

              <motion.div variants={cardItemVariants} className="space-y-2 text-xs text-slate-500 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Administrative Guidelines</p>
                <p className="leading-relaxed leading-normal mt-1">SmartCare platform coordinates outpatient tokens smoothly. Ensure approved appointments have assigned token ranks. Use the Queue monitors tab to reset or manually cycle doctor lines.</p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {activeTab === "doctors" && (
          <motion.div 
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <div>
                <h3 className="text-base font-bold text-slate-800">Doctor Registry</h3>
                <p className="text-xs text-slate-400 mt-0.5">Control hospital resident doctors, modify clinic hours, and add specialists.</p>
              </div>
              <button
                onClick={() => {
                  setDocForm({ id: "", name: "", email: "", password: "password123", specialization: "General Medicine", experience: 8, availability: "08:00 AM - 10:00 PM" });
                  setShowDocForm(true);
                }}
                className="px-4 py-2 bg-brand-primary hover:bg-brand-secondary text-white font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus size={14} /> Register Doctor
              </button>
            </div>

            {showDocForm && (
              <div className="bg-white p-6 rounded-2xl border border-blue-100/50 shadow-lg space-y-4 max-w-xl">
                <h3 className="text-sm font-bold text-slate-800">{docForm.id ? "Edit Doctor Bio" : "Register Doctor Form"}</h3>
                <form onSubmit={handleCreateOrUpdateDoctor} className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 font-semibold uppercase">Doctor name</label>
                      <input required type="text" placeholder="Dr. Linda Lovelace" value={docForm.name} onChange={(e) => setDocForm({ ...docForm, name: e.target.value })} className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold uppercase">Specialty email</label>
                      <input required type="email" placeholder="linda@smartcare.org" value={docForm.email} onChange={(e) => setDocForm({ ...docForm, email: e.target.value })} className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                  </div>

                  {!docForm.id && (
                    <div>
                      <label className="block text-slate-400 font-semibold uppercase">Default password</label>
                      <input required type="text" value={docForm.password} onChange={(e) => setDocForm({ ...docForm, password: e.target.value })} className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-400 font-semibold uppercase">Department</label>
                      <select value={docForm.specialization} onChange={(e) => setDocForm({ ...docForm, specialization: e.target.value as any })} className="w-full mt-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                        <option value="Cardiology">Cardiology</option>
                        <option value="Neurology">Neurology</option>
                        <option value="Orthopedics">Orthopedics</option>
                        <option value="Dermatology">Dermatology</option>
                        <option value="Pediatrics">Pediatrics</option>
                        <option value="General Medicine">General Medicine</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold uppercase">Exp (yrs)</label>
                      <input type="number" value={docForm.experience} onChange={(e) => setDocForm({ ...docForm, experience: Number(e.target.value) })} className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-250 rounded-xl" />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold uppercase">Availability hours</label>
                      <input type="text" placeholder="09:00 AM - 10:00 PM" value={docForm.availability} onChange={(e) => setDocForm({ ...docForm, availability: e.target.value })} className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold">Save Doctor</button>
                    <button type="button" onClick={() => setShowDocForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600">Cancel</button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-50">
                <input
                  type="text"
                  placeholder="Filter doctor roster..."
                  value={doctorSearch}
                  onChange={(e) => setDoctorSearch(e.target.value)}
                  className="w-full max-w-sm px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100 select-none text-[10px] tracking-wider">
                      <th className="p-4">Name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Department</th>
                      <th className="p-4">Availability</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDoctors.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-bold text-slate-800">{doc.name}</td>
                        <td className="p-4 text-slate-500">{doc.email}</td>
                        <td className="p-4"><span className="px-2 py-0.5 bg-brand-primary/10 text-brand-primary text-[10px] font-bold rounded-full">{doc.specialization}</span></td>
                        <td className="p-4 text-slate-500">{doc.availability}</td>
                        <td className="p-4 text-right">
                          <button onClick={() => handleDoctorEditClick(doc)} className="p-1 px-2.5 text-slate-600 font-bold hover:text-brand-primary leading-none">Edit</button>
                          <button onClick={() => handleDoctorDelete(doc.id)} className="p-1 px-2.5 text-rose-500 font-bold leading-none ml-2">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "patients" && (
          <motion.div 
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-base font-bold text-slate-800">Patient Matrix</h3>
              <p className="text-xs text-slate-400 mt-0.5">Edit outpatient records, audit diagnostic accounts, or remove directories.</p>
            </div>

            {editingPatient && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg space-y-4 max-w-xl">
                <h3 className="text-sm font-bold text-slate-800">Edit Patient file</h3>
                <form onSubmit={handlePatientUpdateSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 font-semibold uppercase">Patient name</label>
                    <input type="text" value={editingPatient.name} onChange={(e) => setEditingPatient({ ...editingPatient, name: e.target.value })} className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 font-semibold uppercase">Phone</label>
                      <input type="text" value={editingPatient.phone} onChange={(e) => setEditingPatient({ ...editingPatient, phone: e.target.value })} className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold uppercase">Age</label>
                      <input type="number" value={editingPatient.age ?? 30} onChange={(e) => setEditingPatient({ ...editingPatient, age: Number(e.target.value) })} className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold">Update File</button>
                    <button type="button" onClick={() => setEditingPatient(null)} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600">Cancel</button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-50">
                <input
                  type="text"
                  placeholder="Search patient database..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="w-full max-w-sm px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100 text-[10px]">
                      <th className="p-4">Name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Phone</th>
                      <th className="p-4">Age / Gender</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPatients.map((pat) => (
                      <tr key={pat.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-bold text-slate-800">{pat.name}</td>
                        <td className="p-4 text-slate-500">{pat.email}</td>
                        <td className="p-4 text-slate-500">{pat.phone}</td>
                        <td className="p-4 text-slate-500">{pat.age} yrs / {pat.gender}</td>
                        <td className="p-4 text-right">
                          <button onClick={() => handlePatientEditClick(pat)} className="p-1 px-2.5 text-slate-600 font-bold hover:text-brand-primary">Edit</button>
                          <button onClick={() => handlePatientDelete(pat.id)} className="p-1 px-2.5 text-rose-500 font-bold ml-2">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "appointments" && (
          <motion.div 
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-base font-bold text-slate-800">Appointment Management Desk</h3>
              <p className="text-xs text-slate-400 mt-0.5">Track diagnostic bookings, reschedule slots, and cancel review sessions.</p>
            </div>

            {reschedulingAppt && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg space-y-4 max-w-xl">
                <h3 className="text-sm font-bold text-slate-800">Reschedule Consultation</h3>
                <form onSubmit={handleRescheduleSubmit} className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 font-semibold uppercase">New Date</label>
                      <input type="date" min={new Date().toISOString().split("T")[0]} value={rescheduleData.date} onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })} className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold uppercase">Slot Time</label>
                      <input type="text" value={rescheduleData.time} onChange={(e) => setRescheduleData({ ...rescheduleData, time: e.target.value })} className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold">Apply Date</button>
                    <button type="button" onClick={() => setReschedulingAppt(null)} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600">Cancel</button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100 text-[10px]">
                      <th className="p-4">Patient</th>
                      <th className="p-4">Doctor Assigned</th>
                      <th className="p-4">Scheduled Info</th>
                      <th className="p-4">Token # / Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {appointments.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-bold text-slate-800">{app.patientName}</td>
                        <td className="p-4 text-slate-500 font-semibold">{app.doctorName} ({app.doctorSpecialization})</td>
                        <td className="p-4 text-slate-500">Date: {app.date} @ {app.time}</td>
                        <td className="p-4">
                          <span className="font-bold text-brand-primary">#{app.tokenNumber}</span>
                          <span className={`ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold ${app.status === 'APPROVED' || app.status === 'Confirmed' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : app.status === 'Checked-in' ? "bg-cyan-50 text-cyan-600 border border-cyan-100" : app.status === 'CANCELLED' ? "bg-red-50 text-red-600 border border-red-100" : "bg-amber-50 text-amber-600 border border-amber-100"}`}>{app.status}</span>
                        </td>
                        <td className="p-4 text-right flex gap-1 justify-end">
                          {app.status === "PENDING" && (
                            <button onClick={() => handleStatusUpdate(app.id, "APPROVED")} className="px-2 py-1 bg-emerald-600 text-white font-bold rounded text-[10px]">Approve</button>
                          )}
                          <button onClick={() => { setReschedulingAppt(app); setRescheduleData({ date: app.date, time: app.time }); }} className="px-2 py-1 border border-slate-200 text-slate-600 font-bold rounded text-[10px] hover:bg-slate-50">Reschedule</button>
                          <button onClick={() => handleStatusUpdate(app.id, "CANCELLED")} className="px-2 py-1 text-red-600 hover:bg-red-50 font-bold rounded text-[10px]">Decline</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "queue" && (
          <motion.div 
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-base font-bold text-slate-800">Specialty Queue Monitors</h3>
              <p className="text-xs text-slate-400 mt-0.5">Control live patient rooms, advance running tokens, or reset lines instantly.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {doctors.map((doc) => {
                const todayStr = new Date().toISOString().split("T")[0];
                const activeBookings = appointments.filter((a) => a.doctorId === doc.id && a.date === todayStr && a.status === "APPROVED");
                return (
                  <div key={doc.id} className="p-5 bg-white rounded-2xl border border-slate-150 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                      <div>
                        <h4 className="font-bold text-sm text-slate-800">{doc.name}</h4>
                        <p className="text-[10px] text-slate-400">{doc.specialization} Room | Lobby Hours: {doc.availability}</p>
                      </div>
                      <span className="px-2.5 py-0.5 bg-brand-primary/10 rounded-full text-[10px] font-bold text-brand-primary">Room {doc.id === 'doc_1' ? "1" : "3"}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-100">
                        <p className="text-[10px] text-slate-400 tracking-wider">Active Token Calling</p>
                        <p className="text-2xl font-black text-slate-800 mt-1">#1</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-100">
                        <p className="text-[10px] text-slate-400 tracking-wider">Waitlist Booked Today</p>
                        <p className="text-2xl font-black text-rose-500 mt-1">{activeBookings.length} Slot</p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-50">
                      <button onClick={() => handleAdvanceQueue(doc.id)} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1">
                        <RefreshCw size={12} /> Advance Line
                      </button>
                      <button onClick={() => handleResetQueue(doc.id)} className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50">
                        Reset To #1
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {activeTab === "notifs" && (
          <motion.div 
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start"
          >
            {/* Clinical Email Integration & Live Gmail Setup Panel */}
            <div className="xl:col-span-5 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <div>
                <h2 className="text-sm font-bold text-slate-850 uppercase tracking-tight flex items-center gap-2">
                  <Sliders className="text-brand-primary animate-pulse" size={16} />
                  <span>Clinical Email Setup</span>
                </h2>
                <p className="text-[10px] text-slate-400 mt-1">Configure live email delivery to deliver genuine medical passes to outpatients and receive notifications.</p>
              </div>

              {/* EmailJS Routing Configuration visual interfaces */}
              <div className="space-y-4">
                {/* Connection Status Banner */}
                <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
                  emailKeys.serviceId && emailKeys.templateId && emailKeys.publicKey 
                    ? "bg-emerald-50/50 border-emerald-100 text-emerald-800"
                    : "bg-amber-50/50 border-amber-100 text-amber-800"
                }`}>
                  {emailKeys.serviceId && emailKeys.templateId && emailKeys.publicKey ? (
                    <>
                      <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={15} />
                      <div>
                        <p className="font-extrabold uppercase tracking-wide text-[9px]">Active Connection Live</p>
                        <p className="mt-1 leading-normal text-[11px] font-normal text-slate-600">
                          Automated real-world transaction emails are currently dispatched live straight from the Node server using your active EmailJS parameters.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={15} />
                      <div>
                        <p className="font-extrabold uppercase tracking-wide text-[9px]">Simulated Mode Active</p>
                        <p className="mt-1 leading-normal text-[11px] font-normal text-slate-600">
                          Dynamic keys are lacking on this server. Clinic passes are recorded in the simulated inbox log below for testing. Supply yours below to enable actual dispatches!
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Main Fields Form */}
                <div className="space-y-4 pt-1">
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-450 uppercase tracking-wider">EmailJS Service ID</label>
                    <input
                      type="text"
                      value={emailKeys.serviceId}
                      onChange={(e) => handleKeyChange("serviceId", e.target.value)}
                      placeholder="e.g. service_xxxxxxx"
                      className="mt-1.5 w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:border-brand-primary/40 focus:bg-white outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-450 uppercase tracking-wider">EmailJS Template ID</label>
                    <input
                      type="text"
                      value={emailKeys.templateId}
                      onChange={(e) => handleKeyChange("templateId", e.target.value)}
                      placeholder="e.g. template_xxxxxxx"
                      className="mt-1.5 w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:border-brand-primary/40 focus:bg-white outline-none font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-450 uppercase tracking-wider">EmailJS Public Key</label>
                      <input
                        type="text"
                        value={emailKeys.publicKey}
                        onChange={(e) => handleKeyChange("publicKey", e.target.value)}
                        placeholder="e.g. user_xxxxxxxxxxxxxx"
                        className="mt-1.5 w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:border-brand-primary/40 focus:bg-white outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-450 uppercase tracking-wider">EmailJS Private Key (Optional)</label>
                      <input
                        type="password"
                        value={formPrivateKey}
                        onChange={(e) => setFormPrivateKey(e.target.value)}
                        placeholder="••••••••"
                        className="mt-1.5 w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:border-brand-primary/40 focus:bg-white outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4">
                    <label className="block text-[10px] font-black text-brand-primary uppercase tracking-wider">Admin Notification Inbox (Replication Copy)</label>
                    <input
                      type="email"
                      value={emailKeys.receiverEmail}
                      onChange={(e) => handleKeyChange("receiverEmail", e.target.value)}
                      placeholder="e.g. poojitalakkakula09@gmail.com"
                      className="mt-1.5 w-full text-xs px-3.5 py-2.5 bg-slate-100/50 border border-slate-200 rounded-xl focus:border-brand-primary/40 focus:bg-white outline-none font-mono"
                    />
                    <p className="text-[9px] font-medium text-slate-500 mt-1.5 leading-normal bg-indigo-50/20 p-2.5 border border-indigo-100/60 rounded-xl">
                      💡 <strong>Track Activity in Gmail:</strong> A duplicate copy of all clinic activities (registrations, bookings, cancellations, feedback) will be sent straight to this address so you can notify patients and keep track in Gmail!
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={saveEmailSettings}
                      className="flex-1 px-4 py-2.5 bg-brand-primary text-white font-extrabold text-xs rounded-xl hover:bg-brand-secondary cursor-pointer transition-all uppercase tracking-wider"
                    >
                      Save Configuration
                    </button>
                    <button
                      type="button"
                      onClick={clearEmailJSKeys}
                      className="px-4 py-2.5 bg-slate-50 border border-slate-105 text-slate-500 font-bold text-xs rounded-xl hover:bg-slate-100 cursor-pointer transition-all uppercase tracking-wider"
                    >
                      Reset
                    </button>
                  </div>

                  {saveResult && (
                    <div className={`p-3 rounded-xl text-[10px] font-bold border ${
                      saveResult.success ? "bg-emerald-50 text-emerald-800 border-emerald-100" : "bg-red-50 text-red-800 border-red-100"
                    }`}>
                      {saveResult.message}
                    </div>
                  )}
                </div>

                {/* Connection Sandbox Testing */}
                <div className="border-t border-slate-150 pt-5 space-y-3">
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">EmailJS Sandbox Diagnostic</h3>
                    <p className="text-[9px] text-slate-400 mt-0.5 leading-relaxed">
                      Send a dynamic trial pass immediately to verify server authorization settings.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-450">
                        <Mail size={13} />
                      </span>
                      <input
                        type="email"
                        value={testerEmail}
                        onChange={(e) => setTesterEmail(e.target.value)}
                        placeholder="test-recipient@gmail.com"
                        className="w-full text-xs pl-8.5 pr-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={triggerEmailJSTest}
                      disabled={testLoading}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-900 text-white font-extrabold text-xs rounded-xl hover:bg-indigo-955 cursor-pointer transition-all disabled:opacity-55 uppercase tracking-wider"
                    >
                      {testLoading ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />}
                      <span>{testLoading ? "Delivering pass..." : "Verify Connection & Send"}</span>
                    </button>

                    {testResult && (
                      <div className={`p-3.5 rounded-xl text-[10px] leading-normal font-semibold border ${
                        testResult.success ? "bg-emerald-50 text-emerald-800 border-emerald-100" : "bg-red-50 text-red-800 border-red-150"
                      }`}>
                        {testResult.message}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Simulated & Dispatched Logs desk */}
            <div className="xl:col-span-7 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
              <div>
                <h2 className="text-sm font-bold text-slate-850 uppercase tracking-tight flex items-center gap-2">
                  <Mail className="text-brand-primary" size={16} />
                  <span>Real-time Dispatch Log Desk</span>
                </h2>
                <p className="text-[10px] text-slate-400 mt-1">Audit trail of clinic letters dispatched to outpatients during live queue actions.</p>
              </div>

              <div className="space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
                {emails.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 text-xs">No email receipts tracked yet.</div>
                ) : (
                  emails.map((log) => (
                    <div key={log.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-105 space-y-2 text-xs text-left">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/50 pb-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-extrabold text-slate-800">{log.recipientName}</span>
                          <span className="text-[10px] text-slate-400">({log.recipientEmail})</span>
                        </div>
                        <span className={`px-1.5 py-0.5 text-[8px] font-black rounded tracking-wide border ${
                          log.type === "REGISTRATION" ? "bg-indigo-55 bg-indigo-50 text-indigo-650 border border-indigo-100" :
                          log.type === "BOOKING" ? "bg-sky-50 text-sky-650 border border-sky-100" :
                          log.type === "APPROVAL" ? "bg-emerald-50 text-emerald-650 border border-emerald-100" :
                          log.type === "CANCELLATION" ? "bg-red-50 text-red-650 border border-red-105" :
                          "bg-slate-150 text-slate-600 border border-slate-200"
                        }`}>{log.type}</span>
                      </div>
                      <p className="text-slate-650"><strong className="font-bold text-slate-800">Subject:</strong> {log.subject}</p>
                      <div className="text-[11px] text-slate-500 mt-1 p-3.5 bg-white border border-slate-100 rounded-xl leading-relaxed">
                        <QueueCardView body={log.body} />
                      </div>
                      <div className="text-[9px] text-slate-400 text-right">
                        Dispatched: {new Date(log.sentAt).toLocaleDateString()} {new Date(log.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </main>
      <AiAssistant />
    </div>
  );
}

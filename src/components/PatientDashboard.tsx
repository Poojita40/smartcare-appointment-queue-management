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
  Sparkles,
  CheckCircle,
  AlertCircle,
  Trash2,
  Bell,
  Sliders,
  ChevronRight,
  BookOpen,
  Phone,
  ArrowRight,
  Mail,
  Inbox
} from "lucide-react";
import axios from "axios";
import { Appointment, Doctor, QueueState } from "../types";
import { emailService } from "../services/emailService";
import { QueueCardView } from "./QueueCardView";

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

// Utility to parse doctor shift availability dynamically into available 30-minute interval slots
export function getDoctorTimeSlots(availabilityStr: string): string[] {
  if (!availabilityStr) return ["09:00 AM", "10:00 AM", "11:00 AM"];
  
  // Clean split by " - ", " to ", "–" etc.
  const parts = availabilityStr.split(/[-–—to]+/i).map(s => s.trim());
  if (parts.length < 2) {
    return ["09:00 AM", "10:00 AM", "11:00 AM"];
  }

  const parseTime = (timeStr: string): number => {
    const match = timeStr.match(/(\d+):?(\d*)\s*(AM|PM)?/i);
    if (!match) return 540; // Default: 9:00 AM in minutes
    
    let hours = parseInt(match[1], 10);
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    const ampm = match[3] ? match[3].toUpperCase() : "";

    if (ampm === "PM" && hours < 12) {
      hours += 12;
    } else if (ampm === "AM" && hours === 12) {
      hours = 0;
    }
    return hours * 60 + minutes;
  };

  const startMin = parseTime(parts[0]);
  const endMin = parseTime(parts[1]);

  if (isNaN(startMin) || isNaN(endMin) || startMin >= endMin) {
    return ["09:00 AM", "10:00 AM", "11:00 AM"];
  }

  const slots: string[] = [];
  // Output every 30 minutes
  for (let current = startMin; current < endMin; current += 30) {
    let hrs = Math.floor(current / 60);
    const mins = current % 60;
    let period = "AM";
    if (hrs >= 12) {
      period = "PM";
      if (hrs > 12) hrs -= 12;
    } else if (hrs === 0) {
      hrs = 12;
    }
    const formattedHrs = String(hrs).padStart(2, "0");
    const formattedMins = String(mins).padStart(2, "0");
    slots.push(`${formattedHrs}:${formattedMins} ${period}`);
  }

  return slots.length > 0 ? slots : ["09:00 AM", "10:00 AM", "11:00 AM"];
}

export default function PatientDashboard({ patientUser, onLogout }: { patientUser: any; onLogout: () => void }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"summary" | "book" | "my-appointments" | "queue" | "profile" | "inbox">("summary");
  
  // Dashboard states
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  
  // Inbox states
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [emailFilter, setEmailFilter] = useState<"ALL" | "REGISTRATION" | "BOOKING" | "APPROVAL" | "CANCELLATION">("ALL");

  // Create booking state
  const [bookingForm, setBookingForm] = useState({
    doctorId: "",
    date: new Date().toISOString().split("T")[0],
    time: "10:00 AM",
    reason: ""
  });
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Edit profile state
  const [profileForm, setProfileForm] = useState({
    name: patientUser?.name || "",
    phone: patientUser?.phone || "",
    age: patientUser?.age || 30,
    gender: "Male" as const,
    address: "742 Evergreen Terrace, Springfield"
  });
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Real-time appointment status tracker polling module state
  const [pollingStatus, setPollingStatus] = useState<string>("IDLE"); // 'IDLE' | 'POLLING' | 'UPDATING' | 'COMPLETE'
  const [pollingMessage, setPollingMessage] = useState<string>("");
  const [pollingProgress, setPollingProgress] = useState<number>(0);
  const [lastPolledAt, setLastPolledAt] = useState<string>("");
  const [isCheckinLoading, setIsCheckinLoading] = useState<boolean>(false);

  // Live Queue tracking interactive state
  const [selectedQueueDocId, setSelectedQueueDocId] = useState<string>("");
  const [queueState, setQueueState] = useState<QueueState | null>(null);

  const fetchDashboardData = async () => {
    try {
      const docsRes = await axios.get("/api/doctors");
      setDoctors(docsRes.data);
      if (docsRes.data.length > 0 && !bookingForm.doctorId) {
        const firstDoc = docsRes.data[0];
        const computedSlots = getDoctorTimeSlots(firstDoc.availability);
        setBookingForm(prev => ({ 
          ...prev, 
          doctorId: firstDoc.id,
          time: computedSlots.length > 0 ? computedSlots[0] : "09:00 AM"
        }));
        setSelectedQueueDocId(firstDoc.id);
      }

      const apptsRes = await axios.get(`/api/appointments?role=PATIENT&patientId=${patientUser.id}`);
      setAppointments(apptsRes.data);

      const logsRes = await axios.get("/api/emails");
      const filteredMails = logsRes.data.filter((e: any) => 
        e.recipientEmail.toLowerCase().trim() === patientUser.email.toLowerCase().trim()
      );
      setEmails(filteredMails);
      
      // Auto-set first email of the list on load if nothing is selected yet
      if (filteredMails.length > 0) {
        setSelectedEmail((prev: any) => prev || filteredMails[0]);
      }
    } catch (err) {
      console.error("Error loading patient statistics", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [patientUser]);

  // Track the Selected queue stats
  useEffect(() => {
    if (!selectedQueueDocId) return;

    const fetchQueueStatus = async () => {
      // Find latest approved appointment for this patient with this doctor to supply their token number
      const approvedAppt = appointments.find(
        (a) => a.doctorId === selectedQueueDocId && (a.status === "APPROVED" || a.status === "Confirmed" || a.status === "Checked-in")
      );
      const tokenQuery = approvedAppt ? `?patientToken=${approvedAppt.tokenNumber}` : "";

      try {
        const res = await axios.get(`/api/queue/status/${selectedQueueDocId}${tokenQuery}`);
        setQueueState({
          doctorId: selectedQueueDocId,
          doctorName: res.data.doctorName,
          specialization: res.data.specialization,
          currentRunningToken: res.data.currentRunningToken,
          yourToken: approvedAppt ? approvedAppt.tokenNumber : 0,
          patientsAhead: res.data.patientsAhead,
          estimatedWaitTime: res.data.estimatedWaitTime
        });
      } catch (err) {
        console.error("Queue state call error:", err);
      }
    };

    fetchQueueStatus();
    const interval = setInterval(fetchQueueStatus, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [selectedQueueDocId, appointments]);

  // Status Poll daemon & action triggers
  useEffect(() => {
    // Look for any PENDING appointment
    const pendingAppt = appointments.find((a) => a.status === "PENDING");
    if (!pendingAppt) {
      // Find latest non-pending appointment to show stats
      const hasActive = appointments.some((a) => a.status === "Confirmed" || a.status === "Checked-in" || a.status === "APPROVED");
      if (hasActive) {
        setPollingStatus("COMPLETE");
        setPollingProgress(100);
        setPollingMessage("Slots approved and synced successfully with local clinic registers.");
      } else {
        setPollingStatus("IDLE");
        setPollingProgress(0);
        setPollingMessage("Active status tracker online. System waiting for a reservation...");
      }
      return;
    }

    setPollingStatus("POLLING");
    setPollingProgress(20);
    setPollingMessage("Active Review Daemon is polling clinics, verifying time blocks...");
    setLastPolledAt(new Date().toLocaleTimeString());

    let ticks = 0;
    const pollInterval = setInterval(async () => {
      ticks += 1;
      setLastPolledAt(new Date().toLocaleTimeString());

      if (ticks === 1) {
        setPollingMessage("Verifying doctor availability against live slot schedules...");
        setPollingProgress(50);
      } else if (ticks === 2) {
        setPollingMessage("Symptom severity analysis and waitlist priority sorting...");
        setPollingProgress(80);
      } else if (ticks >= 3) {
        setPollingStatus("UPDATING");
        setPollingMessage("Registering outpatient token slot & locking schedule...");
        setPollingProgress(95);

        try {
          await axios.put(`/api/appointments/${pendingAppt.id}/status`, { status: "Confirmed" });
          setPollingStatus("COMPLETE");
          setPollingProgress(100);
          setPollingMessage("Confirmed! Token allocated. Click 'Self Check-in Now' to enter wait queue.");
          fetchDashboardData();
        } catch (err) {
          console.error("Auto status check failed:", err);
          setPollingStatus("IDLE");
        }
        clearInterval(pollInterval);
      }
    }, 4500); // Step every 4.5 seconds

    return () => clearInterval(pollInterval);
  }, [appointments.length, appointments.filter(a => a.status === "PENDING").length]);

  const handleInstantApprove = async (apptId: string) => {
    setPollingStatus("UPDATING");
    setPollingProgress(95);
    setPollingMessage("Bypassing administrative wait times to allocate slot instantly...");
    try {
      await axios.put(`/api/appointments/${apptId}/status`, { status: "Confirmed" });
      setPollingStatus("COMPLETE");
      setPollingProgress(100);
      setPollingMessage("Confirmed! Token allocated successfully.");
      fetchDashboardData();
    } catch (err) {
      console.error("Instant check-in approval failed:", err);
      setPollingStatus("IDLE");
    }
  };

  const handleSelfCheckin = async (apptId: string) => {
    setIsCheckinLoading(true);
    try {
      await axios.put(`/api/appointments/${apptId}/status`, { status: "Checked-in" });
      fetchDashboardData();
    } catch (err) {
      console.error("Self check-in failed:", err);
    } finally {
      setIsCheckinLoading(false);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSuccess(null);
    setBookingError(null);

    if (!bookingForm.reason.trim()) {
      setBookingError("Please state a consultation reason.");
      return;
    }

    try {
      const res = await axios.post("/api/appointments", {
        patientId: patientUser.id,
        doctorId: bookingForm.doctorId,
        date: bookingForm.date,
        time: bookingForm.time,
        reason: bookingForm.reason
      });

      // Also trigger client-side email dispatch if keys are available
      try {
        const docObj = doctors.find((d: any) => d.id === bookingForm.doctorId);
        await emailService.sendBookingEmail(
          patientUser.name,
          patientUser.email,
          {
            doctorName: docObj ? docObj.name : "Consultant",
            date: bookingForm.date,
            time: bookingForm.time,
            queueNumber: res.data.tokenNumber,
            reason: bookingForm.reason
          }
        );
      } catch (clientEmailErr) {
        console.warn("[Patient Booking Client Email] Non-blocking email dispatch warning:", clientEmailErr);
      }

      setBookingSuccess(`Booking Requested & Allocated! Assigned token is #${res.data.tokenNumber}. Wait for doctor's approval.`);
      setBookingForm(prev => ({ ...prev, reason: "" }));
      fetchDashboardData();
    } catch (err: any) {
      setBookingError(err.response?.data?.error || "Scheduler conflict. Please try again.");
    }
  };

  const handleCancelAppointment = async (apptId: string) => {
    try {
      await axios.put(`/api/appointments/${apptId}/status`, { status: "CANCELLED" });

      // Also trigger client-side cancellation notification if possible
      try {
        const cancelledAppt = appointments.find((a) => a.id === apptId);
        if (cancelledAppt) {
          const docObj = doctors.find((d: any) => d.id === cancelledAppt.doctorId);
          await emailService.sendCancellationEmail(
            patientUser.name,
            patientUser.email,
            {
              doctorName: docObj ? docObj.name : "Consultant",
              date: cancelledAppt.date
            }
          );
        }
      } catch (clientEmailErr) {
        console.warn("[Patient Cancel Client Email] Non-blocking email dispatch warning:", clientEmailErr);
      }

      fetchDashboardData();
    } catch (err) {
      console.error("Cancellation error:", err);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put(`/api/patients/${patientUser.id}`, profileForm);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  // Stats calculation
  const upcomingAppointment = appointments.find((a) => a.status === "APPROVED" || a.status === "Confirmed" || a.status === "Checked-in" || a.status === "PENDING");
  const approvedCount = appointments.filter((a) => a.status === "APPROVED" || a.status === "Confirmed" || a.status === "Checked-in").length;
  const pendingCount = appointments.filter((a) => a.status === "PENDING").length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Sidebar navigation */}
      <aside className="w-full lg:w-72 bg-slate-900 text-white flex flex-col shrink-0 text-left">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <span className="p-1 bg-brand-primary text-white rounded-lg">
              <Activity size={18} />
            </span>
            <span>Smart<span className="text-brand-primary">Care</span></span>
          </Link>
          <span className="px-2 py-0.5 bg-brand-accent/20 rounded text-[10px] text-brand-accent font-bold">PATIENT</span>
        </div>

        <div className="p-6 border-b border-white/5 bg-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center border border-brand-primary/30 text-brand-accent font-bold">
            {patientUser?.name?.charAt(0) || "P"}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-slate-100 truncate">{patientUser?.name || "Patient Profile"}</p>
            <p className="text-[10px] text-slate-450 truncate">{patientUser?.email || "patient@smartcare.org"}</p>
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
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer ${activeTab === "summary" ? "bg-brand-primary text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
          >
            <Activity size={16} /> Dashboard Summary
          </motion.button>
          <motion.button
            variants={sidebarItemVariants}
            onClick={() => { setActiveTab("book"); setBookingSuccess(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer ${activeTab === "book" ? "bg-brand-primary text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
          >
            <Calendar size={16} /> Book Appointment
          </motion.button>
          <motion.button
            variants={sidebarItemVariants}
            onClick={() => setActiveTab("my-appointments")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer ${activeTab === "my-appointments" ? "bg-brand-primary text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
          >
            <BookOpen size={16} /> My Appointments
          </motion.button>
          <motion.button
            variants={sidebarItemVariants}
            onClick={() => setActiveTab("inbox")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer ${activeTab === "inbox" ? "bg-brand-primary text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
          >
            <span className="flex items-center gap-3">
              <Mail size={16} /> My Inbox
            </span>
            {emails.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === "inbox" ? "bg-white text-brand-primary" : "bg-brand-primary text-white shadow-xs"}`}>
                {emails.length}
              </span>
            )}
          </motion.button>
          <motion.button
            variants={sidebarItemVariants}
            onClick={() => setActiveTab("queue")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer ${activeTab === "queue" ? "bg-brand-primary text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
          >
            <Clock size={16} /> Queue Tracking
          </motion.button>
          <motion.button
            variants={sidebarItemVariants}
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer ${activeTab === "profile" ? "bg-brand-primary text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
          >
            <User size={16} /> Edit Profile
          </motion.button>
        </motion.nav>

        <div className="p-4 border-t border-white/5">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider text-rose-450 hover:bg-rose-500/10 transition-colors cursor-pointer text-rose-350">
            <LogOut size={16} /> Logout Account
          </button>
        </div>
      </aside>

      {/* Main dashboard view */}
      <main className="flex-1 p-6 md:p-10 space-y-8 overflow-y-auto max-h-screen text-left">
        {/* Banner greeting */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-sans text-slate-900 tracking-tight">Outpatient Workspace</h1>
            <p className="text-slate-400 text-xs mt-0.5">Welcome back, {patientUser?.name || "Patient"}. Live tracking of hospital stats are synced below.</p>
          </div>
          <div className="flex gap-2 text-xs font-semibold text-slate-500 bg-white border border-slate-150 p-2.5 rounded-xl shadow-xs">
            <Clock size={15} className="text-brand-primary" /> Live Clinic Status: <span className="text-emerald-600 font-bold">Open</span>
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
                <span className="p-3 bg-brand-primary/10 text-brand-primary rounded-xl shrink-0">
                  <Calendar size={20} />
                </span>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Approved</p>
                  <p className="text-2xl font-black text-slate-800 mt-0.5">{approvedCount} Slots</p>
                </div>
              </motion.div>

              <motion.div variants={cardItemVariants} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <span className="p-3 bg-amber-500/10 text-amber-500 rounded-xl shrink-0">
                  <Clock size={20} />
                </span>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Review</p>
                  <p className="text-2xl font-black text-slate-800 mt-0.5">{pendingCount} Slots</p>
                </div>
              </motion.div>

              <motion.div variants={cardItemVariants} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <span className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl shrink-0">
                  <Bell size={20} />
                </span>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alerts Received</p>
                  <p className="text-2xl font-black text-slate-800 mt-0.5">{emails.length} Mails</p>
                </div>
              </motion.div>

              <motion.div variants={cardItemVariants} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <span className="p-3 bg-violet-500/10 text-violet-500 rounded-xl shrink-0">
                  <Sparkles size={20} />
                </span>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Your Next Token</p>
                  <p className="text-2xl font-black text-slate-800 mt-0.5">
                    {upcomingAppointment ? `#${upcomingAppointment.tokenNumber}` : "None"}
                  </p>
                </div>
              </motion.div>
            </motion.div>

            {/* Real-time Status and review Tracker Widget */}
            <motion.div 
              variants={cardItemVariants}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 relative overflow-hidden"
            >
              {/* Background styling elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 tracking-tight uppercase flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pollingStatus === "POLLING" ? "bg-amber-400" : pollingStatus === "UPDATING" ? "bg-cyan-400" : "bg-emerald-400"}`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${pollingStatus === "POLLING" ? "bg-amber-500" : pollingStatus === "UPDATING" ? "bg-cyan-500" : "bg-emerald-500"}`}></span>
                    </span>
                    Real-Time Medical Review & Status Tracker
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Automated Waitlist Coordination Engine (Mock Polling Daemon Active)</p>
                </div>
                {lastPolledAt && (
                  <span className="text-[10px] bg-slate-50 border border-slate-200 text-slate-400 px-2 py-0.5 rounded-lg select-none font-semibold">
                    Last Polled Loop: {lastPolledAt}
                  </span>
                )}
              </div>

              {appointments.filter(a => a.status === "PENDING" || a.status === "Confirmed" || a.status === "Checked-in").length === 0 ? (
                <div className="py-2 text-slate-400 text-xs text-left">
                  No active review requirements. Create a new consulting reservation in the "Book Slot" tab to initialize live tracking.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  <div className="lg:col-span-7 space-y-4 text-left">
                    {/* Status progress bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-700">Review Diagnostics Syncing</span>
                        <span className="font-extrabold text-emerald-600">{pollingProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div 
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${pollingProgress}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50/50 border border-slate-150 rounded-xl flex items-start gap-2 text-xs text-slate-600">
                      <Sparkles size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-800">Review Stream: {pollingStatus}</p>
                        <p className="text-slate-500 text-[11px] leading-relaxed mt-0.5">{pollingMessage || "Review session is actively monitored."}</p>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-5 flex flex-col gap-3">
                    {appointments.map((app) => {
                      if (app.status === "PENDING") {
                        return (
                          <div key={app.id} className="p-3 rounded-2xl bg-amber-50/50 border border-amber-100 flex items-center justify-between gap-4 text-xs">
                            <div className="text-left">
                              <p className="font-bold text-amber-800">Pending Review</p>
                              <p className="text-slate-400 text-[10px] mt-0.5">{app.doctorName} slot is under clinical verification.</p>
                            </div>
                            <button
                              onClick={() => handleInstantApprove(app.id)}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-lg text-[10px] uppercase shadow-xs cursor-pointer select-none shrink-0"
                            >
                              Speed-up Review
                            </button>
                          </div>
                        );
                      } else if (app.status === "Confirmed") {
                        return (
                          <div key={app.id} className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between gap-4 text-xs">
                            <div className="text-left">
                              <p className="font-bold text-emerald-800">Confirmed (Awaiting Lobby)</p>
                              <p className="text-slate-500 text-[10px] mt-0.5">Please check-in to confirm your arrival at reception desk.</p>
                            </div>
                            <button
                              disabled={isCheckinLoading}
                              onClick={() => handleSelfCheckin(app.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-[10px] uppercase shadow-xs cursor-pointer select-none shrink-0"
                            >
                              {isCheckinLoading ? "Checking-in..." : "Self Check-in Now"}
                            </button>
                          </div>
                        );
                      } else if (app.status === "Checked-in") {
                        return (
                          <div key={app.id} className="p-3 rounded-2xl bg-cyan-50/70 border border-cyan-100 flex items-center justify-between gap-4 text-xs">
                            <div className="flex-1 text-left">
                              <p className="font-bold text-cyan-800 flex items-center gap-1">
                                <CheckCircle size={13} className="text-cyan-600" /> Successfully Checked-In!
                              </p>
                              <p className="text-slate-500 text-[10px] mt-0.5">Proceed to waitlist area. Doctor {app.doctorName}'s queue is active.</p>
                            </div>
                            <span className="px-2 py-1 bg-cyan-100 text-cyan-800 text-[9px] font-black uppercase rounded border border-cyan-200 select-none shrink-0">
                              Active Lobby
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Quick Summary Panels */}
            <motion.div 
              variants={cardsContainerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              <motion.div variants={cardItemVariants} className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                  <h3 className="text-sm font-bold text-slate-800 tracking-tight uppercase">Upcoming Medical Reservations</h3>
                  <button onClick={() => setActiveTab("my-appointments")} className="text-xs text-brand-primary font-bold hover:underline">View All</button>
                </div>

                <div className="space-y-4">
                  {appointments.filter((a) => a.status === "APPROVED" || a.status === "Confirmed" || a.status === "Checked-in" || a.status === "PENDING").length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      No active medical appointments recorded. Click "Book Appointment' to schedule one now!
                    </div>
                  ) : (
                    appointments
                      .filter((a) => a.status === "APPROVED" || a.status === "Confirmed" || a.status === "Checked-in" || a.status === "PENDING")
                      .map((app) => (
                        <div key={app.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-bold text-slate-850">{app.doctorName}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{app.doctorSpecialization} | Date: {app.date} | {app.time}</p>
                            <span className={`inline-block text-[9px] font-bold rounded px-1.5 py-0.5 mt-2 ${app.status === "APPROVED" || app.status === "Confirmed" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : app.status === "Checked-in" ? "bg-cyan-50 text-cyan-600 border border-cyan-100" : "bg-amber-50 text-amber-600 border border-amber-100"}`}>
                              Status: {app.status}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[10px] font-semibold text-slate-400">Assigned Token</p>
                            <p className="text-2xl font-black text-brand-primary">#{app.tokenNumber}</p>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </motion.div>

              {/* Simulated Email Notification Logs (EmailJS verification proofs) */}
              <motion.div variants={cardItemVariants} className="lg:col-span-12 xl:col-span-5 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-850 uppercase tracking-tight">Simulated Receipts Inbox</h3>
                    <p className="text-[10px] text-slate-400 mt-1">Proof of automatic mail logs triggered by actions</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab("inbox")} 
                    className="text-xs text-brand-primary font-bold hover:underline cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <span>Open Inbox</span> <ChevronRight size={12} />
                  </button>
                </div>

                <div className="space-y-3.5 max-h-[290px] overflow-y-auto pr-1">
                  {emails.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      No email receipts tracked yet.
                    </div>
                  ) : (
                    emails.map((e) => (
                      <div 
                        key={e.id} 
                        onClick={() => { setSelectedEmail(e); setActiveTab("inbox"); }}
                        className="p-3 rounded-xl bg-slate-50 hover:bg-brand-primary/5 hover:border-brand-primary/20 border border-slate-100 text-xs text-left space-y-1 cursor-pointer transition-all group"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-700">
                          <span className="truncate group-hover:text-brand-primary transition-colors">{e.subject}</span>
                          <span className="text-[9px] font-medium text-slate-400 shrink-0 select-none">
                            {new Date(e.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[10px] leading-relaxed truncate">
                          {(() => {
                            if (e.body.trim().startsWith("<table") || e.body.trim().startsWith("<div")) {
                              const text = e.body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                              return text.slice(0, 100) + (text.length > 100 ? "..." : "");
                            }
                            const clean = e.body.split("<div")[0].trim();
                            if (clean.includes("┌────────────────")) {
                              return clean.split("┌────────────────")[0].trim() || "Official Queue Appointment Access Pass Ticket Pass Included";
                            }
                            return clean;
                          })()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {activeTab === "book" && (
          <motion.div 
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-2xl bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6"
          >
            <div>
              <h2 className="text-lg font-bold text-slate-850">Schedule Consultation Panel</h2>
              <p className="text-xs text-slate-400 mt-0.5">Select your resident specialist, choose available date/time, and define diagnostic goals.</p>
            </div>

            {bookingSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-xs font-semibold">
                {bookingSuccess}
              </div>
            )}

            {bookingError && (
              <div className="p-3 bg-red-50 text-red-650 rounded-xl border border-red-100 text-xs font-medium">
                {bookingError}
              </div>
            )}

            <form onSubmit={handleBookingSubmit} className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Clinician Specialist</label>
                  <select
                    name="doctorId"
                    value={bookingForm.doctorId}
                    onChange={(e) => {
                      const selDocId = e.target.value;
                      const docObj = doctors.find((d: any) => d.id === selDocId);
                      const slots = docObj ? getDoctorTimeSlots(docObj.availability) : [];
                      setBookingForm(prev => ({
                        ...prev,
                        doctorId: selDocId,
                        time: slots.length > 0 ? slots[0] : "09:00 AM"
                      }));
                    }}
                    className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-primary text-slate-800 text-sm"
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.specialization})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Appointment Date</label>
                  <input
                    required
                    name="date"
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={bookingForm.date}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-primary text-slate-800 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Preferred Time Slot</label>
                    {(() => {
                      const activeDoc = doctors.find((d) => d.id === bookingForm.doctorId);
                      return activeDoc ? (
                        <span className="text-[10px] text-brand-primary font-bold bg-brand-primary/5 px-2 py-0.5 rounded border border-brand-primary/10">
                          Hours: {activeDoc.availability}
                        </span>
                      ) : null;
                    })()}
                  </div>
                  <select
                    name="time"
                    value={bookingForm.time}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-primary text-slate-800 text-sm focus:ring-1 focus:ring-brand-primary"
                  >
                    {(() => {
                      const activeDoc = doctors.find((d) => d.id === bookingForm.doctorId);
                      let computedSlots = activeDoc ? getDoctorTimeSlots(activeDoc.availability) : [];
                      
                      const today = new Date();
                      const todayStr = today.toISOString().split("T")[0];
                      if (bookingForm.date === todayStr) {
                        computedSlots = computedSlots.filter(slot => {
                          let [timeStr, modifier] = slot.split(" ");
                          if (!timeStr) return true;
                          let [hours, minutes] = timeStr.split(":").map(Number);
                          if (modifier) {
                            if (modifier.toUpperCase() === "PM" && hours < 12) hours += 12;
                            if (modifier.toUpperCase() === "AM" && hours === 12) hours = 0;
                          }
                          const nowHours = today.getHours();
                          const nowMinutes = today.getMinutes();
                          return hours > nowHours || (hours === nowHours && minutes > nowMinutes);
                        });
                      }

                      if (computedSlots.length === 0) {
                        return <option value="">No future slots available today</option>;
                      }
                      return computedSlots.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ));
                    })()}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Clinical Motive / Health Symptoms</label>
                <textarea
                  required
                  rows={3}
                  name="reason"
                  value={bookingForm.reason}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="State your physiological reasons (e.g., severe cardiovascular flutters or sore neck tissues)..."
                  className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-primary text-slate-800 text-sm placeholder-slate-400 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-brand-primary hover:bg-brand-secondary text-white font-semibold text-sm rounded-xl transition-all shadow-md mt-2 cursor-pointer"
              >
                Book Consulting Slot & Allocate Token
              </button>
            </form>
          </motion.div>
        )}

        {activeTab === "my-appointments" && (
          <motion.div 
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6"
          >
            <div>
              <h2 className="text-lg font-bold text-slate-850">Consolidated Medical Registries</h2>
              <p className="text-xs text-slate-400 mt-0.5">Below is the complete list of your pending, approved, or historic check-in appointments.</p>
            </div>

            <div className="space-y-4">
              {appointments.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No appointments registered under your name. Book first!
                </div>
              ) : (
                appointments.map((app) => (
                  <div key={app.id} className="p-4 md:p-5 border border-slate-100 rounded-2xl bg-slate-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-805 text-sm">{app.doctorName}</h4>
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded leading-none border ${app.status === "CANCELLED" ? "bg-red-50 text-red-600 border-red-100" : app.status === "COMPLETED" ? "bg-slate-100 text-slate-600 border-slate-200" : app.status === "Checked-in" ? "bg-cyan-50 text-cyan-600 border-cyan-100" : app.status === "PENDING" ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"}`}>
                          {app.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{app.doctorSpecialization} Speciality Desk</p>
                      <p className="text-xs text-slate-400">Scheduled: <strong>{app.date}</strong> at <strong>{app.time}</strong></p>
                      <p className="text-xs text-slate-500 bg-white border border-slate-100 p-2 rounded-lg mt-2 inline-block">Reason: "{app.reason}"</p>
                    </div>

                    <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-4">
                      <div className="text-right">
                        <p className="text-[10px] font-semibold text-slate-400 leading-none">Your Token</p>
                        <p className="text-3xl font-black text-brand-primary">#{app.tokenNumber}</p>
                      </div>

                      {app.status !== "CANCELLED" && app.status !== "COMPLETED" && (
                        <button
                          onClick={() => handleCancelAppointment(app.id)}
                          className="px-3 py-1.5 hover:bg-red-50 text-red-600 font-bold border border-red-100 hover:border-red-200 rounded-lg text-xs cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 size={12} /> Cancel Slot
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "queue" && (
          <motion.div 
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-850">Live Queue Tracking Control</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Select any active resident specialist below to query current hospital wait times.</p>
                </div>
                <div>
                  <select
                    value={selectedQueueDocId}
                    onChange={(e) => setSelectedQueueDocId(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer text-slate-700"
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>
                    ))}
                  </select>
                </div>
              </div>

              {queueState ? (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center pt-2">
                  <div className="md:col-span-5 space-y-6">
                    <div className="p-5 rounded-2xl bg-brand-primary text-white shadow-md text-center shrink-0">
                      <p className="text-[11px] font-medium uppercase tracking-wider opacity-80">Currently Calling Token</p>
                      <p className="text-5xl font-black mt-2">#{queueState.currentRunningToken}</p>
                      <span className="inline-block mt-3 px-2 py-0.5 bg-white/10 rounded text-[10px] font-bold">Room Active Status</span>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-450 font-medium">Your Token Number:</span>
                        <span className="font-bold text-slate-800 bg-white border px-2.5 py-0.5 rounded text-xs select-all">
                          {queueState.yourToken > 0 ? `#${queueState.yourToken}` : "Unallocated/No Approved appt"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-3">
                        <span className="text-slate-450 font-medium">Total Outpatients Ahead:</span>
                        <span className="font-semibold text-emerald-600">
                          {queueState.yourToken > 0 && queueState.yourToken > queueState.currentRunningToken
                            ? `${queueState.patientsAhead} patients`
                            : "0 patients / Current Turn or Done"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-3">
                        <span className="text-slate-450 font-medium">Estimated wait duration:</span>
                        <span className="font-bold text-brand-primary flex items-center gap-1">
                          <Clock size={12} /> {queueState.yourToken > 0 && queueState.yourToken > queueState.currentRunningToken ? `~${queueState.estimatedWaitTime} mins` : "Ready / On Call"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress timeline representation */}
                  <div className="md:col-span-7 bg-slate-50/50 rounded-2xl p-6 border border-slate-100 space-y-5">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest leading-none">Queue Progress Bar Timeline</h4>
                    
                    <div className="space-y-4 pt-1">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shrink-0">1</span>
                        <div className="text-xs text-slate-650">
                          <p className="font-bold text-slate-800">Token #{queueState.currentRunningToken || 1} being viewed</p>
                          <p className="text-slate-400 text-[10px] mt-0.5">Physician is actively conducting patient consultation.</p>
                        </div>
                      </div>

                      <div className="w-0.5 h-6 bg-slate-200 ml-3" />

                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-brand-primary text-white font-bold text-xs flex items-center justify-center shrink-0">2</span>
                        <div className="text-xs text-slate-650">
                          <p className="font-bold text-slate-800">Your Token Position</p>
                          <p className="text-slate-400 text-[10px] mt-0.5">Your position is #{queueState.yourToken > 0 ? queueState.yourToken : "None scheduled"}</p>
                        </div>
                      </div>

                      <div className="w-0.5 h-6 bg-slate-200 ml-3" />

                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 font-bold text-xs flex items-center justify-center shrink-0">3</span>
                        <div className="text-xs text-slate-650">
                          <p className="font-bold text-slate-800">Check-in Complete</p>
                          <p className="text-slate-400 text-[10px] mt-0.5">Receive prescriptive charts and checkout smoothly.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">Loading queue parameters...</div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "profile" && (
          <motion.div 
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-2xl bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6"
          >
            <div>
              <h2 className="text-lg font-bold text-slate-850">Outpatient Profile Information</h2>
              <p className="text-xs text-slate-400 mt-0.5">Updating these details modifies your digital charts registered in the hospital archives.</p>
            </div>

            {profileSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-xs font-semibold">
                Outpatient parameters saved successfully in memory.
              </div>
            )}

            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
                  <input
                    required
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-primary text-slate-800 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Phone</label>
                  <input
                    required
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-primary text-slate-800 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Age (Years)</label>
                  <input
                    required
                    type="number"
                    value={profileForm.age}
                    onChange={(e) => setProfileForm({ ...profileForm, age: Number(e.target.value) })}
                    className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-primary text-slate-800 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Gender</label>
                  <select
                    value={profileForm.gender}
                    onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value as any })}
                    className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-primary text-slate-800 text-sm"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Residential Address</label>
                <textarea
                  required
                  rows={2}
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-primary text-slate-800 text-sm placeholder-slate-400 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-brand-primary hover:bg-brand-secondary text-white font-semibold text-sm rounded-xl transition-all shadow-md mt-2 cursor-pointer"
              >
                Save Profile Parameters
              </button>
            </form>
          </motion.div>
        )}

        {activeTab === "inbox" && (
          <motion.div 
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-220px)] min-h-[500px]"
          >
            {/* Left sidebar: Email list pane */}
            <div className="lg:col-span-12 xl:col-span-5 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col overflow-hidden h-full">
              {/* Header and filters */}
              <div className="p-5 border-b border-slate-100 shrink-0 space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-850 flex items-center gap-2 font-sans">
                    <Inbox className="text-brand-primary" size={20} />
                    <span>My Clinic Mailbox</span>
                  </h2>
                  <p className="text-xs text-slate-450 mt-0.5">Real-time confirmation logs sent to {patientUser?.email}</p>
                </div>

                {/* Filter pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(["ALL", "REGISTRATION", "BOOKING", "APPROVAL", "CANCELLATION"] as const).map((filter) => {
                    const count = filter === "ALL" 
                      ? emails.length 
                      : emails.filter(e => e.type === filter).length;
                    return (
                      <button
                        key={filter}
                        onClick={() => setEmailFilter(filter)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-tight transition-all cursor-pointer ${emailFilter === filter ? "bg-brand-primary text-white font-black" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
                      >
                        {filter === "ALL" ? "All" : filter.charAt(0) + filter.slice(1).toLowerCase()} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1 select-none">
                {(() => {
                  const filteredMails = emails.filter(e => {
                    if (emailFilter === "ALL") return true;
                    return e.type === emailFilter;
                  });

                  if (filteredMails.length === 0) {
                    return (
                      <div className="text-center py-16 px-4 space-y-3">
                        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-400">
                          <Inbox size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700">No matching emails found</p>
                          <p className="text-[10px] text-slate-400 mt-1 mt-1">Simulated email receipts appear when you register, book or cancel appointments.</p>
                        </div>
                      </div>
                    );
                  }

                  return filteredMails.map((mail) => {
                    const isSelected = selectedEmail?.id === mail.id;
                    return (
                      <button
                        key={mail.id}
                        onClick={() => setSelectedEmail(mail)}
                        className={`w-full text-left p-4 transition-all hover:bg-slate-50/60 block relative cursor-pointer outline-none border-0 ${isSelected ? "bg-brand-primary/5 hover:bg-brand-primary/5 border-l-4 border-l-brand-primary pl-3" : "border-l-4 border-l-transparent"}`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black tracking-wide ${
                            mail.type === "REGISTRATION" ? "bg-indigo-55 bg-indigo-50 text-indigo-650 border border-indigo-100" :
                            mail.type === "BOOKING" ? "bg-sky-50 text-sky-650 border border-sky-100" :
                            mail.type === "APPROVAL" ? "bg-emerald-50 text-emerald-650 border border-emerald-100" :
                            mail.type === "CANCELLATION" ? "bg-red-50 text-red-650 border border-red-105" :
                            "bg-slate-150 text-slate-600 border border-slate-200"
                          }`}>
                            {mail.type}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(mail.sentAt).toLocaleDateString(undefined, { 
                              month: "short", 
                              day: "numeric", 
                              hour: "2-digit", 
                              minute: "2-digit" 
                            })}
                          </span>
                        </div>
                        <h4 className={`text-xs font-bold text-slate-850 truncate ${isSelected ? "text-brand-primary" : ""}`}>
                          {mail.subject}
                        </h4>
                        <p className="text-[10.5px] text-slate-550 line-clamp-2 mt-1 leading-relaxed">
                          {(() => {
                            if (mail.body.trim().startsWith("<table") || mail.body.trim().startsWith("<div")) {
                              const text = mail.body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                              return text.slice(0, 100) + (text.length > 100 ? "..." : "");
                            }
                            const clean = mail.body.split("<div")[0].trim();
                            if (clean.includes("┌────────────────")) {
                              return clean.split("┌────────────────")[0].trim() || "Official Queue Appointment Access Pass Ticket Pass Included";
                            }
                            return clean;
                          })()}
                        </p>
                      </button>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Right sidebar: Email reader details */}
            <div className="lg:col-span-12 xl:col-span-7 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col overflow-hidden h-full">
              {selectedEmail ? (
                <div className="flex flex-col h-full bg-linear-to-b from-white to-slate-50/20">
                  {/* Reader header */}
                  <div className="p-6 border-b border-slate-100 bg-slate-50/40 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                        selectedEmail.type === "REGISTRATION" ? "bg-indigo-50 text-indigo-650 border border-indigo-100" :
                        selectedEmail.type === "BOOKING" ? "bg-sky-50 text-sky-650 border border-sky-100" :
                        selectedEmail.type === "APPROVAL" ? "bg-emerald-50 text-emerald-650 border border-emerald-100" :
                        selectedEmail.type === "CANCELLATION" ? "bg-red-50 text-red-650 border border-red-100" :
                        "bg-slate-50 text-slate-600 border border-slate-250"
                      }`}>
                        {selectedEmail.type} MAIL LOG
                      </span>
                      <div className="text-[10px] text-slate-400 font-mono">
                        LOG ID: {selectedEmail.id}
                      </div>
                    </div>

                    <h1 className="text-base md:text-lg font-extrabold text-slate-900 leading-snug">
                      {selectedEmail.subject}
                    </h1>

                    <div className="flex items-center gap-3 pt-1">
                      <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 text-brand-accent flex items-center justify-center text-xs font-black">
                        SC
                      </div>
                      <div className="text-xs">
                        <div className="font-semibold text-slate-800">
                          SmartCare Clinic Operations <span className="font-normal text-slate-400">&lt;ops@smartcare.org&gt;</span>
                        </div>
                        <div className="text-[10px] text-slate-450 mt-0.5">
                          To: <span className="font-bold text-slate-650">{selectedEmail.recipientName}</span> &lt;{selectedEmail.recipientEmail}&gt;
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Body content */}
                  <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-white/70">
                    <div className="text-xs md:text-sm text-slate-700 leading-relaxed font-sans">
                      <QueueCardView body={selectedEmail.body} />
                    </div>
                  </div>

                  {/* Mail signature / disclaimer footer */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 text-center font-mono">
                    ⚠️ AUTOMATIC RECEIPT DISPATCH PROOF — Simulated in compliance with EmailJS logs
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                    <Mail size={32} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-750 font-sans">No Email Selected</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Choose an email receipt from the left pane to view its full content.</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </main>
      <AiAssistant />
    </div>
  );
}

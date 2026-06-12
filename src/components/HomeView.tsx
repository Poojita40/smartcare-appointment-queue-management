import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import axios from "axios";
import {
  Activity,
  Calendar,
  Clock,
  UserCheck,
  ShieldAlert,
  Mail,
  Heart,
  Brain,
  Bone,
  Sparkles,
  Baby,
  Stethoscope,
  ChevronDown,
  ArrowRight,
  Phone,
  MapPin,
  CheckCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Star
} from "lucide-react";
// @ts-ignore
import heroIllustration from "../assets/images/medical_hero_illustration_1780933833625.png";
import AiAssistant from "./AiAssistant";

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  experience: number;
  availability: string;
  imageUrl: string;
}

export default function HomeView({ doctors: propDoctors }: { doctors?: Doctor[] }) {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>(propDoctors || []);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Contact form state
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMotive, setContactMotive] = useState("");
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactSuccessMessage, setContactSuccessMessage] = useState<string | null>(null);
  const [contactErrorMessage, setContactErrorMessage] = useState<string | null>(null);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingContact(true);
    setContactSuccessMessage(null);
    setContactErrorMessage(null);

    try {
      const response = await axios.post("/api/inquiries", {
        name: contactName,
        email: contactEmail,
        message: contactMotive
      });

      if (response.data.success) {
        setContactSuccessMessage("Your inquiry has been successfully sent! A simulated customer support ticket and confirmation email have been logged.");
        setContactName("");
        setContactEmail("");
        setContactMotive("");
      } else {
        setContactErrorMessage("An unexpected response occurred. Please try again.");
      }
    } catch (err: any) {
      console.error("Support Inquiry submit error:", err);
      setContactErrorMessage("Could not submit entry. Please check the backend connection.");
    } finally {
      setIsSubmittingContact(false);
    }
  };

  useEffect(() => {
    if (!propDoctors || propDoctors.length === 0) {
      axios.get("/api/doctors")
        .then((res) => {
          setDoctors(res.data);
        })
        .catch((err) => {
          console.error("HomeView dynamic fetch error:", err);
        });
    } else {
      setDoctors(propDoctors);
    }
  }, [propDoctors]);

  const features = [
    {
      icon: <Calendar className="text-brand-primary" size={28} />,
      title: "Online Appointment Booking",
      description: "Secure immediate time slots with our world-class medical experts globally without back-and-forth phone calls."
    },
    {
      icon: <Clock className="text-emerald-500" size={28} />,
      title: "Live Queue Tracking",
      description: "Monitor live waiting progress and expected check-in meters directly from your mobile phone. Arrive on time."
    },
    {
      icon: <Mail className="text-blue-500" size={28} />,
      title: "Email Notifications",
      description: "Recieve automated EmailJS verification receipts for registrations, schedules, and clinical status changes."
    },
    {
      icon: <UserCheck className="text-violet-500" size={28} />,
      title: "Patient Dashboard",
      description: "Explore previous charts, book consultations, track dynamic queue progression, and manage prescriptions."
    },
    {
      icon: <Activity className="text-rose-500" size={28} />,
      title: "Doctor Dashboard",
      description: "Control clinic lines, list check-in records, approve or cancel slots, and document completed patient files."
    },
    {
      icon: <ShieldAlert className="text-amber-500" size={28} />,
      title: "Admin Control Center",
      description: "Conduct doctor registry creations, oversee appointment registries, manage clinic queues, and trace metrics."
    }
  ];

  const departments = [
    {
      icon: <Heart size={24} className="text-rose-500" />,
      title: "Cardiology",
      desc: "Comprehensive diagnostic support for arrhythmias, heart failure, palpitations, and chronic blood pressure."
    },
    {
      icon: <Brain size={24} className="text-indigo-500" />,
      title: "Neurology",
      desc: "Specialized assessment for migraine pathways, spinal tension, neural complications, and dizziness."
    },
    {
      icon: <Bone size={24} className="text-amber-500" />,
      title: "Orthopedics",
      desc: "Leading corrective solutions for joints, fractures, ligament wear, and muscular strength rehabilitation."
    },
    {
      icon: <Sparkles size={24} className="text-purple-500" />,
      title: "Dermatology",
      desc: "Esthetic treatments, skin biopsies, rash therapies, mole removals, and severe acne management."
    },
    {
      icon: <Baby size={24} className="text-sky-500" />,
      title: "Pediatrics",
      desc: "Caring child wellness clinics, periodic infant vaccinations, growth assessments, and kid therapies."
    },
    {
      icon: <Stethoscope size={24} className="text-emerald-500" />,
      title: "General Medicine",
      desc: "Comprehensive wellness advice, fever management, flu support, and standard medical diagnostics."
    }
  ];

  const testimonials = [
    {
      name: "Marcus Vance",
      role: "Chronic Cardiac Patient",
      text: "SmartCare literally changed how I see doctors. Instead of waiting for 2 hours in a highly congested hallway, I sat in a cafe across the street, tracked my queue live on my phone, and came in exactly when my token was called!",
      rating: 5
    },
    {
      name: "Sophia Rodriguez",
      role: "Working Mother of Toddler",
      text: "Booking a pediatrician session for my little girl used to be a scheduling nightmare. With standard online booking here, I scheduled a spot under Dr. Priya Nair, received an instant PDF receipt on my mail, and checked in easily.",
      rating: 5
    },
    {
      name: "Vikram Malhotra",
      role: "Neurology Outpatient",
      text: "The real-time wait line indicators are phenomenal. Seeing exactly how many patients are ahead of me saves incredible, stressful clinic waiting hours. Highly recommend Apollo-level excellence!",
      rating: 5
    }
  ];

  const faqs = [
    {
      q: "What is the token/queue number tracking feature?",
      a: "When you book a medical slot, the system automatically allocates a Token Number for your specific doctor's list today. From your patient login panel, you can watch the current live token being seen. It updates in real time as the doctor completes visits, showing exactly how many patients are ahead and computing your wait time."
    },
    {
      q: "Can I rescheduling my clinical booking online?",
      a: "Yes! Patients can cancel slots from their dashboard instantly, which updates the doctor's queue and shoots an email notification. If you need to rearrange your calendar, clinical system administrators can easily reschedule any booking and notify you via automated logs."
    },
    {
      q: "Is there an in-app helper to assist with symptoms?",
      a: "Absolutely! SmartCare features an in-app chatbot helper powered by Google's Gemini AI. Click the bubble in the bottom right corner of the screen to consult on hospital specialists, clinic hours, contact details, or department suggestions."
    },
    {
      q: "How do clinical doctors progress the queue line?",
      a: "Doctors have a streamlined control dashboard. As they complete a patient call, they click 'Complete' or 'Move Queue Forward' which automatically updates the current calling token, notifying everyone downstream instantly."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* NAVBAR */}
      <nav id="landing-navbar" className="sticky top-0 bg-white/70 backdrop-blur-md z-40 border-b border-slate-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex-none">
            <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight text-slate-900 group">
              <span className="p-1.5 bg-brand-primary text-white rounded-lg shadow-md group-hover:bg-brand-secondary transition-colors">
                <Activity size={18} />
              </span>
              <span>Smart<span className="text-brand-primary">Care</span></span>
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-end gap-8">
            <div className="hidden lg:flex items-center gap-8 text-[14px] font-medium text-slate-600">
              <a href="#features" className="hover:text-brand-primary transition-colors">Features</a>
              <a href="#departments" className="hover:text-brand-primary transition-colors">Departments</a>
              <a href="#doctors" className="hover:text-brand-primary transition-colors">Doctors</a>
              <a href="#how-it-works" className="hover:text-brand-primary transition-colors">How It Works</a>
              <a href="#faqs" className="hover:text-brand-primary transition-colors">FAQs</a>
            </div>

            <div className="flex items-center gap-8">
              <div className="relative group/menu">
                <button className="px-4 py-2 bg-brand-primary hover:bg-brand-secondary text-sm font-semibold text-white rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5">
                  Login <ChevronDown size={14} className="text-white/80 group-hover/menu:translate-y-0.5 transition-transform" />
                </button>
                <div className="absolute right-0 top-11 bg-white border border-slate-150 rounded-xl shadow-xl w-44 py-1.5 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible duration-200 transition-all z-50">
                  <Link to="/patient-login" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-primary font-medium">Patient Login</Link>
                  <Link to="/doctor-login" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-primary font-medium">Doctor Login</Link>
                  <Link to="/admin-login" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-primary font-medium">Admin Login</Link>
                </div>
              </div>
              
              <Link to="/register" className="px-4 py-2 bg-brand-primary hover:bg-brand-secondary text-sm font-semibold text-white rounded-xl shadow-md transition-all">
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section id="hero-section" className="relative pb-20 pt-10 lg:pb-32 lg:pt-16 overflow-hidden bg-gradient-to-tr from-blue-50/30 via-white to-sky-50/50">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand-accent/10 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-brand-secondary/15 rounded-full blur-3xl animate-pulse" />

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="lg:col-span-7 space-y-6 text-left"
          >
            <motion.span 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-primary/10 rounded-full text-xs font-semibold text-brand-primary"
            >
              <Sparkles size={13} />
              Redefining Hospital Queues
            </motion.span>
            <h1 className="text-4xl md:text-5xl lg:text-5xl font-bold font-sans tracking-tight leading-tight text-slate-900">
              SmartCare
            </h1>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold font-sans tracking-tight leading-tight mt-1 mb-2 text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">
              Smarter Healthcare. <br className="md:hidden" /> Shorter Wait Times.
            </h2>
            <p className="text-slate-600 text-lg md:text-xl font-normal leading-relaxed max-w-xl">
              Book appointments instantly. Track queue positions in real time. Receive automated notifications. Manage health parameters efficiently.
            </p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
              className="flex flex-wrap items-center gap-4 pt-2"
            >
              <button
                onClick={() => navigate("/register")}
                className="px-6 py-3.5 bg-brand-primary hover:bg-brand-secondary text-white rounded-xl shadow-lg hover:shadow-brand-primary/40 font-semibold transition-all cursor-pointer flex items-center gap-2 transform hover:-translate-y-1"
              >
                Get Started <ArrowRight size={16} />
              </button>
              <a
                href="#doctors"
                className="px-6 py-3.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl text-slate-700 bg-white font-semibold shadow-xs hover:shadow-md transition-all text-center transform hover:-translate-y-1"
              >
                Book Appointment
              </a>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-100"
            >
              <div>
                <p className="text-3xl font-bold text-slate-900">98%</p>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Wait reduction rate</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900">10k+</p>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Outpatients served</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900">15m</p>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Average checkout speed</p>
              </div>
            </motion.div>
          </motion.div>

          <div className="lg:col-span-1 border-0 lg:col-span-5 relative flex items-center justify-center">
            <div className="relative w-full max-w-[440px] lg:max-w-none">
              {/* Background gradient decorative glow */}
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/20 via-brand-secondary/15 to-blue-300/20 rounded-3xl rotate-2 scale-102 blur-xl -z-10" />
              
              {/* Main Medical Illustration Box */}
              <div className="relative overflow-hidden bg-white/40 border border-slate-200/50 backdrop-blur-xs rounded-3xl p-3 shadow-2xl transition-all hover:scale-[1.01] duration-300">
                <img 
                  src={heroIllustration} 
                  alt="SmartCare Digital Health Care Illustration" 
                  referrerPolicy="no-referrer"
                  className="w-full h-auto rounded-2xl object-cover" 
                />
              </div>

              {/* Secure trust badge floating underneath */}
              <div className="absolute -bottom-6 -left-4 bg-slate-900 text-white rounded-2xl px-4 py-3 shadow-xl flex items-center gap-2.5 border border-slate-800 scale-90 hidden sm:flex">
                <div className="bg-white/10 p-1.5 rounded-xl text-brand-primary">
                  <CheckCircle size={15} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">SmartCare Health Network</p>
                  <p className="text-xs font-semibold leading-normal mt-0.5">Verified Medical Partners</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-24 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-12">
          <div className="space-y-4 max-w-2xl mx-auto">
            <span className="px-3 py-1 bg-blue-50 text-brand-primary text-xs font-bold rounded-full uppercase tracking-wider">Our Solutions</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Platform Capabilities</h2>
            <p className="text-slate-500 leading-relaxed">
              We specialize in removing traditional medical friction. Book, track, and consult instantly inside a single system designed for premium institutions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="group p-8 rounded-3xl bg-slate-50 hover:bg-white border border-slate-100 hover:border-slate-200 shadow-xs hover:shadow-xl hover:-translate-y-1 duration-200 transition-all text-left space-y-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-white group-hover:scale-105 duration-200 shadow-sm flex items-center justify-center group-hover:shadow-md">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-800">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEPARTMENTS SECTION */}
      <section id="departments" className="py-24 bg-slate-50/40">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-12">
          <div className="space-y-4 max-w-2xl mx-auto">
            <span className="px-3 py-1 bg-blue-50 text-brand-primary text-xs font-bold rounded-full uppercase tracking-wider">Expertise Rooms</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Specialized Departments</h2>
            <p className="text-slate-500 leading-relaxed">
              Locate specialized healthcare professionals for deep clinical investigation and personalized patient support.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((d, i) => (
              <div
                key={i}
                className="p-6 bg-white border border-slate-100 hover:border-slate-200 rounded-3xl shadow-sm hover:shadow-lg transition-all text-left space-y-3 group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:scale-105 transition-transform">
                  {d.icon}
                </div>
                <h4 className="text-base font-bold text-slate-800">{d.title}</h4>
                <p className="text-slate-500 text-xs leading-relaxed">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DOCTORS GRID */}
      <section id="doctors" className="py-24 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-12">
          <div className="space-y-4 max-w-2xl mx-auto">
            <span className="px-3 py-1 bg-blue-50 text-brand-primary text-xs font-bold rounded-full uppercase tracking-wider">Our Staff</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Meet Resident Specialists</h2>
            <p className="text-slate-500 leading-relaxed">
              Consult board-certified senior physicians with years of clinical expertise. Select a specialist below to schedule your slot.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doc) => (
              <div
                key={doc.id}
                className="p-5 rounded-3xl border border-slate-150 hover:border-slate-250 bg-white hover:shadow-xl transition-all text-left flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden aspect-square max-h-52 bg-slate-100">
                    <img
                      src={doc.imageUrl}
                      alt={doc.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-3 left-3 px-2.5 py-0.5 bg-brand-primary text-[10px] font-bold text-white rounded-full uppercase tracking-wide">
                      {doc.specialization}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{doc.name}</h3>
                    <p className="text-slate-400 text-xs font-medium mt-0.5">Specialist | {doc.experience} Years Experience</p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Availability:</span>
                      <span className="font-semibold text-slate-600">{doc.availability}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Clinic Room:</span>
                      <span className="font-semibold text-brand-primary">Room {doc.id === 'doc_1' ? "1" : "3"}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-2">
                  <Link
                    to="/patient-login"
                    className="w-full py-2.5 mt-auto bg-brand-primary hover:bg-brand-secondary text-white font-semibold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Calendar size={13} /> Book Appointment
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-12">
          <div className="space-y-4 max-w-2xl mx-auto">
            <span className="px-3 py-1 bg-blue-50 text-brand-primary text-xs font-bold rounded-full uppercase tracking-wider">Timeline</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">How It Works</h2>
            <p className="text-slate-500 leading-relaxed font-normal">
              A streamlined patient journey mapped directly into intuitive milestone actions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 pt-8 relative">
            {[
              { num: "01", title: "Patient Register", desc: "Create an outpatient profile" },
              { num: "02", title: "Patient Login", desc: "Access secure clinical metrics" },
              { num: "03", title: "Book Appointment", desc: "Select doctor, day, reason" },
              { num: "04", title: "Queue Number Generated", desc: "Instant automated token" },
              { num: "05", title: "Email Sent", desc: "Recieve EmailJS confirmation" },
              { num: "06", title: "Track Queue", desc: "Follow lines in real time" },
              { num: "07", title: "Visit Doctor", desc: "Walk in precisely on call" }
            ].map((step, i) => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs text-left relative flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="text-3xl font-extrabold text-blue-100 block">{step.num}</span>
                  <h4 className="text-sm font-bold text-slate-800 leading-snug">{step.title}</h4>
                  <p className="text-slate-400 text-xs leading-normal">{step.desc}</p>
                </div>
                {i < 6 && (
                  <span className="hidden xl:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 p-1 bg-slate-100 rounded-full text-slate-400">
                    <ChevronRight size={12} />
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-10">
          <div className="space-y-4 max-w-2xl mx-auto">
            <span className="px-3 py-1 bg-blue-50 text-brand-primary text-xs font-bold rounded-full uppercase tracking-wider">Patient Journals</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Outpatient Testimonials</h2>
          </div>

          <div className="relative max-w-3xl mx-auto bg-slate-50 p-8 md:p-12 rounded-3xl border border-slate-100">
            <div className="absolute top-4 right-6 text-slate-200 font-serif text-8xl pointer-events-none select-none">“</div>
            
            <div className="space-y-6 text-left relative">
              <div className="flex gap-1 text-amber-400">
                {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
              </div>

              <p className="text-slate-600 text-base md:text-lg italic leading-relaxed font-normal">
                "{testimonials[activeTestimonial].text}"
              </p>

              <div>
                <p className="text-slate-800 font-bold text-sm leading-none">{testimonials[activeTestimonial].name}</p>
                <p className="text-slate-400 text-[11px] font-medium mt-1 uppercase tracking-wider">{testimonials[activeTestimonial].role}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-6 mt-6 border-t border-slate-200/50">
              <button
                onClick={() => setActiveTestimonial((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))}
                className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} className="text-slate-600" />
              </button>
              <button
                onClick={() => setActiveTestimonial((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1))}
                className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <ChevronRight size={16} className="text-slate-600" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQS SECTION */}
      <section id="faqs" className="py-24 bg-slate-50/30">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-12">
          <div className="space-y-4 max-w-2xl mx-auto">
            <span className="px-3 py-1 bg-blue-50 text-brand-primary text-xs font-bold rounded-full uppercase tracking-wider">Information</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-slate-500 leading-relaxed font-normal">
              Quick reference guidelines on managing and scheduling appointments at SmartCare.
            </p>
          </div>

          <div className="space-y-3 text-left">
            {faqs.map((f, idx) => (
              <div key={idx} className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
                <button
                  onClick={() => setActiveFaq((prev) => (prev === idx ? null : idx))}
                  className="w-full px-6 py-5 flex items-center justify-between font-bold text-slate-800 text-sm hover:bg-slate-50 transition-colors cursor-pointer text-left"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle size={16} className="text-brand-primary" /> {f.q}
                  </span>
                  <ChevronDown size={16} className={`text-slate-450 transition-transform ${activeFaq === idx ? "rotate-180" : ""}`} />
                </button>
                {activeFaq === idx && (
                  <div className="px-6 pb-6 pt-1 text-xs text-slate-500 leading-relaxed border-t border-slate-50 bg-slate-50/20">
                    <p>{f.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section id="contact" className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-92 h-92 bg-brand-primary/10 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6 text-left">
            <span className="inline-flex px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-brand-accent uppercase tracking-wider">Reach Out</span>
            <h2 className="text-3xl md:text-4xl font-bold font-sans tracking-tight">Contact Support Information</h2>
            <p className="text-slate-400 leading-relaxed text-sm">
              Do you have queries about your clinical reservation, need specialist diagnostic alignments, or require administrative queue troubleshooting?
            </p>

            <div className="space-y-4 pt-4">
              <div className="flex gap-3 items-start">
                <span className="p-2.5 bg-white/10 rounded-xl text-brand-accent">
                  <Phone size={18} />
                </span>
                <div>
                  <p className="text-xs text-slate-400 font-medium font-sans">Direct Hotline</p>
                  <p className="text-sm font-semibold text-slate-200 mt-0.5">+91 63059 10456</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <span className="p-2.5 bg-white/10 rounded-xl text-brand-accent">
                  <Mail size={18} />
                </span>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Email Desk</p>
                  <p className="text-sm font-semibold text-slate-200 mt-0.5">support@smartcare.org</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <span className="p-2.5 bg-white/10 rounded-xl text-brand-accent">
                  <MapPin size={18} />
                </span>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Clinic Coordinates</p>
                  <p className="text-sm font-semibold text-slate-200 mt-0.5">100 Medical Plaza, Health Square, NY 10001</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl p-6 md:p-8 text-left space-y-4">
              <h3 className="text-lg font-bold">Inquire Immediately</h3>
              <p className="text-xs text-slate-400">Fill in details and our clinic desk will trigger an automated mail response.</p>
              
              <form onSubmit={handleContactSubmit} className="space-y-3.5 pt-2">
                {contactSuccessMessage && (
                  <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs leading-relaxed">
                    {contactSuccessMessage}
                  </div>
                )}
                {contactErrorMessage && (
                  <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-400 text-xs leading-relaxed">
                    {contactErrorMessage}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Your Name</label>
                  <input
                    required
                    type="text"
                    placeholder="Johnathan Doe"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-brand-accent text-slate-200 text-sm placeholder-slate-500"
                    disabled={isSubmittingContact}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Email Address</label>
                  <input
                    required
                    type="email"
                    placeholder="john@example.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-brand-accent text-slate-200 text-sm placeholder-slate-500"
                    disabled={isSubmittingContact}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Describe Consultation Motive</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Cardiovascular palpitations, neurological pain, dermatologist diagnosis advice..."
                    value={contactMotive}
                    onChange={(e) => setContactMotive(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-brand-accent text-slate-200 text-sm placeholder-slate-500 resize-none"
                    disabled={isSubmittingContact}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingContact}
                  className="w-full py-3 bg-brand-primary hover:bg-brand-secondary text-white font-semibold text-sm rounded-xl transition-all shadow-md mt-2 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingContact ? "Submitting Inquiry..." : "Submit Direct Inquiry"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 py-12 border-t border-white/5 text-slate-500 text-xs font-normal">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-slate-200 font-bold text-base tracking-tight">
            <span className="p-1 bg-brand-primary text-white rounded-md">
              <Activity size={15} />
            </span>
            <span>Smart<span className="text-brand-primary">Care</span></span>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-[11px] uppercase tracking-wider text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#departments" className="hover:text-white transition-colors">Departments</a>
            <a href="#doctors" className="hover:text-white transition-colors">Doctors</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
          </div>

          <p className="text-slate-600">© 2026 SmartCare Clinical Platform.</p>
        </div>
      </footer>
      <AiAssistant />
    </div>
  );
}

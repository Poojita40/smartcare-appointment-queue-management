import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { User, Mail, Phone, Calendar, UserPlus, ArrowLeft, ShieldAlert } from "lucide-react";
import axios from "axios";
import { emailService } from "../services/emailService";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    age: "",
    gender: "Male",
    address: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.name || !formData.email || !formData.phone || !formData.age || !formData.address || !formData.password) {
      setError("Please input all required categories.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (isNaN(Number(formData.age)) || Number(formData.age) <= 0) {
      setError("Please input a valid age.");
      return;
    }

    setLoading(true);

    try {
      await axios.post("/api/auth/register", {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        age: Number(formData.age),
        gender: formData.gender,
        address: formData.address,
        password: formData.password
      });

      // Also trigger client-side welcome email dispatch if credentials are ready
      try {
        await emailService.sendWelcomeEmail(formData.name, formData.email);
      } catch (clientEmailErr) {
        console.warn("[Patient Register Client Email] Non-blocking email dispatch warning:", clientEmailErr);
      }

      setSuccess(true);
      setTimeout(() => {
        navigate("/patient-login", { state: { email: formData.email } });
      }, 2500);
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration error. Email might be in use.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-gradient-to-tr from-blue-50/40 via-white to-pink-50/20">
      <div className="absolute top-6 left-6">
        <Link to="/" className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-brand-primary transition-colors bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-xs">
          <ArrowLeft size={14} /> Back to Home
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-100 p-8 space-y-6 text-left"
      >
        <div className="text-center space-y-2">
          <span className="inline-flex p-3 bg-brand-primary/10 text-brand-primary rounded-2xl shadow-xs">
            <UserPlus size={26} />
          </span>
          <h2 className="text-2xl font-bold text-slate-900 font-sans mt-2">Patient Registration</h2>
          <p className="text-slate-400 text-xs text-center">Create your secure profile, track line progress, & receive welcome email</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-105 text-xs font-semibold flex items-center gap-2">
            <ShieldAlert size={14} />
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-xs font-bold leading-normal">
            Registration Successful! Welcome automated email was sent via simulated EmailJS. Redirecting to Patient Login...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <User size={15} />
                </span>
                <input
                  required
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-primary text-slate-800 text-sm placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail size={15} />
                </span>
                <input
                  required
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-primary text-slate-800 text-sm placeholder-slate-400"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Phone Number</label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Phone size={15} />
                </span>
                <input
                  required
                  name="phone"
                  type="text"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="555-0199"
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-primary text-slate-800 text-sm placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Age (Years)</label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Calendar size={15} />
                </span>
                <input
                  required
                  name="age"
                  type="number"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="34"
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-primary text-slate-800 text-sm placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Gender Selection</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
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
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="742 Evergreen Terrace, Springfield"
              className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-primary text-slate-800 text-sm placeholder-slate-400 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Password</label>
              <input
                required
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-primary text-slate-800 text-sm placeholder-slate-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Confirm Password</label>
              <input
                required
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-primary text-slate-800 text-sm placeholder-slate-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-3 bg-brand-primary hover:bg-brand-secondary text-white font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-3"
          >
            {loading ? "Creating Profile..." : "Register Profile & Notify Support"}
          </button>
        </form>

        <div className="pt-2 text-center">
          <p className="text-xs text-slate-500 font-medium">
            Already registered?{" "}
            <Link to="/patient-login" className="text-brand-primary hover:underline font-semibold">
              Log In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

const DB_FILE = path.join(process.cwd(), "db.json");

// In-Memory Database State Defaults
const defaultPatients = [
  {
    id: "pat_1",
    name: "John Doe",
    email: "john@example.com",
    phone: "555-0199",
    age: 34,
    gender: "Male" as const,
    address: "742 Evergreen Terrace, Springfield",
    password: "password123",
    role: "PATIENT" as const,
  },
  {
    id: "pat_2",
    name: "Jane Smith",
    email: "jane@example.com",
    phone: "555-0144",
    age: 29,
    gender: "Female" as const,
    address: "123 Maple Street, Riverdale",
    password: "password123",
    role: "PATIENT" as const,
  },
  {
    id: "pat_poojita",
    name: "Poojita Lakkakula",
    email: "poojitalakkakula09@gmail.com",
    phone: "91-63059-12345",
    age: 21,
    gender: "Female" as const,
    address: "Anurag University Campus, Hyderabad",
    password: "password123",
    role: "PATIENT" as const,
  }
];

const defaultDoctors = [
  {
    id: "doc_1",
    name: "Dr. Arvind Sharma",
    email: "arvind@smartcare.org",
    password: "password123",
    specialization: "Cardiology" as const,
    experience: 15,
    availability: "09:00 AM - 10:00 PM",
    imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face",
    role: "DOCTOR" as const,
  },
  {
    id: "doc_2",
    name: "Dr. Sarah Jenkins",
    email: "sarah@smartcare.org",
    password: "password123",
    specialization: "Neurology" as const,
    experience: 12,
    availability: "10:00 AM - 10:00 PM",
    imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face",
    role: "DOCTOR" as const,
  },
  {
    id: "doc_3",
    name: "Dr. Rajesh Patel",
    email: "rajesh@smartcare.org",
    password: "password123",
    specialization: "Orthopedics" as const,
    experience: 10,
    availability: "02:00 PM - 10:00 PM",
    imageUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&h=150&fit=crop&crop=face",
    role: "DOCTOR" as const,
  },
  {
    id: "doc_4",
    name: "Dr. Priya Nair",
    email: "priya@smartcare.org",
    password: "password123",
    specialization: "Pediatrics" as const,
    experience: 8,
    availability: "09:00 AM - 10:00 PM",
    imageUrl: "/src/assets/images/priya_nair_1781097436515.png",
    role: "DOCTOR" as const,
  },
  {
    id: "doc_5",
    name: "Dr. Chloe DuPont",
    email: "chloe@smartcare.org",
    password: "password123",
    specialization: "Dermatology" as const,
    experience: 7,
    availability: "11:00 AM - 10:00 PM",
    imageUrl: "https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=150&h=150&fit=crop&crop=face",
    role: "DOCTOR" as const,
  },
  {
    id: "doc_6",
    name: "Dr. Marcus Vance",
    email: "marcus@smartcare.org",
    password: "password123",
    specialization: "General Medicine" as const,
    experience: 14,
    availability: "08:00 AM - 10:00 PM",
    imageUrl: "/src/assets/images/marcus_vance_headshot_1781097572071.png",
    role: "DOCTOR" as const,
  }
];

const adminUser = {
  id: "admin_1",
  name: "System Administrator",
  email: "admin@smartcare.org",
  password: "adminpassword",
  role: "ADMIN" as const,
};

// Seed outstanding initial appointments so the system feels alive immediately
const defaultAppointments: Array<{
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "Confirmed" | "Checked-in" | "CANCELLED" | "COMPLETED";
  queueNumber: number;
  tokenNumber: number;
  createdAt: string | number;
}> = [
  {
    id: "appt_1",
    patientId: "pat_1",
    doctorId: "doc_1", // Dr. Arvind Sharma
    date: new Date().toISOString().split("T")[0],
    time: "09:15 AM",
    reason: "Routine cardiovascular checkup, periodic heart palpitations.",
    status: "APPROVED",
    queueNumber: 1,
    tokenNumber: 1,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "appt_2",
    patientId: "pat_2",
    doctorId: "doc_1", // Dr. Arvind Sharma
    date: new Date().toISOString().split("T")[0],
    time: "09:30 AM",
    reason: "Follow-up on high blood pressure prescription.",
    status: "APPROVED",
    queueNumber: 2,
    tokenNumber: 2,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "appt_3",
    patientId: "pat_1",
    doctorId: "doc_6", // Dr. Marcus Vance
    date: new Date().toISOString().split("T")[0],
    time: "08:15 AM",
    reason: "Mild allergy symptoms and sore throat.",
    status: "COMPLETED",
    queueNumber: 1,
    tokenNumber: 1,
    createdAt: Date.now() - 86400000 * 1, // Yesterday
  }
];

// Map of doctor queues progress. Key: doctorId, value: current running token number
const defaultQueueProgress: Record<string, number> = {
  doc_1: 1, // Dr. Arvind Sharma is currently calling Token 1 (John Doe active, Jane Smith Token 2 is up next)
  doc_2: 0,
  doc_3: 0,
  doc_4: 0,
  doc_5: 0,
  doc_6: 1, // Dr. Marcus Vance completed Token 1
};

// Simulated email notifications
const defaultEmailLogs = [
  {
    id: "email_poojita_welcome",
    recipientEmail: "poojitalakkakula09@gmail.com",
    recipientName: "Poojita Lakkakula",
    subject: "Welcome to SmartCare!",
    body: "Dear Poojita Lakkakula,\n\nWelcome to SmartCare—Smarter Healthcare, Shorter Wait Times.\n\nYour account has been pre-registered successfully!\n\nYour credentials:\n- Username (Email): poojitalakkakula09@gmail.com\n- Password: password123\n- Role: Patient\n\nYou can now log in, search for leading doctors (Cardiology, Neurology, Orthopedics, Pediatrics, Dermatology, General Medicine), book real-time appointments, and monitor live queue wait lines seamlessly!\n\nWarm regards,\nThe SmartCare Healthcare Team",
    type: "REGISTRATION",
    sentAt: new Date().toISOString(),
  },
  {
    id: "email_1",
    recipientEmail: "john@example.com",
    recipientName: "John Doe",
    subject: "Welcome to SmartCare!",
    body: "Dear John Doe,\n\nWelcome to SmartCare—Smarter Healthcare, Shorter Wait Times. Your account has been created successfully. You can now log in, schedule appointments, and view real-time queue states!\n\nBest wishes,\nThe SmartCare Team",
    type: "REGISTRATION",
    sentAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "email_2",
    recipientEmail: "john@example.com",
    recipientName: "John Doe",
    subject: "Appointment Booking Request Confirmed",
    body: "Dear John Doe,\n\nYour appointment request for Dr. Arvind Sharma (Cardiology) has been received and confirmed.\nYour assigned Token Number is 1.\nDate: Today\nTime: 09:15 AM\n\nYou can track your live queue position and estimated wait times on your dashboard.\n\nBest regards,\nSmartCare Clinic",
    type: "BOOKING",
    sentAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  }
];

// Active running mutable state references
let patients = [...defaultPatients];
let doctors = [...defaultDoctors];
let appointments = [...defaultAppointments];
let doctorQueueProgress = { ...defaultQueueProgress };
let emailLogs = [...defaultEmailLogs];

// Persistent EmailJS Configuration (Stored in db.json & environment)
let emailjsSettings = {
  serviceId: process.env.EMAILJS_SERVICE_ID || "",
  templateId: process.env.EMAILJS_TEMPLATE_ID || "",
  publicKey: process.env.EMAILJS_PUBLIC_KEY || "",
  privateKey: process.env.EMAILJS_PRIVATE_KEY || "",
  receiverEmail: process.env.EMAILJS_RECEIVER_EMAIL || "poojitalakkakula09@gmail.com",
  isEnabled: true
};

// Persist data locally to survive restarts/hot-relocks gracefully
function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const saved = JSON.parse(raw);
      if (Array.isArray(saved.patients)) patients = saved.patients;
      if (Array.isArray(saved.doctors)) doctors = saved.doctors;
      if (Array.isArray(saved.appointments)) appointments = saved.appointments;
      if (saved.doctorQueueProgress) doctorQueueProgress = saved.doctorQueueProgress;
      if (Array.isArray(saved.emailLogs)) emailLogs = saved.emailLogs;
      if (saved.emailjsSettings) emailjsSettings = { ...emailjsSettings, ...saved.emailjsSettings };
      console.log(`[DB] Successfully loaded ${patients.length} patients, ${doctors.length} doctors, ${appointments.length} appointments, and ${emailLogs.length} simulated emails from db.json`);
    } else {
      console.log("[DB] No database file found. Saving defaults as db.json");
      saveDatabase();
    }
  } catch (err) {
    console.warn("[DB] Loader error, falling back to memory database:", err);
  }
}

function saveDatabase() {
  try {
    const payload = {
      patients,
      doctors,
      appointments,
      doctorQueueProgress,
      emailLogs,
      emailjsSettings
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(payload, null, 2), "utf-8");
  } catch (err) {
    console.error("[DB] Saving failed:", err);
  }
}

// Trigger loading on bootstrap
loadDatabase();

// Server-side helper to generate beautiful ASCII Queue Ticket Passes
function generateQueueCard(
  patientName: string,
  doctorName: string,
  specialization: string,
  queueNumber: string | number,
  apptDate: string,
  apptTime: string,
  status: string
): string {
  const cardBorder =  "┌───────────────────────────────────────────────────┐";
  const cardDivider = "├───────────────────────────────────────────────────┤";
  const bottomBorder = "└───────────────────────────────────────────────────┘";

  const padField = (label: string, value: string, length: number = 47) => {
    const combined = `  ${label}: ${value}`;
    const spaces = length - combined.length;
    return spaces > 0 ? combined + " ".repeat(spaces) : combined;
  };

  const centerLine = (text: string, length: number = 47) => {
    const leftPad = Math.max(0, Math.floor((length - text.length) / 2));
    const rightPad = Math.max(0, length - text.length - leftPad);
    return "  " + " ".repeat(leftPad) + text + " ".repeat(rightPad);
  };

  const formattedToken = `# ${String(queueNumber).padStart(2, "0")}`;

  return [
    cardBorder,
    centerLine("SMARTCARE MEDICAL CLINIC"),
    centerLine("OFFICIAL QUEUE APPOINTMENT ACCESS PASS"),
    cardDivider,
    padField("PATIENT", patientName),
    padField("DOCTOR", `${doctorName} (${specialization})`),
    padField("DATE", apptDate),
    padField("TIME", apptTime),
    cardDivider,
    "  ┌───────────────────────────────────────────────┐  ",
    `  │             ASSIGNED QUEUE TOKEN              │  `,
    `  │                                               │  `,
    `  │                  ${formattedToken.padEnd(8, " ")}                     │  `,
    `  │                                               │  `,
    `  │          STATUS: ${status.padEnd(20, " ")}         │  `,
    "  └───────────────────────────────────────────────┘  ",
    cardDivider,
    centerLine("PLEASE PRESENT THIS CARD AT THE CLINIC DESK"),
    centerLine("MONITOR YOUR LIVE WAIT TIMES ONLINE IN APP"),
    bottomBorder
  ].join("\n");
}

// High-Fidelity Responsive HTML Email Builder
function generateHighFidelityEmailBody(
  type: string,
  recipientName: string,
  subject: string,
  plainTextFallback: string,
  metadata?: {
    doctorName?: string;
    specialization?: string;
    queueNumber?: string | number;
    apptDate?: string;
    apptTime?: string;
    status?: string;
    email?: string;
    message?: string;
  }
): string {
  const status = metadata?.status || (type === "APPROVAL" ? "APPROVED" : (type === "CANCELLATION" ? "CANCELLED" : "PENDING"));
  
  let statusColor = "#d97706";
  let statusBg = "#fffbeb";
  let statusBorder = "rgba(217, 119, 6, 0.15)";
  
  if (status === "APPROVED") {
    statusColor = "#059669";
    statusBg = "#ecfdf5";
    statusBorder = "rgba(5, 150, 105, 0.15)";
  } else if (status === "CANCELLED") {
    statusColor = "#dc2626";
    statusBg = "#fef2f2";
    statusBorder = "rgba(220, 38, 38, 0.15)";
  } else if (status === "RESCHEDULED" || type === "REMINDER") {
    statusColor = "#2563eb";
    statusBg = "#eff6ff";
    statusBorder = "rgba(37, 99, 235, 0.15)";
  }

  const qNumStr = String(metadata?.queueNumber || "01").padStart(2, "0");
  const doctorName = metadata?.doctorName || "SmartCare Practitioner";
  const specialization = metadata?.specialization || "Clinical Consultation";
  const dateStr = metadata?.apptDate || "Today";
  const timeStr = metadata?.apptTime || "Soon";

  const showQueueCard = ["BOOKING", "APPROVAL", "REMINDER", "REMIND", "RESCHEDULED"].includes(type) || !!metadata?.queueNumber;
  let queueCardHtml = "";

  if (showQueueCard) {
    queueCardHtml = `
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 24px 0 16px 0;">
  <tr>
    <td align="center">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 440px; background-color: #ffffff; border: 2px solid #4f46e5; border-radius: 20px; box-shadow: 0 10px 25px -5px rgba(80, 70, 229, 0.1); overflow: hidden; border-collapse: separate;">
        <tr>
          <td height="6" style="background: #4f46e5; background: linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%); line-height: 6px; font-size: 1px;">&nbsp;</td>
        </tr>
        <tr>
          <td style="padding: 24px; text-align: center;">
            <p style="margin: 0 0 6px 0; color: #4f46e5; font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">SMARTCARE ACCESS PASS</p>
            <h3 style="margin: 0 0 20px 0; color: #01172a; font-size: 16px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Clinic Reception Token</h3>
            
            <div style="margin: 15px 0; text-align: center;">
              <span style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; display: block; margin-bottom: 4px;">Assigned Queue Position</span>
              <div style="display: inline-block; font-size: 50px; font-weight: 950; color: #1e1b4b; line-height: 1; letter-spacing: -2px; padding: 10px 24px; background-color: #f5f3ff; border-radius: 12px; border: 1px solid #e0dbff;">#${qNumStr}</div>
            </div>

            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 16px; text-align: left; font-size: 13px; border-collapse: separate;">
              <tr>
                <td style="padding-bottom: 10px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 12px;">Patient:</td>
                <td style="padding-bottom: 10px; border-bottom: 1px solid #f1f5f9; text-align: right; color: #0f172a; font-weight: 800; font-size: 12px;">${recipientName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 12px;">Doctor:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right; color: #0f172a; font-weight: 800; font-size: 12px;">${doctorName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 12px;">Specialty:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right; color: #01172a; font-style: italic; font-size: 12px;">${specialization}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 12px;">Scheduled:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right; color: #0f172a; font-weight: 800; font-size: 12px;">${dateStr} @ ${timeStr}</td>
              </tr>
              <tr>
                <td style="padding-top: 10px; color: #64748b; vertical-align: middle; font-size: 12px;">Status:</td>
                <td style="padding-top: 10px; text-align: right; vertical-align: middle;">
                  <span style="background-color: ${statusBg}; color: ${statusColor}; padding: 4px 12px; border-radius: 6px; font-weight: 800; font-size: 10px; text-transform: uppercase; border: 1px solid ${statusBorder}; display: inline-block;">${status}</span>
                </td>
              </tr>
            </table>

            <div style="border-top: 2px dashed #e2e8f0; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 10.5px; line-height: 1.5; font-weight: 500;">
              Please present this pass open at waitlist coordination desks.<br/>Monitored priority queue schedules apply.
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
  }

  // Create different email section bodies based on type
  let headingHtml = `<h2 style="margin: 0 0 16px 0; color: #1e1b4b; font-size: 18px; font-weight: 800; letter-spacing: -0.3px;">Dear ${recipientName},</h2>`;
  let contentBody = "";
  let footerTipHtml = "Please preserve this notice on your smartphone.<br/>Track and monitor live clinic queues inside your patient portal.";

  if (type === "REGISTRATION") {
    contentBody = `
      <p style="margin: 0 0 20px 0; color: #475569; font-size: 14px; line-height: 1.6;">Your registration with SmartCare was successful! You are now equipped with instant, smart doctor slots booking and live waitlist priority trackers.</p>
      
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 24px; border-collapse: separate;">
        <tr>
          <td colspan="2" style="padding-bottom: 12px; border-bottom: 1px solid #f1f5f9;">
            <p style="margin: 0; font-size: 11px; font-weight: 900; color: #4f46e5; text-transform: uppercase; letter-spacing: 1px;">Secure Account Credentials</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #64748b; font-size: 13px;">Login Username:</td>
          <td style="padding: 10px 0; font-weight: 700; color: #01172a; font-size: 13px; text-align: right;">${metadata?.email || "Registered Outpatient Email"}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0 0 0; color: #64748b; font-size: 13px;">Outpatient Access Role:</td>
          <td style="padding: 10px 0 0 0; font-weight: 700; color: #01172a; font-size: 13px; text-align: right;">Registered Patient</td>
        </tr>
      </table>
      
      <p style="margin: 0; color: #475569; font-size: 13px; line-height: 1.6;">Please log into your SmartCare portal to configure your outpatient health dashboard.</p>
    `;
    footerTipHtml = "Welcome to our next-generation clinic network. Support is active 24/7.";
  } else if (type === "BOOKING") {
    contentBody = `
      <p style="margin: 0 0 16px 0; color: #475569; font-size: 14px; line-height: 1.6;">Your appointment request has been submitted successfully to our clinic operations queue. Staff are actively indexing doctor schedules to approve your requested slot.</p>
      ${queueCardHtml}
      <p style="margin: 16px 0 0 0; color: #475569; font-size: 13px; line-height: 1.6;">We will notify you on this email address immediately once the clinical staff reviews and approves your visit.</p>
    `;
  } else if (type === "APPROVAL" || status === "APPROVED") {
    contentBody = `
      <p style="margin: 0 0 16px 0; color: #059669; font-size: 15px; font-weight: 700; line-height: 1.6;">Your clinical appointment request is APPROVED!</p>
      <p style="margin: 0 0 16px 0; color: #475569; font-size: 14px; line-height: 1.6;">Your schedule has been successfully secured and registered. Your digital outpatient token is officially verified.</p>
      ${queueCardHtml}
      <p style="margin: 16px 0 0 0; color: #475569; font-size: 13px; line-height: 1.6;"><strong>Arrival Guidance:</strong> Kindly arrive at least 15 minutes prior to your slot. You may monitor the exact live wait queues directly inside your outpatient inbox.</p>
    `;
  } else if (type === "CANCELLATION" || status === "CANCELLED") {
    contentBody = `
      <p style="margin: 0 0 16px 0; color: #dc2626; font-size: 15px; font-weight: 700; line-height: 1.6;">Clinic Notice: Outpatient Appointment CANCELLED</p>
      <p style="margin: 0 0 16px 0; color: #475569; font-size: 14px; line-height: 1.6;">This is to inform you that your scheduled appointment with <strong>${doctorName}</strong> has been cancelled.</p>
      
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 16px; padding: 18px; margin-bottom: 24px; border-collapse: separate;">
        <tr>
          <td style="color: #991b1b; font-size: 13px; font-weight: 700;">Doctor:</td>
          <td style="text-align: right; color: #991b1b; font-size: 13px; font-weight: 700;">${doctorName}</td>
        </tr>
        <tr>
          <td style="padding-top: 8px; color: #991b1b; font-size: 13px;">Scheduled Slot:</td>
          <td style="padding-top: 8px; text-align: right; color: #991b1b; font-size: 13px; font-weight: bold;">${dateStr} @ ${timeStr}</td>
        </tr>
      </table>
      
      <p style="margin: 0; color: #475569; font-size: 13px; line-height: 1.6;">If you did not request this cancellation or would like to instantly schedule another doctor, please log back into the portal.</p>
    `;
    footerTipHtml = "SmartCare Help Desk: Contact us to resolve cancellation disputes.";
  } else if (type === "REMINDER" || status === "RESCHEDULED") {
    contentBody = `
      <p style="margin: 0 0 16px 0; color: #2563eb; font-size: 15px; font-weight: 700; line-height: 1.6;">Administrative Notice: Appointment Rescheduled</p>
      <p style="margin: 0 0 16px 0; color: #475569; font-size: 14px; line-height: 1.6;">Your scheduled outpatient visit has been modified by the administrative desks to ensure zero queue delays. Details of your new appointment slot are attached below:</p>
      ${queueCardHtml}
      <p style="margin: 16px 0 0 0; color: #475569; font-size: 13px; line-height: 1.6;">Please track your live token priority slot position live on the app before arriving.</p>
    `;
  } else if (type === "INQUIRY") {
    headingHtml = `<h2 style="margin: 0 0 16px 0; color: #1e1b4b; font-size: 18px; font-weight: 800;">New Support Ticket log</h2>`;
    contentBody = `
      <p style="margin: 0 0 20px 0; color: #475569; font-size: 14px; line-height: 1.6;">A visitor has submitted a new support ticket through the SmartCare online support desk form.</p>
      
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; border-collapse: separate;">
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 12px; width: 30%;">Visitor Name:</td>
          <td style="padding: 6px 0; font-weight: bold; color: #0f172a; font-size: 12px;">${recipientName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 12px;">Email:</td>
          <td style="padding: 6px 0; font-weight: bold; color: #0f172a; font-size: 12px;">${metadata?.email || "No Email Provided"}</td>
        </tr>
        <tr>
          <td style="padding-top: 12px; border-top: 1px solid #f1f5f9; color: #64748b; font-size: 12px;" colspan="2">Inquiry message:</td>
        </tr>
        <tr>
          <td style="padding-top: 8px; color: #01172a; font-size: 13px; font-style: italic; font-weight: 500;" colspan="2">
            "${metadata?.message || plainTextFallback}"
          </td>
        </tr>
      </table>
    `;
    footerTipHtml = "SmartCare Admin Operations. Triage level: Pending Staff Review.";
  } else if (type === "AUTO_REPLY") {
    contentBody = `
      <p style="margin: 0 0 20px 0; color: #475569; font-size: 14px; line-height: 1.6;">Thank you for contacting SmartCare Clinic. This confirmation notice verifies that your inquiry has been logged successfully at our coordination desks.</p>
      
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 20px; border-collapse: separate;">
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Subject:</td>
          <td style="padding: 6px 0; font-weight: bold; color: #0f172a; font-size: 13px; text-align: right;">${subject}</td>
        </tr>
        <tr>
          <td style="padding-top: 12px; border-top: 1px solid #f1f5f9; color: #64748b; font-size: 12px;" colspan="2">Inquiry summary received:</td>
        </tr>
        <tr>
          <td style="padding-top: 8px; color: #334155; font-size: 13px; font-style: italic;" colspan="2">
            "${metadata?.message || "Our team will evaluate your message shortly."}"
          </td>
        </tr>
      </table>
      
      <p style="margin: 0; color: #475569; font-size: 13px; line-height: 1.6;">Our triage desk is reviewing the inquiry. An administrator or consultant will follow up on this thread at our earliest convenience.</p>
    `;
    footerTipHtml = "This is a courtesy automated response. No reply required.";
  } else {
    contentBody = `
      <p style="margin: 0 0 20px 0; color: #475569; font-size: 14px; line-height: 1.6;">${plainTextFallback.replace(/\n/g, "<br/>")}</p>
    `;
  }

  const finalHtmlMessage = `
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f1f5f9; padding: 40px 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; min-height: 100%;">
  <tr>
    <td align="center">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 24px; box-shadow: 0 15px 35px -5px rgba(0,0,0,0.05), 0 5px 15px -5px rgba(0,0,0,0.03); overflow: hidden; border-collapse: separate; border: 1px solid #e2e8f0; text-align: left;">
        <tr>
          <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 40px; text-align: left;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td>
                  <span style="color: #4ade80; font-size: 11px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; display: block; margin-bottom: 4px;">SmartCare Portal</span>
                  <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; tracking: -0.5px; line-height: 1.2;">Clinical Assistant Dispatch</h1>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        
        <tr>
          <td style="padding: 40px 40px 32px 40px; background-color: #ffffff; text-align: left;">
            ${headingHtml}
            ${contentBody}
          </td>
        </tr>
        
        <tr>
          <td style="background-color: #fafbfd; padding: 16px 40px; border-top: 1px dashed #e2e8f0; text-align: center;">
            <p style="margin: 0; font-size: 11px; color: #94a3b8; font-weight: 600; line-height: 1.6;">
              ${footerTipHtml}
            </p>
          </td>
        </tr>
        
        <tr>
          <td style="background-color: #f8fafc; padding: 24px 40px; text-align: center; border-bottom-left-radius: 24px; border-bottom-right-radius: 24px; border-top: 1px solid #f1f5f9;">
            <p style="margin: 0 0 4px 0; font-size: 11px; color: #64748b; font-weight: 700;">SmartCare Medical Center Inc.</p>
            <p style="margin: 0; font-size: 10px; color: #94a3b8;">You are receiving this automated email as part of your registered outpatient services.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;

  return finalHtmlMessage.trim();
}

// Server-side real-world dispatch function using EmailJS REST API
async function sendEmailWithEmailJS(
  recipientEmail: string,
  recipientName: string,
  subject: string,
  body: string,
  type: string,
  metadata?: {
    doctorName?: string;
    specialization?: string;
    queueNumber?: string | number;
    apptDate?: string;
    apptTime?: string;
    status?: string;
  },
  throwOnError: boolean = false
) {
  const serviceId = (emailjsSettings.serviceId || process.env.EMAILJS_SERVICE_ID || process.env.VITE_EMAILJS_SERVICE_ID || "").trim();
  const templateId = (emailjsSettings.templateId || process.env.EMAILJS_TEMPLATE_ID || process.env.VITE_EMAILJS_TEMPLATE_ID || "").trim();
  const publicKey = (emailjsSettings.publicKey || process.env.EMAILJS_PUBLIC_KEY || process.env.VITE_EMAILJS_PUBLIC_KEY || "").trim();
  const privateKey = (emailjsSettings.privateKey || process.env.EMAILJS_PRIVATE_KEY || process.env.VITE_EMAILJS_PRIVATE_KEY || "").trim();

  const maskStr = (str: string) => str ? `${str.slice(0, 4)}...${str.slice(-3)}` : "None";

  if (!serviceId || !templateId || !publicKey) {
    const errorMsg = `Credentials lacking (Service: ${maskStr(serviceId)}, Template: ${maskStr(templateId)}, Public Key: ${maskStr(publicKey)}). Bypassing real live delivery. App is running in simulated client log mode.`;
    console.log(`[EmailJS INFO] ${errorMsg}`);
    if (throwOnError) {
      throw new Error("EmailJS configurations are incomplete on this server. Please enter Service ID, Template ID, and Public Key.");
    }
    return;
  }

  try {
    console.log(`[EmailJS ACTIVE] Ready to dispatch to ${recipientEmail} (Service ID: ${maskStr(serviceId)}, Template ID: ${maskStr(templateId)})`);
    
    // Generate lovely high-fidelity HTML ticket card if metadata was supplied (backward-compatible param pass)
    let queueCardHtml = "";
    if (metadata && metadata.queueNumber) {
      const qNumStr = String(metadata.queueNumber).padStart(2, "0");
      const statusColor = metadata.status === "APPROVED" ? "#059669" : "#d97706";
      const statusBg = metadata.status === "APPROVED" ? "#ecfdf5" : "#fffbeb";
      
      queueCardHtml = `
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 15px 0;">
  <tr>
    <td align="center">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 420px; background-color: #ffffff; border: 2px solid #5046e5; border-radius: 20px; box-shadow: 0 10px 25px -5px rgba(80, 70, 229, 0.1); overflow: hidden; border-collapse: separate;">
        <tr>
          <td height="6" style="background: #5046e5; background: linear-gradient(90deg, #5046e5 0%, #7c3aed 100%); line-height: 6px; font-size: 1px;">&nbsp;</td>
        </tr>
        <tr>
          <td style="padding: 24px; text-align: center;">
            <p style="margin: 0 0 6px 0; color: #5046e5; font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">SMARTCARE ACCESS PASS</p>
            <h3 style="margin: 0 0 20px 0; color: #0f172a; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Clinic Reception Token</h3>
            
            <div style="margin: 20px 0; text-align: center;">
              <span style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; display: block; margin-bottom: 2px;">Assigned Queue Position</span>
              <div style="display: inline-block; font-size: 56px; font-weight: 900; color: #1e1b4b; line-height: 1; letter-spacing: -2px; padding: 4px 12px; background-color: #f5f3ff; border-radius: 12px;">#${qNumStr}</div>
            </div>

            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px; padding: 16px; margin-bottom: 20px; text-align: left; font-size: 13px; border-collapse: separate;">
              <tr>
                <td style="padding-bottom: 10px; border-bottom: 1px solid #f1f5f9; color: #64748b;">Patient:</td>
                <td style="padding-bottom: 10px; border-bottom: 1px solid #f1f5f9; text-align: right; color: #0f172a; font-weight: bold;">${recipientName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Doctor:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right; color: #0f172a; font-weight: bold;">${metadata.doctorName || "Staff"}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Department:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right; color: #0f172a; font-weight: bold;">${metadata.specialization || "Clinical Consultation"}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Scheduled For:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right; color: #0f172a; font-weight: bold;">${metadata.apptDate || "Today"} @ ${metadata.apptTime || "Soon"}</td>
              </tr>
              <tr>
                <td style="padding-top: 10px; color: #64748b; vertical-align: middle;">Status:</td>
                <td style="padding-top: 10px; text-align: right; vertical-align: middle;">
                  <span style="background-color: ${statusBg}; color: ${statusColor}; padding: 4px 12px; border-radius: 6px; font-weight: 800; font-size: 10px; text-transform: uppercase; border: 1px solid rgba(0,0,0,0.02); display: inline-block;">${metadata.status || "PENDING"}</span>
                </td>
              </tr>
            </table>

            <div style="border-top: 2px dashed #e2e8f0; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 11px; line-height: 1.6;">
              Please keep this pass open on your handset.<br/>Scan at entry or present to waitlist coordinator.
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
    }

    const payload = {
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      accessToken: privateKey || undefined,
      template_params: {
        to_name: recipientName,
        to_email: recipientEmail,
        subject: subject,
        message: body,
        type: type,
        queue_number: metadata?.queueNumber ? String(metadata.queueNumber) : "",
        doctor_name: metadata?.doctorName || "",
        specialty: metadata?.specialization || "",
        appointment_date: metadata?.apptDate || "",
        appointment_time: metadata?.apptTime || "",
        queue_card_html: queueCardHtml,
        sent_at: new Date().toISOString()
      }
    };

    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log(`[EmailJS SUCCESS] Real-world email delivered via EmailJS to ${recipientEmail} with status: ${response.status}`);
    } else {
      const errorText = await response.text();
      let helpfulTip = "";
      if (response.status === 403 || response.status === 451 || errorText.toLowerCase().includes("non-browser") || errorText.toLowerCase().includes("not allowed")) {
        helpfulTip = ` Action Required: Go to your EmailJS Dashboard (Account -> Security) and toggle ON "Allow API Access from non-browser environments".`;
      }
      const fullError = `EmailJS API returned status ${response.status}: "${errorText}".${helpfulTip}`;
      console.warn(`[EmailJS Notice] Dispatch returned code ${response.status} for ${recipientEmail}: ${errorText}`);
      if (throwOnError) {
        throw new Error(fullError);
      }
    }
  } catch (err: any) {
    console.warn(`[EmailJS Notice] Connection standard notice for ${recipientEmail}:`, err);
    if (throwOnError) {
      throw new Error(err?.message || "Connection to EmailJS API failed.");
    }
  }
}

function logSimulatedEmail(
  recipientEmail: string,
  recipientName: string,
  subject: string,
  body: string,
  type: string,
  metadata?: {
    doctorName?: string;
    specialization?: string;
    queueNumber?: string | number;
    apptDate?: string;
    apptTime?: string;
    status?: string;
    email?: string;
  }
) {
  // Generate our beautiful HTML email body
  const htmlBody = generateHighFidelityEmailBody(type, recipientName, subject, body, metadata);

  const emailLog = {
    id: `email_${Date.now()}`,
    recipientEmail,
    recipientName,
    subject,
    body: htmlBody, // Save HTML body for awesome in-app inbox display!
    type,
    sentAt: new Date().toISOString(),
  };
  emailLogs.unshift(emailLog);
  console.log(`[EmailJS SIMULATION] Logged internal email receipt to ${recipientEmail}: "${subject}"`);

  // Persist update
  saveDatabase();

  // Dispatch live real-world EmailJS REST API asynchronously using HTML Body
  sendEmailWithEmailJS(recipientEmail, recipientName, subject, htmlBody, type, metadata);

  // Send duplicate copy to designated Clinic Administrator's Gmail inbox via EmailJS REST API
  const adminEmail = (emailjsSettings.receiverEmail || "poojitalakkakula09@gmail.com").trim();
  if (adminEmail && adminEmail.toLowerCase() !== recipientEmail.toLowerCase()) {
    console.log(`[EmailJS COPYSEND] Dispatched admin replication pass to: ${adminEmail}`);
    const copySubject = `[Clinic admin Copy] ${subject}`;
    
    // Construct HTML copy format for gorgeous display in the inbox of admin!
    const copyHtmlBody = htmlBody.replace(
      new RegExp(`Dear ${recipientName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')},`, 'g'),
      `Dear Clinic Administrator,<br/><br/><span style="background-color: #fee2e2; color: #991b1b; padding: 6px 12px; border-radius: 6px; font-size: 11.5px; font-weight: bold; display: inline-block; margin-bottom: 12px; font-family: sans-serif;">ADMIN DUPLICATE COPY OF EMAIL SENT TO: ${recipientName} (${recipientEmail})</span><br/>`
    );
    
    sendEmailWithEmailJS(adminEmail, "Clinic Administrator", copySubject, copyHtmlBody, type, {
      ...metadata,
      status: metadata?.status || "PENDING"
    });
  }

  return emailLog;
}

// Lazy Gemini API Client Initialization
let aiClient: any = null;
function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
    return null;
  }
  if (!aiClient) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    } catch (err) {
      console.error("Failed to initialize Gemini Client", err);
    }
  }
  return aiClient;
}

// ==========================================
// API ROUTES
// ==========================================

// AUTH - Login
app.post("/api/auth/login", (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({ error: "Email, password, and role are required." });
  }

  const lookupEmail = email.toLowerCase().trim();

  if (role === "ADMIN") {
    if (adminUser.email === lookupEmail && adminUser.password === password) {
      return res.json({
        token: "admin-jwt-simulation-token",
        user: { id: adminUser.id, name: adminUser.name, email: adminUser.email, role: "ADMIN" },
      });
    }
  } else if (role === "DOCTOR") {
    const doc = doctors.find((d) => d.email.toLowerCase() === lookupEmail && d.password === password);
    if (doc) {
      return res.json({
        token: `doc-jwt-simulation-token-${doc.id}`,
        user: { id: doc.id, name: doc.name, email: doc.email, role: "DOCTOR", specialization: doc.specialization },
      });
    }
  } else if (role === "PATIENT") {
    const pat = patients.find((p) => p.email.toLowerCase() === lookupEmail && p.password === password);
    if (pat) {
      return res.json({
        token: `pat-jwt-simulation-token-${pat.id}`,
        user: { id: pat.id, name: pat.name, email: pat.email, role: "PATIENT", age: pat.age, phone: pat.phone },
      });
    }
  }

  return res.status(401).json({ error: "Invalid email, password, or chosen role." });
});

// AUTH - Patient Register
app.post("/api/auth/register", (req, res) => {
  const { name, email, phone, age, gender, address, password } = req.body;

  if (!name || !email || !phone || !age || !gender || !address || !password) {
    return res.status(400).json({ error: "All patient parameters are required." });
  }

  const emailExists = patients.some((p) => p.email.toLowerCase() === email.toLowerCase().trim());
  if (emailExists) {
    return res.status(400).json({ error: "Email already registered." });
  }

  const newPatient = {
    id: `pat_${Date.now()}`,
    name,
    email: email.toLowerCase().trim(),
    phone,
    age: Number(age),
    gender,
    address,
    password,
    role: "PATIENT" as const,
  };

  patients.push(newPatient);
  saveDatabase();

  // Send Welcome Email Simulation Log
  logSimulatedEmail(
    newPatient.email,
    newPatient.name,
    "Welcome to SmartCare!",
    `Dear ${newPatient.name},\n\nYour registration with SmartCare was successful!\n\nYour credentials:\nUsername (Email): ${newPatient.email}\nRole: Patient\n\nYou can now log in, search for leading doctors, book instant slots, and keep track of live waiting positions.\n\nWarm regards,\nThe SmartCare Healthcare Team`,
    "REGISTRATION"
  );

  return res.status(201).json({
    message: "Registration successful!",
    user: { id: newPatient.id, name: newPatient.name, email: newPatient.email, role: "PATIENT" },
  });
});

// DOCTORS List & Actions
app.get("/api/doctors", (req, res) => {
  res.json(doctors);
});

// Admin creates Doctor
app.post("/api/doctors", (req, res) => {
  const { name, email, password, specialization, experience, availability } = req.body;
  if (!name || !email || !password || !specialization || !experience || !availability) {
    return res.status(400).json({ error: "All parameters are required to register a doctor." });
  }

  const doctorExists = doctors.some((d) => d.email.toLowerCase() === email.toLowerCase().trim());
  if (doctorExists) {
    return res.status(400).json({ error: "Doctor email already registered." });
  }

  const newDoc = {
    id: `doc_${Date.now()}`,
    name,
    email: email.toLowerCase().trim(),
    password,
    specialization,
    experience: Number(experience),
    availability,
    imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face",
    role: "DOCTOR" as const,
  };

  doctors.push(newDoc);
  doctorQueueProgress[newDoc.id] = 0; // Initialize doctor queue at 0
  saveDatabase();

  return res.status(201).json(newDoc);
});

// Admin updates Doctor
app.put("/api/doctors/:id", (req, res) => {
  const { id } = req.params;
  const { name, email, specialization, experience, availability } = req.body;

  const docIndex = doctors.findIndex((d) => d.id === id);
  if (docIndex === -1) {
    return res.status(404).json({ error: "Doctor not found" });
  }

  doctors[docIndex] = {
    ...doctors[docIndex],
    name: name || doctors[docIndex].name,
    email: email ? email.toLowerCase().trim() : doctors[docIndex].email,
    specialization: specialization || doctors[docIndex].specialization,
    experience: experience !== undefined ? Number(experience) : doctors[docIndex].experience,
    availability: availability || doctors[docIndex].availability,
  };

  saveDatabase();

  return res.json(doctors[docIndex]);
});

// Admin deletes Doctor
app.delete("/api/doctors/:id", (req, res) => {
  const { id } = req.params;
  const index = doctors.findIndex((d) => d.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Doctor not found" });
  }
  doctors.splice(index, 1);
  saveDatabase();
  return res.json({ message: "Doctor record removed successfully" });
});

// PATIENT List
app.get("/api/patients", (req, res) => {
  res.json(patients.map(({ password, ...p }) => p));
});

// Admin/Patient edits Patient
app.put("/api/patients/:id", (req, res) => {
  const { id } = req.params;
  const { name, phone, age, gender, address } = req.body;

  const idx = patients.findIndex((p) => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Patient not found" });
  }

  patients[idx] = {
    ...patients[idx],
    name: name || patients[idx].name,
    phone: phone || patients[idx].phone,
    age: age !== undefined ? Number(age) : patients[idx].age,
    gender: gender || patients[idx].gender,
    address: address || patients[idx].address,
  };

  saveDatabase();

  return res.json(patients[idx]);
});

// Admin deletes Patient
app.delete("/api/patients/:id", (req, res) => {
  const { id } = req.params;
  const index = patients.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Patient not found" });
  }
  patients.splice(index, 1);
  saveDatabase();
  return res.json({ message: "Patient record deleted successfully" });
});

// APPOINTMENTS
app.get("/api/appointments", (req, res) => {
  const { patientId, doctorId, role } = req.query;

  let filtered = [...appointments];

  if (role === "PATIENT" && patientId) {
    filtered = filtered.filter((a) => a.patientId === patientId);
  } else if (role === "DOCTOR" && doctorId) {
    filtered = filtered.filter((a) => a.doctorId === doctorId);
  }

  // Hydrate with names
  const hydrated = filtered.map((app) => {
    const doc = doctors.find((d) => d.id === app.doctorId);
    const pat = patients.find((p) => p.id === app.patientId);
    return {
      ...app,
      doctorName: doc ? doc.name : "Unknown Doctor",
      doctorSpecialization: doc ? doc.specialization : "General Medicine",
      patientName: pat ? pat.name : "Unknown Patient",
      patientAge: pat ? pat.age : 30,
      patientGender: pat ? pat.gender : "Male",
    };
  });

  res.json(hydrated);
});

// Patient books Appointment
app.post("/api/appointments", (req, res) => {
  const { patientId, doctorId, date, time, reason } = req.body;

  if (!patientId || !doctorId || !date || !time || !reason) {
    return res.status(400).json({ error: "All appointment categories are required." });
  }

  // Appointment Validation Logic
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  
  if (date < todayStr) {
    return res.status(400).json({ error: "Cannot book appointments for past dates." });
  }

  if (date === todayStr) {
    let [timeStr, modifier] = (time || "").split(" ");
    if (timeStr) {
      let [hours, minutes] = timeStr.split(":").map(Number);
      if (modifier) {
        if (modifier.toUpperCase() === "PM" && hours < 12) hours += 12;
        if (modifier.toUpperCase() === "AM" && hours === 12) hours = 0;
      }
      
      const nowHours = today.getHours();
      const nowMinutes = today.getMinutes();
      
      if (hours < nowHours || (hours === nowHours && minutes < nowMinutes)) {
        return res.status(400).json({ error: "Selected appointment time has already passed." });
      }
    }
  }

  const doctor = doctors.find((d) => d.id === doctorId);
  const patient = patients.find((p) => p.id === patientId);

  if (!doctor || !patient) {
    return res.status(404).json({ error: "Doctor or Patient record not found." });
  }

  // Check if slot is already booked
  const existingAppt = appointments.find((a) => a.doctorId === doctorId && a.date === date && a.time === time && a.status !== "CANCELLED");
  if (existingAppt) {
    return res.status(400).json({ error: "This time slot has already been booked. Please choose another." });
  }

  // Generate tokens based on this doctor's today's scheduled bookings
  // Count how many appointments this doctor already has on this date
  const doctorDateBookings = appointments.filter((a) => a.doctorId === doctorId && a.date === date);
  const nextToken = doctorDateBookings.length + 1;

  // If the doctor queue tracker is and has not been initialized for today, start at 1
  if (doctorQueueProgress[doctorId] === undefined || doctorQueueProgress[doctorId] === 0) {
    doctorQueueProgress[doctorId] = 1;
  }

  const newAppt = {
    id: `appt_${Date.now()}`,
    patientId,
    doctorId,
    date,
    time,
    reason,
    status: "PENDING" as const, // Books as pending, then approved by doctor or admin
    queueNumber: nextToken,
    tokenNumber: nextToken,
    createdAt: new Date().toISOString(),
  };

  appointments.push(newAppt);
  saveDatabase();

  // Send Booking Received simulated email (incorporating gorgeous typography queue card)
  const bookingAsciiCard = generateQueueCard(
    patient.name,
    doctor.name,
    doctor.specialization,
    nextToken,
    date,
    time,
    "PENDING"
  );

  logSimulatedEmail(
    patient.email,
    patient.name,
    "SmartCare Request: Appointment Scheduled!",
    `Dear ${patient.name},\n\nYour appointment request has been submitted successfully.\n\nHere is your Digital Queue Pass:\n\n${bookingAsciiCard}\n\nWe will notify you once the clinic reviews and approves the Slot.\n\nWarm regards,\nSmartCare Clinic Operations Support`,
    "BOOKING",
    {
      doctorName: doctor.name,
      specialization: doctor.specialization,
      queueNumber: nextToken,
      apptDate: date,
      apptTime: time,
      status: "PENDING"
    }
  );

  res.status(201).json(newAppt);
});

// Approve, Cancel, or Complete Appointment
app.put("/api/appointments/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'ACTIVE', 'APPROVED', 'CANCELLED', 'COMPLETED'

  const appt = appointments.find((a) => a.id === id);
  if (!appt) {
    return res.status(404).json({ error: "Appointment not found." });
  }

  appt.status = status;

  const doc = doctors.find((d) => d.id === appt.doctorId);
  const pat = patients.find((p) => p.id === appt.patientId);

  if (pat && doc) {
    if (status === "APPROVED" || status === "Confirmed") {
      const displayStatus = status === "Confirmed" ? "CONFIRMED" : "APPROVED";
      const approvalAsciiCard = generateQueueCard(
        pat.name,
        doc.name,
        doc.specialization,
        appt.tokenNumber,
        appt.date,
        appt.time,
        displayStatus
      );

      logSimulatedEmail(
        pat.email,
        pat.name,
        `SmartCare Appointment Update: ${displayStatus}!`,
        `Dear ${pat.name},\n\nWe are pleased to inform you that your appointment is ${displayStatus}!\n\nHere is your Official Queue Pass:\n\n${approvalAsciiCard}\n\nPlan to arrive 15 minutes before your time. You can monitor the real-time queue position on your SmartCare portal.\n\nBest wishes,\nSmartCare Clinic Management`,
        "APPROVAL",
        {
          doctorName: doc.name,
          specialization: doc.specialization,
          queueNumber: appt.tokenNumber,
          apptDate: appt.date,
          apptTime: appt.time,
          status: displayStatus
        }
      );
    } else if (status === "Checked-in") {
      const checkinAsciiCard = generateQueueCard(
        pat.name,
        doc.name,
        doc.specialization,
        appt.tokenNumber,
        appt.date,
        appt.time,
        "CHECKED-IN"
      );

      logSimulatedEmail(
        pat.email,
        pat.name,
        "SmartCare Outpatient Update: CHECKED-IN!",
        `Dear ${pat.name},\n\nWelcome to SmartCare Clinic! You have successfully Checked-in at the front coordination desk. Your assigned slot is locked in.\n\nHere is your digital queue pass:\n\n${checkinAsciiCard}\n\nPlease proceed to wait near Doctor ${doc.name}'s consulting layout.\n\nBest health,\nReception Desk Desk`,
        "REMINDER",
        {
          doctorName: doc.name,
          specialization: doc.specialization,
          queueNumber: appt.tokenNumber,
          apptDate: appt.date,
          apptTime: appt.time,
          status: "CHECKED-IN"
        }
      );
    } else if (status === "CANCELLED") {
      logSimulatedEmail(
        pat.email,
        pat.name,
        "SmartCare Appointment Notice: CANCELLED",
        `Dear ${pat.name},\n\nYour scheduled appointment with ${doc.name} on ${appt.date} is CANCELLED.\n\nIf you did not request this, please contact support or log in to reschedule.\n\nWarm regards,\nSmartCare Clinic Support`,
        "CANCELLATION",
        {
          doctorName: doc.name,
          specialization: doc.specialization,
          queueNumber: appt.tokenNumber,
          apptDate: appt.date,
          apptTime: appt.time,
          status: "CANCELLED"
        }
      );
    }
  }

  saveDatabase();

  return res.json(appt);
});

// Admin reschedules appointment
app.put("/api/appointments/:id/reschedule", (req, res) => {
  const { id } = req.params;
  const { date, time } = req.body;

  // Appointment Validation Logic
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  
  if (date < todayStr) {
    return res.status(400).json({ error: "Cannot book appointments for past dates." });
  }

  if (date === todayStr) {
    let [timeStr, modifier] = (time || "").split(" ");
    if (timeStr) {
      let [hours, minutes] = timeStr.split(":").map(Number);
      if (modifier) {
        if (modifier.toUpperCase() === "PM" && hours < 12) hours += 12;
        if (modifier.toUpperCase() === "AM" && hours === 12) hours = 0;
      }
      
      const nowHours = today.getHours();
      const nowMinutes = today.getMinutes();
      
      if (hours < nowHours || (hours === nowHours && minutes < nowMinutes)) {
        return res.status(400).json({ error: "Selected appointment time has already passed." });
      }
    }
  }

  const appt = appointments.find((a) => a.id === id);
  if (!appt) {
    return res.status(404).json({ error: "Appointment not found." });
  }

  // Check if slot is already booked by someone else
  const existingAppt = appointments.find((a) => a.doctorId === appt.doctorId && a.date === date && a.time === time && a.status !== "CANCELLED" && a.id !== id);
  if (existingAppt) {
    return res.status(400).json({ error: "This time slot is already booked for this doctor. Please choose another." });
  }

  appt.date = date;
  appt.time = time;
  appt.status = "PENDING"; // Reverts to pending for re-approval

  const doc = doctors.find((d) => d.id === appt.doctorId);
  const pat = patients.find((p) => p.id === appt.patientId);

  if (pat && doc) {
    const rescheduleAsciiCard = generateQueueCard(
      pat.name,
      doc.name,
      doc.specialization,
      appt.tokenNumber,
      date,
      time,
      "RESCHEDULED"
    );

    logSimulatedEmail(
      pat.email,
      pat.name,
      "SmartCare Appointment Notification: RESCHEDULED",
      `Dear ${pat.name},\n\nYour appointment with ${doc.name} has been rescheduled to:\nDate: ${date}\nTime: ${time}\n\nHere is your Updated Queue Pass:\n\n${rescheduleAsciiCard}\n\nPlease track the queue live.\n\nRespectfully,\nSmartCare Scheduling Desk`,
      "REMINDER",
      {
        doctorName: doc.name,
        specialization: doc.specialization,
        queueNumber: appt.tokenNumber,
        apptDate: date,
        apptTime: time,
        status: "RESCHEDULED"
      }
    );
  }

  saveDatabase();

  return res.json(appt);
});

// QUEUE MANAGER ACTIONS
app.get("/api/queue/status/:doctorId", (req, res) => {
  const { doctorId } = req.params;
  const { patientToken } = req.query; // Send if you want customized state

  const doc = doctors.find((d) => d.id === doctorId);
  if (!doc) {
    return res.status(404).json({ error: "Doctor not found." });
  }

  const currentRunning = doctorQueueProgress[doctorId] || 0;

  // Let's count how many appointments are currently approved/pending
  const todayStr = new Date().toISOString().split("T")[0];
  const activeToday = appointments.filter(
    (a) => a.doctorId === doctorId && (a.status === "APPROVED" || a.status === "Confirmed" || a.status === "Checked-in") && a.date === todayStr
  );

  let patientsAhead = 0;
  let estimatedWaitTime = 0;

  if (patientToken) {
    const pt = Number(patientToken);
    if (pt > currentRunning) {
      patientsAhead = pt - currentRunning;
      estimatedWaitTime = patientsAhead * 15; // 15 mins per patient
    }
  }

  res.json({
    doctorId,
    doctorName: doc.name,
    specialization: doc.specialization,
    currentRunningToken: currentRunning,
    activeTotalBooked: activeToday.length,
    patientsAhead,
    estimatedWaitTime,
  });
});

// Move Queue Forward
app.post("/api/queue/next/:doctorId", (req, res) => {
  const { doctorId } = req.params;
  const todayStr = new Date().toISOString().split("T")[0];
  const doc = doctors.find((d) => d.id === doctorId);

  // Find all appointments for this doctor today
  const doctorTodayAppts = appointments.filter(
    (a) => a.doctorId === doctorId && a.date === todayStr && (a.status === "APPROVED" || a.status === "Confirmed" || a.status === "Checked-in")
  );

  const highestToken = doctorTodayAppts.reduce((max, app) => Math.max(max, app.tokenNumber), 0);

  const current = doctorQueueProgress[doctorId] || 0;

  let nextVal = current;
  if (current < highestToken) {
    nextVal = current + 1;
    doctorQueueProgress[doctorId] = nextVal;

    // Mark previous as COMPLETED
    const previousAppt = appointments.find(
      (a) => a.doctorId === doctorId && a.date === todayStr && a.tokenNumber === current && (a.status === "APPROVED" || a.status === "Confirmed" || a.status === "Checked-in")
    );
    if (previousAppt) {
      previousAppt.status = "COMPLETED";
      
      const prevPat = patients.find((p) => p.id === previousAppt.patientId);
      if (prevPat && doc) {
        logSimulatedEmail(
          prevPat.email,
          prevPat.name,
          "SmartCare Checkup Completed - Consultation Closed",
          `Dear ${prevPat.name},\n\nYour consultation with ${doc.name} (${doc.specialization}) has concluded successfully. The clinic has marked your session as Completed.\n\nAny recommended prescriptions or advice are attached to your medical files. Please log in to your patient dashboard to see digital health records.\n\nThank you for choosing SmartCare Medical!\n\nWarm regards,\nSmartCare Medical Ops`,
          "COMPLETED"
        );
      }
    }
  } else if (highestToken > 0 && current === highestToken) {
    // Already at highest booked patient today. Complete the final patient being seen.
    const lastAppt = appointments.find(
      (a) => a.doctorId === doctorId && a.date === todayStr && a.tokenNumber === current && (a.status === "APPROVED" || a.status === "Confirmed" || a.status === "Checked-in")
    );
    if (lastAppt) {
      lastAppt.status = "COMPLETED";

      const prevPat = patients.find((p) => p.id === lastAppt.patientId);
      if (prevPat && doc) {
        logSimulatedEmail(
          prevPat.email,
          prevPat.name,
          "SmartCare Checkup Completed - Consultation Closed",
          `Dear ${prevPat.name},\n\nYour consultation with ${doc.name} (${doc.specialization}) has concluded successfully. The clinic has marked your session as Completed.\n\nAny recommended prescriptions or advice are attached to your medical files. Please log in to your patient dashboard to see digital health records.\n\nThank you for choosing SmartCare Medical!\n\nWarm regards,\nSmartCare Medical Ops`,
          "COMPLETED"
        );
      }
    }
    // Increment to indicate completion
    nextVal = current + 1;
    doctorQueueProgress[doctorId] = nextVal;
  } else if (current === 0) {
    doctorQueueProgress[doctorId] = 1;
    nextVal = 1;
  }

  // Trigger notice to the new active patient who is up next!
  const activeAppt = appointments.find(
    (a) => a.doctorId === doctorId && a.date === todayStr && a.tokenNumber === nextVal && (a.status === "APPROVED" || a.status === "Confirmed" || a.status === "Checked-in")
  );
  if (activeAppt) {
    const activePat = patients.find((p) => p.id === activeAppt.patientId);
    if (activePat && doc) {
      const upNextAsciiCard = generateQueueCard(
        activePat.name,
        doc.name,
        doc.specialization,
        activeAppt.tokenNumber,
        todayStr,
        activeAppt.time,
        "URGENT UP NEXT"
      );

      logSimulatedEmail(
        activePat.email,
        activePat.name,
        `SmartCare Alert: You are UP NEXT with ${doc.name}! 🩺`,
        `Dear ${activePat.name},\n\nDr. ${doc.name} is now ready to receive you! You are UP NEXT for checkup.\n\nHere is your Live Entry Queue Pass:\n\n${upNextAsciiCard}\n\nPlease proceed directly to the doctor's cabin now.\n\nBest regards,\nSmartCare Nurse Desk & Queue Coordinator`,
        "QUEUE_ALERT",
        {
          doctorName: doc.name,
          specialization: doc.specialization,
          queueNumber: activeAppt.tokenNumber,
          apptDate: todayStr,
          apptTime: activeAppt.time,
          status: "UP NEXT"
        }
      );
    }
  }

  res.json({
    doctorId,
    currentRunningToken: nextVal,
    message: "Queue advanced successfully",
  });
  saveDatabase();
});

// Reset Queue
app.post("/api/queue/reset/:doctorId", (req, res) => {
  const { doctorId } = req.params;
  doctorQueueProgress[doctorId] = 1;
  saveDatabase();
  res.json({ doctorId, currentRunningToken: 1, message: "Queue reset to 1" });
});

// EMAILS List
app.get("/api/emails", (req, res) => {
  res.json(emailLogs);
});

// GET EmailJS configuration
app.get("/api/settings/emailjs", (req, res) => {
  res.json({
    serviceId: emailjsSettings.serviceId,
    templateId: emailjsSettings.templateId,
    publicKey: emailjsSettings.publicKey,
    privateKey: emailjsSettings.privateKey ? "••••••••" : "",
    receiverEmail: emailjsSettings.receiverEmail,
    isEnabled: emailjsSettings.isEnabled
  });
});

// POST update EmailJS configuration
app.post("/api/settings/emailjs", (req, res) => {
  const { serviceId, templateId, publicKey, privateKey, receiverEmail, isEnabled } = req.body;
  
  if (serviceId !== undefined) emailjsSettings.serviceId = (serviceId || "").trim();
  if (templateId !== undefined) emailjsSettings.templateId = (templateId || "").trim();
  if (publicKey !== undefined) emailjsSettings.publicKey = (publicKey || "").trim();
  
  if (privateKey !== undefined && privateKey !== "••••••••") {
    emailjsSettings.privateKey = (privateKey || "").trim();
  }
  
  if (receiverEmail !== undefined) emailjsSettings.receiverEmail = (receiverEmail || "").trim();
  if (isEnabled !== undefined) emailjsSettings.isEnabled = !!isEnabled;
  
  saveDatabase();
  
  res.json({
    success: true,
    message: "EmailJS persistent configurations updated successfully!",
    settings: {
      serviceId: emailjsSettings.serviceId,
      templateId: emailjsSettings.templateId,
      publicKey: emailjsSettings.publicKey,
      privateKey: emailjsSettings.privateKey ? "••••••••" : "",
      receiverEmail: emailjsSettings.receiverEmail,
      isEnabled: emailjsSettings.isEnabled
    }
  });
});

// POST trigger EmailJS diagnostic test
app.post("/api/settings/emailjs/test", async (req, res) => {
  const { testEmail } = req.body;
  
  if (!testEmail) {
    return res.status(400).json({ error: "No recipient test email found." });
  }

  const sId = (emailjsSettings.serviceId || process.env.EMAILJS_SERVICE_ID || "").trim();
  const tId = (emailjsSettings.templateId || process.env.EMAILJS_TEMPLATE_ID || "").trim();
  const pKey = (emailjsSettings.publicKey || process.env.EMAILJS_PUBLIC_KEY || "").trim();
  
  if (!sId || !tId || !pKey) {
    return res.status(400).json({ error: "EmailJS configurations are incomplete on this server. Please enter Service ID, Template ID, and Public Key." });
  }
  
  try {
    await sendEmailWithEmailJS(
      testEmail,
      "Test Recipient",
      "SmartCare EmailJS Server-Side Connection Test",
      "Congratulations! Your EmailJS credentials are fully authenticating. If you are reading this message on your Gmail/inbox, the server-side proxy is operational and ready to send instant automated passes.",
      "REGISTRATION",
      {
        status: "APPROVED",
        queueNumber: 7
      },
      true
    );
    
    res.json({ success: true, message: `EmailJS connection test dispatched successfully to ${testEmail}` });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "EmailJS connection diagnostic refused or response exception incurred." });
  }
});

// SUBMIT SUPPORT INQUIRY
app.post("/api/inquiries", (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Name, email, and message are required fields." });
  }

  // 1. Log simulated support ticket email to support desk group
  const inquiryLogObj = logSimulatedEmail(
    "support@smartcare.org",
    "SmartCare Support Desk",
    `Support Ticket Received: ${name}`,
    `An active clinic visitor or patient has initiated standard support contact form processing.\n\nSender Information:\n- Name: ${name}\n- Contact Email: ${email}\n\nMotive / Message:\n${message}\n\ntriageStatus: PENDING_AGENT`,
    "INQUIRY"
  );

  // 2. Log confirmation simulated auto-reply back to user's mail
  logSimulatedEmail(
    email,
    name,
    `SmartCare Support Confirmation - Ticket #${inquiryLogObj.id}`,
    `Dear ${name},\n\nThis automail confirms that your inquiry was received successfully by our administrative desks.\n\nSummary of details provided:\n- Consultation Motive: "${message.substring(0, 100)}${message.length > 100 ? "..." : ""}"\n\nA triage agent will follow up with you on this thread soon if additional specialization alignment or diagnostic scheduling details are required.\n\nBest regards,\nSmartCare Medical Support Core`,
    "AUTO_REPLY"
  );

  res.json({ success: true, message: "Inquiry logged and simulated emails generated." });
});

// STATS
app.get("/api/dashboard/stats", (req, res) => {
  const todayStr = new Date().toISOString().split("T")[0];
  const activeToday = appointments.filter((a) => a.date === todayStr && (a.status === "APPROVED" || a.status === "Confirmed" || a.status === "Checked-in"));

  res.json({
    patientsCount: patients.length,
    doctorsCount: doctors.length,
    appointmentsCount: appointments.length,
    activeQueueCount: activeToday.length,
  });
});

// AI ASSISTANT CHATBOT
function getOfflineResponse(messages: any[], userPrompt: string): string {
  let reply = "";
  const promptLower = userPrompt.toLowerCase().trim();

  // 1. Traverse message history backwards to find previous contexts
  let activeDepartmentContext: "cardiology" | "neurology" | "orthopedics" | "pediatrics" | "dermatology" | "general_medicine" | null = null;
  let activeTopicContext: "booking" | "queue" | "contact" | "general_info" | null = null;

  // We look through the history (excluding the very last prompt because that is the current one)
  const history = messages && Array.isArray(messages) ? messages.slice(0, messages.length - 1) : [];
  
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    if (!msg || !msg.text) continue;
    const txtLower = msg.text.toLowerCase();

    // Check Department context in history
    if (!activeDepartmentContext) {
      if (txtLower.includes("heart") || txtLower.includes("cardio") || txtLower.includes("chest") || txtLower.includes("sharma")) {
        activeDepartmentContext = "cardiology";
      } else if (txtLower.includes("headache") || txtLower.includes("neuro") || txtLower.includes("brain") || txtLower.includes("jenkins")) {
        activeDepartmentContext = "neurology";
      } else if (txtLower.includes("bone") || txtLower.includes("joint") || txtLower.includes("ortho") || txtLower.includes("patel")) {
        activeDepartmentContext = "orthopedics";
      } else if (txtLower.includes("child") || txtLower.includes("kid") || txtLower.includes("pediat") || txtLower.includes("nair")) {
        activeDepartmentContext = "pediatrics";
      } else if (txtLower.includes("skin") || txtLower.includes("rash") || txtLower.includes("derm") || txtLower.includes("dupont")) {
        activeDepartmentContext = "dermatology";
      } else if (txtLower.includes("medicine") || txtLower.includes("general") || txtLower.includes("cough") || txtLower.includes("fever") || txtLower.includes("vance")) {
        activeDepartmentContext = "general_medicine";
      }
    }

    // Check Topic context in history
    if (!activeTopicContext) {
      if (txtLower.includes("appointment") || txtLower.includes("book") || txtLower.includes("schedule")) {
        activeTopicContext = "booking";
      } else if (txtLower.includes("queue") || txtLower.includes("wait") || txtLower.includes("token")) {
        activeTopicContext = "queue";
      } else if (txtLower.includes("phone") || txtLower.includes("contact") || txtLower.includes("address") || txtLower.includes("email")) {
        activeTopicContext = "contact";
      }
    }

    if (activeDepartmentContext && activeTopicContext) break; // found both, we can stop
  }

  // Handle generic prompt keyword checking and blend with the extracted history context
  const isDoctorFollowup = promptLower.includes("doctor") || promptLower.includes("specialist") || promptLower.includes("who is") || promptLower.includes("physician") || promptLower.includes("clinician");
  const isTimingFollowup = promptLower.includes("timing") || promptLower.includes("hours") || promptLower.includes("schedule") || promptLower.includes("when") || promptLower.includes("time") || promptLower.includes("active") || promptLower.includes("availab");

  if (promptLower.includes("appointment") || promptLower.includes("book") || (promptLower.includes("how") && activeTopicContext === "booking")) {
    reply = `I would be glad to help you schedule an appointment! 

**Here is how you can book in 3 easy steps:**
1. Log in to your **SmartCare Account** as a **Patient**. (Or register if you're new!)
2. Go to the **Book Appointment** tab in your dashboard sidebar.
3. Select your specialized hospital department, chosen clinician, date, and time. Click **Submit**!

Our platform instantly registers your booking, assigns a **Real-Time Token Number**, and sends an email confirmation.`;
  } else if (promptLower.includes("queue") || promptLower.includes("track") || promptLower.includes("wait") || (promptLower.includes("how") && activeTopicContext === "queue") || promptLower.includes("token")) {
    reply = `SmartCare operates with a state-of-the-art **Live Queue Tracking System**. 

**How it works:**
* When your booking is approved, you receive an active **Token Number**.
* You can open your **Patient Dashboard** and go to **Queue Tracking** to view:
  * The *current calling token* being seen by doctor.
  * Your assigned token number.
  * Exactly *how many patients are ahead* of you in real-time.
  * A dynamically recalculated *Estimated Wait Time* (computed at roughly **15 minutes per patient ahead**).
* This avoids having to wait in crowded lobby benches, letting you arrive exactly when it is your turn!`;
  } else if (isDoctorFollowup && activeDepartmentContext) {
    if (activeDepartmentContext === "cardiology") {
      reply = `**Dr. Arvind Sharma** is our Cardiology doctor. He has 15 years of experience in cardiology diagnostics and care. Click "Book Appt Help" to learn how to schedule a slot!`;
    } else if (activeDepartmentContext === "neurology") {
      reply = `**Dr. Sarah Jenkins** is our Neurology specialist. She has 12 years of clinical research and practice in neurology. You can schedule a visit in the Book Appointment section of your patient account!`;
    } else if (activeDepartmentContext === "orthopedics") {
      reply = `**Dr. Rajesh Patel** is our chief Orthopedics surgeon, specializing in bone, ligament, and joint procedures. You can book an appointment with him via your patient console.`;
    } else if (activeDepartmentContext === "pediatrics") {
      reply = `**Dr. Priya Nair** is our dedicated Pediatrics expert. She has 8 years of clinical experience in child vaccines, development, and pediatric medicine. Ready for checkups via your portal!`;
    } else if (activeDepartmentContext === "dermatology") {
      reply = `**Dr. Chloe DuPont** is our specialist in Dermatology, handling mole screens, rash consults, treatments, and skin conditions. You can schedule a visit via the Booking screen.`;
    } else if (activeDepartmentContext === "general_medicine") {
      reply = `**Dr. Marcus Vance** is our primary General Medicine practitioner, supporting basic healthcare, cold, fever, medical reviews, and standard checkups.`;
    }
  } else if (isTimingFollowup && activeDepartmentContext) {
    if (activeDepartmentContext === "cardiology") {
      reply = `Dr. Arvind Sharma (Cardiology) is available from **09:00 AM - 01:00 PM** daily.`;
    } else if (activeDepartmentContext === "neurology") {
      reply = `Dr. Sarah Jenkins (Neurology) is available from **10:00 AM - 04:00 PM** daily.`;
    } else if (activeDepartmentContext === "orthopedics") {
      reply = `Dr. Rajesh Patel (Orthopedics) is available from **02:00 PM - 06:00 PM** daily.`;
    } else if (activeDepartmentContext === "pediatrics") {
      reply = `Dr. Priya Nair (Pediatrics) is available from **09:00 AM - 03:00 PM** daily.`;
    } else if (activeDepartmentContext === "dermatology") {
      reply = `Dr. Chloe DuPont (Dermatology) is available from **11:00 AM - 05:00 PM** daily.`;
    } else if (activeDepartmentContext === "general_medicine") {
      reply = `Dr. Marcus Vance (General Medicine) is available from **08:00 AM - 02:00 PM** daily.`;
    }
  } else if (promptLower.includes("doctor") || promptLower.includes("specialist") || promptLower.includes("avail")) {
    reply = `We have six highly trained resident specialists at your service:
* **Dr. Arvind Sharma (Cardiology)** — Available 09:00 AM - 01:00 PM.
* **Dr. Sarah Jenkins (Neurology)** — Available 10:00 AM - 04:00 PM.
* **Dr. Rajesh Patel (Orthopedics)** — Available 02:00 PM - 06:00 PM.
* **Dr. Priya Nair (Pediatrics)** — Available 09:00 AM - 03:00 PM.
* **Dr. Chloe DuPont (Dermatology)** — Available 11:00 AM - 05:00 PM.
* **Dr. Marcus Vance (General Medicine)** — Available 08:00 AM - 02:00 PM.

Feel free to ask for a specific doctor's credentials or clinic timings!`;
  } else if (
    promptLower.includes("heart") ||
    promptLower.includes("chest") ||
    promptLower.includes("cardio") ||
    promptLower.includes("breathe")
  ) {
    reply = `Based on your respiratory or heart symptoms, I highly recommend scheduling a consultation with **Dr. Arvind Sharma** in our **Cardiology Department**. 

Dr. Sharma is available from **09:00 AM - 01:00 PM**. He specializes in cardiac diagnostics, periodic heart palpitations, and hypertension support. Please book a slot via your dashboard as soon as possible.`;
  } else if (
    promptLower.includes("headache") ||
    promptLower.includes("pain") ||
    promptLower.includes("neuro") ||
    promptLower.includes("dizzy") ||
    promptLower.includes("spine")
  ) {
    reply = `For nerves, chronic migraines, dizziness, or peripheral nerve pain, our **Neurology Department** is best. You can schedule a visit with **Dr. Sarah Jenkins** (available **10:00 AM - 04:00 PM**). She is a world-class neurologist with 12 years of clinical research and practice.`;
  } else if (
    promptLower.includes("bone") ||
    promptLower.includes("joint") ||
    promptLower.includes("ortho") ||
    promptLower.includes("knee") ||
    promptLower.includes("back pain") ||
    promptLower.includes("fracture")
  ) {
    reply = `For bone or joint pain, sprains, or orthopedics services, we recommend seeing **Dr. Rajesh Patel** in our **Orthopedics Department**. 

Dr. Patel is our chief Orthopedist expert (available from **02:00 PM - 06:00 PM** daily).`;
  } else if (
    promptLower.includes("child") ||
    promptLower.includes("kid") ||
    promptLower.includes("baby") ||
    promptLower.includes("pediat") ||
    promptLower.includes("vaccin")
  ) {
    reply = `For childhood vaccines, pediatric developmental screenings, or child illness, our **Pediatrics Department** manages this. You can book an appointment with **Dr. Priya Nair** (available **09:00 AM - 03:00 PM**).`;
  } else if (
    promptLower.includes("skin") ||
    promptLower.includes("rash") ||
    promptLower.includes("derm") ||
    promptLower.includes("acne") ||
    promptLower.includes("moles")
  ) {
    reply = `Our **Dermatology Department** is led by **Dr. Chloe DuPont** (available **11:00 AM - 05:00 PM**). She treats skin conditions, acne, dermatitis, and performs routine skin diagnostics.`;
  } else if (
    promptLower.includes("cough") ||
    promptLower.includes("fever") ||
    promptLower.includes("cold") ||
    promptLower.includes("flu") ||
    promptLower.includes("general") ||
    promptLower.includes("medicine")
  ) {
    reply = `For general symptoms like minor flu, coughs, fevers, or persistent fatigue, you can speak directly to **Dr. Marcus Vance** in our **General Medicine Department** (available **08:00 AM - 02:00 PM**).`;
  } else if (promptLower.includes("contact") || promptLower.includes("phone") || promptLower.includes("address") || promptLower.includes("email") || promptLower.includes("reach") || promptLower.includes("location") || promptLower.includes("call")) {
    reply = `You can easily reach us via any of these channels:
* **Phone Direct:** +91 63059 10456
* **Email Helpdesk:** support@smartcare.org
* **Campus Location:** 100 Medical Plaza, Health Square, NY 10001
* **Lobby timings:** 08:00 AM - 06:00 PM Daily.`;
  } else if (promptLower.includes("hello") || promptLower.includes("hi ") || promptLower.includes("hey") || promptLower.includes("start") || promptLower.includes("help")) {
    reply = `Hello! I am your SmartCare Assistant. Here's what I can do to help you today:
* **Appointment Placement Guidance**: Step-by-step instructions to list your clinic booking.
* **Specialist Recommendations**: Tell me your symptoms, and I'll route you (Cardiology, Neurology, Orthopedics, Pediatrics, Dermatology, General Medicine).
* **Live Queue Status Explanation**: Learn how your Token Number and active doctor room lines work.
* **Contact Information**: Phone lines, address coordinates, and timings.

How can I help you today?`;
  } else {
    reply = `I understand you have a question about SmartCare services. 

To help you best:
* If you have symptom-related questions, tells us about them (e.g. skin rash, heart palpitations, child checkup) so we can map you to the correct resident doctor.
* Inquire about **Appointments** to see how online scheduling works step-by-step.
* Ask about our **Live Queue Tracking System** to understand wait-estimation token models.
* Use our quick action suggest buttons at the bot tray for fast, automatic lookups!`;
  }

  // Add emergency medical disclaimer
  reply += `\n\n---\n*Disclaimer: I am your SmartCare AI Assistant helper, but I do NOT replace a real clinical physician. If you are experiencing a life-threatening medical emergency (like severe chest pain, major bleeding, or breathlessness), please call 911 or go to your nearest emergency room immediately.*`;

  return reply;
}

app.post("/api/ai/chat", async (req, res) => {
  const { messages } = req.body; // Array of ChatMessage: { sender, text }

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required." });
  }

  const userPrompt = messages[messages.length - 1]?.text || "";

  const systemInstruction = `You are the SmartCare AI Assistant, an empathetic, top-tier medical triage, routing, and booking assistant for SmartCare Clinics. 
Our clinics offer:
- Online Appointment Booking: Patient logs in, visits the Book Appointment page, selects a Specialist, Date, and Time.
- Real-Time Queue Tracking: Patient receives a Live Token/Queue Number and can track active calling status. Approximate service time is 15 minutes per patient ahead.
- Six specialized departments:
  * Cardiology (heart health, chest discomfort, palpitations, murmurs)
  * Neurology (brain, headaches, nerve complaints, chronic dizziness)
  * Orthopedics (bones, joints, fractures, ligament sprains)
  * Pediatrics (child healthcare, vaccinations, pediatric development)
  * Dermatology (skin rash, acne, biopsy, moles)
  * General Medicine (cough, fever, seasonal flu, general physical exams)

Our Doctors:
- Dr. Arvind Sharma (Cardiology) - Available 09:00 AM - 01:00 PM
- Dr. Sarah Jenkins (Neurology) - Available 10:00 AM - 04:00 PM
- Dr. Rajesh Patel (Orthopedics) - Available 02:00 PM - 06:00 PM
- Dr. Priya Nair (Pediatrics) - Available 09:00 AM - 03:00 PM
- Dr. Chloe DuPont (Dermatology) - Available 11:00 AM - 05:00 PM
- Dr. Marcus Vance (General Medicine) - Available 08:00 AM - 02:00 PM

SmartCare Contact:
- Phone: +91 63059 10456
- Email: support@smartcare.org
- Physical Address: 100 Medical Plaza, Health Square, NY 10001
- Clinic Hours: 8:00 AM to 6:00 PM Daily.

IMPORTANT RULES & DICTION:
1. Always suggest the exact department and doctor based on symptoms.
2. Be highly compassionate, organized, and helpful. Use bullet points and clean headers.
3. ALWAYS include a clinical disclaimer at the bottom of your message: "Disclaimer: I am your SmartCare Assistant helper, but I do not replace a real clinical physician. If you are experiencing a life-threatening medical emergency (like severe chest pain or breathlessness), please call 911 or go to your nearest emergency room immediately."
4. Do not talk about the server or technology unless asked. Keep answers concise.`;

  const client = getGeminiClient();

  if (!client) {
    console.log("No GEMINI_API_KEY detected. Running in Offline AI Mode.");
    const offlineReply = getOfflineResponse(messages, userPrompt);
    return res.json({ text: offlineReply });
  }

  // Active Gemini SDK Query with multi-model self-healing fallback
  try {
    // Filter out welcome message and messages with blank text
    const chatMessages = messages.filter((m: any) => m && m.text && m.text.trim());

    // Locate the first "user" message - Gemini conversation MUST start with a "user" role
    const firstUserIdx = chatMessages.findIndex((m: any) => m.sender === "user");
    const validChatSequence = firstUserIdx !== -1 ? chatMessages.slice(firstUserIdx) : [];

    // Convert to formatted parts with alternating roles (merging consecutive roles)
    const contents: any[] = [];
    let currentTurn: { role: "user" | "model"; parts: { text: string }[] } | null = null;

    for (const m of validChatSequence) {
      const role = m.sender === "user" ? "user" : "model";
      if (!currentTurn) {
        currentTurn = { role, parts: [{ text: m.text }] };
      } else if (currentTurn.role === role) {
        // Consecutive same role: append text as an extra part
        currentTurn.parts.push({ text: m.text });
      } else {
        // New role: push current turn and start a new one
        contents.push(currentTurn);
        currentTurn = { role, parts: [{ text: m.text }] };
      }
    }

    if (currentTurn) {
      contents.push(currentTurn);
    }

    // Fallback if list is somehow empty
    if (contents.length === 0) {
      contents.push({
        role: "user",
        parts: [{ text: userPrompt || "Hello" }],
      });
    }

    // List of models to try in sequence - prioritizing highly standard non-pro models that do not cause restricted 403 Permission Denied issues
    const modelsToTry = [
      "gemini-2.5-flash", 
      "gemini-flash-latest", 
      "gemini-3.1-flash-lite", 
      "gemini-3.5-flash"
    ];

    let responseText = "";
    let successfullyReachedModel = false;

    for (const modelName of modelsToTry) {
      try {
        console.log(`Attempting Gemini generation using model: ${modelName}`);
        const response = await client.models.generateContent({
          model: modelName,
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
          },
        });

        if (response && response.text) {
          responseText = response.text;
          successfullyReachedModel = true;
          console.log(`Successfully generated response using model: ${modelName}`);
          break;
        }
      } catch (innerError: any) {
        console.warn(`Attempt with ${modelName} failed. Error:`, innerError.message || innerError);
      }
    }

    if (successfullyReachedModel && responseText) {
      return res.json({ text: responseText });
    }

    // If all models in the list failed (e.g. 403 permission denies, credentials, etc.), run offline clinical advisor
    console.log("All attempted Gemini models failed or returned empty. Falling back to clinical Offline Mode.");
    const offlineReply = getOfflineResponse(messages, userPrompt);
    return res.json({ text: offlineReply });

  } catch (error: any) {
    console.error("Gemini chatbot routine encountered a general exception:", error);
    const offlineReply = getOfflineResponse(messages, userPrompt);
    return res.json({ text: offlineReply });
  }
});

// ==========================================
// VITE DEV SERVER & STATIC MIDDLEWARE SETUP
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in DEV mode. Mounting Vite Hot-Reload Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in PRODUCTION mode. Serving precompiled static bundles...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`=======================================================`);
      console.log(` SMARTCARE Full-Stack Node Server is now Active!      `);
      console.log(` Port URL: http://const API_BASE = "";:${PORT}                      `);
      console.log(` Production Environment: ${process.env.NODE_ENV === "production" ? "YES" : "NO"}   `);
      console.log(`=======================================================`);

      // Asynchronously dispatch real-world checkup to poojitalakkakula09@gmail.com on boot to verify setup
      const welcomeSubject = "Welcome to SmartCare!";
      const welcomeBody = "Dear Poojita Lakkakula,\n\nWelcome to SmartCare—Smarter Healthcare, Shorter Wait Times.\n\nYour account has been pre-registered successfully!\n\nYour credentials:\n- Username (Email): poojitalakkakula09@gmail.com\n- Password: password123\n- Role: Patient\n\nYou can now log in, search for resident doctors (Cardiology, Neurology, Orthopedics, Pediatrics, Dermatology, General Medicine), book real-time appointments, and monitor live queue wait lines seamlessly!\n\nWarm regards,\nThe SmartCare Healthcare Team";
      
      console.log(`[BOOT TRIGGER] Queueing real-world EmailJS test dispatch to poojitalakkakula09@gmail.com...`);
      sendEmailWithEmailJS("poojitalakkakula09@gmail.com", "Poojita Lakkakula", welcomeSubject, welcomeBody, "REGISTRATION");
    });
  }
}

if (!process.env.VERCEL) {
  startServer();
} else {
  // Execute Vite setup synchronously if needed, or Vercel handles static routing.
  if (process.env.NODE_ENV !== "production") {
    //
  }
}

export default app;

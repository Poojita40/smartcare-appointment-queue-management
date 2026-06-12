export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  address: string;
  role: 'PATIENT';
}

export interface Doctor {
  id: string;
  name: string;
  email: string;
  specialization: 'Cardiology' | 'Neurology' | 'Orthopedics' | 'Dermatology' | 'Pediatrics' | 'General Medicine';
  experience: number;
  availability: string; // e.g., "09:00 AM - 10:00 PM"
  imageUrl?: string;
  role: 'DOCTOR';
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName?: string; // hydrated
  patientAge?: number; // hydrated
  patientGender?: string; // hydrated
  doctorId: string;
  doctorName?: string; // hydrated
  doctorSpecialization?: string; // hydrated
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'Confirmed' | 'Checked-in' | 'COMPLETED' | 'CANCELLED';
  queueNumber: number;
  tokenNumber: number;
  createdAt: string;
}

export interface QueueState {
  doctorId: string;
  doctorName: string;
  specialization: string;
  currentRunningToken: number;
  yourToken: number;
  patientsAhead: number;
  estimatedWaitTime: number; // in minutes
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface EmailLog {
  id: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  body: string;
  type: 'REGISTRATION' | 'BOOKING' | 'APPROVAL' | 'CANCELLATION' | 'REMINDER';
  sentAt: string;
}

export interface DashboardStats {
  patientsCount: number;
  doctorsCount: number;
  appointmentsCount: number;
  activeQueueCount: number;
}

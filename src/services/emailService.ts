import emailjs from "@emailjs/browser";

export interface EmailParams {
  to_name: string;
  to_email: string;
  subject: string;
  message: string;
  type: "REGISTRATION" | "BOOKING" | "APPROVAL" | "CANCELLATION" | "REMINDER";
  queue_number?: string | number;
  doctor_name?: string;
  specialty?: string;
  appointment_date?: string;
  appointment_time?: string;
  queue_card_html?: string;
}

// High-Fidelity Responsive HTML Email Builder for Browser SDK Dispatches
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

  const showQueueCard = ["BOOKING", "APPROVAL", "REMINDER", "RESCHEDULED"].includes(type) || !!metadata?.queueNumber;
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

class EmailService {
  private serviceId: string = "";
  private templateId: string = "";
  private publicKey: string = "";

  constructor() {
    // Attempt loading from environment, support both standard VITE_ prefixes
    const metaEnv = (import.meta as any).env || {};
    this.serviceId = (metaEnv.VITE_EMAILJS_SERVICE_ID || "").trim();
    this.templateId = (metaEnv.VITE_EMAILJS_TEMPLATE_ID || "").trim();
    this.publicKey = (metaEnv.VITE_EMAILJS_PUBLIC_KEY || "").trim();

    if (this.publicKey) {
      emailjs.init({
        publicKey: this.publicKey,
      });
      console.log("[EmailJS Service] Initialized with VITE_EMAILJS_PUBLIC_KEY automatically.");
    }
  }

  /**
   * Configures or dynamic updates EmailJS credentials on the fly
   */
  public configure(config: { serviceId: string; templateId: string; publicKey: string }) {
    this.serviceId = config.serviceId.trim();
    this.templateId = config.templateId.trim();
    this.publicKey = config.publicKey.trim();
    
    if (this.publicKey) {
      emailjs.init({
        publicKey: this.publicKey,
      });
      console.log("[EmailJS Service] Configured dynamically with key: ", this.publicKey);
    }
  }

  /**
   * Returns current active keys state (safeguarding secret displays)
   */
  public getConfigurationState() {
    return {
      serviceId: this.serviceId,
      templateId: this.templateId,
      publicKey: this.publicKey,
      isConfigured: !!(this.serviceId && this.templateId && this.publicKey)
    };
  }

  /**
   * Trigger direct email dispatch via browser SDK
   */
  public async sendEmail(params: EmailParams): Promise<{ success: boolean; message: string }> {
    const { to_name, to_email, subject, message, type } = params;

    // Check credentials first
    if (!this.serviceId || !this.templateId || !this.publicKey) {
      const dbgMsg = "EmailJS is not fully configured with live credentials. The action has been recorded in the app's internal simulated mailbox.";
      console.warn(`[EmailJS Service] [Simulated Log] ${dbgMsg}`, params);
      return { 
        success: false, 
        message: dbgMsg 
      };
    }

    try {
      // Build lovely high-fidelity responsive HTML body for gorgeous direct inbox rendering
      const htmlMessage = generateHighFidelityEmailBody(type, to_name, subject, message, {
        doctorName: params.doctor_name,
        specialization: params.specialty,
        queueNumber: params.queue_number,
        apptDate: params.appointment_date,
        apptTime: params.appointment_time,
        email: to_email
      });

      // Map parameters precisely with multiple popular naming models (to_email, user_email, email, recipient_email)
      const templateParams = {
        to_name,
        user_name: to_name,
        name: to_name,

        to_email,
        user_email: to_email,
        email: to_email,
        recipient_email: to_email,

        subject,
        message: htmlMessage, // Send the rich HTML layout
        type,
        
        queue_number: params.queue_number ? String(params.queue_number) : "",
        doctor_name: params.doctor_name || "",
        specialty: params.specialty || "",
        appointment_date: params.appointment_date || "",
        appointment_time: params.appointment_time || "",
        queue_card_html: params.queue_card_html || "",
        
        sent_at: new Date().toLocaleString()
      };

      const result = await emailjs.send(
        this.serviceId,
        this.templateId,
        templateParams,
        this.publicKey
      );

      console.log("[EmailJS Service] Successfully emailed through live server!", result);
      return { 
        success: true, 
        message: `Email dispatched successfully! Status: ${result.status} ${result.text}` 
      };
    } catch (err: any) {
      console.error("[EmailJS Service] SDK delivery failure details:", err);
      return { 
        success: false, 
        message: err?.text || err?.message || "Internal dispatch exception occurred securely." 
      };
    }
  }

  /**
   * Dispatches automated user registration / Welcome email
   */
  /**
   * Helper to generate beautiful ASCII Queue Ticket Passes client-side
   */
  private generateQueueCard(
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
      padField("DOCTOR", doctorName),
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

  /**
   * Dispatches automated user registration / Welcome email
   */
  public async sendWelcomeEmail(toName: string, toEmail: string): Promise<{ success: boolean; message: string }> {
    return this.sendEmail({
      to_name: toName,
      to_email: toEmail,
      subject: "Welcome to SmartCare!",
      message: `Dear ${toName},\n\nYour registration with SmartCare was successful!\n\nYour credentials:\nUsername (Email): ${toEmail}\nRole: Patient\n\nYou can now log in, search for leading doctors, book instant slots, and keep track of live waiting positions.\n\nWarm regards,\nThe SmartCare Healthcare Team`,
      type: "REGISTRATION"
    });
  }

  /**
   * Dispatches automated appointment scheduled / booking notice
   */
  public async sendBookingEmail(
    toName: string,
    toEmail: string,
    details: { doctorName: string; date: string; time: string; queueNumber: number | string; reason: string }
  ): Promise<{ success: boolean; message: string }> {
    const card = this.generateQueueCard(toName, details.doctorName, "Consultation", details.queueNumber, details.date, details.time, "PENDING");
    
    const qNumStr = String(details.queueNumber).padStart(2, "0");
    const queueCardHtml = `
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
                <td style="padding-bottom: 10px; border-bottom: 1px solid #f1f5f9; text-align: right; color: #0f172a; font-weight: bold;">${toName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Doctor:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right; color: #0f172a; font-weight: bold;">${details.doctorName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Scheduled For:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right; color: #0f172a; font-weight: bold;">${details.date} @ ${details.time}</td>
              </tr>
              <tr>
                <td style="padding-top: 10px; color: #64748b; vertical-align: middle;">Status:</td>
                <td style="padding-top: 10px; text-align: right; vertical-align: middle;">
                  <span style="background-color: #fffbeb; color: #d97706; padding: 4px 12px; border-radius: 6px; font-weight: 800; font-size: 10px; text-transform: uppercase; border: 1px solid rgba(217, 119, 6, 0.15); display: inline-block;">PENDING</span>
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

    return this.sendEmail({
      to_name: toName,
      to_email: toEmail,
      subject: "SmartCare Request: Appointment Scheduled!",
      message: `Dear ${toName},\n\nYour appointment request has been submitted successfully.\n\nHere is your Digital Queue Pass:\n\n${card}\n\nWe will notify you once the clinic reviews and approves the Slot.\n\nWarm regards,\nSmartCare Clinic Operations Support`,
      type: "BOOKING",
      queue_number: details.queueNumber,
      doctor_name: details.doctorName,
      appointment_date: details.date,
      appointment_time: details.time,
      queue_card_html: queueCardHtml
    });
  }

  /**
   * Dispatches automated cancellation confirmation
   */
  public async sendCancellationEmail(
    toName: string,
    toEmail: string,
    details: { doctorName: string; date: string }
  ): Promise<{ success: boolean; message: string }> {
    return this.sendEmail({
      to_name: toName,
      to_email: toEmail,
      subject: "SmartCare Appointment Notice: CANCELLED",
      message: `Dear ${toName},\n\nYour scheduled appointment with ${details.doctorName} on ${details.date} has been CANCELLED.\n\nIf you did not request this, please contact support or log in to reschedule.\n\nWarm regards,\nSmartCare Clinic Support`,
      type: "CANCELLATION",
      doctor_name: details.doctorName,
      appointment_date: details.date
    });
  }
}

export const emailService = new EmailService();

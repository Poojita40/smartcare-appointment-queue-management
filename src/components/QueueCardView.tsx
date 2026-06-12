import React from "react";
import { 
  Activity, 
  Calendar, 
  Clock, 
  User, 
  Tag, 
  CheckCircle, 
  AlertTriangle, 
  Hospital,
  Mail,
  Lock,
  Sparkles,
  XCircle
} from "lucide-react";

interface QueueCardViewProps {
  body: string;
}

export const QueueCardView: React.FC<QueueCardViewProps> = ({ body }) => {
  const isHtml = body.trim().startsWith("<table") || body.trim().startsWith("<div");

  if (isHtml) {
    return (
      <div 
        className="email-rendered-html max-w-xl mx-auto rounded-3xl overflow-hidden border border-slate-150 bg-white" 
        dangerouslySetInnerHTML={{ __html: body }} 
      />
    );
  }

  // Strip out any trailing raw HTML block/tags if present to prevent rendering plain code in-app
  let cleanedBody = body;
  if (body.includes("<div")) {
    cleanedBody = body.split("<div")[0].trim();
  }

  // Check if this body contains the ASCII queue card signature
  const hasQueueCard = cleanedBody.includes("┌────────────────") || cleanedBody.includes("OFFICIAL QUEUE APPOINTMENT");

  if (!hasQueueCard) {
    // Elegant Notice Mailbox rendering for generic emails (cancellations, greetings, etc.)
    const isCancelled = cleanedBody.toUpperCase().includes("CANCEL");
    const isWelcome = cleanedBody.toUpperCase().includes("WELCOME") || cleanedBody.toUpperCase().includes("REGISTER");
    const isApproved = cleanedBody.toUpperCase().includes("APPROV");

    // Dynamic color coding
    let accentBorder = "border-slate-200";
    let accentBg = "bg-slate-50/50";
    let accentHeader = "from-slate-700 via-slate-800 to-slate-900";
    let accentIcon = <Mail size={16} className="text-slate-400" />;
    let emailStatusTitle = "SmartCare Official Notification";

    if (isCancelled) {
      accentBorder = "border-rose-150 shadow-xs";
      accentBg = "bg-rose-50/20";
      accentHeader = "from-rose-800 via-rose-950 to-slate-905";
      accentIcon = <XCircle size={16} className="text-rose-400 animate-pulse" />;
      emailStatusTitle = "Clinic Notice: CANCELLED";
    } else if (isApproved) {
      accentBorder = "border-emerald-150";
      accentBg = "bg-emerald-50/10";
      accentHeader = "from-emerald-800 via-emerald-950 to-emerald-900";
      accentIcon = <CheckCircle size={16} className="text-emerald-400" />;
      emailStatusTitle = "Clinic Notice: APPROVED";
    } else if (isWelcome) {
      accentBorder = "border-indigo-150";
      accentBg = "bg-indigo-50/10";
      accentHeader = "from-indigo-850 via-indigo-950 to-slate-900";
      accentIcon = <Sparkles size={16} className="text-indigo-400" />;
      emailStatusTitle = "Welcome to SmartCare";
    }

    // Split text into lines to parse details intelligently
    const textLines = cleanedBody.split("\n").map(l => l.trim());
    let greeting = "";
    const paragraphs: string[] = [];
    const credentials: { key: string; val: string }[] = [];
    let signatureLines: string[] = [];
    let state: "GREETING" | "BODY" | "SIGNATURE" = "GREETING";

    for (let i = 0; i < textLines.length; i++) {
      const line = textLines[i];
      if (!line) continue;

      // Detect credentials e.g. "- Username (Email): value"
      if (line.startsWith("- ")) {
        const parts = line.substring(2).split(":");
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const val = parts.slice(1).join(":").trim();
          credentials.push({ key, val });
          continue;
        }
      }

      // Detect signature start
      if (line.toLowerCase().includes("warm regards") || line.toLowerCase().includes("sincerely") || line.toLowerCase().includes("best regards")) {
        state = "SIGNATURE";
        signatureLines.push(line);
        continue;
      }

      if (state === "SIGNATURE") {
        signatureLines.push(line);
        continue;
      }

      // First non-empty line starting with "Dear"
      if (state === "GREETING" && line.startsWith("Dear")) {
        greeting = line;
        state = "BODY";
      } else {
        paragraphs.push(line);
      }
    }

    // Secondary Clean up if signature fell back
    if (signatureLines.length === 0 && textLines.length > 2) {
      // If no explicit regard found, take the last 2 lines if they look like signature
      const lastLine = textLines[textLines.length - 1];
      const secondLastLine = textLines[textLines.length - 2];
      if (lastLine && secondLastLine && (lastLine.toLowerCase().includes("team") || lastLine.toLowerCase().includes("support") || lastLine.toLowerCase().includes("clinic"))) {
        signatureLines = [secondLastLine, lastLine];
        // Remove from paragraphs
        const index1 = paragraphs.indexOf(secondLastLine);
        if (index1 !== -1) paragraphs.splice(index1, 1);
        const index2 = paragraphs.indexOf(lastLine);
        if (index2 !== -1) paragraphs.splice(index2, 1);
      }
    }

    return (
      <div className="space-y-4 text-slate-700 leading-relaxed font-sans text-xs md:text-sm text-left">
        <div className={`relative overflow-hidden bg-white border ${accentBorder} rounded-3xl shadow-sm max-w-md mx-auto transition-all hover:shadow-md`}>
          {/* Top Header hospital brand */}
          <div className={`px-5 py-4 bg-gradient-to-r ${accentHeader} text-white flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                {accentIcon}
              </div>
              <div>
                <h4 className="text-[10px] font-black tracking-widest text-teal-300 uppercase">SmartCare Notice</h4>
                <p className="text-[8px] font-bold text-slate-300/80 uppercase tracking-widest">{emailStatusTitle}</p>
              </div>
            </div>
            <Activity size={14} className="text-teal-400" />
          </div>

          <div className="p-5 md:p-6 space-y-4">
            {/* Elegant greeting banner */}
            {greeting && (
              <h3 className="text-xs md:text-sm font-black text-indigo-950 tracking-wide">
                {greeting}
              </h3>
            )}

            {/* Paragraph contents with dynamic layout */}
            <div className="space-y-3">
              {paragraphs.map((p, idx) => (
                <p key={idx} className="text-slate-650 leading-relaxed text-[11.5px] md:text-xs">
                  {p}
                </p>
              ))}
            </div>

            {/* Credentials / Secure details beautifully parsed */}
            {credentials.length > 0 && (
              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4.5 space-y-2.5 relative overflow-hidden">
                <div className="absolute right-3 top-3 text-slate-200">
                  <Lock size={32} />
                </div>
                <h4 className="text-[9px] font-extrabold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock size={10} className="text-indigo-600" />
                  Your Secure Credentials
                </h4>
                <div className="space-y-2 pt-1 font-mono text-[10.5px]">
                  {credentials.map((cred, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1 border-b border-dashed border-slate-200/65 last:border-0">
                      <span className="text-slate-450 font-sans font-bold text-[9px] uppercase tracking-wide">{cred.key}:</span>
                      <span className="bg-slate-200/60 dark:bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-semibold select-all">
                        {cred.val}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[8px] text-slate-400 italic pt-1">
                  For security, change your password immediately after logging in.
                </p>
              </div>
            )}

            {/* Signature Block */}
            {signatureLines.length > 0 && (
              <div className="pt-3 border-t border-slate-100 mt-2">
                <p className="text-[10px] font-medium text-slate-400 italic">Warm Regards,</p>
                <p className="text-xs font-extrabold text-indigo-950 tracking-wide mt-0.5">
                  {signatureLines.filter(s => !s.toLowerCase().includes("warm regards")).join(", ") || "SmartCare Operations Support Team"}
                </p>
              </div>
            )}
          </div>

          {/* Bottom styled footer notch decoration */}
          <div className="h-1 w-full bg-slate-100"></div>
        </div>
      </div>
    );
  }

  // Parse lines to pull data from cleanedBody
  const lines = cleanedBody.split("\n");
  let patient = "";
  let doctor = "";
  let date = "";
  let time = "";
  let token = "";
  let status = "";

  for (const line of lines) {
    if (line.includes("PATIENT:")) {
      patient = line.split("PATIENT:")[1].replace(/[│├┤┌┐└┘─]/g, "").trim();
    } else if (line.includes("DOCTOR:")) {
      doctor = line.split("DOCTOR:")[1].replace(/[│├┤┌┐└┘─]/g, "").trim();
    } else if (line.includes("DATE:")) {
      date = line.split("DATE:")[1].replace(/[│├┤┌┐└┘─]/g, "").trim();
    } else if (line.includes("TIME:")) {
      time = line.split("TIME:")[1].replace(/[│├┤┌┐└┘─]/g, "").trim();
    } else if (line.includes("STATUS:")) {
      status = line.split("STATUS:")[1].replace(/[│├┤┌┐└┘─]/g, "").trim();
    }
  }

  // Token number parser
  // Look for the line containing '#' inside the sub-box
  const tokenLine = lines.find(l => l.includes("# ") || (l.includes("#") && l.includes("│")));
  if (tokenLine) {
    const match = tokenLine.match(/#\s*(\d+)/) || tokenLine.match(/#\s*([A-Za-z0-9]+)/);
    if (match) {
      token = match[1];
    }
  }

  // Extract intro and outro block
  const cardStartIdx = lines.findIndex(l => l.includes("┌────────────────"));
  let cardEndIdx = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes("└────────────────")) {
      cardEndIdx = i;
      break;
    }
  }

  let introText = "";
  let footerText = "";

  if (cardStartIdx !== -1) {
    introText = lines.slice(0, cardStartIdx).join("\n").trim();
  }
  if (cardEndIdx !== -1) {
    footerText = lines.slice(cardEndIdx + 1).join("\n").trim();
  }

  // Fallbacks
  if (!patient) patient = "Valued Outpatient";
  if (!doctor) doctor = "SmartCare Clinical Practitioner";
  if (!token) token = "01";
  if (!status) status = "PENDING";

  // Customize status styling dynamically
  const isUpNext = status.toUpperCase().includes("NEXT");
  const isApproved = status.toUpperCase().includes("APPROV") || status.toUpperCase().includes("CONFIRM") || status.toUpperCase().includes("CHECK");
  const isPending = status.toUpperCase().includes("PENDING");
  const isCancelled = status.toUpperCase().includes("CANCEL");

  let statusBadgeColor = "bg-amber-50 text-amber-700 border-amber-200";
  let tokenBgColor = "from-amber-500 to-amber-600 shadow-amber-200/50";
  if (isUpNext) {
    statusBadgeColor = "bg-rose-50 text-rose-700 border-rose-200 animate-pulse";
    tokenBgColor = "from-rose-500 to-rose-600 shadow-rose-200/50";
  } else if (isApproved) {
    statusBadgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
    tokenBgColor = "from-emerald-500 to-emerald-600 shadow-emerald-200/50";
  } else if (isPending) {
    statusBadgeColor = "bg-indigo-50 text-indigo-700 border-indigo-200";
    tokenBgColor = "from-indigo-500 to-indigo-600 shadow-indigo-200/50";
  } else if (isCancelled) {
    statusBadgeColor = "bg-rose-50 text-rose-800 border-rose-200";
    tokenBgColor = "from-slate-500 to-slate-600 shadow-slate-200/50";
  }

  return (
    <div className="space-y-4 font-sans text-xs md:text-sm text-slate-700 leading-relaxed text-left">
      {/* Intro section text */}
      {introText && (
        <p className="whitespace-pre-line text-slate-650 bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100 italic">
          {introText}
        </p>
      )}

      {/* Beautiful High-Fidelity CSS Queue Card Pass */}
      <div className="relative overflow-hidden bg-white border border-slate-150 rounded-3xl shadow-sm max-w-md mx-auto transition-all hover:shadow-md">
        {/* Top Header hospital brand */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center text-teal-400">
              <Hospital size={15} />
            </div>
            <div>
              <h4 className="text-[10px] font-black tracking-widest text-teal-300 uppercase">SmartCare Clinic</h4>
              <p className="text-[8px] font-bold text-slate-300/80 uppercase tracking-widest">Queue Receipt Access</p>
            </div>
          </div>
          <Activity size={14} className="text-teal-400" />
        </div>

        {/* Diagonal striped banner overlay for premium aesthetics */}
        <div className="h-1 w-full bg-gradient-to-r from-teal-400 via-indigo-500 to-violet-600"></div>

        {/* Content Details */}
        <div className="p-5 md:p-6 space-y-4">
          <div className="text-center">
            <h3 className="text-xs font-black text-indigo-950 tracking-wider uppercase">
              Official Appointment Access Pass
            </h3>
            <p className="text-[9px] text-slate-400 font-semibold tracking-wide uppercase mt-0.5">
              Verified Digital Ticket
            </p>
          </div>

          {/* Core Info Pairs */}
          <div className="grid grid-cols-2 gap-3.5 bg-slate-50/75 p-4 rounded-2xl border border-slate-100 text-left">
            <div className="space-y-1">
              <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider block">Patient</span>
              <div className="flex items-center gap-1.5 text-slate-800">
                <User size={12} className="text-indigo-500" />
                <span className="font-bold text-slate-800 text-[11px] truncate">{patient}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider block">Doctor</span>
              <div className="flex items-center gap-1.5 text-slate-800">
                <Tag size={12} className="text-violet-500" />
                <span className="font-bold text-slate-800 text-[11px] truncate">{doctor}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider block">Date</span>
              <div className="flex items-center gap-1.5 text-slate-800">
                <Calendar size={12} className="text-emerald-500" />
                <span className="font-semibold text-slate-750 text-[11px]">{date}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider block">Time Slot</span>
              <div className="flex items-center gap-1.5 text-slate-800">
                <Clock size={12} className="text-sky-500" />
                <span className="font-semibold text-slate-755 text-[11px]">{time}</span>
              </div>
            </div>
          </div>

          {/* Massive Display Token Indicator and Status Badge */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center space-y-2 relative overflow-hidden">
            {/* Soft decorative ring background */}
            <div className="absolute -right-6 -bottom-6 w-20 h-20 rounded-full bg-slate-100 border border-slate-200/50 -z-10"></div>
            
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Assigned Waiting Token</p>
            
            <div className={`px-5 py-1.5 rounded-2xl bg-gradient-to-r ${tokenBgColor} text-white font-mono text-xl md:text-2xl font-black tracking-widest shadow-xs`}>
              # {String(token).padStart(2, "0")}
            </div>

            <span className={`inline-flex items-center gap-1 px-3 py-1 text-[9px] font-extrabold tracking-wider uppercase rounded-full border ${statusBadgeColor}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
              {status}
            </span>
          </div>

          <div className="text-center pt-1">
            <p className="text-[9px] text-slate-450 font-bold tracking-wide uppercase">
              Please present this card at the clinic desk
            </p>
            <p className="text-[8px] text-slate-400 mt-0.5">
              Wait times can be tracked natively in your active patient log portal.
            </p>
          </div>
        </div>

        {/* Tear-off design visual accents at the bottom */}
        <div className="flex justify-between px-3 -mt-1 pb-1">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="w-2.5 h-2.5 rounded-full bg-slate-100 border border-slate-200/60 -mb-1 px-0"></div>
          ))}
        </div>
      </div>

      {/* Outro section text */}
      {footerText && (
        <p className="whitespace-pre-line text-slate-500 bg-slate-50/10 p-3 rounded-2xl border border-slate-100 leading-relaxed text-[11px]">
          {footerText}
        </p>
      )}
    </div>
  );
};

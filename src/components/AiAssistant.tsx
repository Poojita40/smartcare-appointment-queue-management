import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Bot, User, ChevronRight, HelpCircle, Phone, Calendar, Clock, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import axios from "axios";
import { ChatMessage } from "../types";

export default function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "Hello! I am your **SmartCare Medical Assistant**. 🩺\n\nHow can I help you today? You can ask me about **booking appointments**, **real-time queue statuses**, **clinic contact info**, or request recommendations on **clinical specialists**.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    try {
      const response = await axios.post("/api/ai/chat", {
        messages: [...messages, userMsg].map((m) => ({
          sender: m.sender,
          text: m.text,
        })),
      });

      const assistantMsg: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        sender: "assistant",
        text: response.data.text || "I apologize, I received an empty response. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Chat API error:", error);
      const errorMsg: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        sender: "assistant",
        text: "My apologies, I experienced an intersection error reaching the clinical directory. Please try again in a moment.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = (actionType: string) => {
    let prompt = "";
    if (actionType === "book") {
      prompt = "How do I book an appointment with Dr. Sharma?";
    } else if (actionType === "queue") {
      prompt = "Explain how live queue tracking works.";
    } else if (actionType === "doctor") {
      prompt = "Which doctors are available and what are their specialities?";
    } else if (actionType === "contact") {
      prompt = "What is the clinic's phone number, email, and address?";
    }
    handleSendMessage(prompt);
  };

  const renderFormattedText = (text: string) => {
    // Basic bold/italic/bullet regex parsing for neat UI rendering without heavy libraries
    return text.split("\n").map((line, idx) => {
      let content = line;
      
      // Check for bullet lines
      const isBullet = content.startsWith("* ") || content.startsWith("- ");
      if (isBullet) {
        content = content.substring(2);
      }

      // Check for bold matches
      let parts: React.ReactNode[] = [];
      const boldRegex = /\*\*(.*?)\*\*/g;
      let lastIndex = 0;
      let match;
      
      while ((match = boldRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
          parts.push(content.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="font-semibold text-brand-primary">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      
      if (lastIndex < content.length) {
        parts.push(content.substring(lastIndex));
      }

      const renderedLine = parts.length > 0 ? parts : content;

      if (isBullet) {
        return (
          <li key={idx} className="ml-4 list-disc mt-1 text-slate-700 leading-relaxed text-sm">
            {renderedLine}
          </li>
        );
      }
      return (
        <p key={idx} className="text-slate-700 leading-relaxed text-sm mt-1 min-h-[4px]">
          {renderedLine}
        </p>
      );
    });
  };

  return (
    <motion.div
      id="smartcare-ai-assistant"
      initial={{ opacity: 0, scale: 0.8, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", damping: 15, stiffness: 180, delay: 0.3 }}
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end"
    >
      {/* Active Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="w-[360px] md:w-[400px] h-[520px] max-h-[80vh] flex flex-col rounded-2xl shadow-2xl glass-panel border border-white/50 mb-4 overflow-hidden"
          >
            {/* Chat Header */}
            <div className="bg-brand-primary p-4 text-white flex items-center justify-between shadow-indigo-200 shadow-md">
              <div className="flex items-center gap-3">
                <div className="bg-white/15 p-2 rounded-xl backdrop-blur-md">
                  <Bot size={20} className="text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm leading-tight">SmartCare Assistant</h4>
                  <span className="text-[11px] text-blue-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Gemini AI Agent Live
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMessages([messages[0]])}
                  title="Restart Chat"
                  className="hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Chat Logs Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-2 w-full ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.sender !== "user" && (
                    <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0 border border-brand-primary/15">
                      <Bot size={15} className="text-brand-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[78%] p-3 rounded-2xl text-left shadow-sm ${
                      m.sender === "user"
                        ? "bg-brand-primary text-white rounded-tr-none"
                        : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                    }`}
                  >
                    <div className="whitespace-pre-line leading-relaxed selection:bg-brand-accent">
                      {m.sender === "user" ? (
                        <p className="text-sm font-medium">{m.text}</p>
                      ) : (
                        renderFormattedText(m.text)
                      )}
                    </div>
                    <span
                      className={`text-[9px] block text-right mt-1.5 ${
                        m.sender === "user" ? "text-blue-100" : "text-slate-400"
                      }`}
                    >
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {/* Dynamic Quick Start Suggested Actions */}
              {messages.length === 1 && (
                <div className="ml-10 mr-2 space-y-2.5 animate-fadeIn">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pl-1">
                    Quick Start Suggestions
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => handleQuickAction("book")}
                      className="p-3 text-left bg-white hover:bg-brand-primary/5 hover:border-brand-primary/20 border border-slate-200/60 rounded-xl transition-all shadow-sm group cursor-pointer flex gap-3 items-start"
                    >
                      <div className="p-2 rounded-lg bg-indigo-50 text-brand-primary shrink-0 group-hover:bg-brand-primary group-hover:text-white transition-all">
                        <Calendar size={15} />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                          <span>📅 Learn how to book appointments</span>
                          <ChevronRight size={12} className="text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">Step-by-step assistant tutorial to secure a doctor's schedule slot.</p>
                      </div>
                    </button>

                    <button
                      onClick={() => handleQuickAction("queue")}
                      className="p-3 text-left bg-white hover:bg-brand-primary/5 hover:border-brand-primary/20 border border-slate-200/60 rounded-xl transition-all shadow-sm group cursor-pointer flex gap-3 items-start"
                    >
                      <div className="p-2 rounded-lg bg-sky-50 text-sky-600 shrink-0 group-hover:bg-sky-600 group-hover:text-white transition-all">
                        <Clock size={15} />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                          <span>🚶 Track live queues & waiting</span>
                          <ChevronRight size={12} className="text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">Understand your ticket token and estimated minutes ahead.</p>
                      </div>
                    </button>

                    <button
                      onClick={() => handleQuickAction("doctor")}
                      className="p-3 text-left bg-white hover:bg-brand-primary/5 hover:border-brand-primary/20 border border-slate-200/60 rounded-xl transition-all shadow-sm group cursor-pointer flex gap-3 items-start"
                    >
                      <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                        <HelpCircle size={15} />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                          <span>👨‍⚕️ Search and review doctors</span>
                          <ChevronRight size={12} className="text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">Find resident specialists (Cardiology, Neurology) and timings.</p>
                      </div>
                    </button>

                    <button
                      onClick={() => handleQuickAction("contact")}
                      className="p-3 text-left bg-white hover:bg-brand-primary/5 hover:border-brand-primary/20 border border-slate-200/60 rounded-xl transition-all shadow-sm group cursor-pointer flex gap-3 items-start"
                    >
                      <div className="p-2 rounded-lg bg-amber-50 text-amber-600 shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-all">
                        <Phone size={15} />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                          <span>📞 View clinic coordinates</span>
                          <ChevronRight size={12} className="text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">Get direct helpdesk numbers, physical map coordinates, and emails.</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {isTyping && (
                <div className="flex gap-2 w-full justify-start">
                  <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
                    <Bot size={15} className="text-brand-primary" />
                  </div>
                  <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>



            {/* Send Message Input */}
            <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputText)}
                placeholder="Ask SmartCare clinical helper..."
                className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-primary/50 text-slate-800 placeholder-slate-400"
              />
              <button
                onClick={() => handleSendMessage(inputText)}
                disabled={!inputText.trim()}
                className="p-2 rounded-xl bg-brand-primary text-white hover:bg-brand-secondary disabled:opacity-50 disabled:hover:bg-brand-primary transition-colors cursor-pointer shrink-0"
              >
                <Send size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Launcher Action Icon */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-brand-primary text-white shadow-xl hover:shadow-2xl flex items-center justify-center transition-all cursor-pointer focus:outline-none border-2 border-white"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </motion.button>
    </motion.div>
  );
}

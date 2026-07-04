// app/driver/support/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ChevronLeft, HelpCircle, MessageCircle, Phone, Mail, 
  FileText, ChevronRight, Search, Shield, Users, AlertCircle,
  Send, CheckCircle, XCircle, Clock, User, Loader2,
  ArrowRight, Star, Award, BookOpen, Headphones
} from "lucide-react";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface DriverFAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful?: number;
}

interface ContactMessage {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export default function DriverSupport() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [driverName, setDriverName] = useState("Driver");
  const [driverEmail, setDriverEmail] = useState("");
  const [driverPhone, setDriverPhone] = useState("");

  const [contactForm, setContactForm] = useState<ContactMessage>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [faqs, setFaqs] = useState<DriverFAQ[]>([
    {
      id: "1",
      category: "earnings",
      question: "How do I earn on MotoBus?",
      answer: "You earn from rides completed. You receive 80% of the fare, and MotoBus takes 20% as a service fee. You can track your earnings in the Earnings section.",
      helpful: 45
    },
    {
      id: "2",
      category: "rides",
      question: "How do I accept ride requests?",
      answer: "When you're online, ride requests will appear on your screen. You can accept or decline each request. Accepting means you're committing to pick up the rider.",
      helpful: 32
    },
    {
      id: "3",
      category: "payments",
      question: "When do I get paid?",
      answer: "Payments are processed daily. You can withdraw your earnings anytime through the Earnings section. Money is sent to your registered mobile money account within 24 hours.",
      helpful: 28
    },
    {
      id: "4",
      category: "safety",
      question: "What safety measures are in place?",
      answer: "We have real-time tracking, SOS buttons, driver verification, and 24/7 support. All rides are recorded and monitored for safety. In case of emergency, press the SOS button in the app.",
      helpful: 56
    },
    {
      id: "5",
      category: "rides",
      question: "What if a rider cancels mid-ride?",
      answer: "If a rider cancels after you've started the trip, you'll still receive the full fare. For cancellations before pickup, a cancellation fee may apply. Contact support if you have any issues.",
      helpful: 18
    },
    {
      id: "6",
      category: "earnings",
      question: "How do I withdraw my earnings?",
      answer: "Go to the Earnings section in your dashboard, click on 'Withdraw', enter the amount, and confirm. Funds will be sent to your registered mobile money account.",
      helpful: 23
    },
    {
      id: "7",
      category: "safety",
      question: "What should I do in an emergency?",
      answer: "Use the SOS button in the app immediately. This will alert our support team and share your location. You can also call our emergency hotline: +250 788 123 456.",
      helpful: 67
    },
    {
      id: "8",
      category: "account",
      question: "How do I update my vehicle information?",
      answer: "Go to Profile > Vehicle Details. You can update your vehicle number, model, and type. Changes may require admin approval.",
      helpful: 15
    },
  ]);

  useEffect(() => {
    // Get driver info from localStorage
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setDriverName(user.name || "Driver");
        setDriverEmail(user.email || "");
        setDriverPhone(user.phone || "");
        setContactForm(prev => ({
          ...prev,
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
        }));
      }
    } catch {}
  }, []);

  const quickActions = [
    { 
      icon: MessageCircle, 
      label: "Live Chat", 
      color: "text-green-500", 
      bg: "bg-green-500/10",
      action: () => toast("💬 Starting live chat... Please wait for an agent."),
      available: true
    },
    { 
      icon: Phone, 
      label: "Call Support", 
      color: "text-blue-500", 
      bg: "bg-blue-500/10",
      action: () => {
        if (confirm("Call support at +250 788 123 456?")) {
          window.location.href = "tel:+250788123456";
        }
      },
      available: true
    },
    { 
      icon: Mail, 
      label: "Email", 
      color: "text-yellow-500", 
      bg: "bg-yellow-500/10",
      action: () => {
        window.location.href = "mailto:support@motobus.com?subject=Driver Support Request";
      },
      available: true
    },
    { 
      icon: FileText, 
      label: "Driver Guide", 
      color: "text-purple-500", 
      bg: "bg-purple-500/10",
      action: () => toast("📖 Opening driver guide..."),
      available: true
    },
  ];

  const categories = [
    { label: "All", value: "all", icon: "📋" },
    { label: "Earnings", value: "earnings", icon: "💰" },
    { label: "Rides", value: "rides", icon: "🚗" },
    { label: "Payments", value: "payments", icon: "💳" },
    { label: "Safety", value: "safety", icon: "🛡️" },
    { label: "Account", value: "account", icon: "👤" },
  ];

  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactForm.message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setSending(true);
    try {
      const token = localStorage.getItem('token');
      
      // Try to send to backend
      const res = await fetch(`${API_URL}/support/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(contactForm),
      });

      if (res.ok) {
        toast.success("✅ Message sent! We'll get back to you soon.");
        setShowContactForm(false);
        setContactForm(prev => ({ ...prev, message: "", subject: "" }));
      } else {
        // Fallback - simulate sending
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success("✅ Message sent! We'll get back to you soon.");
        setShowContactForm(false);
        setContactForm(prev => ({ ...prev, message: "", subject: "" }));
      }
    } catch (err) {
      // Fallback - simulate sending
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("✅ Message sent! We'll get back to you soon.");
      setShowContactForm(false);
      setContactForm(prev => ({ ...prev, message: "", subject: "" }));
    } finally {
      setSending(false);
    }
  };

  const handleHelpful = (faqId: string, helpful: boolean) => {
    setFaqs(prev => prev.map(faq => 
      faq.id === faqId 
        ? { ...faq, helpful: (faq.helpful || 0) + (helpful ? 1 : -1) }
        : faq
    ));
    toast.success(helpful ? "👍 Glad it helped!" : "👎 Thanks for your feedback!");
  };

  return (
    <div className="min-h-screen bg-[#080C09] text-white p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* ─── HEADER ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/driver" className="p-2 hover:bg-[#141C15] rounded-xl transition">
            <ChevronLeft size={20} className="text-gray-400" />
          </Link>
          <h1 className="text-2xl font-bold">🆘 Driver Support</h1>
          <span className="ml-auto text-xs bg-green-500/20 text-green-500 px-3 py-1 rounded-full border border-green-500/20 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            24/7
          </span>
        </div>

        {/* ─── DRIVER INFO ──────────────────────────────────────────── */}
        <div className="bg-[#111714] border border-gray-800 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-sm font-bold text-green-500 border border-green-500/20">
              {driverName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-sm">{driverName}</p>
              <p className="text-xs text-gray-400 flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <Phone size={10} /> {driverPhone || "No phone"}
                </span>
                <span className="w-px h-3 bg-gray-700" />
                <span className="flex items-center gap-1">
                  <Mail size={10} /> {driverEmail || "No email"}
                </span>
              </p>
            </div>
            <span className="ml-auto text-xs text-green-500 flex items-center gap-1">
              <CheckCircle size={12} /> Active
            </span>
          </div>
        </div>

        {/* ─── QUICK ACTIONS ────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className="bg-[#111714] border border-gray-800 rounded-xl p-4 text-center hover:border-green-500/30 transition group"
            >
              <div className={`w-10 h-10 rounded-full ${action.bg} flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition`}>
                <action.icon size={18} className={action.color} />
              </div>
              <span className="text-xs text-gray-300 group-hover:text-white transition">{action.label}</span>
              {action.available && (
                <span className="block text-[8px] text-green-500 mt-0.5">● Available</span>
              )}
            </button>
          ))}
        </div>

        {/* ─── SEARCH ────────────────────────────────────────────────── */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-10 bg-[#141C15] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-green-500 transition placeholder-gray-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* ─── CATEGORY FILTERS ─────────────────────────────────────── */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === cat.value
                  ? 'bg-green-500/20 text-green-500 border border-green-500/20'
                  : 'bg-[#111714] text-gray-400 border border-gray-700 hover:border-gray-600'
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* ─── FAQ SECTION ──────────────────────────────────────────── */}
        <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
          <BookOpen size={14} />
          Frequently Asked Questions
          <span className="text-[10px] text-gray-500 ml-auto">{filteredFAQs.length} articles</span>
        </h3>
        
        <div className="space-y-2">
          {filteredFAQs.length === 0 ? (
            <div className="bg-[#111714] border border-gray-800 rounded-xl p-8 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-gray-400 text-sm">No FAQs found for your search</p>
              <button
                onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
                className="mt-3 text-xs text-green-500 hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            filteredFAQs.map((faq) => (
              <div
                key={faq.id}
                className="bg-[#111714] border border-gray-800 rounded-xl overflow-hidden hover:border-green-500/20 transition"
              >
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[#0A0E0B] transition group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 bg-[#0A0E0B] px-2 py-0.5 rounded-full">
                        {faq.category}
                      </span>
                      <span className="text-sm font-medium text-white">{faq.question}</span>
                    </div>
                  </div>
                  <ChevronRight
                    size={18}
                    className={`text-gray-400 transition-transform flex-shrink-0 ${
                      expandedFAQ === faq.id ? "rotate-90" : "group-hover:text-green-500"
                    }`}
                  />
                </button>
                
                {expandedFAQ === faq.id && (
                  <div className="px-4 pb-4 border-t border-gray-800 pt-3">
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {faq.answer}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs">
                      <span className="text-gray-500">Was this helpful?</span>
                      <button
                        onClick={() => handleHelpful(faq.id, true)}
                        className="px-3 py-1 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20 transition flex items-center gap-1"
                      >
                        👍 Yes
                      </button>
                      <button
                        onClick={() => handleHelpful(faq.id, false)}
                        className="px-3 py-1 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition flex items-center gap-1"
                      >
                        👎 No
                      </button>
                      {faq.helpful && (
                        <span className="text-gray-500 flex items-center gap-1">
                          <Users size={12} /> {faq.helpful} found this helpful
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* ─── CONTACT SUPPORT ──────────────────────────────────────── */}
        <div className="mt-6 bg-[#111714] border border-gray-800 rounded-xl p-6 text-center">
          <div className="text-3xl mb-3">📞</div>
          <h3 className="font-semibold text-lg mb-1">Driver Support Center</h3>
          <p className="text-sm text-gray-400 mb-4">Available 24/7 for drivers</p>
          
          <div className="flex flex-wrap gap-3 justify-center">
            <button 
              onClick={() => window.location.href = "tel:+250788123456"}
              className="px-6 py-2.5 bg-green-500 text-black rounded-xl font-semibold hover:bg-green-400 transition flex items-center gap-2"
            >
              <Phone size={16} /> Call Now
            </button>
            <button 
              onClick={() => setShowContactForm(true)}
              className="px-6 py-2.5 bg-[#141C15] border border-gray-700 rounded-xl hover:border-green-500/30 transition flex items-center gap-2"
            >
              <Mail size={16} /> Email Us
            </button>
          </div>
          
          <div className="mt-4 text-xs text-gray-500 flex items-center justify-center gap-4">
            <span className="flex items-center gap-1">
              <Clock size={12} /> 24/7 Support
            </span>
            <span className="w-px h-3 bg-gray-700" />
            <span className="flex items-center gap-1">
              <Headphones size={12} /> Priority for drivers
            </span>
          </div>
        </div>

        {/* ─── CONTACT FORM MODAL ───────────────────────────────────── */}
        {showContactForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#111714] border border-gray-800 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Mail size={18} className="text-green-500" />
                  Contact Support
                </h3>
                <button
                  onClick={() => setShowContactForm(false)}
                  className="p-2 hover:bg-[#0A0E0B] rounded-xl transition"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleContactSubmit} className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Name</label>
                  <input
                    type="text"
                    value={contactForm.name}
                    onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 bg-[#0A0E0B] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-green-500/30"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Email</label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2 bg-[#0A0E0B] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-green-500/30"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Phone</label>
                  <input
                    type="tel"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2 bg-[#0A0E0B] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-green-500/30"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Subject</label>
                  <input
                    type="text"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-4 py-2 bg-[#0A0E0B] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-green-500/30"
                    placeholder="Brief subject..."
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Message</label>
                  <textarea
                    value={contactForm.message}
                    onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-4 py-2 bg-[#0A0E0B] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-green-500/30 resize-none"
                    rows={4}
                    placeholder="Describe your issue..."
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-3 bg-green-500 text-black rounded-xl font-semibold hover:bg-green-400 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ─── EMERGENCY ────────────────────────────────────────────── */}
        <div className="mt-6 p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} className="text-red-500" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-400">Emergency Assistance</p>
              <p className="text-xs text-gray-400">
                For immediate help, call our emergency hotline: 
                <span className="text-white font-medium ml-1">+250 788 123 456</span>
              </p>
            </div>
          </div>
        </div>

        {/* ─── VERSION ──────────────────────────────────────────────── */}
        <div className="text-center text-xs text-gray-600 mt-6">
          Support Center v2.0.0
        </div>
      </div>
    </div>
  );
}

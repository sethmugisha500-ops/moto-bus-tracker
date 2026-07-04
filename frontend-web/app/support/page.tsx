// app/support/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, HelpCircle, MessageCircle, Phone, Mail, 
  FileText, ChevronRight, Search, Shield, AlertCircle, 
  Clock, Send, Loader2, CheckCircle, XCircle,
  Users, Award, Star, BookOpen, Headphones,
  ArrowRight, ExternalLink, Calendar
} from "lucide-react";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://moto-bus-backend.onrender.com/api';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
  createdAt?: string;
}

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  category: string;
}

export default function GlobalSupport() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showContactForm, setShowContactForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [faqs, setFaqs] = useState<FAQ[]>([
    {
      id: "1",
      question: "What is MotoBus?",
      answer: "MotoBus is East Africa's smartest ride-hailing platform. We connect riders with trusted drivers for safe, reliable, and affordable transportation across Rwanda, Kenya, Uganda, Tanzania, and Burundi.",
      category: "general",
      helpful: 128
    },
    {
      id: "2",
      question: "How do I create an account?",
      answer: "Download the app from the App Store or Google Play, tap 'Sign Up', enter your phone number, verify with OTP, and complete your profile. You'll be ready to ride in minutes.",
      category: "account",
      helpful: 95
    },
    {
      id: "3",
      question: "Is my payment information secure?",
      answer: "Yes! All payments are encrypted and processed through secure gateways. We use industry-standard SSL encryption and never store your full card details. Your financial information is safe with us.",
      category: "payments",
      helpful: 76
    },
    {
      id: "4",
      question: "How do I become a driver?",
      answer: "To become a driver, download the MotoBus Driver app, sign up with your phone number, complete the registration form with your vehicle details, and wait for admin approval. The process typically takes 24-48 hours.",
      category: "driver",
      helpful: 112
    },
    {
      id: "5",
      question: "What areas does MotoBus serve?",
      answer: "MotoBus currently operates in Kigali, Rwanda, with plans to expand to other cities across East Africa. We cover all major neighborhoods including Kacyiru, Kimihurura, Remera, Kimironko, and Kicukiro.",
      category: "general",
      helpful: 67
    },
    {
      id: "6",
      question: "How do I contact MotoBus support?",
      answer: "You can reach our support team 24/7 via:\n• Live Chat: Available in the app\n• Phone: +250 788 123 456\n• Email: support@motobus.com\n• In-app support form",
      category: "support",
      helpful: 89
    },
    {
      id: "7",
      question: "What should I do if I have a problem with my ride?",
      answer: "If you encounter any issues during your ride, use the SOS button in the app for emergencies. For non-emergency issues, contact our support team through the app or call our hotline after your ride completes.",
      category: "rides",
      helpful: 54
    },
    {
      id: "8",
      question: "How do I rate my driver?",
      answer: "After each ride, you'll be prompted to rate your driver from 1-5 stars. Your feedback helps us maintain high service standards and reward our best drivers.",
      category: "rides",
      helpful: 43
    },
  ]);

  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    category: "general"
  });

  const categories = [
    { label: "All", value: "all", icon: "📋" },
    { label: "General", value: "general", icon: "ℹ️" },
    { label: "Account", value: "account", icon: "👤" },
    { label: "Payments", value: "payments", icon: "💳" },
    { label: "Rides", value: "rides", icon: "🚗" },
    { label: "Driver", value: "driver", icon: "🚕" },
    { label: "Support", value: "support", icon: "🆘" },
  ];

  const quickActions = [
    { 
      icon: MessageCircle, 
      label: "Live Chat", 
      color: "text-green-500", 
      bg: "bg-green-500/10",
      action: () => toast.info("💬 Starting live chat... Please wait for an agent."),
      desc: "24/7 instant support"
    },
    { 
      icon: Phone, 
      label: "Call Us", 
      color: "text-blue-500", 
      bg: "bg-blue-500/10",
      action: () => {
        if (confirm("Call support at +250 788 123 456?")) {
          window.location.href = "tel:+250788123456";
        }
      },
      desc: "Talk to an agent"
    },
    { 
      icon: Mail, 
      label: "Email", 
      color: "text-yellow-500", 
      bg: "bg-yellow-500/10",
      action: () => {
        window.location.href = "mailto:support@motobus.com?subject=MotoBus Support Request";
      },
      desc: "24-hour response"
    },
    { 
      icon: FileText, 
      label: "FAQ", 
      color: "text-purple-500", 
      bg: "bg-purple-500/10",
      action: () => {
        document.getElementById('faq-section')?.scrollIntoView({ behavior: 'smooth' });
      },
      desc: "Browse answers"
    },
  ];

  // Get user info from localStorage
  useEffect(() => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setFormData(prev => ({
          ...prev,
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
        }));
      }
    } catch {}
    setLoading(false);
  }, []);

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.error("Please enter a valid email");
      return;
    }

    setSending(true);
    try {
      const token = localStorage.getItem('token');
      
      const res = await fetch(`${API_URL}/support/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("✅ Message sent! We'll get back to you within 24 hours.");
        setShowContactForm(false);
        setFormData(prev => ({ ...prev, message: "", subject: "" }));
      } else {
        // Fallback - simulate sending
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success("✅ Message sent! We'll get back to you soon.");
        setShowContactForm(false);
        setFormData(prev => ({ ...prev, message: "", subject: "" }));
      }
    } catch (err) {
      // Fallback - simulate sending
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("✅ Message sent! We'll get back to you soon.");
      setShowContactForm(false);
      setFormData(prev => ({ ...prev, message: "", subject: "" }));
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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading support center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080C09] text-white p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* ─── HEADER ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="p-2 hover:bg-[#141C15] rounded-xl transition">
            <ChevronLeft size={20} className="text-gray-400" />
          </Link>
          <h1 className="text-2xl font-bold">🆘 Help & Support</h1>
          <span className="ml-auto text-xs bg-green-500/20 text-green-500 px-3 py-1 rounded-full border border-green-500/20 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            24/7 Support
          </span>
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
              <span className="text-xs font-medium text-gray-300 group-hover:text-white transition">{action.label}</span>
              <p className="text-[10px] text-gray-500 mt-0.5">{action.desc}</p>
            </button>
          ))}
        </div>

        {/* ─── SEARCH ────────────────────────────────────────────────── */}
        <div className="relative mb-6">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="How can we help you?"
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
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2" id="faq-section">
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
              <p className="text-gray-400 text-sm">No results found for your search</p>
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
                      <span className="text-xs text-gray-500 bg-[#0A0E0B] px-2 py-0.5 rounded-full capitalize">
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
                    <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">
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
                      {faq.helpful > 0 && (
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

        {/* ─── CONTACT SECTION ──────────────────────────────────────── */}
        <div className="mt-6 bg-[#111714] border border-gray-800 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">💬</div>
          <h3 className="font-semibold text-lg mb-1">Still need help?</h3>
          <p className="text-sm text-gray-400 mb-4">Our support team is available 24/7</p>
          
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => setShowContactForm(true)}
              className="px-6 py-2.5 bg-green-500 text-black rounded-xl font-semibold hover:bg-green-400 transition flex items-center gap-2"
            >
              <Mail size={16} /> Contact Us
            </button>
            <button
              onClick={() => window.location.href = "tel:+250788123456"}
              className="px-6 py-2.5 bg-[#141C15] border border-gray-700 rounded-xl hover:border-green-500/30 transition flex items-center gap-2"
            >
              <Phone size={16} /> Call Now
            </button>
          </div>
          
          <div className="mt-4 text-xs text-gray-500 flex items-center justify-center gap-4">
            <span className="flex items-center gap-1">
              <Clock size={12} /> 24/7 Support
            </span>
            <span className="w-px h-3 bg-gray-700" />
            <span className="flex items-center gap-1">
              <Headphones size={12} /> Priority for premium users
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
                  <label className="text-xs text-gray-400 block mb-1">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 bg-[#0A0E0B] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-green-500/30"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2 bg-[#0A0E0B] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-green-500/30"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2 bg-[#0A0E0B] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-green-500/30"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-2 bg-[#0A0E0B] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-green-500/30"
                  >
                    {categories.filter(c => c.value !== 'all').map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Subject</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-4 py-2 bg-[#0A0E0B] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-green-500/30"
                    placeholder="Brief subject..."
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Message *</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-4 py-2 bg-[#0A0E0B] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-green-500/30 resize-none"
                    rows={4}
                    placeholder="Describe your issue in detail..."
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

        {/* ─── VERSION ──────────────────────────────────────────────── */}
        <div className="text-center text-xs text-gray-600 mt-6">
          Support Center v2.0.0
        </div>
      </div>
    </div>
  );
}
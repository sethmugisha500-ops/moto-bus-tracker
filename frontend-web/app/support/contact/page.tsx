// app/support/contact/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, Mail, Phone, Send, Loader2,
  CheckCircle, AlertCircle, User, MessageSquare,
  ArrowLeft
} from "lucide-react";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://moto-bus-backend.onrender.com/api';

export default function ContactSupport() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

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
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!formData.message.trim()) {
      setError("Please enter a message");
      return;
    }

    if (!formData.name.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError("Please enter a valid email");
      return;
    }

    setLoading(true);

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
        setSuccess(true);
        toast.success("✅ Message sent successfully!");
        setFormData(prev => ({ ...prev, subject: "", message: "" }));
        setTimeout(() => {
          router.push('/support');
        }, 3000);
      } else {
        throw new Error("Failed to send message");
      }
    } catch (err) {
      setError("Failed to send message. Please try again.");
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080C09] text-white p-4 pb-24">
      <div className="max-w-2xl mx-auto">
        {/* ─── HEADER ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/support" className="p-2 hover:bg-[#141C15] rounded-xl transition">
            <ChevronLeft size={20} className="text-gray-400" />
          </Link>
          <h1 className="text-2xl font-bold">Contact Support</h1>
        </div>

        {success ? (
          <div className="bg-[#111714] border border-green-500/20 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-white mb-2">Message Sent!</h2>
            <p className="text-gray-400 mb-4">
              Thank you for reaching out. Our support team will get back to you within 24 hours.
            </p>
            <Link
              href="/support"
              className="px-6 py-2 bg-green-500 text-black rounded-xl font-semibold hover:bg-green-400 transition inline-block"
            >
              Back to Support
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-[#111714] border border-gray-800 rounded-2xl p-6">
            <div className="mb-4">
              <p className="text-sm text-gray-400">
                Fill in the form below and our support team will get back to you within 24 hours.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Full Name *</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 pl-10 bg-[#0A0E0B] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-green-500/30"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Email Address *</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2 pl-10 bg-[#0A0E0B] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-green-500/30"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Phone Number</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2 pl-10 bg-[#0A0E0B] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-green-500/30"
                  />
                </div>
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
                <div className="relative">
                  <MessageSquare size={18} className="absolute left-3 top-3 text-gray-500" />
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-4 py-2 pl-10 bg-[#0A0E0B] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-green-500/30 resize-none"
                    rows={5}
                    placeholder="Describe your issue in detail..."
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-green-500 text-black rounded-xl font-semibold hover:bg-green-400 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
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
            </div>
          </form>
        )}

        <div className="mt-6 flex items-center justify-between text-xs text-gray-500">
          <Link href="/support" className="flex items-center gap-1 hover:text-white transition">
            <ArrowLeft size={14} /> Back to Support
          </Link>
          <span>Response time: &lt; 24 hours</span>
        </div>
      </div>
    </div>
  );
}
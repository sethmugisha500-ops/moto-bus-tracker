// app/passenger/support/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ChevronLeft, HelpCircle, MessageCircle, 
  Phone, Mail, FileText, ChevronRight, Search,
  AlertCircle, Shield, CreditCard, MapPin, Clock
} from "lucide-react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export default function SupportPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const faqs: FAQ[] = [
    {
      id: "1",
      category: "rides",
      question: "How do I book a ride?",
      answer: "To book a ride, open the MotoBus app, enter your destination, select your ride type, and tap 'Request Ride'. You'll be matched with a nearby driver in seconds."
    },
    {
      id: "2",
      category: "payment",
      question: "What payment methods are accepted?",
      answer: "We accept MTN MoMo, Airtel Money, M-Pesa, Wallet balance, and cash. You can also pay with credit/debit cards through Flutterwave."
    },
    {
      id: "3",
      category: "rides",
      question: "How do I track my ride?",
      answer: "After booking, you can track your driver's location in real-time on the map. You'll also receive updates via push notifications and SMS."
    },
    {
      id: "4",
      category: "safety",
      question: "Is MotoBus safe?",
      answer: "Yes! All drivers are vetted and approved. We offer SOS features, real-time tracking, and share ride details with your emergency contacts."
    },
    {
      id: "5",
      category: "payment",
      question: "How do I add money to my wallet?",
      answer: "Go to Wallet > Add Money, select your preferred payment method (MoMo, Bank, etc.), enter the amount, and confirm the transaction."
    },
    {
      id: "6",
      category: "rides",
      question: "Can I cancel my ride?",
      answer: "Yes, you can cancel a ride before the driver arrives. Go to the active ride screen and tap 'Cancel Ride'. A cancellation fee may apply."
    },
  ];

  const categories = [
    { id: "all", label: "All", icon: HelpCircle },
    { id: "rides", label: "Rides", icon: MapPin },
    { id: "payment", label: "Payment", icon: CreditCard },
    { id: "safety", label: "Safety", icon: Shield },
  ];

  const filteredFAQs = faqs
    .filter(faq => selectedCategory === "all" || faq.category === selectedCategory)
    .filter(faq =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const quickActions = [
    { icon: MessageCircle, label: "Live Chat", color: "text-green-500", bg: "bg-green-500/10" },
    { icon: Phone, label: "Call Us", color: "text-blue-500", bg: "bg-blue-500/10" },
    { icon: Mail, label: "Email", color: "text-yellow-500", bg: "bg-yellow-500/10" },
    { icon: FileText, label: "FAQs", color: "text-purple-500", bg: "bg-purple-500/10" },
  ];

  return (
    <div className="min-h-screen bg-[#080C09] text-white p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/passenger/profile" className="p-2 hover:bg-[#141C15] rounded-xl transition">
            <ChevronLeft size={20} className="text-gray-400" />
          </Link>
          <h1 className="text-2xl font-bold">Support</h1>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-6">
          {quickActions.map((action, index) => (
            <button
              key={index}
              className="bg-[#111714] border border-gray-800 rounded-xl p-4 text-center hover:border-green-500/30 transition"
            >
              <div className={`w-10 h-10 rounded-full ${action.bg} flex items-center justify-center mx-auto mb-2`}>
                <action.icon size={18} className={action.color} />
              </div>
              <span className="text-xs text-gray-300">{action.label}</span>
            </button>
          ))}
        </div>

        <div className="relative mb-6">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-10 bg-[#141C15] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-green-500 transition placeholder-gray-500"
          />
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                selectedCategory === cat.id
                  ? "bg-green-500 text-black"
                  : "bg-[#141C15] text-gray-400 hover:text-white"
              }`}
            >
              <cat.icon size={14} />
              {cat.label}
            </button>
          ))}
        </div>

        <h3 className="text-sm font-semibold text-gray-400 mb-3">Frequently Asked Questions</h3>
        <div className="space-y-2">
          {filteredFAQs.length === 0 ? (
            <div className="bg-[#111714] border border-gray-800 rounded-xl p-8 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-gray-400 text-sm">No FAQs found for your search</p>
            </div>
          ) : (
            filteredFAQs.map((faq) => (
              <div
                key={faq.id}
                className="bg-[#111714] border border-gray-800 rounded-xl overflow-hidden hover:border-green-500/30 transition"
              >
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[#0A0E0B] transition"
                >
                  <span className="text-sm font-medium">{faq.question}</span>
                  <ChevronRight
                    size={18}
                    className={`text-gray-400 transition-transform ${
                      expandedFAQ === faq.id ? "rotate-90" : ""
                    }`}
                  />
                </button>
                {expandedFAQ === faq.id && (
                  <div className="px-4 pb-4 text-sm text-gray-400 leading-relaxed border-t border-gray-800 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="mt-6 bg-[#111714] border border-gray-800 rounded-xl p-6 text-center">
          <div className="text-3xl mb-3">💬</div>
          <h3 className="font-semibold mb-1">Still need help?</h3>
          <p className="text-sm text-gray-400 mb-4">Our support team is here for you</p>
          <div className="flex gap-3 justify-center">
            <button className="px-4 py-2 bg-green-500 text-black rounded-xl font-semibold hover:bg-green-400 transition">
              Start Chat
            </button>
            <button className="px-4 py-2 bg-[#141C15] border border-gray-700 rounded-xl hover:border-green-500/30 transition">
              Call Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

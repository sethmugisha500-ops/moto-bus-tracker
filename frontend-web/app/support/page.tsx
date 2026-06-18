'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Phone, Mail, MapPin, Clock, Send, HelpCircle, Shield, CreditCard, Truck } from 'lucide-react';

const faqs = [
  {
    question: "How do I book a ride?",
    answer: "Simply open the app, enter your pickup and dropoff locations, choose your vehicle type, and confirm your booking. You'll be matched with a nearby driver instantly.",
  },
  {
    question: "What payment methods are accepted?",
    answer: "We accept Mobile Money (MTN, Airtel), Wallet balance, and Cash payments. You can choose your preferred method before booking.",
  },
  {
    question: "How is the fare calculated?",
    answer: "Fares are calculated based on distance, time, and demand. You'll see the exact fare before confirming your ride.",
  },
  {
    question: "Is MotoBus safe?",
    answer: "Yes! All drivers are vetted, vehicles are inspected, and rides are tracked in real-time. We also have an SOS button for emergencies.",
  },
  {
    question: "How do I contact my driver?",
    answer: "Once your ride is accepted, you can call or message your driver through the app. Their contact information is available in the ride details.",
  },
  {
    question: "What if I need to cancel my ride?",
    answer: "You can cancel a ride from the app. Cancellation fees may apply if you cancel after the driver has been assigned.",
  },
];

const contactMethods = [
  { icon: Phone, title: "Call Us", details: "+250 788 123 456", action: "Call Now", href: "tel:+250788123456" },
  { icon: MessageCircle, title: "WhatsApp", details: "+250 788 123 456", action: "Message", href: "https://wa.me/250788123456" },
  { icon: Mail, title: "Email", details: "support@motobus.rw", action: "Send Email", href: "mailto:support@motobus.rw" },
  { icon: MapPin, title: "Office", details: "Kigali Heights, 5th Floor", action: "Get Directions", href: "#" },
];

const emergencyContacts = [
  { number: "112", service: "Police Emergency" },
  { number: "912", service: "Ambulance" },
  { number: "110", service: "Rwanda National Police" },
];

export default function SupportPage() {
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSubmitted(true);
    setMessage('');
    setIsSubmitting(false);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">How Can We Help You?</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Get support, find answers, or reach out to our team
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 text-center shadow-md">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-8 h-8 text-yellow-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">FAQ</h3>
            <p className="text-gray-600 mb-4">Find quick answers to common questions</p>
            <button className="text-yellow-500 font-medium">View FAQs →</button>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-md">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-yellow-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Safety Center</h3>
            <p className="text-gray-600 mb-4">Learn about our safety measures</p>
            <button className="text-yellow-500 font-medium">Learn More →</button>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-md">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-yellow-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Payment Issues</h3>
            <p className="text-gray-600 mb-4">Get help with payments and refunds</p>
            <button className="text-yellow-500 font-medium">Resolve Issue →</button>
          </div>
        </div>

        {/* Emergency Section */}
        <div className="bg-red-50 rounded-2xl p-8 mb-12 border-2 border-red-200">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold text-red-800 mb-2">🚨 Emergency?</h2>
              <p className="text-red-700">If you're in immediate danger, call emergency services</p>
            </div>
            <div className="flex gap-4">
              {emergencyContacts.map((contact, index) => (
                <a
                  key={index}
                  href={`tel:${contact.number}`}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors text-center"
                >
                  <div className="text-2xl font-bold">{contact.number}</div>
                  <div className="text-xs">{contact.service}</div>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Methods */}
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Contact Us</h2>
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {contactMethods.map((method, index) => (
            <motion.a
              key={index}
              href={method.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-all"
            >
              <method.icon className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-800 mb-1">{method.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{method.details}</p>
              <span className="text-yellow-500 text-sm font-medium">{method.action} →</span>
            </motion.a>
          ))}
        </div>

        {/* FAQ Section */}
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4 mb-12">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl shadow-md overflow-hidden"
            >
              <button
                onClick={() => setActiveFAQ(activeFAQ === index ? null : index)}
                className="w-full text-left p-6 flex justify-between items-center hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-800">{faq.question}</span>
                <span className="text-yellow-500 text-xl">{activeFAQ === index ? '−' : '+'}</span>
              </button>
              {activeFAQ === index && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="px-6 pb-6"
                >
                  <p className="text-gray-600">{faq.answer}</p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">Still Need Help?</h2>
            <p className="text-gray-600 text-center mb-8">Send us a message and we'll get back to you within 24 hours</p>
            
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-50 border border-green-200 rounded-lg p-6 text-center"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">Message Sent!</h3>
                <p className="text-green-700">Thank you for reaching out. We'll respond shortly.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input type="text" className="input-field" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input type="email" className="input-field" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <input type="text" className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="input-field resize-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-primary disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
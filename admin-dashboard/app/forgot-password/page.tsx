'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success('Reset link sent to your email');
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark p-4">
      <div className="max-w-md w-full bg-darkCard border border-border rounded-2xl p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold">Forgot Password</h1>
          <p className="text-muted text-sm mt-2">
            {submitted ? 'Check your email for reset link' : 'Enter your email to reset password'}
          </p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="admin@motobus.rw"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-darkInput border border-border rounded-xl text-white placeholder-muted focus:outline-none focus:border-primary mb-6"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-dark font-semibold py-3 rounded-xl transition-all hover:bg-primary-dark disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Link →'}
            </button>
          </form>
        ) : (
          <button
            onClick={() => setSubmitted(false)}
            className="w-full bg-primary text-dark font-semibold py-3 rounded-xl transition-all hover:bg-primary-dark"
          >
            Try Another Email
          </button>
        )}

        <div className="mt-6 text-center">
          <Link href="/login" className="text-muted text-sm hover:text-primary transition">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
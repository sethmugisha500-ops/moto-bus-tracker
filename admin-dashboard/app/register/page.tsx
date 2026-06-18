'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'admin',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'form' | 'otp'>('form');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      toast.error('Please fill all required fields');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    if (!/^\d{10,}$/.test(formData.phone.replace(/\D/g, ''))) {
      toast.error('Please enter a valid phone number');
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const sendOTP = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Simulate API call - replace with actual backend call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In production, call: await api.post('/auth/send-otp', { phone: formData.phone });
      
      setOtpSent(true);
      setStep('otp');
      toast.success(`OTP sent to ${formData.phone}`);
    } catch (error) {
      toast.error('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      // Simulate API call - replace with actual backend call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In production, call: await api.post('/auth/verify-otp', { phone: formData.phone, otp });
      // Then: await api.post('/auth/admin/register', formData);
      
      localStorage.setItem('adminToken', 'demo-token');
      localStorage.setItem('adminUser', JSON.stringify({ 
        name: formData.name, 
        email: formData.email,
        role: formData.role 
      }));
      
      toast.success('Registration successful!');
      router.push('/');
    } catch (error) {
      toast.error('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(`OTP resent to ${formData.phone}`);
    } catch (error) {
      toast.error('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark p-4">
      <div className="max-w-md w-full bg-darkCard border border-border rounded-2xl p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🚲</div>
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-muted text-sm mt-1">
            {step === 'form' ? 'Register as admin user' : 'Verify your phone number'}
          </p>
        </div>

        {step === 'form' ? (
          <>
            {/* Name Field */}
            <div className="mb-4">
              <label className="block text-sm text-muted mb-1">Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full px-4 py-3 bg-darkInput border border-border rounded-xl text-white placeholder-muted focus:outline-none focus:border-primary transition-all"
              />
            </div>

            {/* Email Field */}
            <div className="mb-4">
              <label className="block text-sm text-muted mb-1">Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@example.com"
                className="w-full px-4 py-3 bg-darkInput border border-border rounded-xl text-white placeholder-muted focus:outline-none focus:border-primary transition-all"
              />
            </div>

            {/* Phone Field */}
            <div className="mb-4">
              <label className="block text-sm text-muted mb-1">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+250 788 123 456"
                className="w-full px-4 py-3 bg-darkInput border border-border rounded-xl text-white placeholder-muted focus:outline-none focus:border-primary transition-all"
              />
            </div>

            {/* Role Selection */}
            <div className="mb-4">
              <label className="block text-sm text-muted mb-1">Role *</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-darkInput border border-border rounded-xl text-white focus:outline-none focus:border-primary transition-all"
              >
                <option value="super_admin">Super Admin</option>
                <option value="operations">Operations Admin</option>
                <option value="support">Support Admin</option>
                <option value="finance">Finance Admin</option>
              </select>
            </div>

            {/* Password Field */}
            <div className="mb-4">
              <label className="block text-sm text-muted mb-1">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-darkInput border border-border rounded-xl text-white placeholder-muted focus:outline-none focus:border-primary transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="mb-6">
              <label className="block text-sm text-muted mb-1">Confirm Password *</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-darkInput border border-border rounded-xl text-white placeholder-muted focus:outline-none focus:border-primary transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={sendOTP}
              disabled={loading}
              className="w-full bg-primary text-dark font-semibold py-3 rounded-xl transition-all hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin" />
                  <span>Sending OTP...</span>
                </div>
              ) : (
                'Send OTP →'
              )}
            </button>

            {/* Login Link */}
            <p className="text-center text-muted text-sm mt-6">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </>
        ) : (
          <>
            {/* OTP Field */}
            <div className="text-center mb-6">
              <p className="text-sm text-muted">Enter the 6-digit code sent to</p>
              <p className="text-primary font-semibold mt-1">{formData.phone}</p>
            </div>

            <div className="mb-6">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="w-full px-4 py-4 bg-darkInput border border-border rounded-xl text-white text-center text-2xl tracking-widest placeholder:text-muted placeholder:text-base focus:outline-none focus:border-primary transition-all"
                autoFocus
              />
            </div>

            {/* Verify Button */}
            <button
              onClick={verifyOTP}
              disabled={loading}
              className="w-full bg-primary text-dark font-semibold py-3 rounded-xl transition-all hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin" />
                  <span>Verifying...</span>
                </div>
              ) : (
                'Verify & Register →'
              )}
            </button>

            {/* Resend OTP */}
            <button
              onClick={resendOTP}
              disabled={loading}
              className="w-full text-muted text-sm mt-4 hover:text-primary transition-all"
            >
              Resend Code
            </button>

            {/* Back Button */}
            <button
              onClick={() => {
                setStep('form');
                setOtp('');
              }}
              className="w-full text-muted text-sm mt-2 hover:text-white transition-all"
            >
              ← Back to form
            </button>
          </>
        )}
      </div>
    </div>
  );
}
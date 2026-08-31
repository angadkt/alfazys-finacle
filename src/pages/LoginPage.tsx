import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from '../assets/alfazys-logo-nobg.png';
import { dbService } from '../services/db';
import type { UserRole } from '../services/db';
import { useToast } from '../contexts/ToastContext';

// Helper to generate a random 5-character alphanumeric captcha
const generateRandomCaptcha = (): string => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const toast = useToast();

  // Role and auth states
  const [activeRole, setActiveRole] = useState<UserRole>('staff');
  const [email, setEmail] = useState('user');
  const [password, setPassword] = useState('user');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Captcha states
  const [captchaCode, setCaptchaCode] = useState(() => generateRandomCaptcha());
  const [captchaInput, setCaptchaInput] = useState('');
  const [isRotating, setIsRotating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Draw Captcha on Canvas
  const drawCaptcha = useCallback((text: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    // Light noise background lines
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = `rgba(117, 0, 53, ${0.15 + Math.random() * 0.2})`;
      ctx.lineWidth = 1 + Math.random() * 1.5;
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.bezierCurveTo(
        Math.random() * width, Math.random() * height,
        Math.random() * width, Math.random() * height,
        Math.random() * width, Math.random() * height
      );
      ctx.stroke();
    }

    // Strike-through line
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(4, height / 2 + (Math.random() * 6 - 3));
    ctx.lineTo(width - 4, height / 2 + (Math.random() * 6 - 3));
    ctx.stroke();

    // Characters
    const charArray = text.split('');
    const startX = 8;
    const spacing = (width - 16) / charArray.length;

    charArray.forEach((char, index) => {
      ctx.save();
      const x = startX + index * spacing + spacing / 2;
      const y = height / 2 + 5 + (Math.random() * 4 - 2);
      const angle = (Math.random() - 0.5) * 0.4;

      ctx.translate(x, y);
      ctx.rotate(angle);

      ctx.font = 'bold 18px "Courier New", Courier, monospace, sans-serif';
      ctx.fillStyle = index % 2 === 0 ? '#0f172a' : '#1e293b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(char, 0, 0);
      ctx.restore();
    });
  }, []);

  const refreshCaptcha = () => {
    setIsRotating(true);
    const newCode = generateRandomCaptcha();
    setCaptchaCode(newCode);
    setCaptchaInput('');
    setTimeout(() => setIsRotating(false), 500);
  };

  useEffect(() => {
    drawCaptcha(captchaCode);
  }, [captchaCode, drawCaptcha]);

  const playAudioCaptcha = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const letters = captchaCode.split('').join('. ');
      const utterance = new SpeechSynthesisUtterance(`Captcha is: ${letters}`);
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    } else {
      toast.error('Text-to-speech not supported in this browser.');
    }
  };

  const handleRoleChange = (role: UserRole) => {
    setActiveRole(role);
    setError('');
    if (role === 'staff') {
      setEmail('user');
      setPassword('user');
    } else if (role === 'agent') {
      setEmail('agent');
      setPassword('agent');
    } else if (role === 'super_admin') {
      setEmail('admin');
      setPassword('admin');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your Email or User ID.');
      toast.error('Please enter your Email or User ID.');
      return;
    }

    if (!password) {
      setError('Please enter your Password.');
      toast.error('Please enter your Password.');
      return;
    }

    if (!captchaInput.trim()) {
      setError('Please enter the Captcha code.');
      toast.error('Please enter the Captcha code.');
      return;
    }

    if (captchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setError('Invalid Captcha code. Please try again.');
      toast.error('Invalid Captcha code. Please try again.');
      refreshCaptcha();
      return;
    }

    const trimmedUser = email.toLowerCase().trim();
    const trimmedPass = password.toLowerCase().trim();

    let resolvedRole: UserRole | null = null;

    if (trimmedUser === 'admin' && (trimmedPass === 'admin' || trimmedPass === '••••••••••••')) {
      resolvedRole = 'super_admin';
    } else if (trimmedUser === 'user' && (trimmedPass === 'user' || trimmedPass === '••••••••••••')) {
      resolvedRole = 'staff';
    } else if (trimmedUser === 'agent' && (trimmedPass === 'agent' || trimmedPass === '••••••••••••')) {
      resolvedRole = 'agent';
    } else if (trimmedUser === 'david.miller@finacle.io' && (trimmedPass === '••••••••••••' || trimmedPass === 'user')) {
      resolvedRole = 'staff';
    } else if (trimmedUser === 'marcus.vance@finacle.io' && (trimmedPass === '••••••••••••' || trimmedPass === 'agent')) {
      resolvedRole = 'agent';
    } else if (trimmedUser === 'sarah.alfayed@finacle.io' && (trimmedPass === '••••••••••••' || trimmedPass === 'admin')) {
      resolvedRole = 'super_admin';
    }

    if (!resolvedRole) {
      setError('Invalid Email or Password.');
      toast.error('Invalid Email or Password. Please try again.');
      refreshCaptcha();
      return;
    }

    setLoading(true);
    dbService.setUserRole(resolvedRole);

    const loginTimeStr = new Date().toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    localStorage.setItem('infazys_finacle_login_time', loginTimeStr);

    setTimeout(() => {
      setLoading(false);
      toast.success(`Welcome back, ${resolvedRole === 'super_admin' ? 'Administrator' : resolvedRole === 'staff' ? 'Staff Member' : 'Field Agent'}!`);
      navigate('/dashboard');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#750035] flex flex-col items-center justify-center p-4 antialiased selection:bg-white/20 selection:text-white relative">
      
      {/* Top Left Home Button */}
      <button
        type="button"
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 text-white/80 hover:text-white flex items-center gap-2 text-xs font-bold bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-xl transition cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        <span>Back to Home</span>
      </button>

      {/* Brand Logo Header */}
      <div className="flex flex-col items-center justify-center mb-6 select-none animate-in fade-in duration-300">
        <img
          src={logoImg}
          alt="Infazys Finacle"
          className="h-16 w-16 object-contain drop-shadow-md mb-2"
        />
        <span className="text-white text-lg font-black tracking-wider uppercase font-montserrat">
          Infazys Finacle
        </span>
        <span className="text-white/70 text-[10px] font-bold tracking-widest uppercase">
          Core Banking Platform
        </span>
      </div>

      {/* Main Login Card matching the exact screenshot */}
      <div className="w-full max-w-[420px] bg-white rounded-3xl shadow-2xl p-7 sm:p-9 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Title and Accent Bar */}
        <div className="flex flex-col text-left gap-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-montserrat">
            Sign In
          </h1>
          <div className="w-12 h-1 bg-[#750035] rounded-full"></div>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2">
            <svg className="w-4 h-4 text-rose-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Email / Username Field */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-xs font-bold text-slate-700">
              Email
            </label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email or username"
              className="w-full bg-white text-slate-800 text-sm font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#750035] focus:ring-1 focus:ring-[#750035] transition"
            />
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-xs font-bold text-slate-700">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-white text-slate-800 text-sm font-medium px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 focus:outline-none focus:border-[#750035] focus:ring-1 focus:ring-[#750035] transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? (
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.822 7.822L21 21m-2.228-2.228l-3.65-3.65m-7.822-7.822a9.013 9.013 0 0 0-2.73 2.73m7.822 7.822a9.005 9.005 0 0 1-4.606-2.607m0 0a9.001 9.001 0 0 1-2.73-2.73" />
                  </svg>
                ) : (
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.644 10.548 10.548 0 0 1 19.053 0c.414.836.414 1.84 0 2.684a10.547 10.547 0 0 1-19.053 0z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Captcha Section */}
          <div className="flex flex-col gap-1.5 text-left">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Captcha
              </label>
              <button
                type="button"
                onClick={playAudioCaptcha}
                className="text-[11px] text-[#750035] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.414 0-.75-.336-.75-.75V8.999c0-.414.336-.75.75-.75h2.24Z" />
                </svg>
                <span>Listen Audio</span>
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <input
                type="text"
                required
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                placeholder="Enter captcha"
                className="w-full bg-white text-slate-800 text-sm font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#750035] focus:ring-1 focus:ring-[#750035] transition"
              />

              <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                <canvas
                  ref={canvasRef}
                  width={110}
                  height={32}
                  className="w-full h-8 rounded select-none cursor-pointer"
                  onClick={refreshCaptcha}
                  title="Click to refresh captcha"
                />
                <button
                  type="button"
                  onClick={refreshCaptcha}
                  title="Refresh Captcha"
                  className="p-1 hover:bg-slate-200/70 rounded-lg text-slate-600 transition flex-shrink-0 cursor-pointer"
                >
                  <svg
                    className={`w-4 h-4 ${isRotating ? 'animate-spin' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Forgot Password Row */}
          <div className="flex items-center justify-end text-xs pt-1 select-none">
            <button
              type="button"
              onClick={() => toast.info('Please contact the branch administrator to reset your password.')}
              className="text-[#750035] hover:underline font-bold cursor-pointer"
            >
              Forgot password?
            </button>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#750035] hover:bg-[#60012c] text-white font-bold py-3 px-4 rounded-xl text-sm transition shadow-md hover:shadow-lg cursor-pointer disabled:opacity-75 mt-2 font-montserrat uppercase tracking-wider"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

        </form>

        {/* Register Account & Role Switch Links */}
        <div className="flex flex-col items-center justify-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100 select-none">
          <div className="flex items-center gap-1.5">
            <span>Don't have an account?</span>
            <button
              type="button"
              onClick={() => {
                navigate('/customers/new');
                toast.info('Redirecting to Customer Registration.');
              }}
              className="text-[#750035] font-bold hover:underline cursor-pointer"
            >
              Register
            </button>
          </div>

          {/* Bottom Role Switch text links */}
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#750035] pt-0.5">
            {activeRole === 'staff' ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    handleRoleChange('agent');
                    toast.info('Switched to Field Agent login');
                  }}
                  className="hover:underline cursor-pointer text-slate-600 hover:text-[#750035]"
                >
                  Login as Agent
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => {
                    handleRoleChange('super_admin');
                    toast.info('Switched to Administrator login');
                  }}
                  className="hover:underline cursor-pointer text-slate-600 hover:text-[#750035]"
                >
                  Login as Admin
                </button>
              </>
            ) : activeRole === 'agent' ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    handleRoleChange('staff');
                    toast.info('Switched to Staff login');
                  }}
                  className="hover:underline cursor-pointer text-slate-600 hover:text-[#750035]"
                >
                  Login as Staff
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => {
                    handleRoleChange('super_admin');
                    toast.info('Switched to Administrator login');
                  }}
                  className="hover:underline cursor-pointer text-slate-600 hover:text-[#750035]"
                >
                  Login as Admin
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    handleRoleChange('staff');
                    toast.info('Switched to Staff login');
                  }}
                  className="hover:underline cursor-pointer text-slate-600 hover:text-[#750035]"
                >
                  Login as Staff
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => {
                    handleRoleChange('agent');
                    toast.info('Switched to Field Agent login');
                  }}
                  className="hover:underline cursor-pointer text-slate-600 hover:text-[#750035]"
                >
                  Login as Agent
                </button>
              </>
            )}
          </div>
        </div>

      </div>

      {/* Subtle Bottom System Disclaimer */}
      <div className="text-[10px] text-white/50 mt-6 text-center select-none">
        Infazys Finacle Banking Gateway • Secured by 256-Bit SSL Encryption
      </div>

    </div>
  );
}

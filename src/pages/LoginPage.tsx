import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from '../assets/alfazys-logo-nobg.png';
import { dbService } from '../services/db';
import type { UserRole } from '../services/db';
import { useToast } from '../contexts/ToastContext';

// Custom inline SVG icons matching design mockup
const ArrowLeftIcon = () => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
 <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
 </svg>
);

const UserOutlineIcon = () => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
 <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
 </svg>
);

const UserOutlineIconBlue = () => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-blue-600">
 <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
 </svg>
);

const EmailIconBlue = () => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
 <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
 </svg>
);

const LockIconBlue = () => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
 <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
 </svg>
);

const ShieldIconBanner = () => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
 <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
 </svg>
);

const ShieldIconMini = () => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
 <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
 </svg>
);

const EyeIcon = () => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
 <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.644 10.548 10.548 0 0 1 19.053 0c.414.836.414 1.84 0 2.684a10.547 10.547 0 0 1-19.053 0z" />
 <circle cx="12" cy="12" r="3" />
 </svg>
);

const EyeSlashIcon = () => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
 <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.822 7.822L21 21m-2.228-2.228l-3.65-3.65m-7.822-7.822a9.013 9.013 0 0 0-2.73 2.73m7.822 7.822a9.005 9.005 0 0 1-4.606-2.607m0 0a9.001 9.001 0 0 1-2.73-2.73" />
 </svg>
);

const ButtonShieldIcon = () => (
 <div className="w-7 h-7 bg-white/20 flex items-center justify-center text-white mr-2.5 flex-shrink-0">
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
 <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
 </svg>
 </div>
);

export default function LoginPage() {
  const [activeRole, setActiveRole] = useState<UserRole>('staff');
  const [email, setEmail] = useState('user');
  const [password, setPassword] = useState('user');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

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
   
   if (!email) {
     setError('Please enter your financial identifier or username.');
     toast.error('Please enter your financial identifier or username.');
     return;
   }

    const trimmedEmail = email.toLowerCase().trim();
    const trimmedPass = password.toLowerCase().trim();

    let resolvedRole: UserRole | null = null;

    // Verify credentials strictly
    if (trimmedEmail === 'admin' && (trimmedPass === 'admin' || trimmedPass === '••••••••••••')) {
      resolvedRole = 'super_admin';
    } else if (trimmedEmail === 'user' && (trimmedPass === 'user' || trimmedPass === '••••••••••••')) {
      resolvedRole = 'staff';
    } else if (trimmedEmail === 'agent' && (trimmedPass === 'agent' || trimmedPass === '••••••••••••')) {
      resolvedRole = 'agent';
    } else if (trimmedEmail === 'david.miller@finacle.io' && (trimmedPass === '••••••••••••' || trimmedPass === 'user')) {
      resolvedRole = 'staff';
    } else if (trimmedEmail === 'marcus.vance@finacle.io' && (trimmedPass === '••••••••••••' || trimmedPass === 'agent')) {
      resolvedRole = 'agent';
    }

    if (!resolvedRole) {
      setError('Invalid username or password.');
      toast.error('Invalid username or password. Please try again.');
      return;
    }
    
    setLoading(true);
    dbService.setUserRole(resolvedRole);
   
   // Store current login time
   const loginTimeStr = new Date().toLocaleString(undefined, { 
     month: 'short', 
     day: 'numeric', 
     hour: '2-digit', 
     minute: '2-digit' 
   });
   localStorage.setItem('infazys_finacle_login_time', loginTimeStr);
   
   // Simulate a secure network auth delay
   setTimeout(() => {
     setLoading(false);
     toast.success(`Welcome back, ${resolvedRole === 'super_admin' ? 'Administrator' : resolvedRole === 'staff' ? 'Staff Member' : 'Agent'}!`);
     navigate('/dashboard');
   }, 1200);
 };

 return (
 <div className="min-h-screen bg-gradient-to-tr from-[#b4d2ff] via-[#dbeafe]/70 to-[#e2e8f0]/30 text-slate-900 flex flex-col justify-center items-center p-4 md:p-8 py-16 antialiased relative selection:bg-[#9e0248]/10 selection:text-[#9e0248] overflow-x-hidden overflow-y-auto">
 
 {/* Background patterns */}
 <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(30,144,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(30,144,255,0.06)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0"></div>
 
 {/* Wave shape gradient decorations on the viewport background */}
 <div className="absolute top-0 right-0 w-[55%] h-[55%] bg-[#004de3]/5 blur-3xl pointer-events-none"></div>
 <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-[#9e0248]/5 blur-3xl pointer-events-none"></div>

 {/* Back to Home Navigation Button */}
 <button 
 onClick={() => navigate('/')}
 className="absolute top-6 left-6 inline-flex items-center gap-2.5 text-xs font-bold text-slate-700 hover:text-rose-600 bg-white border border-slate-200/80 hover:border-rose-300 px-5 py-2.5 shadow-sm hover:shadow transition duration-200 cursor-pointer z-50 select-none"
 >
 <span className="text-rose-600"><ArrowLeftIcon /></span>
 Back to Home
 </button>

 {/* Large Two-Column Login Card Container */}
 <div className="w-full max-w-5xl bg-white ] border border-slate-200/60 shadow-[0_20px_50px_rgba(0,0,0,0.08)] overflow-hidden grid grid-cols-1 md:grid-cols-2 relative z-10">
 
 {/* LEFT COLUMN: BRANDING PANEL */}
 <div className="p-8 md:p-12 bg-gradient-to-b from-[#004de3] via-[#053aa6] to-[#012573] border-b md:border-b-0 md:border-r border-slate-200/60 flex flex-col justify-between min-h-[500px] md:min-h-[580px] relative overflow-hidden text-white">
 
 {/* White Dot Grid Overlay */}
 <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1.2px,transparent_1.2px)] bg-[size:18px_18px] opacity-15 pointer-events-none"></div>

 {/* Logo, Name and Subtitle group */}
 <div className="space-y-6 relative z-10 select-none">
 <img 
 src={logoImg} 
 alt="Infazys Finacle Logo" 
 className="h-20 w-20 object-contain select-none animate-[fadeIn_0.5s_ease-out]"
 />
 
 <div className="space-y-1.5">
 <h2 className="text-2xl font-black tracking-tight leading-none">
 <span>INFAZYS </span>
 <span className="text-rose-500">FINACLE</span>
 </h2>
 <p className="text-[10px] font-bold tracking-[0.2em] text-white/70 uppercase block pt-0.5">
 Secure Gateway
 </p>
 </div>
 
 <div className="space-y-3.5">
 <p className="text-white/80 text-sm leading-relaxed max-w-sm font-medium">
 Secure access to your financial management platform.
 </p>
 <p className="text-white/80 text-sm leading-relaxed max-w-sm font-medium">
 Your data is protected with enterprise-grade security.
 </p>
 </div>
 </div>

 {/* Illuminated Pedestal base & glowing shield SVG graphic illustration */}
 <div className="w-full relative flex items-center justify-center z-10 py-2">
 <svg viewBox="0 0 300 220" className="w-full max-w-[280px] mx-auto select-none">
 <defs>
 <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
 <feGaussianBlur stdDeviation="6" result="blur" />
 <feComposite in="SourceGraphic" in2="blur" operator="over" />
 </filter>
 <filter id="glow-strong" x="-30%" y="-30%" width="160%" height="160%">
 <feGaussianBlur stdDeviation="10" result="blur" />
 <feComposite in="SourceGraphic" in2="blur" operator="over" />
 </filter>
 <linearGradient id="pedestalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
 <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
 <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.2" />
 </linearGradient>
 <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
 <stop offset="0%" stopColor="#3b82f6" />
 <stop offset="100%" stopColor="#1d4ed8" />
 </linearGradient>
 </defs>

 {/* Dotted Lines */}
 <path d="M 150 120 L 220 70" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.6" />
 <path d="M 150 120 L 70 80" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.6" />
 <path d="M 150 120 L 80 150" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.6" />
 <path d="M 150 120 L 230 140" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.6" />

 {/* Float circles */}
 <g transform="translate(220, 70)">
 <circle cx="0" cy="0" r="14" fill="#003fb0" stroke="#60a5fa" strokeWidth="1.5" filter="url(#glow)" />
 <path d="M -5 -2 L -1 2 L 5 -4" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
 </g>

 <g transform="translate(70, 80)">
 <circle cx="0" cy="0" r="14" fill="#003fb0" stroke="#60a5fa" strokeWidth="1.5" filter="url(#glow)" />
 <rect x="-6" y="-2" width="2" height="6" fill="white" />
 <rect x="-2" y="-5" width="2" height="9" fill="white" />
 <rect x="2" y="-8" width="2" height="12" fill="white" />
 </g>

 <g transform="translate(80, 150)">
 <circle cx="0" cy="0" r="14" fill="#003fb0" stroke="#60a5fa" strokeWidth="1.5" filter="url(#glow)" />
 <rect x="-6" y="-4" width="12" height="8" rx="1" fill="none" stroke="white" strokeWidth="1.2" />
 <line x1="-6" y1="-1" x2="6" y2="-1" stroke="white" strokeWidth="1.2" />
 </g>

 <g transform="translate(230, 140)">
 <circle cx="0" cy="0" r="14" fill="#003fb0" stroke="#60a5fa" strokeWidth="1.5" filter="url(#glow)" />
 <rect x="-5" y="-6" width="10" height="12" rx="1" fill="none" stroke="white" strokeWidth="1.2" />
 <line x1="-2" y1="-2" x2="2" y2="-2" stroke="white" strokeWidth="1.2" />
 <line x1="-2" y1="1" x2="2" y2="1" stroke="white" strokeWidth="1.2" />
 </g>

 <ellipse cx="150" cy="165" rx="55" ry="16" fill="none" stroke="#2563eb" strokeWidth="2.5" opacity="0.4" />
 <ellipse cx="150" cy="160" rx="45" ry="12" fill="none" stroke="#60a5fa" strokeWidth="2" opacity="0.6" />
 <ellipse cx="150" cy="155" rx="35" ry="10" fill="url(#pedestalGrad)" stroke="#60a5fa" strokeWidth="2.5" filter="url(#glow)" />
 <ellipse cx="150" cy="154" rx="20" ry="6" fill="#60a5fa" opacity="0.8" filter="url(#glow-strong)" />

 {/* Glowing Shield + padlock outline */}
 <g transform="translate(150, 115) scale(0.9)">
 <path d="M-28 -35 L28 -35 C28 -35 32 5 0 35 C-32 5 -28 -35 -28 -35 Z" fill="url(#shieldGrad)" stroke="#ffffff" strokeWidth="3" filter="url(#glow)" />
 <path d="M-22 -30 L22 -30 C22 -30 25 5 0 28 C-25 5 -22 -30 -22 -30 Z" fill="none" stroke="#60a5fa" strokeWidth="1.5" opacity="0.6" />
 <rect x="-10" y="-4" width="20" height="16" rx="2" fill="white" />
 <path d="M-6 -4 V-10 A6 6 0 0 1 6 -10 V-4" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" />
 <circle cx="0" cy="3" r="2" fill="#1d4ed8" />
 <path d="M0 5 V8" stroke="#1d4ed8" strokeWidth="1.5" strokeLinecap="round" />
 </g>
 </svg>
 </div>

 {/* Curved Crimson wave banner at the very bottom */}
 <div className="absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none opacity-95 h-36 z-0">
 <svg viewBox="0 0 400 120" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
 <path d="M-20 120 C 100 65, 220 110, 420 50 L 420 120 L -20 120 Z" fill="#9e0248" />
 <path d="M-20 90 C 120 40, 240 85, 420 60" stroke="#3b82f6" strokeWidth="2.5" opacity="0.4" />
 </svg>
 </div>

 </div>

 {/* RIGHT COLUMN: LOGIN FORM PANEL */}
 <div className="p-8 md:p-12 flex flex-col justify-center space-y-6 relative z-10 bg-white">
 
 {/* Blue Secure authorized environment notice banner */}
 <div className="bg-[#eff6ff] border border-[#dbeafe] p-4 flex gap-3.5 items-start animate-[fadeIn_0.4s_ease-out]">
 <div className="w-10 h-10 bg-[#004de3] flex items-center justify-center flex-shrink-0 text-white shadow-sm">
 <ShieldIconBanner />
 </div>
 <div className="flex-1">
 <span className="text-xs font-bold text-blue-900 block leading-tight">Demo Environment Authorized</span>
  <span className="text-[10px] text-blue-700 block mt-1 leading-relaxed">
  Use pre-loaded credentials to access the simulated{' '}
  <strong className="font-bold">
  {activeRole === 'staff' 
    ? "user (Operations Staff)" 
    : activeRole === 'agent' 
    ? "agent (Field Agent)" 
    : "admin (Super Administrator)"}
  </strong>{' '}
  checking records.
  </span>
 </div>
 </div>

 {/* Login Error Notification */}
 {error && (
 <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-xs font-medium">
 {error}
 </div>
 )}

 {/* Form container */}
 <form onSubmit={handleSubmit} className="space-y-5">
 
 {/* Selected Active Access Level Label & button */}
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block text-left">Select Access Level</label>
 <div className="w-full bg-[#004de3] text-white py-3 px-4 flex items-center justify-center gap-2.5 font-bold shadow-md shadow-blue-500/10 select-none cursor-default">
 <UserOutlineIcon />
 <span>{activeRole === 'staff' ? 'Staff' : activeRole === 'agent' ? 'Agent' : 'Administrator'}</span>
 </div>
 </div>

 {/* Email Input Field */}
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block text-left">Email Address or Username</label>
 <div className="relative w-full">
 <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-blue-500 pointer-events-none">
 <EmailIconBlue />
 </span>
 <input 
 type="text"
 required
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 placeholder="name@company.com"
 className="w-full bg-[#f0f4fd] border border-transparent focus:border-blue-400 focus:bg-white pl-11 pr-4 py-3 text-sm text-slate-800 focus:outline-none transition font-semibold"
 />
 </div>
 </div>

 {/* Password Input Field with Forgot link */}
 <div className="space-y-2">
 <div className="flex justify-between items-center">
 <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Security Password</label>
 <a href="#forgot" className="text-xs font-bold text-blue-600 hover:text-blue-800 transition">
 Forgot?
 </a>
 </div>
 <div className="relative w-full">
 <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-blue-500 pointer-events-none">
 <LockIconBlue />
 </span>
 <input 
 type={showPassword ? "text" : "password"}
 required
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 className="w-full bg-[#f0f4fd] border border-transparent focus:border-blue-400 focus:bg-white pl-11 pr-11 py-3 text-sm text-slate-800 focus:outline-none transition font-semibold"
 />
 <button
 type="button"
 onClick={() => setShowPassword(!showPassword)}
 className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
 >
 {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
 </button>
 </div>
 </div>

 {/* Remember device checkbox */}
 <div className="flex items-center">
 <input 
 id="remember-device" 
 type="checkbox" 
 checked={rememberMe}
 onChange={() => setRememberMe(!rememberMe)}
 className="h-4 w-4 text-[#004de3] accent-[#004de3] border-slate-200 focus:ring-blue-500 cursor-pointer" 
 />
 <label htmlFor="remember-device" className="ml-2.5 text-xs text-slate-500 font-semibold select-none cursor-pointer">
 Remember this device for 30 days
 </label>
 </div>

 {/* Submit Action Button */}
 <button
 type="submit"
 disabled={loading}
 className="w-full bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-800 hover:to-indigo-700 text-white py-3 text-sm font-bold shadow-lg shadow-blue-600/10 hover:shadow-blue-600/25 transition flex items-center justify-between px-3 cursor-pointer disabled:opacity-85"
 >
 <div className="flex items-center">
 <ButtonShieldIcon />
 <span>{loading ? "Authorizing Security..." : "Sign In to Infazys Finacle"}</span>
 </div>
 <span className="text-white/80 font-bold">&rarr;</span>
 </button>

 </form>

 {/* OR Separator line */}
 <div className="relative flex py-1 items-center">
 <div className="flex-grow border-t border-slate-200/80"></div>
 <span className="flex-shrink mx-4 text-xs font-bold text-slate-400 tracking-wider">OR</span>
 <div className="flex-grow border-t border-slate-200/80"></div>
 </div>

 {/* Switch active role segment */}
 <button
 type="button"
 onClick={() => handleRoleChange(activeRole === 'staff' ? 'agent' : activeRole === 'agent' ? 'super_admin' : 'staff')}
 className="w-full text-blue-600 hover:text-blue-700 hover:underline transition flex items-center justify-center gap-2 cursor-pointer py-1 font-bold text-sm"
 >
 <UserOutlineIconBlue />
 <span>Click here to login as {activeRole === 'staff' ? 'Agent' : activeRole === 'agent' ? 'Administrator' : 'Staff'}</span>
 </button>

 {/* Security Monitored Muted Footer */}
 <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1.5 mt-2 select-none">
 <span className="text-blue-500"><ShieldIconMini /></span>
 <span>System monitored under security sandbox. Unauthorized connections logged.</span>
 </div>

 </div>

 </div>

 </div>
 );
}

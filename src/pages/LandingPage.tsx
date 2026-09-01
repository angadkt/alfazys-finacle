import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from '../assets/alfazys-logo-nobg.png';

// Inline SVG Icons for clean design
const ArrowRightIcon = () => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
 <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
 </svg>
);

const MenuIcon = () => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
 <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
 </svg>
);

const CloseIcon = () => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
 <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
 </svg>
);



export default function LandingPage() {
 const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
 const navigate = useNavigate();

 return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col antialiased relative selection:bg-[#9e0248]/10 selection:text-[#9e0248] overflow-x-hidden">
      
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-60"></div>
      
      {/* Soft gradient glows derived from brand color */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#9e0248]/5 blur-3xl pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-10%] w-[45%] h-[45%] bg-[#9e0248]/5 blur-3xl pointer-events-none"></div>

      {/* Header / Navbar */}
      <header className="relative z-50 border-b border-[#9e0248]/20 bg-[#9e0248] shadow-md shadow-[#9e0248]/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 select-none animate-[fadeIn_0.6s_ease-out]">
            <img 
              src={logoImg} 
              alt="Infazys Finacle Logo" 
              className="h-14 w-14 object-contain"
            />
            <div className="flex flex-col">
              <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-400 bg-clip-text text-transparent leading-none">
                INFAZYS
              </span>
              <span className="text-[10px] font-bold tracking-widest bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-400 bg-clip-text text-transparent block mt-0.5 uppercase">
                FINACLE
              </span>
            </div>
          </div>

          {/* Desktop Navigation Link Items */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/85">
            <a href="#about" className="hover:text-white transition">About</a>
            <a href="#solutions" className="hover:text-white transition">Solutions</a>
            <a href="#contact" className="hover:text-white transition">Contact</a>
          </nav>

          {/* Desktop Login Button */}
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="px-5 py-2.5 bg-white hover:bg-slate-50 text-[#9e0248] text-sm font-bold transition shadow-md hover:shadow-lg cursor-pointer"
            >
              Login
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white hover:text-white/80 p-2 focus:outline-none cursor-pointer"
            >
              {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>

        </div>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white/95 backdrop-blur-md absolute top-20 left-0 w-full z-40 py-6 px-4 space-y-4 shadow-xl">
            <nav className="flex flex-col space-y-3 font-semibold text-slate-700">
              <a 
                href="#about" 
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 hover:bg-slate-50 hover:text-[#9e0248] transition"
              >
                About
              </a>
              <a 
                href="#solutions" 
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 hover:bg-slate-50 hover:text-[#9e0248] transition"
              >
                Solutions
              </a>
              <a 
                href="#contact" 
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 hover:bg-slate-50 hover:text-[#9e0248] transition"
              >
                Contact
              </a>
            </nav>
            <div className="border-t border-slate-100 pt-4">
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/login');
                }}
                className="w-full text-center px-4 py-3 bg-[#9e0248] hover:bg-[#85023d] text-white font-bold transition shadow-sm cursor-pointer"
              >
                Login
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col justify-center items-center max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10 select-none py-10 sm:py-14">
        
        {/* Center Logo */}
        <div className="mb-6 select-none animate-[fadeIn_0.5s_ease-out]">
          <img 
            src={logoImg} 
            alt="Infazys Finacle Logo Center" 
            className="h-44 w-44 sm:h-56 sm:w-56 md:h-60 md:w-60 object-contain mx-auto"
          />
        </div>

        {/* Brand Banner Badge */}
        <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 bg-[#9e0248]/5 border border-[#9e0248]/10 text-xs font-semibold tracking-wider text-[#9e0248] uppercase animate-[fadeIn_0.5s_ease-out]">
          <span className="w-1.5 h-1.5 bg-[#9e0248] animate-pulse"></span>
          Introducing INFAZYS FINACLE
        </div>

        {/* Hero Title */}
        <div className="max-w-4xl space-y-4">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.1] animate-[slideUp_0.7s_ease-out]">
            Smarter Finance.<br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-slate-900 to-[#9e0248] bg-clip-text text-transparent">
              Simpler Business.
            </span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 font-medium leading-relaxed pt-2 opacity-0 animate-[fadeIn_0.8s_ease-out_0.2s_forwards]">
            Powerful financial solutions designed to help businesses manage, grow, and move forward with confidence.
          </p>
        </div>

        {/* CTA Actions */}
        <div className="mt-8 sm:mt-10 flex justify-center items-center w-full opacity-0 animate-[fadeIn_0.8s_ease-out_0.4s_forwards]">
          <button 
            onClick={() => navigate('/login')}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-[#9e0248] hover:bg-[#85023d] text-white text-base font-bold shadow-lg shadow-[#9e0248]/20 hover:shadow-[#9e0248]/35 border border-[#9e0248]/20 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
          >
            <span>Login to Portal</span>
            <ArrowRightIcon />
          </button>
        </div>

      </section>

 {/* Simple elegant inline footer */}
 <footer className="relative z-10 w-full text-center pb-8 pt-4 border-t border-slate-200/40 text-xs text-slate-500 font-medium bg-white/40 backdrop-blur-sm">
 <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
 <div className="flex items-center gap-2">
 <img src={logoImg} alt="Infazys Finacle Logo" className="h-5 w-5 object-contain" />
 <span className="font-bold text-slate-700">Infazys Finacle</span>
 </div>
 <div className="flex gap-4">
 <a href="#privacy" className="hover:text-slate-800 transition">Privacy</a>
 <a href="#terms" className="hover:text-slate-800 transition">Terms</a>
 <a href="#support" className="hover:text-slate-800 transition">Support</a>
 </div>
 <p>&copy; {new Date().getFullYear()} Infazys Finacle. All rights reserved.</p>
 </div>
 </footer>

 {/* Animation Injector */}
 <style>{`
 @keyframes fadeIn {
 from { opacity: 0; }
 to { opacity: 1; }
 }
 @keyframes slideUp {
 from {
 opacity: 0;
 transform: translateY(20px);
 }
 to {
 opacity: 1;
 transform: translateY(0);
 }
 }
 `}</style>

 </div>
 );
}

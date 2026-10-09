import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import logoImg from '../assets/alfazys-logo-nobg.png';
import finacleLogo from '../assets/finacle-logo.png';
import type { UserRole } from '../services/db';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const toast = useToast();

  // Role and auth states
  const [email, setEmail] = useState('user');
  const [password, setPassword] = useState('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRoleChange = (role: UserRole) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
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

    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email: email.toLowerCase().trim(),
        password: password.trim()
      });

      // Assuming API returns { token, role }
      const { token, role } = response.data;
      
      // Store token for axios
      localStorage.setItem('infazys_token', token);
      
      // We still use active_role for frontend components that rely on it synchronously
      const resolvedRole = role || 'staff'; 
      localStorage.setItem('infazys_finacle_active_role', resolvedRole);

      const loginTimeStr = new Date().toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      localStorage.setItem('infazys_finacle_login_time', loginTimeStr);

      toast.success(`Welcome back!`);
      navigate('/solutions');

    } catch (err: any) {
      setError('Invalid Email or Password.');
      toast.error(err.response?.data?.message || 'Invalid Email or Password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 antialiased select-none">
      
      {/* Outer Border Box */}
      <div className="w-full max-w-4xl aspect-[1.5/1] bg-[#fdfdfd] border border-slate-400 shadow-2xl relative overflow-hidden flex flex-col">
        
        {/* Top Header */}
        <div className="flex justify-between items-start p-8">
          <div className="text-[22px] font-bold text-[#9c0f3d] tracking-wide mt-2" style={{fontFamily: 'Arial, Helvetica, sans-serif'}}>
            Department Of AL Faz Group
          </div>
          <div className="flex items-center pr-4 gap-1">
            <img src={finacleLogo} alt="Logo" className="w-[40px] h-[40px] object-contain drop-shadow-sm -mt-5 -ml-2" />
            <div className="flex flex-col mt-1">
              <span className="text-[34px] font-normal text-[#333333] tracking-tight leading-none" style={{fontFamily: 'Arial, Helvetica, sans-serif'}}>
                Finacle<sup className="text-sm">®</sup>
              </span>
              <span className="text-[9px] font-semibold text-[#666666] tracking-[0.3em] uppercase mt-1 ml-0.5">
                Transforming Banking
              </span>
            </div>
          </div>
        </div>


        {/* Center Content */}
        <div className="flex-1 flex flex-col items-center justify-center -mt-12 z-10">
          
          <h2 className="text-[22px] text-[#444444] font-bold mb-16" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            Universal Payment Solution From Infazys
          </h2>

          <div className="relative w-full max-w-md flex flex-col items-center pl-12 z-0">
            
            {/* Faded Watermark Logo aligned to the left of the inputs */}
            <img 
              src={logoImg} 
              className="absolute -left-[180px] -top-[60px] w-[260px] h-[260px] opacity-[0.15] object-contain pointer-events-none -z-10" 
              alt="Watermark" 
            />

            {/* Error Message */}
            {error && (
              <div className="absolute -top-8 w-full text-center text-red-600 text-sm font-bold font-sans">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
              
              {/* User ID */}
              <div className="flex items-center justify-center w-full">
                <label className="font-bold text-[15px] text-[#222222] mr-4 w-[75px] text-right" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  User ID
                </label>
                <input 
                  type="text" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-[240px] h-[30px] border border-[#888888] px-2 bg-white focus:outline-none text-sm text-[#111111]"
                  style={{ fontFamily: 'Arial, sans-serif' }}
                  required
                />
                {/* Spacer to align with the login button below */}
                <div className="w-[70px] ml-2 shrink-0"></div>
              </div>

              {/* Password */}
              <div className="flex items-center justify-center w-full">
                <label className="font-bold text-[15px] text-[#222222] mr-4 w-[75px] text-right" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  Password
                </label>
                <div className="relative w-[240px]">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-[30px] border border-[#888888] pl-2 pr-8 bg-white focus:outline-none text-sm text-[#111111]"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                    required
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-[70px] h-[28px] ml-2 shrink-0 bg-[#f0f0f0] border border-[#888888] text-[#111111] text-[13px] hover:bg-[#e4e4e4] active:bg-[#d0d0d0] cursor-pointer shadow-[1px_1px_2px_rgba(0,0,0,0.1)] flex items-center justify-center"
                  style={{ fontFamily: 'Arial, sans-serif' }}
                >
                  {loading ? '...' : 'Login'}
                </button>
              </div>

            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 w-full text-center text-[12px] text-[#666666]" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
          Copyright © 2007-2008 Infosys Limited. All rights reserved. <a href="#" className="text-[#444444] underline font-medium">www.finacle.com</a>
        </div>

        {/* Hidden Role Switchers (for testing without breaking the design) */}
        <div className="absolute bottom-2 right-2 flex gap-3 text-[10px] text-slate-300 opacity-20 hover:opacity-100 transition font-sans">
           <span onClick={() => handleRoleChange('staff')} className="cursor-pointer hover:text-slate-600">Staff</span>
           <span onClick={() => handleRoleChange('agent')} className="cursor-pointer hover:text-slate-600">Agent</span>
           <span onClick={() => handleRoleChange('super_admin')} className="cursor-pointer hover:text-slate-600">Admin</span>
        </div>
      </div>
    </div>
  );
}

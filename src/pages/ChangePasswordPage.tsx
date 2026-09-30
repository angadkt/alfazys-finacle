import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from '../assets/alfazys-logo-nobg.png';
import { useToast } from '../contexts/ToastContext';
import Header from '../components/Header';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const toast = useToast();
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    toast.success('Password changed successfully');
    navigate('/dashboard');
  };

  const handleClear = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-white font-sans antialiased select-none text-[13px] text-black border-2 border-[#8ba6c1] m-1 relative overflow-hidden flex flex-col">
      <Header />
      {/* Faded Watermark Logo on the Left */}
      <img 
        src={logoImg} 
        className="absolute left-[8%] top-[65%] -translate-y-1/2 w-[450px] h-[450px] opacity-[0.15] object-contain pointer-events-none z-0" 
        alt="Watermark" 
      />

      {/* Main Content */}
      <div className="px-4 py-5 relative z-10 flex-1 flex flex-col">
        <h1 className="font-bold text-[15px] mb-5 font-sans">Change Credentials</h1>

        {/* First Box: Change Credentials */}
        <div className="border border-[#98b0c8] p-0.5 mb-3 bg-[#f0f0f0]">
          <div className="border border-[#98b0c8] bg-[#ffffff] px-4 py-5 flex items-center h-20 shadow-[inset_0_0_2px_rgba(0,0,0,0.1)]">
            <span className="font-bold text-[14px] w-56 pl-2">
              Change <span className="text-red-500 font-bold">*</span>
            </span>
            <select className="border border-[#a5a5a5] w-[260px] h-7 text-[13px] px-1 focus:outline-none bg-white font-sans">
              <option>Password</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-6">
          <button 
            type="button" 
            onClick={handleSubmit}
            className="bg-[#e4e4e4] border-t-2 border-l-2 border-[#ffffff] border-b-2 border-r-2 border-b-[#999999] border-r-[#999999] text-[12px] px-3 py-0.5 text-[#333] active:border-t-[#999999] active:border-l-[#999999] active:border-b-[#ffffff] active:border-r-[#ffffff] hover:bg-[#eaeaea] font-sans"
          >
            Go
          </button>
          <button 
            type="button" 
            onClick={handleClear}
            className="bg-[#e4e4e4] border-t-2 border-l-2 border-[#ffffff] border-b-2 border-r-2 border-b-[#999999] border-r-[#999999] text-[12px] px-3 py-0.5 text-[#666] active:border-t-[#999999] active:border-l-[#999999] active:border-b-[#ffffff] active:border-r-[#ffffff] hover:bg-[#eaeaea] font-sans"
          >
            Clear
          </button>
        </div>

        {/* Second Box: Change Password */}
        <div className="border border-[#98b0c8] p-0.5 bg-[#f0f0f0] flex-1 flex flex-col">
          <div className="border border-[#98b0c8] bg-white flex-1 flex flex-col">
            <div className="text-[#3b6094] font-bold text-[14px] p-3 pl-4 bg-[#e8f0f8] border-b border-[#dcdcdc]">
              Change Password
            </div>
            
            <div className="px-5 pt-8 pb-8">
              <table className="w-full max-w-2xl border-collapse">
                <tbody>
                  <tr>
                    <td className="font-bold py-3 w-56 align-middle text-[13px]">Old Password</td>
                    <td className="py-3">
                      <input 
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="border border-[#a5a5a5] w-[260px] h-[24px] focus:outline-none px-1 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.1)]"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="font-bold py-3 align-middle text-[13px]">New Password</td>
                    <td className="py-3">
                      <input 
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="border border-[#a5a5a5] w-[260px] h-[24px] focus:outline-none px-1 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.1)]"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="font-bold py-3 align-middle text-[13px]">Confirm New Password</td>
                    <td className="py-3">
                      <input 
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="border border-[#a5a5a5] w-[260px] h-[24px] focus:outline-none px-1 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.1)]"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Password Rules Section */}
            <div className="bg-[#f0f0f0] flex flex-1 p-5 pt-8 pb-12 text-[13px] border-t border-[#dcdcdc] shadow-[inset_0_3px_5px_-3px_rgba(0,0,0,0.1)]">
              <div className="font-bold w-56 text-[#333] pl-1">
                Password should be
              </div>
              <div className="flex-1 text-[#333]">
                <ul className="space-y-[8px]">
                  <li className="flex items-start gap-2">
                    <div className="w-[5px] h-[5px] bg-[#c82828] mt-[5px] border border-[#7a1c1c] shadow-sm flex-shrink-0"></div>
                    <span>Minimum 8 characters long</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-[5px] h-[5px] bg-[#c82828] mt-[5px] border border-[#7a1c1c] shadow-sm flex-shrink-0"></div>
                    <span>Maximum 15 characters long</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-[5px] h-[5px] bg-[#c82828] mt-[5px] border border-[#7a1c1c] shadow-sm flex-shrink-0"></div>
                    <div>
                      Necessarily have any three of the following types:
                      <div className="ml-[1px] mt-[3px] text-[#333] leading-relaxed">
                        <div>1.lower case alphabet</div>
                        <div>2.upper case alphabet</div>
                        <div>3.numeric</div>
                        <div>4.special</div>
                      </div>
                    </div>
                  </li>
                  <li className="flex items-start gap-2 mt-2">
                    <div className="w-[5px] h-[5px] bg-[#c82828] mt-[5px] border border-[#7a1c1c] shadow-sm flex-shrink-0"></div>
                    <span>This new password should not be any of the previous 20 passwords.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-[5px] h-[5px] bg-[#c82828] mt-[5px] border border-[#7a1c1c] shadow-sm flex-shrink-0"></div>
                    <span>This new password can be changed only after 0 days.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-[5px] h-[5px] bg-[#c82828] mt-[5px] border border-[#7a1c1c] shadow-sm flex-shrink-0"></div>
                    <span>This new password will expire after 60 days.</span>
                  </li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}

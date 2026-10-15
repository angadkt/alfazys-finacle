import { useState } from 'react';
import { dbService } from '../services/db';
import { useToast } from '../contexts/ToastContext';
import { DEFAULT_STAFF_PERMISSIONS } from '../types/staff';
import type { StaffPermissions, StaffEmailNotification, FinacleScreen } from '../types/staff';
import EmailSentModal from './EmailSentModal';
import { Eye, EyeOff, KeyRound, Mail, ShieldCheck, CheckSquare, Square } from 'lucide-react';

import api from '../services/api';

interface AddStaffFormProps {
  onNavigateToManagement?: () => void;
}

export default function AddStaffForm({ onNavigateToManagement }: AddStaffFormProps) {
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);

  const [permissions, setPermissions] = useState<StaffPermissions>({ ...DEFAULT_STAFF_PERMISSIONS });
  const [dispatchedNotification, setDispatchedNotification] = useState<StaffEmailNotification | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let res = 'Fin@';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
    toast.info('Secure temporary password generated.');
  };

  const handlePermissionToggle = (screen: FinacleScreen) => {
    setPermissions(prev => ({
      ...prev,
      [screen]: !prev[screen]
    }));
  };

  const handleSelectAll = (val: boolean) => {
    const updated = {} as StaffPermissions;
    (Object.keys(DEFAULT_STAFF_PERMISSIONS) as FinacleScreen[]).forEach(k => {
      updated[k] = val;
    });
    setPermissions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Please enter a valid staff email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error('Invalid email format. E.g. staff.member@infazys.com');
      return;
    }

    setIsSubmitting(true);
    try {
      const staffPassword = password.trim() || `Fin@${Math.floor(100000 + Math.random() * 900000)}!`;

      // 1. Create or re-provision in local store
      const existing = dbService.getStaffByEmail(email.trim());
      let staff: any;
      let emailNotification: any;

      if (existing) {
        dbService.updateStaffMember(existing.id, {
          password: staffPassword,
          permissions,
          mustChangePassword: true,
          status: 'pending_first_login',
          lastSentPassword: staffPassword
        });
        staff = dbService.getStaffById(existing.id) || existing;
        emailNotification = dbService.resendStaffCredentials(existing.id);
      } else {
        const added = dbService.addStaffMember({
          email: email.trim(),
          password: staffPassword,
          permissions,
          sendEmail
        });
        staff = added.staff;
        emailNotification = added.emailNotification;
      }

      let backendSmtpSent = false;
      let backendNotice = '';

      // 2. Dispatch to live backend API which sends real SMTP email
      try {
        const res = await api.post('/users', {
          fullName: email.split('@')[0],
          email: email.trim().toLowerCase(),
          password: staffPassword,
          role: 'staff',
          sendEmail
        }, { timeout: 7000 });

        if (res.data?.emailDispatched) {
          backendSmtpSent = true;
          toast.success(`Staff created & credentials delivered to ${staff.email} via live SMTP!`);
        } else if (res.data?.mailResult?.error) {
          backendNotice = res.data.mailResult.error;
          toast.info(`Staff created! SMTP delivery notice: ${backendNotice}`);
        } else {
          toast.success(`Staff ${staff.id} created successfully!`);
        }
      } catch (apiErr: any) {
        console.warn('Backend API sync notice:', apiErr?.response?.data || apiErr?.message);
        backendNotice = apiErr?.response?.data?.message || 'Remote backend sync skipped';
        toast.success(`Staff ${staff.id} created! Credentials generated.`);
      }

      setDispatchedNotification({
        ...emailNotification,
        smtpDispatched: backendSmtpSent,
        smtpMessage: backendNotice
      });

      // Reset fields
      setEmail('');
      setPassword('');
      setPermissions({ ...DEFAULT_STAFF_PERMISSIONS });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create staff member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    setEmail('');
    setPassword('');
    setPermissions({ ...DEFAULT_STAFF_PERMISSIONS });
  };

  const permissionList: { key: FinacleScreen; label: string; desc: string; adminOnlyWarning?: boolean }[] = [
    { key: 'DASHBOARD', label: 'DASHBOARD', desc: 'Universal payment overview, balance telemetry & statistics' },
    { key: 'CREATE RETAIL CIF', label: 'CREATE RETAIL CIF', desc: 'Initiate new customer profile & CIF onboarding records' },
    { key: 'VIEW RETAIL CIF', label: 'VIEW RETAIL CIF', desc: 'Lookup customer profile master records & status' },
    { key: 'ORDER ENTRY', label: 'ORDER ENTRY', desc: 'Financial transaction booking, orders and payments' },
    { key: 'CREDIT ENTRY', label: 'CREDIT ENTRY', desc: 'Disbursements, outgoing payments, and bank settlement tracking' },
    { key: 'AED COLLECTON', label: 'AED COLLECTION', desc: 'Foreign currency cash collection & INR counter value' },
    { key: 'VERIFY RETAIL CIF CREATION', label: 'VERIFY RETAIL CIF CREATION', desc: 'Supervisory review and sign-off for new CIFs (SRS Section 5)', adminOnlyWarning: true },
    { key: 'VERIFY RETAIL CIF MODIFICATION', label: 'VERIFY RETAIL CIF MODIFICATION', desc: 'Supervisory review for modifications on existing CIFs (SRS Section 5)', adminOnlyWarning: true }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f4f7fb] overflow-y-auto font-sans text-black select-none p-3 custom-scrollbar">
      
      {/* Page Title & Breadcrumb */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#a0b0c0]">
        <div>
          <h1 className="text-[17px] font-bold text-[#104080] tracking-tight">
            USER PROFILE & STAFF CREDENTIAL PROVISIONING
          </h1>
          <p className="text-[11px] text-gray-600">
            Provision new staff accounts with immediate password email delivery and section-level access gating.
          </p>
        </div>
        {onNavigateToManagement && (
          <button
            type="button"
            onClick={onNavigateToManagement}
            className="bg-[#d4d0c8] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-[#8f8f9d] border-r-[#8f8f9d] px-3 py-1 text-[12px] font-bold hover:bg-[#e4e4e4] active:border-t-[#8f8f9d] active:border-l-[#8f8f9d] flex items-center gap-1.5"
          >
            <ShieldCheck size={14} className="text-[#104080]" />
            Staff Management Directory
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-4xl">
        
        {/* Panel 1: Credentials & Email Transmission */}
        <div className="border border-[#98b0c8] p-0.5 bg-[#f0f0f0] shadow-sm">
          <div className="border border-[#98b0c8] bg-white p-3">
            <div className="text-[#3b6094] font-bold text-[13px] pb-2 mb-3 border-b border-[#e2e8f0] flex items-center gap-2">
              <Mail size={15} />
              <span>Section 1: Staff Account Credentials & Automated Email Dispatch</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Email Address */}
              <div>
                <label className="block text-[12px] font-bold text-[#222] mb-1">
                  Staff Email Address <span className="text-red-600 font-bold">*</span>
                </label>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. staff.member@infazys.com"
                  className="w-full h-[28px] border border-[#a5a5a5] px-2 text-[12px] focus:outline-none focus:border-[#104080] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.1)]"
                  required
                />
                <span className="text-[10px] text-gray-500 mt-0.5 block">
                  Staff User ID will match this email for logging into the terminal.
                </span>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[12px] font-bold text-[#222]">
                    Temporary Password <span className="text-red-600 font-bold">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] text-[#104080] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <KeyRound size={12} />
                    Auto-Generate
                  </button>
                </div>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter or generate temporary password"
                    className="w-full h-[28px] border border-[#a5a5a5] pl-2 pr-8 text-[12px] focus:outline-none focus:border-[#104080] font-mono shadow-[inset_1px_1px_2px_rgba(0,0,0,0.1)]"
                    required
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <span className="text-[10px] text-gray-500 mt-0.5 block">
                  Leave blank to auto-generate a secure random 8-character string.
                </span>
              </div>

            </div>

            {/* Email Dispatch & First Login Policy Info Box */}
            <div className="mt-4 p-2.5 bg-[#f5f9ff] border border-[#bcd2e8] rounded-xs flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer text-[12px] font-bold text-[#104080]">
                <input 
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="cursor-pointer"
                />
                <span>Send Temporary Password to Staff Email Upon Creation</span>
              </label>

              <div className="flex items-start gap-2 text-[11px] text-gray-700 bg-white p-2 border border-[#d0e0f0]">
                <span className="text-[#c0392b] font-bold text-sm leading-none">ℹ</span>
                <div>
                  <strong>Mandatory First-Login Password Enforcement:</strong> When this staff member logs in with this temporary password, the terminal will lock all screens and mandate an immediate password update. Dashboard access will be blocked until the update succeeds.
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Panel 2: Section Permissions Matrix */}
        <div className="border border-[#98b0c8] p-0.5 bg-[#f0f0f0] shadow-sm">
          <div className="border border-[#98b0c8] bg-white p-3">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#e2e8f0]">
              <div className="text-[#3b6094] font-bold text-[13px] flex items-center gap-2">
                <ShieldCheck size={15} />
                <span>Section 2: Terminal Menu & Sidebar Access Permissions</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectAll(true)}
                  className="bg-[#e4e4e4] border border-[#a0a0a0] px-2 py-0.5 text-[11px] hover:bg-[#d8d8d8] font-bold flex items-center gap-1"
                >
                  <CheckSquare size={12} />
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAll(false)}
                  className="bg-[#e4e4e4] border border-[#a0a0a0] px-2 py-0.5 text-[11px] hover:bg-[#d8d8d8] font-bold flex items-center gap-1"
                >
                  <Square size={12} />
                  Clear All
                </button>
                <button
                  type="button"
                  onClick={() => setPermissions({ ...DEFAULT_STAFF_PERMISSIONS })}
                  className="bg-[#e4e4e4] border border-[#a0a0a0] px-2 py-0.5 text-[11px] hover:bg-[#d8d8d8] text-gray-700"
                >
                  Staff Defaults
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {permissionList.map((item) => {
                const isChecked = !!permissions[item.key];
                return (
                  <div 
                    key={item.key}
                    onClick={() => handlePermissionToggle(item.key)}
                    className={`p-2 border cursor-pointer transition-colors flex items-start gap-2.5 ${
                      isChecked 
                        ? 'bg-[#f0f5fc] border-[#316ac5]' 
                        : 'bg-[#fafafa] border-[#d8d8d8] opacity-75 hover:opacity-100'
                    }`}
                  >
                    <input 
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // handled by container onClick
                      className="mt-0.5 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-[12px] font-bold ${isChecked ? 'text-[#104080]' : 'text-gray-700'}`}>
                          {item.label}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-xs uppercase ${
                          isChecked ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {isChecked ? 'Allowed' : 'Denied'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                        {item.desc}
                      </p>
                      {item.adminOnlyWarning && (
                        <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">
                          ⚠ Supervisory dual-control function (Typically Super Admin only)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-2 pt-1 pb-4">
          <button 
            type="submit"
            disabled={isSubmitting}
            className="bg-[#104080] text-white border-t-2 border-l-2 border-[#3b73b9] border-b-2 border-r-2 border-b-[#082040] border-r-[#082040] text-[12px] font-bold px-4 py-1 hover:bg-[#1a559e] active:border-t-[#082040] active:border-l-[#082040] disabled:opacity-60 flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></span>
                <span>Dispatching Credentials via Email...</span>
              </>
            ) : (
              <span>Submit & Create Staff Account</span>
            )}
          </button>
          
          <button 
            type="button"
            onClick={handleClear}
            className="bg-[#e4e4e4] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-[#8f8f9d] border-r-[#8f8f9d] text-[12px] font-bold px-4 py-1 text-[#333] hover:bg-[#eaeaea] active:border-t-[#8f8f9d] active:border-l-[#8f8f9d]"
          >
            Clear Form
          </button>
        </div>

      </form>

      {/* Dispatched Email Confirmation Modal */}
      <EmailSentModal 
        notification={dispatchedNotification}
        onClose={() => setDispatchedNotification(null)}
      />

    </div>
  );
}

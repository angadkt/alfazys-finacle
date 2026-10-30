import { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import { DEFAULT_STAFF_PERMISSIONS } from '../types/staff';
import type { StaffMember, StaffPermissions, FinacleScreen, StaffEmailNotification } from '../types/staff';
import { useToast } from '../contexts/ToastContext';
import EmailSentModal from './EmailSentModal';
import FinacleSelect from './FinacleSelect';
import { 
  ShieldCheck, 
  UserPlus, 
  Search, 
  Mail, 
  KeyRound, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  RotateCw, 
  SlidersHorizontal,
  Check,
  X
} from 'lucide-react';
import api from '../services/api';
import { dispatchStaffCredentialsEmail } from '../services/emailDispatch';

interface StaffManagementProps {
  onNavigateToAddStaff?: () => void;
}

export default function StaffManagement({ onNavigateToAddStaff }: StaffManagementProps) {
  const toast = useToast();

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending_first_login' | 'suspended'>('all');
  
  // Modals state
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [editPermissions, setEditPermissions] = useState<StaffPermissions>({ ...DEFAULT_STAFF_PERMISSIONS });
  const [previewNotification, setPreviewNotification] = useState<StaffEmailNotification | null>(null);

  const loadStaff = () => {
    setStaffList(dbService.getStaffMembers());
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const filteredStaff = staffList.filter(s => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = s.email.toLowerCase().includes(term) || 
                          (s.fullName && s.fullName.toLowerCase().includes(term)) ||
                          (s.loginUsername && s.loginUsername.toLowerCase().includes(term)) ||
                          (s.staffCode && s.staffCode.toLowerCase().includes(term)) ||
                          s.id.toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle open permission edit modal
  const handleOpenPermissions = (staff: StaffMember) => {
    setEditingStaff(staff);
    setEditPermissions({ ...staff.permissions });
  };

  const handleSavePermissions = () => {
    if (!editingStaff) return;
    const updated = dbService.updateStaffPermissions(editingStaff.id, editPermissions);
    if (updated) {
      toast.success(`Access permissions updated for ${editingStaff.email}`);
      loadStaff();
      setEditingStaff(null);
    } else {
      toast.error('Failed to update permissions.');
    }
  };

  // Resend credentials email via backend SMTP
  const handleResendCredentials = async (staff: StaffMember) => {
    const notification = dbService.resendStaffCredentials(staff.id);
    if (!notification) {
      toast.error('Failed to resend credentials.');
      return;
    }

    let backendSent = false;
    let backendNotice = '';

    // Direct Brevo email dispatch with Dual Hero Credentials box
    try {
      const directResult = await dispatchStaffCredentialsEmail({
        toEmail: staff.email,
        fullName: staff.fullName || staff.email.split('@')[0].toUpperCase(),
        staffCode: staff.staffCode || staff.id,
        loginUsername: staff.loginUsername || staff.email.split('@')[0],
        temporaryPassword: staff.password
      });
      if (directResult.success) {
        backendSent = true;
        toast.success(`Credentials dispatched to ${staff.email}!`);
      } else {
        backendNotice = directResult.error || '';
      }
    } catch (dErr: any) {
      console.warn('Direct dispatch warning:', dErr);
    }

    // Also notify backend API
    try {
      const cleanId = staff.id.replace('STF', '');
      await api.post(`/users/by-email/${encodeURIComponent(staff.email)}/resend-credentials`, {
        email: staff.email,
        password: staff.password,
        fullName: staff.fullName,
        staffCode: staff.staffCode,
        username: staff.loginUsername
      }).catch(() => {
        return api.post(`/users/${cleanId}/resend-credentials`, {
          email: staff.email,
          password: staff.password,
          fullName: staff.fullName,
          staffCode: staff.staffCode,
          username: staff.loginUsername
        });
      });
    } catch (e: any) {
      console.warn('Backend resend notice:', e?.response?.data || e?.message);
    }

    setPreviewNotification({
      ...notification,
      fullName: staff.fullName,
      staffCode: staff.staffCode,
      loginUsername: staff.loginUsername,
      smtpDispatched: backendSent,
      smtpMessage: backendNotice
    });
    loadStaff();
  };

  // Reset password & enforce first login change via backend SMTP
  const handleResetPassword = async (staff: StaffMember) => {
    const newTemp = `Fin@${Math.floor(100000 + Math.random() * 900000)}!`;
    const updated = dbService.updateStaffMember(staff.id, {
      password: newTemp,
      mustChangePassword: true,
      status: 'pending_first_login',
      lastSentPassword: newTemp
    });

    if (updated) {
      const notification = dbService.resendStaffCredentials(staff.id);
      let backendSent = false;
      let backendNotice = '';

      // Direct Brevo email dispatch with Dual Hero Credentials box
      try {
        const directResult = await dispatchStaffCredentialsEmail({
          toEmail: staff.email,
          fullName: staff.fullName || staff.email.split('@')[0].toUpperCase(),
          staffCode: staff.staffCode || staff.id,
          loginUsername: staff.loginUsername || staff.email.split('@')[0],
          temporaryPassword: newTemp
        });
        if (directResult.success) {
          backendSent = true;
          toast.success(`Password reset and delivered to ${staff.email}!`);
        } else {
          backendNotice = directResult.error || '';
        }
      } catch (dErr: any) {
        console.warn('Direct dispatch warning:', dErr);
      }

      try {
        const cleanId = staff.id.replace('STF', '');
        await api.post(`/users/by-email/${encodeURIComponent(staff.email)}/resend-credentials`, {
          email: staff.email,
          password: newTemp,
          fullName: staff.fullName,
          staffCode: staff.staffCode,
          username: staff.loginUsername,
          sendEmail: !backendSent
        }).catch(() => {
          return api.post(`/users/${cleanId}/reset-password`, {
            email: staff.email,
            password: newTemp,
            fullName: staff.fullName,
            staffCode: staff.staffCode,
            username: staff.loginUsername
          });
        });
      } catch (e: any) {
        console.warn('Backend reset notice:', e?.response?.data || e?.message);
      }

      if (notification) {
        setPreviewNotification({
          ...notification,
          temporaryPassword: newTemp,
          smtpDispatched: backendSent,
          smtpMessage: backendNotice
        });
      }
      loadStaff();
    }
  };

  // Toggle suspended / active
  const handleToggleStatus = (staff: StaffMember) => {
    const newStatus = staff.status === 'suspended' ? 'active' : 'suspended';
    const updated = dbService.updateStaffMember(staff.id, { status: newStatus });
    if (updated) {
      toast.info(`Staff ${staff.email} status set to ${newStatus}`);
      loadStaff();
    }
  };

  // Delete staff from both local and remote database
  const handleDeleteStaff = async (staff: StaffMember) => {
    if (window.confirm(`Are you sure you want to permanently delete staff ${staff.email} (${staff.id})?`)) {
      // 1. Delete locally
      const ok = dbService.deleteStaffMember(staff.id);
      
      // 2. Delete remotely on backend database
      try {
        const cleanId = staff.id.replace('STF', '');
        await api.delete(`/users/${cleanId}`).catch(() => {
          return api.delete(`/users/by-email/${encodeURIComponent(staff.email)}`);
        });
      } catch (err: any) {
        console.warn('Backend delete notice:', err?.response?.data || err?.message);
      }

      if (ok) {
        toast.success(`Staff ${staff.email} deleted successfully.`);
        loadStaff();
      } else {
        toast.error('Could not delete staff.');
      }
    }
  };

  const permissionScreens: { key: FinacleScreen; label: string }[] = [
    { key: 'DASHBOARD', label: 'Dashboard Overview' },
    { key: 'CREATE RETAIL CIF', label: 'Create Retail CIF' },
    { key: 'VIEW RETAIL CIF', label: 'View Retail CIF' },
    { key: 'ORDER ENTRY', label: 'Order Entry' },
    { key: 'CREDIT ENTRY', label: 'Credit Entry' },
    { key: 'AED COLLECTON', label: 'AED Collection' },
    { key: 'VERIFY RETAIL CIF CREATION', label: 'Verify Retail CIF Creation (Dual Review)' },
    { key: 'VERIFY RETAIL CIF MODIFICATION', label: 'Verify Retail CIF Modification' }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f4f7fb] overflow-y-auto font-sans text-black select-none p-3 custom-scrollbar">
      
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#a0b0c0]">
        <div>
          <h1 className="text-[17px] font-bold text-black tracking-tight">
            STAFF MANAGEMENT & ACCESS CONTROL DIRECTORY
          </h1>
          <p className="text-[11px] text-gray-600">
            Control terminal authorizations, manage staff accounts, resend email credentials, and configure section gating.
          </p>
        </div>
        
        {onNavigateToAddStaff && (
          <button
            type="button"
            onClick={onNavigateToAddStaff}
            className="bg-[#104080] text-white border-t-2 border-l-2 border-[#3b73b9] border-b-2 border-r-2 border-b-[#082040] border-r-[#082040] text-[12px] font-bold px-3 py-1 hover:bg-[#1a559e] flex items-center gap-1.5"
          >
            <UserPlus size={14} />
            + Provision New Staff
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#e8edf2] border border-[#b8c8d8] p-2 mb-3 flex flex-wrap items-center justify-between gap-3 text-[12px]">
        
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Staff ID or Email Address..."
              className="w-full h-[26px] border border-[#a5a5a5] pl-7 pr-2 text-[12px] bg-white focus:outline-none shadow-[inset_1px_1px_2px_rgba(0,0,0,0.1)]"
            />
            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-700 text-xs">Filter Status:</span>
          <div className="w-[190px]">
            <FinacleSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full"
              triggerClassName="h-[28px] text-[11px] font-semibold border-[#a5a5a5] py-0.5"
              options={[
                { value: "all", label: `All Statuses (${staffList.length})` },
                { value: "active", label: "Active Accounts" },
                { value: "pending_first_login", label: "Pending First Login" },
                { value: "suspended", label: "Suspended Accounts" }
              ]}
            />
          </div>

          <button
            type="button"
            onClick={loadStaff}
            className="bg-[#d4d0c8] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-[#8f8f9d] border-r-[#8f8f9d] px-2 py-0.5 text-[11px] font-bold hover:bg-[#e4e4e4] active:border-t-[#8f8f9d] active:border-l-[#8f8f9d] flex items-center gap-1"
          >
            <RotateCw size={12} />
            Refresh
          </button>
        </div>

      </div>

      {/* Staff Table */}
      <div className="border border-[#98b0c8] bg-white shadow-sm flex-1 flex flex-col overflow-hidden">
        
        {/* Table Header Band */}
        <div className="bg-[#104080] text-white px-3 py-1.5 text-[12px] font-bold flex justify-between items-center">
          <span>Active Staff Directory Master List</span>
          <span className="text-[11px] font-normal text-blue-100">Showing {filteredStaff.length} Records</span>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-[12px]">
            <thead className="bg-[#e4ebf3] text-[#104080] border-b border-[#a0b8d0] sticky top-0 z-10 font-bold">
              <tr>
                <th className="py-2 px-3 border-r border-[#cad6e4] w-[110px]">Staff Code / ID</th>
                <th className="py-2 px-3 border-r border-[#cad6e4]">Staff Name &amp; Login User ID</th>
                <th className="py-2 px-3 border-r border-[#cad6e4] w-[130px]">Account Status</th>
                <th className="py-2 px-3 border-r border-[#cad6e4] w-[140px]">1st Login Policy</th>
                <th className="py-2 px-3 border-r border-[#cad6e4] w-[170px]">Authorized Modules</th>
                <th className="py-2 px-3 border-r border-[#cad6e4] w-[110px]">Created On</th>
                <th className="py-2 px-3 text-center w-[220px]">Terminal Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5]">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500 italic">
                    No staff members found matching the criteria. Click "+ Provision New Staff" to add one.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff, idx) => {
                  const allowedCount = Object.values(staff.permissions || {}).filter(Boolean).length;
                  const totalCount = Object.keys(staff.permissions || {}).length;

                  return (
                    <tr 
                      key={staff.id} 
                      className={`hover:bg-[#f2f7fc] ${idx % 2 === 1 ? 'bg-[#fbfcfd]' : 'bg-white'}`}
                    >
                      <td className="py-2 px-3 border-r border-[#e5e5e5] font-mono font-bold text-[#104080]">
                        <div className="text-[12px]">{staff.staffCode || staff.id}</div>
                        <span className="text-[10px] text-gray-400 font-sans block">{staff.id}</span>
                      </td>

                      <td className="py-2 px-3 border-r border-[#e5e5e5]">
                        <div className="font-bold text-[#104080] text-[13px]">
                          {staff.fullName || staff.email.split('@')[0].toUpperCase()}
                        </div>
                        <div className="text-[11px] font-mono text-[#0b3c75] flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-bold text-gray-500 font-sans">Login User ID:</span>
                          <span className="bg-[#eaf2fd] border border-[#a8c5eb] px-1.5 py-0.2 rounded-xs font-bold text-[#104080]">
                            {staff.loginUsername || staff.email}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          {staff.email}
                          {staff.lastLoginAt && (
                            <span className="ml-2 text-[10px] text-gray-400">
                              (Last seen: {new Date(staff.lastLoginAt).toLocaleDateString()})
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-2 px-3 border-r border-[#e5e5e5]">
                        {staff.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-[11px] font-bold bg-green-100 text-green-800 border border-green-300">
                            <CheckCircle2 size={11} /> Active
                          </span>
                        ) : staff.status === 'pending_first_login' ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <AlertTriangle size={11} /> 1st Login Pend
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-[11px] font-bold bg-red-100 text-red-800 border border-red-300">
                            Suspended
                          </span>
                        )}
                      </td>

                      <td className="py-2 px-3 border-r border-[#e5e5e5]">
                        {staff.mustChangePassword ? (
                          <span className="text-[11px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 border border-red-200 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-red-600" /> Mandatory Change
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-500 font-semibold inline-flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-600 stroke-[2.5]" /> Completed
                          </span>
                        )}
                      </td>

                      <td className="py-2 px-3 border-r border-[#e5e5e5]">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#104080]">
                            {allowedCount} of {totalCount} Modules
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenPermissions(staff)}
                            className="text-[11px] text-[#316ac5] hover:underline font-bold"
                          >
                            Edit
                          </button>
                        </div>
                      </td>

                      <td className="py-2 px-3 border-r border-[#e5e5e5] text-gray-600 text-[11px]">
                        {new Date(staff.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-2 px-2 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          
                          {/* Permissions Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenPermissions(staff)}
                            title="Configure Section Permissions"
                            className="bg-[#e4e4e4] border border-[#999] hover:bg-[#d8d8d8] p-1 text-[11px] font-bold text-[#104080] flex items-center gap-1"
                          >
                            <SlidersHorizontal size={12} />
                            Perms
                          </button>

                          {/* Resend Email Button */}
                          <button
                            type="button"
                            onClick={() => handleResendCredentials(staff)}
                            title="Resend Credential Email"
                            className="bg-[#e4e4e4] border border-[#999] hover:bg-[#d8d8d8] p-1 text-[11px] font-bold text-gray-800 flex items-center gap-1"
                          >
                            <Mail size={12} />
                            Email
                          </button>

                          {/* Reset Password Button */}
                          <button
                            type="button"
                            onClick={() => handleResetPassword(staff)}
                            title="Reset Password & Enforce 1st Login Change"
                            className="bg-[#e4e4e4] border border-[#999] hover:bg-[#d8d8d8] p-1 text-[11px] font-bold text-amber-800 flex items-center gap-1"
                          >
                            <KeyRound size={12} />
                            Reset
                          </button>

                          {/* Suspend / Activate Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(staff)}
                            title={staff.status === 'suspended' ? 'Activate Account' : 'Suspend Account'}
                            className={`border p-1 text-[11px] font-bold ${
                              staff.status === 'suspended' 
                                ? 'bg-green-50 text-green-700 border-green-400 hover:bg-green-100' 
                                : 'bg-gray-100 text-gray-700 border-gray-400 hover:bg-gray-200'
                            }`}
                          >
                            {staff.status === 'suspended' ? 'Unlock' : 'Lock'}
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteStaff(staff)}
                            title="Delete Staff"
                            className="bg-red-50 border border-red-300 text-red-600 hover:bg-red-100 p-1 text-[11px]"
                          >
                            <Trash2 size={12} />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Permissions Editor Modal */}
      {editingStaff && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#e4e4e4] shadow-2xl flex flex-col max-h-[90vh] w-full max-w-xl border-2 border-[#104080] rounded-[2px] overflow-hidden text-black font-sans">
            
            {/* Modal Title Bar */}
            <div className="bg-[#0E498C] text-white px-3.5 py-2 flex items-center justify-between text-[12px] font-bold select-none border-b border-[#00B5E2]/40">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#FFB800]" />
                <span>Configure Permissions — {editingStaff.email} ({editingStaff.id})</span>
              </div>
              <button 
                onClick={() => setEditingStaff(null)}
                className="text-white/80 hover:text-white hover:bg-white/10 px-1 py-1 rounded cursor-pointer text-xs font-bold leading-none"
                title="Close"
              >
                <X className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="bg-white border border-[#a0a0a0] m-1.5 p-3 flex flex-col overflow-auto">
              
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#e2e8f0]">
                <p className="text-[12px] text-gray-600">
                  Select which sections this staff member is authorized to view and interact with in FINCORE:
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const allChecked = {} as StaffPermissions;
                      permissionScreens.forEach(p => { allChecked[p.key] = true; });
                      setEditPermissions(allChecked);
                    }}
                    className="text-[11px] text-[#104080] hover:underline font-bold"
                  >
                    Select All
                  </button>
                  <span>|</span>
                  <button
                    type="button"
                    onClick={() => {
                      const noneChecked = {} as StaffPermissions;
                      permissionScreens.forEach(p => { noneChecked[p.key] = false; });
                      setEditPermissions(noneChecked);
                    }}
                    className="text-[11px] text-red-600 hover:underline font-bold"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
                {permissionScreens.map((screen) => {
                  const allowed = !!editPermissions[screen.key];
                  return (
                    <label 
                      key={screen.key}
                      className={`flex items-center justify-between p-2 border cursor-pointer rounded-xs transition-colors ${
                        allowed 
                          ? 'bg-[#EBF6FC] border-[#00A2E8]' 
                          : 'bg-[#fafafa] border-[#e0e0e0] opacity-80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input 
                          type="checkbox"
                          checked={allowed}
                          onChange={(e) => {
                            setEditPermissions(prev => ({
                              ...prev,
                              [screen.key]: e.target.checked
                            }));
                          }}
                          className="cursor-pointer"
                        />
                        <span className={`text-[12px] font-bold ${allowed ? 'text-[#0E498C]' : 'text-gray-700'}`}>
                          {screen.label}
                        </span>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-xs uppercase ${
                        allowed ? 'bg-[#FFB800] text-black' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {allowed ? 'Authorized' : 'Restricted'}
                      </span>
                    </label>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-[#e2e8f0] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="bg-white hover:bg-[#EBF6FC] text-[#0E498C] border border-gray-300 px-3.5 py-1.5 text-[12px] font-bold rounded-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  className="bg-[#0E498C] hover:bg-[#00A2E8] border border-[#00B5E2]/40 text-white px-4 py-1.5 text-[12px] font-bold rounded-xs cursor-pointer transition-colors shadow-xs"
                >
                  Save Permission Rule
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Email Preview Modal */}
      <EmailSentModal 
        notification={previewNotification}
        onClose={() => setPreviewNotification(null)}
      />

    </div>
  );
}

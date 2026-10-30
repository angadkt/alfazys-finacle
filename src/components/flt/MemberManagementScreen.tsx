import { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Building2, 
  Bed, 
  Utensils, 
  Mail, 
  Phone, 
  Edit3, 
  Trash2, 
  X, 
  Save, 
  RefreshCw,
  DollarSign
} from 'lucide-react';
import { dbService } from '../../services/db';
import type { Member, Flat, Room, MessPlan } from '../../types/flt';

export default function MemberManagementScreen() {
  const [members, setMembers] = useState<Member[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [messPlans, setMessPlans] = useState<MessPlan[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFlatId, setSelectedFlatId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Member>>({
    fullName: '',
    phone: '',
    email: '',
    assignedFlatId: '',
    assignedRoomId: '',
    bedNumber: 'Bed 1',
    agreedRoomRent: 800,
    messPlanId: '',
    messFee: 0,
    joiningDate: new Date().toISOString().split('T')[0],
    rentDueDay: 1,
    securityDeposit: 0,
    status: 'ACTIVE',
    notes: ''
  });

  const loadData = () => {
    setMembers([...dbService.getMembers()]);
    setFlats([...dbService.getFlats()]);
    setRooms([...dbService.getRooms()]);
    setMessPlans([...dbService.getMessPlans()]);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddModal = () => {
    const firstFlat = flats[0]?.id || '';
    const availableRoomsForFlat = rooms.filter(r => r.flatId === firstFlat);
    const firstRoom = availableRoomsForFlat[0];

    setEditingMember(null);
    setFormData({
      fullName: '',
      phone: '',
      email: '',
      assignedFlatId: firstFlat,
      assignedRoomId: firstRoom?.id || '',
      bedNumber: 'Bed 1',
      agreedRoomRent: firstRoom?.defaultMonthlyRentPerBed || 800,
      messPlanId: '',
      messFee: 0,
      joiningDate: new Date().toISOString().split('T')[0],
      rentDueDay: 1,
      securityDeposit: 500,
      status: 'ACTIVE',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member: Member) => {
    setEditingMember(member);
    setFormData({ ...member });
    setIsModalOpen(true);
  };

  // Handle flat change in form to auto-update room choices
  const handleFlatChange = (flatId: string) => {
    const availableRoomsForFlat = rooms.filter(r => r.flatId === flatId);
    const firstRoom = availableRoomsForFlat[0];

    setFormData({
      ...formData,
      assignedFlatId: flatId,
      assignedRoomId: firstRoom?.id || '',
      agreedRoomRent: firstRoom?.defaultMonthlyRentPerBed || formData.agreedRoomRent
    });
  };

  // Handle room change to auto-update base rent
  const handleRoomChange = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    setFormData({
      ...formData,
      assignedRoomId: roomId,
      agreedRoomRent: room?.defaultMonthlyRentPerBed || formData.agreedRoomRent
    });
  };

  // Handle mess plan change to auto-update mess fee
  const handleMessPlanChange = (planId: string) => {
    if (!planId || planId === 'NONE') {
      setFormData({
        ...formData,
        messPlanId: undefined,
        messFee: 0
      });
    } else {
      const plan = messPlans.find(p => p.id === planId);
      setFormData({
        ...formData,
        messPlanId: planId,
        messFee: plan?.monthlyPrice || 400
      });
    }
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.assignedFlatId || !formData.assignedRoomId) {
      alert('Member Name, Email, Flat, and Room are required.');
      return;
    }

    const memberId = editingMember ? editingMember.id : `MBR-${Date.now().toString().slice(-4)}`;
    const memberToSave: Member = {
      id: memberId,
      fullName: formData.fullName || '',
      phone: formData.phone || '',
      email: formData.email.trim().toLowerCase(),
      assignedFlatId: formData.assignedFlatId || '',
      assignedRoomId: formData.assignedRoomId || '',
      bedNumber: formData.bedNumber || 'Bed 1',
      agreedRoomRent: Number(formData.agreedRoomRent) || 0,
      messPlanId: formData.messPlanId || undefined,
      messFee: Number(formData.messFee) || 0,
      joiningDate: formData.joiningDate || new Date().toISOString().split('T')[0],
      rentDueDay: Number(formData.rentDueDay) || 1,
      securityDeposit: Number(formData.securityDeposit) || 0,
      status: (formData.status as any) || 'ACTIVE',
      notes: formData.notes || ''
    };

    dbService.saveMember(memberToSave);
    loadData();
    setIsModalOpen(false);
  };

  const handleDeleteMember = (id: string) => {
    dbService.deleteMember(id);
    setDeleteConfirmId(null);
    loadData();
  };

  const filteredMembers = members.filter(m => {
    const matchesSearch = 
      m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFlat = selectedFlatId === 'ALL' || m.assignedFlatId === selectedFlatId;
    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;

    return matchesSearch && matchesFlat && matchesStatus;
  });

  const availableRoomsForCurrentFlat = rooms.filter(r => r.flatId === formData.assignedFlatId);
  const totalPackageFee = (Number(formData.agreedRoomRent) || 0) + (Number(formData.messFee) || 0);

  return (
    <div className="flex flex-col h-full bg-[#f4f2ee] select-none text-slate-800 font-sans">
      
      {/* 1. Finacle Sub-Header Breadcrumb Bar */}
      <div className="bg-[#005A9C] text-white px-3 py-1.5 flex items-center justify-between text-xs font-semibold shadow-xs border-b border-[#00487D]">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#FFB800]" />
          <span>FLT &bull; Member &amp; Tenant Operations Desk (MBRM)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded text-white font-mono">
            TOTAL MEMBERS: {members.length} ({members.filter(m => m.status === 'ACTIVE').length} Active)
          </span>
          <button 
            onClick={loadData}
            className="flex items-center gap-1 bg-white/15 hover:bg-white/25 px-2 py-0.5 rounded cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      {/* 2. Top Filter & Action Bar */}
      <div className="p-3 bg-white border-b border-[#d0d0d0] flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 flex-1 min-w-[300px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input 
              type="text" 
              placeholder="Search by Tenant Name, Phone, or Email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-[#005A9C] outline-none"
            />
          </div>

          <select 
            value={selectedFlatId}
            onChange={(e) => setSelectedFlatId(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-bold text-[#005A9C] outline-none"
          >
            <option value="ALL">All Flats ({flats.length})</option>
            {flats.map(f => (
              <option key={f.id} value={f.id}>
                {f.flatNumber} &bull; {f.buildingName}
              </option>
            ))}
          </select>

          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-semibold text-slate-700 outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Tenants</option>
            <option value="INACTIVE">Vacated / Inactive</option>
          </select>
        </div>

        <button 
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 bg-[#00A2E8] hover:bg-[#0089C7] text-white px-3.5 py-1.5 rounded text-xs font-bold shadow-xs cursor-pointer transition-all border border-[#007BB3] active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" /> Add New Member
        </button>
      </div>

      {/* 3. Main Members Table */}
      <div className="flex-1 p-3 overflow-auto">
        <div className="bg-white border border-[#a0a0a0] rounded shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#E4EEF8] border-b border-[#a0a0a0] text-[#003865] font-bold">
                <th className="py-2 px-3 border-r border-[#d0d0d0]">Member ID</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0]">Tenant Name</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0]">Contact (Phone &amp; Email)</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0]">Assigned Unit &amp; Room</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0]">Food / Mess Plan</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0] text-right">Room Rent</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0] text-right">Mess Fee</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0] text-right font-black">Total / Month</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0] text-center">Due Day</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0] text-center">Status</th>
                <th className="py-2 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-slate-500 font-medium">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No members found matching your search.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const flat = flats.find(f => f.id === member.assignedFlatId);
                  const room = rooms.find(r => r.id === member.assignedRoomId);
                  const plan = messPlans.find(p => p.id === member.messPlanId);
                  const total = (member.agreedRoomRent || 0) + (member.messFee || 0);

                  return (
                    <tr key={member.id} className="hover:bg-[#F0F7FD] transition-colors">
                      <td className="py-2 px-3 font-mono font-bold text-[#005A9C] border-r border-slate-200">
                        {member.id}
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-900 border-r border-slate-200">
                        {member.fullName}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200">
                        <div className="flex items-center gap-1 text-slate-700 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" /> {member.phone}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <Mail className="w-3 h-3 text-blue-500" /> {member.email}
                        </div>
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200">
                        <div className="font-semibold text-slate-800 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {flat?.flatNumber} &bull; {flat?.buildingName}
                        </div>
                        <div className="text-[11px] text-[#005A9C] flex items-center gap-1 font-semibold">
                          <Bed className="w-3 h-3" />
                          {room?.roomName || 'Room'} &bull; {member.bedNumber || 'Bed 1'}
                        </div>
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200">
                        {plan ? (
                          <span className="bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded font-bold text-[10px] inline-flex items-center gap-1">
                            <Utensils className="w-2.5 h-2.5" /> {plan.planName}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Room Only (No Mess)</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-slate-700 border-r border-slate-200">
                        {member.agreedRoomRent} AED
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-slate-700 border-r border-slate-200">
                        {member.messFee > 0 ? `${member.messFee} AED` : '0 AED'}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-black text-[#005A9C] border-r border-slate-200 bg-blue-50/40">
                        {total} AED
                      </td>
                      <td className="py-2 px-3 text-center border-r border-slate-200">
                        <span className="bg-slate-100 font-bold px-2 py-0.5 rounded text-[11px] text-slate-700">
                          Day {member.rentDueDay || 1}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center border-r border-slate-200">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          member.status === 'ACTIVE' 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button 
                            onClick={() => handleOpenEditModal(member)}
                            className="p-1 text-slate-600 hover:text-[#005A9C] hover:bg-slate-100 rounded cursor-pointer"
                            title="Edit Member"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {deleteConfirmId === member.id ? (
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => handleDeleteMember(member.id)}
                                className="px-1.5 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold hover:bg-red-700 cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button 
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-1 py-0.5 bg-slate-300 text-slate-700 rounded text-[10px] cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setDeleteConfirmId(member.id)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                              title="Delete Member"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* 4. Add / Edit Member Modal (Simple 1-minute form, Zero KYC) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#f0ece1] border-2 border-[#005A9C] rounded shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            
            {/* Modal Header */}
            <div className="bg-[#00A2E8] text-white px-3 py-2 flex items-center justify-between text-xs font-bold shadow-xs">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#FFB800]" />
                {editingMember ? `Edit Member Details (${editingMember.id})` : 'Quick Member Registration (MBRM)'}
              </span>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="bg-white/20 hover:bg-white/30 p-1 rounded cursor-pointer text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveMember}>
              <div className="p-4 bg-white text-xs space-y-3">
                
                {/* Personal & Contact Section */}
                <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-3">
                  <div className="font-bold text-[#005A9C] text-[11px] uppercase tracking-wider flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> 1. Tenant Personal Information
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full border border-slate-400 rounded px-2.5 py-1.5 bg-white focus:border-[#005A9C] outline-none font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Phone / WhatsApp <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. +971 50 123 4567"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full border border-slate-400 rounded px-2.5 py-1.5 bg-white focus:border-[#005A9C] outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Email Address <span className="text-red-500">* (for due notices)</span>
                      </label>
                      <input 
                        type="email"
                        required
                        placeholder="e.g. rahul@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full border border-slate-400 rounded px-2.5 py-1.5 bg-white focus:border-[#005A9C] outline-none font-mono text-blue-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Accommodation Linking Section */}
                <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-3">
                  <div className="font-bold text-[#005A9C] text-[11px] uppercase tracking-wider flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" /> 2. Room &amp; Bed Allocation
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Select Flat <span className="text-red-500">*</span>
                      </label>
                      <select 
                        required
                        value={formData.assignedFlatId}
                        onChange={(e) => handleFlatChange(e.target.value)}
                        className="w-full border border-slate-400 rounded px-2.5 py-1.5 bg-white font-bold text-[#005A9C] outline-none"
                      >
                        <option value="">-- Choose Flat --</option>
                        {flats.map(f => (
                          <option key={f.id} value={f.id}>
                            {f.flatNumber} &bull; {f.buildingName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Select Room <span className="text-red-500">*</span>
                      </label>
                      <select 
                        required
                        value={formData.assignedRoomId}
                        onChange={(e) => handleRoomChange(e.target.value)}
                        className="w-full border border-slate-400 rounded px-2.5 py-1.5 bg-white font-bold text-slate-800 outline-none"
                      >
                        <option value="">-- Choose Room --</option>
                        {availableRoomsForCurrentFlat.map(r => (
                          <option key={r.id} value={r.id}>
                            {r.roomName} ({r.availableBeds} beds available)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Bed Position / Label
                      </label>
                      <input 
                        type="text"
                        placeholder="e.g. Bed 1 (Window), Bed 2 (Upper)"
                        value={formData.bedNumber}
                        onChange={(e) => setFormData({ ...formData, bedNumber: e.target.value })}
                        className="w-full border border-slate-400 rounded px-2.5 py-1.5 bg-white outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Financials & Food Plan Section */}
                <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-3">
                  <div className="font-bold text-[#005A9C] text-[11px] uppercase tracking-wider flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" /> 3. Rent &amp; Food Subscription Package
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Room Rent (AED) <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="number"
                        min="0"
                        required
                        value={formData.agreedRoomRent}
                        onChange={(e) => setFormData({ ...formData, agreedRoomRent: Number(e.target.value) })}
                        className="w-full border border-slate-400 rounded px-2.5 py-1.5 bg-white font-mono font-bold text-[#005A9C] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Food / Mess Plan
                      </label>
                      <select 
                        value={formData.messPlanId || 'NONE'}
                        onChange={(e) => handleMessPlanChange(e.target.value)}
                        className="w-full border border-slate-400 rounded px-2.5 py-1.5 bg-white font-semibold text-slate-800 outline-none"
                      >
                        <option value="NONE">Room Only (No Food)</option>
                        {messPlans.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.planName} ({p.monthlyPrice} AED)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Mess Fee (AED)
                      </label>
                      <input 
                        type="number"
                        min="0"
                        value={formData.messFee}
                        onChange={(e) => setFormData({ ...formData, messFee: Number(e.target.value) })}
                        className="w-full border border-slate-400 rounded px-2.5 py-1.5 bg-white font-mono font-bold text-amber-800 outline-none"
                      />
                    </div>

                    <div className="bg-blue-100/70 border border-blue-300 rounded p-1.5 text-center flex flex-col justify-center">
                      <div className="text-[10px] text-blue-800 uppercase font-bold">Total Package</div>
                      <div className="text-base font-black text-[#005A9C] font-mono">
                        {totalPackageFee} AED
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 pt-2">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Joining Date
                      </label>
                      <input 
                        type="date"
                        value={formData.joiningDate}
                        onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                        className="w-full border border-slate-400 rounded px-2.5 py-1.5 bg-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Rent Due Day (1 - 31)
                      </label>
                      <input 
                        type="number"
                        min="1"
                        max="31"
                        value={formData.rentDueDay}
                        onChange={(e) => setFormData({ ...formData, rentDueDay: Number(e.target.value) })}
                        className="w-full border border-slate-400 rounded px-2.5 py-1.5 bg-white font-bold outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Security Deposit (AED)
                      </label>
                      <input 
                        type="number"
                        min="0"
                        placeholder="e.g. 500"
                        value={formData.securityDeposit}
                        onChange={(e) => setFormData({ ...formData, securityDeposit: Number(e.target.value) })}
                        className="w-full border border-slate-400 rounded px-2.5 py-1.5 bg-white font-mono outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Status
                      </label>
                      <select 
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full border border-slate-400 rounded px-2.5 py-1.5 bg-white font-semibold outline-none"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">VACATED / INACTIVE</option>
                      </select>
                    </div>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="bg-[#d4d0c8] border-t border-[#a0a0a0] px-3 py-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-600 italic">
                  * Zero KYC required. Adding member registers them directly for automated rent invoicing.
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-400 rounded text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-1 bg-[#00A2E8] hover:bg-[#0089C7] border border-[#007BB3] text-white rounded text-xs font-bold cursor-pointer shadow-xs active:scale-95"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Member
                  </button>
                </div>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

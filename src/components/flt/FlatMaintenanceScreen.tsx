import { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Wifi, 
  Zap, 
  Phone, 
  User, 
  MapPin, 
  X,
  Save,
  RefreshCw,
  Home
} from 'lucide-react';
import { dbService } from '../../services/db';
import type { Flat } from '../../types/flt';

export default function FlatMaintenanceScreen() {
  const [flats, setFlats] = useState<Flat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFlat, setEditingFlat] = useState<Flat | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'utilities'>('basic');

  // Form State
  const [formData, setFormData] = useState<Partial<Flat>>({
    flatNumber: '',
    buildingName: '',
    areaLocation: '',
    totalRooms: 1,
    totalBedsCapacity: 2,
    landlordName: '',
    landlordPhone: '',
    monthlyLeaseCost: 0,
    electricityAccountNo: '',
    wifiNetworkName: '',
    wifiPassword: '',
    status: 'ACTIVE'
  });

  const loadFlats = () => {
    const list = dbService.getFlats();
    setFlats([...list]);
  };

  useEffect(() => {
    loadFlats();
  }, []);

  const handleOpenAddModal = () => {
    setEditingFlat(null);
    setFormData({
      flatNumber: '',
      buildingName: '',
      areaLocation: '',
      totalRooms: 2,
      totalBedsCapacity: 4,
      landlordName: '',
      landlordPhone: '',
      monthlyLeaseCost: 0,
      electricityAccountNo: '',
      wifiNetworkName: '',
      wifiPassword: '',
      status: 'ACTIVE'
    });
    setActiveTab('basic');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (flat: Flat) => {
    setEditingFlat(flat);
    setFormData({ ...flat });
    setActiveTab('basic');
    setIsModalOpen(true);
  };

  const handleSaveFlat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.flatNumber || !formData.buildingName) {
      alert('Flat Number and Building Name are mandatory.');
      return;
    }

    const flatId = editingFlat ? editingFlat.id : `FLT-${Date.now().toString().slice(-4)}`;
    const flatToSave: Flat = {
      id: flatId,
      flatNumber: formData.flatNumber || 'Flat',
      buildingName: formData.buildingName || '',
      areaLocation: formData.areaLocation || 'Dubai',
      totalRooms: Number(formData.totalRooms) || 1,
      totalBedsCapacity: Number(formData.totalBedsCapacity) || 2,
      landlordName: formData.landlordName || '',
      landlordPhone: formData.landlordPhone || '',
      monthlyLeaseCost: Number(formData.monthlyLeaseCost) || 0,
      electricityAccountNo: formData.electricityAccountNo || '',
      wifiNetworkName: formData.wifiNetworkName || '',
      wifiPassword: formData.wifiPassword || '',
      status: (formData.status as any) || 'ACTIVE',
      createdDate: editingFlat ? editingFlat.createdDate : new Date().toISOString().split('T')[0]
    };

    dbService.saveFlat(flatToSave);
    loadFlats();
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    dbService.deleteFlat(id);
    setDeleteConfirmId(null);
    loadFlats();
  };

  const filteredFlats = flats.filter(flat => {
    const matchesSearch = 
      flat.flatNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flat.buildingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flat.areaLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (flat.landlordName && flat.landlordName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || flat.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col h-full bg-[#f4f2ee] select-none text-slate-800 font-sans">
      
      {/* 1. Finacle Sub-Header Breadcrumb Bar */}
      <div className="bg-[#005A9C] text-white px-3 py-1.5 flex items-center justify-between text-xs font-semibold shadow-xs border-b border-[#00487D]">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#FFB800]" />
          <span>FLT &bull; Flat &amp; Property Maintenance Desk (FLTM)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded text-white font-mono">
            TOTAL UNITS: {flats.length}
          </span>
          <button 
            onClick={loadFlats}
            className="flex items-center gap-1 bg-white/15 hover:bg-white/25 px-2 py-0.5 rounded cursor-pointer transition-colors"
            title="Refresh Registry"
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
              placeholder="Search by Flat No, Building Name, Location, or Landlord..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-[#005A9C] outline-none transition-colors"
            />
          </div>

          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-semibold text-slate-700 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Units</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="INACTIVE">Inactive Units</option>
          </select>
        </div>

        <button 
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 bg-[#00A2E8] hover:bg-[#0089C7] text-white px-3.5 py-1.5 rounded text-xs font-bold shadow-xs cursor-pointer transition-all border border-[#007BB3] active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" /> Add New Flat
        </button>
      </div>

      {/* 3. Main Data Table */}
      <div className="flex-1 p-3 overflow-auto">
        <div className="bg-white border border-[#a0a0a0] rounded shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#E4EEF8] border-b border-[#a0a0a0] text-[#003865] font-bold">
                <th className="py-2 px-3 border-r border-[#d0d0d0]">Flat Code</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0]">Flat / Unit</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0]">Building &amp; Area</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0] text-center">Rooms</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0] text-center">Bed Capacity</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0]">Landlord Contact</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0]">WiFi / DEWA Meter</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0] text-center">Status</th>
                <th className="py-2 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredFlats.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-500 font-medium">
                    <Home className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No flats found matching your search.
                  </td>
                </tr>
              ) : (
                filteredFlats.map((flat) => (
                  <tr key={flat.id} className="hover:bg-[#F0F7FD] transition-colors">
                    <td className="py-2 px-3 font-mono font-bold text-[#005A9C] border-r border-slate-200">
                      {flat.id}
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-900 border-r border-slate-200">
                      <span className="bg-[#005A9C]/10 text-[#005A9C] px-1.5 py-0.5 rounded text-[11px] mr-1.5">
                        {flat.flatNumber}
                      </span>
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200">
                      <div className="font-semibold text-slate-800">{flat.buildingName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" /> {flat.areaLocation}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-slate-700 border-r border-slate-200">
                      {flat.totalRooms}
                    </td>
                    <td className="py-2 px-3 text-center border-r border-slate-200">
                      <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded text-[11px]">
                        {flat.totalBedsCapacity} Beds
                      </span>
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200">
                      {flat.landlordName ? (
                        <>
                          <div className="font-semibold text-slate-800 flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" /> {flat.landlordName}
                          </div>
                          {flat.landlordPhone && (
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                              <Phone className="w-2.5 h-2.5" /> {flat.landlordPhone}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-400 italic">Not specified</span>
                      )}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200">
                      <div className="flex flex-col gap-0.5 text-[11px]">
                        {flat.wifiNetworkName && (
                          <span className="flex items-center gap-1 text-slate-600">
                            <Wifi className="w-3 h-3 text-blue-500" /> {flat.wifiNetworkName}
                          </span>
                        )}
                        {flat.electricityAccountNo && (
                          <span className="flex items-center gap-1 text-slate-600 font-mono">
                            <Zap className="w-3 h-3 text-amber-500" /> {flat.electricityAccountNo}
                          </span>
                        )}
                        {!flat.wifiNetworkName && !flat.electricityAccountNo && (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center border-r border-slate-200">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                        flat.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : flat.status === 'MAINTENANCE'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {flat.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => handleOpenEditModal(flat)}
                          className="p-1 text-slate-600 hover:text-[#005A9C] hover:bg-slate-100 rounded cursor-pointer transition-colors"
                          title="Edit Flat Details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {deleteConfirmId === flat.id ? (
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => handleDelete(flat.id)}
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
                            onClick={() => setDeleteConfirmId(flat.id)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer transition-colors"
                            title="Delete Flat"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Add / Edit Modal in Authentic Finacle Form Style */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#f0ece1] border-2 border-[#005A9C] rounded shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            
            {/* Modal Header */}
            <div className="bg-[#00A2E8] text-white px-3 py-2 flex items-center justify-between text-xs font-bold shadow-xs">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#FFB800]" />
                {editingFlat ? `Modify Flat Record (${editingFlat.id})` : 'New Flat Master Maintenance (FLTM)'}
              </span>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="bg-white/20 hover:bg-white/30 p-1 rounded cursor-pointer text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="bg-[#d4d0c8] border-b border-[#a0a0a0] px-3 pt-2 flex gap-1 text-xs font-bold">
              <button 
                type="button"
                onClick={() => setActiveTab('basic')}
                className={`px-3 py-1.5 rounded-t cursor-pointer border-t border-x ${
                  activeTab === 'basic' 
                    ? 'bg-white border-[#808080] text-[#005A9C] -mb-[1px] z-10' 
                    : 'bg-[#e0dcd4] border-transparent text-slate-600 hover:bg-white/50'
                }`}
              >
                1. Unit &amp; Property Details
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('utilities')}
                className={`px-3 py-1.5 rounded-t cursor-pointer border-t border-x ${
                  activeTab === 'utilities' 
                    ? 'bg-white border-[#808080] text-[#005A9C] -mb-[1px] z-10' 
                    : 'bg-[#e0dcd4] border-transparent text-slate-600 hover:bg-white/50'
                }`}
              >
                2. Landlord &amp; Utilities
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveFlat}>
              <div className="p-4 bg-white text-xs space-y-3 min-h-[260px]">
                
                {activeTab === 'basic' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Flat / Unit Number <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. Flat 304, Villa 12"
                        value={formData.flatNumber}
                        onChange={(e) => setFormData({ ...formData, flatNumber: e.target.value })}
                        className="w-full border border-slate-400 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white focus:border-[#005A9C] outline-none font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Building Name <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. Al Huda Residence"
                        value={formData.buildingName}
                        onChange={(e) => setFormData({ ...formData, buildingName: e.target.value })}
                        className="w-full border border-slate-400 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white focus:border-[#005A9C] outline-none font-semibold"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-slate-700 font-bold mb-1">
                        Area / Location / Emirate
                      </label>
                      <input 
                        type="text"
                        placeholder="e.g. Al Barsha 1, Dubai"
                        value={formData.areaLocation}
                        onChange={(e) => setFormData({ ...formData, areaLocation: e.target.value })}
                        className="w-full border border-slate-400 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white focus:border-[#005A9C] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Total Partition / Rooms
                      </label>
                      <input 
                        type="number"
                        min="1"
                        max="20"
                        value={formData.totalRooms}
                        onChange={(e) => setFormData({ ...formData, totalRooms: Number(e.target.value) })}
                        className="w-full border border-slate-400 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white focus:border-[#005A9C] outline-none font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Total Bedspace Capacity
                      </label>
                      <input 
                        type="number"
                        min="1"
                        max="50"
                        value={formData.totalBedsCapacity}
                        onChange={(e) => setFormData({ ...formData, totalBedsCapacity: Number(e.target.value) })}
                        className="w-full border border-slate-400 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white focus:border-[#005A9C] outline-none font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Operational Status
                      </label>
                      <select 
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full border border-slate-400 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white focus:border-[#005A9C] outline-none font-semibold"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="MAINTENANCE">UNDER MAINTENANCE</option>
                        <option value="INACTIVE">INACTIVE</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Monthly Master Lease Cost (AED)
                      </label>
                      <input 
                        type="number"
                        placeholder="e.g. 6500"
                        value={formData.monthlyLeaseCost || ''}
                        onChange={(e) => setFormData({ ...formData, monthlyLeaseCost: Number(e.target.value) })}
                        className="w-full border border-slate-400 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white focus:border-[#005A9C] outline-none font-mono"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'utilities' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Landlord / Owner Name
                      </label>
                      <input 
                        type="text"
                        placeholder="e.g. Mohamed Al Nuaimi"
                        value={formData.landlordName}
                        onChange={(e) => setFormData({ ...formData, landlordName: e.target.value })}
                        className="w-full border border-slate-400 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white focus:border-[#005A9C] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Landlord Contact Phone
                      </label>
                      <input 
                        type="text"
                        placeholder="e.g. +971 50 123 4567"
                        value={formData.landlordPhone}
                        onChange={(e) => setFormData({ ...formData, landlordPhone: e.target.value })}
                        className="w-full border border-slate-400 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white focus:border-[#005A9C] outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Electricity / Water Account (DEWA/SEWA)
                      </label>
                      <input 
                        type="text"
                        placeholder="e.g. DEWA-8849201"
                        value={formData.electricityAccountNo}
                        onChange={(e) => setFormData({ ...formData, electricityAccountNo: e.target.value })}
                        className="w-full border border-slate-400 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white focus:border-[#005A9C] outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        WiFi Network Name (SSID)
                      </label>
                      <input 
                        type="text"
                        placeholder="e.g. AlHuda_304_5G"
                        value={formData.wifiNetworkName}
                        onChange={(e) => setFormData({ ...formData, wifiNetworkName: e.target.value })}
                        className="w-full border border-slate-400 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white focus:border-[#005A9C] outline-none"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-slate-700 font-bold mb-1">
                        WiFi Access Password
                      </label>
                      <input 
                        type="text"
                        placeholder="e.g. FastNet@2026"
                        value={formData.wifiPassword}
                        onChange={(e) => setFormData({ ...formData, wifiPassword: e.target.value })}
                        className="w-full border border-slate-400 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white focus:border-[#005A9C] outline-none font-mono"
                      />
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer Toolbar */}
              <div className="bg-[#d4d0c8] border-t border-[#a0a0a0] px-3 py-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-600 italic">
                  * Marked fields are compulsory for property registration.
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
                    <Save className="w-3.5 h-3.5" /> Save Flat Master
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

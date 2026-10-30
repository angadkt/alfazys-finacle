import { useState, useEffect } from 'react';
import { 
  Bed, 
  Plus, 
  Building2, 
  Edit3, 
  Trash2, 
  Wind, 
  Bath, 
  Sparkles,
  X,
  Save,
  RefreshCw,
  Search
} from 'lucide-react';
import { dbService } from '../../services/db';
import type { Room, Flat, RoomType, Member } from '../../types/flt';

export default function RoomInventoryScreen() {
  const [flats, setFlats] = useState<Flat[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedFlatId, setSelectedFlatId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Room>>({
    flatId: '',
    roomName: '',
    roomType: 'DOUBLE_SHARING',
    hasAttachedBath: true,
    hasBalcony: false,
    acType: 'SPLIT',
    totalBeds: 2,
    defaultMonthlyRentPerBed: 850,
    status: 'AVAILABLE'
  });

  const loadData = () => {
    const flatList = dbService.getFlats();
    const roomList = dbService.getRooms();
    const memberList = dbService.getMembers();
    setFlats([...flatList]);
    setRooms([...roomList]);
    setMembers([...memberList]);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingRoom(null);
    setFormData({
      flatId: flats[0]?.id || '',
      roomName: '',
      roomType: 'DOUBLE_SHARING',
      hasAttachedBath: false,
      hasBalcony: false,
      acType: 'SPLIT',
      totalBeds: 2,
      defaultMonthlyRentPerBed: 850,
      status: 'AVAILABLE'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (room: Room) => {
    setEditingRoom(room);
    setFormData({ ...room });
    setIsModalOpen(true);
  };

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.flatId || !formData.roomName) {
      alert('Flat selection and Room Name are required.');
      return;
    }

    const roomId = editingRoom ? editingRoom.id : `RM-${Date.now().toString().slice(-4)}`;
    const totalBeds = Number(formData.totalBeds) || 1;
    
    // Calculate occupied beds based on active members in this room
    const activeRoomMembers = members.filter(m => m.assignedRoomId === roomId && m.status === 'ACTIVE');
    const occupied = activeRoomMembers.length;
    const available = Math.max(0, totalBeds - occupied);

    const roomToSave: Room = {
      id: roomId,
      flatId: formData.flatId,
      roomName: formData.roomName || 'Room',
      roomType: (formData.roomType as RoomType) || 'DOUBLE_SHARING',
      hasAttachedBath: !!formData.hasAttachedBath,
      hasBalcony: !!formData.hasBalcony,
      acType: (formData.acType as any) || 'SPLIT',
      totalBeds: totalBeds,
      occupiedBeds: occupied,
      availableBeds: available,
      defaultMonthlyRentPerBed: Number(formData.defaultMonthlyRentPerBed) || 800,
      status: available === 0 ? 'FULL' : 'AVAILABLE'
    };

    dbService.saveRoom(roomToSave);
    loadData();
    setIsModalOpen(false);
  };

  const handleDeleteRoom = (id: string) => {
    dbService.deleteRoom(id);
    setDeleteConfirmId(null);
    loadData();
  };

  const filteredRooms = rooms.filter(room => {
    const matchesFlat = selectedFlatId === 'ALL' || room.flatId === selectedFlatId;
    const matchesSearch = 
      room.roomName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.roomType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFlat && matchesSearch;
  });

  // Calculate summary metrics
  const totalBedsCount = filteredRooms.reduce((acc, r) => acc + (r.totalBeds || 0), 0);
  const occupiedBedsCount = filteredRooms.reduce((acc, r) => acc + (r.occupiedBeds || 0), 0);
  const availableBedsCount = totalBedsCount - occupiedBedsCount;
  const occupancyPercentage = totalBedsCount > 0 ? Math.round((occupiedBedsCount / totalBedsCount) * 100) : 0;

  return (
    <div className="flex flex-col h-full bg-[#f4f2ee] select-none text-slate-800 font-sans">
      
      {/* 1. Finacle Sub-Header Breadcrumb Bar */}
      <div className="bg-[#005A9C] text-white px-3 py-1.5 flex items-center justify-between text-xs font-semibold shadow-xs border-b border-[#00487D]">
        <div className="flex items-center gap-2">
          <Bed className="w-4 h-4 text-[#FFB800]" />
          <span>FLT &bull; Room &amp; Bedspace Inventory Desk (ROOM)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded text-white font-mono">
            OCCUPANCY: {occupancyPercentage}% ({occupiedBedsCount}/{totalBedsCount} Beds)
          </span>
          <button 
            onClick={loadData}
            className="flex items-center gap-1 bg-white/15 hover:bg-white/25 px-2 py-0.5 rounded cursor-pointer transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      {/* 2. Operational Metrics Cards */}
      <div className="grid grid-cols-4 gap-2.5 p-3 bg-[#EBF3FA] border-b border-[#d0d0d0]">
        <div className="bg-white border border-[#a0c0e0] rounded p-2.5 shadow-2xs">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Rooms Configured</div>
          <div className="text-xl font-black text-[#005A9C]">{filteredRooms.length}</div>
          <div className="text-[10px] text-slate-400">Across {selectedFlatId === 'ALL' ? flats.length : 1} Flat(s)</div>
        </div>

        <div className="bg-white border border-[#a0c0e0] rounded p-2.5 shadow-2xs">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Beds Capacity</div>
          <div className="text-xl font-black text-slate-800">{totalBedsCount} Beds</div>
          <div className="text-[10px] text-slate-400">Inventory size</div>
        </div>

        <div className="bg-white border border-[#a0c0e0] rounded p-2.5 shadow-2xs">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Beds Occupied</div>
          <div className="text-xl font-black text-amber-700">{occupiedBedsCount} Active</div>
          <div className="text-[10px] text-amber-600 font-semibold">{occupancyPercentage}% Occupancy</div>
        </div>

        <div className="bg-white border border-[#a0c0e0] rounded p-2.5 shadow-2xs">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Beds Vacant / Available</div>
          <div className="text-xl font-black text-emerald-700">{availableBedsCount} Beds</div>
          <div className="text-[10px] text-emerald-600 font-semibold">Ready for new tenant</div>
        </div>
      </div>

      {/* 3. Filter & Action Bar */}
      <div className="p-3 bg-white border-b border-[#d0d0d0] flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 flex-1 min-w-[300px]">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#005A9C]" />
            <span className="text-xs font-bold text-slate-700">Filter Flat:</span>
          </div>
          <select 
            value={selectedFlatId}
            onChange={(e) => setSelectedFlatId(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-bold text-[#005A9C] outline-none"
          >
            <option value="ALL">All Property Flats ({flats.length})</option>
            {flats.map(f => (
              <option key={f.id} value={f.id}>
                {f.flatNumber} &bull; {f.buildingName} ({f.areaLocation})
              </option>
            ))}
          </select>

          <div className="relative flex-1 max-w-xs ml-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input 
              type="text" 
              placeholder="Search room name or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-[#005A9C] outline-none"
            />
          </div>
        </div>

        <button 
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 bg-[#00A2E8] hover:bg-[#0089C7] text-white px-3.5 py-1.5 rounded text-xs font-bold shadow-xs cursor-pointer transition-all border border-[#007BB3] active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" /> Add Room / Partition
        </button>
      </div>

      {/* 4. Room Grid & Bed Visualization */}
      <div className="flex-1 p-3 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredRooms.map((room) => {
            const flat = flats.find(f => f.id === room.flatId);
            const roomMembers = members.filter(m => m.assignedRoomId === room.id && m.status === 'ACTIVE');

            return (
              <div 
                key={room.id}
                className="bg-white border border-[#b0b0b0] rounded shadow-xs overflow-hidden flex flex-col justify-between hover:border-[#00A2E8] transition-all"
              >
                {/* Card Header */}
                <div className="bg-[#E4EEF8] border-b border-[#c0d0e0] p-2.5 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 text-xs">{room.roomName}</span>
                      <span className="bg-[#005A9C] text-white text-[10px] px-1.5 py-0.2 rounded font-mono">
                        {room.id}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 font-semibold flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      {flat?.flatNumber} &bull; {flat?.buildingName}
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    room.availableBeds === 0 
                      ? 'bg-red-100 text-red-800 border border-red-300' 
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}>
                    {room.availableBeds === 0 ? 'FULL' : `${room.availableBeds} VACANT`}
                  </span>
                </div>

                {/* Card Details Body */}
                <div className="p-3 text-xs space-y-2.5">
                  
                  {/* Features Strip */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold border border-slate-200">
                      {room.roomType.replace('_', ' ')}
                    </span>
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded flex items-center gap-1 border border-blue-200">
                      <Wind className="w-2.5 h-2.5" /> AC {room.acType}
                    </span>
                    {room.hasAttachedBath && (
                      <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded flex items-center gap-1 border border-purple-200">
                        <Bath className="w-2.5 h-2.5" /> Attached Bath
                      </span>
                    )}
                    {room.hasBalcony && (
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-200">
                        <Sparkles className="w-2.5 h-2.5" /> Balcony
                      </span>
                    )}
                  </div>

                  {/* Rent Display */}
                  <div className="bg-slate-50 border border-slate-200 rounded p-2 flex items-center justify-between">
                    <span className="text-slate-600 font-semibold text-[11px]">Base Monthly Rent / Bed:</span>
                    <span className="text-sm font-black text-[#005A9C] font-mono">
                      {room.defaultMonthlyRentPerBed} AED
                    </span>
                  </div>

                  {/* Bedspaces Slots Visualizer */}
                  <div>
                    <div className="text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Bedspaces ({room.totalBeds} total):</span>
                      <span className="text-slate-500 font-normal">
                        {roomMembers.length} occupied &bull; {room.totalBeds - roomMembers.length} available
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {Array.from({ length: room.totalBeds }).map((_, index) => {
                        const occupant = roomMembers[index];
                        return (
                          <div 
                            key={index}
                            className={`p-1.5 rounded border text-[11px] flex items-center gap-1.5 ${
                              occupant 
                                ? 'bg-amber-50/80 border-amber-300 text-amber-900' 
                                : 'bg-emerald-50/70 border-emerald-300 text-emerald-800'
                            }`}
                          >
                            <Bed className="w-3.5 h-3.5 shrink-0" />
                            <div className="truncate">
                              <div className="font-bold">Bed {index + 1}</div>
                              <div className="text-[10px] truncate text-slate-600">
                                {occupant ? occupant.fullName : 'VACANT'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Card Action Footer */}
                <div className="bg-[#f0ece1] border-t border-[#d0d0d0] px-3 py-1.5 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 font-mono">ID: {room.id}</span>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleOpenEditModal(room)}
                      className="p-1 text-slate-600 hover:text-[#005A9C] hover:bg-white rounded cursor-pointer"
                      title="Edit Room"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {deleteConfirmId === room.id ? (
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleDeleteRoom(room.id)}
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
                        onClick={() => setDeleteConfirmId(room.id)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-white rounded cursor-pointer"
                        title="Delete Room"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#f0ece1] border-2 border-[#005A9C] rounded shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            
            {/* Modal Header */}
            <div className="bg-[#00A2E8] text-white px-3 py-2 flex items-center justify-between text-xs font-bold shadow-xs">
              <span className="flex items-center gap-1.5">
                <Bed className="w-4 h-4 text-[#FFB800]" />
                {editingRoom ? `Edit Room Details (${editingRoom.id})` : 'New Room / Partition Inventory (ROOM)'}
              </span>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="bg-white/20 hover:bg-white/30 p-1 rounded cursor-pointer text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveRoom}>
              <div className="p-4 bg-white text-xs space-y-3">
                
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Select Target Flat <span className="text-red-500">*</span>
                  </label>
                  <select 
                    required
                    value={formData.flatId}
                    onChange={(e) => setFormData({ ...formData, flatId: e.target.value })}
                    className="w-full border border-slate-400 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white focus:border-[#005A9C] outline-none font-bold text-[#005A9C]"
                  >
                    <option value="">-- Choose Flat --</option>
                    {flats.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.flatNumber} - {f.buildingName} ({f.areaLocation})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Room / Partition Name <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Room 1 (Master)"
                      value={formData.roomName}
                      onChange={(e) => setFormData({ ...formData, roomName: e.target.value })}
                      className="w-full border border-slate-400 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white focus:border-[#005A9C] outline-none font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Room Type
                    </label>
                    <select 
                      value={formData.roomType}
                      onChange={(e) => setFormData({ ...formData, roomType: e.target.value as any })}
                      className="w-full border border-slate-400 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white focus:border-[#005A9C] outline-none font-semibold"
                    >
                      <option value="SINGLE">SINGLE PRIVATE</option>
                      <option value="DOUBLE_SHARING">DOUBLE SHARING</option>
                      <option value="TRIPLE_SHARING">TRIPLE SHARING</option>
                      <option value="FOUR_SHARING">4-BED SHARING</option>
                      <option value="SIX_SHARING">6-BED SHARING</option>
                      <option value="MASTER_BED">MASTER BEDROOM</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Total Beds in Room <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="number"
                      min="1"
                      max="12"
                      required
                      value={formData.totalBeds}
                      onChange={(e) => setFormData({ ...formData, totalBeds: Number(e.target.value) })}
                      className="w-full border border-slate-400 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white focus:border-[#005A9C] outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Base Monthly Rent / Bed (AED) <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="number"
                      min="0"
                      required
                      placeholder="e.g. 850"
                      value={formData.defaultMonthlyRentPerBed}
                      onChange={(e) => setFormData({ ...formData, defaultMonthlyRentPerBed: Number(e.target.value) })}
                      className="w-full border border-slate-400 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white focus:border-[#005A9C] outline-none font-mono font-bold text-[#005A9C]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      AC Type
                    </label>
                    <select 
                      value={formData.acType}
                      onChange={(e) => setFormData({ ...formData, acType: e.target.value as any })}
                      className="w-full border border-slate-400 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white focus:border-[#005A9C] outline-none font-semibold"
                    >
                      <option value="SPLIT">Split AC</option>
                      <option value="CENTRAL">Central AC</option>
                      <option value="WINDOW">Window AC</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input 
                      type="checkbox"
                      id="attachedBath"
                      checked={formData.hasAttachedBath}
                      onChange={(e) => setFormData({ ...formData, hasAttachedBath: e.target.checked })}
                      className="rounded border-slate-300 text-[#005A9C] focus:ring-[#005A9C]"
                    />
                    <label htmlFor="attachedBath" className="text-slate-800 font-bold cursor-pointer">
                      Attached Bath
                    </label>
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input 
                      type="checkbox"
                      id="balcony"
                      checked={formData.hasBalcony}
                      onChange={(e) => setFormData({ ...formData, hasBalcony: e.target.checked })}
                      className="rounded border-slate-300 text-[#005A9C] focus:ring-[#005A9C]"
                    />
                    <label htmlFor="balcony" className="text-slate-800 font-bold cursor-pointer">
                      Balcony
                    </label>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="bg-[#d4d0c8] border-t border-[#a0a0a0] px-3 py-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-600 italic">
                  * Bed spaces can be assigned directly to tenants.
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
                    <Save className="w-3.5 h-3.5" /> Save Room Inventory
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

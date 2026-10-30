import { useState, useEffect } from 'react';
import { 
  Utensils, 
  Coffee, 
  Sun, 
  Moon, 
  Printer, 
  Calendar, 
  RefreshCw, 
  CheckCircle2
} from 'lucide-react';
import { dbService } from '../../services/db';
import type { Member, Flat, Room, MessPlan } from '../../types/flt';

export default function KitchenRosterScreen() {
  const [flats, setFlats] = useState<Flat[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [plans, setPlans] = useState<MessPlan[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedFlatId, setSelectedFlatId] = useState<string>('ALL');
  const [rosterDate, setRosterDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const loadData = () => {
    setFlats([...dbService.getFlats()]);
    setRooms([...dbService.getRooms()]);
    setPlans([...dbService.getMessPlans()]);
    setMembers([...dbService.getMembers()]);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter members subscribed to a mess plan
  const messMembers = members.filter(m => {
    const hasMess = m.status === 'ACTIVE' && m.messPlanId && m.messPlanId !== 'NONE' && (m.messFee || 0) > 0;
    const matchesFlat = selectedFlatId === 'ALL' || m.assignedFlatId === selectedFlatId;
    return hasMess && matchesFlat;
  });

  // Calculate meal counts
  let breakfastCount = 0;
  let lunchCount = 0;
  let dinnerCount = 0;

  messMembers.forEach(m => {
    const plan = plans.find(p => p.id === m.messPlanId);
    if (plan && plan.isActive) {
      if (plan.mealTypes.includes('BREAKFAST')) breakfastCount++;
      if (plan.mealTypes.includes('LUNCH')) lunchCount++;
      if (plan.mealTypes.includes('DINNER')) dinnerCount++;
    }
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-full bg-[#f4f2ee] select-none text-slate-800 font-sans">
      
      {/* 1. Sub-Header */}
      <div className="bg-[#005A9C] text-white px-3 py-1.5 flex items-center justify-between text-xs font-semibold shadow-xs border-b border-[#00487D]">
        <div className="flex items-center gap-2">
          <Utensils className="w-4 h-4 text-[#FFB800]" />
          <span>FLT &bull; Daily Kitchen Mess Attendance &amp; Headcount Roster (MROST)</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-1 bg-white/15 hover:bg-white/25 px-2 py-0.5 rounded cursor-pointer transition-colors"
          >
            <Printer className="w-3 h-3" /> Print Roster
          </button>
          <button 
            onClick={loadData}
            className="flex items-center gap-1 bg-white/15 hover:bg-white/25 px-2 py-0.5 rounded cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      {/* 2. Today's Meal Headcount Summary Cards */}
      <div className="grid grid-cols-4 gap-2.5 p-3 bg-[#EBF3FA] border-b border-[#d0d0d0]">
        <div className="bg-white border border-[#a0c0e0] rounded p-2.5 shadow-2xs">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Subscribed Diners</div>
          <div className="text-xl font-black text-slate-800">{messMembers.length} Tenants</div>
          <div className="text-[10px] text-slate-400">Active mess subscriptions</div>
        </div>

        <div className="bg-white border border-blue-200 rounded p-2.5 shadow-2xs">
          <div className="text-[10px] text-blue-700 uppercase font-bold tracking-wider flex items-center gap-1">
            <Coffee className="w-3 h-3 text-blue-500" /> Breakfast Count
          </div>
          <div className="text-xl font-black text-blue-900">{breakfastCount} Meals</div>
          <div className="text-[10px] text-blue-500">Morning service</div>
        </div>

        <div className="bg-white border border-amber-200 rounded p-2.5 shadow-2xs">
          <div className="text-[10px] text-amber-700 uppercase font-bold tracking-wider flex items-center gap-1">
            <Sun className="w-3 h-3 text-amber-500" /> Lunch Count
          </div>
          <div className="text-xl font-black text-amber-900">{lunchCount} Meals</div>
          <div className="text-[10px] text-amber-600">Afternoon service</div>
        </div>

        <div className="bg-white border border-purple-200 rounded p-2.5 shadow-2xs">
          <div className="text-[10px] text-purple-700 uppercase font-bold tracking-wider flex items-center gap-1">
            <Moon className="w-3 h-3 text-purple-500" /> Dinner Count
          </div>
          <div className="text-xl font-black text-purple-900">{dinnerCount} Meals</div>
          <div className="text-[10px] text-purple-600">Evening service</div>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="p-3 bg-white border-b border-[#d0d0d0] flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">Filter Delivery Location:</span>
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
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Date:</span>
          <input 
            type="date"
            value={rosterDate}
            onChange={(e) => setRosterDate(e.target.value)}
            className="border border-slate-300 rounded px-2 py-1 text-xs bg-slate-50 outline-none"
          />
        </div>
      </div>

      {/* 4. Table Roster for Kitchen & Delivery */}
      <div className="flex-1 p-3 overflow-auto">
        <div className="bg-white border border-[#a0a0a0] rounded shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#E4EEF8] border-b border-[#a0a0a0] text-[#003865] font-bold">
                <th className="py-2 px-3 border-r border-[#d0d0d0]">Tenant Name</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0]">Property / Unit</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0]">Room &amp; Bed</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0]">Active Mess Plan</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0] text-center">Breakfast</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0] text-center">Lunch</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0] text-center">Dinner</th>
                <th className="py-2 px-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {messMembers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500 font-medium">
                    <Utensils className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No active mess subscribers found for the selected filter.
                  </td>
                </tr>
              ) : (
                messMembers.map((member) => {
                  const flat = flats.find(f => f.id === member.assignedFlatId);
                  const room = rooms.find(r => r.id === member.assignedRoomId);
                  const plan = plans.find(p => p.id === member.messPlanId);

                  const hasBreakfast = plan?.mealTypes.includes('BREAKFAST');
                  const hasLunch = plan?.mealTypes.includes('LUNCH');
                  const hasDinner = plan?.mealTypes.includes('DINNER');

                  return (
                    <tr key={member.id} className="hover:bg-[#F0F7FD] transition-colors">
                      <td className="py-2 px-3 font-bold text-slate-900 border-r border-slate-200">
                        {member.fullName}
                        <div className="text-[10px] text-slate-500 font-normal">{member.phone}</div>
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-800 border-r border-slate-200">
                        {flat ? `${flat.flatNumber} - ${flat.buildingName}` : 'Unknown Flat'}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200">
                        <span className="font-semibold text-[#005A9C]">{room?.roomName || 'Room'}</span>
                        {member.bedNumber && (
                          <span className="text-[10px] text-slate-500 block">{member.bedNumber}</span>
                        )}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200">
                        <span className="bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded font-bold text-[11px]">
                          {plan?.planName || 'Custom Mess'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center border-r border-slate-200">
                        {hasBreakfast ? (
                          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3 text-blue-600" /> YES
                          </span>
                        ) : (
                          <span className="text-slate-300">&mdash;</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center border-r border-slate-200">
                        {hasLunch ? (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3 text-amber-600" /> YES
                          </span>
                        ) : (
                          <span className="text-slate-300">&mdash;</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center border-r border-slate-200">
                        {hasDinner ? (
                          <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3 text-purple-600" /> YES
                          </span>
                        ) : (
                          <span className="text-slate-300">&mdash;</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-600 text-[11px]">
                        {member.notes || <span className="text-slate-300 italic">None</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

import { useState, useEffect } from 'react';
import { 
  Building2, 
  Bed, 
  Utensils, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  Coffee,
  Sun,
  Moon,
  Send
} from 'lucide-react';
import { dbService } from '../../services/db';
import { dispatchRentDueEmail } from '../../services/fltEmailDispatch';
import type { Flat, Room, Member, MessPlan, RentInvoice } from '../../types/flt';

export default function FltDashboard({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [messPlans, setMessPlans] = useState<MessPlan[]>([]);
  const [invoices, setInvoices] = useState<RentInvoice[]>([]);
  
  const [sendingInvoiceId, setSendingInvoiceId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadData = () => {
    dbService.generateMonthlyRentInvoices(currentMonth);
    setFlats([...dbService.getFlats()]);
    setRooms([...dbService.getRooms()]);
    setMembers([...dbService.getMembers()]);
    setMessPlans([...dbService.getMessPlans()]);
    setInvoices([...dbService.getRentInvoices(currentMonth)]);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Portfolio Metrics
  const totalBeds = rooms.reduce((acc, r) => acc + (r.totalBeds || 0), 0);
  const occupiedBeds = rooms.reduce((acc, r) => acc + (r.occupiedBeds || 0), 0);
  const vacantBeds = Math.max(0, totalBeds - occupiedBeds);
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  // Financial Metrics
  const monthDemand = invoices.reduce((acc, inv) => acc + (inv.totalAmountDue || 0), 0);
  const monthCollected = invoices.reduce((acc, inv) => acc + (inv.amountPaid || 0), 0);
  const monthPending = invoices.reduce((acc, inv) => acc + (inv.balanceDue || 0), 0);

  // Mess Meal Counts
  const activeMessMembers = members.filter(m => m.status === 'ACTIVE' && m.messPlanId && m.messPlanId !== 'NONE' && (m.messFee || 0) > 0);
  let breakfastTotal = 0;
  let lunchTotal = 0;
  let dinnerTotal = 0;

  activeMessMembers.forEach(m => {
    const plan = messPlans.find(p => p.id === m.messPlanId);
    if (plan && plan.isActive) {
      if (plan.mealTypes.includes('BREAKFAST')) breakfastTotal++;
      if (plan.mealTypes.includes('LUNCH')) lunchTotal++;
      if (plan.mealTypes.includes('DINNER')) dinnerTotal++;
    }
  });

  // Overdue / Pending Tenants
  const overdueInvoices = invoices.filter(inv => inv.balanceDue > 0);

  const handleSendReminder = async (invoice: RentInvoice) => {
    setSendingInvoiceId(invoice.id);
    const flat = flats.find(f => f.id === invoice.flatId);
    const room = rooms.find(r => r.id === invoice.roomId);

    const res = await dispatchRentDueEmail({
      toEmail: invoice.memberEmail,
      memberName: invoice.memberName,
      flatNumber: flat?.flatNumber || 'Flat',
      buildingName: flat?.buildingName || 'Residence',
      roomName: room?.roomName || 'Room',
      billingMonth: invoice.billingMonth,
      dueDate: invoice.dueDate,
      roomRentAmount: invoice.roomRentAmount,
      messAmount: invoice.messAmount,
      totalAmountDue: invoice.totalAmountDue,
      balanceDue: invoice.balanceDue
    });

    if (res.success) {
      invoice.dueEmailSent = true;
      invoice.dueEmailSentAt = new Date().toISOString();
      dbService.saveRentInvoice(invoice);

      dbService.logEmailNotice({
        id: `LOG-${Date.now().toString().slice(-5)}`,
        memberId: invoice.memberId,
        recipientEmail: invoice.memberEmail,
        recipientName: invoice.memberName,
        subject: `Rent Reminder for ${invoice.billingMonth}`,
        noticeType: 'RENT_REMINDER',
        amountDue: invoice.balanceDue,
        dueDate: invoice.dueDate,
        sentAt: new Date().toISOString(),
        status: 'SUCCESS',
        messageId: res.messageId
      });

      setStatusMessage(`Due reminder email sent to ${invoice.memberEmail}`);
    } else {
      setStatusMessage(`Failed to send: ${res.error}`);
    }

    setSendingInvoiceId(null);
    loadData();
    setTimeout(() => setStatusMessage(null), 5000);
  };

  return (
    <div className="flex flex-col h-full bg-[#f4f2ee] select-none text-slate-800 font-sans overflow-auto p-4 space-y-4">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#003865] via-[#005A9C] to-[#00A2E8] rounded shadow-md p-4 text-white flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FFB800]">
            <Building2 className="w-4 h-4" /> Infazys FLT &bull; Flat &amp; Mess Accommodation Core
          </div>
          <div className="text-xl font-black mt-1">Property Operations &amp; Mess Command Dashboard</div>
          <div className="text-xs text-blue-100 mt-0.5">
            Real-time occupancy tracking, rent collections, kitchen headcount, and automated notices.
          </div>
        </div>

        <div className="text-right">
          <div className="text-[11px] uppercase font-bold text-blue-200">Billing Cycle</div>
          <div className="text-lg font-black font-mono text-white">{currentMonth}</div>
        </div>
      </div>

      {statusMessage && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-4 gap-3">
        {/* Flats Card */}
        <div 
          onClick={() => onNavigate('FLAT MAINTENANCE')}
          className="bg-white border border-[#a0c0e0] hover:border-[#005A9C] rounded p-3 shadow-xs cursor-pointer transition-all hover:shadow-md"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Properties Managed</span>
            <Building2 className="w-4 h-4 text-[#005A9C]" />
          </div>
          <div className="text-2xl font-black text-slate-900">{flats.length} Flats</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-semibold text-[#005A9C]">
            <span>Manage flats &amp; utilities</span> <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Beds & Occupancy Card */}
        <div 
          onClick={() => onNavigate('ROOM & BEDSPACE')}
          className="bg-white border border-[#a0c0e0] hover:border-[#005A9C] rounded p-3 shadow-xs cursor-pointer transition-all hover:shadow-md"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Bedspace Occupancy</span>
            <Bed className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{occupancyRate}%</div>
          <div className="text-[11px] text-slate-500 mt-1">
            <strong className="text-emerald-700">{occupiedBeds}</strong> occupied &bull; <strong className="text-slate-700">{vacantBeds}</strong> vacant
          </div>
        </div>

        {/* Month Demand Card */}
        <div 
          onClick={() => onNavigate('RENT DUE & INVOICING')}
          className="bg-white border border-[#a0c0e0] hover:border-[#005A9C] rounded p-3 shadow-xs cursor-pointer transition-all hover:shadow-md"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Current Month Demand</span>
            <DollarSign className="w-4 h-4 text-[#005A9C]" />
          </div>
          <div className="text-2xl font-black text-[#005A9C] font-mono">{monthDemand.toLocaleString()} AED</div>
          <div className="text-[11px] text-emerald-700 font-bold mt-1">
            {monthCollected.toLocaleString()} AED collected so far
          </div>
        </div>

        {/* Total Outstanding Dues */}
        <div 
          onClick={() => onNavigate('RENT COLLECTION')}
          className="bg-white border border-red-300 hover:border-red-500 rounded p-3 shadow-xs cursor-pointer transition-all hover:shadow-md bg-red-50/20"
        >
          <div className="flex items-center justify-between text-red-700 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Outstanding Dues</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-red-700 font-mono">{monthPending.toLocaleString()} AED</div>
          <div className="text-[11px] text-red-600 font-semibold mt-1 flex items-center gap-1">
            <span>{overdueInvoices.length} tenant(s) pending settlement</span> <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* 3. Kitchen Roster Headcount Section */}
      <div className="bg-white border border-[#b0b0b0] rounded shadow-xs p-4">
        <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2 font-bold text-sm text-[#005A9C]">
            <Utensils className="w-4 h-4 text-[#FFB800]" />
            <span>Daily Kitchen Mess Headcount</span>
            <span className="text-[11px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-mono font-bold">
              {activeMessMembers.length} Subscribed Diners
            </span>
          </div>
          <button 
            onClick={() => onNavigate('KITCHEN ROSTER')}
            className="text-xs text-[#005A9C] hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            Open Full Roster <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 border border-blue-200 rounded p-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold text-blue-700 flex items-center gap-1">
                <Coffee className="w-3.5 h-3.5" /> Breakfast Service
              </div>
              <div className="text-2xl font-black text-blue-900 mt-1">{breakfastTotal} Meals</div>
              <div className="text-[10px] text-blue-600">Morning flat delivery</div>
            </div>
            <Coffee className="w-8 h-8 text-blue-300" />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded p-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold text-amber-700 flex items-center gap-1">
                <Sun className="w-3.5 h-3.5" /> Lunch Service
              </div>
              <div className="text-2xl font-black text-amber-900 mt-1">{lunchTotal} Meals</div>
              <div className="text-[10px] text-amber-600">Afternoon flat delivery</div>
            </div>
            <Sun className="w-8 h-8 text-amber-300" />
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded p-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold text-purple-700 flex items-center gap-1">
                <Moon className="w-3.5 h-3.5" /> Dinner Service
              </div>
              <div className="text-2xl font-black text-purple-900 mt-1">{dinnerTotal} Meals</div>
              <div className="text-[10px] text-purple-600">Night hot meal delivery</div>
            </div>
            <Moon className="w-8 h-8 text-purple-300" />
          </div>
        </div>
      </div>

      {/* 4. Overdue Invoices & Instant Reminder Section */}
      <div className="bg-white border border-[#b0b0b0] rounded shadow-xs p-4">
        <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2 font-bold text-sm text-red-800">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>Overdue &amp; Pending Rent Dues ({overdueInvoices.length})</span>
          </div>
          <button 
            onClick={() => onNavigate('RENT DUE & INVOICING')}
            className="text-xs text-[#005A9C] hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            View All Invoices in RENTD <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#E4EEF8] border-b border-[#a0a0a0] text-[#003865] font-bold">
                <th className="py-2 px-3 border-r border-[#d0d0d0]">Tenant Name</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0]">Unit / Room</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0]">Email</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0] text-right">Total Demand</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0] text-right font-black text-red-700">Balance Due</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0] text-center">Due Date</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0] text-center">Last Notified</th>
                <th className="py-2 px-3 text-center">Instant Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {overdueInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-emerald-700 font-bold">
                    <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-500" />
                    All rent and mess charges are 100% paid!
                  </td>
                </tr>
              ) : (
                overdueInvoices.slice(0, 5).map(inv => {
                  const flat = flats.find(f => f.id === inv.flatId);
                  const room = rooms.find(r => r.id === inv.roomId);

                  return (
                    <tr key={inv.id} className="hover:bg-red-50/30">
                      <td className="py-2 px-3 font-bold text-slate-900 border-r border-slate-200">
                        {inv.memberName}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-700 border-r border-slate-200">
                        {flat?.flatNumber} &bull; {room?.roomName}
                      </td>
                      <td className="py-2 px-3 font-mono text-blue-700 border-r border-slate-200">
                        {inv.memberEmail}
                      </td>
                      <td className="py-2 px-3 text-right font-mono border-r border-slate-200">
                        {inv.totalAmountDue} AED
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-black text-red-700 border-r border-slate-200 bg-red-50/50">
                        {inv.balanceDue} AED
                      </td>
                      <td className="py-2 px-3 text-center font-mono border-r border-slate-200">
                        {inv.dueDate}
                      </td>
                      <td className="py-2 px-3 text-center border-r border-slate-200">
                        {inv.dueEmailSent ? (
                          <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded font-bold">
                            SENT
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                            PENDING
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button 
                          onClick={() => handleSendReminder(inv)}
                          disabled={sendingInvoiceId === inv.id}
                          className="flex items-center gap-1 px-2.5 py-1 bg-[#005A9C] hover:bg-[#00487D] disabled:opacity-50 text-white rounded text-[10px] font-bold cursor-pointer mx-auto shadow-2xs"
                        >
                          <Send className="w-2.5 h-2.5" />
                          {sendingInvoiceId === inv.id ? 'Sending...' : 'Send Reminder'}
                        </button>
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

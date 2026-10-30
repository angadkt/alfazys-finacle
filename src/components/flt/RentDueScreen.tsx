import { useState, useEffect } from 'react';
import { 
  FileText, 
  Send, 
  Mail, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  RefreshCw, 
  Search,
  Play
} from 'lucide-react';
import { dbService } from '../../services/db';
import { dispatchRentDueEmail } from '../../services/fltEmailDispatch';
import type { RentInvoice, Flat, Room } from '../../types/flt';

export default function RentDueScreen() {
  const currentMonthStr = new Date().toISOString().slice(0, 7); // e.g. "2026-11"
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [invoices, setInvoices] = useState<RentInvoice[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  const [isSendingSingle, setIsSendingSingle] = useState<string | null>(null);
  const [isSendingBulk, setIsSendingBulk] = useState(false);
  const [dispatchStatusMsg, setDispatchStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadData = () => {
    // Generate invoices for selected month if none exist yet
    dbService.generateMonthlyRentInvoices(selectedMonth);
    setInvoices([...dbService.getRentInvoices(selectedMonth)]);
    setFlats([...dbService.getFlats()]);
    setRooms([...dbService.getRooms()]);
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const handleGenerateDemand = () => {
    const list = dbService.generateMonthlyRentInvoices(selectedMonth);
    setInvoices([...list.filter(inv => inv.billingMonth === selectedMonth)]);
    setDispatchStatusMsg({
      text: `Rent and mess demand run completed for billing cycle ${selectedMonth}.`,
      type: 'success'
    });
    setTimeout(() => setDispatchStatusMsg(null), 5000);
  };

  const handleSendSingleEmail = async (invoice: RentInvoice) => {
    setIsSendingSingle(invoice.id);
    const flat = flats.find(f => f.id === invoice.flatId);
    const room = rooms.find(r => r.id === invoice.roomId);

    const result = await dispatchRentDueEmail({
      toEmail: invoice.memberEmail,
      memberName: invoice.memberName,
      flatNumber: flat?.flatNumber || 'Flat',
      buildingName: flat?.buildingName || 'Residence',
      roomName: room?.roomName || 'Room',
      billingMonth: invoice.billingMonth,
      dueDate: invoice.dueDate,
      roomRentAmount: invoice.roomRentAmount,
      messAmount: invoice.messAmount,
      utilityCharges: invoice.utilityCharges,
      totalAmountDue: invoice.totalAmountDue,
      balanceDue: invoice.balanceDue
    });

    if (result.success) {
      invoice.dueEmailSent = true;
      invoice.dueEmailSentAt = new Date().toISOString();
      dbService.saveRentInvoice(invoice);

      dbService.logEmailNotice({
        id: `LOG-${Date.now().toString().slice(-5)}`,
        memberId: invoice.memberId,
        recipientEmail: invoice.memberEmail,
        recipientName: invoice.memberName,
        subject: `Rent & Mess Due for ${invoice.billingMonth}`,
        noticeType: 'RENT_DUE',
        amountDue: invoice.balanceDue,
        dueDate: invoice.dueDate,
        sentAt: new Date().toISOString(),
        status: 'SUCCESS',
        messageId: result.messageId
      });

      setDispatchStatusMsg({
        text: `Rent Due notice email dispatched successfully to ${invoice.memberEmail}.`,
        type: 'success'
      });
    } else {
      setDispatchStatusMsg({
        text: `Failed to send email to ${invoice.memberEmail}: ${result.error}`,
        type: 'error'
      });
    }

    setIsSendingSingle(null);
    loadData();
    setTimeout(() => setDispatchStatusMsg(null), 5000);
  };

  const handleSendBulkDueEmails = async () => {
    const pendingInvoices = invoices.filter(inv => inv.balanceDue > 0 && !inv.dueEmailSent);
    if (pendingInvoices.length === 0) {
      alert('All pending invoices for this month have already been emailed.');
      return;
    }

    if (!confirm(`Are you sure you want to dispatch Rent Due emails to ${pendingInvoices.length} tenant(s)?`)) {
      return;
    }

    setIsSendingBulk(true);
    let successCount = 0;

    for (const invoice of pendingInvoices) {
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
        utilityCharges: invoice.utilityCharges,
        totalAmountDue: invoice.totalAmountDue,
        balanceDue: invoice.balanceDue
      });

      if (res.success) {
        successCount++;
        invoice.dueEmailSent = true;
        invoice.dueEmailSentAt = new Date().toISOString();
        dbService.saveRentInvoice(invoice);

        dbService.logEmailNotice({
          id: `LOG-${Date.now().toString().slice(-5)}`,
          memberId: invoice.memberId,
          recipientEmail: invoice.memberEmail,
          recipientName: invoice.memberName,
          subject: `Rent & Mess Due for ${invoice.billingMonth}`,
          noticeType: 'RENT_DUE',
          amountDue: invoice.balanceDue,
          dueDate: invoice.dueDate,
          sentAt: new Date().toISOString(),
          status: 'SUCCESS',
          messageId: res.messageId
        });
      }
    }

    setIsSendingBulk(false);
    loadData();
    setDispatchStatusMsg({
      text: `Bulk dispatch completed: ${successCount}/${pendingInvoices.length} Rent Due emails delivered.`,
      type: 'success'
    });
    setTimeout(() => setDispatchStatusMsg(null), 6000);
  };

  // Financial Metrics
  const totalDemand = invoices.reduce((acc, inv) => acc + (inv.totalAmountDue || 0), 0);
  const totalCollected = invoices.reduce((acc, inv) => acc + (inv.amountPaid || 0), 0);
  const totalPending = invoices.reduce((acc, inv) => acc + (inv.balanceDue || 0), 0);
  const unpaidCount = invoices.filter(inv => inv.balanceDue > 0).length;

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.memberEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = 
      statusFilter === 'ALL' ||
      (statusFilter === 'PENDING' && inv.balanceDue > 0) ||
      (statusFilter === 'PAID' && inv.balanceDue === 0);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col h-full bg-[#f4f2ee] select-none text-slate-800 font-sans">
      
      {/* 1. Finacle Sub-Header Breadcrumb Bar */}
      <div className="bg-[#005A9C] text-white px-3 py-1.5 flex items-center justify-between text-xs font-semibold shadow-xs border-b border-[#00487D]">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#FFB800]" />
          <span>FLT &bull; Rent &amp; Mess Due Invoicing &amp; Demand Run (RENTD)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded text-white font-mono">
            CYCLE: {selectedMonth}
          </span>
          <button 
            onClick={loadData}
            className="flex items-center gap-1 bg-white/15 hover:bg-white/25 px-2 py-0.5 rounded cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      {/* Status banner */}
      {dispatchStatusMsg && (
        <div className={`px-3 py-1.5 text-xs font-bold flex items-center gap-2 border-b ${
          dispatchStatusMsg.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
            : 'bg-red-50 text-red-800 border-red-300'
        }`}>
          {dispatchStatusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{dispatchStatusMsg.text}</span>
        </div>
      )}

      {/* 2. Monthly Financial KPI Summary Bar */}
      <div className="grid grid-cols-4 gap-2.5 p-3 bg-[#EBF3FA] border-b border-[#d0d0d0]">
        <div className="bg-white border border-[#a0c0e0] rounded p-2.5 shadow-2xs">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Month Demand</div>
          <div className="text-xl font-black text-[#005A9C] font-mono">{totalDemand.toLocaleString()} AED</div>
          <div className="text-[10px] text-slate-400">Total Billed across {invoices.length} Tenants</div>
        </div>

        <div className="bg-white border border-emerald-200 rounded p-2.5 shadow-2xs">
          <div className="text-[10px] text-emerald-700 uppercase font-bold tracking-wider">Total Collected</div>
          <div className="text-xl font-black text-emerald-700 font-mono">{totalCollected.toLocaleString()} AED</div>
          <div className="text-[10px] text-emerald-600 font-semibold">
            {totalDemand > 0 ? Math.round((totalCollected / totalDemand) * 100) : 0}% Realized
          </div>
        </div>

        <div className="bg-white border border-red-200 rounded p-2.5 shadow-2xs">
          <div className="text-[10px] text-red-700 uppercase font-bold tracking-wider">Total Pending / Due</div>
          <div className="text-xl font-black text-red-700 font-mono">{totalPending.toLocaleString()} AED</div>
          <div className="text-[10px] text-red-600 font-semibold">{unpaidCount} Tenant(s) Outstanding</div>
        </div>

        <div className="bg-white border border-[#a0c0e0] rounded p-2.5 shadow-2xs flex flex-col justify-between">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Automated Email Status</div>
          <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-blue-600" />
            <span>{invoices.filter(i => i.dueEmailSent).length} / {invoices.length} Notified</span>
          </div>
          <div className="text-[10px] text-slate-400">Direct Brevo SMTP Delivery</div>
        </div>
      </div>

      {/* 3. Action Toolbar */}
      <div className="p-3 bg-white border-b border-[#d0d0d0] flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 flex-1 min-w-[320px]">
          <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-[#005A9C]" />
            <span>Month:</span>
          </div>
          <input 
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-bold text-[#005A9C] outline-none"
          />

          <button 
            onClick={handleGenerateDemand}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#005A9C] hover:bg-[#00487D] text-white rounded text-xs font-bold cursor-pointer transition-colors"
            title="Generate Monthly Invoices for Active Tenants"
          >
            <Play className="w-3 h-3 fill-white" /> Run Monthly Billing
          </button>

          <div className="relative flex-1 max-w-xs ml-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input 
              type="text" 
              placeholder="Search tenant name or invoice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-[#005A9C] outline-none"
            />
          </div>

          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-semibold text-slate-700 outline-none"
          >
            <option value="ALL">All Invoices</option>
            <option value="PENDING">Pending Dues Only</option>
            <option value="PAID">Fully Paid</option>
          </select>
        </div>

        <button 
          onClick={handleSendBulkDueEmails}
          disabled={isSendingBulk}
          className="flex items-center gap-1.5 bg-[#00A2E8] hover:bg-[#0089C7] disabled:opacity-50 text-white px-3.5 py-1.5 rounded text-xs font-bold shadow-xs cursor-pointer transition-all border border-[#007BB3] active:scale-95"
        >
          <Send className="w-3.5 h-3.5" /> 
          {isSendingBulk ? 'Dispatching Bulk Emails...' : 'Send All Pending Due Emails'}
        </button>
      </div>

      {/* 4. Invoices Table */}
      <div className="flex-1 p-3 overflow-auto">
        <div className="bg-white border border-[#a0a0a0] rounded shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#E4EEF8] border-b border-[#a0a0a0] text-[#003865] font-bold">
                <th className="py-2 px-3 border-r border-[#d0d0d0]">Invoice No</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0]">Tenant Name &amp; Email</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0]">Property / Room</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0] text-right">Room Rent</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0] text-right">Mess Fee</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0] text-right font-black">Total Due</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0] text-right font-bold text-emerald-800">Paid</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0] text-right font-black text-red-800">Balance</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0] text-center">Due Date</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0] text-center">Status</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0] text-center">Email Notice</th>
                <th className="py-2 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-10 text-center text-slate-500 font-medium">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No invoices found. Click "Run Monthly Billing" to generate demand for this month.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const flat = flats.find(f => f.id === inv.flatId);
                  const room = rooms.find(r => r.id === inv.roomId);
                  const isPaid = inv.balanceDue === 0;

                  return (
                    <tr key={inv.id} className="hover:bg-[#F0F7FD] transition-colors">
                      <td className="py-2 px-3 font-mono font-bold text-[#005A9C] border-r border-slate-200">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-900 border-r border-slate-200">
                        {inv.memberName}
                        <div className="text-[11px] text-slate-500 font-normal flex items-center gap-1 font-mono">
                          <Mail className="w-2.5 h-2.5 text-blue-500" /> {inv.memberEmail}
                        </div>
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200">
                        <div className="font-semibold text-slate-800">{flat?.flatNumber || 'Flat'} &bull; {room?.roomName || 'Room'}</div>
                        <div className="text-[10px] text-slate-500">{flat?.buildingName}</div>
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-700 border-r border-slate-200">
                        {inv.roomRentAmount} AED
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-700 border-r border-slate-200">
                        {inv.messAmount > 0 ? `${inv.messAmount} AED` : '0 AED'}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-black text-slate-900 border-r border-slate-200">
                        {inv.totalAmountDue} AED
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700 border-r border-slate-200">
                        {inv.amountPaid} AED
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-black text-red-700 border-r border-slate-200 bg-red-50/40">
                        {inv.balanceDue} AED
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-[11px] border-r border-slate-200">
                        {inv.dueDate}
                      </td>
                      <td className="py-2 px-3 text-center border-r border-slate-200">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isPaid 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                            : inv.amountPaid > 0
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-red-100 text-red-800 border border-red-300'
                        }`}>
                          {isPaid ? 'PAID' : inv.amountPaid > 0 ? 'PARTIAL' : 'DUE / UNPAID'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center border-r border-slate-200">
                        {inv.dueEmailSent ? (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-green-100 text-green-800 border border-green-300 px-2 py-0.5 rounded font-bold">
                            <CheckCircle2 className="w-3 h-3 text-green-600" /> SENT
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded font-bold">
                            <Clock className="w-3 h-3 text-amber-600" /> NOT SENT
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button 
                          onClick={() => handleSendSingleEmail(inv)}
                          disabled={isSendingSingle === inv.id}
                          className="flex items-center gap-1 px-2.5 py-1 bg-[#005A9C] hover:bg-[#00487D] disabled:opacity-50 text-white rounded text-[11px] font-bold cursor-pointer transition-colors mx-auto shadow-2xs"
                          title="Dispatch Due Notice Email to Tenant"
                        >
                          <Send className="w-3 h-3" />
                          {isSendingSingle === inv.id ? 'Sending...' : 'Send Due Email'}
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

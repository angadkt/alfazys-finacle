import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Printer, 
  RefreshCw,
  FileText
} from 'lucide-react';
import { dbService } from '../../services/db';
import type { Member, RentInvoice, RentPayment, Flat, Room } from '../../types/flt';

export default function TenantStatementScreen() {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [invoices, setInvoices] = useState<RentInvoice[]>([]);
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  const loadData = () => {
    const memberList = dbService.getMembers();
    setMembers([...memberList]);
    setInvoices([...dbService.getRentInvoices()]);
    setPayments([...dbService.getRentPayments()]);
    setFlats([...dbService.getFlats()]);
    setRooms([...dbService.getRooms()]);

    if (!selectedMemberId && memberList.length > 0) {
      setSelectedMemberId(memberList[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentMember = members.find(m => m.id === selectedMemberId);
  const flat = flats.find(f => f.id === currentMember?.assignedFlatId);
  const room = rooms.find(r => r.id === currentMember?.assignedRoomId);

  // Filter member's invoices and payments
  const memberInvoices = invoices.filter(inv => inv.memberId === selectedMemberId);
  const memberPayments = payments.filter(p => p.memberId === selectedMemberId);

  // Combine invoices (debits) and payments (credits) into chronological passbook
  interface LedgerEntry {
    date: string;
    description: string;
    reference: string;
    type: 'DEBIT' | 'CREDIT';
    amount: number;
  }

  const ledgerEntries: LedgerEntry[] = [
    ...memberInvoices.map(inv => ({
      date: inv.invoiceDate,
      description: `Monthly Accommodation & Mess Demand (${inv.billingMonth})`,
      reference: inv.invoiceNumber,
      type: 'DEBIT' as const,
      amount: inv.totalAmountDue
    })),
    ...memberPayments.map(p => ({
      date: p.paymentDate,
      description: `Payment Received via ${p.paymentMode}${p.referenceNo ? ` (Ref: ${p.referenceNo})` : ''}`,
      reference: p.id,
      type: 'CREDIT' as const,
      amount: p.amountPaid
    }))
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate running balances
  let runningBalance = 0;
  const ledgerWithBalance = ledgerEntries.map(entry => {
    if (entry.type === 'DEBIT') {
      runningBalance += entry.amount;
    } else {
      runningBalance -= entry.amount;
    }
    return {
      ...entry,
      balanceAfter: runningBalance
    };
  });

  const totalBilled = memberInvoices.reduce((a, b) => a + (b.totalAmountDue || 0), 0);
  const totalPaid = memberPayments.reduce((a, b) => a + (b.amountPaid || 0), 0);
  const currentOutstanding = Math.max(0, totalBilled - totalPaid);

  return (
    <div className="flex flex-col h-full bg-[#f4f2ee] select-none text-slate-800 font-sans">
      
      {/* 1. Header */}
      <div className="bg-[#005A9C] text-white px-3 py-1.5 flex items-center justify-between text-xs font-semibold shadow-xs border-b border-[#00487D]">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-[#FFB800]" />
          <span>FLT &bull; Tenant Passbook &amp; Statement of Account (TLEDG)</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-1 bg-white/15 hover:bg-white/25 px-2 py-0.5 rounded cursor-pointer transition-colors"
          >
            <Printer className="w-3 h-3" /> Print Passbook
          </button>
          <button 
            onClick={loadData}
            className="flex items-center gap-1 bg-white/15 hover:bg-white/25 px-2 py-0.5 rounded cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      {/* 2. Tenant Selector Toolbar */}
      <div className="p-3 bg-white border-b border-[#d0d0d0] flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">Select Tenant:</span>
          <select 
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-bold text-[#005A9C] outline-none"
          >
            {members.map(m => (
              <option key={m.id} value={m.id}>
                {m.fullName} &bull; {m.phone} ({m.email})
              </option>
            ))}
          </select>
        </div>

        {currentMember && (
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="text-slate-600">
              Total Billed: <strong className="font-mono text-slate-900">{totalBilled.toLocaleString()} AED</strong>
            </span>
            <span className="text-slate-600">
              Total Paid: <strong className="font-mono text-emerald-700">{totalPaid.toLocaleString()} AED</strong>
            </span>
            <span className="bg-red-50 text-red-800 border border-red-200 px-2.5 py-1 rounded">
              Current Due: <strong className="font-mono font-black">{currentOutstanding.toLocaleString()} AED</strong>
            </span>
          </div>
        )}
      </div>

      {/* 3. Tenant Profile Card */}
      {currentMember && (
        <div className="p-3 bg-[#EBF3FA] border-b border-[#d0d0d0] text-xs">
          <div className="bg-white border border-[#a0c0e0] rounded p-3 grid grid-cols-4 gap-3 shadow-2xs">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Tenant Name &amp; ID</div>
              <div className="font-bold text-slate-900 text-sm">{currentMember.fullName}</div>
              <div className="font-mono text-slate-500 text-[11px]">{currentMember.id} &bull; {currentMember.phone}</div>
            </div>

            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Accommodation</div>
              <div className="font-bold text-slate-900">{flat?.flatNumber} &bull; {flat?.buildingName}</div>
              <div className="text-[11px] text-[#005A9C] font-semibold">{room?.roomName} ({currentMember.bedNumber || 'Bed 1'})</div>
            </div>

            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Monthly Rate Package</div>
              <div className="font-mono font-bold text-slate-900">
                {currentMember.agreedRoomRent} AED (Room) + {currentMember.messFee} AED (Mess)
              </div>
              <div className="text-[11px] text-emerald-700 font-bold font-mono">
                = {(currentMember.agreedRoomRent + currentMember.messFee).toLocaleString()} AED / month
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Joining &amp; Deposit</div>
              <div className="text-slate-700">Joined: <strong>{currentMember.joiningDate}</strong></div>
              <div className="text-[11px] text-slate-600">Deposit Held: <strong className="font-mono">{currentMember.securityDeposit || 0} AED</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Ledger Passbook Statement */}
      <div className="flex-1 p-3 overflow-auto">
        <div className="bg-white border border-[#a0a0a0] rounded shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#E4EEF8] border-b border-[#a0a0a0] text-[#003865] font-bold">
                <th className="py-2 px-3 border-r border-[#d0d0d0]">Date</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0]">Reference No</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0]">Transaction Particulars</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0] text-right text-red-800">Rent Demand (Debit)</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0] text-right text-emerald-800">Payment (Credit)</th>
                <th className="py-2 px-3 text-right font-black">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {ledgerWithBalance.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500 font-medium">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No transactions posted for this tenant yet.
                  </td>
                </tr>
              ) : (
                ledgerWithBalance.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#F0F7FD] transition-colors">
                    <td className="py-2 px-3 font-mono text-slate-700 border-r border-slate-200">
                      {item.date}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-[#005A9C] border-r border-slate-200">
                      {item.reference}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-800 border-r border-slate-200">
                      {item.description}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-red-700 border-r border-slate-200">
                      {item.type === 'DEBIT' ? `${item.amount} AED` : ''}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700 border-r border-slate-200">
                      {item.type === 'CREDIT' ? `${item.amount} AED` : ''}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-black text-slate-900 bg-slate-50/50">
                      {item.balanceAfter} AED
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

import { useState, useEffect } from 'react';
import { 
  Receipt, 
  DollarSign, 
  Search, 
  Printer, 
  CheckCircle2, 
  X, 
  Save, 
  RefreshCw
} from 'lucide-react';
import { dbService } from '../../services/db';
import { dispatchRentReceiptEmail } from '../../services/fltEmailDispatch';
import type { RentInvoice, RentPayment, Flat, Room } from '../../types/flt';

export default function RentCollectionScreen() {
  const [invoices, setInvoices] = useState<RentInvoice[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Collection Modal
  const [selectedInvoice, setSelectedInvoice] = useState<RentInvoice | null>(null);
  const [collectionAmount, setCollectionAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'BANK_TRANSFER' | 'CDM_DEPOSIT' | 'CARD'>('CASH');
  const [referenceNo, setReferenceNo] = useState('');
  const [sendReceiptEmail, setSendReceiptEmail] = useState(true);
  const [notes, setNotes] = useState('');

  // Receipt Modal State
  const [printedReceipt, setPrintedReceipt] = useState<{
    payment: RentPayment;
    invoice: RentInvoice;
    flat?: Flat;
    room?: Room;
  } | null>(null);

  const loadData = () => {
    setInvoices([...dbService.getRentInvoices()]);
    setFlats([...dbService.getFlats()]);
    setRooms([...dbService.getRooms()]);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCollectModal = (invoice: RentInvoice) => {
    setSelectedInvoice(invoice);
    setCollectionAmount(invoice.balanceDue);
    setPaymentMode('CASH');
    setReferenceNo('');
    setSendReceiptEmail(true);
    setNotes('');
  };

  const handleProcessCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    if (collectionAmount <= 0) {
      alert('Collection amount must be greater than zero.');
      return;
    }

    if (collectionAmount > selectedInvoice.balanceDue) {
      alert(`Amount exceeds the remaining balance of ${selectedInvoice.balanceDue} AED.`);
      return;
    }

    const receiptNo = `FLT-RCPT-${Date.now().toString().slice(-6)}`;
    const flat = flats.find(f => f.id === selectedInvoice.flatId);
    const room = rooms.find(r => r.id === selectedInvoice.roomId);
    const cashierName = localStorage.getItem('infazys_user_name') || 'Cashier Desk';

    const payment: RentPayment = {
      id: receiptNo,
      invoiceId: selectedInvoice.id,
      memberId: selectedInvoice.memberId,
      paymentDate: new Date().toISOString().split('T')[0],
      amountPaid: Number(collectionAmount),
      paymentMode: paymentMode,
      referenceNo: referenceNo || undefined,
      collectedBy: cashierName,
      notes: notes || undefined
    };

    dbService.recordRentPayment(payment);

    // Optional email dispatch
    if (sendReceiptEmail && selectedInvoice.memberEmail) {
      const remaining = selectedInvoice.balanceDue - collectionAmount;
      dispatchRentReceiptEmail({
        toEmail: selectedInvoice.memberEmail,
        memberName: selectedInvoice.memberName,
        receiptNumber: receiptNo,
        flatNumber: flat?.flatNumber || 'Flat',
        roomName: room?.roomName || 'Room',
        paymentDate: payment.paymentDate,
        amountPaid: Number(collectionAmount),
        paymentMode: paymentMode,
        remainingBalance: remaining,
        collectedBy: cashierName
      }).catch(err => console.error('Receipt email error:', err));
    }

    // Open Voucher Print Preview
    setPrintedReceipt({
      payment,
      invoice: selectedInvoice,
      flat,
      room
    });

    setSelectedInvoice(null);
    loadData();
  };

  const pendingInvoices = invoices.filter(inv => inv.balanceDue > 0);
  const filteredInvoices = pendingInvoices.filter(inv => {
    return (
      inv.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.memberEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="flex flex-col h-full bg-[#f4f2ee] select-none text-slate-800 font-sans">
      
      {/* 1. Finacle Sub-Header Breadcrumb Bar */}
      <div className="bg-[#005A9C] text-white px-3 py-1.5 flex items-center justify-between text-xs font-semibold shadow-xs border-b border-[#00487D]">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-[#FFB800]" />
          <span>FLT &bull; Cashier Rent &amp; Mess Collection Desk (RCPT)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded text-white font-mono">
            OUTSTANDING: {pendingInvoices.length} INVOICES
          </span>
          <button 
            onClick={loadData}
            className="flex items-center gap-1 bg-white/15 hover:bg-white/25 px-2 py-0.5 rounded cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      {/* 2. Top Filter Bar */}
      <div className="p-3 bg-white border-b border-[#d0d0d0] flex items-center justify-between shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input 
            type="text" 
            placeholder="Search tenant name or invoice number for settlement..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-[#005A9C] outline-none"
          />
        </div>

        <div className="text-xs text-slate-600 font-bold">
          Total Pending Across Portfolio: <span className="text-red-700 font-mono font-black">{pendingInvoices.reduce((a, b) => a + b.balanceDue, 0).toLocaleString()} AED</span>
        </div>
      </div>

      {/* 3. Invoices List for Collection */}
      <div className="flex-1 p-3 overflow-auto">
        <div className="bg-white border border-[#a0a0a0] rounded shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#E4EEF8] border-b border-[#a0a0a0] text-[#003865] font-bold">
                <th className="py-2 px-3 border-r border-[#d0d0d0]">Invoice No</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0]">Billing Month</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0]">Tenant Name</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0]">Property / Unit</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0] text-right">Total Demand</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0] text-right">Already Paid</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0] text-right font-black text-red-700 bg-red-50/50">Pending Balance</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0] text-center">Due Date</th>
                <th className="py-2 px-3 text-center">Collection Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-500 font-medium">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    All rent &amp; mess demand invoices are fully settled! Zero outstanding balances.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const flat = flats.find(f => f.id === inv.flatId);
                  const room = rooms.find(r => r.id === inv.roomId);

                  return (
                    <tr key={inv.id} className="hover:bg-[#F0F7FD] transition-colors">
                      <td className="py-2 px-3 font-mono font-bold text-[#005A9C] border-r border-slate-200">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-2 px-3 font-mono font-semibold text-slate-700 border-r border-slate-200">
                        {inv.billingMonth}
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-900 border-r border-slate-200">
                        {inv.memberName}
                        <div className="text-[10px] text-slate-500 font-normal">{inv.memberEmail}</div>
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200">
                        <div className="font-semibold text-slate-800">{flat?.flatNumber} &bull; {room?.roomName}</div>
                        <div className="text-[10px] text-slate-500">{flat?.buildingName}</div>
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-700 border-r border-slate-200">
                        {inv.totalAmountDue} AED
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-700 border-r border-slate-200">
                        {inv.amountPaid} AED
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-black text-red-700 border-r border-slate-200 bg-red-50/40">
                        {inv.balanceDue} AED
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-slate-700 border-r border-slate-200">
                        {inv.dueDate}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button 
                          onClick={() => handleOpenCollectModal(inv)}
                          className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer transition-colors mx-auto shadow-2xs"
                        >
                          <DollarSign className="w-3.5 h-3.5" /> Collect Payment
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

      {/* 4. Payment Collection Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#f0ece1] border-2 border-[#005A9C] rounded shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            
            {/* Header */}
            <div className="bg-[#00A2E8] text-white px-3 py-2 flex items-center justify-between text-xs font-bold shadow-xs">
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-[#FFB800]" />
                Collect Rent &amp; Mess Payment &bull; {selectedInvoice.invoiceNumber}
              </span>
              <button 
                onClick={() => setSelectedInvoice(null)}
                className="bg-white/20 hover:bg-white/30 p-1 rounded cursor-pointer text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleProcessCollection}>
              <div className="p-4 bg-white text-xs space-y-3">
                
                {/* Summary Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded p-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{selectedInvoice.memberName}</div>
                    <div className="text-[11px] text-slate-600">Month: {selectedInvoice.billingMonth}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Balance Due</div>
                    <div className="text-base font-black text-red-700 font-mono">
                      {selectedInvoice.balanceDue} AED
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Amount Collected (AED) <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="number"
                      min="1"
                      max={selectedInvoice.balanceDue}
                      required
                      value={collectionAmount}
                      onChange={(e) => setCollectionAmount(Number(e.target.value))}
                      className="w-full border border-slate-400 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white focus:border-[#005A9C] outline-none font-mono font-black text-lg text-emerald-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Payment Mode <span className="text-red-500">*</span>
                    </label>
                    <select 
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value as any)}
                      className="w-full border border-slate-400 rounded px-2.5 py-2 bg-white font-bold text-slate-800 outline-none"
                    >
                      <option value="CASH">CASH AT DESK</option>
                      <option value="BANK_TRANSFER">BANK TRANSFER / NEFT</option>
                      <option value="CDM_DEPOSIT">CDM CASH MACHINE DEPOSIT</option>
                      <option value="CARD">DEBIT / CREDIT CARD</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Reference / Slip / Transaction No
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. CDM-998412 or Bank Ref No"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    className="w-full border border-slate-400 rounded px-2.5 py-1.5 bg-white font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Cashier Remarks
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. Paid in full for November accommodation"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border border-slate-400 rounded px-2.5 py-1.5 bg-white outline-none"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                  <input 
                    type="checkbox"
                    id="sendReceipt"
                    checked={sendReceiptEmail}
                    onChange={(e) => setSendReceiptEmail(e.target.checked)}
                    className="rounded border-slate-300 text-[#005A9C]"
                  />
                  <label htmlFor="sendReceipt" className="text-slate-800 font-semibold cursor-pointer">
                    Automatically dispatch official receipt voucher to tenant email ({selectedInvoice.memberEmail})
                  </label>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="bg-[#d4d0c8] border-t border-[#a0a0a0] px-3 py-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-600 italic">
                  * Payment ledger entry will be posted immediately.
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => setSelectedInvoice(null)}
                    className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-400 rounded text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-1 bg-emerald-600 hover:bg-emerald-700 border border-emerald-800 text-white rounded text-xs font-bold cursor-pointer shadow-xs active:scale-95"
                  >
                    <Save className="w-3.5 h-3.5" /> Post Payment &amp; Print
                  </button>
                </div>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 5. Finacle Printable Payment Receipt Voucher Modal */}
      {printedReceipt && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#005A9C] rounded shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            
            {/* Action Bar */}
            <div className="bg-[#003865] text-white px-4 py-2 flex items-center justify-between text-xs font-bold print:hidden">
              <span className="flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-[#FFB800]" /> Finacle Official Rent Payment Receipt Voucher
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => window.print()}
                  className="bg-[#00A2E8] hover:bg-[#0089C7] text-white px-3 py-1 rounded text-xs font-bold cursor-pointer flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Receipt
                </button>
                <button 
                  onClick={() => setPrintedReceipt(null)}
                  className="bg-white/20 hover:bg-white/30 p-1 rounded cursor-pointer text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Voucher Paper */}
            <div className="p-6 bg-white text-slate-800 font-sans border-b border-slate-200 text-xs">
              
              {/* Header */}
              <div className="text-center pb-4 border-b-2 border-[#003865] mb-4">
                <div className="text-base font-black text-[#003865] tracking-wide">
                  AL FAZ REAL ESTATE &amp; ACCOMMODATION SERVICES
                </div>
                <div className="text-[11px] text-slate-500 uppercase font-semibold">
                  Infazys Finacle Banking Core &bull; Property &amp; Mess Collection Desk
                </div>
                <div className="text-xs font-mono font-bold text-emerald-800 mt-1">
                  OFFICIAL PAYMENT RECEIPT &bull; {printedReceipt.payment.id}
                </div>
              </div>

              {/* Grid Information */}
              <div className="grid grid-cols-2 gap-4 mb-4 bg-slate-50 p-3 rounded border border-slate-200">
                <div>
                  <div className="text-slate-500 font-semibold text-[10px] uppercase">Tenant Name</div>
                  <div className="font-bold text-sm text-slate-900">{printedReceipt.invoice.memberName}</div>
                  <div className="text-[11px] text-slate-600 font-mono">{printedReceipt.invoice.memberEmail}</div>
                </div>

                <div>
                  <div className="text-slate-500 font-semibold text-[10px] uppercase">Property &amp; Unit</div>
                  <div className="font-bold text-sm text-slate-900">
                    {printedReceipt.flat?.flatNumber} &bull; {printedReceipt.room?.roomName}
                  </div>
                  <div className="text-[11px] text-slate-600">{printedReceipt.flat?.buildingName} ({printedReceipt.flat?.areaLocation})</div>
                </div>

                <div>
                  <div className="text-slate-500 font-semibold text-[10px] uppercase">Transaction Date</div>
                  <div className="font-bold font-mono">{printedReceipt.payment.paymentDate}</div>
                </div>

                <div>
                  <div className="text-slate-500 font-semibold text-[10px] uppercase">Payment Mode</div>
                  <div className="font-bold font-mono text-emerald-800 uppercase">{printedReceipt.payment.paymentMode}</div>
                </div>
              </div>

              {/* Amount Breakdown Table */}
              <table className="w-full text-left border-collapse border border-slate-300 mb-4">
                <thead>
                  <tr className="bg-slate-100 font-bold">
                    <th className="p-2 border border-slate-300">Description</th>
                    <th className="p-2 border border-slate-300 text-right">Amount (AED)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border border-slate-300 font-semibold">
                      Monthly Accommodation &amp; Mess Subscription ({printedReceipt.invoice.billingMonth})
                    </td>
                    <td className="p-2 border border-slate-300 text-right font-mono font-bold">
                      {printedReceipt.invoice.totalAmountDue} AED
                    </td>
                  </tr>
                  <tr className="bg-emerald-50">
                    <td className="p-2 border border-slate-300 font-bold text-emerald-900">
                      Amount Paid / Settled Today
                    </td>
                    <td className="p-2 border border-slate-300 text-right font-mono font-black text-emerald-800 text-sm">
                      {printedReceipt.payment.amountPaid} AED
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-slate-300 font-bold text-slate-700">
                      Remaining Balance Due
                    </td>
                    <td className="p-2 border border-slate-300 text-right font-mono font-bold text-slate-800">
                      {Math.max(0, printedReceipt.invoice.balanceDue - printedReceipt.payment.amountPaid)} AED
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-6 mt-4 border-t border-slate-200">
                <div className="text-center">
                  <div className="h-10"></div>
                  <div className="border-t border-slate-400 font-bold pt-1 text-[11px]">Tenant Signature</div>
                </div>
                <div className="text-center">
                  <div className="font-mono text-[11px] text-slate-600">{printedReceipt.payment.collectedBy}</div>
                  <div className="border-t border-slate-400 font-bold pt-1 text-[11px]">Authorized Cashier Stamp</div>
                </div>
              </div>

            </div>

            {/* Close Button */}
            <div className="bg-[#f0ece1] p-2.5 text-right print:hidden">
              <button 
                onClick={() => setPrintedReceipt(null)}
                className="px-4 py-1 bg-[#005A9C] text-white rounded text-xs font-bold cursor-pointer hover:bg-[#00487D]"
              >
                Close Receipt
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

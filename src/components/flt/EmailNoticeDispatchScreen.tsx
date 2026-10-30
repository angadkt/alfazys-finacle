import { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  XCircle, 
  RefreshCw
} from 'lucide-react';
import { dbService } from '../../services/db';
import { dispatchRentDueEmail } from '../../services/fltEmailDispatch';
import type { EmailNoticeLog } from '../../types/flt';

export default function EmailNoticeDispatchScreen() {
  const [logs, setLogs] = useState<EmailNoticeLog[]>([]);
  const [testEmail, setTestEmail] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const loadLogs = () => {
    setLogs([...dbService.getEmailNoticeLogs()]);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail) return;

    setIsSendingTest(true);
    setTestResult(null);

    const res = await dispatchRentDueEmail({
      toEmail: testEmail.trim(),
      memberName: 'Demo Valued Tenant',
      flatNumber: 'Flat 304',
      buildingName: 'Al Huda Residence',
      roomName: 'Master Bedroom',
      billingMonth: 'November 2026',
      dueDate: '2026-11-05',
      roomRentAmount: 1100,
      messAmount: 450,
      utilityCharges: 50,
      totalAmountDue: 1600,
      balanceDue: 1600
    });

    if (res.success) {
      dbService.logEmailNotice({
        id: `LOG-${Date.now().toString().slice(-5)}`,
        memberId: 'DEMO',
        recipientEmail: testEmail.trim(),
        recipientName: 'Demo Valued Tenant',
        subject: 'Rent & Mess Due for November 2026',
        noticeType: 'RENT_DUE',
        amountDue: 1600,
        dueDate: '2026-11-05',
        sentAt: new Date().toISOString(),
        status: 'SUCCESS',
        messageId: res.messageId
      });

      setTestResult(`Test email dispatched successfully! Brevo Message ID: ${res.messageId}`);
      loadLogs();
    } else {
      setTestResult(`Failed: ${res.error}`);
    }

    setIsSendingTest(false);
  };

  const successLogsCount = logs.filter(l => l.status === 'SUCCESS').length;

  return (
    <div className="flex flex-col h-full bg-[#f4f2ee] select-none text-slate-800 font-sans">
      
      {/* 1. Header */}
      <div className="bg-[#005A9C] text-white px-3 py-1.5 flex items-center justify-between text-xs font-semibold shadow-xs border-b border-[#00487D]">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-[#FFB800]" />
          <span>FLT &bull; Automated Email Notice Dispatch Log &amp; Audit (MAIL)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded text-white font-mono">
            SUCCESS RATE: {logs.length > 0 ? Math.round((successLogsCount / logs.length) * 100) : 100}% ({successLogsCount}/{logs.length})
          </span>
          <button 
            onClick={loadLogs}
            className="flex items-center gap-1 bg-white/15 hover:bg-white/25 px-2 py-0.5 rounded cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      {/* 2. Test Email Dispatcher Tool */}
      <div className="p-3 bg-white border-b border-[#d0d0d0] shadow-2xs">
        <form onSubmit={handleSendTestEmail} className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 max-w-lg">
            <span className="font-bold text-slate-700 whitespace-nowrap">Live Test Dispatch:</span>
            <input 
              type="email"
              required
              placeholder="Enter email to test Rent Due template..."
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="flex-1 border border-slate-300 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white focus:border-[#005A9C] outline-none font-mono"
            />
            <button 
              type="submit"
              disabled={isSendingTest}
              className="flex items-center gap-1 bg-[#00A2E8] hover:bg-[#0089C7] disabled:opacity-50 text-white px-3 py-1.5 rounded font-bold cursor-pointer transition-all border border-[#007BB3] active:scale-95"
            >
              <Send className="w-3.5 h-3.5" /> {isSendingTest ? 'Sending...' : 'Send Sample Due Notice'}
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            Direct Brevo SMTP Integration Active
          </div>
        </form>

        {testResult && (
          <div className={`mt-2 p-2 rounded text-xs font-semibold ${
            testResult.startsWith('Failed') ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}>
            {testResult}
          </div>
        )}
      </div>

      {/* 3. Dispatched Notice Audit Table */}
      <div className="flex-1 p-3 overflow-auto">
        <div className="bg-white border border-[#a0a0a0] rounded shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#E4EEF8] border-b border-[#a0a0a0] text-[#003865] font-bold">
                <th className="py-2 px-3 border-r border-[#d0d0d0]">Timestamp</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0]">Notice Type</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0]">Recipient Name</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0]">Recipient Email</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0]">Subject</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0] text-right">Amount Mentioned</th>
                <th className="py-2 px-3 border-r border-[#d0d0d0] text-center">Status</th>
                <th className="py-2 px-3">Brevo Message ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500 font-medium">
                    <Mail className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No automated email notices dispatched yet. Use "Send Due Email" in the RENTD desk to notify tenants.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F0F7FD] transition-colors">
                    <td className="py-2 px-3 font-mono text-slate-600 border-r border-slate-200 text-[11px]">
                      {new Date(log.sentAt).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 font-bold border-r border-slate-200">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                        log.noticeType === 'PAYMENT_RECEIPT' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {log.noticeType}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-900 border-r border-slate-200">
                      {log.recipientName}
                    </td>
                    <td className="py-2 px-3 font-mono text-blue-700 border-r border-slate-200">
                      {log.recipientEmail}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-800 border-r border-slate-200">
                      {log.subject}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold border-r border-slate-200">
                      {log.amountDue ? `${log.amountDue} AED` : '&mdash;'}
                    </td>
                    <td className="py-2 px-3 text-center border-r border-slate-200">
                      {log.status === 'SUCCESS' ? (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-0.5 rounded font-bold text-[10px]">
                          <CheckCircle2 className="w-3 h-3 text-green-600" /> DELIVERED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-2 py-0.5 rounded font-bold text-[10px]">
                          <XCircle className="w-3 h-3 text-red-600" /> FAILED
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-500 truncate max-w-[200px]">
                      {log.messageId || log.error || 'N/A'}
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

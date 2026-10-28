import { useRef, useState } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  User, 
  FileText, 
  ArrowLeftRight, 
  Coins, 
  ShieldCheck, 
  Image as ImageIcon,
  Info,
  Check
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ReceivedRecord {
  id: number;
  entry_date?: string;
  agent_customer?: string;
  aed_amount: number | string;
  mode_of_txn?: string;
  utr_no?: string;
  cash_staff?: string;
  remaining_amount?: number | string | null;
  description?: string;
  created_by_name?: string;
  created_at?: string;
}

interface Props {
  record: ReceivedRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

// Convert numbers to words in English
function numberToWords(num: number): string {
  if (!num || isNaN(num) || num <= 0) return 'Zero';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertLessThanOneThousand(n: number): string {
    let s = '';
    if (n >= 100) {
      s += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      s += b[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      s += a[n] + ' ';
    }
    return s.trim();
  }

  const billion = Math.floor(num / 1000000000);
  num %= 1000000000;
  const million = Math.floor(num / 1000000);
  num %= 1000000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const remainder = Math.floor(num);

  let result = '';
  if (billion > 0) result += convertLessThanOneThousand(billion) + ' Billion ';
  if (million > 0) result += convertLessThanOneThousand(million) + ' Million ';
  if (thousand > 0) result += convertLessThanOneThousand(thousand) + ' Thousand ';
  if (remainder > 0) result += convertLessThanOneThousand(remainder) + ' ';

  return result.trim();
}

function formatAedInWords(amount: number): string {
  const whole = Math.floor(amount);
  const fils = Math.round((amount - whole) * 100);
  let str = `AED ${numberToWords(whole)}`;
  if (fils > 0) {
    str += ` and ${numberToWords(fils)} Fils`;
  }
  return `${str} Only`;
}

export default function ReceivedAedReceiptModal({ record, isOpen, onClose }: Props) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [downloadingJpg, setDownloadingJpg] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  if (!isOpen || !record) return null;

  const aedNum = parseFloat(String(record.aed_amount || 0));
  const remainingNum = record.remaining_amount != null ? parseFloat(String(record.remaining_amount)) : null;
  const formattedAmount = aedNum.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const referenceNo = record.utr_no && record.utr_no.trim() 
    ? record.utr_no.trim().toUpperCase() 
    : `AED-${String(record.id).padStart(8, '0')}`;
  
  const txnDate = record.entry_date
    ? record.entry_date.slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  // Download as JPG
  const handleDownloadJpg = async () => {
    if (!receiptRef.current) return;
    try {
      setDownloadingJpg(true);
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const image = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.href = image;
      link.download = `Finacle_Receipt_${referenceNo}_${txnDate}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to generate JPG receipt:', err);
      alert('Could not generate JPG. Please try again.');
    } finally {
      setDownloadingJpg(false);
    }
  };

  // Download as PDF
  const handleDownloadPdf = async () => {
    if (!receiptRef.current) return;
    try {
      setDownloadingPdf(true);
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20; // 10mm margins on sides
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Position centered vertically if fits on single page
      const posY = imgHeight < pdfHeight ? 12 : 8;

      pdf.addImage(imgData, 'JPEG', 10, posY, imgWidth, imgHeight);
      pdf.save(`Finacle_Receipt_${referenceNo}_${txnDate}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF receipt:', err);
      alert('Could not generate PDF. Please try again.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Direct Browser Print
  const handlePrint = () => {
    if (!receiptRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print receipt.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Finacle Receipt - ${referenceNo}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              body { margin: 0; padding: 20px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              @page { size: auto; margin: 10mm; }
            }
          </style>
        </head>
        <body class="bg-white flex justify-center">
          <div style="width: 100%; max-width: 800px;">
            ${receiptRef.current.innerHTML}
          </div>
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Control Bar */}
        <div className="px-5 py-3 bg-[#0d2a4d] text-white flex items-center justify-between border-b border-[#164070]">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#38bdf8]" />
            <div>
              <h3 className="text-sm font-bold tracking-wide leading-tight">Official Collection Receipt Preview</h3>
              <p className="text-[11px] text-gray-300 font-normal">Reference: <span className="font-mono text-cyan-300 font-semibold">{referenceNo}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold rounded shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Download as PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloadingPdf ? 'Exporting...' : 'Download PDF'}</span>
            </button>

            <button
              onClick={handleDownloadJpg}
              disabled={downloadingJpg}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0f766e] hover:bg-[#115e59] text-white text-xs font-semibold rounded shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Download as JPG"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{downloadingJpg ? 'Exporting...' : 'Download JPG'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="p-1.5 text-gray-200 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer ml-1"
              title="Print Receipt"
            >
              <Printer className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-white/20 mx-1"></div>

            <button
              onClick={onClose}
              className="p-1 text-gray-300 hover:text-white hover:bg-red-600 rounded transition-colors cursor-pointer"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Canvas Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#f1f5f9] flex justify-center">
          
          {/* THE RECEIPT ELEMENT (Pixel-perfect recreation of reference template) */}
          <div
            ref={receiptRef}
            className="bg-white w-full max-w-[720px] rounded-lg p-7 border border-[#e2e8f0] shadow-sm flex flex-col gap-5 text-gray-800"
            style={{ fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
          >
            {/* 1. Header: Brand and Reference */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-5">
              <div>
                <h1 className="text-[28px] font-black text-[#0f3d7a] tracking-tight leading-none mb-1">
                  Finacle Receipt
                </h1>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-1">
                  COLLECTION VOUCHER
                </p>
                <div className="w-10 h-1 bg-[#1d63b8] rounded-full mt-2.5"></div>
              </div>

              <div className="text-right border-l-2 border-[#1d63b8]/20 pl-5">
                <span className="text-[10px] font-bold tracking-wider text-gray-400 block uppercase">
                  REFERENCE NO.
                </span>
                <span className="text-[17px] font-black font-mono text-[#0f3d7a] block tracking-tight">
                  {referenceNo}
                </span>
                <span className="text-[10px] font-bold tracking-wider text-gray-400 block uppercase mt-2">
                  TRANSACTION DATE
                </span>
                <span className="text-[13px] font-bold text-gray-800 block">
                  {txnDate}
                </span>
              </div>
            </div>

            {/* 2. Success Banner with Amount Highlight */}
            <div className="bg-[#f0f7ff] border border-[#cbe4fe] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-[#1677ff] text-white flex items-center justify-center shadow-md shrink-0">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <div>
                  <h2 className="text-[17px] font-extrabold text-[#0f3d7a] leading-tight">
                    Transaction Successful
                  </h2>
                  <p className="text-[12px] text-gray-600 mt-0.5">
                    The amount has been successfully received and recorded in the register.
                  </p>
                </div>
              </div>

              <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-[#cbe4fe] pt-3 sm:pt-0 sm:pl-5">
                <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase block">
                  TOTAL AMOUNT RECEIVED
                </span>
                <span className="text-[26px] font-black text-[#0f3d7a] tracking-tight whitespace-nowrap block">
                  {formattedAmount} <span className="text-base font-bold text-[#1d63b8]">AED</span>
                </span>
              </div>
            </div>

            {/* 3. Two Information Cards Side-by-Side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Left Card: Customer / Agent Details */}
              <div className="bg-[#f6faff] border border-[#d6e7fc] rounded-xl p-4 flex flex-col">
                <div className="flex items-center gap-2 text-[#0f3d7a] font-extrabold text-[12px] tracking-wide uppercase border-b border-[#d6e7fc] pb-2.5 mb-3">
                  <div className="w-5 h-5 rounded-full bg-[#1677ff] text-white flex items-center justify-center shrink-0">
                    <User className="w-3 h-3 stroke-[2.5]" />
                  </div>
                  <span>CUSTOMER / AGENT DETAILS</span>
                </div>

                <div className="space-y-2 text-[12px]">
                  <div className="grid grid-cols-[110px_12px_1fr] items-start">
                    <span className="text-gray-500 font-medium">Customer Name</span>
                    <span className="text-gray-400 font-bold">:</span>
                    <span className="font-bold text-gray-900 uppercase break-words">
                      {record.agent_customer || 'Direct Collection'}
                    </span>
                  </div>

                  <div className="grid grid-cols-[110px_12px_1fr] items-center">
                    <span className="text-gray-500 font-medium">Collection Mode</span>
                    <span className="text-gray-400 font-bold">:</span>
                    <span className="font-semibold text-gray-800">
                      {record.mode_of_txn || 'Standard'}
                    </span>
                  </div>

                  {record.cash_staff && (
                    <div className="grid grid-cols-[110px_12px_1fr] items-center">
                      <span className="text-gray-500 font-medium">Staff Collector</span>
                      <span className="text-gray-400 font-bold">:</span>
                      <span className="font-semibold text-gray-800 uppercase">
                        {record.cash_staff}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-[110px_12px_1fr] items-start">
                    <span className="text-gray-500 font-medium">Description</span>
                    <span className="text-gray-400 font-bold">:</span>
                    <span className="text-gray-700 italic break-words">
                      {record.description || 'Received AED Collection settlement'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Card: Transaction Details */}
              <div className="bg-[#f6faff] border border-[#d6e7fc] rounded-xl p-4 flex flex-col">
                <div className="flex items-center gap-2 text-[#0f3d7a] font-extrabold text-[12px] tracking-wide uppercase border-b border-[#d6e7fc] pb-2.5 mb-3">
                  <div className="w-5 h-5 rounded-full bg-[#1677ff] text-white flex items-center justify-center shrink-0">
                    <FileText className="w-3 h-3 stroke-[2.5]" />
                  </div>
                  <span>TRANSACTION DETAILS</span>
                </div>

                <div className="space-y-2 text-[12px]">
                  <div className="grid grid-cols-[110px_12px_1fr] items-center">
                    <span className="text-gray-500 font-medium">Transaction Type</span>
                    <span className="text-gray-400 font-bold">:</span>
                    <span className="font-semibold text-gray-800">Received AED</span>
                  </div>

                  <div className="grid grid-cols-[110px_12px_1fr] items-center">
                    <span className="text-gray-500 font-medium">Payment Mode</span>
                    <span className="text-gray-400 font-bold">:</span>
                    <span className="font-bold text-[#0f3d7a]">
                      {record.mode_of_txn || 'N/A'}
                    </span>
                  </div>

                  <div className="grid grid-cols-[110px_12px_1fr] items-center">
                    <span className="text-gray-500 font-medium">Channel</span>
                    <span className="text-gray-400 font-bold">:</span>
                    <span className="font-semibold text-gray-800">Universal Register</span>
                  </div>

                  <div className="grid grid-cols-[110px_12px_1fr] items-center">
                    <span className="text-gray-500 font-medium">Transaction Date</span>
                    <span className="text-gray-400 font-bold">:</span>
                    <span className="font-semibold text-gray-800">{txnDate}</span>
                  </div>

                  <div className="grid grid-cols-[110px_12px_1fr] items-center">
                    <span className="text-gray-500 font-medium">Status</span>
                    <span className="text-gray-400 font-bold">:</span>
                    <span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide bg-[#e6f7ed] text-[#0f5132] border border-[#a3e6be]">
                        <Check className="w-2.5 h-2.5 stroke-[3]" /> VERIFIED
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Table: UTR / Payment Breakdown */}
            <div className="border border-[#cbe4fe] rounded-xl overflow-hidden">
              <div className="bg-[#1677ff] px-4 py-2 text-white flex items-center gap-2 font-extrabold text-[12px] tracking-wide uppercase">
                <div className="w-5 h-5 rounded-full bg-white text-[#1677ff] flex items-center justify-center shrink-0">
                  <ArrowLeftRight className="w-3 h-3 stroke-[2.5]" />
                </div>
                <span>UTR / PAYMENT BREAKDOWN</span>
              </div>

              <table className="w-full text-left text-[12px] border-collapse">
                <thead>
                  <tr className="bg-[#f0f7ff] text-[#0f3d7a] font-bold border-b border-[#cbe4fe]">
                    <th className="px-4 py-2 w-12 text-center">#</th>
                    <th className="px-4 py-2">UTR Number / Reference</th>
                    <th className="px-4 py-2">Mode / Particulars</th>
                    <th className="px-4 py-2 text-right">Amount (AED)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-center text-gray-500 font-medium">1</td>
                    <td className="px-4 py-3 font-mono font-semibold text-gray-900">
                      {record.utr_no && record.utr_no.trim() ? record.utr_no.trim() : referenceNo}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      Collection via {record.mode_of_txn || 'Register'}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-[#0f3d7a]">
                      {formattedAmount}
                    </td>
                  </tr>
                  {remainingNum !== null && (
                    <tr className="bg-amber-50/40 text-[11px]">
                      <td className="px-4 py-2 text-center text-amber-700 font-bold">•</td>
                      <td className="px-4 py-2 text-amber-900 font-medium" colSpan={2}>
                        Unallocated / Remaining Balance on Agent
                      </td>
                      <td className="px-4 py-2 text-right font-bold text-amber-800">
                        {remainingNum.toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 5. Summary Strip: Coins, Amount & Total in Words */}
            <div className="bg-[#f0f7ff] border border-[#cbe4fe] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1677ff] text-white flex items-center justify-center shrink-0">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-gray-500 uppercase block">
                    Total Amount Received
                  </span>
                  <span className="text-[20px] font-black text-[#0f3d7a] tracking-tight block">
                    {formattedAmount} <span className="text-sm font-bold text-[#1d63b8]">AED</span>
                  </span>
                </div>
              </div>

              <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-[#cbe4fe] pt-2 sm:pt-0 sm:pl-4 sm:max-w-xs">
                <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase block">
                  Total in Words
                </span>
                <span className="text-[12px] font-extrabold text-[#0f3d7a] tracking-tight leading-snug block">
                  {formatAedInWords(aedNum)}
                </span>
              </div>
            </div>

            {/* 6. Clean Generic Footer (No company details or logo per request) */}
            <div className="border-t border-gray-100 pt-4 mt-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] text-gray-500">
              <div className="flex items-start gap-2 max-w-md">
                <Info className="w-4 h-4 text-[#1677ff] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-gray-700 block font-semibold">Important Information</strong>
                  <span>This is a computer-generated transaction receipt. Please retain this receipt for your settlement records.</span>
                </div>
              </div>

              <div className="sm:text-right">
                <strong className="text-[#0f3d7a] block font-extrabold text-xs">Thank You</strong>
                <span className="text-gray-400 text-[10px]">Verified Transaction Register</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

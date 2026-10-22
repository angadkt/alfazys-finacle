import { useState, useEffect, useMemo } from 'react';
import FinacleDatePicker from './FinacleDatePicker';
import api from '../services/api';
import { FileSpreadsheet, FileText, RefreshCw, Eye, ArrowUpDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PendingRecord {
  party_id: string | number | null;
  party_name: string;
  cif_no: string;
  mobile_no: string;
  order_count: number;
  booked_aed: number;
  booked_inr: number;
  received_aed: number;
  pending_aed: number;
  collection_rate_pct: number;
  status: 'uncollected' | 'partial' | 'settled';
  earliest_order_date: string | null;
  latest_order_date: string | null;
  received_entries_count: number;
}

interface SummaryData {
  total_booked_aed: number;
  total_received_aed: number;
  total_pending_aed: number;
  collection_rate_pct: number;
  total_agents_count: number;
  pending_agents_count: number;
}

export default function PendingAedReportScreen() {
  const [records, setRecords] = useState<PendingRecord[]>([]);
  const [summary, setSummary] = useState<SummaryData>({
    total_booked_aed: 0,
    total_received_aed: 0,
    total_pending_aed: 0,
    collection_rate_pct: 0,
    total_agents_count: 0,
    pending_agents_count: 0,
  });
  const [loading, setLoading] = useState(false);

  // Filters
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [agentSearch, setAgentSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('pending_only');
  const [sortBy, setSortBy] = useState<'pending_desc' | 'pending_asc' | 'booked_desc' | 'name_asc'>('pending_desc');

  // Agent suggestions list
  const [customers, setCustomers] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const res = await api.get('/records/parties');
        const list = (res.data?.records || []).map((c: any) => ({
          id: c.cif_no || c.id,
          name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.short_name || c.cif_no || 'Unknown',
        }));
        setCustomers(list);
      } catch (err) {
        console.error('Failed to load customers for suggestions:', err);
      }
    };
    loadCustomers();
  }, []);

  // Drilldown Modal
  const [selectedParty, setSelectedParty] = useState<PendingRecord | null>(null);
  const [partyDetails, setPartyDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [isExporting, setIsExporting] = useState<'excel' | 'pdf' | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      if (agentSearch.trim()) params.agent = agentSearch.trim();
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await api.get('/records/reports/pending-aed', { params });
      setRecords(res.data?.records || []);
      if (res.data?.summary) {
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.error('Failed to load pending AED report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [fromDate, toDate, statusFilter]);

  // Debounced agent search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReport();
    }, 350);
    return () => clearTimeout(timer);
  }, [agentSearch]);

  const handleOpenPartyDetails = async (rec: PendingRecord) => {
    if (!rec.party_id) return;
    setSelectedParty(rec);
    setLoadingDetails(true);
    try {
      const params: any = { party_id: rec.party_id };
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      const res = await api.get('/records/reports/pending-aed/details', { params });
      setPartyDetails(res.data);
    } catch (err) {
      console.error('Failed to load party details:', err);
      alert('Could not load detailed statement for this party.');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Sorted records
  const sortedRecords = useMemo(() => {
    const list = [...records];
    if (sortBy === 'pending_desc') {
      return list.sort((a, b) => b.pending_aed - a.pending_aed || b.booked_aed - a.booked_aed);
    }
    if (sortBy === 'pending_asc') {
      return list.sort((a, b) => a.pending_aed - b.pending_aed);
    }
    if (sortBy === 'booked_desc') {
      return list.sort((a, b) => b.booked_aed - a.booked_aed);
    }
    if (sortBy === 'name_asc') {
      return list.sort((a, b) => a.party_name.localeCompare(b.party_name));
    }
    return list;
  }, [records, sortBy]);

  const dateRangeLabel = useMemo(() => {
    if (fromDate && toDate) {
      if (fromDate === toDate) return fromDate;
      return `${fromDate} to ${toDate}`;
    }
    if (fromDate) return `From ${fromDate}`;
    if (toDate) return `Up to ${toDate}`;
    return 'All Time';
  }, [fromDate, toDate]);

  // Quick Date presets
  const handleSetToday = () => {
    const today = new Date().toLocaleDateString('en-CA');
    setFromDate(today);
    setToDate(today);
  };

  const handleSetThisMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('en-CA');
    const today = now.toLocaleDateString('en-CA');
    setFromDate(firstDay);
    setToDate(today);
  };

  const handleClearDates = () => {
    setFromDate('');
    setToDate('');
  };

  // Export to Excel
  const handleDownloadExcel = () => {
    if (sortedRecords.length === 0) {
      alert('No records available to export.');
      return;
    }
    setIsExporting('excel');
    try {
      const headerRows = [
        ['INFAZYS FINACLE CORE BANKING PLATFORM - UNIVERSAL SETTLEMENT MODULE'],
        ['OUTSTANDING PENDING AED COLLECTION REPORT'],
        [`Generated: ${new Date().toLocaleString('en-GB')}  |  Date Period: ${dateRangeLabel}  |  Status Filter: ${statusFilter.toUpperCase()}`],
        [`Total Booked: ${summary.total_booked_aed.toLocaleString()} AED  |  Total Collected: ${summary.total_received_aed.toLocaleString()} AED  |  Total Pending: ${summary.total_pending_aed.toLocaleString()} AED`],
        []
      ];

      const tableData = sortedRecords.map((r, i) => [
        i + 1,
        r.cif_no || '—',
        r.party_name,
        r.mobile_no || '—',
        r.order_count,
        r.booked_aed,
        r.received_aed,
        r.pending_aed,
        `${r.collection_rate_pct.toFixed(1)}%`,
        r.status.toUpperCase(),
        r.latest_order_date || '—',
      ]);

      const totalsRow = [
        'TOTALS',
        '',
        `${sortedRecords.length} Parties Listed`,
        '',
        sortedRecords.reduce((s, r) => s + r.order_count, 0),
        summary.total_booked_aed,
        summary.total_received_aed,
        summary.total_pending_aed,
        `${summary.collection_rate_pct.toFixed(1)}%`,
        `${summary.pending_agents_count} Pending`,
        ''
      ];

      const columns = [
        '#',
        'CIF No',
        'Agent / Customer Name',
        'Mobile No',
        'Orders Count',
        'Booked AED',
        'Collected AED',
        'Pending to Collect (AED)',
        'Collection %',
        'Status',
        'Last Order Date'
      ];

      const worksheet = XLSX.utils.aoa_to_sheet([...headerRows, columns, ...tableData, totalsRow]);
      worksheet['!cols'] = [
        { wch: 6 },
        { wch: 14 },
        { wch: 30 },
        { wch: 16 },
        { wch: 14 },
        { wch: 18 },
        { wch: 18 },
        { wch: 22 },
        { wch: 15 },
        { wch: 15 },
        { wch: 16 }
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Pending AED Collection');
      XLSX.writeFile(workbook, `Pending_AED_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err: any) {
      alert('Failed to export Excel: ' + err.message);
    } finally {
      setIsExporting(null);
    }
  };

  // Export to PDF
  const handleDownloadPdf = () => {
    if (sortedRecords.length === 0) {
      alert('No records available to export.');
      return;
    }
    setIsExporting('pdf');
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      doc.setFont('helvetica');

      // Header Banner
      doc.setFillColor(30, 70, 118);
      doc.rect(0, 0, 297, 18, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('FINCORE Universal Settlement Module', 14, 11);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Pending AED Collection Register • ${dateRangeLabel}`, 180, 11);

      // KPI summary sub-bar
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(9);
      doc.text(
        `Total Booked: ${summary.total_booked_aed.toLocaleString()} AED   |   Total Collected: ${summary.total_received_aed.toLocaleString()} AED   |   Total Outstanding: ${summary.total_pending_aed.toLocaleString()} AED   |   Agents Due: ${summary.pending_agents_count}`,
        14,
        25
      );

      const tableData = sortedRecords.map((r, i) => [
        i + 1,
        r.cif_no || '—',
        r.party_name,
        r.order_count,
        `${r.booked_aed.toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED`,
        `${r.received_aed.toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED`,
        `${r.pending_aed.toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED`,
        `${r.collection_rate_pct.toFixed(1)}%`,
        r.status.toUpperCase(),
        r.latest_order_date || '—'
      ]);

      autoTable(doc, {
        head: [['#', 'CIF', 'Agent / Customer', 'Orders', 'Booked AED', 'Collected AED', 'Pending AED', 'Col. %', 'Status', 'Last Order']],
        body: tableData,
        startY: 29,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [30, 70, 118], textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: {
          4: { halign: 'right', fontStyle: 'bold' },
          5: { halign: 'right' },
          6: { halign: 'right', fontStyle: 'bold', textColor: [180, 30, 30] },
          7: { halign: 'center' },
          8: { halign: 'center' },
        },
        foot: [[
          'Total',
          '',
          `${sortedRecords.length} Parties`,
          sortedRecords.reduce((s, r) => s + r.order_count, 0),
          `${summary.total_booked_aed.toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED`,
          `${summary.total_received_aed.toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED`,
          `${summary.total_pending_aed.toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED`,
          `${summary.collection_rate_pct.toFixed(1)}%`,
          `${summary.pending_agents_count} Pending`,
          ''
        ]],
        footStyles: { fillColor: [240, 244, 250], textColor: [30, 70, 118], fontStyle: 'bold' }
      });

      doc.save(`Pending_AED_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err: any) {
      alert('Failed to export PDF: ' + err.message);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="flex-1 bg-[#d4d0c8] flex flex-col h-full overflow-hidden select-none" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
      {/* Title Bar */}
      <div className="bg-[#e4e4e4] border-b border-[#a0a0a0] px-3 py-2 flex items-center justify-between shadow-xs">
        <div>
          <h4 className="text-[15px] font-extrabold text-black m-0 capitalize tracking-wide flex items-center gap-2">
            <span>Pending AED Collection Register & Aging Report</span>
            <span className="bg-[#b91c1c] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Receivables
            </span>
          </h4>
          <span className="text-[11px] text-gray-600">
            FINCORE Universal Settlement Module • Agent & Customer Outstanding Balance Ledger
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadExcel}
            disabled={isExporting !== null || loading || sortedRecords.length === 0}
            className="flex items-center gap-1.5 border border-[#c4d4ec] bg-white hover:bg-[#edf7ed] text-[#1e6e38] disabled:opacity-50 disabled:cursor-not-allowed px-2.5 py-1.5 rounded text-xs font-bold shadow-xs cursor-pointer"
            title="Export Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#2e7d32]" />
            <span>{isExporting === 'excel' ? 'Exporting...' : 'Excel'}</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isExporting !== null || loading || sortedRecords.length === 0}
            className="flex items-center gap-1.5 border border-[#c4d4ec] bg-white hover:bg-[#fdf2f2] text-[#b91c1c] disabled:opacity-50 disabled:cursor-not-allowed px-2.5 py-1.5 rounded text-xs font-bold shadow-xs cursor-pointer"
            title="Export PDF"
          >
            <FileText className="w-3.5 h-3.5 text-[#d32f2f]" />
            <span>{isExporting === 'pdf' ? 'Generating...' : 'PDF'}</span>
          </button>

          <button
            onClick={fetchReport}
            className="bg-[#1e4676] text-white font-bold text-[12px] px-3 py-1.5 rounded shadow-xs hover:bg-[#15345b] flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 bg-white border border-[#a0a0a0] m-1 flex flex-col overflow-hidden">
        {/* Navigator Action Strip */}
        <div className="flex items-center gap-3 px-3 py-1.5 bg-[#f8f9fa] border-b border-[#a0a0a0] text-[#1e4676] font-bold text-[11px]">
          <span className="cursor-pointer text-[14px] leading-none hover:text-[#0a244d]">↗</span>
          <div className="border-l-[2px] border-dotted border-[#8f8f9d] h-3"></div>
          <span>Active Period: <strong className="text-gray-800">{dateRangeLabel}</strong></span>
          <div className="border-l-[2px] border-dotted border-[#8f8f9d] h-3"></div>
          <span>Total Outstanding: <strong className="text-[#b91c1c]">{summary.total_pending_aed.toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED</strong></span>
          <div className="border-l-[2px] border-dotted border-[#8f8f9d] h-3"></div>
          <span>Pending Agents: <strong className="text-[#b45309]">{summary.pending_agents_count}</strong> of {summary.total_agents_count}</span>
        </div>

        {/* Executive KPI Cards (4 Cards) */}
        <div className="p-3 bg-[#f8fafc] border-b border-[#e4e4e4] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Card 1: Total Pending to Collect */}
          <div className="bg-[#fef2f2] border border-[#fca5a5] rounded p-2.5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#991b1b]">
              <span>TOTAL OUTSTANDING PENDING</span>
              <span className="bg-[#fee2e2] px-1.5 py-0.5 rounded text-[10px] text-[#b91c1c] font-extrabold">
                {summary.pending_agents_count} AGENTS DUE
              </span>
            </div>
            <div className="text-[18px] font-black text-[#991b1b] font-mono mt-1">
              {summary.total_pending_aed.toLocaleString('en-AE', { minimumFractionDigits: 2 })} <span className="text-[12px]">AED</span>
            </div>
            <span className="text-[10px] text-gray-500 mt-0.5">
              Net balance to collect across all orders
            </span>
          </div>

          {/* Card 2: Total Booked Orders */}
          <div className="bg-[#f0f4f8] border border-[#c4d4ec] rounded p-2.5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#1e4676]">
              <span>TOTAL BOOKED ORDERS</span>
              <span className="bg-[#e2ebf6] px-1.5 py-0.5 rounded text-[10px] text-[#1e4676] font-bold">
                {records.reduce((s, r) => s + r.order_count, 0)} ORDERS
              </span>
            </div>
            <div className="text-[18px] font-black text-[#1e4676] font-mono mt-1">
              {summary.total_booked_aed.toLocaleString('en-AE', { minimumFractionDigits: 2 })} <span className="text-[12px]">AED</span>
            </div>
            <span className="text-[10px] text-gray-500 mt-0.5">
              Gross remittance orders booked in period
            </span>
          </div>

          {/* Card 3: Total Collected AED */}
          <div className="bg-[#f0fdf4] border border-[#86efac] rounded p-2.5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#166534]">
              <span>TOTAL RECEIVED / COLLECTED</span>
              <span className="bg-[#dcfce7] px-1.5 py-0.5 rounded text-[10px] text-[#166534] font-bold">
                SETTLED
              </span>
            </div>
            <div className="text-[18px] font-black text-[#166534] font-mono mt-1">
              {summary.total_received_aed.toLocaleString('en-AE', { minimumFractionDigits: 2 })} <span className="text-[12px]">AED</span>
            </div>
            <span className="text-[10px] text-gray-500 mt-0.5">
              Verified receipts credited in CDM/Cash/Bank
            </span>
          </div>

          {/* Card 4: Overall Collection Rate */}
          <div className="bg-[#f8fafc] border border-[#cbd5e1] rounded p-2.5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#334155]">
              <span>COLLECTION PERFORMANCE</span>
              <span className="text-[11px] font-extrabold text-[#1e4676]">
                {summary.collection_rate_pct.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden mt-1.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  summary.collection_rate_pct >= 90
                    ? 'bg-[#16a34a]'
                    : summary.collection_rate_pct >= 60
                    ? 'bg-[#2563eb]'
                    : summary.collection_rate_pct >= 30
                    ? 'bg-[#f59e0b]'
                    : 'bg-[#dc2626]'
                }`}
                style={{ width: `${Math.min(100, summary.collection_rate_pct)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[9.5px] text-gray-500 mt-1">
              <span>Collected: {summary.collection_rate_pct.toFixed(1)}%</span>
              <span className="text-[#b91c1c] font-bold">Outstanding: {(100 - summary.collection_rate_pct).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Filters Strip */}
        <div className="p-3 bg-white flex flex-wrap items-center justify-between gap-3 border-b border-[#e4e4e4]">
          <div className="flex flex-wrap items-center gap-2">
            {/* From - To Date Pickers */}
            <div className="flex items-center gap-1.5 bg-[#f0f4f8] border border-[#c4d4ec] px-2 py-1 rounded">
              <span className="text-[#1e4676] font-bold text-[11px]">From:</span>
              <FinacleDatePicker
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-white border border-[#c4d4ec] rounded px-1.5 py-0.5 text-xs text-gray-700 min-w-[110px] h-[26px]"
              />

              <span className="text-[#1e4676] font-bold text-[11px] ml-0.5">To:</span>
              <FinacleDatePicker
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-white border border-[#c4d4ec] rounded px-1.5 py-0.5 text-xs text-gray-700 min-w-[110px] h-[26px]"
              />

              <div className="flex items-center gap-1 ml-1 border-l border-[#c4d4ec] pl-1.5">
                <button
                  type="button"
                  onClick={handleSetToday}
                  className="bg-[#1e4676] hover:bg-[#15345b] text-white px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={handleSetThisMonth}
                  className="bg-white border border-[#c4d4ec] text-[#1e4676] hover:bg-[#eaf0f8] px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer"
                >
                  This Month
                </button>
                {(fromDate || toDate) && (
                  <button
                    type="button"
                    onClick={handleClearDates}
                    className="text-gray-400 hover:text-red-600 font-bold text-xs px-1 cursor-pointer"
                    title="Clear Dates (All Time)"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Agent Search Filter */}
            <div className="flex items-center gap-1 bg-[#f0f4f8] border border-[#c4d4ec] px-2 py-1 rounded">
              <span className="text-[#1e4676] font-bold text-[11px]">Agent:</span>
              <input
                type="text"
                list="pending-aed-agent-list"
                value={agentSearch}
                onChange={(e) => setAgentSearch(e.target.value)}
                placeholder="Search Agent / CIF..."
                className="bg-white border border-[#c4d4ec] rounded px-2 py-0.5 text-xs text-gray-700 w-[160px] h-[26px] focus:outline-none focus:border-[#1e4676]"
              />
              <datalist id="pending-aed-agent-list">
                {customers.map((c) => (
                  <option key={c.id} value={`${c.name} (${c.id})`} />
                ))}
              </datalist>
              {agentSearch && (
                <button
                  type="button"
                  onClick={() => setAgentSearch('')}
                  className="text-gray-400 hover:text-red-500 font-bold text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-[#f0f4f8] border border-[#c4d4ec] px-2 py-1 rounded">
              <span className="text-[#1e4676] font-bold text-[11px]">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-[#c4d4ec] rounded px-1.5 py-0.5 text-xs text-gray-700 focus:outline-none focus:border-[#1e4676] h-[26px]"
              >
                <option value="pending_only">Pending Collection Only</option>
                <option value="all">All Statuses</option>
                <option value="uncollected">Uncollected (0%)</option>
                <option value="partial">Partially Collected</option>
                <option value="settled">Fully Settled / 100%</option>
              </select>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center gap-1 bg-[#f0f4f8] border border-[#c4d4ec] px-2 py-1 rounded">
              <ArrowUpDown className="w-3 h-3 text-[#1e4676]" />
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-white border border-[#c4d4ec] rounded px-1.5 py-0.5 text-xs text-gray-700 focus:outline-none focus:border-[#1e4676] h-[26px]"
              >
                <option value="pending_desc">Pending AED: Highest First</option>
                <option value="pending_asc">Pending AED: Lowest First</option>
                <option value="booked_desc">Booked AED: Highest First</option>
                <option value="name_asc">Agent Name: A to Z</option>
              </select>
            </div>
          </div>

          <span className="text-[11px] text-gray-500 font-medium">
            Showing <strong className="text-[#1e4676]">{sortedRecords.length}</strong> agent record{sortedRecords.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto bg-white">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
              <RefreshCw className="w-4 h-4 mr-2 animate-spin text-[#1e4676]" />
              Loading Pending AED report data...
            </div>
          ) : sortedRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <span className="text-lg font-bold text-[#1e4676] mb-1">No Pending AED Records Found</span>
              <span className="text-xs text-gray-400 mb-3">
                {statusFilter === 'pending_only'
                  ? 'All agents are currently settled with zero pending balance in this period.'
                  : 'Try adjusting the date range or search filter.'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setFromDate('');
                  setToDate('');
                  setAgentSearch('');
                }}
                className="bg-[#1e4676] text-white text-xs font-bold px-4 py-1.5 rounded hover:bg-[#15345b] cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr className="bg-[#1e4676] text-white text-left sticky top-0 z-10 shadow-xs">
                  <th className="px-3 py-2 font-semibold border-r border-[#2a5a9a] whitespace-nowrap">#</th>
                  <th className="px-3 py-2 font-semibold border-r border-[#2a5a9a] whitespace-nowrap">CIF No</th>
                  <th className="px-3 py-2 font-semibold border-r border-[#2a5a9a] whitespace-nowrap">Agent / Customer Name</th>
                  <th className="px-3 py-2 font-semibold border-r border-[#2a5a9a] whitespace-nowrap text-center">Orders</th>
                  <th className="px-3 py-2 font-semibold border-r border-[#2a5a9a] whitespace-nowrap text-right">Booked AED</th>
                  <th className="px-3 py-2 font-semibold border-r border-[#2a5a9a] whitespace-nowrap text-right">Collected AED</th>
                  <th className="px-3 py-2 font-semibold border-r border-[#2a5a9a] whitespace-nowrap text-right">Pending to Collect (AED)</th>
                  <th className="px-3 py-2 font-semibold border-r border-[#2a5a9a] whitespace-nowrap text-center min-w-[120px]">Collection %</th>
                  <th className="px-3 py-2 font-semibold border-r border-[#2a5a9a] whitespace-nowrap text-center">Status</th>
                  <th className="px-3 py-2 font-semibold whitespace-nowrap text-center">Statement</th>
                </tr>
              </thead>
              <tbody>
                {sortedRecords.map((rec, i) => {
                  const isSettled = rec.status === 'settled';
                  const isPartial = rec.status === 'partial';

                  return (
                    <tr
                      key={rec.party_id || `rec-${i}`}
                      className={`border-b border-[#e4e4e4] hover:bg-[#f0f5ff] transition-colors ${
                        i % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'
                      }`}
                    >
                      <td className="px-3 py-2 border-r border-[#e4e4e4] text-gray-500">
                        {i + 1}
                      </td>

                      <td className="px-3 py-2 border-r border-[#e4e4e4] font-mono text-gray-700 font-semibold whitespace-nowrap">
                        {rec.cif_no || <span className="text-gray-400 font-sans font-normal">—</span>}
                      </td>

                      <td className="px-3 py-2 border-r border-[#e4e4e4]">
                        <div className="font-bold text-gray-900">{rec.party_name}</div>
                        {rec.mobile_no && <span className="text-[10px] text-gray-500 font-mono">{rec.mobile_no}</span>}
                      </td>

                      <td className="px-3 py-2 border-r border-[#e4e4e4] text-center font-bold text-gray-700">
                        <span className="bg-[#eaf0f8] px-2 py-0.5 rounded text-[11px] text-[#1e4676]">
                          {rec.order_count}
                        </span>
                      </td>

                      <td className="px-3 py-2 border-r border-[#e4e4e4] text-right font-mono font-bold text-[#1e4676] whitespace-nowrap">
                        {rec.booked_aed.toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED
                      </td>

                      <td className="px-3 py-2 border-r border-[#e4e4e4] text-right font-mono font-bold text-[#166534] whitespace-nowrap">
                        {rec.received_aed.toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED
                      </td>

                      <td className="px-3 py-2 border-r border-[#e4e4e4] text-right font-mono font-black whitespace-nowrap">
                        {rec.pending_aed > 0 ? (
                          <span className="text-[#b91c1c] bg-[#fef2f2] px-2 py-0.5 rounded border border-[#fecaca]">
                            {rec.pending_aed.toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED
                          </span>
                        ) : (
                          <span className="text-[#16a34a] font-bold">0.00 AED</span>
                        )}
                      </td>

                      <td className="px-3 py-2 border-r border-[#e4e4e4]">
                        <div className="flex flex-col gap-1 items-center">
                          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isSettled ? 'bg-[#16a34a]' : isPartial ? 'bg-[#2563eb]' : 'bg-[#dc2626]'
                              }`}
                              style={{ width: `${Math.min(100, rec.collection_rate_pct)}%` }}
                            ></div>
                          </div>
                          <span className="text-[10px] font-bold text-gray-600">
                            {rec.collection_rate_pct.toFixed(1)}%
                          </span>
                        </div>
                      </td>

                      <td className="px-3 py-2 border-r border-[#e4e4e4] text-center whitespace-nowrap">
                        {isSettled ? (
                          <span className="bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0] px-2 py-0.5 rounded text-[10px] font-extrabold uppercase">
                            Settled
                          </span>
                        ) : isPartial ? (
                          <span className="bg-[#fef3c7] text-[#b45309] border border-[#fde68a] px-2 py-0.5 rounded text-[10px] font-extrabold uppercase">
                            Partial
                          </span>
                        ) : (
                          <span className="bg-[#fee2e2] text-[#b91c1c] border border-[#fecaca] px-2 py-0.5 rounded text-[10px] font-extrabold uppercase">
                            Uncollected
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        {rec.party_id ? (
                          <button
                            type="button"
                            onClick={() => handleOpenPartyDetails(rec)}
                            className="bg-[#1e4676] hover:bg-[#15345b] text-white px-2.5 py-1 rounded text-[11px] font-bold shadow-xs cursor-pointer inline-flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Statement</span>
                          </button>
                        ) : (
                          <span className="text-gray-400 text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#eef2f9] font-bold text-[#1e4676] border-t-2 border-[#c4d4ec] sticky bottom-0 z-10 shadow-xs">
                  <td className="px-3 py-2 border-r border-[#c4d4ec]" colSpan={3}>
                    Report Total ({sortedRecords.length} parties displayed)
                  </td>
                  <td className="px-3 py-2 border-r border-[#c4d4ec] text-center">
                    {sortedRecords.reduce((s, r) => s + r.order_count, 0)}
                  </td>
                  <td className="px-3 py-2 border-r border-[#c4d4ec] text-right text-[#1e4676] font-mono whitespace-nowrap">
                    {sortedRecords.reduce((s, r) => s + r.booked_aed, 0).toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED
                  </td>
                  <td className="px-3 py-2 border-r border-[#c4d4ec] text-right text-[#166534] font-mono whitespace-nowrap">
                    {sortedRecords.reduce((s, r) => s + r.received_aed, 0).toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED
                  </td>
                  <td className="px-3 py-2 border-r border-[#c4d4ec] text-right text-[#b91c1c] font-mono whitespace-nowrap font-black">
                    {sortedRecords.reduce((s, r) => s + r.pending_aed, 0).toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED
                  </td>
                  <td className="px-3 py-2 border-r border-[#c4d4ec] text-center text-[11px]">
                    {summary.collection_rate_pct.toFixed(1)}% Overall
                  </td>
                  <td className="px-3 py-2 border-r border-[#c4d4ec] text-center text-[10px] text-[#b91c1c]">
                    {summary.pending_agents_count} Due
                  </td>
                  <td className="px-3 py-2 text-center"></td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>

      {/* Drill-down Statement Modal */}
      {selectedParty && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setSelectedParty(null)}></div>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white shadow-2xl flex flex-col w-full max-w-5xl max-h-[90vh] rounded-md overflow-hidden pointer-events-auto border border-[#c4d4ec]">
              {/* Header */}
              <div className="bg-[#1e4676] text-white px-5 py-3 font-bold text-[14px] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span>Party Statement:</span>
                  <span className="text-amber-300 font-extrabold">{selectedParty.party_name}</span>
                  {selectedParty.cif_no && (
                    <span className="bg-[#2a5a9a] text-white px-2 py-0.5 rounded text-xs font-mono">
                      {selectedParty.cif_no}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedParty(null)}
                  className="text-white hover:text-red-300 font-bold text-[13px] cursor-pointer"
                >
                  Close (✕)
                </button>
              </div>

              {/* Statement KPI Bar */}
              <div className="bg-[#f0f4f8] border-b border-[#c4d4ec] px-5 py-3 grid grid-cols-3 gap-4 shrink-0">
                <div className="bg-white border border-[#c4d4ec] rounded p-2 text-center">
                  <div className="text-[10px] text-gray-500 font-bold uppercase">Total Booked AED</div>
                  <div className="text-[15px] font-black text-[#1e4676] font-mono">
                    {selectedParty.booked_aed.toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED
                  </div>
                  <span className="text-[9.5px] text-gray-500">{selectedParty.order_count} Orders</span>
                </div>

                <div className="bg-white border border-[#86efac] rounded p-2 text-center">
                  <div className="text-[10px] text-[#166534] font-bold uppercase">Total Collected AED</div>
                  <div className="text-[15px] font-black text-[#166534] font-mono">
                    {selectedParty.received_aed.toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED
                  </div>
                  <span className="text-[9.5px] text-gray-500">{selectedParty.received_entries_count} Received Entries</span>
                </div>

                <div className="bg-[#fef2f2] border border-[#fca5a5] rounded p-2 text-center">
                  <div className="text-[10px] text-[#991b1b] font-bold uppercase">Outstanding Pending AED</div>
                  <div className="text-[15px] font-black text-[#991b1b] font-mono">
                    {selectedParty.pending_aed.toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED
                  </div>
                  <span className="text-[9.5px] text-[#991b1b] font-bold">
                    {selectedParty.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Statement Body */}
              <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
                {loadingDetails ? (
                  <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin text-[#1e4676]" />
                    Loading detailed party transactions...
                  </div>
                ) : !partyDetails ? (
                  <div className="text-center py-12 text-gray-400 text-sm">No transaction details available.</div>
                ) : (
                  <>
                    {/* Section 1: Booked Orders */}
                    <div>
                      <h5 className="font-bold text-[#1e4676] text-[12px] uppercase tracking-wide mb-1 flex items-center justify-between">
                        <span>1. Booked Orders ({partyDetails.orders?.length || 0})</span>
                        <span className="text-gray-500 font-normal">
                          Total: <strong>{partyDetails.booked_aed.toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED</strong>
                        </span>
                      </h5>
                      <div className="border border-[#c4d4ec] rounded overflow-hidden max-h-[200px] overflow-auto">
                        <table className="w-full text-[11px] border-collapse">
                          <thead className="bg-[#f0f4f8] text-[#1e4676] font-bold sticky top-0 border-b border-[#c4d4ec]">
                            <tr>
                              <th className="px-2 py-1.5 text-left">Order No</th>
                              <th className="px-2 py-1.5 text-left">Date</th>
                              <th className="px-2 py-1.5 text-left">Beneficiary</th>
                              <th className="px-2 py-1.5 text-right">AED Amount</th>
                              <th className="px-2 py-1.5 text-right">INR Value</th>
                              <th className="px-2 py-1.5 text-center">Status</th>
                              <th className="px-2 py-1.5 text-left">Maker</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(partyDetails.orders || []).map((o: any) => (
                              <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="px-2 py-1 font-mono font-bold text-[#1e4676]">{o.order_no}</td>
                                <td className="px-2 py-1 whitespace-nowrap">{o.order_date ? o.order_date.slice(0, 10) : '—'}</td>
                                <td className="px-2 py-1 font-medium">{o.receiver_name || 'Multiple / See Order'}</td>
                                <td className="px-2 py-1 text-right font-mono font-bold text-[#0f5132]">
                                  {parseFloat(o.aed_amount || 0).toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED
                                </td>
                                <td className="px-2 py-1 text-right font-mono text-gray-600">
                                  ₹ {parseFloat(o.inr_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-2 py-1 text-center">
                                  <span className="bg-gray-100 text-gray-700 px-1.5 py-0.2 rounded text-[10px] font-bold">
                                    {o.status || 'Pending'}
                                  </span>
                                </td>
                                <td className="px-2 py-1 text-gray-500">{o.created_by_name || 'Admin'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Section 2: Received AED Collections */}
                    <div>
                      <h5 className="font-bold text-[#166534] text-[12px] uppercase tracking-wide mb-1 flex items-center justify-between">
                        <span>2. Received AED Collections ({partyDetails.received_entries?.length || 0})</span>
                        <span className="text-gray-500 font-normal">
                          Total: <strong>{partyDetails.received_aed.toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED</strong>
                        </span>
                      </h5>
                      <div className="border border-[#c4d4ec] rounded overflow-hidden max-h-[200px] overflow-auto">
                        <table className="w-full text-[11px] border-collapse">
                          <thead className="bg-[#f0fdf4] text-[#166534] font-bold sticky top-0 border-b border-[#c4d4ec]">
                            <tr>
                              <th className="px-2 py-1.5 text-left">Date</th>
                              <th className="px-2 py-1.5 text-left">Mode</th>
                              <th className="px-2 py-1.5 text-left">UTR / Bank Ref</th>
                              <th className="px-2 py-1.5 text-right">AED Amount</th>
                              <th className="px-2 py-1.5 text-left">Cash Staff</th>
                              <th className="px-2 py-1.5 text-left">Description</th>
                              <th className="px-2 py-1.5 text-left">Receiver</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(partyDetails.received_entries || []).map((r: any) => (
                              <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="px-2 py-1 whitespace-nowrap">{r.entry_date ? r.entry_date.slice(0, 10) : '—'}</td>
                                <td className="px-2 py-1 font-bold text-[#1e4676]">{r.mode_of_txn}</td>
                                <td className="px-2 py-1 font-mono text-gray-700">{r.utr_no || '—'}</td>
                                <td className="px-2 py-1 text-right font-mono font-bold text-[#166534]">
                                  {parseFloat(r.aed_amount || 0).toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED
                                </td>
                                <td className="px-2 py-1 text-gray-600">{r.cash_staff || '—'}</td>
                                <td className="px-2 py-1 text-gray-500 max-w-[200px] truncate" title={r.description || ''}>
                                  {r.description || '—'}
                                </td>
                                <td className="px-2 py-1 text-gray-500">{r.created_by_name || 'Admin'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-[#f8f9fa] border-t border-[#c4d4ec] px-5 py-2.5 flex items-center justify-between shrink-0">
                <span className="text-xs text-gray-500">
                  Net Outstanding: <strong className="text-[#991b1b]">{selectedParty.pending_aed.toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedParty(null)}
                  className="bg-[#1e4676] text-white px-4 py-1 rounded text-xs font-bold hover:bg-[#15345b] cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

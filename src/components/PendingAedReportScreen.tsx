import { useState, useEffect, useMemo } from 'react';
import FinacleDatePicker from './FinacleDatePicker';
import FinacleBadge from './FinacleBadge';
import FinacleSelect from './FinacleSelect';
import api from '../services/api';
import { FileSpreadsheet, FileText, RefreshCw, Eye, ArrowUpDown, Landmark, X } from 'lucide-react';
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
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden text-xs select-none">
      {/* 1. Header Bar */}
      <div className="bg-white px-5 md:px-8 py-3.5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#0E498C] text-white flex items-center justify-center shadow-xs">
            <Landmark className="w-5 h-5 text-[#FFB800]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-bold text-gray-900 tracking-tight">
                Pending AED Collection Register &amp; Aging Report
              </h1>
              <span className="bg-[#FFB800] text-black font-extrabold text-[10px] px-2 py-0.5 rounded shadow-2xs tracking-wider">
                RECEIVABLES
              </span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium">
              FINCORE Universal Settlement Module • Agent &amp; Customer Outstanding Balance Ledger
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadExcel}
            disabled={isExporting !== null || loading || sortedRecords.length === 0}
            className="flex items-center gap-1.5 border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 rounded-md text-xs font-bold shadow-2xs cursor-pointer transition-colors"
            title="Export Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isExporting === 'excel' ? 'Exporting...' : 'Excel'}</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isExporting !== null || loading || sortedRecords.length === 0}
            className="flex items-center gap-1.5 border border-red-300 bg-white hover:bg-red-50 text-red-700 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 rounded-md text-xs font-bold shadow-2xs cursor-pointer transition-colors"
            title="Export PDF"
          >
            <FileText className="w-3.5 h-3.5 text-red-600" />
            <span>{isExporting === 'pdf' ? 'Generating...' : 'PDF'}</span>
          </button>

          <button
            onClick={fetchReport}
            disabled={loading}
            className="flex items-center gap-1.5 bg-[#0E498C] hover:bg-[#00A2E8] border border-[#00B5E2]/40 text-white font-bold text-xs px-3.5 py-1.5 rounded-md shadow-2xs cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Executive KPI Cards */}
      <div className="p-4 md:px-8 bg-white border-b border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 shrink-0">
        {/* Card 1: Total Pending to Collect */}
        <div className="bg-[#fef2f2] border border-[#fca5a5] rounded-md p-3 shadow-2xs flex flex-col justify-between">
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
        <div className="bg-[#f0f4f8] border border-[#c4d4ec] rounded-md p-3 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#0E498C]">
            <span>TOTAL BOOKED ORDERS</span>
            <span className="bg-[#e2ebf6] px-1.5 py-0.5 rounded text-[10px] text-[#0E498C] font-bold">
              {records.reduce((s, r) => s + r.order_count, 0)} ORDERS
            </span>
          </div>
          <div className="text-[18px] font-black text-[#0E498C] font-mono mt-1">
            {summary.total_booked_aed.toLocaleString('en-AE', { minimumFractionDigits: 2 })} <span className="text-[12px]">AED</span>
          </div>
          <span className="text-[10px] text-gray-500 mt-0.5">
            Gross remittance orders booked in period
          </span>
        </div>

        {/* Card 3: Total Collected AED */}
        <div className="bg-[#f0fdf4] border border-[#86efac] rounded-md p-3 shadow-2xs flex flex-col justify-between">
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
        <div className="bg-[#f8fafc] border border-[#cbd5e1] rounded-md p-3 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#334155]">
            <span>COLLECTION PERFORMANCE</span>
            <span className="text-[11px] font-extrabold text-[#0E498C]">
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

      {/* 3. Filters Strip */}
      <div className="p-4 md:px-8 bg-white flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 shrink-0">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* From - To Date Pickers */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-md px-2.5 h-[32px] shadow-2xs focus-within:border-[#00A2E8] focus-within:ring-1 focus-within:ring-[#00A2E8] transition-all">
            <span className="text-[#0E498C] font-bold text-[11px]">From:</span>
            <FinacleDatePicker
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-transparent border-0 text-xs text-gray-800 min-w-[100px] h-[26px] p-0 shadow-none hover:border-0"
            />

            <span className="text-[#0E498C] font-bold text-[11px] ml-0.5">To:</span>
            <FinacleDatePicker
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-transparent border-0 text-xs text-gray-800 min-w-[100px] h-[26px] p-0 shadow-none hover:border-0"
            />

            {(fromDate || toDate) && (
              <button
                type="button"
                onClick={handleClearDates}
                className="text-gray-400 hover:text-red-500 px-0.5 cursor-pointer"
                title="Clear Dates (All Time)"
              >
                <X className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            )}
          </div>

          {/* Quick Date Segmented Buttons */}
          <div className="inline-flex items-center h-[32px] border border-gray-300 rounded-md overflow-hidden bg-white shadow-2xs">
            <button
              type="button"
              onClick={handleSetToday}
              className="h-full px-2.5 text-xs font-semibold text-[#0E498C] hover:bg-[#EBF6FC] hover:text-[#00A2E8] transition-colors cursor-pointer"
            >
              Today
            </button>
            <div className="w-[1px] h-4 bg-gray-200"></div>
            <button
              type="button"
              onClick={handleSetThisMonth}
              className="h-full px-2.5 text-xs font-semibold text-[#0E498C] hover:bg-[#EBF6FC] hover:text-[#00A2E8] transition-colors cursor-pointer"
            >
              This Month
            </button>
          </div>

          {/* Agent Search Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-md px-2.5 h-[32px] shadow-2xs focus-within:border-[#00A2E8] focus-within:ring-1 focus-within:ring-[#00A2E8] transition-all">
            <span className="text-[#0E498C] font-bold text-[11px] whitespace-nowrap">Agent:</span>
            <input
              type="text"
              list="pending-aed-agent-list"
              value={agentSearch}
              onChange={(e) => setAgentSearch(e.target.value)}
              placeholder="Search Agent / CIF..."
              className="bg-transparent text-xs text-gray-800 placeholder:text-gray-400 w-[150px] h-full outline-none"
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
                className="text-gray-400 hover:text-red-500 cursor-pointer"
              >
                <X className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-md px-2.5 h-[32px] shadow-2xs focus-within:border-[#00A2E8] focus-within:ring-1 focus-within:ring-[#00A2E8] transition-all">
            <span className="text-[#0E498C] font-bold text-[11px] whitespace-nowrap">Status:</span>
            <FinacleSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'pending_only', label: 'Pending Collection Only' },
                { value: 'all', label: 'All Statuses' },
                { value: 'uncollected', label: 'Uncollected (0%)' },
                { value: 'partial', label: 'Partially Collected' },
                { value: 'settled', label: 'Fully Settled / 100%' },
              ]}
              triggerClassName="min-w-[165px] h-[28px] border-0 bg-transparent px-1 text-xs"
            />
          </div>

          {/* Sort Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-md px-2.5 h-[32px] shadow-2xs focus-within:border-[#00A2E8] focus-within:ring-1 focus-within:ring-[#00A2E8] transition-all">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#0E498C] shrink-0" />
            <FinacleSelect
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              options={[
                { value: 'pending_desc', label: 'Pending AED: Highest First' },
                { value: 'pending_asc', label: 'Pending AED: Lowest First' },
                { value: 'booked_desc', label: 'Booked AED: Highest First' },
                { value: 'name_asc', label: 'Agent Name: A to Z' },
              ]}
              triggerClassName="min-w-[185px] h-[28px] border-0 bg-transparent px-1 text-xs"
            />
          </div>
        </div>

        {/* Period & Agent Count */}
        <div className="flex items-center gap-2.5 text-xs">
          <span className="bg-[#EBF6FC] border border-[#bce2f8] px-3 py-1 rounded-full text-[#0E498C] font-semibold shadow-2xs text-xs">
            Period: <strong className="text-gray-900 ml-1">{dateRangeLabel}</strong>
          </span>
          <span className="text-[11.5px] text-gray-500 font-medium">
            Showing <strong className="text-[#0E498C]">{sortedRecords.length}</strong> agent record{sortedRecords.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* 4. Data Table with Standard Outer Padding */}
      <div className="flex-1 overflow-y-auto p-4 md:px-8 custom-scrollbar bg-slate-50">
        <div className="overflow-x-auto border border-[#c4d4ec] bg-white rounded shadow-2xs">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
              <RefreshCw className="w-4 h-4 mr-2 animate-spin text-[#104080]" />
              Loading Pending AED report data...
            </div>
          ) : sortedRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <span className="text-lg font-bold text-[#104080] mb-1">No Pending AED Records Found</span>
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
                className="bg-[#104080] text-white text-xs font-bold px-4 py-1.5 rounded hover:bg-[#0c3266] cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr className="bg-[#0E498C] text-white text-left sticky top-0 z-10 shadow-xs">
                  <th className="px-3 py-2.5 font-semibold border-r border-[#00B5E2]/30 whitespace-nowrap">#</th>
                  <th className="px-3 py-2.5 font-semibold border-r border-[#00B5E2]/30 whitespace-nowrap">CIF No</th>
                  <th className="px-3 py-2.5 font-semibold border-r border-[#00B5E2]/30 whitespace-nowrap">Agent / Customer Name</th>
                  <th className="px-3 py-2.5 font-semibold border-r border-[#00B5E2]/30 whitespace-nowrap text-center">Orders</th>
                  <th className="px-3 py-2.5 font-semibold border-r border-[#00B5E2]/30 whitespace-nowrap text-right">Booked AED</th>
                  <th className="px-3 py-2.5 font-semibold border-r border-[#00B5E2]/30 whitespace-nowrap text-right">Collected AED</th>
                  <th className="px-3 py-2.5 font-semibold border-r border-[#00B5E2]/30 whitespace-nowrap text-right">Pending to Collect (AED)</th>
                  <th className="px-3 py-2.5 font-semibold border-r border-[#00B5E2]/30 whitespace-nowrap text-center min-w-[120px]">Collection %</th>
                  <th className="px-3 py-2.5 font-semibold border-r border-[#00B5E2]/30 whitespace-nowrap text-center">Status</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap text-center">Statement</th>
                </tr>
              </thead>
              <tbody>
                {sortedRecords.map((rec, i) => {
                  const isSettled = rec.status === 'settled';
                  const isPartial = rec.status === 'partial';

                  return (
                    <tr
                      key={rec.party_id || `rec-${i}`}
                      className={`border-b border-[#e4e4e4] hover:bg-[#EBF6FC] transition-colors ${
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
                        <span className="bg-[#eaf0f8] px-2 py-0.5 rounded text-[11px] text-[#104080]">
                          {rec.order_count}
                        </span>
                      </td>

                      <td className="px-3 py-2 border-r border-[#e4e4e4] text-right font-mono font-bold text-[#104080] whitespace-nowrap">
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
                          <FinacleBadge variant="success" dot>Settled</FinacleBadge>
                        ) : isPartial ? (
                          <FinacleBadge variant="warning" dot>Partial</FinacleBadge>
                        ) : (
                          <FinacleBadge variant="danger" dot>Uncollected</FinacleBadge>
                        )}
                      </td>

                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        {rec.party_id ? (
                          <button
                            type="button"
                            onClick={() => handleOpenPartyDetails(rec)}
                            className="bg-[#104080] hover:bg-[#0c3266] text-white px-2.5 py-1 rounded text-[11px] font-bold shadow-xs cursor-pointer inline-flex items-center gap-1"
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
                <tr className="bg-[#eef2f9] font-bold text-[#0E498C] border-t-2 border-[#FFB800] sticky bottom-0 z-10 shadow-xs">
                  <td className="px-3 py-2 border-r border-[#c4d4ec]" colSpan={3}>
                    Report Total ({sortedRecords.length} parties displayed)
                  </td>
                  <td className="px-3 py-2 border-r border-[#c4d4ec] text-center">
                    {sortedRecords.reduce((s, r) => s + r.order_count, 0)}
                  </td>
                  <td className="px-3 py-2 border-r border-[#c4d4ec] text-right text-[#104080] font-mono whitespace-nowrap">
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
              <div className="bg-[#0E498C] text-white px-5 py-3 font-bold text-[14px] flex items-center justify-between shrink-0 border-b border-[#00B5E2]/40">
                <div className="flex items-center gap-2">
                  <span>Party Statement:</span>
                  <span className="text-[#FFB800] font-extrabold">{selectedParty.party_name}</span>
                  {selectedParty.cif_no && (
                    <span className="bg-[#00A2E8] text-white px-2 py-0.5 rounded text-xs font-mono font-bold">
                      {selectedParty.cif_no}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedParty(null)}
                  className="text-white/80 hover:text-white font-bold text-[12px] cursor-pointer flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded transition-colors"
                >
                  <span>Close</span>
                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>

              {/* Statement KPI Bar */}
              <div className="bg-[#EBF6FC] border-b border-[#bce2f8] px-5 py-3 grid grid-cols-3 gap-4 shrink-0">
                <div className="bg-white border border-[#c4d4ec] rounded p-2 text-center">
                  <div className="text-[10px] text-gray-500 font-bold uppercase">Total Booked AED</div>
                  <div className="text-[15px] font-black text-[#104080] font-mono">
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
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin text-[#104080]" />
                    Loading detailed party transactions...
                  </div>
                ) : !partyDetails ? (
                  <div className="text-center py-12 text-gray-400 text-sm">No transaction details available.</div>
                ) : (
                  <>
                    {/* Section 1: Booked Orders */}
                    <div>
                      <h5 className="font-bold text-[#104080] text-[12px] uppercase tracking-wide mb-1 flex items-center justify-between">
                        <span>1. Booked Orders ({partyDetails.orders?.length || 0})</span>
                        <span className="text-gray-500 font-normal">
                          Total: <strong>{partyDetails.booked_aed.toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED</strong>
                        </span>
                      </h5>
                      <div className="border border-[#c4d4ec] rounded overflow-hidden max-h-[200px] overflow-auto">
                        <table className="w-full text-[11px] border-collapse">
                          <thead className="bg-[#f0f4f8] text-[#104080] font-bold sticky top-0 border-b border-[#c4d4ec]">
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
                                <td className="px-2 py-1 font-mono font-bold text-[#104080]">{o.order_no}</td>
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
                                <td className="px-2 py-1 font-bold text-[#104080]">{r.mode_of_txn}</td>
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
                  className="bg-[#104080] text-white px-4 py-1 rounded text-xs font-bold hover:bg-[#0c3266] cursor-pointer"
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

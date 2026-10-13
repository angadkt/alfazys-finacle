import { useState, useEffect } from 'react';
import api from '../services/api';

interface ProfitCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfitCalculatorModal({ isOpen, onClose }: ProfitCalculatorModalProps) {
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [activeTab, setActiveTab] = useState<'daily' | 'simulator'>('daily');

  // Daily Mode State
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [loadingDaily, setLoadingDaily] = useState<boolean>(false);
  const [dailyData, setDailyData] = useState<{
    cost_rate: number | null;
    sale_rate: number;
    order_count: number;
    total_aed: number;
    total_inr: number;
    profit_inr: number;
    profit_aed: number;
  }>({
    cost_rate: null,
    sale_rate: 0,
    order_count: 0,
    total_aed: 0,
    total_inr: 0,
    profit_inr: 0,
    profit_aed: 0
  });
  const [customCostRate, setCustomCostRate] = useState<string>('');

  // Simulator Mode State
  const [simAed, setSimAed] = useState<string>('10000');
  const [simSaleRate, setSimSaleRate] = useState<string>('22.80');
  const [simCostRate, setSimCostRate] = useState<string>('22.95');

  // Fetch daily orders and configured cost rate
  const fetchDailyProfit = async (date: string) => {
    if (!date) return;
    setLoadingDaily(true);
    try {
      const res = await api.get(`/records/cost-rate?date=${encodeURIComponent(date)}`);
      const data = res.data;
      const rate = data.cost_rate !== null && data.cost_rate !== undefined ? Number(data.cost_rate) : null;
      setDailyData({
        cost_rate: rate,
        sale_rate: Number(data.summary?.avg_sale_rate) || 0,
        order_count: Number(data.summary?.order_count) || 0,
        total_aed: Number(data.summary?.total_aed) || 0,
        total_inr: Number(data.summary?.total_inr) || 0,
        profit_inr: Number(data.summary?.profit_inr) || 0,
        profit_aed: Number(data.summary?.profit_aed) || 0
      });
      if (rate !== null) {
        setCustomCostRate(String(rate));
      } else {
        setCustomCostRate('');
      }
    } catch (err) {
      console.error('Failed to load daily profit data:', err);
    } finally {
      setLoadingDaily(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDailyProfit(selectedDate);
    }
  }, [isOpen, selectedDate]);

  // Dynamic daily calculations (if user tweaks custom cost rate)
  const activeCostRate = parseFloat(customCostRate);
  const hasValidCostRate = !isNaN(activeCostRate) && activeCostRate > 0;

  const calculatedDailyProfitInr = hasValidCostRate && dailyData.total_aed > 0
    ? (dailyData.total_aed * activeCostRate) - dailyData.total_inr
    : 0;

  const calculatedDailyProfitAed = hasValidCostRate && activeCostRate > 0
    ? calculatedDailyProfitInr / activeCostRate
    : 0;

  const dailyMargin = hasValidCostRate && dailyData.sale_rate > 0
    ? activeCostRate - dailyData.sale_rate
    : 0;

  // Simulator calculations
  const parsedSimAed = parseFloat(simAed) || 0;
  const parsedSimSaleRate = parseFloat(simSaleRate) || 0;
  const parsedSimCostRate = parseFloat(simCostRate) || 0;

  const simInrDelivered = parsedSimAed * parsedSimSaleRate;
  const simInrCost = parsedSimAed * parsedSimCostRate;
  const simProfitInr = simInrCost - simInrDelivered;
  const simProfitAed = parsedSimCostRate > 0 ? simProfitInr / parsedSimCostRate : 0;
  const simMargin = parsedSimCostRate - parsedSimSaleRate;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-3 antialiased">
      <div className="bg-[#ece9d8] shadow-2xl flex flex-col w-full max-w-xl border-2 border-[#104080] rounded-[2px] overflow-hidden text-black font-sans text-xs">
        
        {/* Retro Title Bar */}
        <div className="bg-[#104080] text-white px-2 py-1 flex items-center justify-between text-[11px] font-bold select-none cursor-move">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-white flex items-center justify-center rounded-[1px]">
              <span className="text-[#104080] font-bold text-[9px] leading-none">🧮</span>
            </div>
            <span>Profit Calculator</span>
          </div>
          <button 
            onClick={onClose}
            className="bg-[#c0c0c0] text-black w-4 h-4 flex items-center justify-center border-t border-l border-white border-b border-r border-[#8f8f9d] hover:bg-[#d4d0c8] font-bold leading-none cursor-pointer"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Tab Selection */}
        <div className="bg-[#dfdfdf] px-2 pt-1 border-b border-[#a0a0a0] flex items-center gap-1">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-3 py-1 text-[11px] font-bold rounded-t-[3px] border-t border-x cursor-pointer ${
              activeTab === 'daily'
                ? 'bg-white border-[#808080] text-[#1e4676] -mb-[1px] pb-1.5'
                : 'bg-[#d4d0c8] border-[#a0a0a0] text-gray-700 hover:bg-[#eae8e0]'
            }`}
          >
            Daily Orders Profit
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1 text-[11px] font-bold rounded-t-[3px] border-t border-x cursor-pointer ${
              activeTab === 'simulator'
                ? 'bg-white border-[#808080] text-[#1e4676] -mb-[1px] pb-1.5'
                : 'bg-[#d4d0c8] border-[#a0a0a0] text-gray-700 hover:bg-[#eae8e0]'
            }`}
          >
            Custom Calculator Simulator
          </button>
        </div>

        {/* Modal Body */}
        <div className="bg-white border border-[#a0a0a0] m-1.5 p-3.5 flex flex-col gap-3 max-h-[85vh] overflow-y-auto">
          
          {activeTab === 'daily' ? (
            /* ──────── TAB 1: DAILY ORDERS PROFIT ──────── */
            <div className="flex flex-col gap-3">
              {/* Controls Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#f8f9fa] border border-[#c4d4ec] p-2.5 rounded">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-[#1e4676] flex items-center justify-between">
                    <span>Select Date:</span>
                    {loadingDaily && <span className="text-gray-400 font-normal italic text-[10px]">Loading orders...</span>}
                  </label>
                  <input 
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-white border border-[#7f9db9] px-2 py-1 text-xs text-black outline-none focus:border-[#1e4676] rounded-[2px]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-[#1e4676] flex items-center justify-between">
                    <span>Cost Rate (INR/AED):</span>
                    {dailyData.cost_rate !== null && (
                      <span className="text-emerald-700 font-normal text-[10px]">✓ Configured: {dailyData.cost_rate}</span>
                    )}
                  </label>
                  <input 
                    type="number"
                    step="0.0001"
                    placeholder="Enter cost rate"
                    value={customCostRate}
                    onChange={(e) => setCustomCostRate(e.target.value)}
                    className="bg-white border border-[#7f9db9] px-2 py-1 text-xs text-black font-mono font-semibold outline-none focus:border-[#1e4676] rounded-[2px]"
                  />
                </div>
              </div>

              {/* Volume Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-[#f0f4f9] border border-[#c4d4ec] p-2 rounded flex flex-col">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Orders</span>
                  <span className="text-[14px] font-extrabold text-[#1e4676] mt-0.5">
                    {dailyData.order_count}
                  </span>
                  <span className="text-[9.5px] text-gray-400">Total count</span>
                </div>

                <div className="bg-[#f0f4f9] border border-[#c4d4ec] p-2 rounded flex flex-col">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Total AED</span>
                  <span className="text-[14px] font-extrabold text-[#1e4676] font-mono mt-0.5">
                    {dailyData.total_aed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[9.5px] text-gray-400">AED Volume</span>
                </div>

                <div className="bg-[#f0f4f9] border border-[#c4d4ec] p-2 rounded flex flex-col">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Total INR</span>
                  <span className="text-[14px] font-extrabold text-blue-900 font-mono mt-0.5">
                    ₹{dailyData.total_inr.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[9.5px] text-gray-400">INR Delivered</span>
                </div>

                <div className="bg-[#f0f4f9] border border-[#c4d4ec] p-2 rounded flex flex-col">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Avg Sale Rate</span>
                  <span className="text-[14px] font-extrabold text-gray-800 font-mono mt-0.5">
                    {dailyData.sale_rate > 0 ? dailyData.sale_rate.toFixed(4) : '—'}
                  </span>
                  <span className="text-[9.5px] text-gray-400">INR / AED</span>
                </div>
              </div>

              {/* Profit Calculation Results Box */}
              <div className={`p-3 rounded border flex flex-col gap-2 ${
                !hasValidCostRate
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : calculatedDailyProfitInr >= 0
                    ? 'bg-[#ecfdf5] border-[#a7f3d0] text-emerald-950'
                    : 'bg-[#fef2f2] border-[#fecaca] text-red-950'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-current"></span>
                    Calculated Profit by Cost Rate
                  </span>
                  {hasValidCostRate && dailyData.sale_rate > 0 && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      dailyMargin >= 0 
                        ? 'bg-green-100 text-green-800 border-green-300' 
                        : 'bg-red-100 text-red-800 border-red-300'
                    }`}>
                      Margin: {dailyMargin >= 0 ? `+${dailyMargin.toFixed(4)}` : dailyMargin.toFixed(4)} INR / AED
                    </span>
                  )}
                </div>

                {hasValidCostRate && dailyData.total_aed > 0 ? (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="flex flex-col bg-white/80 p-2.5 rounded border border-current/20">
                      <span className="text-[10px] font-bold uppercase text-gray-500">Calculated Profit (INR)</span>
                      <span className="text-[18px] font-extrabold font-mono tracking-tight text-emerald-800">
                        ₹ {calculatedDailyProfitInr.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-[9.5px] text-gray-500 mt-0.5">
                        (Total AED × Cost Rate) − Total INR
                      </span>
                    </div>

                    <div className="flex flex-col bg-white/80 p-2.5 rounded border border-current/20">
                      <span className="text-[10px] font-bold uppercase text-gray-500">Calculated Profit (AED)</span>
                      <span className="text-[18px] font-extrabold font-mono tracking-tight text-[#145523]">
                        AED {calculatedDailyProfitAed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-[9.5px] text-gray-500 mt-0.5">
                        Profit in INR ÷ Cost Rate
                      </span>
                    </div>
                  </div>
                ) : dailyData.total_aed === 0 ? (
                  <div className="text-[11px] text-gray-500 italic py-2 text-center bg-white/50 rounded">
                    No orders found on {selectedDate}.
                  </div>
                ) : (
                  <div className="text-[11px] text-amber-800 italic py-2 text-center bg-white/50 rounded">
                    Please enter or configure a Cost Rate above to calculate profit for these orders.
                  </div>
                )}

                <div className="text-[10px] text-gray-500 border-t border-current/15 pt-1.5 flex items-center justify-between">
                  <span>• Formula: Profit = (AED Volume × Cost Rate) − INR Value</span>
                  <span>Date: {selectedDate}</span>
                </div>
              </div>
            </div>
          ) : (
            /* ──────── TAB 2: CUSTOM SIMULATOR ──────── */
            <div className="flex flex-col gap-3">
              <div className="text-[11px] font-bold text-[#1e4676] uppercase tracking-wide">
                Simulate Remittance Profit
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#f8f9fa] border border-[#c4d4ec] p-2.5 rounded">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-[#1e4676]">AED Amount:</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={simAed}
                    onChange={(e) => setSimAed(e.target.value)}
                    className="bg-white border border-[#7f9db9] px-2 py-1 text-xs text-black font-mono outline-none focus:border-[#1e4676] rounded-[2px]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-[#1e4676]">Sale Rate (to Client):</label>
                  <input 
                    type="number"
                    step="0.0001"
                    value={simSaleRate}
                    onChange={(e) => setSimSaleRate(e.target.value)}
                    className="bg-white border border-[#7f9db9] px-2 py-1 text-xs text-black font-mono outline-none focus:border-[#1e4676] rounded-[2px]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-[#1e4676]">Cost Rate (Buying):</label>
                  <input 
                    type="number"
                    step="0.0001"
                    value={simCostRate}
                    onChange={(e) => setSimCostRate(e.target.value)}
                    className="bg-white border border-[#7f9db9] px-2 py-1 text-xs text-black font-mono outline-none focus:border-[#1e4676] rounded-[2px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-[#f0f4f9] border border-[#c4d4ec] p-2 rounded flex flex-col">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">INR Delivered</span>
                  <span className="text-[13px] font-extrabold text-blue-900 font-mono mt-0.5">
                    ₹{simInrDelivered.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[9.5px] text-gray-400">At Sale Rate</span>
                </div>

                <div className="bg-[#f0f4f9] border border-[#c4d4ec] p-2 rounded flex flex-col">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">INR Cost Basis</span>
                  <span className="text-[13px] font-extrabold text-gray-900 font-mono mt-0.5">
                    ₹{simInrCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[9.5px] text-gray-400">At Cost Rate</span>
                </div>

                <div className="bg-[#f0f4f9] border border-[#c4d4ec] p-2 rounded flex flex-col">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Rate Margin</span>
                  <span className="text-[13px] font-extrabold text-emerald-800 font-mono mt-0.5">
                    {simMargin >= 0 ? `+${simMargin.toFixed(4)}` : simMargin.toFixed(4)}
                  </span>
                  <span className="text-[9.5px] text-gray-400">INR / AED</span>
                </div>

                <div className="bg-[#f0f4f9] border border-[#c4d4ec] p-2 rounded flex flex-col">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Profit in AED</span>
                  <span className="text-[13px] font-extrabold text-emerald-800 font-mono mt-0.5">
                    AED {simProfitAed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[9.5px] text-gray-400">Net AED</span>
                </div>
              </div>

              {/* Profit Highlight */}
              <div className="bg-[#ecfdf5] border border-[#a7f3d0] p-3 rounded flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase text-gray-600">Total Profit (INR)</div>
                  <div className="text-[20px] font-extrabold text-emerald-800 font-mono">
                    ₹ {simProfitInr.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase text-gray-600">Total Profit (AED)</div>
                  <div className="text-[20px] font-extrabold text-[#145523] font-mono">
                    AED {simProfitAed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="flex justify-end pt-2 border-t border-[#e2e8f0]">
            <button
              type="button"
              onClick={onClose}
              className="bg-[#c0c0c0] hover:bg-[#d4d0c8] text-black px-4 py-1 text-[11px] font-bold border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-[#8f8f9d] border-r-[#8f8f9d] active:border-t-[#8f8f9d] active:border-l-[#8f8f9d] active:border-b-white active:border-r-white cursor-pointer"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

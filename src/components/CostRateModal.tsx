import FinacleDatePicker from './FinacleDatePicker';
import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface CostRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
  onRateSaved?: (date: string, costRate: number) => void;
}

export default function CostRateModal({ isOpen, onClose, initialDate, onRateSaved }: CostRateModalProps) {
  // Today's date in local YYYY-MM-DD
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(initialDate || getTodayStr());
  const [costRateInput, setCostRateInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [hasSavedRate, setHasSavedRate] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load existing cost rate for selected date
  const fetchRateForDate = async (date: string) => {
    if (!date) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.get(`/records/cost-rate?date=${encodeURIComponent(date)}`);
      if (res.data?.cost_rate !== null && res.data?.cost_rate !== undefined) {
        setCostRateInput(String(res.data.cost_rate));
        setHasSavedRate(true);
      } else {
        setCostRateInput('');
        setHasSavedRate(false);
      }
    } catch (err: any) {
      console.error('Failed to load cost rate:', err);
      setHasSavedRate(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedDate(initialDate || getTodayStr());
    }
  }, [isOpen, initialDate]);

  useEffect(() => {
    if (isOpen && selectedDate) {
      fetchRateForDate(selectedDate);
    }
  }, [isOpen, selectedDate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedRate = parseFloat(costRateInput);
    if (isNaN(parsedRate) || parsedRate <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid cost rate greater than 0.' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      await api.post('/records/cost-rate', {
        date: selectedDate,
        cost_rate: parsedRate
      });

      setMessage({
        type: 'success',
        text: `Cost rate of ${parsedRate.toFixed(4)} successfully saved for ${selectedDate}.`
      });
      setHasSavedRate(true);

      if (onRateSaved) {
        onRateSaved(selectedDate, parsedRate);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message || 'Failed to save cost rate.';
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-3 antialiased">
      <div className="bg-[#ece9d8] shadow-2xl flex flex-col w-full max-w-sm border-2 border-[#104080] rounded-[2px] overflow-hidden text-black font-sans text-xs">
        
        {/* Retro Title Bar */}
        <div className="bg-[#104080] text-white px-2 py-1 flex items-center justify-between text-[11px] font-bold select-none cursor-move">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-white flex items-center justify-center rounded-[1px]">
              <span className="text-[#104080] font-bold text-[9px] leading-none">%</span>
            </div>
            <span>Set Up Cost Rate</span>
          </div>
          <button 
            onClick={onClose}
            className="bg-[#c0c0c0] text-black w-4 h-4 flex items-center justify-center border-t border-l border-white border-b border-r border-[#8f8f9d] hover:bg-[#d4d0c8] font-bold leading-none cursor-pointer"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="bg-white border border-[#a0a0a0] m-1.5 p-3.5 flex flex-col gap-3">
          
          {/* Notification Message */}
          {message && (
            <div className={`px-2.5 py-1.5 rounded text-[11px] font-medium border flex items-center justify-between ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border-green-300' 
                : 'bg-red-50 text-red-800 border-red-300'
            }`}>
              <span>{message.text}</span>
              <button 
                type="button"
                onClick={() => setMessage(null)} 
                className="font-bold ml-2 text-gray-500 hover:text-black cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Date Picker */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-[#1e4676] flex items-center justify-between">
              <span>Date: <span className="text-red-600">*</span></span>
              {loading && <span className="text-gray-400 font-normal italic text-[10px]">Loading...</span>}
            </label>
            <FinacleDatePicker 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white border border-[#7f9db9] px-2 py-1.5 text-xs text-black rounded-[2px]"
              required
            />
            {hasSavedRate && (
              <span className="text-[10px] text-emerald-700 font-medium">
                ✓ Cost rate currently configured for this date
              </span>
            )}
          </div>

          {/* Cost Rate Input */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-[#1e4676]">
              Cost Rate: <span className="text-red-600">*</span>
            </label>
            <input 
              type="number"
              step="0.0001"
              min="0.0001"
              placeholder="Enter cost rate (e.g. 22.8500)"
              value={costRateInput}
              onChange={(e) => setCostRateInput(e.target.value)}
              className="bg-white border border-[#7f9db9] px-2 py-1.5 text-xs text-black font-mono font-semibold outline-none focus:border-[#1e4676] rounded-[2px]"
              required
              autoFocus
            />
            <span className="text-[10px] text-gray-500">
              The cost rate used to calculate profits for orders on this date.
            </span>
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e2e8f0] mt-1">
            <button
              type="button"
              onClick={onClose}
              className="bg-[#d4d0c8] hover:bg-[#e4e4e4] text-black px-3 py-1 text-[11px] font-bold border-t border-l border-white border-b border-r border-[#8f8f9d] active:border-t-[#8f8f9d] active:border-l-[#8f8f9d] active:border-b-white active:border-r-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-[#1e4676] hover:bg-[#163559] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-1 text-[11px] font-bold border border-[#0d2746] rounded-[2px] shadow-xs cursor-pointer flex items-center gap-1"
            >
              {saving ? 'Saving...' : 'Save Cost Rate'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

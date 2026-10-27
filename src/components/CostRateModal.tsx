import FinacleDatePicker from './FinacleDatePicker';
import FinacleButton from './FinacleButton';
import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
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
        <div className="bg-[#104080] text-white px-2.5 py-1.5 flex items-center justify-between text-xs font-bold select-none cursor-move">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-white flex items-center justify-center rounded-[1px]">
              <span className="text-[#104080] font-bold text-[10px] leading-none">%</span>
            </div>
            <span>Set Up Cost Rate</span>
          </div>
          <button 
            onClick={onClose}
            className="bg-[#c0c0c0] text-black w-4 h-4 flex items-center justify-center border-t border-l border-white border-b border-r border-[#8f8f9d] hover:bg-[#d4d0c8] cursor-pointer"
            title="Close"
          >
            <X className="w-3 h-3 stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="bg-white border border-[#a0a0a0] m-1.5 p-3.5 flex flex-col gap-3">
          
          {/* Notification Message */}
          {message && (
            <div className={`px-2.5 py-1.5 rounded text-xs font-medium border flex items-center justify-between ${
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
                <X className="w-3 h-3 stroke-[2.5]" />
              </button>
            </div>
          )}

          {/* Date Picker */}
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-bold text-[#104080] flex items-center justify-between">
              <span>Date: <span className="text-red-600">*</span></span>
              {loading && <span className="text-gray-400 font-normal italic text-xs">Loading...</span>}
            </label>
            <FinacleDatePicker 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white border border-[#7f9db9] px-2 py-1.5 text-xs text-black rounded-[2px]"
              required
            />
            {hasSavedRate && (
              <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600 stroke-[2.5]" /> Cost rate currently configured for this date
              </span>
            )}
          </div>

          {/* Cost Rate Input */}
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-bold text-[#104080]">
              Cost Rate: <span className="text-red-600">*</span>
            </label>
            <input 
              type="number"
              step="0.0001"
              min="0.0001"
              placeholder="Enter cost rate (e.g. 22.8500)"
              value={costRateInput}
              onChange={(e) => setCostRateInput(e.target.value)}
              className="bg-white border border-[#7f9db9] px-2 py-1.5 text-xs text-black font-mono font-semibold outline-none focus:border-[#104080] rounded-[2px]"
              required
              autoFocus
            />
            <span className="text-xs text-gray-500">
              The cost rate used to calculate profits for orders on this date.
            </span>
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e2e8f0] mt-1">
            <FinacleButton
              type="button"
              variant="retro"
              onClick={onClose}
            >
              Cancel
            </FinacleButton>
            <FinacleButton
              type="submit"
              variant="primary"
              loading={saving}
            >
              Save Cost Rate
            </FinacleButton>
          </div>

        </form>
      </div>
    </div>
  );
}

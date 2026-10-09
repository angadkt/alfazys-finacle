import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Info, ArrowUpRight } from 'lucide-react';
import { dbService } from '../services/db';

export default function SolutionsDashboard() {
  const navigate = useNavigate();
  const [selectedSolution, setSelectedSolution] = useState('');

  const handleSolutionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedSolution(value);
    
    // When "Fincore" is selected, navigate to the Fincore interface
    if (value === 'fincore') {
      navigate('/dashboard'); // Fincore is currently the dashboard
    }
  };

  const handleLogout = () => {
    dbService.clearUserSession();
    navigate('/');
  };

  const userRole = dbService.getUserRole();
  const username = userRole === 'super_admin' ? 'UBSADMIN' : userRole?.toUpperCase() || 'USER';

  return (
    <div className="min-h-screen bg-gray-50 text-[11px] font-sans text-gray-800">
      
      {/* Top Utility Bar */}
      <div className="flex justify-between items-center px-4 py-1 border-b border-gray-300 bg-white">
        <div className="flex items-center space-x-4">
          <span className="text-blue-900 font-semibold">User: {username}</span>
          <div className="h-3 w-px bg-gray-300"></div>
          <span className="text-blue-900 font-semibold">Time Zone: GMT</span>
        </div>
        
        <div className="flex items-center space-x-3">
          <label className="text-blue-900 font-bold">Solution:</label>
          <select 
            className="border border-gray-300 rounded px-2 py-0.5 text-[11px] w-40 outline-none cursor-pointer"
            value={selectedSolution}
            onChange={handleSolutionChange}
          >
            <option value="">---Select---</option>
            <option value="fincore">Fincore</option>
            <option value="retail">Retail Banking</option>
          </select>
          <div className="h-3 w-px bg-gray-300"></div>
          <button onClick={handleLogout} className="text-red-600 hover:bg-gray-100 p-0.5 rounded border border-gray-200">
            <LogOut size={14} />
          </button>
        </div>
      </div>

      {/* Main Logo & Menu Bar */}
      <div className="flex justify-between items-end px-4 py-3 bg-white">
        <div className="flex items-center space-x-2">
          {/* Mock Logo */}
          <div className="w-6 h-6 rounded-full bg-red-800 flex items-center justify-center">
             <div className="w-3 h-3 border-2 border-white rounded-full"></div>
          </div>
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">
            Infazys Finacle<sup className="text-[10px]">®</sup>
          </h1>
        </div>
        
        <div className="flex items-center space-x-2 text-blue-900 font-bold bg-gray-50 border border-gray-300 px-2 py-1">
           <ArrowUpRight size={12} className="text-blue-900" />
           <div className="h-3 w-px border-l border-dotted border-gray-400"></div>
           <button className="hover:underline">Menu</button>
           <div className="h-3 w-px border-l border-dotted border-gray-400"></div>
           <button className="hover:underline">CCY Converter</button>
        </div>
      </div>

      {/* Blue Sub-header */}
      <div className="bg-[#a5c0df] border-y border-[#7999be] px-4 py-1 flex justify-between items-center text-[10px] font-bold text-blue-900">
        <div>Universal Payment Solution from Infazys</div>
        <div className="flex items-center space-x-2">
          <span>{username}</span>
          <div className="h-2.5 w-px bg-gray-400"></div>
          <span>25/02/2014</span>
          <div className="h-2.5 w-px bg-gray-400"></div>
          <span className="font-normal text-gray-700">Menu Shortcut:</span>
          <input type="text" placeholder="E.G. CREDIT" className="border border-gray-400 px-1 py-0.5 w-24 outline-none uppercase" />
          <button className="bg-gray-200 border border-gray-400 px-2 hover:bg-gray-300">Go</button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 max-w-6xl mx-auto space-y-4 mt-2">
        
        {/* Info Alert */}
        <div className="bg-[#f0f4f8] border border-blue-200 p-2 flex items-center space-x-2 rounded text-blue-900 font-semibold">
          <div className="bg-blue-600 text-white rounded-full p-0.5">
            <Info size={12} />
          </div>
          <span>Your password will expire after 44 days</span>
        </div>

        {/* Panel 1: Successful Login */}
        <div className="border border-gray-300 rounded overflow-hidden">
          <div className="bg-[#eef3f8] border-b border-gray-300 px-3 py-1.5 font-bold text-blue-900">
            Last Successful Login Information
          </div>
          <div className="bg-white p-3 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 w-1/4">Last login time</span>
              <span className="font-bold w-1/4">28-Feb-2015 13:01:15</span>
              <span className="text-gray-500 w-1/4">Client machine</span>
              <span className="font-bold w-1/4 text-right">10.80.200.246</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 w-1/4">Last logout time</span>
              <span className="font-bold w-1/4">28-Feb-2015 13:01:52</span>
              <span className="w-1/2"></span>
            </div>
          </div>
        </div>

        {/* Panel 2: Failed Login */}
        <div className="border border-gray-300 rounded overflow-hidden">
          <div className="bg-[#eef3f8] border-b border-gray-300 px-3 py-1.5 font-bold text-blue-900">
            Last Failed Login Information
          </div>
          <div className="bg-white p-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 w-1/4">Last login time</span>
              <span className="font-bold w-1/4">28-Feb-2015 12:52:20</span>
              <span className="text-gray-500 w-1/4">Client machine</span>
              <span className="font-bold w-1/4 text-right">10.80.200.246</span>
            </div>
          </div>
        </div>

        {/* Panel 3: Account Info */}
        <div className="border border-gray-300 rounded overflow-hidden">
          <div className="bg-[#eef3f8] border-b border-gray-300 px-3 py-1.5 font-bold text-blue-900">
            Account Information
          </div>
          <div className="bg-white p-3">
            <div className="flex items-center">
              <span className="text-gray-500 w-1/4">Account Expiry Date</span>
              <span className="font-bold">31-12-2099</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

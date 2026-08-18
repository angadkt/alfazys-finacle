import React, { useState, useEffect } from 'react';
import { dbService } from './services/db';
import type { DbSchema, Card, Recipient } from './services/db';

// Custom inline SVG Icons for a clean, dependency-free installation
const BankIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
  </svg>
);

const ArrowUpRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
  </svg>
);

const ArrowDownLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25" />
  </svg>
);

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.602 10.602z" />
  </svg>
);

const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21L8.188 15.904L3 15L8.188 14.096L9 9L9.813 14.096L15 15L9.813 15.904ZM19.071 5.929L18.5 9.5L17.929 5.929L14.357 5.357L17.929 4.786L18.5 1.214L19.071 4.786L22.643 5.357L19.071 5.929Z" />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
  </svg>
);

export default function App() {
  const [db, setDb] = useState<DbSchema>(() => dbService.getDb());
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Quick Transfer State
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [transferSourceId, setTransferSourceId] = useState<string>('');
  const [transferError, setTransferError] = useState<string>('');
  const [transferSuccess, setTransferSuccess] = useState<string>('');

  // Mock Deposit State
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [depositTargetId, setDepositTargetId] = useState<string>('');
  const [depositDescription, setDepositDescription] = useState<string>('External Wire Deposit');
  const [depositSuccess, setDepositSuccess] = useState<string>('');

  // Card Bill Payment State
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentError, setPaymentError] = useState<string>('');
  const [paymentSuccess, setPaymentSuccess] = useState<string>('');

  // Set default source account for transfers when accounts load
  useEffect(() => {
    if (db.accounts.length > 0) {
      setTransferSourceId(db.accounts[0].id);
      setDepositTargetId(db.accounts[0].id);
    }
  }, [db.accounts]);

  // Sync state from service
  const reloadData = () => {
    const freshDb = dbService.getDb();
    setDb(freshDb);
  };

  const handleResetDb = () => {
    dbService.resetDb();
    reloadData();
    setSelectedAccountId('all');
    setSelectedRecipient(null);
    setSelectedCard(null);
    setTransferAmount('');
    setDepositAmount('');
    setPaymentAmount('');
    setTransferError('');
    setTransferSuccess('Database successfully reset to initial mock data.');
    setTimeout(() => setTransferSuccess(''), 4000);
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');
    setTransferSuccess('');

    if (!selectedRecipient) {
      setTransferError('Please select a recipient.');
      return;
    }

    const amountNum = parseFloat(transferAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setTransferError('Please enter a valid transfer amount.');
      return;
    }

    const sourceAccount = db.accounts.find(a => a.id === transferSourceId);
    if (!sourceAccount) {
      setTransferError('Invalid source account.');
      return;
    }

    if (sourceAccount.balance < amountNum) {
      setTransferError(`Insufficient funds in ${sourceAccount.type}. Current balance: $${sourceAccount.balance.toLocaleString()}`);
      return;
    }

    // Execute transfer
    const tx = dbService.createTransaction({
      accountId: transferSourceId,
      amount: amountNum,
      type: 'transfer',
      category: 'Transfer',
      description: `Wire to ${selectedRecipient.name} (${selectedRecipient.bankName})`
    });

    if (tx) {
      setTransferSuccess(`Successfully wired $${amountNum.toLocaleString()} to ${selectedRecipient.name}.`);
      setTransferAmount('');
      setSelectedRecipient(null);
      reloadData();
      setTimeout(() => setTransferSuccess(''), 5000);
    } else {
      setTransferError('Transaction failed. Please try again.');
    }
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDepositSuccess('');

    const amountNum = parseFloat(depositAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid deposit amount.');
      return;
    }

    const tx = dbService.createTransaction({
      accountId: depositTargetId,
      amount: amountNum,
      type: 'deposit',
      category: 'Income',
      description: depositDescription || 'Direct Deposit'
    });

    if (tx) {
      setDepositSuccess(`Deposited $${amountNum.toLocaleString()} successfully.`);
      setDepositAmount('');
      setDepositDescription('External Wire Deposit');
      reloadData();
      setTimeout(() => setDepositSuccess(''), 4000);
    }
  };

  const handleCardPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError('');
    setPaymentSuccess('');

    if (!selectedCard) return;

    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setPaymentError('Please enter a valid payment amount.');
      return;
    }

    // Always pay from checking account (acc-1) for simplicity
    const checkingAcc = db.accounts.find(a => a.id === 'acc-1');
    if (!checkingAcc) {
      setPaymentError('Primary Checking Account not found.');
      return;
    }

    if (checkingAcc.balance < amountNum) {
      setPaymentError(`Insufficient checking account balance ($${checkingAcc.balance.toLocaleString()}) to pay card bill.`);
      return;
    }

    const tx = dbService.createTransaction({
      accountId: checkingAcc.id,
      amount: amountNum,
      type: 'transfer',
      category: 'Card Payment',
      description: `Card Payment: ${selectedCard.cardNumber}`
    });

    if (tx) {
      setPaymentSuccess(`Paid $${amountNum.toLocaleString()} toward card ${selectedCard.cardNumber.slice(-4)}.`);
      setPaymentAmount('');
      setSelectedCard(null);
      reloadData();
      setTimeout(() => setPaymentSuccess(''), 4000);
    } else {
      setPaymentError('Payment transaction failed.');
    }
  };

  // Filtered transactions
  const filteredTransactions = db.transactions
    .filter(tx => selectedAccountId === 'all' || tx.accountId === selectedAccountId)
    .filter(tx => 
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
      tx.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const selectedAccount = db.accounts.find(a => a.id === selectedAccountId);

  return (
    <div className="min-h-screen bg-[#090d16] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-950/20 via-slate-950 to-slate-950 text-slate-100 flex flex-col antialiased">
      
      {/* Premium Navigation Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-950/70 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
              <BankIcon />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-blue-400 bg-clip-text text-transparent">
                ALFAZYZ
              </span>
              <span className="text-xs font-semibold tracking-wider text-indigo-400 block -mt-1">
                FINACLE CORE
              </span>
            </div>
          </div>

          {/* Secure Shield Badge & DB Reset */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 bg-slate-900/80 border border-emerald-500/20 rounded-full text-xs text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <ShieldCheckIcon />
              Secure 256-bit Sandbox
            </div>

            <button 
              onClick={handleResetDb}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-800 hover:border-slate-700 transition duration-200 text-sm font-medium cursor-pointer"
            >
              <RefreshIcon />
              <span>Reset Portal</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* User Greeting Hero Banner */}
        <section className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 rounded-3xl p-6 md:p-8 border border-slate-800/80 mb-8 shadow-2xl">
          <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute left-1/3 bottom-0 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4 md:gap-5">
              <img 
                src={db.user.avatar} 
                alt={db.user.name} 
                className="w-16 h-16 md:w-20 md:h-20 rounded-2xl border-2 border-indigo-500/40 object-cover shadow-lg"
              />
              <div>
                <span className="text-indigo-400 text-sm font-medium tracking-wide block uppercase">
                  Welcome Back
                </span>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  {db.user.name}
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  {db.user.occupation} &bull; Joined {new Date(db.user.joinedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
                </p>
              </div>
            </div>
            
            {/* Quick Metrics */}
            <div className="flex gap-4 md:gap-8 bg-slate-950/40 backdrop-blur-md p-4 rounded-2xl border border-slate-800/60 self-start md:self-auto">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest block">Total Liquid Wealth</span>
                <span className="text-lg md:text-xl font-bold text-emerald-400">
                  ${db.accounts.reduce((sum, a) => sum + a.balance, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="border-l border-slate-800"></div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest block">Linked Accounts</span>
                <span className="text-lg md:text-xl font-bold text-white">
                  {db.accounts.length}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Alerts Banner */}
        {transferSuccess && (
          <div className="mb-6 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-xl flex items-center gap-3 animate-fade-in text-sm">
            <span className="p-1 bg-emerald-500/20 rounded-lg"><ShieldCheckIcon /></span>
            {transferSuccess}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: ACCOUNTS & CARDS */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Accounts Segment */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-indigo-500 rounded-full block"></span>
                  Financial Accounts
                </h2>
                <div className="flex gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
                  <button 
                    onClick={() => setSelectedAccountId('all')}
                    className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${selectedAccountId === 'all' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                  >
                    All Accounts
                  </button>
                  {db.accounts.map(acc => (
                    <button
                      key={acc.id}
                      onClick={() => setSelectedAccountId(acc.id)}
                      className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${selectedAccountId === acc.id ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                      {acc.type.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accounts Cards List */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {db.accounts.map(acc => {
                  const isSelected = selectedAccountId === acc.id;
                  return (
                    <div 
                      key={acc.id}
                      onClick={() => setSelectedAccountId(acc.id)}
                      className={`relative overflow-hidden p-5 rounded-2xl border transition duration-300 cursor-pointer ${
                        isSelected 
                          ? 'bg-gradient-to-b from-indigo-950/30 to-indigo-900/10 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.15)]' 
                          : 'bg-slate-900/50 hover:bg-slate-900 border-slate-800/80'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-xs font-semibold text-indigo-400 tracking-wide bg-indigo-950/60 px-2 py-0.5 rounded-md">
                          {acc.type}
                        </span>
                        <div className={`w-2 h-2 rounded-full ${acc.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                      </div>
                      
                      <div className="mb-2">
                        <span className="text-2xl font-bold text-white tracking-tight">
                          ${acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>Acc No.</span>
                          <span className="font-mono text-slate-300">{acc.accountNumber}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>Routing</span>
                          <span className="font-mono text-slate-300">{acc.routingNumber}</span>
                        </div>
                      </div>

                      {/* Small Indicator if highlighted */}
                      {isSelected && (
                        <div className="absolute right-0 bottom-0 w-8 h-8 bg-indigo-500/20 rounded-tl-2xl flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Credit Cards Segment */}
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2 mb-4">
                <span className="w-1.5 h-4 bg-indigo-500 rounded-full block"></span>
                Credit & Debit Cards
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {db.cards.map(card => (
                  <div 
                    key={card.id} 
                    className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 shadow-2xl flex flex-col justify-between h-48 group hover:border-slate-700 transition duration-300"
                  >
                    {/* Glowing Accent Gradient Background */}
                    <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/10 transition duration-300"></div>

                    <div className="flex justify-between items-start relative z-10">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          {card.type}
                        </span>
                        <span className="text-xs text-indigo-400 font-mono mt-0.5 block">
                          Alfazyz Premium
                        </span>
                      </div>
                      {/* Interactive Card Chip Styling */}
                      <div className="w-10 h-7 bg-gradient-to-r from-amber-400/80 to-yellow-600/80 rounded-md border border-amber-300/20 flex flex-col justify-between p-1.5 shadow-inner">
                        <div className="w-2.5 h-1.5 bg-slate-950/20 rounded-sm"></div>
                        <div className="w-4 h-1.5 bg-slate-950/20 rounded-sm"></div>
                      </div>
                    </div>

                    <div className="relative z-10">
                      <span className="text-lg font-mono tracking-widest text-slate-100 block">
                        {card.cardNumber}
                      </span>
                    </div>

                    <div className="flex justify-between items-end relative z-10">
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase block">Cardholder</span>
                        <span className="text-xs font-semibold text-slate-200 tracking-wide">
                          {card.cardholderName}
                        </span>
                      </div>

                      <div className="flex gap-4">
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase block">Expires</span>
                          <span className="text-xs font-semibold text-slate-200 tracking-wide">
                            {card.expiry}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase block">Outstanding Balance</span>
                          <span className="text-xs font-bold text-amber-500">
                            ${card.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      {/* Pay Bill quick action hover overlay */}
                      <button
                        onClick={() => setSelectedCard(card)}
                        className="absolute right-0 -bottom-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-2.5 py-1 text-[10px] font-bold shadow-lg shadow-indigo-600/20 border border-indigo-400/20 transition-all opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 cursor-pointer"
                      >
                        PAY BILL
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transactions Segment */}
            <div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-indigo-500 rounded-full block"></span>
                  Transaction Ledger
                  {selectedAccount && (
                    <span className="text-xs font-normal text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded-full ml-2">
                      {selectedAccount.type}
                    </span>
                  )}
                </h2>
                
                {/* Search Bar */}
                <div className="relative w-full md:w-64">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <SearchIcon />
                  </span>
                  <input
                    type="text"
                    placeholder="Search by description or tag..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>

              {/* Transactions List */}
              <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 overflow-hidden">
                <div className="divide-y divide-slate-800/80">
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map(tx => {
                      const isDeposit = tx.type === 'deposit';
                      const isTransfer = tx.type === 'transfer';
                      
                      return (
                        <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-900/50 transition">
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl border ${
                              isDeposit 
                                ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-400' 
                                : isTransfer 
                                ? 'bg-blue-950/40 border-blue-500/20 text-blue-400' 
                                : 'bg-rose-950/40 border-rose-500/20 text-rose-400'
                            }`}>
                              {isDeposit ? <ArrowDownLeftIcon /> : <ArrowUpRightIcon />}
                            </div>
                            
                            <div>
                              <span className="text-sm font-semibold text-slate-200 block">
                                {tx.description}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] text-slate-500">
                                  {new Date(tx.date).toLocaleDateString(undefined, { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                                  {tx.category}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className={`text-sm font-bold ${
                              isDeposit ? 'text-emerald-400' : 'text-slate-100'
                            }`}>
                              {isDeposit ? '+' : '-'}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[9px] text-slate-500 block uppercase font-medium mt-0.5">
                              {tx.status}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-slate-500">
                      No transactions match your search filter.
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: QUICK TRANSFER & ACTIONS */}
          <div className="space-y-8">
            
            {/* Quick Transfer Widget */}
            <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 border border-slate-800/80 shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>

              <h2 className="text-md font-bold text-white flex items-center gap-2 mb-4">
                <SendIcon />
                Secure Wire Transfer
              </h2>

              {/* Transfer Success/Error Messages */}
              {transferError && (
                <div className="mb-4 bg-rose-950/40 border border-rose-500/20 text-rose-300 px-3 py-2 rounded-xl text-xs">
                  {transferError}
                </div>
              )}

              {/* Contacts Row */}
              <div className="mb-5">
                <span className="text-xs text-slate-400 block mb-2 font-medium">Select Recipient</span>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                  {db.recipients.map(rec => {
                    const isSelected = selectedRecipient?.id === rec.id;
                    return (
                      <button
                        key={rec.id}
                        type="button"
                        onClick={() => {
                          setSelectedRecipient(rec);
                          setTransferError('');
                          setTransferSuccess('');
                        }}
                        className={`flex flex-col items-center p-2.5 rounded-xl border transition min-w-[76px] cursor-pointer ${
                          isSelected 
                            ? 'bg-indigo-950/40 border-indigo-500' 
                            : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <img 
                          src={rec.avatar} 
                          alt={rec.name} 
                          className="w-10 h-10 rounded-full border border-slate-800 object-cover mb-1.5"
                        />
                        <span className="text-[10px] font-semibold text-slate-300 text-center truncate w-14">
                          {rec.name.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Transfer Form Details */}
              {selectedRecipient && (
                <form onSubmit={handleTransferSubmit} className="space-y-4 animate-fade-in">
                  
                  {/* Selected Recipient Card */}
                  <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Recipient</span>
                      <span className="font-bold text-slate-200 block">{selectedRecipient.name}</span>
                      <span className="text-slate-400 block">{selectedRecipient.bankName} &bull; <span className="font-mono">{selectedRecipient.accountNumber.slice(-4)}</span></span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setSelectedRecipient(null)}
                      className="text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Source Account Selector */}
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Source Account</label>
                    <select
                      value={transferSourceId}
                      onChange={(e) => setTransferSourceId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {db.accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.type} (${acc.balance.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Transfer Amount */}
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Transfer Amount (USD)</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-xs">$</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        min="1"
                        step="any"
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-6 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2.5 text-xs font-bold shadow-lg shadow-indigo-600/20 border border-indigo-400/20 transition cursor-pointer"
                  >
                    Execute Secure Wire Transfer
                  </button>
                </form>
              )}

              {!selectedRecipient && (
                <div className="text-center py-6 bg-slate-950/20 border border-dashed border-slate-800 rounded-2xl text-xs text-slate-500">
                  Select a contact above to initiate a wire transfer.
                </div>
              )}
            </div>

            {/* Deposit Sandbox Widget (for mocking direct deposits/inbound wires) */}
            <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 border border-slate-800/80 shadow-xl">
              <h2 className="text-md font-bold text-white flex items-center gap-2 mb-4">
                <PlusIcon />
                Direct Deposit Sandbox
              </h2>

              {depositSuccess && (
                <div className="mb-4 bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 px-3 py-2 rounded-xl text-xs">
                  {depositSuccess}
                </div>
              )}

              <form onSubmit={handleDepositSubmit} className="space-y-4">
                {/* Target Account */}
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Target Account</label>
                  <select
                    value={depositTargetId}
                    onChange={(e) => setDepositTargetId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {db.accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.type} (${acc.balance.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Deposit Source Description */}
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Deposit Description / Source</label>
                  <input
                    type="text"
                    value={depositDescription}
                    onChange={(e) => setDepositDescription(e.target.value)}
                    placeholder="e.g. Salary, Client Wire, Gift"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Deposit Amount (USD)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-xs">$</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      min="1"
                      step="any"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-6 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white rounded-xl py-2.5 text-xs font-bold border border-slate-800 hover:border-slate-700 transition cursor-pointer"
                >
                  Deposit Funds
                </button>
              </form>
            </div>

            {/* Card Bill Payment Overlay/Widget */}
            {selectedCard && (
              <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 border border-amber-500/20 shadow-xl animate-fade-in">
                <h2 className="text-md font-bold text-white flex items-center gap-2 mb-4">
                  <SparklesIcon />
                  Pay Credit Card Bill
                </h2>

                {paymentError && (
                  <div className="mb-4 bg-rose-950/40 border border-rose-500/20 text-rose-300 px-3 py-2 rounded-xl text-xs">
                    {paymentError}
                  </div>
                )}
                {paymentSuccess && (
                  <div className="mb-4 bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 px-3 py-2 rounded-xl text-xs">
                    {paymentSuccess}
                  </div>
                )}

                <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl text-xs mb-4">
                  <div className="flex justify-between font-semibold text-slate-200 mb-1">
                    <span>{selectedCard.type}</span>
                    <span>{selectedCard.cardNumber.slice(-4)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Outstanding Balance:</span>
                    <span className="font-bold text-amber-500">${selectedCard.balance.toLocaleString()}</span>
                  </div>
                </div>

                <form onSubmit={handleCardPaymentSubmit} className="space-y-4">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Payment Amount (Paid from checking account)</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-xs">$</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        min="1"
                        max={selectedCard.balance}
                        step="any"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-6 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedCard(null)}
                      className="w-1/2 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200 rounded-xl py-2 text-xs font-bold border border-slate-800 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-1/2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2 text-xs font-bold shadow-lg shadow-indigo-600/20 border border-indigo-400/20 transition cursor-pointer"
                    >
                      Pay Bill
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>

        </div>

      </main>

      {/* Footer Info */}
      <footer className="mt-12 border-t border-slate-900 bg-slate-950/40 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-600 space-y-2">
          <p>&copy; {new Date().getFullYear()} Alfazyz Finacle Core Systems. All simulation rights reserved.</p>
          <p className="max-w-md mx-auto text-[10px] text-slate-700">
            This is a mock sandbox environment. All customer data, balances, transactions, and wire transfers are mock records saved locally in your browser's LocalStorage.
          </p>
        </div>
      </footer>

    </div>
  );
}

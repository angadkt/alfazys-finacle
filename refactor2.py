import os
import re

filepath = "/Users/angadkt/Desktop/coding/Alfazyz finacle/src/pages/CustomersPage.tsx"
with open(filepath, "r") as f:
    content = f.read()

# Add activeTab state
state_block_old = """  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');"""
state_block_new = """  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [activeTab, setActiveTab] = useState<'customers' | 'requests'>('customers');"""
content = content.replace(state_block_old, state_block_new)

# Replace the Page Header block
header_regex = re.compile(r"\{\/\* Page Header \*\/\}\n            <div className=\"flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6\">\n.*?<\/div>\n            <\/div>", re.DOTALL)
header_new = """{/* Page Header */}
            <div className="flex flex-col gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  <span>Home</span>
                  <ChevronRightIcon />
                  <span className="text-[#9e0248]">Customers</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4">
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">Customers</h1>
                  <button 
                    onClick={() => navigate('/customers/new')}
                    className="bg-[#9e0248] hover:bg-[#85013c] text-white shadow-md shadow-[#9e0248]/10 hover:shadow-[#9e0248]/20 transition duration-200 py-2.5 px-4 font-bold flex items-center gap-2 text-xs uppercase tracking-wider rounded-md cursor-pointer whitespace-nowrap"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span>Add Customer</span>
                  </button>
                </div>
                <p className="text-sm font-semibold text-slate-500 mt-1">Manage customer profiles, verification and customer information.</p>
                
                {/* Tabs */}
                <div className="flex items-center gap-6 mt-8 border-b border-slate-200 w-full">
                  <button 
                    onClick={() => setActiveTab('customers')}
                    className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === 'customers' ? 'text-[#9e0248]' : 'text-slate-500 hover:text-slate-700'} cursor-pointer`}
                  >
                    Customers ({totalCount})
                    {activeTab === 'customers' && (
                      <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-[#9e0248] rounded-t-full" />
                    )}
                  </button>
                  <button 
                    onClick={() => setActiveTab('requests')}
                    className={`pb-3 text-sm font-bold transition-colors relative flex items-center gap-2 ${activeTab === 'requests' ? 'text-[#9e0248]' : 'text-slate-500 hover:text-slate-700'} cursor-pointer`}
                  >
                    Requests ({pendingCount})
                    {activeTab === 'requests' && (
                      <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-[#9e0248] rounded-t-full" />
                    )}
                  </button>
                </div>
              </div>
            </div>"""

content = re.sub(header_regex, header_new, content)

# Replace the tables block
tables_regex = re.compile(r"\{\/\* Pending Requests Section \*\/\}.*?<\/div>\n\n          <\/div>", re.DOTALL)
tables_new = """{/* Content Area Based on Active Tab */}
            {activeTab === 'requests' ? (
              <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden flex flex-col mb-6">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                  <div className="flex flex-col">
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                      Customer Requests
                    </h2>
                    <p className="text-xs font-semibold text-slate-500 mt-1">Review and process new customer registration requests.</p>
                  </div>
                  <span className="text-xs font-black text-amber-700 bg-amber-50 px-3 py-1.5 rounded-md border border-amber-200 flex items-center gap-1.5 uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    {pendingCount} Pending
                  </span>
                </div>
                <CustomerTable 
                  customers={pendingCustomers}
                  isAdmin={isAdmin}
                  onApprove={handleQuickApprove}
                  onReject={handleQuickReject}
                />
              </div>
            ) : (
              <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden flex flex-col">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Search Input */}
                  <div className="flex items-center gap-3 bg-white border border-slate-300 rounded-md px-3 py-2 h-10 w-full lg:max-w-xs transition focus-within:shadow-[0_0_0_2px_rgba(158,2,72,0.1)] focus-within:border-[#9e0248]">
                    <SearchIcon />
                    <input
                      type="text"
                      placeholder="Search customers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent border-none outline-none text-xs text-slate-800 placeholder:text-slate-400 font-semibold"
                    />
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-2 flex-wrap select-none">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-2">Status:</span>
                    
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`px-3 py-1.5 rounded-md text-[11px] font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
                        statusFilter === 'all'
                          ? 'bg-[#9e0248]/10 text-[#9e0248]'
                          : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <span>All</span>
                    </button>

                    <button
                      onClick={() => setStatusFilter('approved')}
                      className={`px-3 py-1.5 rounded-md text-[11px] font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
                        statusFilter === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === 'approved' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span>Approved</span>
                    </button>

                    <button
                      onClick={() => setStatusFilter('rejected')}
                      className={`px-3 py-1.5 rounded-md text-[11px] font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
                        statusFilter === 'rejected'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === 'rejected' ? 'bg-rose-500' : 'bg-slate-300'}`} />
                      <span>Rejected</span>
                    </button>
                    
                    <button className="px-2 py-1.5 ml-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer border border-transparent">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <CustomerTable 
                  customers={filteredCustomers}
                  isAdmin={isAdmin}
                  onApprove={handleQuickApprove}
                  onReject={handleQuickReject}
                />
              </div>
            )}
            
          </div>"""
content = re.sub(tables_regex, tables_new, content)

with open(filepath, "w") as f:
    f.write(content)

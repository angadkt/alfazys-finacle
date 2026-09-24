import os
import re

filepath = "/Users/angadkt/Desktop/coding/Alfazyz finacle/src/pages/CustomersPage.tsx"
with open(filepath, "r") as f:
    content = f.read()

# 1. Add import for CustomerTable
content = content.replace("import type { Customer } from '../services/db';", "import type { Customer } from '../services/db';\nimport CustomerTable from '../components/CustomerTable';")

# 2. Update filtered logic
old_filtered_logic = """  // Filtered List
  const filteredCustomers = customers.filter(c => {
    if (!c) return false;

    // 1. Filter by status
    if (statusFilter !== 'all' && c.status !== statusFilter) {
      return false;
    }"""

new_filtered_logic = """  // Pending Requests (Separate Section)
  const pendingCustomers = customers.filter(c => {
    if (!c || c.status !== 'pending') return false;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      (c.name || '').toLowerCase().includes(query) ||
      (c.email || '').toLowerCase().includes(query) ||
      (c.phone || '').includes(query) ||
      (c.city || '').toLowerCase().includes(query) ||
      (c.emirates || c.country || '').toLowerCase().includes(query)
    );
  });

  // Filtered List for Main Registry (Excludes Pending)
  const filteredCustomers = customers.filter(c => {
    if (!c || c.status === 'pending') return false;

    // 1. Filter by status
    if (statusFilter !== 'all' && c.status !== statusFilter) {
      return false;
    }"""
content = content.replace(old_filtered_logic, new_filtered_logic)

# 3. Remove PENDING PILL
pending_pill = """                  {/* PENDING PILL */}
                  <button
                    onClick={() => setStatusFilter('pending')}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
                      statusFilter === 'pending'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${statusFilter === 'pending' ? 'bg-amber-500 animate-pulse' : 'bg-amber-500/50'}`} />
                    <span>Pending</span>
                    <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] ${statusFilter === 'pending' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'}`}>{pendingCount}</span>
                  </button>"""
content = content.replace(pending_pill, "")

# 4. Total Count update
content = content.replace("const totalCount = customers.length;", "const totalCount = customers.filter(c => c && c.status !== 'pending').length;")

# 5. Render new Pending Section and replace the old table rendering
table_block_pattern = re.compile(r"              \{\/\* Customers Data Table \*\/\}\n              <div className=\"overflow-x-auto\">.*?<\/table>\n              <\/div>", re.DOTALL)

new_table_render = """              {/* Main Customers Data Table */}
              <CustomerTable 
                customers={filteredCustomers}
                isAdmin={isAdmin}
                onApprove={handleQuickApprove}
                onReject={handleQuickReject}
              />"""
content = re.sub(table_block_pattern, new_table_render, content)

# 6. Add Pending Section right before Unified Data Card
unified_card_start = "            {/* Unified Data Card */}"
pending_section = """            {/* Pending Requests Section */}
            {pendingCustomers.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 shadow-sm rounded-lg overflow-hidden flex flex-col">
                 <div className="p-4 sm:p-5 border-b border-amber-200/60 flex items-center justify-between">
                    <h2 className="text-sm font-black text-amber-900 uppercase tracking-widest flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                       Action Required: Pending Requests
                    </h2>
                 </div>
                 <CustomerTable 
                    customers={pendingCustomers}
                    isAdmin={isAdmin}
                    onApprove={handleQuickApprove}
                    onReject={handleQuickReject}
                  />
              </div>
            )}
            
            """
content = content.replace(unified_card_start, pending_section + unified_card_start)

with open(filepath, "w") as f:
    f.write(content)

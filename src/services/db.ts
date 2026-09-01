import initialData from '../data/db.json';

export interface User {
 name: string;
 email: string;
 avatar: string;
 occupation: string;
 joinedDate: string;
}

export type UserRole = 'super_admin' | 'staff' | 'agent';

export const mockUsers: Record<UserRole, User> = {
 super_admin: {
 name: "Sarah Al-Fayed",
 email: "sarah.alfayed@finacle.io",
 avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120",
 occupation: "Operations Manager & Checker (Admin)",
 joinedDate: "2024-03-12"
 },
 staff: {
 name: "David Miller",
 email: "david.miller@finacle.io",
 avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120",
 occupation: "Branch Operations Specialist (Staff Maker)",
 joinedDate: "2025-01-15"
 },
 agent: {
 name: "Marcus Vance",
 email: "marcus.vance@finacle.io",
 avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120",
 occupation: "Field Relationship Agent (Agent)",
 joinedDate: "2025-06-20"
 }
};

export interface Account {
 id: string;
 type: string;
 accountNumber: string;
 routingNumber: string;
 balance: number;
 currency: string;
 status: 'active' | 'suspended';
}

export interface Transaction {
 id: string;
 accountId: string;
 date: string;
 description: string;
 amount: number;
 type: 'deposit' | 'withdrawal' | 'transfer';
 category: string;
 status: 'pending' | 'completed' | 'failed';
}

export interface Card {
 id: string;
 type: string;
 cardNumber: string;
 cardholderName: string;
 expiry: string;
 status: 'active' | 'blocked';
 limit: number;
 balance: number;
 color: string;
}

export interface Recipient {
 id: string;
 name: string;
 accountNumber: string;
 bankName: string;
 email: string;
 avatar: string;
}

export interface Customer {
 id: string;
 name: string;
 email: string;
 phone: string;
 country: string;
 status: 'approved' | 'rejected' | 'pending';
 balance: number;
 joinedDate: string;
 shortName?: string;
 address?: string;
 city?: string;
 emirates?: string;
}

export interface DbSchema {
 user: User;
 accounts: Account[];
 transactions: Transaction[];
 cards: Card[];
 recipients: Recipient[];
 customers: Customer[];
}

const STORAGE_KEY = 'infazys_finacle_db';

// Helper to save to localStorage
const saveDb = (data: DbSchema): void => {
 localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// Helper to load from localStorage or fallback to initial JSON data
export const getDb = (): DbSchema => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    // TypeScript cast of initial JSON data to ensure types match
    const typedInitialData = initialData as DbSchema;
    saveDb(typedInitialData);
    localStorage.setItem('infazys_finacle_db_cleaned', 'true');
    return typedInitialData;
  }
  try {
    const db = JSON.parse(stored) as DbSchema;
    
    // Clean old mock/test data once to start with a clean slate
    const cleanedFlag = localStorage.getItem('infazys_finacle_db_cleaned');
    if (!cleanedFlag) {
      db.customers = [];
      saveDb(db);
      localStorage.setItem('infazys_finacle_db_cleaned', 'true');
    }

    // Migrate old IDs (e.g. cust-1787569091856) to FZ00010 sequential format
    let migrated = false;
    if (db.customers && Array.isArray(db.customers)) {
      db.customers = db.customers.map((c, index) => {
        if (c && typeof c.id === 'string' && !c.id.startsWith('FZ')) {
          migrated = true;
          const seq = 10 + index;
          const padded = String(seq).padStart(5, '0');
          return { ...c, id: `FZ${padded}` };
        }
        return c;
      });
      if (migrated) {
        saveDb(db);
      }
    }
    
    return db;
  } catch (e) {
    console.error('Failed to parse database, resetting to default', e);
    const typedInitialData = initialData as DbSchema;
    saveDb(typedInitialData);
    localStorage.setItem('infazys_finacle_db_cleaned', 'true');
    return typedInitialData;
  }
};

export const dbService = {
 // Get entire database state
 getDb,

 // Get active role
 getUserRole: (): UserRole => {
 return (localStorage.getItem('infazys_finacle_active_role') as UserRole) || 'super_admin';
 },

 // Set active role
 setUserRole: (role: UserRole): void => {
 localStorage.setItem('infazys_finacle_active_role', role);
 },

 // Get user profile based on role
 getUser: (): User => {
 const role = (localStorage.getItem('infazys_finacle_active_role') as UserRole) || 'super_admin';
 return mockUsers[role] || mockUsers.super_admin;
 },

 // Update user profile
 updateUser: (updates: Partial<User>): User => {
 const role = (localStorage.getItem('infazys_finacle_active_role') as UserRole) || 'super_admin';
 mockUsers[role] = { ...mockUsers[role], ...updates };
 return mockUsers[role];
 },

 // Get all accounts
 getAccounts: (): Account[] => {
 return getDb().accounts;
 },

 // Get all cards
 getCards: (): Card[] => {
 return getDb().cards;
 },

 // Get all transactions
 getTransactions: (): Transaction[] => {
 return getDb().transactions.sort(
 (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
 );
 },

 // Get transactions for a specific account
 getTransactionsByAccount: (accountId: string): Transaction[] => {
 return getDb()
 .transactions.filter((tx) => tx.accountId === accountId)
 .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
 },

 // Get quick-transfer recipients
 getRecipients: (): Recipient[] => {
 return getDb().recipients;
 },

 // Add a recipient
 addRecipient: (recipient: Omit<Recipient, 'id'>): Recipient => {
 const db = getDb();
 const newRecipient: Recipient = {
 ...recipient,
 id: `rec-${Date.now()}`
 };
 db.recipients.push(newRecipient);
 saveDb(db);
 return newRecipient;
 },

 // Perform a new transaction (deposit, withdrawal, transfer)
 createTransaction: (
 txData: Omit<Transaction, 'id' | 'date' | 'status'>
 ): Transaction | null => {
 const db = getDb();
 const accountIndex = db.accounts.findIndex((acc) => acc.id === txData.accountId);
 if (accountIndex === -1) return null;

 const account = db.accounts[accountIndex];

 // Adjust account balance based on transaction type
 if (txData.type === 'withdrawal' || txData.type === 'transfer') {
 if (account.balance < txData.amount) {
 // Insufficient funds
 return null;
 }
 account.balance -= txData.amount;
 } else if (txData.type === 'deposit') {
 account.balance += txData.amount;
 }

 const newTx: Transaction = {
 ...txData,
 id: `tx-${Date.now()}`,
 date: new Date().toISOString(),
 status: 'completed'
 };

 db.transactions.push(newTx);
 db.accounts[accountIndex] = account;

 // If it's a transfer to one of our own cards or external, we handle it.
 // For this mock db, if description matches a card payment, update the card balance too.
 if (txData.type === 'transfer' && txData.description.startsWith('Card Payment:')) {
 const cardNum = txData.description.split(':').pop()?.trim();
 const cardIndex = db.cards.findIndex((c) => c.cardNumber.endsWith(cardNum || ''));
 if (cardIndex !== -1) {
 db.cards[cardIndex].balance = Math.max(0, db.cards[cardIndex].balance - txData.amount);
 }
 }

 saveDb(db);
 return newTx;
 },

 // Get all customers
 getCustomers: (): Customer[] => {
 const db = getDb();
 if (!db.customers) {
 db.customers = (initialData as any).customers || [];
 saveDb(db);
 }
 return db.customers;
 },

 // Add a customer
 addCustomer: (customer: Omit<Customer, 'id' | 'joinedDate'>): Customer => {
 const db = getDb();
 if (!db.customers) {
 db.customers = [];
 }

 // Generate sequential ID like FZ00010, FZ00011, FZ00012, etc.
 let maxSeq = 9; // Next starts at 10 (FZ00010)
 db.customers.forEach(c => {
 if (c && typeof c.id === 'string') {
 const match = c.id.match(/^FZ(\d+)$/);
 if (match) {
 const seq = parseInt(match[1], 10);
 if (seq > maxSeq) {
 maxSeq = seq;
 }
 }
 }
 });
 const nextSeq = maxSeq + 1;
 const padded = String(nextSeq).padStart(5, '0');
 const newId = `FZ${padded}`;

 const newCustomer: Customer = {
 ...customer,
 id: newId,
 joinedDate: new Date().toISOString().split('T')[0]
 };
 db.customers.push(newCustomer);
 saveDb(db);
 return newCustomer;
 },

 // Update an existing customer
 updateCustomer: (id: string, updates: Partial<Customer>): Customer | null => {
 const db = getDb();
 const index = db.customers.findIndex(c => c.id === id);
 if (index === -1) return null;
 db.customers[index] = { ...db.customers[index], ...updates };
 saveDb(db);
 return db.customers[index];
 },

 // Reset database to default mock JSON state
 resetDb: (): DbSchema => {
 const typedInitialData = initialData as DbSchema;
 saveDb(typedInitialData);
 return typedInitialData;
 }
};

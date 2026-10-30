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
    name: "Admin User",
    email: "admin@finacle.io",
    avatar: "",
    occupation: "Admin",
    joinedDate: ""
  },
  staff: {
    name: "Staff User",
    email: "staff@finacle.io",
    avatar: "",
    occupation: "Staff",
    joinedDate: ""
  },
  agent: {
    name: "Agent User",
    email: "agent@finacle.io",
    avatar: "",
    occupation: "Agent",
    joinedDate: ""
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
  status: 'completed' | 'pending' | 'failed';
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
  issuedBy?: string;
  verifiedBy?: string;
  balance: number;
  joinedDate: string;
  shortName?: string;
  address?: string;
  city?: string;
  emirates?: string;
}

export interface UtrItem {
  id: string;
  amount: number;
  utrNumber: string;
  status: 'Completed' | 'Pending' | 'Failed';
  timestamp?: string;
}

export interface CreditEntry {
  id: string;
  receiptNo?: string;
  paymentDate: string;
  beneficiaryName: string;
  transactionDate: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  totalAmount: number;
  utrItems: UtrItem[];
  paymentMode: 'Bank Transfer' | 'Cash' | 'Cheque' | 'RTGS' | 'NEFT' | 'IMPS' | 'Other';
  companyBankAccount: string;
  purpose: string;
  remarks: string;
  status: 'Completed' | 'Pending' | 'Cancelled';
  createdBy: string;
  verifiedBy?: string;
  createdAt?: string;
  timestamp?: string;
}

export const CreditEntry = {};
export const UtrItem = {};

export const initialCreditEntries: CreditEntry[] = [];

import { DEFAULT_STAFF_PERMISSIONS } from '../types/staff';
import type { StaffMember, StaffPermissions, StaffEmailNotification } from '../types/staff';
import type { 
  Flat, 
  Room, 
  MessPlan, 
  Member, 
  RentInvoice, 
  RentPayment, 
  EmailNoticeLog 
} from '../types/flt';

export interface DbSchema {
  user: User;
  accounts: Account[];
  transactions: Transaction[];
  cards: Card[];
  recipients: Recipient[];
  customers: Customer[];
  creditEntries?: CreditEntry[];
  staffMembers?: StaffMember[];
  emailLogs?: StaffEmailNotification[];
  flats?: Flat[];
  rooms?: Room[];
  messPlans?: MessPlan[];
  members?: Member[];
  rentInvoices?: RentInvoice[];
  rentPayments?: RentPayment[];
  emailNoticeLogs?: EmailNoticeLog[];
}

export const initialFlats: Flat[] = [
  {
    id: 'FLT-101',
    flatNumber: 'Flat 304',
    buildingName: 'Al Huda Residence',
    areaLocation: 'Al Barsha 1, Dubai',
    totalRooms: 3,
    totalBedsCapacity: 8,
    landlordName: 'Mohamed Al Nuaimi',
    landlordPhone: '+971 50 882 1109',
    monthlyLeaseCost: 6500,
    electricityAccountNo: 'DEWA-8849201',
    wifiNetworkName: 'AlHuda_304_5G',
    wifiPassword: 'FastNet@2026',
    status: 'ACTIVE',
    createdDate: '2026-09-01'
  },
  {
    id: 'FLT-102',
    flatNumber: 'Flat 12B',
    buildingName: 'Marina Crown',
    areaLocation: 'Dubai Marina, Dubai',
    totalRooms: 2,
    totalBedsCapacity: 5,
    landlordName: 'Emaar Properties LLC',
    landlordPhone: '+971 4 366 1688',
    monthlyLeaseCost: 7200,
    electricityAccountNo: 'DEWA-7731902',
    wifiNetworkName: 'MarinaCrown_12B',
    wifiPassword: 'MarinaPass@2026',
    status: 'ACTIVE',
    createdDate: '2026-09-15'
  }
];

export const initialRooms: Room[] = [
  {
    id: 'RM-101',
    flatId: 'FLT-101',
    roomName: 'Room 1 (Master Bedroom)',
    roomType: 'DOUBLE_SHARING',
    hasAttachedBath: true,
    hasBalcony: true,
    acType: 'SPLIT',
    totalBeds: 2,
    occupiedBeds: 1,
    availableBeds: 1,
    defaultMonthlyRentPerBed: 1100,
    status: 'AVAILABLE'
  },
  {
    id: 'RM-102',
    flatId: 'FLT-101',
    roomName: 'Room 2 (Partition Room)',
    roomType: 'TRIPLE_SHARING',
    hasAttachedBath: false,
    hasBalcony: false,
    acType: 'CENTRAL',
    totalBeds: 3,
    occupiedBeds: 1,
    availableBeds: 2,
    defaultMonthlyRentPerBed: 750,
    status: 'AVAILABLE'
  },
  {
    id: 'RM-103',
    flatId: 'FLT-101',
    roomName: 'Room 3 (Balcony Room)',
    roomType: 'TRIPLE_SHARING',
    hasAttachedBath: false,
    hasBalcony: true,
    acType: 'SPLIT',
    totalBeds: 3,
    occupiedBeds: 1,
    availableBeds: 2,
    defaultMonthlyRentPerBed: 800,
    status: 'AVAILABLE'
  },
  {
    id: 'RM-104',
    flatId: 'FLT-102',
    roomName: 'Room A (Sea View)',
    roomType: 'DOUBLE_SHARING',
    hasAttachedBath: true,
    hasBalcony: true,
    acType: 'CENTRAL',
    totalBeds: 2,
    occupiedBeds: 0,
    availableBeds: 2,
    defaultMonthlyRentPerBed: 1300,
    status: 'AVAILABLE'
  },
  {
    id: 'RM-105',
    flatId: 'FLT-102',
    roomName: 'Room B (Executive)',
    roomType: 'TRIPLE_SHARING',
    hasAttachedBath: false,
    hasBalcony: false,
    acType: 'CENTRAL',
    totalBeds: 3,
    occupiedBeds: 0,
    availableBeds: 3,
    defaultMonthlyRentPerBed: 950,
    status: 'AVAILABLE'
  }
];

export const initialMessPlans: MessPlan[] = [
  {
    id: 'MESS-01',
    planName: '3-Times Daily Meals (Breakfast + Lunch + Dinner)',
    mealTypes: ['BREAKFAST', 'LUNCH', 'DINNER'],
    cuisineCategory: 'KERALA',
    monthlyPrice: 450,
    dailyPrice: 18,
    description: 'Hot fresh breakfast, rice/curry lunch, and dinner delivered daily to flat.',
    isActive: true
  },
  {
    id: 'MESS-02',
    planName: '2-Times Daily Meals (Lunch + Dinner)',
    mealTypes: ['LUNCH', 'DINNER'],
    cuisineCategory: 'NORTH_INDIAN',
    monthlyPrice: 350,
    dailyPrice: 14,
    description: 'Roti, sabzi, dal, rice for afternoon and night meals.',
    isActive: true
  },
  {
    id: 'MESS-03',
    planName: 'Dinner Only (Night Meal)',
    mealTypes: ['DINNER'],
    cuisineCategory: 'SOUTH_INDIAN',
    monthlyPrice: 220,
    dailyPrice: 9,
    description: 'Evening hot meals and chapati for busy office executives.',
    isActive: true
  }
];

export const initialMembers: Member[] = [
  {
    id: 'MBR-001',
    fullName: 'Rahul Sharma',
    phone: '+971 50 234 5678',
    email: 'rahul.sharma@example.com',
    assignedFlatId: 'FLT-101',
    assignedRoomId: 'RM-101',
    bedNumber: 'Bed 1 (Window)',
    agreedRoomRent: 1100,
    messPlanId: 'MESS-01',
    messFee: 450,
    joiningDate: '2026-10-01',
    rentDueDay: 1,
    securityDeposit: 500,
    status: 'ACTIVE',
    notes: 'Senior IT Analyst'
  },
  {
    id: 'MBR-002',
    fullName: 'Mohammed Anas',
    phone: '+971 55 876 1234',
    email: 'anas.dubai99@example.com',
    assignedFlatId: 'FLT-101',
    assignedRoomId: 'RM-102',
    bedNumber: 'Bed 1 (Lower)',
    agreedRoomRent: 750,
    messPlanId: 'MESS-02',
    messFee: 350,
    joiningDate: '2026-10-05',
    rentDueDay: 5,
    securityDeposit: 400,
    status: 'ACTIVE',
    notes: 'Sales Representative'
  },
  {
    id: 'MBR-003',
    fullName: 'Vishnu Prasad',
    phone: '+971 52 901 3456',
    email: 'vishnu.p@example.com',
    assignedFlatId: 'FLT-101',
    assignedRoomId: 'RM-103',
    bedNumber: 'Bed 1 (Balcony side)',
    agreedRoomRent: 800,
    messPlanId: undefined,
    messFee: 0,
    joiningDate: '2026-09-15',
    rentDueDay: 1,
    securityDeposit: 500,
    status: 'ACTIVE',
    notes: 'Cooking on own'
  }
];

export const initialStaffMembers: StaffMember[] = [
  {
    id: 'STF0001',
    fullName: 'SHANIF KS',
    staffCode: 'F2345',
    loginUsername: 'shanifksf2345',
    email: 'staff@finacle.io',
    password: 'user',
    role: 'staff',
    status: 'active',
    mustChangePassword: false,
    permissions: { ...DEFAULT_STAFF_PERMISSIONS },
    createdAt: '2026-10-01T08:00:00.000Z',
    lastLoginAt: '2026-10-14T10:30:00.000Z',
    emailSentAt: '2026-10-01T08:00:00.000Z'
  },
  {
    id: 'STF0002',
    fullName: 'AMAN',
    staffCode: '123',
    loginUsername: 'aman123',
    email: 'newstaff@infazys.com',
    password: 'TempPassword123!',
    role: 'staff',
    status: 'pending_first_login',
    mustChangePassword: true,
    permissions: {
      'DASHBOARD': true,
      'CREATE RETAIL CIF': true,
      'VERIFY RETAIL CIF CREATION': false,
      'VERIFY RETAIL CIF MODIFICATION': false,
      'VIEW RETAIL CIF': true,
      'OPEN ACCOUNT': true,
      'ACCOUNT ENQUIRY (ACIQ)': true,
      'ACCOUNT STATEMENT (ACLI)': true,
      'ACCOUNT LEDGER (ACLI)': true,
      'ORDER ENTRY': false,
      'CREDIT ENTRY': true,
      'AED COLLECTON': false,
      'RECEIVED AED': false,
      'AED SUMMARY & REPORTS': false,
      'PENDING AED REPORT': false,
    },
    createdAt: '2026-10-14T09:00:00.000Z',
    emailSentAt: '2026-10-14T09:00:00.000Z',
    lastSentPassword: 'TempPassword123!'
  }
];

import { generateStaffEmailHtml } from './emailDispatch';

export const createStaffEmailContent = (
  toEmail: string,
  staffId: string,
  temporaryPassword: string,
  extra?: { fullName?: string; staffCode?: string; loginUsername?: string }
): StaffEmailNotification => {
  const fullName = extra?.fullName || toEmail.split('@')[0].toUpperCase();
  const staffCode = extra?.staffCode || staffId;
  const loginUsername = extra?.loginUsername || toEmail;

  const { html } = generateStaffEmailHtml({
    toEmail,
    fullName,
    staffCode,
    loginUsername,
    temporaryPassword
  });

  return {
    toEmail,
    staffId,
    fullName,
    staffCode,
    loginUsername,
    temporaryPassword,
    sentAt: new Date().toISOString(),
    subject: 'Infazys Finacle — Staff Portal Credentials & Access Key',
    htmlBody: html,
    smtpDispatched: true
  };
};

const STORAGE_KEY = 'infazys_finacle_db';

// Helper to save to localStorage
const saveDb = (data: DbSchema): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// Helper to load from localStorage or fallback to initial JSON data
export const getDb = (): DbSchema => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const typedInitialData = initialData as DbSchema;
    typedInitialData.creditEntries = [...initialCreditEntries];
    typedInitialData.staffMembers = [...initialStaffMembers];
    typedInitialData.emailLogs = [];
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

    if (!db.creditEntries || !Array.isArray(db.creditEntries) || db.creditEntries.length === 0) {
      db.creditEntries = [...initialCreditEntries];
      saveDb(db);
    }

    if (!db.staffMembers || !Array.isArray(db.staffMembers) || db.staffMembers.length === 0) {
      db.staffMembers = [...initialStaffMembers];
      saveDb(db);
    }

    if (!db.emailLogs || !Array.isArray(db.emailLogs)) {
      db.emailLogs = [];
      saveDb(db);
    }

    if (!db.flats || !Array.isArray(db.flats) || db.flats.length === 0) {
      db.flats = [...initialFlats];
      saveDb(db);
    }

    if (!db.rooms || !Array.isArray(db.rooms) || db.rooms.length === 0) {
      db.rooms = [...initialRooms];
      saveDb(db);
    }

    if (!db.messPlans || !Array.isArray(db.messPlans) || db.messPlans.length === 0) {
      db.messPlans = [...initialMessPlans];
      saveDb(db);
    }

    if (!db.members || !Array.isArray(db.members) || db.members.length === 0) {
      db.members = [...initialMembers];
      saveDb(db);
    }

    if (!db.rentInvoices || !Array.isArray(db.rentInvoices)) {
      db.rentInvoices = [];
      saveDb(db);
    }

    if (!db.rentPayments || !Array.isArray(db.rentPayments)) {
      db.rentPayments = [];
      saveDb(db);
    }

    if (!db.emailNoticeLogs || !Array.isArray(db.emailNoticeLogs)) {
      db.emailNoticeLogs = [];
      saveDb(db);
    }
    
    return db;
  } catch (e) {
    console.error('Failed to parse database, resetting to default', e);
    const typedInitialData = initialData as DbSchema;
    typedInitialData.creditEntries = [...initialCreditEntries];
    typedInitialData.staffMembers = [...initialStaffMembers];
    typedInitialData.emailLogs = [];
    typedInitialData.flats = [...initialFlats];
    typedInitialData.rooms = [...initialRooms];
    typedInitialData.messPlans = [...initialMessPlans];
    typedInitialData.members = [...initialMembers];
    typedInitialData.rentInvoices = [];
    typedInitialData.rentPayments = [];
    typedInitialData.emailNoticeLogs = [];
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

  // Clear user session
  clearUserSession: (): void => {
    localStorage.removeItem('infazys_finacle_active_role');
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

  // Credit Entries Management
  getCreditEntries: (): CreditEntry[] => {
    const db = getDb();
    if (!db.creditEntries || db.creditEntries.length === 0) {
      db.creditEntries = [...initialCreditEntries];
      saveDb(db);
    }
    return db.creditEntries;
  },

  addCreditEntry: (entry: Omit<CreditEntry, 'id' | 'createdAt'>): CreditEntry => {
    const db = getDb();
    if (!db.creditEntries) {
      db.creditEntries = [...initialCreditEntries];
    }
    const count = db.creditEntries.length + 1;
    const entryId = `CE-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(count).padStart(3, '0')}`;
    const newEntry: CreditEntry = {
      ...entry,
      id: entryId,
      createdAt: new Date().toISOString()
    };
    db.creditEntries.unshift(newEntry);

    // Maintain FINCORE accounting integrity (SRS Section 13.3)
    if (db.accounts && db.accounts.length > 0) {
      const acc = db.accounts[0];
      const newTx: Transaction = {
        id: `tx-ce-${Date.now()}`,
        accountId: acc.id,
        date: new Date().toISOString(),
        description: `Credit Entry: ${newEntry.beneficiaryName} [UTR: ${newEntry.utrItems.map(u => u.utrNumber).join(', ')}]`,
        amount: newEntry.totalAmount,
        type: 'withdrawal',
        category: 'Credit Entry Settlement',
        status: 'completed'
      };
      if (acc.balance >= newEntry.totalAmount) {
        acc.balance -= newEntry.totalAmount;
      }
      db.transactions.unshift(newTx);
    }

    saveDb(db);
    return newEntry;
  },

  updateCreditEntry: (id: string, updates: Partial<CreditEntry>): CreditEntry | null => {
    const db = getDb();
    if (!db.creditEntries) return null;
    const index = db.creditEntries.findIndex(e => e.id === id);
    if (index === -1) return null;
    db.creditEntries[index] = { ...db.creditEntries[index], ...updates };
    saveDb(db);
    return db.creditEntries[index];
  },

  cancelCreditEntry: (id: string): CreditEntry | null => {
    const db = getDb();
    if (!db.creditEntries) return null;
    const index = db.creditEntries.findIndex(e => e.id === id);
    if (index === -1) return null;
    db.creditEntries[index].status = 'Cancelled';
    saveDb(db);
    return db.creditEntries[index];
  },

  deleteCreditEntry: (id: string): boolean => {
    const db = getDb();
    if (!db.creditEntries) return false;
    const initialLength = db.creditEntries.length;
    db.creditEntries = db.creditEntries.filter(e => e.id !== id);
    if (db.creditEntries.length !== initialLength) {
      saveDb(db);
      return true;
    }
    return false;
  },

  // Reset database to default mock JSON state
  resetDb: (): DbSchema => {
    const typedInitialData = initialData as DbSchema;
    typedInitialData.creditEntries = [...initialCreditEntries];
    typedInitialData.staffMembers = [...initialStaffMembers];
    typedInitialData.emailLogs = [];
    saveDb(typedInitialData);
    return typedInitialData;
  },

  // Staff Management Service
  getStaffMembers: (): StaffMember[] => {
    const db = getDb();
    if (!db.staffMembers || db.staffMembers.length === 0) {
      db.staffMembers = [...initialStaffMembers];
      saveDb(db);
    }
    return db.staffMembers;
  },

  getStaffById: (id: string): StaffMember | undefined => {
    const staffList = dbService.getStaffMembers();
    return staffList.find(s => s.id === id);
  },

  getStaffByEmail: (email: string): StaffMember | undefined => {
    const staffList = dbService.getStaffMembers();
    const clean = email.trim().toLowerCase();
    return staffList.find(s => s.email.toLowerCase() === clean || (s.loginUsername && s.loginUsername.toLowerCase() === clean));
  },

  getStaffByCredential: (credential: string): StaffMember | undefined => {
    const staffList = dbService.getStaffMembers();
    const clean = credential.trim().toLowerCase();
    return staffList.find(s => 
      (s.loginUsername && s.loginUsername.toLowerCase() === clean) ||
      s.email.toLowerCase() === clean ||
      (s.staffCode && s.staffCode.toLowerCase() === clean) ||
      s.id.toLowerCase() === clean
    );
  },

  addStaffMember: (data: { 
    fullName?: string;
    staffCode?: string;
    loginUsername?: string;
    email: string; 
    password?: string; 
    permissions?: StaffPermissions;
    sendEmail?: boolean;
  }): { staff: StaffMember; emailNotification: StaffEmailNotification } => {
    const db = getDb();
    if (!db.staffMembers) {
      db.staffMembers = [...initialStaffMembers];
    }
    if (!db.emailLogs) {
      db.emailLogs = [];
    }

    // Generate unique sequential Staff ID: STF0001, STF0002...
    let maxSeq = 0;
    db.staffMembers.forEach(s => {
      const match = s.id.match(/^STF(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxSeq) maxSeq = num;
      }
    });
    const nextSeq = maxSeq + 1;
    const staffId = `STF${String(nextSeq).padStart(4, '0')}`;

    const rawPassword = data.password && data.password.trim().length > 0 
      ? data.password.trim() 
      : `Finacle@${Math.floor(1000 + Math.random() * 9000)}`;

    const fullName = data.fullName?.trim() || data.email.split('@')[0].toUpperCase();
    const staffCode = data.staffCode?.trim() || staffId;
    const cleanName = fullName.toLowerCase().replace(/\s+/g, '');
    const cleanCode = staffCode.toLowerCase();
    const loginUsername = data.loginUsername?.trim().toLowerCase() || `${cleanName}${cleanCode}`;

    const newStaff: StaffMember = {
      id: staffId,
      fullName,
      staffCode,
      loginUsername,
      email: data.email.trim().toLowerCase(),
      password: rawPassword,
      role: 'staff',
      status: 'pending_first_login',
      mustChangePassword: true,
      permissions: data.permissions || { ...DEFAULT_STAFF_PERMISSIONS },
      createdAt: new Date().toISOString(),
      emailSentAt: new Date().toISOString(),
      lastSentPassword: rawPassword
    };

    db.staffMembers.push(newStaff);

    // Create simulated corporate email dispatch
    const emailNotification = createStaffEmailContent(newStaff.email, newStaff.id, rawPassword, {
      fullName: newStaff.fullName,
      staffCode: newStaff.staffCode,
      loginUsername: newStaff.loginUsername
    });
    db.emailLogs.unshift(emailNotification);

    saveDb(db);
    return { staff: newStaff, emailNotification };
  },

  updateStaffMember: (id: string, updates: Partial<StaffMember>): StaffMember | null => {
    const db = getDb();
    if (!db.staffMembers) return null;
    const index = db.staffMembers.findIndex(s => s.id === id);
    if (index === -1) return null;

    db.staffMembers[index] = { ...db.staffMembers[index], ...updates };
    saveDb(db);
    return db.staffMembers[index];
  },

  updateStaffPermissions: (id: string, permissions: StaffPermissions): StaffMember | null => {
    const db = getDb();
    if (!db.staffMembers) return null;
    const index = db.staffMembers.findIndex(s => s.id === id);
    if (index === -1) return null;

    db.staffMembers[index].permissions = permissions;
    saveDb(db);
    return db.staffMembers[index];
  },

  resendStaffCredentials: (id: string): StaffEmailNotification | null => {
    const db = getDb();
    if (!db.staffMembers) return null;
    const staff = db.staffMembers.find(s => s.id === id);
    if (!staff) return null;

    const emailNotification = createStaffEmailContent(staff.email, staff.id, staff.password, {
      fullName: staff.fullName,
      staffCode: staff.staffCode,
      loginUsername: staff.loginUsername
    });
    staff.emailSentAt = new Date().toISOString();
    staff.lastSentPassword = staff.password;
    if (!db.emailLogs) db.emailLogs = [];
    db.emailLogs.unshift(emailNotification);
    saveDb(db);
    return emailNotification;
  },

  deleteStaffMember: (id: string): boolean => {
    const db = getDb();
    if (!db.staffMembers) return false;
    const initialLen = db.staffMembers.length;
    db.staffMembers = db.staffMembers.filter(s => s.id !== id);
    if (db.staffMembers.length !== initialLen) {
      saveDb(db);
      return true;
    }
    return false;
  },

  getCurrentUserStaff: (): StaffMember | null => {
    const activeEmail = localStorage.getItem('infazys_user_email');
    if (!activeEmail) return null;
    return dbService.getStaffByEmail(activeEmail) || null;
  },

  changeStaffPassword: (email: string, oldPass: string, newPass: string): { success: boolean; message: string } => {
    const db = getDb();
    if (!db.staffMembers) {
      db.staffMembers = [...initialStaffMembers];
    }
    const staff = db.staffMembers.find(s => s.email.toLowerCase() === email.trim().toLowerCase());
    if (!staff) {
      return { success: false, message: 'Staff user record not found.' };
    }

    if (staff.password !== oldPass) {
      return { success: false, message: 'Existing temporary or old password does not match.' };
    }

    staff.password = newPass;
    staff.mustChangePassword = false;
    staff.status = 'active';
    staff.lastPasswordChangedAt = new Date().toISOString();
    saveDb(db);

    // Clear compulsory flag in storage
    localStorage.removeItem('infazys_must_change_password');
    return { success: true, message: 'Password updated successfully. Terminal unlocked.' };
  },

  getEmailLogs: (): StaffEmailNotification[] => {
    return getDb().emailLogs || [];
  },

  // --- FLT (Flat & Mess Management) Methods ---
  getFlats: (): Flat[] => {
    return getDb().flats || [];
  },

  getFlatById: (id: string): Flat | undefined => {
    return (getDb().flats || []).find(f => f.id === id);
  },

  saveFlat: (flat: Flat): Flat => {
    const db = getDb();
    if (!db.flats) db.flats = [];
    const index = db.flats.findIndex(f => f.id === flat.id);
    if (index >= 0) {
      db.flats[index] = flat;
    } else {
      db.flats.unshift(flat);
    }
    saveDb(db);
    return flat;
  },

  deleteFlat: (id: string): boolean => {
    const db = getDb();
    if (!db.flats) return false;
    const initialLen = db.flats.length;
    db.flats = db.flats.filter(f => f.id !== id);
    if (db.flats.length !== initialLen) {
      saveDb(db);
      return true;
    }
    return false;
  },

  getRooms: (flatId?: string): Room[] => {
    const rooms = getDb().rooms || [];
    if (flatId && flatId !== 'ALL') {
      return rooms.filter(r => r.flatId === flatId);
    }
    return rooms;
  },

  getRoomById: (id: string): Room | undefined => {
    return (getDb().rooms || []).find(r => r.id === id);
  },

  saveRoom: (room: Room): Room => {
    const db = getDb();
    if (!db.rooms) db.rooms = [];
    const index = db.rooms.findIndex(r => r.id === room.id);
    if (index >= 0) {
      db.rooms[index] = room;
    } else {
      db.rooms.push(room);
    }
    saveDb(db);
    return room;
  },

  deleteRoom: (id: string): boolean => {
    const db = getDb();
    if (!db.rooms) return false;
    const initialLen = db.rooms.length;
    db.rooms = db.rooms.filter(r => r.id !== id);
    if (db.rooms.length !== initialLen) {
      saveDb(db);
      return true;
    }
    return false;
  },

  getMessPlans: (): MessPlan[] => {
    return getDb().messPlans || [];
  },

  saveMessPlan: (plan: MessPlan): MessPlan => {
    const db = getDb();
    if (!db.messPlans) db.messPlans = [];
    const index = db.messPlans.findIndex(p => p.id === plan.id);
    if (index >= 0) {
      db.messPlans[index] = plan;
    } else {
      db.messPlans.push(plan);
    }
    saveDb(db);
    return plan;
  },

  deleteMessPlan: (id: string): boolean => {
    const db = getDb();
    if (!db.messPlans) return false;
    const initialLen = db.messPlans.length;
    db.messPlans = db.messPlans.filter(p => p.id !== id);
    if (db.messPlans.length !== initialLen) {
      saveDb(db);
      return true;
    }
    return false;
  },

  getMembers: (flatId?: string): Member[] => {
    const members = getDb().members || [];
    if (flatId && flatId !== 'ALL') {
      return members.filter(m => m.assignedFlatId === flatId);
    }
    return members;
  },

  getMemberById: (id: string): Member | undefined => {
    return (getDb().members || []).find(m => m.id === id);
  },

  saveMember: (member: Member): Member => {
    const db = getDb();
    if (!db.members) db.members = [];
    const index = db.members.findIndex(m => m.id === member.id);
    if (index >= 0) {
      db.members[index] = member;
    } else {
      db.members.unshift(member);
    }
    if (db.rooms) {
      const room = db.rooms.find(r => r.id === member.assignedRoomId);
      if (room) {
        const roomMembers = db.members.filter(m => m.assignedRoomId === room.id && m.status === 'ACTIVE');
        room.occupiedBeds = roomMembers.length;
        room.availableBeds = Math.max(0, room.totalBeds - room.occupiedBeds);
        room.status = room.availableBeds === 0 ? 'FULL' : 'AVAILABLE';
      }
    }
    saveDb(db);
    return member;
  },

  deleteMember: (id: string): boolean => {
    const db = getDb();
    if (!db.members) return false;
    const memberToDelete = db.members.find(m => m.id === id);
    const initialLen = db.members.length;
    db.members = db.members.filter(m => m.id !== id);
    if (db.members.length !== initialLen) {
      if (memberToDelete && db.rooms) {
        const room = db.rooms.find(r => r.id === memberToDelete.assignedRoomId);
        if (room) {
          const roomMembers = db.members.filter(m => m.assignedRoomId === room.id && m.status === 'ACTIVE');
          room.occupiedBeds = roomMembers.length;
          room.availableBeds = Math.max(0, room.totalBeds - room.occupiedBeds);
          room.status = room.availableBeds === 0 ? 'FULL' : 'AVAILABLE';
        }
      }
      saveDb(db);
      return true;
    }
    return false;
  },

  getRentInvoices: (month?: string): RentInvoice[] => {
    const invoices = getDb().rentInvoices || [];
    if (month && month !== 'ALL') {
      return invoices.filter(inv => inv.billingMonth === month);
    }
    return invoices;
  },

  saveRentInvoice: (invoice: RentInvoice): RentInvoice => {
    const db = getDb();
    if (!db.rentInvoices) db.rentInvoices = [];
    const index = db.rentInvoices.findIndex(inv => inv.id === invoice.id);
    if (index >= 0) {
      db.rentInvoices[index] = invoice;
    } else {
      db.rentInvoices.unshift(invoice);
    }
    saveDb(db);
    return invoice;
  },

  generateMonthlyRentInvoices: (billingMonth: string): RentInvoice[] => {
    const db = getDb();
    if (!db.rentInvoices) db.rentInvoices = [];
    const members = db.members || [];
    const newInvoices: RentInvoice[] = [];

    members.forEach((member, idx) => {
      if (member.status !== 'ACTIVE') return;
      const existing = db.rentInvoices!.find(
        inv => inv.memberId === member.id && inv.billingMonth === billingMonth
      );
      if (!existing) {
        const seq = String(db.rentInvoices!.length + idx + 1).padStart(3, '0');
        const total = (member.agreedRoomRent || 0) + (member.messFee || 0);
        const inv: RentInvoice = {
          id: `INV-${billingMonth.replace('-', '')}-${seq}`,
          invoiceNumber: `FLT/${billingMonth.replace('-', '/')}/${seq}`,
          memberId: member.id,
          memberName: member.fullName,
          memberEmail: member.email,
          flatId: member.assignedFlatId,
          roomId: member.assignedRoomId,
          billingMonth,
          invoiceDate: `${billingMonth}-01`,
          dueDate: `${billingMonth}-${String(member.rentDueDay || 5).padStart(2, '0')}`,
          roomRentAmount: member.agreedRoomRent || 0,
          messAmount: member.messFee || 0,
          utilityCharges: 0,
          discountsOrDeductions: 0,
          totalAmountDue: total,
          amountPaid: 0,
          balanceDue: total,
          status: 'UNPAID',
          dueEmailSent: false
        };
        db.rentInvoices!.unshift(inv);
        newInvoices.push(inv);
      }
    });

    if (newInvoices.length > 0) {
      saveDb(db);
    }
    return db.rentInvoices!;
  },

  recordRentPayment: (payment: RentPayment): RentPayment => {
    const db = getDb();
    if (!db.rentPayments) db.rentPayments = [];
    db.rentPayments.unshift(payment);

    if (db.rentInvoices) {
      const invoice = db.rentInvoices.find(inv => inv.id === payment.invoiceId);
      if (invoice) {
        invoice.amountPaid = (invoice.amountPaid || 0) + payment.amountPaid;
        invoice.balanceDue = Math.max(0, invoice.totalAmountDue - invoice.amountPaid);
        invoice.status = invoice.balanceDue === 0 ? 'PAID' : 'PARTIALLY_PAID';
      }
    }
    saveDb(db);
    return payment;
  },

  getRentPayments: (invoiceId?: string): RentPayment[] => {
    const payments = getDb().rentPayments || [];
    if (invoiceId) {
      return payments.filter(p => p.invoiceId === invoiceId);
    }
    return payments;
  },

  getEmailNoticeLogs: (): EmailNoticeLog[] => {
    return getDb().emailNoticeLogs || [];
  },

  logEmailNotice: (log: EmailNoticeLog): void => {
    const db = getDb();
    if (!db.emailNoticeLogs) db.emailNoticeLogs = [];
    db.emailNoticeLogs.unshift(log);
    saveDb(db);
  }
};

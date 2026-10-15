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
}

export const initialStaffMembers: StaffMember[] = [
  {
    id: 'STF0001',
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
      'ORDER ENTRY': false,
      'CREDIT ENTRY': true,
      'AED COLLECTON': false,
      'RECEIVED AED': false,
      'AED SUMMARY & REPORTS': false,
    },
    createdAt: '2026-10-14T09:00:00.000Z',
    emailSentAt: '2026-10-14T09:00:00.000Z',
    lastSentPassword: 'TempPassword123!'
  }
];

export const createStaffEmailContent = (toEmail: string, staffId: string, temporaryPassword: string): StaffEmailNotification => {
  const loginUrl = (typeof window !== 'undefined' && window.location.origin) ? window.location.origin : 'https://alfazys-finacle.vercel.app';
  const dispatchId = 'FIN-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Date.now().toString().slice(-4);
  const sentDate = new Date().toUTCString();

  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Infazys Finacle Staff Provisioning</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b1528; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
  
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0b1528; padding: 30px 10px;">
    <tr>
      <td align="center">
        
        <!-- Main Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 620px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.35); border: 1px solid #1e3a63;">
          
          <!-- Top Classification Strip -->
          <tr>
            <td style="background-color: #06101e; padding: 9px 24px; border-bottom: 1px solid #1a2f4c;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="font-size: 10px; font-weight: 700; color: #d4af37; letter-spacing: 1.5px; text-transform: uppercase;">
                    &#9670; CONFIDENTIAL // INTERNAL BANKING CREDENTIALS
                  </td>
                  <td align="right" style="font-size: 10px; color: #94a3b8; font-family: monospace;">
                    REF: ${dispatchId}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Primary Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0a2540 0%, #104080 60%, #17549c 100%); padding: 30px; border-bottom: 3px solid #d4af37;">
              <div style="color: #f1b34c; font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px;">
                Department Of AL Faz Group
              </div>
              <div style="color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.2;">
                Finacle<sup style="font-size: 13px; font-weight: 400; color: #93c5fd;">&reg;</sup> Core Banking
              </div>
              <div style="color: #cbd5e1; font-size: 12px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase; margin-top: 4px;">
                Universal Payment Solution &bull; Staff Access Terminal
              </div>
            </td>
          </tr>

          <!-- Body Content Area -->
          <tr>
            <td style="padding: 30px 28px 24px 28px;">
              
              <h1 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #0f172a; line-height: 1.3;">
                Operator Account Successfully Provisioned
              </h1>
              <p style="margin: 0 0 18px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Dear Staff Member,<br>
                An authorized administrative session has provisioned your user account on the <strong>Infazys Finacle Universal Banking Core</strong>. Your terminal profile has been established with module-level access permissions.
              </p>

              <!-- Credentials Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; margin: 20px 0; overflow: hidden; border-left: 4px solid #104080;">
                <tr>
                  <td style="padding: 18px 20px;">
                    
                    <div style="font-size: 11px; font-weight: 800; color: #104080; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
                      AUTHENTICATION CREDENTIALS
                    </div>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size: 13px;">
                      <tr>
                        <td width="150" style="padding: 6px 0; color: #64748b; font-weight: 600;">Staff ID Code:</td>
                        <td style="padding: 6px 0; font-family: monospace; font-weight: 700; color: #0f172a; font-size: 14px;">
                          <span style="background-color: #e2e8f0; padding: 2px 8px; border-radius: 4px; border: 1px solid #cbd5e1;">${staffId}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Login User ID / Email:</td>
                        <td style="padding: 6px 0; font-weight: 700; color: #104080; font-size: 14px;">
                          ${toEmail}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-weight: 600;" valign="top">Temporary Access Key:</td>
                        <td style="padding: 8px 0;">
                          <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-left: 3px solid #dc2626; padding: 6px 12px; border-radius: 4px; display: inline-block;">
                            <span style="font-family: 'Courier New', Courier, monospace; font-size: 16px; font-weight: 800; color: #991b1b; letter-spacing: 1.5px;">
                              ${temporaryPassword}
                            </span>
                          </div>
                          <div style="font-size: 11px; color: #dc2626; font-weight: 600; margin-top: 4px;">
                            &#9888; Single-use temporary access key
                          </div>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

              <!-- Action CTA Button -->
              <div style="text-align: center; margin: 26px 0 22px 0;">
                <a href="${loginUrl}" target="_blank" style="background: linear-gradient(180deg, #104080 0%, #0a2540 100%); color: #ffffff; text-decoration: none; padding: 13px 30px; font-size: 13px; font-weight: 700; border-radius: 6px; display: inline-block; box-shadow: 0 4px 10px rgba(16,64,128,0.25); letter-spacing: 0.5px;">
                  ACCESS FINACLE TERMINAL &rarr;
                </a>
              </div>

              <!-- Mandatory First-Login Notice -->
              <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 14px 16px; margin-top: 20px;">
                <div style="font-size: 12px; line-height: 1.5; color: #92400e;">
                  <strong>MANDATORY FIRST-LOGIN SECURITY POLICY:</strong><br>
                  In accordance with banking dual-control security standards, you must change this temporary password immediately upon your initial sign-in. Banking operational screens (CIF Creation, Order Entry, AED Settlement) will remain restricted until a permanent confidential password has been set.
                </div>
              </div>

            </td>
          </tr>

          <!-- Corporate Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 24px; text-align: center;">
              <div style="font-size: 11px; font-weight: 700; color: #334155; margin-bottom: 4px;">
                INFAZYS FINACLE &bull; AL FAZ GROUP
              </div>
              <div style="font-size: 10px; color: #64748b; line-height: 1.4; margin-bottom: 8px;">
                Automated Transaction &amp; Core Banking System &bull; Enterprise Secure Delivery<br>
                Timestamp: ${sentDate} &bull; Dispatch ID: ${dispatchId}
              </div>
              <div style="font-size: 9px; color: #94a3b8; line-height: 1.3;">
                CONFIDENTIALITY NOTICE: This transmission is intended solely for the addressee and contains proprietary banking information.
              </div>
            </td>
          </tr>

        </table>
        
      </td>
    </tr>
  </table>

</body>
</html>`;

  return {
    toEmail,
    staffId,
    temporaryPassword,
    sentAt: new Date().toISOString(),
    subject: 'Infazys Finacle — Staff Portal Credentials & First-Time Access',
    htmlBody
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
    
    return db;
  } catch (e) {
    console.error('Failed to parse database, resetting to default', e);
    const typedInitialData = initialData as DbSchema;
    typedInitialData.creditEntries = [...initialCreditEntries];
    typedInitialData.staffMembers = [...initialStaffMembers];
    typedInitialData.emailLogs = [];
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
    return staffList.find(s => s.email.toLowerCase() === clean);
  },

  addStaffMember: (data: { 
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

    const newStaff: StaffMember = {
      id: staffId,
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
    const emailNotification = createStaffEmailContent(newStaff.email, newStaff.id, rawPassword);
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

    const emailNotification = createStaffEmailContent(staff.email, staff.id, staff.password);
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
  }
};

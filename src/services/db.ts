import initialData from '../data/db.json';

export interface User {
  name: string;
  email: string;
  avatar: string;
  occupation: string;
  joinedDate: string;
}

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

export interface DbSchema {
  user: User;
  accounts: Account[];
  transactions: Transaction[];
  cards: Card[];
  recipients: Recipient[];
}

const STORAGE_KEY = 'alfazyz_finacle_db';

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
    return typedInitialData;
  }
  try {
    return JSON.parse(stored) as DbSchema;
  } catch (e) {
    console.error('Failed to parse database, resetting to default', e);
    const typedInitialData = initialData as DbSchema;
    saveDb(typedInitialData);
    return typedInitialData;
  }
};

export const dbService = {
  // Get entire database state
  getDb,

  // Get user profile
  getUser: (): User => {
    return getDb().user;
  },

  // Update user profile
  updateUser: (updates: Partial<User>): User => {
    const db = getDb();
    db.user = { ...db.user, ...updates };
    saveDb(db);
    return db.user;
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

  // Reset database to default mock JSON state
  resetDb: (): DbSchema => {
    const typedInitialData = initialData as DbSchema;
    saveDb(typedInitialData);
    return typedInitialData;
  }
};

export type RoomType = 
  | 'SINGLE' 
  | 'DOUBLE_SHARING' 
  | 'TRIPLE_SHARING' 
  | 'FOUR_SHARING' 
  | 'SIX_SHARING' 
  | 'MASTER_BED';

export interface Flat {
  id: string;               // e.g. "FLT-101"
  flatNumber: string;       // e.g. "Flat 304"
  buildingName: string;     // e.g. "Al Huda Residence"
  areaLocation: string;     // e.g. "Al Barsha 1, Dubai"
  totalRooms: number;
  totalBedsCapacity: number;
  landlordName?: string;
  landlordPhone?: string;
  monthlyLeaseCost?: number;// Operational cost paid to landlord
  electricityAccountNo?: string;
  wifiNetworkName?: string;
  wifiPassword?: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  createdDate: string;
}

export interface Room {
  id: string;               // e.g. "RM-101"
  flatId: string;           // references Flat.id
  roomName: string;         // e.g. "Room A (Master)"
  roomType: RoomType;
  hasAttachedBath: boolean;
  hasBalcony: boolean;
  acType: 'CENTRAL' | 'SPLIT' | 'WINDOW';
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  defaultMonthlyRentPerBed: number; // e.g. 850 AED
  status: 'AVAILABLE' | 'FULL' | 'MAINTENANCE';
}

export interface Bedspace {
  id: string;               // e.g. "BED-101-1"
  roomId: string;
  flatId: string;
  bedNumber: string;        // e.g. "Bed 1 (Upper)"
  monthlyRent: number;
  isOccupied: boolean;
  currentMemberId?: string; // references Member.id
}

export interface MessPlan {
  id: string;               // e.g. "MESS-01"
  planName: string;         // e.g. "Standard 3-Meals Plan"
  mealTypes: ('BREAKFAST' | 'LUNCH' | 'DINNER')[];
  cuisineCategory: 'KERALA' | 'NORTH_INDIAN' | 'SOUTH_INDIAN' | 'ARABIC' | 'CONTINENTAL';
  monthlyPrice: number;     // e.g. 450 AED / month
  dailyPrice: number;       // e.g. 18 AED / day (for leave credits)
  description: string;
  isActive: boolean;
}

export interface Member {
  id: string;               // e.g. "MBR-001"
  fullName: string;         // e.g. "Ahmed Khan"
  phone: string;            // e.g. "+971 55 123 4567"
  email: string;            // Target for automated rent-due emails
  assignedFlatId: string;   // references Flat.id
  assignedRoomId: string;   // references Room.id
  bedNumber?: string;       // e.g. "Bed 2" or "Private Room"
  agreedRoomRent: number;   // e.g. 800 AED / month
  messPlanId?: string;      // e.g. "MESS-01" or empty/NONE
  messFee: number;          // e.g. 400 AED / month (0 if no food)
  joiningDate: string;      // e.g. "2026-11-01"
  rentDueDay: number;       // e.g. 1 or 5 (due day of each month)
  securityDeposit?: number; // Advance amount held
  status: 'ACTIVE' | 'INACTIVE';
  notes?: string;
}

export interface RentInvoice {
  id: string;               // e.g. "INV-202611-001"
  invoiceNumber: string;    // e.g. "FLT/2026/11/001"
  memberId: string;
  memberName: string;
  memberEmail: string;
  flatId: string;
  roomId: string;
  billingMonth: string;     // e.g. "2026-11"
  invoiceDate: string;
  dueDate: string;          // e.g. "2026-11-05"
  roomRentAmount: number;
  messAmount: number;
  utilityCharges: number;
  discountsOrDeductions: number;
  totalAmountDue: number;
  amountPaid: number;
  balanceDue: number;
  status: 'PAID' | 'PARTIALLY_PAID' | 'UNPAID' | 'OVERDUE';
  dueEmailSent: boolean;
  dueEmailSentAt?: string;
  lastReminderSentAt?: string;
}

export interface RentPayment {
  id: string;               // e.g. "RCPT-88910"
  invoiceId: string;
  memberId: string;
  paymentDate: string;
  amountPaid: number;
  paymentMode: 'CASH' | 'BANK_TRANSFER' | 'CDM_DEPOSIT' | 'CARD';
  referenceNo?: string;
  collectedBy: string;
  notes?: string;
}

export interface EmailNoticeLog {
  id: string;
  memberId: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  noticeType: 'RENT_DUE' | 'RENT_REMINDER' | 'OVERDUE_ALERT' | 'PAYMENT_RECEIPT';
  amountDue?: number;
  dueDate?: string;
  sentAt: string;
  status: 'SUCCESS' | 'FAILED';
  messageId?: string;
  error?: string;
}

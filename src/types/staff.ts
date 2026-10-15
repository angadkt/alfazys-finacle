export type FinacleScreen =
  | 'DASHBOARD'
  | 'CREATE RETAIL CIF'
  | 'VERIFY RETAIL CIF CREATION'
  | 'VERIFY RETAIL CIF MODIFICATION'
  | 'VIEW RETAIL CIF'
  | 'ORDER ENTRY'
  | 'CREDIT ENTRY'
  | 'AED COLLECTON'
  | 'RECEIVED AED'
  | 'AED SUMMARY & REPORTS';

export type StaffPermissions = Record<FinacleScreen, boolean>;

export const DEFAULT_STAFF_PERMISSIONS: StaffPermissions = {
  'DASHBOARD': true,
  'CREATE RETAIL CIF': true,
  'VERIFY RETAIL CIF CREATION': false, // Admin verification per SRS
  'VERIFY RETAIL CIF MODIFICATION': false, // Admin verification per SRS
  'VIEW RETAIL CIF': true,
  'ORDER ENTRY': true,
  'CREDIT ENTRY': true,
  'AED COLLECTON': true,
  'RECEIVED AED': true,
  'AED SUMMARY & REPORTS': true,
};

export interface StaffMember {
  id: string;               // e.g. "STF0010"
  email: string;
  password: string;          // Current active or temporary password
  role: 'staff';
  status: 'active' | 'pending_first_login' | 'suspended';
  mustChangePassword: boolean;
  permissions: StaffPermissions;
  createdAt: string;
  lastLoginAt?: string;
  lastPasswordChangedAt?: string;
  emailSentAt?: string;
  lastSentPassword?: string;
}

export interface StaffEmailNotification {
  toEmail: string;
  staffId: string;
  temporaryPassword: string;
  sentAt: string;
  subject: string;
  htmlBody: string;
}

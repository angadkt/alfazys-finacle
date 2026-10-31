/**
 * Finacle Account Scheme Codes & Dynamic Scheme Resolver Utility
 *
 * Core Finacle Account Format: [Branch Code] [Scheme Code (4 digits)] [Folio / Serial (6 digits)]
 * Standard Scheme Codes:
 *   1010 -> SERVICER (Servicer Float)
 *   1020 -> SAVINGS (Savings Bank Account - SBA)
 *   1030 -> CURRENT (Current Account - CAA)
 *   1040 -> BORROWED (Overdraft / Loan - ODA)
 *   1050 -> SALARY (Salary Account - SAL)
 *   1060 -> CORPORATE_SINGLE (Corporate Single - CAP-S)
 *   1070 -> CORPORATE_JOINT (Corporate Joint - CAP-J)
 *   2010 -> PROFIT (Profit Account - PFT)
 *   2020 -> EXPENSE (Expense Account - EXP)
 */

export const SCHEME_CODE_MAP: Record<string, string> = {
  "1010": "SERVICER",
  "1020": "SAVINGS",
  "1030": "CURRENT",
  "1040": "BORROWED",
  "1050": "SALARY",
  "1060": "CORPORATE_SINGLE",
  "1070": "CORPORATE_JOINT",
  "2010": "PROFIT",
  "2020": "EXPENSE",
};

export const SCHEME_NAME_MAP: Record<string, string> = {
  SERVICER: "1010",
  SAVINGS: "1020",
  CURRENT: "1030",
  BORROWED: "1040",
  SALARY: "1050",
  CORPORATE_SINGLE: "1060",
  CORPORATE_JOINT: "1070",
  PROFIT: "2010",
  EXPENSE: "2020",
};

/**
 * Resolves the true scheme key (e.g. "SAVINGS", "CURRENT", "SERVICER") for an account record.
 * Prioritizes the 4-digit scheme code embedded in the Finacle account number if present,
 * ensuring accuracy even when backend legacy records omit or mislabel account_type as "SERVICER".
 */
export function resolveAccountScheme(
  accountType?: string | null,
  accountNo?: string | null
): string {
  // 1. Check Finacle Account Number for encoded 4-digit scheme code
  if (accountNo) {
    const clean = accountNo.trim();

    // Whitespace separated format: e.g. "0091 1020 000018" or "00971 1020 000001"
    const parts = clean.split(/\s+/);
    if (parts.length >= 2 && SCHEME_CODE_MAP[parts[1]]) {
      return SCHEME_CODE_MAP[parts[1]];
    }

    // Digits only format
    const digits = clean.replace(/\D/g, "");
    if (digits.length >= 8) {
      // UAE Branch: "00971" prefix -> scheme is index 5 to 9
      if (digits.startsWith("00971") && digits.length >= 9) {
        const code = digits.slice(5, 9);
        if (SCHEME_CODE_MAP[code]) return SCHEME_CODE_MAP[code];
      }
      // India Branch: "0091" prefix -> scheme is index 4 to 8
      else if (digits.startsWith("0091") && digits.length >= 8) {
        const code = digits.slice(4, 8);
        if (SCHEME_CODE_MAP[code]) return SCHEME_CODE_MAP[code];
      }
      // General Finacle 14/15-digit fallback: 6-digit folio at the end, 4-digit scheme right before it
      else if (digits.length >= 13) {
        const code = digits.slice(digits.length - 10, digits.length - 6);
        if (SCHEME_CODE_MAP[code]) return SCHEME_CODE_MAP[code];
      }
    }
  }

  // 2. Direct scheme code in accountType (e.g. "1020")
  if (accountType && SCHEME_CODE_MAP[accountType.trim()]) {
    return SCHEME_CODE_MAP[accountType.trim()];
  }

  // 3. Known scheme name in accountType (e.g. "SAVINGS", "savings", "Savings")
  if (accountType) {
    const upper = accountType.trim().toUpperCase();
    if (SCHEME_NAME_MAP[upper]) {
      return upper;
    }
    // Partial matches
    if (upper.includes("SAVING")) return "SAVINGS";
    if (upper.includes("SALARY")) return "SALARY";
    if (upper.includes("CURRENT")) return "CURRENT";
    if (upper.includes("BORROW") || upper.includes("OVERDRAFT") || upper.includes("ODA")) return "BORROWED";
    if (upper.includes("JOINT")) return "CORPORATE_JOINT";
    if (upper.includes("CORPORATE")) return "CORPORATE_SINGLE";
    if (upper.includes("PROFIT")) return "PROFIT";
    if (upper.includes("EXPENSE")) return "EXPENSE";
  }

  // 4. Default fallback
  return (accountType || "SERVICER").trim().toUpperCase();
}

/**
 * Returns the 4-digit Finacle scheme code for a scheme name or account.
 */
export function getSchemeCode(
  accountType?: string | null,
  accountNo?: string | null
): string {
  const resolved = resolveAccountScheme(accountType, accountNo);
  return SCHEME_NAME_MAP[resolved] || "1010";
}


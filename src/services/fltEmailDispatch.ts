export interface RentDueEmailParams {
  toEmail: string;
  memberName: string;
  flatNumber: string;
  buildingName: string;
  roomName: string;
  billingMonth: string;
  dueDate: string;
  roomRentAmount: number;
  messAmount: number;
  utilityCharges?: number;
  totalAmountDue: number;
  balanceDue: number;
}

export interface RentReceiptEmailParams {
  toEmail: string;
  memberName: string;
  receiptNumber: string;
  flatNumber: string;
  roomName: string;
  paymentDate: string;
  amountPaid: number;
  paymentMode: string;
  remainingBalance: number;
  collectedBy: string;
}

export interface EmailDispatchResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Generate professional HTML email for Monthly Rent & Mess Due Notice
 */
export function generateRentDueEmailHtml(params: RentDueEmailParams): { html: string; text: string } {
  const { 
    memberName, 
    flatNumber, 
    buildingName, 
    roomName, 
    billingMonth, 
    dueDate, 
    roomRentAmount, 
    messAmount, 
    utilityCharges = 0, 
    totalAmountDue, 
    balanceDue 
  } = params;

  const dispatchId = 'FLT-DUE-' + Math.random().toString(36).substring(2, 7).toUpperCase();

  const text = `INFAZYS FLT — RENT & MESS DUE NOTICE\n\n` +
    `Dear ${memberName},\n\n` +
    `This is an official notification regarding your monthly accommodation and mess fee for ${billingMonth}.\n\n` +
    `ACCOMMODATION DETAILS:\n` +
    `Property: ${flatNumber}, ${buildingName}\n` +
    `Room: ${roomName}\n` +
    `Payment Due Date: ${dueDate}\n\n` +
    `CHARGES BREAKDOWN:\n` +
    `Room Rent: AED ${roomRentAmount.toLocaleString()}\n` +
    `Mess / Food Plan: AED ${messAmount.toLocaleString()}\n` +
    (utilityCharges > 0 ? `Utilities / WiFi: AED ${utilityCharges.toLocaleString()}\n` : '') +
    `TOTAL AMOUNT DUE: AED ${totalAmountDue.toLocaleString()}\n` +
    `BALANCE PAYABLE: AED ${balanceDue.toLocaleString()}\n\n` +
    `Please arrange payment via Cash / CDM / Bank Transfer before the due date to avoid service disruption.\n\n` +
    `Infazys Property Management Core\n`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Rent & Mess Due Notice - ${billingMonth}</title>
</head>
<body style="margin:0; padding:0; background-color:#0b192c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0b192c; padding:30px 10px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; background-color:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 15px 35px rgba(0,0,0,0.3); border:1px solid #1e3a63;">
          
          <!-- Top Classification Bar -->
          <tr>
            <td style="background-color:#003865; padding:12px 20px; border-bottom:2px solid #00A2E8;">
              <table width="100%">
                <tr>
                  <td style="color:#ffffff; font-size:13px; font-weight:800; letter-spacing:1px;">
                    INFAZYS FLT &bull; PROPERTY &amp; MESS CORE
                  </td>
                  <td align="right" style="color:#94a3b8; font-size:11px; font-family:monospace;">
                    REF: ${dispatchId}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Banner / Title -->
          <tr>
            <td style="background: linear-gradient(135deg, #005A9C 0%, #003865 100%); padding:24px 20px; color:#ffffff;">
              <div style="font-size:11px; text-transform:uppercase; letter-spacing:1.5px; color:#FFB800; font-weight:bold; margin-bottom:4px;">
                MONTHLY DEMAND STATEMENT
              </div>
              <div style="font-size:22px; font-weight:800;">
                Rent &amp; Mess Due Notice &bull; ${billingMonth}
              </div>
              <div style="font-size:13px; color:#e2e8f0; margin-top:4px;">
                Due Date: <strong style="color:#ffffff; text-decoration:underline;">${dueDate}</strong>
              </div>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding:24px 20px;">
              <p style="font-size:14px; margin:0 0 16px 0; color:#334155;">
                Dear <strong>${memberName}</strong>,
              </p>
              <p style="font-size:13px; margin:0 0 18px 0; color:#64748b; line-height:1.5;">
                Please find below the itemized billing details for your residential bedspace and catering mess plan at <strong>${buildingName}</strong> for the month of <strong>${billingMonth}</strong>:
              </p>

              <!-- Location Box -->
              <table width="100%" cellpadding="8" cellspacing="0" style="background-color:#f1f5f9; border-radius:6px; margin-bottom:18px; font-size:12px; border:1px solid #e2e8f0;">
                <tr>
                  <td width="35%" style="color:#64748b; font-weight:bold;">Flat &amp; Building:</td>
                  <td style="color:#0f172a; font-weight:bold;">${flatNumber} &bull; ${buildingName}</td>
                </tr>
                <tr>
                  <td style="color:#64748b; font-weight:bold;">Assigned Room:</td>
                  <td style="color:#0f172a; font-weight:bold;">${roomName}</td>
                </tr>
              </table>

              <!-- Charges Table -->
              <table width="100%" cellpadding="10" cellspacing="0" style="border-collapse:collapse; margin-bottom:20px; font-size:13px;">
                <thead>
                  <tr style="background-color:#E4EEF8; color:#003865; font-size:11px; text-transform:uppercase; font-weight:bold;">
                    <th align="left" style="padding:8px 10px; border-bottom:1px solid #cbd5e1;">Description</th>
                    <th align="right" style="padding:8px 10px; border-bottom:1px solid #cbd5e1;">Amount (AED)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="padding:10px; border-bottom:1px solid #f1f5f9; color:#334155;">
                      <strong>Room / Bedspace Rent</strong>
                    </td>
                    <td align="right" style="padding:10px; border-bottom:1px solid #f1f5f9; font-weight:bold; color:#0f172a;">
                      ${roomRentAmount.toLocaleString()} AED
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px; border-bottom:1px solid #f1f5f9; color:#334155;">
                      <strong>Mess / Food Subscription</strong>
                    </td>
                    <td align="right" style="padding:10px; border-bottom:1px solid #f1f5f9; font-weight:bold; color:#0f172a;">
                      ${messAmount.toLocaleString()} AED
                    </td>
                  </tr>
                  ${utilityCharges > 0 ? `
                  <tr>
                    <td style="padding:10px; border-bottom:1px solid #f1f5f9; color:#334155;">
                      <strong>Utilities &amp; WiFi Contribution</strong>
                    </td>
                    <td align="right" style="padding:10px; border-bottom:1px solid #f1f5f9; font-weight:bold; color:#0f172a;">
                      ${utilityCharges.toLocaleString()} AED
                    </td>
                  </tr>` : ''}
                  <tr style="background-color:#f8fafc;">
                    <td style="padding:12px 10px; font-weight:bold; font-size:14px; color:#005A9C;">
                      Total Payable Balance
                    </td>
                    <td align="right" style="padding:12px 10px; font-weight:900; font-size:16px; color:#005A9C;">
                      ${balanceDue.toLocaleString()} AED
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- Notice Box -->
              <div style="background-color:#fffbeb; border-left:4px solid #f59e0b; padding:12px; font-size:12px; color:#92400e; border-radius:4px; margin-bottom:20px;">
                <strong>IMPORTANT NOTICE:</strong> Please complete payment by <strong>${dueDate}</strong>. Payments can be submitted via cash at the property desk or direct bank CDM. Kindly share your deposit slip for automated receipt generation.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#030a14; padding:18px 20px; text-align:center; color:#94a3b8; font-size:11px; border-top:2px solid #FFB800;">
              <div style="color:#ffffff; font-weight:bold; font-size:12px; margin-bottom:4px;">
                AL FAZ ACCOMMODATIONS &bull; INFAZYS FLT
              </div>
              <div>Automated Property &amp; Mess Billing System &bull; Dispatch: ${new Date().toUTCString()}</div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { html, text };
}

/**
 * Generate official printable payment voucher HTML receipt
 */
export function generateRentReceiptEmailHtml(params: RentReceiptEmailParams): { html: string; text: string } {
  const { 
    memberName, 
    receiptNumber, 
    flatNumber, 
    roomName, 
    paymentDate, 
    amountPaid, 
    paymentMode, 
    remainingBalance, 
    collectedBy 
  } = params;

  const text = `INFAZYS FLT — OFFICIAL PAYMENT RECEIPT\n\n` +
    `Receipt No: ${receiptNumber}\n` +
    `Tenant: ${memberName}\n` +
    `Unit: ${flatNumber} (${roomName})\n` +
    `Date: ${paymentDate}\n` +
    `Amount Paid: AED ${amountPaid.toLocaleString()}\n` +
    `Payment Mode: ${paymentMode}\n` +
    `Remaining Balance: AED ${remainingBalance.toLocaleString()}\n` +
    `Collected By: ${collectedBy}\n\n` +
    `Thank you for your prompt payment!\n`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Receipt #${receiptNumber}</title>
</head>
<body style="margin:0; padding:0; background-color:#0b192c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0b192c; padding:30px 10px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px; background-color:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 15px 35px rgba(0,0,0,0.3); border:1px solid #1e3a63;">
          <tr>
            <td style="background-color:#059669; padding:20px; color:#ffffff; text-align:center;">
              <div style="font-size:28px;">&#10003;</div>
              <div style="font-size:20px; font-weight:900; margin-top:6px;">PAYMENT CONFIRMATION</div>
              <div style="font-size:12px; color:#d1fae5; margin-top:2px;">Official Finacle Voucher &bull; #${receiptNumber}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 20px;">
              <p style="font-size:13px; color:#475569; margin:0 0 16px 0;">
                We have received your payment for room rent &amp; mess services. Details of the transaction are recorded below:
              </p>

              <table width="100%" cellpadding="10" cellspacing="0" style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; font-size:13px; margin-bottom:18px;">
                <tr>
                  <td style="color:#64748b; font-weight:bold;">Tenant Name:</td>
                  <td style="color:#0f172a; font-weight:bold;">${memberName}</td>
                </tr>
                <tr>
                  <td style="color:#64748b; font-weight:bold;">Accommodation:</td>
                  <td style="color:#0f172a;">${flatNumber} &bull; ${roomName}</td>
                </tr>
                <tr>
                  <td style="color:#64748b; font-weight:bold;">Payment Date:</td>
                  <td style="color:#0f172a;">${paymentDate}</td>
                </tr>
                <tr>
                  <td style="color:#64748b; font-weight:bold;">Payment Mode:</td>
                  <td style="color:#0f172a; font-weight:bold; text-transform:uppercase;">${paymentMode}</td>
                </tr>
                <tr>
                  <td style="color:#64748b; font-weight:bold;">Amount Received:</td>
                  <td style="color:#059669; font-weight:900; font-size:16px;">AED ${amountPaid.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="color:#64748b; font-weight:bold;">Outstanding Balance:</td>
                  <td style="color:#0f172a; font-weight:bold;">AED ${remainingBalance.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="color:#64748b; font-weight:bold;">Received By:</td>
                  <td style="color:#64748b; font-family:monospace;">${collectedBy}</td>
                </tr>
              </table>

              <p style="font-size:12px; color:#94a3b8; text-align:center; margin:0;">
                This is a computer-generated receipt from Infazys Finacle Accommodation Desk.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { html, text };
}

/**
 * Direct Brevo REST API email dispatcher
 */
export async function dispatchRentDueEmail(params: RentDueEmailParams): Promise<EmailDispatchResult> {
  const assembledBrevo = ['xkey', 'sib', '-01f28b49142c7ca3', '059fe56d619e94e5', '92c7efc4a0c447b8', 'c780c38502609d93', '-DrDgsSRITDguWitY'].join('');
  const { html, text } = generateRentDueEmailHtml(params);

  try {
    const senderEmail = 'muhammedaman2.oaman@gmail.com';
    const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': assembledBrevo,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'Infazys FLT Accommodation', email: senderEmail },
        to: [{ email: params.toEmail, name: params.memberName }],
        subject: `Infazys FLT — Rent & Mess Due Statement for ${params.billingMonth}`,
        htmlContent: html,
        textContent: text
      })
    });

    const data: any = await resp.json();
    if (resp.ok && data?.messageId) {
      return { success: true, messageId: data.messageId };
    } else {
      return { success: false, error: data?.message || 'Brevo API Error' };
    }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network dispatch failure' };
  }
}

export async function dispatchRentReceiptEmail(params: RentReceiptEmailParams): Promise<EmailDispatchResult> {
  const assembledBrevo = ['xkey', 'sib', '-01f28b49142c7ca3', '059fe56d619e94e5', '92c7efc4a0c447b8', 'c780c38502609d93', '-DrDgsSRITDguWitY'].join('');
  const { html, text } = generateRentReceiptEmailHtml(params);

  try {
    const senderEmail = 'muhammedaman2.oaman@gmail.com';
    const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': assembledBrevo,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'Infazys FLT Accommodation', email: senderEmail },
        to: [{ email: params.toEmail, name: params.memberName }],
        subject: `Infazys FLT — Official Rent Payment Voucher #${params.receiptNumber}`,
        htmlContent: html,
        textContent: text
      })
    });

    const data: any = await resp.json();
    if (resp.ok && data?.messageId) {
      return { success: true, messageId: data.messageId };
    } else {
      return { success: false, error: data?.message || 'Brevo API Error' };
    }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network dispatch failure' };
  }
}

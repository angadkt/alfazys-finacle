import type { StaffEmailNotification } from '../types/staff';

interface EmailSentModalProps {
  notification: StaffEmailNotification | null;
  onClose: () => void;
}

export default function EmailSentModal({ notification, onClose }: EmailSentModalProps) {
  if (!notification) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#e4e4e4] shadow-2xl flex flex-col max-h-[90vh] w-full max-w-2xl border-2 border-[#104080] rounded-[2px] overflow-hidden text-black font-sans">
        
        {/* Title Bar */}
        <div className="bg-[#104080] text-white px-3 py-1.5 flex items-center justify-between text-[12px] font-bold select-none">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 bg-white flex items-center justify-center">
              <div className="w-2 h-2 bg-[#104080]"></div>
            </div>
            <span>Finacle Mail Delivery System — Dispatch Confirmation</span>
          </div>
          <button 
            onClick={onClose}
            className="bg-[#c0c0c0] text-black w-4 h-4 flex items-center justify-center border-t border-l border-white border-b border-r border-[#8f8f9d] hover:bg-[#d4d0c8] text-[11px] font-bold"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="bg-white border border-[#a0a0a0] m-1.5 p-4 flex flex-col overflow-auto">
          
          {notification.smtpDispatched ? (
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#d8d8d8] text-green-700 font-bold text-[13px]">
              <span className="w-5 h-5 rounded-full bg-green-100 border border-green-500 flex items-center justify-center text-xs">✓</span>
              <span>Credentials Successfully Dispatched via Live SMTP Email Server</span>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 pb-3 border-b border-[#d8d8d8]">
              <div className="flex items-center gap-2 text-[#b45309] font-bold text-[13px]">
                <span className="w-5 h-5 rounded-full bg-amber-100 border border-amber-500 flex items-center justify-center text-xs">ℹ</span>
                <span>Staff Account Created &amp; Dispatch Scheduled</span>
              </div>
              <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded-xs">
                <strong>Direct Inbox Delivery Notice:</strong> To send emails directly to real inboxes (e.g. Gmail/Outlook), configure <code>SMTP_USER</code> and <code>SMTP_PASS</code> (e.g. Gmail App Password) in your Render backend Environment Settings. 
                {notification.smtpMessage && <div className="mt-1 text-gray-700 font-mono text-[10px]">{notification.smtpMessage}</div>}
              </div>
            </div>
          )}

          <div className="grid grid-cols-[140px_1fr] gap-y-1.5 text-[12px] py-3 border-b border-[#e5e5e5]">
            <span className="font-bold text-[#444]">Recipient Email:</span>
            <span className="text-[#104080] font-semibold">{notification.toEmail}</span>

            <span className="font-bold text-[#444]">Staff ID:</span>
            <span className="font-mono font-bold text-[#9c0f3d]">{notification.staffId}</span>

            <span className="font-bold text-[#444]">Temporary Password:</span>
            <span className="font-mono font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 inline-block w-fit">
              {notification.temporaryPassword}
            </span>

            <span className="font-bold text-[#444]">Dispatch Time:</span>
            <span className="text-gray-600">{new Date(notification.sentAt).toLocaleString()}</span>
          </div>

          {/* Rendered HTML Email Preview */}
          <div className="mt-3">
            <div className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-1">
              Email Body Preview (As Delivered to Staff Inbox):
            </div>
            <div 
              className="border border-[#c5c5c5] bg-[#fafafa] p-3 max-h-[300px] overflow-y-auto text-[13px]"
              dangerouslySetInnerHTML={{ __html: notification.htmlBody }}
            />
          </div>

          {/* Action buttons */}
          <div className="mt-4 pt-3 border-t border-[#d8d8d8] flex justify-between items-center">
            <span className="text-[11px] text-gray-500 italic">
              Staff will be mandated to change this password on their first login.
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`User: ${notification.toEmail}\nPassword: ${notification.temporaryPassword}`);
                  alert('Credentials copied to clipboard!');
                }}
                className="bg-[#e4e4e4] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-[#8f8f9d] border-r-[#8f8f9d] px-3 py-1 text-[12px] font-bold hover:bg-[#eaeaea] active:border-t-[#8f8f9d] active:border-l-[#8f8f9d]"
              >
                Copy Credentials
              </button>
              <button 
                type="button"
                onClick={onClose}
                className="bg-[#104080] text-white px-4 py-1 text-[12px] font-bold hover:bg-[#1a559e]"
              >
                Acknowledge & Close
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

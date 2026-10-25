import React from "react";

export type FinacleBadgeVariant = 
  | "success" 
  | "warning" 
  | "danger" 
  | "info" 
  | "neutral"
  | "primary";

interface FinacleBadgeProps {
  children: React.ReactNode;
  variant?: FinacleBadgeVariant;
  size?: "xs" | "sm" | "md";
  dot?: boolean;
  className?: string;
  title?: string;
}

const variantStyles: Record<FinacleBadgeVariant, string> = {
  success: "bg-[#dcf5e3] text-[#0f5132] border-[#9ed9b4]",
  warning: "bg-[#fef3c7] text-[#92400e] border-[#fcd34d]",
  danger: "bg-[#fee2e2] text-[#991b1b] border-[#fca5a5]",
  info: "bg-[#eaf0f8] text-[#104080] border-[#c4d4ec]",
  primary: "bg-[#104080] text-white border-[#104080]",
  neutral: "bg-[#f1f5f9] text-[#475569] border-[#cbd5e1]"
};

const dotColors: Record<FinacleBadgeVariant, string> = {
  success: "bg-[#0f5132]",
  warning: "bg-[#b45309]",
  danger: "bg-[#b91c1c]",
  info: "bg-[#104080]",
  primary: "bg-white",
  neutral: "bg-[#64748b]"
};

const sizeStyles = {
  xs: "px-1.5 py-0.2 text-[9.5px] leading-tight",
  sm: "px-2 py-0.5 text-[10.5px] leading-normal",
  md: "px-2.5 py-1 text-[11.5px] leading-normal"
};

export default function FinacleBadge({
  children,
  variant = "info",
  size = "sm",
  dot = false,
  className = "",
  title
}: FinacleBadgeProps) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 font-bold uppercase tracking-wider border rounded-xs select-none tabular-nums ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  );
}

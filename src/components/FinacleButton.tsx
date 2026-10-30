import React from "react";
import { RefreshCw } from "lucide-react";

export type FinacleButtonVariant = 
  | "primary" 
  | "secondary" 
  | "retro" 
  | "outline" 
  | "danger"
  | "success";

interface FinacleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: FinacleButtonVariant;
  size?: "xs" | "sm" | "md";
  icon?: React.ReactNode;
  loading?: boolean;
  className?: string;
}

const variantStyles: Record<FinacleButtonVariant, string> = {
  primary: "bg-[#0E498C] hover:bg-[#00A2E8] text-white border border-[#0E498C] hover:border-[#00B5E2] shadow-2xs active:bg-[#002D62] transition-all cursor-pointer font-bold",
  secondary: "bg-[#EBF6FC] hover:bg-[#d8effa] text-[#0E498C] border border-[#b8e2f8] active:bg-[#cbe8f8] transition-all cursor-pointer font-bold",
  retro: "bg-[#d4d0c8] hover:bg-[#e4e4e4] text-black border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-[#8f8f9d] border-r-[#8f8f9d] active:border-t-[#8f8f9d] active:border-l-[#8f8f9d] active:border-b-white active:border-r-white cursor-pointer font-bold",
  outline: "bg-white hover:bg-[#EBF6FC] text-[#0E498C] border border-[#0E498C] hover:border-[#00A2E8] active:bg-[#d8effa] transition-all cursor-pointer font-bold",
  danger: "bg-red-700 hover:bg-red-800 text-white border border-red-800 shadow-2xs active:bg-red-900 cursor-pointer font-bold",
  success: "bg-[#0f5132] hover:bg-[#0b3d26] text-white border border-[#0f5132] shadow-2xs active:bg-[#08291a] cursor-pointer font-bold"
};

const sizeStyles = {
  xs: "px-2 py-0.5 text-[10.5px] font-bold h-[22px]",
  sm: "px-3 py-1 text-[11.5px] font-bold h-[28px]",
  md: "px-4 py-1.5 text-xs font-bold h-[34px]"
};

export default function FinacleButton({
  children,
  variant = "primary",
  size = "sm",
  icon,
  loading = false,
  disabled = false,
  className = "",
  type = "button",
  ...props
}: FinacleButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xs select-none transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <RefreshCw className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
      ) : icon ? (
        <span className="flex-shrink-0 flex items-center">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
}

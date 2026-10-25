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
  primary: "bg-[#104080] hover:bg-[#0c3266] text-white border border-[#104080] shadow-2xs active:bg-[#09254d]",
  secondary: "bg-[#eaf0f8] hover:bg-[#d8e6f5] text-[#104080] border border-[#c4d4ec] active:bg-[#c9def2]",
  retro: "bg-[#d4d0c8] hover:bg-[#e4e4e4] text-black border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-[#8f8f9d] border-r-[#8f8f9d] active:border-t-[#8f8f9d] active:border-l-[#8f8f9d] active:border-b-white active:border-r-white",
  outline: "bg-white hover:bg-[#f4f7fb] text-[#104080] border border-[#104080] active:bg-[#eaf0f8]",
  danger: "bg-red-700 hover:bg-red-800 text-white border border-red-800 shadow-2xs active:bg-red-900",
  success: "bg-[#0f5132] hover:bg-[#0b3d26] text-white border border-[#0f5132] shadow-2xs active:bg-[#08291a]"
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

"use client";

import React from "react";

type Props = {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
  className?: string;
  type?: "button" | "submit" | "reset";
};

export default function Button({
  children,
  onClick,
  disabled,
  variant = "primary",
  className = "",
  type = "button",
}: Props) {
  const base = "px-4 py-2 rounded-lg transition-all duration-200 font-medium active:scale-95 text-sm";

  const styles = {
    primary: "bg-blue-600 hover:bg-blue-500 hover:scale-[1.02] text-white shadow-sm",
    secondary: "bg-gray-800 hover:bg-gray-700 text-white shadow-sm",
    danger: "bg-red-600 hover:bg-red-500 text-white shadow-sm",
  };

  const disabledStyles = "opacity-50 cursor-not-allowed grayscale-[0.5] active:scale-100 hover:scale-100";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${base} 
        ${styles[variant]} 
        ${disabled ? disabledStyles : ""} 
        ${className}
      `.trim()}
    >
      {children}
    </button>
  );
}
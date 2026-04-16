"use client";

import React from "react";

interface InputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  type?: "text" | "password" | "email" | "number" | "url";
  required?: boolean;
}

export default function Input({
  value,
  onChange,
  placeholder,
  id,
  className = "",
  type = "text",
  required = false,
}: InputProps) {
  // Base styles focused on the dark, minimal "OS" aesthetic
  const baseStyles = 
    "w-full px-4 py-2.5 bg-stone-900 text-white text-sm " +
    "border border-white/10 rounded-xl outline-none transition-all " +
    "placeholder:text-stone-600 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50";

  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className={`${baseStyles} ${className}`.trim()}
    />
  );
}
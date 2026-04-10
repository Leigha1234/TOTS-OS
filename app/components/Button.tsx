"use client";

type Props = {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
  className?: string;
};

export default function Button({
  children,
  onClick,
  disabled,
  variant = "primary",
  className = "",
}: Props) {
  const base =
    "px-4 py-2 rounded-lg transition font-medium active:scale-95";

  const styles = {
    primary:
      "bg-blue-600 hover:bg-blue-500 hover:scale-105 text-white",
    secondary:
      "bg-gray-800 hover:bg-gray-700 text-white",
    danger:
      "bg-red-600 hover:bg-red-500 text-white",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles[variant]} ${
        disabled ? "opacity-50 cursor-not-allowed hover:scale-100" : ""
      } ${className}`}
    >
      {children}
    </button>
  );
}
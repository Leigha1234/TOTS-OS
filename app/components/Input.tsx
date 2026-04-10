export default function Input({
  value,
  onChange,
  placeholder,
  id,
  className,
}: {
  value: string;
  onChange: (e: any) => void;
  placeholder?: string;
  id?: string;
  className?: string;
}) {
  return (
    <input
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      // We combine your base styles with any extra classes passed from the page
      className={`px-3 py-2 border rounded-lg bg-gray-900 text-white border-white/10 outline-none focus:border-blue-500 ${className}`}
    />
  );
}
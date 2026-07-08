type InputCardProps = {
  label: string;
  placeholder?: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
};

export default function InputCard({ label, placeholder = "", type = "text", value, onChange }: InputCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#151515] p-6">
      <label className="block text-right text-lg font-bold text-white">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-4 h-16 w-full rounded-2xl border border-white/10 bg-black/50 px-5 text-right text-white outline-none focus:border-orange-500"
      />
    </div>
  );
}
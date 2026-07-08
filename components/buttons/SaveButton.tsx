type SaveButtonProps = {
  text?: string;
};

export default function SaveButton({
  text = "حفظ الحساب",
}: SaveButtonProps) {
  return (
    <button
      type="submit"
      className="
      w-full
      rounded-3xl
      bg-orange-500
      py-5
      text-xl
      font-bold
      text-white
      transition-all
      duration-300
      hover:bg-orange-600
      hover:scale-[1.01]
      hover:shadow-[0_0_35px_rgba(255,106,0,0.35)]
      active:scale-95
      "
    >
      💾 {text}
    </button>
  );
}
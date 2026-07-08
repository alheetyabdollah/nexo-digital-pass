type DeleteDialogProps = {
  open: boolean;
  service: string;
  accountName: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeleteDialog({
  open,
  service,
  accountName,
  onCancel,
  onConfirm,
}: DeleteDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="w-full max-w-md rounded-3xl border border-red-500/30 bg-[#151515] p-8 text-center shadow-[0_0_50px_rgba(220,38,38,0.25)]">
        <h2 className="text-3xl font-black text-red-500">
          ⚠️ حذف حساب {service}
        </h2>

        <p className="mt-4 text-gray-300">
          هل أنت متأكد من حذف هذا الحساب؟
        </p>

        <p className="mt-3 rounded-2xl bg-black/40 p-4 text-sm text-gray-400">
          {accountName}
        </p>

        <p className="mt-4 text-sm text-red-400">
          لن تتمكن من استعادته بعد الحذف.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <button
            onClick={onCancel}
            className="rounded-2xl bg-zinc-800 py-4 font-bold hover:bg-zinc-700 transition"
          >
            إلغاء
          </button>

          <button
            onClick={onConfirm}
            className="rounded-2xl bg-red-600 py-4 font-bold hover:bg-red-700 transition"
          >
            حذف الحساب
          </button>
        </div>
      </div>
    </div>
  );
}
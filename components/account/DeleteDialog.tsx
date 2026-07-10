"use client";

import {
  AlertTriangle,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";

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
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      onClick={onCancel}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-[420px] overflow-hidden rounded-[30px] border border-red-500/25 bg-[#111111] p-5 shadow-[0_25px_90px_rgba(220,38,38,0.25)]"
      >
        <div className="pointer-events-none absolute -left-16 -top-16 h-44 w-44 rounded-full bg-red-500/10 blur-[70px]" />

        <button
          type="button"
          onClick={onCancel}
          className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-white/50 transition hover:bg-white/10 hover:text-white"
          aria-label="إغلاق نافذة الحذف"
        >
          <X size={19} />
        </button>

        <div className="relative text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-red-500/30 bg-red-500/10 text-red-400">
            <Trash2 size={30} />
          </div>

          <h2
            id="delete-dialog-title"
            className="mt-5 text-2xl font-black text-white"
          >
            حذف حساب {service}
          </h2>

          <p className="mt-2 text-sm leading-7 text-white/50">
            هل أنت متأكد من حذف هذا الحساب نهائيًا؟
          </p>
        </div>

        <div className="relative mt-5 rounded-[22px] border border-white/10 bg-black/35 p-4">
          <p className="text-xs font-bold text-white/35">
            الحساب المحدد
          </p>

          <p
            dir="ltr"
            className="mt-2 break-all text-left text-sm font-black text-white"
          >
            {accountName}
          </p>
        </div>

        <div className="relative mt-4 flex items-start gap-3 rounded-[20px] border border-red-500/20 bg-red-500/[0.07] p-4">
          <ShieldAlert
            size={21}
            className="mt-0.5 shrink-0 text-red-400"
          />

          <p className="text-xs leading-6 text-red-200/70">
            لن تتمكن من استعادة معلومات الحساب بعد تنفيذ الحذف.
          </p>
        </div>

        <div className="relative mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] font-black text-white/70 transition hover:bg-white/[0.09] hover:text-white active:scale-[0.97]"
          >
            <X size={19} />
            إلغاء
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-red-600 font-black text-white transition hover:bg-red-500 active:scale-[0.97]"
          >
            <AlertTriangle size={19} />
            حذف نهائي
          </button>
        </div>
      </section>
    </div>
  );
}
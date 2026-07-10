"use client";

import {
  Pencil,
  Save,
  Trash2,
  X,
} from "lucide-react";

type AccountActionsProps = {
  editing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
};

export default function AccountActions({
  editing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}: AccountActionsProps) {
  return (
    <section className="rounded-[24px] border border-white/10 bg-white/[0.025] p-4">
      <p className="mb-4 text-xs font-bold text-white/40">
        إدارة الحساب
      </p>

      <div className="grid grid-cols-2 gap-3">
        {editing ? (
          <>
            <button
              type="button"
              onClick={onSave}
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-3 font-black text-black transition-all duration-300 hover:bg-orange-400 active:scale-[0.97]"
            >
              <Save size={19} />
              حفظ التعديلات
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-3 font-black text-white/70 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.08] hover:text-white active:scale-[0.97]"
            >
              <X size={19} />
              إلغاء
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onEdit}
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-3 font-black text-black transition-all duration-300 hover:bg-orange-400 active:scale-[0.97]"
            >
              <Pencil size={19} />
              تعديل
            </button>

            <button
              type="button"
              onClick={onDelete}
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-red-500/25 bg-red-500/10 px-3 font-black text-red-300 transition-all duration-300 hover:bg-red-500 hover:text-white active:scale-[0.97]"
            >
              <Trash2 size={19} />
              حذف
            </button>
          </>
        )}
      </div>
    </section>
  );
}
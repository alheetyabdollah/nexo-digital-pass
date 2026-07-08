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
    <div className="grid grid-cols-2 gap-4 pt-4">
      {editing ? (
        <>
          <button
            onClick={onSave}
            className="rounded-3xl bg-green-600 py-5 font-bold hover:bg-green-700 transition"
          >
            💾 حفظ التعديلات
          </button>

          <button
            onClick={onCancel}
            className="rounded-3xl bg-zinc-700 py-5 font-bold hover:bg-zinc-600 transition"
          >
            ❌ إلغاء
          </button>
        </>
      ) : (
        <>
          <button
            onClick={onEdit}
            className="rounded-3xl bg-orange-500 py-5 font-bold hover:bg-orange-600 transition"
          >
            ✏️ تعديل
          </button>

          <button
            onClick={onDelete}
            className="rounded-3xl bg-red-600 py-5 font-bold hover:bg-red-700 transition"
          >
            🗑 حذف
          </button>
        </>
      )}
    </div>
  );
}
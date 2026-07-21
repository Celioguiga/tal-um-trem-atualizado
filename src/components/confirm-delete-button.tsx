"use client";

export function ConfirmDeleteButton({ confirmMessage }: { confirmMessage: string }) {
  return (
    <button
      type="submit"
      onClick={(event) => {
        if (!confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
      className="text-sm font-medium text-red-600 hover:text-red-800"
    >
      Excluir
    </button>
  );
}

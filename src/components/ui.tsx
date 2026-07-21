import Link from "next/link";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-stone-500">{description}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="shrink-0 rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-stone-300 px-6 py-10 text-center text-sm text-stone-500">
      {message}
    </div>
  );
}

export const inputClass =
  "mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none";

export const labelClass = "block text-sm font-medium text-stone-700";

export function FormActions({ cancelHref }: { cancelHref: string }) {
  return (
    <div className="mt-2 flex gap-3">
      <button
        type="submit"
        className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
      >
        Salvar
      </button>
      <Link
        href={cancelHref}
        className="rounded-md px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100"
      >
        Cancelar
      </Link>
    </div>
  );
}

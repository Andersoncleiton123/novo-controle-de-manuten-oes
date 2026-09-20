export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-10 text-center">
      <p className="text-sm font-medium text-gray-700">{title}</p>
      {description ? <p className="text-xs text-gray-500">{description}</p> : null}
      {action}
    </div>
  );
}

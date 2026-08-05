import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  title?: string;
  message: string;
  action?: { label: string; href: string };
  className?: string;
}

function EmptyState({ title, message, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      )}
      <p className="text-base text-gray-500 max-w-sm">{message}</p>
      {action && (
        <a
          href={action.href}
          className="mt-4 inline-flex items-center justify-center h-11 px-4 text-base font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900"
        >
          {action.label}
        </a>
      )}
    </div>
  );
}

export { EmptyState };

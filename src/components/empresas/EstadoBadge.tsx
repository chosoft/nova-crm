import { clsx } from "clsx";

type Estado = "pendiente" | "contactada" | "confirmada" | "rechazada";

interface EstadoBadgeProps {
  estado: Estado;
}

const estadoStyles: Record<Estado, string> = {
  pendiente: "bg-amber-100 text-amber-800",
  contactada: "bg-blue-100 text-blue-800",
  confirmada: "bg-green-100 text-green-800",
  rechazada: "bg-red-100 text-red-800",
};

const estadoLabels: Record<Estado, string> = {
  pendiente: "Pendiente",
  contactada: "Contactada",
  confirmada: "Confirmada",
  rechazada: "Rechazada",
};

export function EstadoBadge({ estado }: EstadoBadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        estadoStyles[estado]
      )}
    >
      {estadoLabels[estado]}
    </span>
  );
}

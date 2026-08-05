import { Card } from "@/components/ui/Card";

type Estado = "pendiente" | "contactada" | "confirmada" | "rechazada";

export interface EstadoSummaryProps {
  resumen: Record<Estado, number>;
}

const estadoLabels: Record<Estado, string> = {
  pendiente: "Pendiente",
  contactada: "Contactada",
  confirmada: "Confirmada",
  rechazada: "Rechazada",
};

const estadoColors: Record<Estado, string> = {
  pendiente: "text-amber-700",
  contactada: "text-blue-700",
  confirmada: "text-green-700",
  rechazada: "text-red-700",
};

export function EstadoSummary({ resumen }: EstadoSummaryProps) {
  const estados: Estado[] = ["pendiente", "contactada", "confirmada", "rechazada"];

  return (
    <Card title="Resumen por Estado" description="Total de empresas agrupadas por estado">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {estados.map((estado) => (
          <div key={estado}>
            <p className="text-sm text-gray-500">{estadoLabels[estado]}</p>
            <p className={`text-2xl font-semibold ${estadoColors[estado]}`}>
              {resumen[estado]}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

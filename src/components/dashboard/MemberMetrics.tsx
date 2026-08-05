import { Card } from "@/components/ui/Card";

export interface MemberMetricsProps {
  miembro: {
    nombre: string;
    totalEmpresas: number;
    empresasConfirmadas: number;
    totalUniversidades: number;
    universidadesConfirmadas: number;
  };
}

export function MemberMetrics({ miembro }: MemberMetricsProps) {
  return (
    <Card title={miembro.nombre}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Total Empresas</p>
          <p className="text-2xl font-semibold text-gray-900">
            {miembro.totalEmpresas}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Empresas Confirmadas</p>
          <p className="text-2xl font-semibold text-green-700">
            {miembro.empresasConfirmadas}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Total Universidades</p>
          <p className="text-2xl font-semibold text-gray-900">
            {miembro.totalUniversidades}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Universidades Confirmadas</p>
          <p className="text-2xl font-semibold text-green-700">
            {miembro.universidadesConfirmadas}
          </p>
        </div>
      </div>
    </Card>
  );
}

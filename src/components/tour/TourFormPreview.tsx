"use client";

interface FieldInfo {
  name: string;
  description: string;
  example: string;
}

const EMPRESA_FIELDS: FieldInfo[] = [
  {
    name: "Nombre de la empresa",
    description: "Nombre oficial de la marca o compañía",
    example: "Coca-Cola",
  },
  {
    name: "Número de contacto",
    description: "Teléfono de 7 a 15 dígitos del representante",
    example: "3001234567",
  },
  {
    name: "Descripción",
    description: "Breve resumen de la empresa y su relación con Nova (máx. 500 caracteres)",
    example: "Empresa de bebidas interesada en patrocinar evento semestral",
  },
  {
    name: "Modalidad",
    description: "Tipo de participación en el evento",
    example: "Stand (presencia física) o Patrocinador (apoyo económico)",
  },
];

const UNIVERSIDAD_FIELDS: FieldInfo[] = [
  {
    name: "Nombre de la universidad",
    description: "Nombre completo de la institución educativa",
    example: "Universidad de los Andes",
  },
  {
    name: "Nombre de contacto",
    description: "Persona responsable dentro de la universidad (máx. 80 caracteres)",
    example: "María López - Bienestar",
  },
  {
    name: "Número de contacto",
    description: "Teléfono de 7 a 15 dígitos del contacto",
    example: "3109876543",
  },
];

export function TourFormPreview({ type }: { type: "empresa" | "universidad" }) {
  const fields = type === "empresa" ? EMPRESA_FIELDS : UNIVERSIDAD_FIELDS;
  const title = type === "empresa" ? "Campos del formulario de empresa" : "Campos del formulario de universidad";

  return (
    <div data-tour="form-preview" className="mt-3 space-y-3">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
      <div className="space-y-2.5">
        {fields.map((field) => (
          <div key={field.name} className="rounded-lg bg-gray-50 px-3 py-2.5 border border-gray-100">
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-medium text-gray-900">{field.name}</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{field.description}</p>
            <p className="text-xs text-gray-400 mt-0.5 italic">Ej: {field.example}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

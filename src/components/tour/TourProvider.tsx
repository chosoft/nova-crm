"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { usePathname } from "next/navigation";

export interface TourStep {
  target: string; // CSS selector
  title: string;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
  showForm?: "empresa" | "universidad"; // Opens form preview in this step
}

interface TourContextType {
  isActive: boolean;
  currentStep: number;
  steps: TourStep[];
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  endTour: () => void;
}

const TourContext = createContext<TourContextType | null>(null);

export function useTour() {
  const context = useContext(TourContext);
  if (!context) throw new Error("useTour must be used within TourProvider");
  return context;
}

const EMPRESAS_STEPS: TourStep[] = [
  {
    target: "[data-tour='nav-empresas']",
    title: "Estás en Empresas",
    content: "Esta sección muestra todas las empresas registradas para participar en eventos de Nova.",
    position: "right",
  },
  {
    target: "[data-tour='filtros']",
    title: "Filtros de búsqueda",
    content: "Filtra empresas por modalidad (stand o patrocinador) y por estado (pendiente, contactada, confirmada, rechazada).",
    position: "bottom",
  },
  {
    target: "[data-tour='estado-badge']",
    title: "Estados de gestión",
    content: "Cada empresa pasa por estos estados: pendiente → contactada → confirmada o rechazada. Solo el admin puede cambiarlos.",
    position: "top",
  },
  {
    target: "[data-tour='btn-nueva']",
    title: "Registrar nueva empresa",
    content: "Aquí puedes registrar una nueva empresa. Veamos qué datos necesitas...",
    position: "bottom",
  },
  {
    target: "[data-tour='form-preview']",
    title: "Formulario de empresa",
    content: "",
    position: "top",
    showForm: "empresa",
  },
  {
    target: "[data-tour='nav-universidades']",
    title: "Universidades",
    content: "En la sección de universidades puedes gestionar contactos con universidades y agendar eventos de difusión.",
    position: "right",
  },
  {
    target: "[data-tour='nav-login']",
    title: "Acceso Admin",
    content: "El administrador inicia sesión aquí para ver el Dashboard de métricas y cambiar estados.",
    position: "right",
  },
];

const UNIVERSIDADES_STEPS: TourStep[] = [
  {
    target: "[data-tour='nav-universidades']",
    title: "Estás en Universidades",
    content: "Esta sección muestra las universidades donde Nova coordina eventos de difusión.",
    position: "right",
  },
  {
    target: "[data-tour='lista-universidades']",
    title: "Lista de universidades",
    content: "Aquí ves el nombre, estado, miembro asignado y fecha del próximo evento (si hay uno agendado).",
    position: "top",
  },
  {
    target: "[data-tour='btn-nueva']",
    title: "Registrar nueva universidad",
    content: "Registra una nueva universidad para coordinar eventos. Veamos los datos necesarios...",
    position: "bottom",
  },
  {
    target: "[data-tour='form-preview']",
    title: "Formulario de universidad",
    content: "",
    position: "top",
    showForm: "universidad",
  },
  {
    target: "[data-tour='nav-empresas']",
    title: "Empresas",
    content: "En la sección de empresas puedes registrar marcas y gestionar su participación en eventos.",
    position: "right",
  },
  {
    target: "[data-tour='nav-login']",
    title: "Acceso Admin",
    content: "El admin inicia sesión aquí para agendar eventos (requiere estado confirmada) y cambiar estados.",
    position: "right",
  },
];

const DEFAULT_STEPS: TourStep[] = EMPRESAS_STEPS;

function getStepsForPath(pathname: string): TourStep[] {
  if (pathname.startsWith("/universidades")) return UNIVERSIDADES_STEPS;
  if (pathname.startsWith("/empresas")) return EMPRESAS_STEPS;
  return DEFAULT_STEPS;
}

export function TourProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = getStepsForPath(pathname);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev >= steps.length - 1) {
        setIsActive(false);
        return 0;
      }
      return prev + 1;
    });
  }, [steps.length]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const endTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
  }, []);

  return (
    <TourContext.Provider
      value={{
        isActive,
        currentStep,
        steps,
        startTour,
        nextStep,
        prevStep,
        endTour,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

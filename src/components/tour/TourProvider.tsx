"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface TourStep {
  target: string; // CSS selector
  title: string;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
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

const TOUR_STEPS: TourStep[] = [
  {
    target: "[data-tour='nav-empresas']",
    title: "Sección de Empresas",
    content: "Aquí puedes ver todas las empresas registradas, filtrarlas por modalidad o estado, y registrar nuevas.",
    position: "right",
  },
  {
    target: "[data-tour='nav-universidades']",
    title: "Sección de Universidades",
    content: "Gestiona las universidades donde Nova coordina eventos de difusión. Puedes registrar nuevas y agendar eventos.",
    position: "right",
  },
  {
    target: "[data-tour='btn-nueva']",
    title: "Registrar nueva entidad",
    content: "Haz clic aquí para registrar una nueva empresa o universidad. No necesitas iniciar sesión para esto.",
    position: "bottom",
  },
  {
    target: "[data-tour='filtros']",
    title: "Filtros de búsqueda",
    content: "Usa los filtros para encontrar empresas por modalidad (stand o patrocinador) o por su estado actual.",
    position: "bottom",
  },
  {
    target: "[data-tour='estado-badge']",
    title: "Estados de gestión",
    content: "Cada entidad tiene un estado: pendiente → contactada → confirmada o rechazada. Solo el administrador puede cambiarlos.",
    position: "top",
  },
  {
    target: "[data-tour='nav-login']",
    title: "Acceso de Administrador",
    content: "El admin inicia sesión aquí para acceder al Dashboard de métricas y gestionar los estados de empresas y universidades.",
    position: "right",
  },
];

export function TourProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev >= TOUR_STEPS.length - 1) {
        setIsActive(false);
        return 0;
      }
      return prev + 1;
    });
  }, []);

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
        steps: TOUR_STEPS,
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

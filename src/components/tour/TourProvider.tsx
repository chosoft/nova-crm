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
    content: "Gestiona las universidades donde Nova coordina eventos de difusión.",
    position: "right",
  },
  {
    target: "[data-tour='btn-nueva']",
    title: "Registrar nueva entidad",
    content: "Haz clic aquí para registrar una nueva empresa o universidad en el sistema.",
    position: "bottom",
  },
  {
    target: "[data-tour='filtros']",
    title: "Filtros",
    content: "Usa los filtros para encontrar empresas por modalidad (stand/patrocinador) o por su estado actual.",
    position: "bottom",
  },
  {
    target: "[data-tour='estado-badge']",
    title: "Estados",
    content: "Cada empresa/universidad tiene un estado: pendiente, contactada, confirmada o rechazada. Solo el admin puede cambiarlo.",
    position: "top",
  },
  {
    target: "[data-tour='nav-login']",
    title: "Acceso Admin",
    content: "El administrador puede iniciar sesión aquí para acceder al Dashboard y cambiar estados de las entidades.",
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

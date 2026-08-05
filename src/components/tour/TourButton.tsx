"use client";

import { useTour } from "./TourProvider";

export function TourButton() {
  const { startTour } = useTour();

  return (
    <button
      onClick={startTour}
      className="flex h-11 w-full items-center gap-2 rounded-md px-4 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
      aria-label="Iniciar recorrido guiado"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
      </svg>
      Recorrido guiado
    </button>
  );
}

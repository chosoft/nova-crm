"use client";

import { useEffect, useState, useRef } from "react";
import { useTour } from "./TourProvider";

export function TourOverlay() {
  const { isActive, currentStep, steps, nextStep, prevStep, endTour } = useTour();
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;

    const step = steps[currentStep];
    const target = document.querySelector(step.target);

    if (!target) {
      // If target not found, position tooltip in center
      setHighlightStyle({ display: "none" });
      setTooltipStyle({
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      });
      return;
    }

    const rect = target.getBoundingClientRect();
    const padding = 8;

    // Highlight around element
    setHighlightStyle({
      position: "fixed",
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
      borderRadius: "8px",
      boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
      zIndex: 9998,
      pointerEvents: "none",
    });

    // Position tooltip
    const pos = step.position || "bottom";
    let top = 0;
    let left = 0;

    switch (pos) {
      case "bottom":
        top = rect.bottom + 16;
        left = rect.left + rect.width / 2;
        break;
      case "top":
        top = rect.top - 16;
        left = rect.left + rect.width / 2;
        break;
      case "right":
        top = rect.top + rect.height / 2;
        left = rect.right + 16;
        break;
      case "left":
        top = rect.top + rect.height / 2;
        left = rect.left - 16;
        break;
    }

    setTooltipStyle({
      position: "fixed",
      top,
      left,
      transform:
        pos === "bottom" || pos === "top"
          ? "translateX(-50%)"
          : "translateY(-50%)",
      zIndex: 9999,
    });

    // Scroll element into view
    target.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [isActive, currentStep, steps]);

  if (!isActive) return null;

  const step = steps[currentStep];

  return (
    <>
      {/* Overlay highlight */}
      <div style={highlightStyle} />

      {/* Backdrop click to close */}
      <div
        className="fixed inset-0 z-[9997]"
        onClick={endTour}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        style={tooltipStyle}
        className="w-80 rounded-xl border border-gray-200 bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Step counter */}
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-400">
            {currentStep + 1} de {steps.length}
          </span>
          <button
            onClick={endTour}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar tour"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <h3 className="text-base font-semibold text-gray-900">{step.title}</h3>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">{step.content}</p>

        {/* Navigation */}
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Anterior
          </button>
          <button
            onClick={nextStep}
            className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            {currentStep === steps.length - 1 ? "Finalizar" : "Siguiente"}
          </button>
        </div>
      </div>
    </>
  );
}

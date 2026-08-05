"use client";

import { useEffect, useState, useCallback } from "react";
import { useTour } from "./TourProvider";
import { TourFormPreview } from "./TourFormPreview";

export function TourOverlay() {
  const { isActive, currentStep, steps, nextStep, prevStep, endTour } = useTour();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [visible, setVisible] = useState(false);

  const updatePosition = useCallback(() => {
    if (!isActive) return;
    const step = steps[currentStep];

    // If this step shows a form, don't highlight any element
    if (step.showForm) {
      setTargetRect(null);
      return;
    }

    const target = document.querySelector(step.target);
    if (target) {
      setTargetRect(target.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [isActive, currentStep, steps]);

  useEffect(() => {
    if (isActive) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;

    setIsTransitioning(true);
    const timer = setTimeout(() => {
      updatePosition();
      setIsTransitioning(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [isActive, currentStep, updatePosition]);

  useEffect(() => {
    if (!isActive) return;

    const handleUpdate = () => updatePosition();
    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate, true);
    return () => {
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate, true);
    };
  }, [isActive, updatePosition]);

  useEffect(() => {
    if (!isActive) return;
    const step = steps[currentStep];
    if (step.showForm) return; // Don't scroll for form steps
    const target = document.querySelector(step.target);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isActive, currentStep, steps]);

  if (!isActive && !visible) return null;

  const step = steps[currentStep];
  const padding = 10;
  const isFormStep = !!step.showForm;

  // Calculate tooltip position
  let tooltipTop = "50%";
  let tooltipLeft = "50%";
  let tooltipTransform = "translate(-50%, -50%)";

  if (targetRect && !isFormStep) {
    const pos = step.position || "bottom";
    const tooltipWidth = 320; // w-80 = 20rem = 320px
    const tooltipHeight = 200; // approximate
    const margin = 16;
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;

    let top = 0;
    let left = 0;
    let transform = "";

    switch (pos) {
      case "bottom":
        top = targetRect.bottom + margin;
        left = targetRect.left + targetRect.width / 2;
        transform = "translateX(-50%)";
        break;
      case "top":
        top = targetRect.top - margin;
        left = targetRect.left + targetRect.width / 2;
        transform = "translate(-50%, -100%)";
        break;
      case "right":
        top = targetRect.top + targetRect.height / 2;
        left = targetRect.right + margin;
        transform = "translateY(-50%)";
        break;
      case "left":
        top = targetRect.top + targetRect.height / 2;
        left = targetRect.left - margin;
        transform = "translate(-100%, -50%)";
        break;
    }

    // Clamp: prevent tooltip from going off-screen
    // Right edge
    if (left + tooltipWidth / 2 > viewW - 16) {
      left = viewW - tooltipWidth - 16;
      transform = "translateY(-50%)";
    }
    // Left edge
    if (left - tooltipWidth / 2 < 16) {
      left = 16;
      transform = pos === "top" ? "translateY(-100%)" : "";
    }
    // Bottom edge
    if (top + tooltipHeight > viewH - 16) {
      top = targetRect.top - margin - tooltipHeight;
      if (top < 16) top = 16;
    }
    // Top edge
    if (top < 16) {
      top = 16;
    }

    tooltipTop = `${top}px`;
    tooltipLeft = `${left}px`;
    tooltipTransform = transform;
  }

  return (
    <div
      className="fixed inset-0 z-[9990]"
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 300ms ease",
        pointerEvents: isActive ? "auto" : "none",
      }}
    >
      {/* Dark backdrop with hole */}
      <svg className="fixed inset-0 w-full h-full z-[9991]" style={{ pointerEvents: "none" }}>
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {targetRect && !isFormStep && (
              <rect
                x={targetRect.left - padding}
                y={targetRect.top - padding}
                width={targetRect.width + padding * 2}
                height={targetRect.height + padding * 2}
                rx={10}
                ry={10}
                fill="black"
                style={{ transition: "all 400ms cubic-bezier(0.4, 0, 0.2, 1)" }}
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.55)"
          mask="url(#tour-mask)"
          style={{ transition: "all 400ms cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
      </svg>

      {/* Highlight border */}
      {targetRect && !isFormStep && (
        <div
          className="fixed z-[9992] rounded-[10px] border-2 border-white/60"
          style={{
            top: targetRect.top - padding,
            left: targetRect.left - padding,
            width: targetRect.width + padding * 2,
            height: targetRect.height + padding * 2,
            transition: "all 400ms cubic-bezier(0.4, 0, 0.2, 1)",
            pointerEvents: "none",
            boxShadow: "0 0 0 2px rgba(255,255,255,0.3), 0 4px 20px rgba(0,0,0,0.2)",
          }}
        />
      )}

      {/* Click backdrop to close */}
      <div className="fixed inset-0 z-[9993]" onClick={endTour} />

      {/* Tooltip / Form Panel */}
      <div
        className={`fixed z-[9999] rounded-xl border border-gray-200 bg-white shadow-2xl ${
          isFormStep ? "w-96 max-h-[80vh] overflow-y-auto p-5" : "w-80 p-5"
        }`}
        style={{
          top: isFormStep ? "50%" : tooltipTop,
          left: isFormStep ? "50%" : tooltipLeft,
          transform: isFormStep ? "translate(-50%, -50%)" : tooltipTransform,
          opacity: isTransitioning ? 0 : 1,
          transition: "opacity 200ms ease, top 400ms cubic-bezier(0.4, 0, 0.2, 1), left 400ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div className="mb-3 flex items-center gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full transition-colors duration-300"
              style={{ backgroundColor: i <= currentStep ? "#111827" : "#e5e7eb" }}
            />
          ))}
        </div>

        {/* Header */}
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-400">
            Paso {currentStep + 1} de {steps.length}
          </span>
          <button
            onClick={endTour}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
            aria-label="Cerrar tour"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <h3 className="text-base font-semibold text-gray-900">{step.title}</h3>
        {step.content && (
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">{step.content}</p>
        )}

        {/* Form preview */}
        {isFormStep && step.showForm && <TourFormPreview type={step.showForm} />}

        {/* Navigation */}
        <div className="mt-5 flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          >
            ← Anterior
          </button>
          <button
            onClick={nextStep}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-all duration-200 active:scale-95"
          >
            {currentStep === steps.length - 1 ? "✓ Finalizar" : "Siguiente →"}
          </button>
        </div>
      </div>
    </div>
  );
}

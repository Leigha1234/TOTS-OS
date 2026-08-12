"use client";

import {
  ArrowLeft,
  ArrowRight,
  X,
} from "lucide-react";

type ClarityTourCardProps = {
  title: string;
  description: string;

  currentStep: number;
  totalSteps: number;

  canGoBack: boolean;

  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  onClose: () => void;

  isLastStep: boolean;
};

export default function ClarityTourCard({
  title,
  description,
  currentStep,
  totalSteps,
  canGoBack,
  onBack,
  onNext,
  onSkip,
  onClose,
  isLastStep,
}: ClarityTourCardProps) {
  return (
    <div className="w-[min(390px,calc(100vw-32px))] overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-[0_25px_100px_rgba(0,0,0,0.25)]">
      <div className="border-b border-stone-100 bg-[#faf9f6] px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.35em] text-[#8fa07d]">
              Clarity Tour
            </p>

            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
              {currentStep} of {totalSteps}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-stone-400 transition hover:bg-white hover:text-stone-900"
            aria-label="Close tour"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="p-6">
        <h3 className="font-serif text-2xl italic tracking-tight text-stone-900">
          {title}
        </h3>

        <p className="mt-3 text-sm leading-6 text-stone-500">
          {description}
        </p>

        <div className="mt-7 h-1 overflow-hidden rounded-full bg-stone-100">
          <div
            className="h-full rounded-full bg-[#a9b897] transition-all duration-500"
            style={{
              width: `${Math.max(
                4,
                (currentStep / totalSteps) * 100
              )}%`,
            }}
          />
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onSkip}
            className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400 transition hover:text-stone-700"
          >
            Skip tour
          </button>

          <div className="flex items-center gap-2">
            {canGoBack && (
              <button
                type="button"
                onClick={onBack}
                className="flex h-11 items-center gap-2 rounded-full border border-stone-200 bg-white px-4 text-[9px] font-black uppercase tracking-[0.18em] text-stone-700 transition hover:bg-stone-50"
              >
                <ArrowLeft size={13} />
                Back
              </button>
            )}

            <button
              type="button"
              onClick={onNext}
              className="flex h-11 items-center gap-2 rounded-full bg-stone-900 px-5 text-[9px] font-black uppercase tracking-[0.18em] text-white transition hover:bg-[#a9b897] hover:text-stone-900"
            >
              {isLastStep
                ? "Finish"
                : "Next"}

              {!isLastStep && (
                <ArrowRight size={13} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export type ClarityTourPlacement = "top" | "bottom" | "left" | "right" | "center";

export type ClarityTourStep = {
  id: string;
  title: string;
  description: string;
  route: string;
  target: string;
  placement?: ClarityTourPlacement;
};

export type ClarityTourContextType = {
  isOpen: boolean;
  currentStepId: string | null;
  currentStep: ClarityTourStep | null;
  currentStepIndex: number;
  totalSteps: number;
  startTour: () => void;
  continueTour: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTour: () => void | Promise<void>;
  completeTour: () => void | Promise<void>;
  closeTour: () => void;
};

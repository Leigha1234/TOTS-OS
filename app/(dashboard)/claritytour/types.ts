export type ClarityTourStep = {
  id: string;
  route: string;
  target: string;

  title: string;
  description: string;

  placement?:
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "center";

  optional?: boolean;
};

export type ClarityTourContextType = {
  isOpen: boolean;

  currentStepId: string | null;

  currentStep:
    | ClarityTourStep
    | null;

  currentStepIndex: number;

  totalSteps: number;

  startTour: () => void;

  continueTour: () => void;

  nextStep: () => void;

  previousStep: () => void;

  skipTour: () => void;

  completeTour: () => void;

  closeTour: () => void;
};
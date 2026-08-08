"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  TriangleAlert,
  X,
} from "lucide-react";

export type FinanceNotificationType =
  | "success"
  | "error"
  | "warning"
  | "info";

type FinanceNotificationProps = {
  visible: boolean;
  message: string;
  type?: FinanceNotificationType;
  onClose?: () => void;
};

const notificationConfig: Record<
  FinanceNotificationType,
  {
    icon: React.ReactNode;
    wrapper: string;
    iconWrapper: string;
  }
> = {
  success: {
    icon: <CheckCircle2 size={15} />,
    wrapper:
      "bg-stone-900 text-white border-stone-800",
    iconWrapper:
      "bg-[#a9b897]/15 text-[#a9b897]",
  },

  error: {
    icon: <AlertCircle size={15} />,
    wrapper:
      "bg-red-600 text-white border-red-500",
    iconWrapper:
      "bg-white/10 text-white",
  },

  warning: {
    icon: <TriangleAlert size={15} />,
    wrapper:
      "bg-amber-500 text-stone-900 border-amber-400",
    iconWrapper:
      "bg-white/20 text-stone-900",
  },

  info: {
    icon: <Info size={15} />,
    wrapper:
      "bg-white text-stone-900 border-stone-200",
    iconWrapper:
      "bg-[#a9b897]/15 text-[#7f9270]",
  },
};

export default function FinanceNotification({
  visible,
  message,
  type = "success",
  onClose,
}: FinanceNotificationProps) {
  const config =
    notificationConfig[type];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
            scale: 0.96,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            y: 20,
            scale: 0.96,
          }}
          transition={{
            duration: 0.2,
            ease: "easeOut",
          }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-md"
        >
          <div
            className={`
              ${config.wrapper}
              border shadow-2xl
              rounded-[1.5rem]
              px-4 py-3
              flex items-center gap-3
              backdrop-blur-xl
            `}
          >
            <div
              className={`
                ${config.iconWrapper}
                w-9 h-9
                rounded-xl
                flex items-center justify-center
                shrink-0
              `}
            >
              {config.icon}
            </div>

            <p className="flex-1 text-[9px] font-black uppercase tracking-[0.18em] leading-relaxed">
              {message}
            </p>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-black/5 transition-colors shrink-0"
                aria-label="Close notification"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
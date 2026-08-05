"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, X } from "lucide-react";

type ConnectedAccountModalProps = {
  open: boolean;
  platform: string | null;
  onClose: () => void;
};

export default function ConnectedAccountModal({
  open,
  platform,
  onClose,
}: ConnectedAccountModalProps) {
  return (
    <AnimatePresence>
      {open && platform && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.95,
              y: 20,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
              y: 20,
            }}
            transition={{
              duration: 0.2,
            }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-[2rem] border border-stone-200 bg-white p-8 shadow-2xl"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-5 top-5 rounded-full p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2
                  size={42}
                  className="text-emerald-600"
                />
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-400">
                Connection Successful
              </p>

              <h2 className="mt-3 font-serif text-3xl italic text-stone-900">
                {platform.charAt(0).toUpperCase() +
                  platform.slice(1)}{" "}
                Connected
              </h2>

              <p className="mt-4 text-sm leading-6 text-stone-500">
                Your <strong>{platform}</strong> account has been
                successfully connected to TOTS-OS.
              </p>

              <p className="mt-2 text-sm leading-6 text-stone-500">
                You can now publish, schedule and manage content
                directly from your workspace.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-10 w-full rounded-full bg-stone-900 px-6 py-4 text-[10px] font-black uppercase tracking-wider text-white transition hover:opacity-90"
            >
              Continue
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
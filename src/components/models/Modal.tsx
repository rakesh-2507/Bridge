
import type { ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

const sizeClasses: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  full: "max-w-6xl",
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "lg",
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center
      bg-black/50 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[90vh] w-full ${sizeClasses[size]}
        flex-col overflow-hidden  rounded-tl-xl rounded-br-xl   border border-slate-200
        bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900`}
      >
        {/* Shared header */}
        <div className="flex shrink-0 items-center justify-between gap-4
          border-b border-slate-200 bg-white px-5 py-4
          dark:border-slate-800 dark:bg-slate-900">
          <h2 className="min-w-0 break-words text-lg font-semibold
            text-slate-900 dark:text-white">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="shrink-0  rounded-tl-xl rounded-br-xl   p-2 text-slate-500
            transition hover:bg-primary/10 hover:text-primary
            focus:outline-none focus-visible:ring-2
            focus-visible:ring-primary dark:text-slate-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </div>
  );
}

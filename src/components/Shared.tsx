import { useEffect, type ReactNode } from "react";
import { useReveal } from "../hooks";
import type { ToastMsg } from "../types";
import { AlertIcon, CheckIcon, InfoIcon, XIcon } from "../icons";

export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`reveal ${inView ? "is-in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export function Modal({
  onClose,
  children,
  label,
  wide = false,
}: {
  onClose: () => void;
  children: ReactNode;
  label: string;
  wide?: boolean;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", h);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div
        className="modal-fade fixed inset-0 bg-ink/85 backdrop-blur-[3px]"
        onClick={onClose}
      />
      <div className="relative flex min-h-full items-center justify-center p-4 py-8">
        <div
          className={`modal-pop relative w-full ${wide ? "max-w-4xl" : "max-w-3xl"}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function ToastHost({
  toasts,
  onDismiss,
}: {
  toasts: ToastMsg[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[70] flex w-[min(360px,calc(100vw-2.5rem))] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="toast-in pointer-events-auto flex items-center gap-3 rounded-lg border border-line bg-moss px-4 py-3 shadow-2xl shadow-black/50"
          role="status"
        >
          <span
            className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${
              t.kind === "success"
                ? "bg-teal/20 text-teal"
                : t.kind === "error"
                  ? "bg-clay/20 text-clay"
                  : "bg-amber/20 text-amber"
            }`}
          >
            {t.kind === "success" ? (
              <CheckIcon size={14} />
            ) : t.kind === "error" ? (
              <AlertIcon size={14} />
            ) : (
              <InfoIcon size={14} />
            )}
          </span>
          <p className="flex-1 text-[13px] leading-snug text-cream/90">{t.msg}</p>
          {t.actionLabel && t.onAction && (
            <button
              onClick={() => {
                t.onAction?.();
                onDismiss(t.id);
              }}
              className="shrink-0 rounded-md border border-amber/50 px-2.5 py-1 text-xs font-bold text-amber transition hover:bg-amber hover:text-ink active:scale-95"
            >
              {t.actionLabel}
            </button>
          )}
          <button
            onClick={() => onDismiss(t.id)}
            aria-label="Bildirimi kapat"
            className="shrink-0 text-fog transition hover:text-cream"
          >
            <XIcon size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

export function EmptyShelfArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 130" className={className} fill="none" aria-hidden>
      <rect x="24" y="26" width="30" height="76" rx="3" stroke="#2a382f" strokeWidth="2" strokeDasharray="6 5" />
      <rect x="64" y="14" width="34" height="88" rx="3" stroke="#e8a33d" strokeOpacity="0.55" strokeWidth="2" strokeDasharray="6 5" />
      <rect x="108" y="32" width="28" height="70" rx="3" stroke="#2a382f" strokeWidth="2" strokeDasharray="6 5" />
      <path d="M150 102l14-84 26 5-14 84z" stroke="#55a08e" strokeOpacity="0.6" strokeWidth="2" strokeDasharray="6 5" strokeLinejoin="round" />
      <rect x="204" y="20" width="32" height="82" rx="3" stroke="#2a382f" strokeWidth="2" strokeDasharray="6 5" />
      <rect x="246" y="38" width="26" height="64" rx="3" stroke="#2a382f" strokeWidth="2" strokeDasharray="6 5" />
      <rect x="8" y="106" width="304" height="8" rx="4" fill="#5d3419" />
      <rect x="8" y="106" width="304" height="3" rx="1.5" fill="#7a4a26" />
    </svg>
  );
}

export function EmptyGlobeArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 130" className={className} fill="none" aria-hidden>
      <circle cx="160" cy="62" r="42" stroke="#2a382f" strokeWidth="2" strokeDasharray="6 5" />
      <ellipse cx="160" cy="62" rx="18" ry="42" stroke="#55a08e" strokeOpacity="0.5" strokeWidth="2" strokeDasharray="6 5" />
      <path d="M118 62h84" stroke="#e8a33d" strokeOpacity="0.55" strokeWidth="2" strokeDasharray="6 5" />
      <rect x="60" y="24" width="70" height="12" rx="6" stroke="#2a382f" strokeWidth="2" strokeDasharray="5 4" />
      <rect x="196" y="88" width="64" height="12" rx="6" stroke="#2a382f" strokeWidth="2" strokeDasharray="5 4" />
      <circle cx="70" cy="30" r="2.4" fill="#e8a33d" />
      <circle cx="250" cy="94" r="2.4" fill="#55a08e" />
      <rect x="8" y="112" width="304" height="6" rx="3" fill="#18241e" />
    </svg>
  );
}

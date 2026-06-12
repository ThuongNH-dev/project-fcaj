import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

type ToastVariant = "success" | "error";
type ConfirmVariant = "default" | "danger";

interface ToastOptions {
  message: string;
  title?: string;
  variant: ToastVariant;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
}

interface ToastItem extends ToastOptions {
  id: number;
}

interface ConfirmState {
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
}

interface FeedbackContextValue {
  showToast: (options: ToastOptions) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const nextToastId = useRef(1);

  const dismissToast = useCallback((toastId: number) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== toastId),
    );
  }, []);

  const showToast = useCallback(
    (options: ToastOptions) => {
      const toastId = nextToastId.current;
      nextToastId.current += 1;

      setToasts((currentToasts) => [
        ...currentToasts,
        {
          id: toastId,
          ...options,
        },
      ]);

      window.setTimeout(() => {
        dismissToast(toastId);
      }, 3000);
    },
    [dismissToast],
  );

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({
        options,
        resolve,
      });
    });
  }, []);

  const closeConfirm = useCallback((confirmed: boolean) => {
    setConfirmState((currentState) => {
      currentState?.resolve(confirmed);
      return null;
    });
  }, []);

  const value = useMemo(
    () => ({
      showToast,
      confirm,
    }),
    [confirm, showToast],
  );

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      {typeof document !== "undefined" &&
        createPortal(
          <>
            <div className="pointer-events-none fixed right-4 top-4 z-[120] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
              {toasts.map((toast) => {
                const isSuccess = toast.variant === "success";

                return (
                  <div
                    key={toast.id}
                    className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-[0_20px_45px_rgba(17,24,39,0.14)] backdrop-blur-sm ${
                      isSuccess
                        ? "border-[#BBF7D0] bg-white/95"
                        : "border-[#FECACA] bg-white/95"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          isSuccess
                            ? "bg-[#F0FDF4] text-[#15803D]"
                            : "bg-[#FEF2F2] text-[#B91C1C]"
                        }`}
                      >
                        {isSuccess ? (
                          <CheckCircle2 className="h-4.5 w-4.5" />
                        ) : (
                          <AlertCircle className="h-4.5 w-4.5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        {toast.title && (
                          <p
                            className="text-sm text-[#111827]"
                            style={{ fontWeight: 700 }}
                          >
                            {toast.title}
                          </p>
                        )}
                        <p className="text-sm text-[#4B5563]">{toast.message}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => dismissToast(toast.id)}
                        className="rounded-lg p-1 text-[#9CA3AF] transition-colors hover:bg-[#F3F4F6] hover:text-[#374151]"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {confirmState && (
              <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
                <div
                  className="absolute inset-0 bg-black/35 backdrop-blur-sm"
                  onClick={() => closeConfirm(false)}
                />
                <div className="relative w-full max-w-md rounded-[1.75rem] border border-[#E5E7EB] bg-white p-6 shadow-[0_24px_64px_rgba(17,24,39,0.22)]">
                  <div className="mb-5">
                    <h2
                      className="text-[1.125rem] text-[#111827]"
                      style={{ fontWeight: 800 }}
                    >
                      {confirmState.options.title}
                    </h2>
                    <p className="mt-1.5 text-sm text-[#6B7280]">
                      {confirmState.options.message}
                    </p>
                  </div>
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => closeConfirm(false)}
                      className="rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm text-[#374151] transition-colors hover:bg-[#F9FAFB]"
                      style={{ fontWeight: 600 }}
                    >
                      {confirmState.options.cancelLabel ?? "Cancel"}
                    </button>
                    <button
                      type="button"
                      onClick={() => closeConfirm(true)}
                      className={`rounded-xl px-4 py-2.5 text-sm text-white shadow-sm transition-colors ${
                        confirmState.options.variant === "danger"
                          ? "bg-[#DC2626] hover:bg-[#B91C1C]"
                          : "bg-[#16A34A] hover:bg-[#15803D]"
                      }`}
                      style={{ fontWeight: 600 }}
                    >
                      {confirmState.options.confirmLabel ?? "Confirm"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>,
          document.body,
        )}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);

  if (!context) {
    throw new Error("useFeedback must be used within a FeedbackProvider.");
  }

  return context;
}

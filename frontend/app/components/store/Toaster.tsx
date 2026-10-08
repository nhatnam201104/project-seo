import { useEffect } from "react";
import { useNotificationStore, type Toast } from "~/stores/notification.store";

export const TOAST_TIMEOUT_MS = 4000;

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useNotificationStore((s) => s.dismiss);
  useEffect(() => {
    const timer = setTimeout(() => dismiss(toast.id), TOAST_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [toast.id, dismiss]);
  return (
    <div className={`sp-toast sp-toast--${toast.kind}`} role={toast.kind === "error" ? "alert" : "status"}>
      <span>{toast.message}</span>
      <button type="button" aria-label="Đóng thông báo" onClick={() => dismiss(toast.id)}>×</button>
    </div>
  );
}

/** Vùng hiển thị thông báo toàn cục (đọc từ notification store). */
export function Toaster() {
  const toasts = useNotificationStore((s) => s.toasts);
  return (
    <div className="sp-toasts" aria-live="polite">
      {toasts.map((t) => <ToastItem key={t.id} toast={t} />)}
    </div>
  );
}

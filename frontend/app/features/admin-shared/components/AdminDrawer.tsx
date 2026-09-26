import { useEffect, useRef, type ReactNode } from "react";

interface AdminDrawerProps {
  readonly open: boolean;
  readonly title: string;
  readonly description: string;
  readonly onClose: () => void;
  readonly children: ReactNode;
}

export function AdminDrawer({
  open,
  title,
  description,
  onClose,
  children,
}: AdminDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="adm-drawer-layer">
      <button
        className="adm-drawer-backdrop"
        type="button"
        onClick={onClose}
        aria-label="Đóng bảng chi tiết"
      />
      <section
        className="adm-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="adm-drawer-title"
        aria-describedby="adm-drawer-description"
      >
        <header>
          <div>
            <p className="adm-eyebrow">Workspace editor</p>
            <h2 id="adm-drawer-title">{title}</h2>
            <p id="adm-drawer-description">{description}</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Đóng"
          >
            ×
          </button>
        </header>
        <div className="adm-drawer__content">{children}</div>
      </section>
    </div>
  );
}

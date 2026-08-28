import { Link } from "react-router";
import type { ReactNode } from "react";

type AuthShellProps = { title: string; eyebrow: string; children: ReactNode };

export function AuthShell({ title, eyebrow, children }: AuthShellProps) {
  return (
    <section className="auth-shell" aria-labelledby="auth-title">
      <div className="auth-shell__visual" aria-hidden="true">
        <img src="/landing/statement-1600.webp" alt="" />
        <Link to="/" tabIndex={-1}>PROJECTSALE</Link>
        <p>SEE CLEARLY.<br/>LIVE DISTINCTLY.</p>
      </div>
      <div className="auth-shell__content">
        <div className="auth-shell__masthead"><Link to="/">PROJECTSALE</Link><span>{eyebrow}</span></div>
        <div className="auth-shell__form-wrap">
          <p className="auth-shell__eyebrow">PRIVATE CLIENT / {eyebrow}</p>
          <h1 id="auth-title">{title}</h1>
          {children}
        </div>
        <p className="auth-shell__foot">© 2026 PROJECTSALE / HO CHI MINH CITY</p>
      </div>
    </section>
  );
}

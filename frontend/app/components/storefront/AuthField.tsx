import { useState, type InputHTMLAttributes } from "react";

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function AuthField({ label, error, type = "text", id, ...props }: AuthFieldProps) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const fieldId = id ?? props.name;
  return (
    <div className={`auth-field${error ? " auth-field--error" : ""}`}>
      <label htmlFor={fieldId}>{label}</label>
      <div className="auth-field__control">
        <input id={fieldId} type={isPassword && visible ? "text" : type} aria-invalid={Boolean(error)} aria-describedby={error ? `${fieldId}-error` : undefined} {...props} />
        {isPassword ? <button type="button" onClick={() => setVisible((value) => !value)} aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>{visible ? "HIDE" : "SHOW"}</button> : null}
      </div>
      {error ? <p id={`${fieldId}-error`} role="alert">{error}</p> : null}
    </div>
  );
}

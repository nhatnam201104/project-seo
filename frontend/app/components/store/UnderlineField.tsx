import { useId, useState, type InputHTMLAttributes, type SelectHTMLAttributes } from "react";

type FieldMeta = { label: string; hint?: string; error?: string };

function describedBy(id: string, meta: FieldMeta) {
  return meta.error ? `${id}-error` : meta.hint ? `${id}-hint` : undefined;
}

function Meta({ id, hint, error }: { id: string; hint?: string; error?: string }) {
  if (error) return <p id={`${id}-error`} className="sp-field__msg sp-field__msg--error" role="alert">{error}</p>;
  if (hint) return <p id={`${id}-hint`} className="sp-field__msg">{hint}</p>;
  return null;
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & FieldMeta;

/** Ô nhập gạch chân (nhãn phía trên, lỗi ngay dưới ô). Hỗ trợ ẩn/hiện mật khẩu. */
export function UnderlineField({ label, hint, error, type = "text", id, className, ...props }: InputProps) {
  const auto = useId();
  const fieldId = id ?? props.name ?? auto;
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  return (
    <div className={`sp-field${error ? " sp-field--error" : ""}${className ? ` ${className}` : ""}`}>
      <label htmlFor={fieldId}>{label}{props.required ? " *" : ""}</label>
      <div className="sp-field__control">
        <input id={fieldId} type={isPassword && visible ? "text" : type} aria-invalid={Boolean(error)} aria-describedby={describedBy(fieldId, { label, hint, error })} {...props} />
        {isPassword ? (
          <button type="button" onClick={() => setVisible((v) => !v)} aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>{visible ? "Ẩn" : "Hiện"}</button>
        ) : null}
      </div>
      <Meta id={fieldId} hint={hint} error={error} />
    </div>
  );
}

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "value"> &
  FieldMeta & {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder: string;
    loading?: boolean;
  };

/** Dropdown gạch chân; luôn giữ giá trị đang chọn trong danh sách kể cả khi cấp dưới chưa tải xong. */
export function UnderlineSelect({ label, hint, error, value, onChange, options, placeholder, loading, id, name, ...props }: SelectProps) {
  const auto = useId();
  const fieldId = id ?? name ?? auto;
  const list = value && !options.some((o) => o.value === value) ? [{ value, label: value }, ...options] : options;
  return (
    <div className={`sp-field${error ? " sp-field--error" : ""}`}>
      <label htmlFor={fieldId}>{label}{props.required ? " *" : ""}</label>
      <div className="sp-field__control sp-field__control--select">
        <select id={fieldId} name={name} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={Boolean(error)} aria-describedby={describedBy(fieldId, { label, hint, error })} aria-busy={loading} {...props}>
          <option value="">{loading ? "Đang tải…" : placeholder}</option>
          {list.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <Meta id={fieldId} hint={hint} error={error} />
    </div>
  );
}

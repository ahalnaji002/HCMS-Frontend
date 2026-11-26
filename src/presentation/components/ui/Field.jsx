import { forwardRef, useId } from "react";
import { cx } from "@/presentation/components/ui/cx";
import { controlClasses } from "@/presentation/components/ui/styles";

/**
 * Label + control + hint + error, with ids wired for screen readers.
 * `children` is a function receiving the props the control must spread:
 * <Field label="Phone" hint="…" error={error}>{(control) => <input {...control} />}</Field>
 * Prefer TextField / SelectField / TextareaField below for standard controls.
 */
export function Field({ label, hint, error, required, optionalLabel, className, children }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const control = {
    id,
    required,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": [hintId, errorId].filter(Boolean).join(" ") || undefined,
    className: cx(controlClasses, error ? "border-danger" : "border-border"),
  };

  return (
    <div className={cx("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-sm font-semibold text-text-primary">
        {label}
        {required && <span aria-hidden="true" className="ms-1 text-danger">*</span>}
        {!required && optionalLabel && <>{" "}<span className="font-normal text-text-secondary">({optionalLabel})</span></>}
      </label>
      {children(control)}
      {hint && <p id={hintId} className="text-xs leading-5 text-text-secondary">{hint}</p>}
      {error && <p id={errorId} role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  );
}

function mergeClass(control, className) {
  return { ...control, className: cx(control.className, className) };
}

export const TextField = forwardRef(function TextField({ label, hint, error, required, optionalLabel, className, inputClassName, ...props }, ref) {
  return (
    <Field label={label} hint={hint} error={error} required={required} optionalLabel={optionalLabel} className={className}>
      {(control) => <input ref={ref} {...mergeClass(control, inputClassName)} {...props} />}
    </Field>
  );
});

/** options: [{ value, label }] or pass <option> children. */
export const SelectField = forwardRef(function SelectField({ label, hint, error, required, optionalLabel, className, options, placeholder, children, ...props }, ref) {
  return (
    <Field label={label} hint={hint} error={error} required={required} optionalLabel={optionalLabel} className={className}>
      {(control) => (
        <select ref={ref} {...control} {...props}>
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options ? options.map((option) => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>) : children}
        </select>
      )}
    </Field>
  );
});

export const TextareaField = forwardRef(function TextareaField({ label, hint, error, required, optionalLabel, className, rows = 4, ...props }, ref) {
  return (
    <Field label={label} hint={hint} error={error} required={required} optionalLabel={optionalLabel} className={className}>
      {(control) => <textarea ref={ref} rows={rows} {...mergeClass(control, "py-3 leading-6")} {...props} />}
    </Field>
  );
});

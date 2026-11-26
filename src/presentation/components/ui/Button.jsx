import { Link } from "react-router-dom";
import { buttonClasses } from "@/presentation/components/ui/styles";

function Spinner() {
  return <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />;
}

/**
 * <Button variant="primary|secondary|danger|danger-outline|ghost" size="sm|md|lg"
 *         loading loadingText="Saving…" fullWidth icon={<svg/>}>Save</Button>
 * While `loading`, the button is disabled and shows `loadingText` (or its label).
 */
function Button({ variant, size, fullWidth, loading = false, loadingText, icon, className, disabled, type = "button", children, ...props }) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...props}
    >
      {loading ? <Spinner /> : icon}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}

// Same look for navigation: <ButtonLink to="/patient/reminders">…</ButtonLink>
export function ButtonLink({ variant = "secondary", size, fullWidth, className, children, ...props }) {
  return (
    <Link className={buttonClasses({ variant, size, fullWidth, className })} {...props}>
      {children}
    </Link>
  );
}

export default Button;

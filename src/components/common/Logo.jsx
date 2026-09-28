import logo from "../../assets/brand/hcms-logo.svg";
import logoDark from "../../assets/brand/hcms-logo-dark.svg";
import mark from "../../assets/brand/hcms-mark.svg";
import markWhite from "../../assets/brand/hcms-mark-white.svg";

function Logo({ variant = "logo", appearance = "light", className = "" }) {
  const isMark = variant === "mark";
  const isDark = appearance === "dark";
  const src = isMark
    ? isDark
      ? markWhite
      : mark
    : isDark
      ? logoDark
      : logo;
  const alt = isMark
    ? "HCMS"
    : "HCMS — Healthcare Conflict Management System";

  return <img src={src} alt={alt} className={className} />;
}

export default Logo;

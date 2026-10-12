import logo from "@/assets/brand/hcms-logo.svg";
import logoDark from "@/assets/brand/hcms-logo-dark.svg";
import mark from "@/assets/brand/hcms-mark.svg";
import markWhite from "@/assets/brand/hcms-mark-white.svg";

function Logo({
  variant = "logo",
  appearance = "light",
  className = "",
  alt: altText,
}) {
  const isMark = variant === "mark";
  const isDark = appearance === "dark";
  const src = isMark
    ? isDark
      ? markWhite
      : mark
    : isDark
      ? logoDark
      : logo;
  const defaultAlt = isMark
    ? "HCMS"
    : "HCMS — Healthcare Conflict Management System";

  return <img src={src} alt={altText ?? defaultAlt} className={className} />;
}

export default Logo;

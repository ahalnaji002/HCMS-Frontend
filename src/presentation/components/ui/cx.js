// Joins class names, skipping empty values: cx("a", condition && "b").
export function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

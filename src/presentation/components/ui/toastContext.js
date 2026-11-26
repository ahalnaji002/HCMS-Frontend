import { createContext, useContext } from "react";

export const ToastContext = createContext(null);

/**
 * const toast = useToast();
 * toast.success({ key: "adminIntakes.assignmentSaved" });   // follows language changes
 * toast.error({ server: error.response?.data?.message, key: "adminIntakes.actionError" });
 * toast.success("Plain text works too");
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside <ToastProvider>");
  return context;
}

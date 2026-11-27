import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { specializationKey } from "@/domain/doctor/specializations";

// Returns a function that turns a stored specialization into the label for
// the current language. Older free-text values are shown as they are.
export function useSpecializationLabel() {
  const { t } = useTranslation();

  return useCallback(
    (value) => {
      if (!value) return "";
      const key = specializationKey(value);
      return key ? t(`specializations.${key}`) : value;
    },
    [t],
  );
}

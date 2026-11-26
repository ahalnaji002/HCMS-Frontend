import { useTranslation } from "react-i18next";
import { formatDate, formatDateTime } from "@/presentation/utils/formatDate";

/** const { date, dateTime } = useFormatDate(); date(plan.start_date); dateTime(alert.sent_at) */
export function useFormatDate() {
  const { i18n } = useTranslation();
  return {
    date: (value) => formatDate(value, i18n.language),
    dateTime: (value) => formatDateTime(value, i18n.language),
  };
}

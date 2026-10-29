import { formatLocalDate } from "../../../client/utils/dateUtils.js";

export { formatLocalDate };

export const parseDate = (value?: string): string => {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  return formatLocalDate(new Date());
};

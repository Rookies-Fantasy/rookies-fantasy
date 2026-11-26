export const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getMidnightPdtFromDate = (date: string) => {
  // date is YYYY-MM-DD (PDT day)
  const [year, month, day] = date.split("-").map(Number);

  // Midnight PDT at end of day = next day 00:00 PDT
  // PDT = UTC-7 → midnight PDT = 07:00 UTC
  return new Date(Date.UTC(year, month - 1, day, 7, 0, 0));
};

export const getPacificDateString = (date: Date): string =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

export const parseLocalDate = (date: string): Date => {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const formatDeadlineDate = (date: string): string =>
  parseLocalDate(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

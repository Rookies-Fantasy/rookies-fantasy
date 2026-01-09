export const getMidnightPdtFromDate = (date: string) => {
  // date is YYYY-MM-DD (PDT day)
  const [year, month, day] = date.split("-").map(Number);

  // Midnight PDT at end of day = next day 00:00 PDT
  // PDT = UTC-7 → midnight PDT = 07:00 UTC
  return new Date(Date.UTC(year, month - 1, day, 7, 0, 0));
};

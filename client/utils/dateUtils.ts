export const getMidnightPdtFromDate = (date: string) => {
  // date is YYYY-MM-DD (PDT day)
  const [year, month, day] = date.split("-").map(Number);

  // Midnight PDT at end of day = next day 00:00 PDT
  // PDT = UTC-7 → midnight PDT = 07:00 UTC
  return new Date(Date.UTC(year, month - 1, day, 7, 0, 0));
};

export const getMinimumSeasonStartDate = (): Date => {
  const now = new Date();

  // Get the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const currentDay = now.getDay();

  // Calculate days until next Monday
  const daysUntilNextMonday = currentDay === 0 ? 1 : (8 - currentDay) % 7 || 7;

  // Add days to get next Monday
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilNextMonday);

  // Set to 2 AM
  nextMonday.setHours(2, 0, 0, 0);

  return nextMonday;
};

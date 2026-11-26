export type NbaTeam = {
  abbreviation: string;
  city: string;
  conference: string;
  division: string;
  fullName: string;
  id: string;
  // NBA-owned logo URL. Intentionally not rendered (App Store Guideline 5.2);
  // kept so Firestore data shape is unchanged. Use TeamBadge instead.
  logoUrl: string;
  name: string;
  state: string;
};

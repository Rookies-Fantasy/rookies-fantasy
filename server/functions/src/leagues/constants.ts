// League shape limits. These mirror the client-side yup schema in
// `client/app/(protected)/createLeague.tsx` so a hand-rolled request can't create
// a league the UI would never allow.
export const MIN_TEAMS = 4;
export const MAX_TEAMS = 20;
export const MIN_BUDGET = 150_000_000;
export const MAX_BUDGET = 250_000_000;
export const MAX_LEAGUE_NAME_LENGTH = 50;

// Hard cap on how many members a single league may ever hold, independent of the
// league's own `numberOfTeams`. `getLeagueStandings` fans out one Firestore read
// per member, so this also bounds that fan-out.
export const MAX_LEAGUE_SIZE = MAX_TEAMS;

// How many member reads may be in flight at once during the standings fan-out.
export const STANDINGS_FANOUT_CONCURRENCY = 10;

// Firestore allows at most 30 values in an `in` / `documentId() in` filter.
export const FIRESTORE_IN_QUERY_LIMIT = 30;

// Environment resolution for the Firebase client wiring.
//
// Kept free of React Native / Firebase imports so the rules that decide *which*
// backend the app talks to are plain, testable functions. `config.ts` is the thin
// adapter that feeds real values in.

export type AppEnvironment = "development" | "preview" | "production";

export type BackendMode = "emulator" | "cloud";

const KNOWN_ENVIRONMENTS: AppEnvironment[] = [
  "development",
  "preview",
  "production",
];

// Mirrors the `development | preview | production` split in app.config.ts.
// Anything unrecognised is treated as production: an unknown environment must
// never unlock development-only behaviour such as emulator wiring.
export const normalizeEnvironment = (value: string): AppEnvironment => {
  const match = KNOWN_ENVIRONMENTS.find((environment) => environment === value);
  return match ? match : "production";
};

export type ProjectIdSources = {
  // EXPO_PUBLIC_FIREBASE_PROJECT_ID, if the build set one.
  envOverride: string;
  // `extra.firebaseProjectId`, published per environment by app.config.ts.
  expoConfig: string;
  // `getApp().options.projectId`, read from the environment-specific
  // GoogleService-Info.plist / google-services.json bundled into the build.
  firebaseApp: string;
};

// Resolves the Firebase project id for the running build. The project id used to
// be a hardcoded `rookies-fantasy-development`, which meant preview and
// production builds addressed development's Cloud Functions. There is no safe
// default here, so an unresolvable project id throws rather than guessing.
export const resolveProjectId = (sources: ProjectIdSources): string => {
  const candidates = [
    sources.envOverride,
    sources.expoConfig,
    sources.firebaseApp,
  ];

  const resolved = candidates
    .map((candidate) => candidate.trim())
    .find((candidate) => candidate.length > 0);

  if (!resolved) {
    throw new Error(
      "Unable to resolve the Firebase project id. Set EXPO_PUBLIC_FIREBASE_PROJECT_ID " +
        "or ensure the environment's google-services file is bundled.",
    );
  }

  return resolved;
};

export type EmulatorSignals = {
  // EXPO_PUBLIC_USE_EMULATOR, inlined by Expo at build time.
  flag: string;
  environment: AppEnvironment;
  // React Native's `__DEV__`: false in any release build.
  isDebugBuild: boolean;
};

// Decides whether to talk to the local emulators.
//
// The flag alone is not enough: Expo inlines EXPO_PUBLIC_USE_EMULATOR at build
// time, so a preview or production build produced on a machine where that
// variable happened to be set would ship with Auth and Firestore pointed at
// localhost. Two independent signals must also agree — the build must declare
// the development environment, and it must be a debug build.
export const resolveBackendMode = (signals: EmulatorSignals): BackendMode => {
  const requested = signals.flag === "true";
  const allowed = signals.environment === "development" && signals.isDebugBuild;
  return requested && allowed ? "emulator" : "cloud";
};

export type FunctionUrlParams = {
  functionName: string;
  mode: BackendMode;
  projectId: string;
  region: string;
  emulatorHost: string;
  emulatorPort: number;
};

export const buildFunctionUrl = (params: FunctionUrlParams): string => {
  if (params.mode === "emulator") {
    return `http://${params.emulatorHost}:${params.emulatorPort}/${params.projectId}/${params.region}/${params.functionName}`;
  }

  return `https://${params.region}-${params.projectId}.cloudfunctions.net/${params.functionName}`;
};

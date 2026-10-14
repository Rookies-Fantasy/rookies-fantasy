export type AppEnvironment = "development" | "preview" | "production";
export type BackendMode = "emulator" | "cloud";

// Missing or unknown metadata must not enable development-only behavior.
export const normalizeEnvironment = (value: unknown): AppEnvironment => {
  if (value === "development" || value === "preview") {
    return value;
  }
  return "production";
};

export const resolveBackendMode = ({
  flag,
  environment,
  isDebugBuild,
}: {
  flag: string | undefined;
  environment: AppEnvironment;
  isDebugBuild: boolean;
}): BackendMode =>
  flag === "true" && environment === "development" && isDebugBuild
    ? "emulator"
    : "cloud";

export const resolveEmulatorHost = (
  override: string | undefined,
  platform: string,
): string =>
  override?.trim() || (platform === "android" ? "10.0.2.2" : "localhost");

export const buildFunctionUrl = ({
  functionName,
  projectId,
  mode,
  emulatorHost,
}: {
  functionName: string;
  projectId: string | undefined;
  mode: BackendMode;
  emulatorHost: string;
}): string => {
  if (!projectId?.trim()) {
    throw new Error(
      "The native Firebase configuration is missing its project ID.",
    );
  }

  return mode === "emulator"
    ? `http://${emulatorHost}:5001/${projectId}/us-central1/${functionName}`
    : `https://us-central1-${projectId}.cloudfunctions.net/${functionName}`;
};

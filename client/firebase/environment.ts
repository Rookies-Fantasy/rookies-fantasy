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
  metroHostUri?: string | null,
): string => {
  const explicitHost = override?.trim();
  if (explicitHost) return explicitHost;

  const defaultHost = platform === "android" ? "10.0.2.2" : "localhost";
  const hostUri = metroHostUri?.trim();
  if (!hostUri) return defaultHost;

  try {
    const metroHost = new URL(
      hostUri.includes("://") ? hostUri : `http://${hostUri}`,
    ).hostname;
    const isLoopback = ["localhost", "127.0.0.1", "[::1]"].includes(metroHost);
    if (platform === "android" && isLoopback) return defaultHost;
    return metroHost || defaultHost;
  } catch {
    return defaultHost;
  }
};

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

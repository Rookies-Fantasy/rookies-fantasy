import type { ConfigContext, ExpoConfig } from "expo/config";

const EAS_PROJECT_ID = "ee1dd2e5-d9ed-45d5-9c39-85529018afab";
const PROJECT_SLUG = "rookies-fantasy";
const OWNER = "rookies-fantasy";

const APP_NAME = "Rookies Fantasy";
const BUNDLE_IDENTIFIER = "com.rookies.rookiesfantasy";
const PACKAGE_NAME = "com.rookies.rookiesfantasy";
const ICON = "./assets/images/ios-light-icon.png";
const ADAPTIVE_ICON = "./assets/images/adaptive-icon.png";
const SCHEME = "myapp";

type IosInfoPlist = {
  ITSAppUsesNonExemptEncryption: boolean;
  NSAppTransportSecurity?: {
    NSAllowsLocalNetworking: boolean;
    NSExceptionDomains?: Record<
      string,
      {
        NSExceptionAllowsInsecureHTTPLoads: boolean;
        NSIncludesSubdomains: boolean;
      }
    >;
  };
};

// The Firebase project the build talks to. Development's id is known and pinned
// here; preview and production resolve theirs from EXPO_PUBLIC_FIREBASE_PROJECT_ID
// or, failing that, from the environment-specific google-services file bundled
// into the build (see firebase/config.ts). An empty string here deliberately
// means "resolve at runtime" — it must never silently fall back to development.
const getFirebaseProjectId = (
  environment: "development" | "preview" | "production",
) => {
  const configured = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  if (configured) {
    return configured;
  }

  if (environment === "development") {
    return "rookies-fantasy-development";
  }

  return "";
};

const getBaseUrl = (environment: "development" | "preview" | "production") => {
  if (environment === "production") {
    return "https://rookiesfantasy.com";
  }

  if (environment === "preview") {
    return "https://staging.rookiesfantasy.com";
  }

  return "https://dev.rookiesfantasy.com";
};

export const getDynamicAppConfig = (
  environment: "development" | "preview" | "production",
) => {
  if (environment === "production") {
    return {
      name: APP_NAME,
      bundleIdentifier: BUNDLE_IDENTIFIER,
      packageName: PACKAGE_NAME,
      icon: ICON,
      adaptiveIcon: ADAPTIVE_ICON,
      scheme: SCHEME,
    };
  }

  if (environment === "preview") {
    return {
      name: `${APP_NAME} Staging`,
      bundleIdentifier: `${BUNDLE_IDENTIFIER}.staging`,
      packageName: `${PACKAGE_NAME}.staging`,
      icon: ICON, // TODO: Change this to the specific iOS icon when ready ("./assets/images/icons/iOS-staging.png")
      adaptiveIcon: ADAPTIVE_ICON, // TODO: Change this to the specific Android icon when ready ("./assets/images/icons/Android-staging.png")
      scheme: `${SCHEME}-staging`,
    };
  }

  return {
    name: `${APP_NAME} Development`,
    bundleIdentifier: `${BUNDLE_IDENTIFIER}.development`,
    packageName: `${PACKAGE_NAME}.development`,
    icon: ICON, // TODO: Change this to the specific iOS icon when ready ("./assets/images/icons/iOS-development.png")
    adaptiveIcon: ADAPTIVE_ICON, // TODO: Change this to the specific Android icon when ready ("./assets/images/icons/Android-development.png")
    scheme: `${SCHEME}-development`,
  };
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const environment =
    (process.env.APP_ENV as "development" | "preview" | "production") ||
    "development";

  const { name, bundleIdentifier, icon, adaptiveIcon, packageName, scheme } =
    getDynamicAppConfig(environment);

  // Get Google Services file based on environment
  const getGoogleServicesFile = () => {
    if (process.env.GOOGLE_SERVICE_INFO_PLIST) {
      return process.env.GOOGLE_SERVICE_INFO_PLIST;
    }
    if (environment === "preview") {
      return "./GoogleService-Info-staging.plist";
    }
    return "./GoogleService-Info-development.plist";
  };

  const getAndroidGoogleServicesFile = () => {
    if (process.env.GOOGLE_SERVICES_JSON) {
      return process.env.GOOGLE_SERVICES_JSON;
    }
    if (environment === "preview") {
      return "./google-services-staging.json";
    }
    return "./google-services-development.json";
  };

  const baseUrl = getBaseUrl(environment);

  const getIosInfoPlist = (): IosInfoPlist => {
    const infoPlist: IosInfoPlist = {
      ITSAppUsesNonExemptEncryption: false,
    };

    if (environment !== "development") {
      return infoPlist;
    }

    const emulatorHost = process.env.EXPO_PUBLIC_EMULATOR_HOST ?? "";

    infoPlist.NSAppTransportSecurity =
      emulatorHost === ""
        ? { NSAllowsLocalNetworking: true }
        : {
            NSAllowsLocalNetworking: true,
            NSExceptionDomains: {
              [emulatorHost]: {
                NSExceptionAllowsInsecureHTTPLoads: true,
                NSIncludesSubdomains: true,
              },
            },
          };

    return infoPlist;
  };

  return {
    ...config,
    name: name,
    slug: PROJECT_SLUG,
    version: "1.0.0",
    orientation: "portrait",
    icon: icon,
    scheme: scheme,
    userInterfaceStyle: "automatic",
    ios: {
      googleServicesFile: getGoogleServicesFile(),
      bundleIdentifier: bundleIdentifier,
      supportsTablet: true,
      infoPlist: getIosInfoPlist(),
    },
    android: {
      adaptiveIcon: {
        foregroundImage: adaptiveIcon,
        backgroundColor: "#ffffff",
      },
      googleServicesFile: getAndroidGoogleServicesFile(),
      package: packageName,
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      "@react-native-community/datetimepicker",
      "expo-font",
      "expo-image",
      [
        "expo-splash-screen",
        {
          imageWidth: 200,
          image: "./assets/images/splash.png",
          resizeMode: "contain",
          backgroundColor: "#3B2689",
        },
      ],
      "expo-status-bar",
      "expo-web-browser",
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
      "@react-native-firebase/crashlytics",
      "@react-native-google-signin/google-signin",
      [
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static",
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: EAS_PROJECT_ID,
      },
      baseUrl,
      // Published so runtime code can tell which environment it is in without
      // re-reading APP_ENV, which is a build-time-only variable.
      environment,
      firebaseProjectId: getFirebaseProjectId(environment),
    },
    updates: {
      url: "https://u.expo.dev/ee1dd2e5-d9ed-45d5-9c39-85529018afab",
    },
    runtimeVersion: config.version,
    owner: OWNER,
  };
};

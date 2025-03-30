import { ConfigContext, ExpoConfig } from "expo/config";

const EAS_PROJECT_ID = "ee1dd2e5-d9ed-45d5-9c39-85529018afab";
const PROJECT_SLUG = "rookies-fantasy";
const OWNER = "rookies-fantasy";

const APP_NAME = "Rookies Fantasy";
const BUNDLE_IDENTIFIER = "com.rookies.rookiesfantasy";
const PACKAGE_NAME = "com.rookies.rookiesfantasy";
const ICON = "./assets/images/icon.png";
const ADAPTIVE_ICON = "./assets/images/adaptive-icon.png";
const SCHEME = "myapp";

export const getDynamicAppConfig = (
  environment: "development" | "preview" | "production"
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
  console.log("⚙️ Building app for environment:", process.env.APP_ENV);
  const { name, bundleIdentifier, icon, adaptiveIcon, packageName, scheme } =
    getDynamicAppConfig(
      (process.env.APP_ENV as "development" | "preview" | "production") ||
        "development"
    );

  return {
    ...config,
    name: name,
    slug: PROJECT_SLUG,
    version: "1.0.0",
    orientation: "portrait",
    icon: icon,
    scheme: scheme,
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      googleServicesFile:
        process.env.GOOGLE_SERVICE_INFO_PLIST ??
        "./GoogleService-Info-development.plist",
      bundleIdentifier: bundleIdentifier,
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: adaptiveIcon,
        backgroundColor: "#ffffff",
      },
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON ??
        "./google-services-development.json",
      package: packageName,
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
      "@react-native-firebase/crashlytics",
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
    },
    updates: {
      url: "https://u.expo.dev/ee1dd2e5-d9ed-45d5-9c39-85529018afab",
    },
    runtimeVersion: {
      policy: "appVersion",
    },
    owner: OWNER,
  };
};

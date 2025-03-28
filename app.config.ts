import { ConfigContext, ExpoConfig } from "expo/config";

const IS_DEV = process.env.APP_VARIANT === "development";
const IS_PREVIEW = process.env.APP_VARIANT === "preview";

const getUniqueIdentifier = () => {
  if (IS_DEV) {
    return "com.rookies.rookiesfantasy.dev";
  }

  if (IS_PREVIEW) {
    return "com.rookies.rookiesfantasy.preview";
  }

  return "com.rookies.rookiesfantasy";
};

const getAppName = () => {
  if (IS_DEV) {
    return "Rookies Fantasy (Dev)";
  }

  if (IS_PREVIEW) {
    return "Rookies Fantasy (Preview)";
  }

  return "Rookies Fantasy";
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: getAppName(),
  slug: "rookies-fantasy",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "myapp",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: {
    googleServicesFile: "./GoogleService-Info.plist",
    bundleIdentifier: getUniqueIdentifier(),
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    googleServicesFile: "./google-services.json",
    package: getUniqueIdentifier(),
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
      projectId: "ee1dd2e5-d9ed-45d5-9c39-85529018afab",
    },
  },
  owner: "rookies-fantasy",
});

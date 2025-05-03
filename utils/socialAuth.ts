import auth, {
  OAuthProvider,
  signInWithCredential,
  getAuth,
} from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import { Platform } from "react-native";

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
});

export async function signInWithGoogle() {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const signInResult = await GoogleSignin.signIn();

    let idToken = signInResult.data?.idToken;

    if (!idToken) {
      throw new Error("No ID token found");
    }

    const googleCredential = auth.GoogleAuthProvider.credential(idToken);

    return auth().signInWithCredential(googleCredential);
  } catch (error) {
    console.log("Google Sign-In Error:", error);
    throw error;
  }
}

export async function signInWithApple() {
  if (Platform.OS !== "ios") throw new Error("Apple Sign-In only works on iOS");

  const appleAuthRequestResponse = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  const { identityToken } = appleAuthRequestResponse;

  if (!identityToken) throw new Error("Apple identity token is missing");

  const appleCredential = OAuthProvider("apple.com").credential({
    idToken: identityToken,
  });

  return signInWithCredential(getAuth(), appleCredential);
}

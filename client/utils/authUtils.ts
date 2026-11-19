import { appleAuth } from "@invertase/react-native-apple-authentication";
import auth from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
});

const getGoogleCredential = async () => {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const signInResult = await GoogleSignin.signIn();

  const idToken = signInResult.data?.idToken;

  if (!idToken) {
    throw new Error("No ID token found");
  }

  return auth.GoogleAuthProvider.credential(idToken);
};

export const getAppleCredential = async () => {
  const { identityToken, nonce } = await appleAuth.performRequest({
    requestedOperation: appleAuth.Operation.LOGIN,
    requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
  });

  if (!identityToken) {
    throw new Error("Apple Sign-In failed - no identity token returned");
  }

  return auth.AppleAuthProvider.credential(identityToken, nonce);
};

export const isAppleSignInSupported = appleAuth.isSupported;

export const signInWithGoogle = async () => {
  try {
    const googleCredential = await getGoogleCredential();
    return auth().signInWithCredential(googleCredential);
  } catch (error) {
    console.log("Google Sign-In Error:", error);
    throw error;
  }
};

/** Returns `null` if the user dismissed the Apple sign-in sheet. */
export const signInWithApple = async () => {
  try {
    const appleCredential = await getAppleCredential();
    return await auth().signInWithCredential(appleCredential);
  } catch (error) {
    if ((error as { code?: string }).code === appleAuth.Error.CANCELED) {
      return null;
    }
    console.log("Apple Sign-In Error:", error);
    throw error;
  }
};

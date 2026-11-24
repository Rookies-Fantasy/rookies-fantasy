import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { getBackendMode, getEmulatorHost } from "@/firebase/config";

export const connectToEmulators = () => {
  if (getBackendMode() !== "emulator") {
    return;
  }

  const emulatorHost = getEmulatorHost();
  auth().useEmulator(`http://${emulatorHost}:9099`);
  firestore().useEmulator(emulatorHost, 8080);

  console.log(`[Emulator] Connected to Firebase emulators at ${emulatorHost}`);
};

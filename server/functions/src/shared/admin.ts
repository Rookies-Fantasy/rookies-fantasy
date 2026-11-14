import * as admin from "firebase-admin";

admin.initializeApp();

export { admin };
// Imported from the firestore entry point because admin.firestore.FieldValue
// is undefined in the Functions emulator.
export { FieldPath, FieldValue } from "firebase-admin/firestore";

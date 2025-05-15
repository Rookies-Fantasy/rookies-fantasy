import firestore from "@react-native-firebase/firestore";

export type UserEditModel = {
  name: string;
  username: string;
  dateOfBirth: Date;
};

export class UserController {
  static getUser = async (userId: string) => {
    try {
      const userDoc = await firestore().collection("users").doc(userId).get();
      return userDoc.exists ? userDoc.data() : undefined;
    } catch (error) {
      throw error;
    }
  };

  static editUser = async (userId: string, params: UserEditModel) => {
    try {
      await firestore().collection("users").doc(userId).update(params);
    } catch (error) {
      throw error;
    }
  };
}

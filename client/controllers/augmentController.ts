import firestore from "@react-native-firebase/firestore";
import { Augment } from "@/types/augmentTypes";

const AUGMENTS_COLLECTION = "augments";

export class AugmentController {
  static getAugments = async (): Promise<Augment[]> => {
    try {
      const augments = await firestore().collection(AUGMENTS_COLLECTION).get();

      return augments.docs.map((augment) => ({
        description: augment.data().description,
        id: augment.id,
        iconUrl: augment.data().iconUrl,
        info: augment.data().info,
        title: augment.data().title,
      }));
    } catch (error) {
      throw error;
    }
  };
}

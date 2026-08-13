import firestore from "@react-native-firebase/firestore";
import { Augment } from "@/types/augment";

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
        isActive: augment.data().isActive,
        prerequisites: augment.data().prerequisites,
        effects: augment.data().effects,
        playerCount: augment.data().playerCount,
      }));
    } catch (error) {
      throw error;
    }
  };
}

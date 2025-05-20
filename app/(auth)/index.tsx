import {
  View,
  Text,
  Pressable,
  ImageBackground,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Carousel } from "@/components/Carousel";
import { PressableLink } from "@/components/PressableLink";
import { CarouselData } from "@/types/carouselData";

const carouselData: CarouselData[] = [
  {
    title: "Welcome to Rookies 👋",
    image: require("@/assets/images/onboarding/onboarding-image-1.png"),
    description:
      "Compete in weekly 1v1 matchups, build your lineup, and climb the ranked ladder!",
  },
  {
    title: "Create your team 🎽",
    image: require("@/assets/images/onboarding/onboarding-image-2.png"),
    description:
      "Pick a team name, choose a logo, and make your team uniquely yours!",
  },
  {
    title: "Choose your game mode ⚔️",
    image: require("@/assets/images/onboarding/onboarding-image-3.png"),
    description:
      "Pick a mode, queue up, and challenge opponents in daily matchups!",
  },
  {
    title: "Draft your team 💰",
    image: require("@/assets/images/onboarding/onboarding-image-4.png"),
    description:
      "Build your lineup within the salary cap  and make every pick count for every week!",
  },
  {
    title: "Power up your game 🚀",
    image: require("@/assets/images/onboarding/onboarding-image-5.png"),
    description:
      "Use special augments to boost your squad and outplay your opponent! Strategy is key!",
  },
  {
    title: "Climb the ranked ladder 🏆",
    image: require("@/assets/images/onboarding/onboarding-image-6.png"),
    description:
      "Compete in the daily matchups, win your games, and climb the ranks to the top!",
  },
];

const Onboarding = () => (
  <ImageBackground
    className="flex-1 bg-gray-950"
    resizeMode="cover"
    source={require("@/assets/images/onboarding/onboarding-background.png")}
  >
    <SafeAreaView className="flex-1 items-center justify-between">
      <StatusBar barStyle="light-content" />
      <Carousel data={carouselData} />
      <View className="flex w-full gap-4 px-8 pb-8">
        <Pressable className="rounded-lg bg-purple-600 p-3">
          <Text className="pbk-h7 text-center uppercase text-base-white">
            Create an Account
          </Text>
        </Pressable>
        <PressableLink
          className="self-center rounded-lg p-3"
          href="/login"
          label="I Already Have An Account"
        />
      </View>
    </SafeAreaView>
  </ImageBackground>
);

export default Onboarding;

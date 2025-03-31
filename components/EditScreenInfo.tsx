import { View, Text } from "react-native";

import { ExternalLink } from "./ExternalLink";
import { MonoText } from "./StyledText";

export default function EditScreenInfo({ path }: { path: string }) {
  return (
    <View>
      <View className="items-center mx-50">
        <Text className="text-pbk-bl leading-6 text-center">
          Open up the code for this screen:
        </Text>

        <View className="rounded-xl px-4 my-7">
          <MonoText>{path}</MonoText>
        </View>

        <Text className="text-pbk-bl leading-6 text-center">
          Change any of the text, save the file, and your app will automatically
          update.
        </Text>
      </View>

      <View className="mt-15 mx-20 items-center">
        <ExternalLink
          className="py-15"
          href="https://docs.expo.io/get-started/create-a-new-app/#opening-the-app-on-your-phonetablet"
        >
          <Text className="text-center">
            Tap here if your app doesn't automatically update after making
            changes
          </Text>
        </ExternalLink>
      </View>
    </View>
  );
}

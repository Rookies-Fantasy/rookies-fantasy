import { View, Text } from "react-native";

export default function EditScreenInfo({ path }: { path: string }) {
  return (
    <View>
      <View className="mx-50 items-center">
        <Text className="pbk-bl text-center leading-6 text-gray-950">
          Open up the code for this screen:
        </Text>

        <View className="my-7 rounded-xl px-4">
          <Text className="pbk-b1 text-gray-950">{path}</Text>
        </View>

        <Text className="pbk-bl text-center leading-6 text-gray-950">
          Change any of the text, save the file, and your app will automatically
          update.
        </Text>
      </View>

      <View className="mt-15 mx-20 items-center">
        <Text className="pbk-b1 text-center text-gray-950">
          Tap here if your app doesn't automatically update after making changes
        </Text>
      </View>
    </View>
  );
}

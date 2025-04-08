import { View, Text } from "react-native";
import Typography from "./Typography";

export default function EditScreenInfo({ path }: { path: string }) {
  return (
    <View>
      <View className="items-center mx-50">
        <Typography
          variant="bl"
          color="gray-950"
          className="leading-6 text-center"
        >
          Open up the code for this screen:
        </Typography>

        <View className="rounded-xl px-4 my-7">
          <Typography variant="b1">{path}</Typography>
        </View>

        <Typography
          variant="bl"
          color="gray-950"
          className="leading-6 text-center"
        >
          Change any of the text, save the file, and your app will automatically
          update.
        </Typography>
      </View>

      <View className="mt-15 mx-20 items-center">
        <Typography variant="b1" color="gray-950" className="text-center">
          Tap here if your app doesn't automatically update after making changes
        </Typography>
      </View>
    </View>
  );
}

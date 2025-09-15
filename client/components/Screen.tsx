import { ReactNode } from "react";
import { Keyboard, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ScreenProps = {
  children: ReactNode;
};

export default function Screen({ children }: ScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-gray-950">
      <Pressable
        android_ripple={{ color: "transparent" }}
        className="flex-1"
        onPress={Keyboard.dismiss}
      >
        {children}
      </Pressable>
    </SafeAreaView>
  );
}

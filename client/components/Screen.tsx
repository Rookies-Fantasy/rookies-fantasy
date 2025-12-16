import { ReactNode } from "react";
import { Keyboard, Pressable } from "react-native";
import { SafeAreaView, Edge } from "react-native-safe-area-context";

type ScreenProps = {
  children: ReactNode;
  edges?: Edge[];
};

export default function Screen({ children, edges }: ScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-gray-950" edges={edges}>
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

import { Question, X } from "phosphor-react-native";
import { ReactNode, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import Button from "./Button";

type HelpModalButtonProps = {
  children: ReactNode;
  title: string;
};

const HelpModalButton = ({ children, title }: HelpModalButtonProps) => {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Pressable
        className="size-8 items-center justify-center"
        onPress={() => setVisible(true)}
      >
        <Question color="#6336F5" size={20} weight="bold" />
      </Pressable>

      <Modal
        animationType="fade"
        onRequestClose={() => setVisible(false)}
        transparent
        visible={visible}
      >
        <View className="flex-1 items-center justify-center bg-black/70 px-6">
          <View className="w-full rounded-xl bg-gray-920 p-6">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="pbk-b1 text-left text-gray-300">{title}</Text>
              <Pressable
                className="size-8 items-center justify-center rounded-md border border-gray-900"
                onPress={() => setVisible(false)}
              >
                <X color="white" size={20} weight="bold" />
              </Pressable>
            </View>

            <View className="mb-4">{children}</View>

            <Button
              onPress={() => setVisible(false)}
              text="Got It"
              variant="secondary"
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

export default HelpModalButton;

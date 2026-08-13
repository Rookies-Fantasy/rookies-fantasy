import { X } from "phosphor-react-native";
import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import Button from "./Button";
import { cn } from "@/utils/jsUtils";

type DialogProps = {
  children: React.ReactNode;
  closeLabel?: string;
  dialogClassname?: string;
  onClose: () => void;
  title: string;
  visible: boolean;
};

const Dialog = ({
  children,
  closeLabel = "Got It",
  dialogClassname,
  onClose,
  title,
  visible,
}: DialogProps) => (
  <Modal
    animationType="fade"
    onRequestClose={onClose}
    transparent
    visible={visible}
  >
    <View className="flex-1 items-center justify-center bg-black/70 px-6">
      <View className={cn("rounded-xl bg-gray-920 p-6", dialogClassname)}>
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="pbk-b1 text-left text-gray-300">{title}</Text>
          <Pressable
            className="size-8 items-center justify-center rounded-md border border-gray-900"
            onPress={onClose}
          >
            <X color="white" size={20} weight="bold" />
          </Pressable>
        </View>
        <View className="mb-4">{children}</View>
        <Button label={closeLabel} onPress={onClose} variant="secondary" />
      </View>
    </View>
  </Modal>
);

export default Dialog;

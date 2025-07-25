import { Question } from "phosphor-react-native";
import { ReactNode, useState } from "react";
import { Pressable } from "react-native";
import Dialog from "./Dialog";

type HelpDialogButtonProps = {
  children: ReactNode;
  title: string;
};

const HelpDialogButton = ({ children, title }: HelpDialogButtonProps) => {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Pressable
        className="size-8 items-center justify-center"
        onPress={() => setVisible(true)}
      >
        <Question color="#6336F5" size={20} weight="bold" />
      </Pressable>

      <Dialog onClose={() => setVisible(false)} title={title} visible={visible}>
        {children}
      </Dialog>
    </>
  );
};

export default HelpDialogButton;

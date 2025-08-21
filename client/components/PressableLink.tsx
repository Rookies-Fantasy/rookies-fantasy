import { Href, Link } from "expo-router";
import { Pressable, PressableProps, Text } from "react-native";

type PressableLinkProps = PressableProps & {
  href: Href;
  label: string;
};

const PressableLink = ({ href, label, ...rest }: PressableLinkProps) => (
  <Link asChild href={href}>
    <Pressable {...rest}>
      <Text className="pbk-h7 text-center uppercase text-base-white">
        {label}
      </Text>
    </Pressable>
  </Link>
);

export { PressableLink };

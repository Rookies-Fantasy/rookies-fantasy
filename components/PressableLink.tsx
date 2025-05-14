import { Href, Link } from "expo-router";
import { forwardRef } from "react";
import { Pressable, PressableProps, Text, View } from "react-native";

type PressableLinkProps = PressableProps & {
  href: Href;
  label: string;
};

const PressableLink = forwardRef<View, PressableLinkProps>(
  ({ href, label, ...rest }: PressableLinkProps, ref) => {
    return (
      <Link asChild href={href}>
        <Pressable ref={ref} {...rest}>
          <Text className="pbk-h7 text-center uppercase text-base-white">
            {label}
          </Text>
        </Pressable>
      </Link>
    );
  },
);

PressableLink.displayName = "PressableLink";

export { PressableLink };

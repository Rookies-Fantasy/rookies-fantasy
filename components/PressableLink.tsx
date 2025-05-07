import { Href, Link } from "expo-router";
import { forwardRef, ReactNode } from "react";
import { Pressable, PressableProps } from "react-native";

type PressableLinkProps = PressableProps & {
  href: Href;
  label: ReactNode;
};

export const PressableLink = forwardRef<any, PressableLinkProps>(
  ({ href, label, ...rest }: PressableLinkProps, ref) => {
    return (
      <Link asChild href={href}>
        <Pressable ref={ref} {...rest}>
          {label}
        </Pressable>
      </Link>
    );
  },
);

PressableLink.displayName = "PressableLink";

import React, { ReactNode, useState } from "react";
import { View, Pressable } from "react-native";

type TabItem = {
  key: string;
  icon: (color: string) => ReactNode;
  content: ReactNode;
};

type TabsProps = {
  items: TabItem[];
  defaultKey?: string;
};

const Tabs = ({ items, defaultKey }: TabsProps) => {
  const [selected, setSelected] = useState(defaultKey ?? items[0].key);

  return (
    <View className="w-full flex-1">
      <View className="mt-2 w-full flex-row border-b border-gray-800">
        {items.map((item) => (
          <Pressable
            className={`flex-1 items-center py-2 ${
              selected === item.key ? "border-b-2 border-purple-600" : ""
            }`}
            key={item.key}
            onPress={() => setSelected(item.key)}
          >
            {item.icon(selected === item.key ? "#6336F5" : "#717680")}
          </Pressable>
        ))}
      </View>

      <View className="w-full flex-1">
        {items.find((i) => i.key === selected)?.content}
      </View>
    </View>
  );
};

export default Tabs;

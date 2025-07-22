import { View, Text } from "react-native";
import { useAppSelector } from "@/state/hooks";

type TeamBudgetProps = {
  className?: string;
};

const TeamBudget = ({ className }: TeamBudgetProps) => {
  const teamBalance = useAppSelector((state) => state.team.balance);

  return (
    <View
      className={`w-full rounded-lg border border-gray-800 bg-gray-900 ${className}`}
    >
      <Text className="pbk-h6 self-center p-4 text-base-white">
        <Text className="pbk-h6 text-green-600">
          ${teamBalance.toLocaleString()}
        </Text>
        {` / $100,000,000`}
      </Text>
      <View className="h-0.5 w-full bg-gray-800" />
    </View>
  );
};

export default TeamBudget;

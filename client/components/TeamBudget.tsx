import { View, Text } from "react-native";
import { useAppSelector } from "@/state/hooks";

type TeamBudgetProps = {
  className?: string;
};

const TeamBudget = ({ className }: TeamBudgetProps) => {
  const teamBalance = useAppSelector((state) => state.team.balance);

  return (
    <View
      className={`w-full gap-1 rounded-lg border border-gray-800 bg-gray-900 p-4 ${className}`}
    >
      <Text className="pbk-b1 self-center text-base-white">
        Available Balance
      </Text>
      <Text className="pbk-bl self-center text-base-white">
        <Text className="pbk-bl text-green-600">
          ${teamBalance.toLocaleString()}
        </Text>
        {` / $100,000,000`}
      </Text>
    </View>
  );
};

export default TeamBudget;

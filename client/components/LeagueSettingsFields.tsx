import { WarningCircle } from "phosphor-react-native";
import { Control, Controller, FieldErrors } from "react-hook-form";
import { Text, TextInput, View } from "react-native";
import StepperInput from "@/components/StepperInput";
import { cn } from "@/utils/jsUtils";
import {
  BUDGET_STEP,
  formatBudget,
  LeagueSettingsFormData,
  MAX_BUDGET,
  MAX_LEAGUE_NAME_LENGTH,
  MAX_TEAMS,
  MIN_BUDGET,
  MIN_TEAMS,
  TEAMS_STEP,
} from "@/utils/leagueUtils";

type LeagueSettingsFieldsProps<TForm extends LeagueSettingsFormData> = {
  control: Control<TForm>;
  errors: FieldErrors<LeagueSettingsFormData>;
  minTeams?: number;
  isBudgetLocked?: boolean;
};

// League name, team count and budget inputs, shared by the create and edit
// league screens. Generic so the create screen can pass its larger league +
// team form.
const LeagueSettingsFields = <TForm extends LeagueSettingsFormData>({
  control: formControl,
  errors,
  minTeams = MIN_TEAMS,
  isBudgetLocked = false,
}: LeagueSettingsFieldsProps<TForm>) => {
  // react-hook-form's Control is invariant in its form type, so a form that
  // only adds fields still can't be passed as Control<LeagueSettingsFormData>.
  // TForm is constrained to contain every field used here, so narrowing it
  // once at this boundary is safe.
  const control = formControl as unknown as Control<LeagueSettingsFormData>;

  return (
    <View className="flex-1 flex-col">
      <Controller
        control={control}
        name="leagueName"
        render={({ field: { onChange, value } }) => (
          <>
            <Text className="pbk-b2 mb-1.5 text-base-white">League Name</Text>
            <View
              className={cn(
                "mb-2 min-h-14 w-full flex-row items-center rounded-xl border px-2 py-2",
                errors.leagueName ? "border-red-600" : "border-gray-920",
              )}
            >
              <TextInput
                autoCapitalize="words"
                className="flex-1 text-base-white placeholder:pbk-b1"
                maxLength={MAX_LEAGUE_NAME_LENGTH}
                onChangeText={onChange}
                placeholder="Enter league name"
                placeholderTextColor="gray"
                value={value}
              />
              {errors.leagueName && (
                <WarningCircle color="#dc2626" size={20} weight="bold" />
              )}
            </View>
          </>
        )}
      />
      <View className="mb-4">
        {errors.leagueName ? (
          <Text className="pbk-b3 text-red-600">
            {errors.leagueName.message}
          </Text>
        ) : (
          <Text className="pbk-b3 text-gray-600">
            Choose a name of your league
          </Text>
        )}
      </View>

      <Controller
        control={control}
        name="numberOfTeams"
        render={({ field: { onChange, value } }) => (
          <>
            <Text className="pbk-b2 mb-1.5 text-base-white">
              Number of Teams
            </Text>
            <StepperInput
              max={MAX_TEAMS}
              min={minTeams}
              onChange={onChange}
              step={TEAMS_STEP}
              value={value}
            />
          </>
        )}
      />
      <View className="mb-4">
        {errors.numberOfTeams ? (
          <Text className="pbk-b3 text-red-600">
            {errors.numberOfTeams.message}
          </Text>
        ) : (
          <Text className="pbk-b3 text-gray-600">
            {minTeams > MIN_TEAMS
              ? `Can't go below the ${minTeams} spots already needed`
              : "Minimum teams required to start the league"}
          </Text>
        )}
      </View>

      <Controller
        control={control}
        name="budget"
        render={({ field: { onChange, value } }) => (
          <>
            <Text className="pbk-b2 mb-1.5 text-base-white">Team Budget</Text>
            {isBudgetLocked ? (
              <View className="mb-2 min-h-14 w-full justify-center rounded-xl border border-gray-920 px-4 py-2">
                <Text className="pbk-b1 text-gray-400">
                  {formatBudget(value)}
                </Text>
              </View>
            ) : (
              <StepperInput
                formatValue={formatBudget}
                max={MAX_BUDGET}
                min={MIN_BUDGET}
                onChange={onChange}
                step={BUDGET_STEP}
                value={value}
              />
            )}
          </>
        )}
      />
      <View className="mb-6">
        {errors.budget ? (
          <Text className="pbk-b3 text-red-600">{errors.budget.message}</Text>
        ) : (
          <Text className="pbk-b3 text-gray-600">
            {isBudgetLocked
              ? "Budget can't be changed after other teams have joined"
              : `Budget range: ${formatBudget(MIN_BUDGET)} - ${formatBudget(MAX_BUDGET)}`}
          </Text>
        )}
      </View>
    </View>
  );
};

export default LeagueSettingsFields;

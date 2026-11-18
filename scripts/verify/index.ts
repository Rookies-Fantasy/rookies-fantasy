import { run as cleanup } from "./commands/cleanup.js";
import { run as doctor } from "./commands/doctor.js";
import { run as drive, features } from "./commands/drive.js";
import { run as launch } from "./commands/launch.js";

const USAGE = `Usage: npm --prefix scripts run verify -- <command>

Commands:
  launch            Build Functions, start the emulators, seed the baseline
  doctor            Read-only check that the launched emulators are worth driving
  drive <feature>   Reseed the baseline, drive one feature, write evidence
  features          List the features drive knows
  cleanup           Stop the emulators launch started (evidence is kept)

See .claude/skills/verify-rookies-fantasy/SKILL.md.`;

const main = async (): Promise<number> => {
  const args = process.argv.slice(2);
  const command = args.length > 0 ? args[0] : "help";

  switch (command) {
    case "launch":
      return launch();
    case "doctor":
      return doctor();
    case "drive":
      return drive(args.length > 1 ? args[1] : "");
    case "features":
      return features();
    case "cleanup":
      return cleanup();
    default:
      console.log(USAGE);
      return command === "help" ? 0 : 1;
  }
};

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });

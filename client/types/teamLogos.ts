import { ImageSourcePropType } from "react-native";

export type TeamLogo = {
  url: string;
  source: ImageSourcePropType;
};

export const teamLogoOptions: TeamLogo[] = [
  {
    url: "../assets/images/team/1.png",
    source: require("../assets/images/placeholder-avatar.png"),
  },
  {
    url: "../assets/images/team/1.png",
    source: require("../assets/images/team/1.png"),
  },
  {
    url: "../assets/images/team/2.png",
    source: require("../assets/images/team/2.png"),
  },
  {
    url: "../assets/images/team/3.png",
    source: require("../assets/images/team/3.png"),
  },
  {
    url: "../assets/images/team/4.png",
    source: require("../assets/images/team/4.png"),
  },
  {
    url: "../assets/images/team/5.png",
    source: require("../assets/images/team/5.png"),
  },
  {
    url: "../assets/images/team/6.png",
    source: require("../assets/images/team/6.png"),
  },
  {
    url: "../assets/images/team/7.png",
    source: require("../assets/images/team/7.png"),
  },
  {
    url: "../assets/images/team/8.png",
    source: require("../assets/images/team/8.png"),
  },
];

export const defaultTeamLogo = teamLogoOptions[0];

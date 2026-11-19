module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo (SDK 54+) and nativewind/babel both add the
    // react-native-worklets plugin already, so it is not listed again here.
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      ["nativewind/babel"],
    ],
  };
};

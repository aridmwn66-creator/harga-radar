// Babel config for Expo SDK 57.
// babel-preset-expo already wires up expo-router and, when Reanimated 4 /
// react-native-worklets are installed, injects react-native-worklets/plugin
// automatically. So we intentionally do NOT add the worklets plugin by hand
// (doing so would register it twice and crash the bundler).
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};

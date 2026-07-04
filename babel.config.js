// Babel config for Expo SDK 54.
// babel-preset-expo already wires up expo-router and, when Reanimated 4 /
// react-native-worklets are installed, injects react-native-worklets/plugin
// automatically. So we intentionally do NOT add the worklets plugin by hand
// (doing so would register it twice and crash the bundler).
//
// stripImportMeta: Expo's web bundle is a classic <script> (not type="module"),
// so any `import.meta` left in the bundle is a hard parse error that blanks the
// whole site in every browser. zustand's middleware module (pulled in via
// `persist`) references `import.meta.env`, so we replace every `import.meta`
// with `({})` before it reaches the bundle. `import.meta.env` then reads as
// `undefined`, which its guards already handle. Harmless on native (Hermes has
// no import.meta either); the plugin runs before the preset.
function stripImportMeta() {
  return {
    name: 'strip-import-meta',
    visitor: {
      MetaProperty(path) {
        const { node } = path;
        if (
          node.meta &&
          node.meta.name === 'import' &&
          node.property &&
          node.property.name === 'meta'
        ) {
          path.replaceWithSourceString('({})');
        }
      },
    },
  };
}

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [stripImportMeta],
  };
};

// Default Expo Metro configuration.
// Kept explicit so it is easy to extend later (e.g. an SVG transformer or a
// custom resolver) without having to eject from the Expo defaults.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = config;

// Expo finds the pnpm workspace root and watches it, so emr-react src and emr-controller dist
// (run `pnpm build:controller` first) resolve through the workspace symlinks.
const { getDefaultConfig } = require('expo/metro-config');

module.exports = getDefaultConfig(__dirname);

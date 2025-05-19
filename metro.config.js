// metro.config.js
const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// 1. Que Metro acepte también módulos .cjs
config.resolver.sourceExts.push('cjs');

// 2. Desactiva la validación estricta de package.json exports
config.resolver.unstable_enablePackageExports = false;

module.exports = config;

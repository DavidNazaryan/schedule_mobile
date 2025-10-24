const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Exclude the project folder and nested schedule-app folder from Metro bundler
config.resolver.blockList = [
  /project\/.*/,
  /schedule-app\/schedule-app\/.*/,
];

module.exports = config;


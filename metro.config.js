const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Disable static rendering for web builds
config.web = {
  ...config.web,
  output: 'single'
};

// Resolver configuration to handle react-native-maps properly
config.resolver = {
  ...config.resolver,
  alias: {
    // Ensure proper resolution of react-native-web
    'react-native': 'react-native-web',
  },
  platforms: ['web', 'native', 'ios', 'android'],
};

module.exports = config;

module.exports = {
  dependencies: {
    // iOS-only packages — no Android native code, exclude from Android autolinking
    '@kingstinct/react-native-healthkit': {
      platforms: {
        android: null,
      },
    },
    '@react-native-healthkit/core': {
      platforms: {
        android: null,
      },
    },
  },
};

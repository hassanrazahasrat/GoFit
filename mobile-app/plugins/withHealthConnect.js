const { withAndroidManifest } = require('@expo/config-plugins');

const HEALTH_PERMISSIONS = [
  'android.permission.health.READ_STEPS',
  'android.permission.health.READ_WEIGHT',
  'android.permission.health.READ_EXERCISE',
];

const HEALTH_PACKAGES = [
  'com.google.android.apps.healthdata', // Health Connect (Android <14)
];

module.exports = function withHealthConnect(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    manifest['uses-permission'] = manifest['uses-permission'] || [];
    for (const name of HEALTH_PERMISSIONS) {
      if (!manifest['uses-permission'].some((p) => p.$['android:name'] === name)) {
        manifest['uses-permission'].push({ $: { 'android:name': name } });
      }
    }

    manifest.queries = manifest.queries || [];
    for (const pkg of HEALTH_PACKAGES) {
      if (!manifest.queries.some((q) => q.package?.some((p) => p.$['android:name'] === pkg))) {
        manifest.queries.push({ package: [{ $: { 'android:name': pkg } }] });
      }
    }

    return config;
  });
};

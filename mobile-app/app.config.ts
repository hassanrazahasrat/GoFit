// Minimal Node declarations — the Expo config loader runs this file as CJS,
// but the project has no @types/node.
declare const __dirname: string;
declare function require(name: string): any;

const fs = require('fs');
const path = require('path');

// app.json stays the source of truth; this config derives the Google Sign-In
// iOS URL scheme (the reversed iOS OAuth client ID) from constants/googleAuth.ts
// so the client ID only needs to be pasted in one place. The Expo config loader
// cannot import TS, so we read the constant's source text instead.
function readClientId(name: string): string {
  try {
    const src = fs.readFileSync(
      path.join(__dirname, 'constants', 'googleAuth.ts'),
      'utf8',
    );
    const m = src.match(new RegExp(`${name}\\s*=\\s*'([^']*)'`));
    return m ? m[1] : '';
  } catch {
    return '';
  }
}

const GOOGLE_IOS_CLIENT_ID = readClientId('GOOGLE_IOS_CLIENT_ID');

export default ({ config }: { config: any }) => {
  const iosUrlScheme = GOOGLE_IOS_CLIENT_ID
    ? GOOGLE_IOS_CLIENT_ID.split('.').reverse().join('.')
    : 'com.googleusercontent.apps.TODO_REVERSED_IOS_CLIENT_ID';

  config.plugins = (config.plugins || []).map((plugin: any) => {
    if (plugin === '@react-native-google-signin/google-signin') {
      return ['@react-native-google-signin/google-signin', { iosUrlScheme }];
    }
    if (
      Array.isArray(plugin) &&
      plugin[0] === '@react-native-google-signin/google-signin'
    ) {
      return [plugin[0], { ...(plugin[1] || {}), iosUrlScheme }];
    }
    return plugin;
  });

  return config;
};

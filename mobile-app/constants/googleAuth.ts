// Google OAuth client IDs for native sign-in.
// Create these in Google Cloud Console -> Credentials (same project as the
// Supabase Google provider), then paste the values below.
//
// GOOGLE_WEB_CLIENT_ID:    existing "Web application" client ID — also shown in
//                          Supabase Dashboard -> Authentication -> Providers -> Google.
// GOOGLE_IOS_CLIENT_ID:    "iOS" client ID for bundle com.gofitgym.
//                          Its reversed form (com.googleusercontent.apps.<id>)
//                          must also be set as iosUrlScheme in app.json.
// GOOGLE_ANDROID_READY:    Android needs an "Android" OAuth client with package
//                          com.gofitgym + the EAS SHA-1 fingerprint. The native
//                          SDK picks it up automatically once registered — no
//                          value needed here.

export const GOOGLE_WEB_CLIENT_ID = '810888713747-mqloh6md434vvprit1mgbknun62qdpha.apps.googleusercontent.com';
export const GOOGLE_IOS_CLIENT_ID = '810888713747-01lls586tc4gbqv0e4tkiv9g57a5kqqp.apps.googleusercontent.com';

export function googleAuthReady(os: string): boolean {
  if (!GOOGLE_WEB_CLIENT_ID) return false;
  return os === 'ios' ? GOOGLE_IOS_CLIENT_ID.length > 0 : true;
}

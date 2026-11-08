// Web / fallback stub — Metro resolves healthImpl.ios.ts / healthImpl.android.ts
// on native platforms, so this file only runs on web or unsupported targets.
export async function fetchHealthData(): Promise<any> {
  return null;
}

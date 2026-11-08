import Constants from 'expo-constants';

export interface HealthPayload {
  steps: Record<string, number>; // en-CA date -> step count
  weight?: { kg: number; date: string };
  workouts: { d: string; n: string; min: number; start: string }[];
}

// HealthKit/Health Connect are native modules — only in dev/production builds,
// never in Expo Go (which lacks the Nitro/TurboModule natives).
function isExpoGo() {
  return Constants.executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo';
}

export async function fetchHealthData(): Promise<HealthPayload | null> {
  if (isExpoGo()) return null;
  try {
    const impl = await import('./healthImpl');
    const data = await impl.fetchHealthData();
    if (!data) return null;
    const hasData =
      Object.keys(data.steps || {}).length > 0 || data.weight || (data.workouts || []).length > 0;
    return hasData ? data : null;
  } catch {
    return null;
  }
}

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// HealthKit/Health Connect are native modules — only available in dev/production
// builds, never in Expo Go (which lacks the Nitro/TurboModule natives).
function isExpoGo() {
  return Constants.executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo';
}

export interface HealthPayload {
  steps: Record<string, number>; // en-CA date -> step count
  weight?: { kg: number; date: string };
  workouts: { d: string; n: string; min: number; start: string }[];
}

const enCA = (d: Date) => d.toLocaleDateString('en-CA');

function last7Days(): { start: Date; end: Date; key: string }[] {
  const out: { start: Date; end: Date; key: string }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const e = new Date(s.getFullYear(), s.getMonth(), s.getDate() + 1);
    out.push({ start: s, end: e, key: enCA(s) });
  }
  return out;
}

async function fetchIOS(): Promise<HealthPayload> {
  const HK = await import('@kingstinct/react-native-healthkit');
  if (!(await HK.isHealthDataAvailableAsync())) return { steps: {}, workouts: [] };

  await HK.requestAuthorization({
    toRead: [
      'HKQuantityTypeIdentifierStepCount',
      'HKQuantityTypeIdentifierBodyMass',
      'HKWorkoutTypeIdentifier' as any,
    ],
  });

  const payload: HealthPayload = { steps: {}, workouts: [] };
  const now = new Date();

  for (const day of last7Days()) {
    try {
      const res = await HK.queryStatisticsForQuantity(
        'HKQuantityTypeIdentifierStepCount',
        ['cumulativeSum'],
        { filter: { date: { startDate: day.start, endDate: day.end } }, unit: 'count' },
      );
      const n = res?.sumQuantity?.quantity;
      if (n != null && n > 0) payload.steps[day.key] = Math.round(n);
    } catch {}
  }

  try {
    const monthAgo = new Date(now.getTime() - 30 * 86400000);
    const samples = await HK.queryQuantitySamples('HKQuantityTypeIdentifierBodyMass', {
      filter: { date: { startDate: monthAgo, endDate: now } },
      limit: 1,
      ascending: false,
      unit: 'kg',
    });
    const s = samples?.[0] as any;
    if (s?.quantity > 0) {
      payload.weight = { kg: Math.round(s.quantity * 100) / 100, date: enCA(new Date(s.endDate || s.startDate)) };
    }
  } catch {}

  try {
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const workouts = (await HK.queryWorkoutSamples({
      filter: { date: { startDate: weekAgo, endDate: now } },
      limit: 100,
    })) as any[];
    for (const w of workouts || []) {
      const start = new Date(w.startDate);
      const end = new Date(w.endDate || w.startDate);
      const min = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
      const n = String(w.workoutActivityType || w.activityType || 'Workout')
        .replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ');
      payload.workouts.push({ d: enCA(start), n, min, start: start.toISOString() });
    }
  } catch {}

  return payload;
}

const MASS_TO_KG: Record<string, number> = {
  kilograms: 1, grams: 0.001, milligrams: 0.000001, micrograms: 0.000000001, ounces: 0.0283495, pounds: 0.453592,
};

function hcDate(d: Date | string) { return enCA(new Date(d)); }

async function fetchAndroid(): Promise<HealthPayload> {
  const HC = await import('react-native-health-connect');
  const status = await HC.getSdkStatus();
  // SdkAvailabilityStatus: 1=SDK_UNAVAILABLE,2=SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED,3=SDK_AVAILABLE
  if (status !== 3) return { steps: {}, workouts: [] };
  await HC.initialize();

  const granted = await HC.requestPermission([
    { accessType: 'read', recordType: 'Steps' },
    { accessType: 'read', recordType: 'Weight' },
    { accessType: 'read', recordType: 'ExerciseSession' },
  ]);
  const has = (t: string) => granted?.some?.((p: any) => p.recordType === t);

  const payload: HealthPayload = { steps: {}, workouts: [] };
  const now = new Date();

  if (has('Steps')) {
    for (const day of last7Days()) {
      try {
        const res = await HC.readRecords('Steps', {
          timeRangeFilter: { operator: 'between', startTime: day.start.toISOString(), endTime: day.end.toISOString() },
          pageSize: 1000,
        });
        const total = (res?.records || []).reduce((a: number, r: any) => a + (r.count || 0), 0);
        if (total > 0) payload.steps[day.key] = Math.round(total);
      } catch {}
    }
  }

  if (has('Weight')) {
    try {
      const monthAgo = new Date(now.getTime() - 30 * 86400000);
      const res = await HC.readRecords('Weight', {
        timeRangeFilter: { operator: 'after', startTime: monthAgo.toISOString() },
        ascendingOrder: false,
        pageSize: 1,
      });
      const r: any = res?.records?.[0];
      if (r?.weight?.value > 0) {
        const kg = r.weight.value * (MASS_TO_KG[r.weight.unit] ?? 1);
        payload.weight = { kg: Math.round(kg * 100) / 100, date: hcDate(r.time) };
      }
    } catch {}
  }

  if (has('ExerciseSession')) {
    try {
      const weekAgo = new Date(now.getTime() - 7 * 86400000);
      const HCConsts = await import('react-native-health-connect');
      const typeName = (t: number) => {
        const map = (HCConsts as any).ExerciseType || {};
        for (const k of Object.keys(map)) if (map[k] === t) return k.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase());
        return 'Workout';
      };
      const res = await HC.readRecords('ExerciseSession', {
        timeRangeFilter: { operator: 'between', startTime: weekAgo.toISOString(), endTime: now.toISOString() },
        pageSize: 1000,
      });
      for (const r of (res?.records || []) as any[]) {
        const min = Math.max(1, Math.round((new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 60000));
        payload.workouts.push({ d: hcDate(r.startTime), n: typeName(r.exerciseType), min, start: r.startTime });
      }
    } catch {}
  }

  return payload;
}

export async function fetchHealthData(): Promise<HealthPayload | null> {
  if (isExpoGo()) return null;
  try {
    return Platform.OS === 'ios' ? await fetchIOS() : await fetchAndroid();
  } catch {
    return null;
  }
}

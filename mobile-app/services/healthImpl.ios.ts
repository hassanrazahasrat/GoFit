// iOS implementation — Apple HealthKit via @kingstinct/react-native-healthkit
export async function fetchHealthData() {
  const HK = await import('@kingstinct/react-native-healthkit');
  if (!(await HK.isHealthDataAvailableAsync())) return null;

  await HK.requestAuthorization({
    toRead: [
      'HKQuantityTypeIdentifierStepCount',
      'HKQuantityTypeIdentifierBodyMass',
      'HKWorkoutTypeIdentifier' as any,
    ],
  });

  const enCA = (d: Date) => d.toLocaleDateString('en-CA');
  const payload: any = { steps: {}, workouts: [] };
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const e = new Date(s.getFullYear(), s.getMonth(), s.getDate() + 1);
    try {
      const res = await HK.queryStatisticsForQuantity(
        'HKQuantityTypeIdentifierStepCount',
        ['cumulativeSum'],
        { filter: { date: { startDate: s, endDate: e } }, unit: 'count' },
      );
      const n = (res as any)?.sumQuantity?.quantity;
      if (n > 0) payload.steps[enCA(s)] = Math.round(n);
    } catch {}
  }

  try {
    const samples = await HK.queryQuantitySamples('HKQuantityTypeIdentifierBodyMass', {
      filter: { date: { startDate: new Date(now.getTime() - 30 * 86400000), endDate: now } },
      limit: 1,
      ascending: false,
      unit: 'kg',
    });
    const s: any = (samples as any)?.[0];
    if (s?.quantity > 0) {
      payload.weight = { kg: Math.round(s.quantity * 100) / 100, date: enCA(new Date(s.endDate || s.startDate)) };
    }
  } catch {}

  try {
    const workouts = (await HK.queryWorkoutSamples({
      filter: { date: { startDate: new Date(now.getTime() - 7 * 86400000), endDate: now } },
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

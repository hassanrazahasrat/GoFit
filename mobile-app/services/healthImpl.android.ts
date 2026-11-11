// Android implementation — Health Connect via react-native-health-connect
const MASS_TO_KG: Record<string, number> = {
  kilograms: 1, grams: 0.001, milligrams: 0.000001, micrograms: 0.000000001, ounces: 0.0283495, pounds: 0.453592,
};

export async function fetchHealthData() {
  const HC = await import('react-native-health-connect');
  const status = await HC.getSdkStatus();
  if (status !== 3) return null; // 3 = SDK_AVAILABLE
  await HC.initialize();

  const granted = await HC.requestPermission([
    { accessType: 'read', recordType: 'Steps' },
    { accessType: 'read', recordType: 'Weight' },
    { accessType: 'read', recordType: 'ExerciseSession' },
  ]);
  const has = (t: string) => granted?.some?.((p: any) => p.recordType === t);

  const enCA = (d: Date | string) => new Date(d).toLocaleDateString('en-CA');
  const payload: any = { steps: {}, workouts: [] };
  const now = new Date();

  if (has('Steps')) {
    for (let i = 6; i >= 0; i--) {
      const s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const e = new Date(s.getFullYear(), s.getMonth(), s.getDate() + 1);
      try {
        const res = await HC.readRecords('Steps', {
          timeRangeFilter: { operator: 'between', startTime: s.toISOString(), endTime: e.toISOString() },
          pageSize: 1000,
        });
        // Multiple apps (Samsung Health, Google Fit, etc.) can write the same
        // steps into Health Connect — summing all records double-counts.
        // Take the largest per-origin total instead.
        const byOrigin: Record<string, number> = {};
        for (const r of (res?.records || []) as any[]) {
          const origin = r?.metadata?.dataOrigin || r?.dataOrigin || 'unknown';
          byOrigin[origin] = (byOrigin[origin] || 0) + (r.count || 0);
        }
        const total = Math.max(0, ...Object.values(byOrigin));
        if (total > 0) {
          console.log('[gofit-health] steps', enCA(s), 'origins:', JSON.stringify(byOrigin));
          payload.steps[enCA(s)] = Math.round(total);
        }
      } catch {}
    }
  }

  if (has('Weight')) {
    try {
      const res = await HC.readRecords('Weight', {
        timeRangeFilter: { operator: 'after', startTime: new Date(now.getTime() - 30 * 86400000).toISOString() },
        ascendingOrder: false,
        pageSize: 1,
      });
      const r: any = res?.records?.[0];
      if (r?.weight?.value > 0) {
        payload.weight = {
          kg: Math.round(r.weight.value * (MASS_TO_KG[r.weight.unit] ?? 1) * 100) / 100,
          date: enCA(r.time),
        };
      }
    } catch {}
  }

  if (has('ExerciseSession')) {
    try {
      const typeName = (t: number) => {
        const map = (HC as any).ExerciseType || {};
        for (const k of Object.keys(map)) {
          if (map[k] === t) return k.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase());
        }
        return 'Workout';
      };
      const res = await HC.readRecords('ExerciseSession', {
        timeRangeFilter: {
          operator: 'between',
          startTime: new Date(now.getTime() - 7 * 86400000).toISOString(),
          endTime: now.toISOString(),
        },
        pageSize: 1000,
      });
      for (const r of (res?.records || []) as any[]) {
        const min = Math.max(1, Math.round((new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 60000));
        payload.workouts.push({ d: enCA(r.startTime), n: typeName(r.exerciseType), min, start: r.startTime });
      }
    } catch {}
  }

  return payload;
}

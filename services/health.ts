import {
  initialize,
  requestPermission,
  readRecords,
} from 'react-native-health-connect';

export async function initHealthConnect(): Promise<boolean> {
  try {
    const available = await initialize();
    return available;
  } catch {
    return false;
  }
}

export async function getCaloriesBurned(date?: Date): Promise<number> {
  try {
    const targetDate = date ?? new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    await requestPermission([{ accessType: 'read', recordType: 'ActiveCaloriesBurned' }]);

    const result = await readRecords('ActiveCaloriesBurned', {
      timeRangeFilter: {
        operator: 'between',
        startTime: startOfDay.toISOString(),
        endTime: endOfDay.toISOString(),
      },
    });

    return result.records.reduce(
      (sum: number, r) => sum + (r.energy?.inKilocalories ?? 0),
      0
    );
  } catch {
    return 0;
  }
}

export async function getSteps(date?: Date): Promise<number> {
  try {
    const targetDate = date ?? new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    await requestPermission([{ accessType: 'read', recordType: 'Steps' }]);

    const result = await readRecords('Steps', {
      timeRangeFilter: {
        operator: 'between',
        startTime: startOfDay.toISOString(),
        endTime: endOfDay.toISOString(),
      },
    });

    return result.records.reduce(
      (sum: number, r) => sum + (r.count ?? 0),
      0
    );
  } catch {
    return 0;
  }
}

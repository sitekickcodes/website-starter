import * as migration_20260529_225800_baseline from './20260529_225800_baseline';

export const migrations = [
  {
    up: migration_20260529_225800_baseline.up,
    down: migration_20260529_225800_baseline.down,
    name: '20260529_225800_baseline'
  },
];

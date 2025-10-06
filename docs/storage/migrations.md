# AsyncStorage Schema Migrations

## Overview

Schema migration system enables safe, incremental AsyncStorage schema updates across app versions while preserving user data.

## Architecture

### Components

**Migration Framework** (`src/storage/index.ts`)
- `checkSchemaVersion()` → Read current `appStateVersion`
- `runMigrations(currentVersion)` → Apply pending migrations sequentially
- `backupStorage(version)` → Snapshot all data to `backup_v{N}` key
- `rollbackMigration(version)` → Restore from backup on failure

**Migration Definitions** (`src/storage/migrations.ts`)
- Export `migrations: Migration[]` array
- Each migration: `{ version: number, up: async (context) => {...} }`
- Context provides `getItem<K>(key)` and `setItem<K>(key, value)` helpers

**Schema Version** (`src/storage/schema.ts`)
- `APP_STATE_VERSION` constant → Current schema version
- Increment when adding migration

### Execution Flow

```
App Launch
  ↓
initializeStorage()
  ↓
checkSchemaVersion()
  ↓
version < APP_STATE_VERSION?
  ↓ YES
runMigrations(currentVersion)
  → For each pending migration:
    1. backupStorage(previousVersion)
    2. migration.up(context)
    3. Update appStateVersion
    4. On error → rollbackMigration(previousVersion)
  ↓ NO
Continue app initialization
```

## Adding New Migration

### Step 1: Define Migration

Edit `src/storage/migrations.ts`:

```typescript
const migrationV3: Migration = {
  version: 3,
  up: async (context: MigrationContext) => {
    const scripts = await context.getItem('scripts');

    if (scripts && Array.isArray(scripts)) {
      const updatedScripts = scripts.map(script => ({
        ...script,
        isArchived: script.isArchived ?? false,
      }));

      await context.setItem('scripts', updatedScripts);
    }
  },
};

export const migrations: Migration[] = [migrationV2, migrationV3];
```

### Step 2: Update Schema Version

Edit `src/storage/schema.ts`:

```typescript
export const APP_STATE_VERSION = 3;
```

### Step 3: Update TypeScript Types

Edit `src/types/index.ts`:

```typescript
export interface Script {
  id: string;
  projectId: string;
  text: string;
  wordsCount: number;
  wpmTarget: number;
  createdAt: string;
  source: 'ai' | 'manual';
  isArchived: boolean; // NEW
}
```

### Step 4: Write Tests

Create `src/storage/__tests__/migrations.test.ts` test case:

```typescript
describe('Migration v3', () => {
  it('should add isArchived field to scripts', async () => {
    const mockScripts = [
      { id: '1', projectId: 'p1', text: 'Hello', wordsCount: 1, wpmTarget: 140, createdAt: '2025-01-01', source: 'manual' },
    ];

    let storedScripts: any = mockScripts;

    const mockContext: MigrationContext = {
      getItem: jest.fn().mockResolvedValue(mockScripts),
      setItem: jest.fn().mockImplementation(async (key, value) => {
        if (key === 'scripts') storedScripts = value;
      }),
    };

    const migrationV3 = migrations.find(m => m.version === 3);
    await migrationV3!.up(mockContext);

    expect(storedScripts[0].isArchived).toBe(false);
  });
});
```

## Migration Patterns

### Adding Field with Default Value

```typescript
const migrationVX: Migration = {
  version: X,
  up: async (context) => {
    const items = await context.getItem('items');

    if (items && Array.isArray(items)) {
      const updated = items.map(item => ({
        ...item,
        newField: item.newField ?? defaultValue,
      }));

      await context.setItem('items', updated);
    }
  },
};
```

### Renaming Field

```typescript
const migrationVX: Migration = {
  version: X,
  up: async (context) => {
    const items = await context.getItem('items');

    if (items && Array.isArray(items)) {
      const updated = items.map(({ oldName, ...rest }) => ({
        ...rest,
        newName: oldName,
      }));

      await context.setItem('items', updated);
    }
  },
};
```

### Data Transformation

```typescript
const migrationVX: Migration = {
  version: X,
  up: async (context) => {
    const items = await context.getItem('items');

    if (items && Array.isArray(items)) {
      const updated = items.map(item => ({
        ...item,
        status: item.isActive ? 'active' : 'inactive',
      }));

      await context.setItem('items', updated);
    }
  },
};
```

### Multiple Collections

```typescript
const migrationVX: Migration = {
  version: X,
  up: async (context) => {
    const projects = await context.getItem('projects');
    const scripts = await context.getItem('scripts');

    if (projects && Array.isArray(projects)) {
      await context.setItem('projects', projects.map(p => ({ ...p, newField: true })));
    }

    if (scripts && Array.isArray(scripts)) {
      await context.setItem('scripts', scripts.map(s => ({ ...s, newField: false })));
    }
  },
};
```

## Backup & Rollback

### Automatic Backup

Before each migration, all AsyncStorage data is backed up:

```typescript
backupKey = `backup_v${previousVersion}`
allData = AsyncStorage.getAllKeys() → multiGet()
AsyncStorage.setItem(backupKey, JSON.stringify(allData))
```

### Automatic Rollback

If migration throws error:

```typescript
catch (error) {
  backupData = AsyncStorage.getItem(`backup_v${previousVersion}`)
  AsyncStorage.clear()
  AsyncStorage.multiSet(JSON.parse(backupData))
  AsyncStorage.removeItem(`backup_v${previousVersion}`)
  throw StorageError
}
```

### Manual Rollback (Development)

```typescript
import { rollbackMigration } from './storage';

await rollbackMigration(2);
```

## Schema Version Rules

### Version Numbering

- Start: v1 (initial schema)
- Increment: Sequential integers (v2, v3, v4...)
- No skipping versions
- No version reuse

### Migration Order

Migrations execute in ascending version order:

```typescript
migrations.sort((a, b) => a.version - b.version);
```

Example: User on v1 upgrading to v4 runs migrations v2 → v3 → v4 sequentially.

### Backward Compatibility

**NO** backward compatibility (older app versions cannot read newer schemas). Users must update app to latest version.

## Testing Migrations

### Unit Tests

Test each migration independently:

```typescript
describe('Migration vX', () => {
  it('should transform data correctly', async () => {
    const mockContext = {
      getItem: jest.fn().mockResolvedValue(oldData),
      setItem: jest.fn(),
    };

    await migrationVX.up(mockContext);

    expect(mockContext.setItem).toHaveBeenCalledWith('key', expectedData);
  });

  it('should handle edge cases', async () => {
    // Test null, empty arrays, malformed data
  });
});
```

### Integration Tests

Test full migration sequence:

```typescript
describe('runMigrations', () => {
  it('should run multiple migrations (v1→v2→v3)', async () => {
    // Mock v1 storage state
    // Run runMigrations(1)
    // Verify v3 schema
  });
});
```

### Manual Testing (Development)

```bash
# Reset storage
AsyncStorage.clear()

# Set old schema version
AsyncStorage.setItem('appStateVersion', '1')

# Set old data format
AsyncStorage.setItem('projects', JSON.stringify([{ id: '1', name: 'Test' }]))

# Restart app → Migrations run automatically
```

## Error Handling

### Migration Failure

- Error thrown → Automatic rollback to previous version
- `appStateVersion` remains at previous version
- Error logged via `StorageError`
- User sees error UI → "Update failed, retrying..."

### Rollback Failure

- Critical error → Data corruption risk
- Log error details
- Show user "Contact support" message
- Preserve backup for manual recovery

### Partial Migration

Migrations run **transactionally** (all-or-nothing per version). If v3 migration fails, v2 migration is **not** rolled back (only v3 rollback occurs).

## Best Practices

### DO

- Test migrations on production-like data
- Handle null, empty arrays, malformed data
- Keep migrations idempotent (safe to run multiple times)
- Document breaking changes
- Add comprehensive unit tests
- Increment `APP_STATE_VERSION` with each migration

### DON'T

- Modify old migrations (create new migration instead)
- Skip version numbers
- Assume data structure (always validate)
- Perform async operations outside context helpers
- Delete migrations (needed for users upgrading from old versions)

## Example: Full Migration Workflow

**Scenario:** Add `archivedAt` field to Projects (v1 → v2)

**1. Define Migration**

```typescript
const migrationV2: Migration = {
  version: 2,
  up: async (context) => {
    const projects = await context.getItem('projects');

    if (projects && Array.isArray(projects)) {
      const updated = projects.map(p => ({
        ...p,
        archivedAt: p.archivedAt ?? null,
      }));

      await context.setItem('projects', updated);
    }
  },
};

export const migrations: Migration[] = [migrationV2];
```

**2. Update Schema**

```typescript
export const APP_STATE_VERSION = 2;
```

**3. Update Types**

```typescript
export interface Project {
  id: string;
  name: string;
  niche: string;
  subNiche: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  archivedAt: string | null;
}
```

**4. Write Tests**

```typescript
it('should add archivedAt field', async () => {
  const mockProjects = [{ id: '1', name: 'Test', ... }];
  const mockContext = {
    getItem: jest.fn().mockResolvedValue(mockProjects),
    setItem: jest.fn(),
  };

  await migrationV2.up(mockContext);

  expect(mockContext.setItem).toHaveBeenCalledWith('projects',
    expect.arrayContaining([
      expect.objectContaining({ archivedAt: null })
    ])
  );
});
```

**5. Deploy**

- User on v1 upgrades to v2
- `initializeStorage()` detects v1 < v2
- Runs `runMigrations(1)` → Applies migrationV2
- `appStateVersion` updated to 2
- User data migrated successfully

## Troubleshooting

### Migration Not Running

- Check `APP_STATE_VERSION` incremented
- Verify migration added to `migrations` array
- Confirm migration version > current storage version

### Data Loss After Migration

- Check backup exists (`backup_v{N}` key)
- Manually restore via `rollbackMigration(N)`
- Review migration logic for destructive operations

### App Crashes on Launch

- Migration error likely → Check logs
- Backup corrupted → Manual data recovery needed
- Test migrations thoroughly before production release

## Future Enhancements

- Migration dry-run mode (preview changes without applying)
- Migration progress reporting (for long-running migrations)
- Migration analytics (track success/failure rates)
- Cloud backup integration (backup to remote storage)

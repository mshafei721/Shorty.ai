import { StorageSchema } from './schema';
import { Project } from '../types';

export interface MigrationContext {
  getItem: <K extends keyof StorageSchema>(key: K) => Promise<StorageSchema[K] | null>;
  setItem: <K extends keyof StorageSchema>(key: K, value: StorageSchema[K]) => Promise<void>;
}

export interface Migration {
  version: number;
  up: (context: MigrationContext) => Promise<void>;
}

const migrationV2: Migration = {
  version: 2,
  up: async (context: MigrationContext) => {
    const projects = await context.getItem('projects');

    if (projects && Array.isArray(projects)) {
      const updatedProjects = projects.map((project: Project) => ({
        ...project,
        isDeleted: project.isDeleted ?? false,
      }));

      await context.setItem('projects', updatedProjects);
    }
  },
};

export const migrations: Migration[] = [migrationV2];

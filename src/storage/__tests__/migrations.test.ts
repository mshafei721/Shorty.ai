import { migrations } from '../migrations';
import { MigrationContext } from '../migrations';
import { Project } from '../../types';

describe('Migrations', () => {
  describe('Migration v2', () => {
    it('should add isDeleted field to projects', async () => {
      const mockProjects: Partial<Project>[] = [
        {
          id: '1',
          name: 'Project 1',
          niche: 'Tech',
          subNiche: 'AI',
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        },
        {
          id: '2',
          name: 'Project 2',
          niche: 'Business',
          subNiche: 'Marketing',
          createdAt: '2025-01-02',
          updatedAt: '2025-01-02',
        },
      ];

      let storedProjects: any = mockProjects;

      const mockContext: MigrationContext = {
        getItem: jest.fn().mockResolvedValue(mockProjects),
        setItem: jest.fn().mockImplementation(async (key, value) => {
          if (key === 'projects') {
            storedProjects = value;
          }
        }),
      };

      const migrationV2 = migrations.find(m => m.version === 2);
      expect(migrationV2).toBeDefined();

      await migrationV2!.up(mockContext);

      expect(mockContext.getItem).toHaveBeenCalledWith('projects');
      expect(mockContext.setItem).toHaveBeenCalledWith('projects', expect.any(Array));

      const updatedProjects = storedProjects as Project[];
      expect(updatedProjects[0].isDeleted).toBe(false);
      expect(updatedProjects[1].isDeleted).toBe(false);
    });

    it('should preserve existing isDeleted values', async () => {
      const mockProjects: Project[] = [
        {
          id: '1',
          name: 'Project 1',
          niche: 'Tech',
          subNiche: 'AI',
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
          isDeleted: true,
        },
        {
          id: '2',
          name: 'Project 2',
          niche: 'Business',
          subNiche: 'Marketing',
          createdAt: '2025-01-02',
          updatedAt: '2025-01-02',
          isDeleted: false,
        },
      ];

      let storedProjects: any = mockProjects;

      const mockContext: MigrationContext = {
        getItem: jest.fn().mockResolvedValue(mockProjects),
        setItem: jest.fn().mockImplementation(async (key, value) => {
          if (key === 'projects') {
            storedProjects = value;
          }
        }),
      };

      const migrationV2 = migrations.find(m => m.version === 2);
      await migrationV2!.up(mockContext);

      const updatedProjects = storedProjects as Project[];
      expect(updatedProjects[0].isDeleted).toBe(true);
      expect(updatedProjects[1].isDeleted).toBe(false);
    });

    it('should handle empty projects array', async () => {
      const mockContext: MigrationContext = {
        getItem: jest.fn().mockResolvedValue([]),
        setItem: jest.fn(),
      };

      const migrationV2 = migrations.find(m => m.version === 2);
      await migrationV2!.up(mockContext);

      expect(mockContext.setItem).toHaveBeenCalledWith('projects', []);
    });

    it('should handle null projects', async () => {
      const mockContext: MigrationContext = {
        getItem: jest.fn().mockResolvedValue(null),
        setItem: jest.fn(),
      };

      const migrationV2 = migrations.find(m => m.version === 2);
      await migrationV2!.up(mockContext);

      expect(mockContext.setItem).not.toHaveBeenCalled();
    });

    it('should handle non-array projects', async () => {
      const mockContext: MigrationContext = {
        getItem: jest.fn().mockResolvedValue('invalid data'),
        setItem: jest.fn(),
      };

      const migrationV2 = migrations.find(m => m.version === 2);
      await migrationV2!.up(mockContext);

      expect(mockContext.setItem).not.toHaveBeenCalled();
    });
  });

  describe('migrations array', () => {
    it('should contain migration v2', () => {
      const migrationV2 = migrations.find(m => m.version === 2);
      expect(migrationV2).toBeDefined();
      expect(migrationV2?.version).toBe(2);
      expect(typeof migrationV2?.up).toBe('function');
    });

    it('should have migrations sorted by version', () => {
      const versions = migrations.map(m => m.version);
      const sortedVersions = [...versions].sort((a, b) => a - b);
      expect(versions).toEqual(sortedVersions);
    });
  });
});

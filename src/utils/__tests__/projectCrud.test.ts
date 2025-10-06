import { getStorageItem, setStorageItem } from '../../storage';
import {
  generateUUID,
  createProject,
  getActiveProjects,
  updateProject,
  deleteProject,
  getUserProfile,
} from '../projectCrud';
import type { Project, UserProfile } from '../../types';

jest.mock('../../storage');

describe('projectCrud', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateUUID', () => {
    it('should generate a valid UUID', () => {
      const uuid = generateUUID();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });

    it('should generate unique UUIDs', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe('createProject', () => {
    it('should create a new project with correct properties', async () => {
      (getStorageItem as jest.Mock).mockResolvedValue([]);
      (setStorageItem as jest.Mock).mockResolvedValue(undefined);

      const project = await createProject('Test Project', 'Healthcare', 'Physiotherapy');

      expect(project).toMatchObject({
        name: 'Test Project',
        niche: 'Healthcare',
        subNiche: 'Physiotherapy',
        isDeleted: false,
      });
      expect(project.id).toBeDefined();
      expect(project.createdAt).toBeDefined();
      expect(project.updatedAt).toBeDefined();
      expect(project.createdAt).toBe(project.updatedAt);
    });

    it('should add project to existing projects', async () => {
      const existingProjects: Project[] = [
        {
          id: '1',
          name: 'Existing',
          niche: 'Finance',
          subNiche: 'Investing',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
          isDeleted: false,
        },
      ];

      (getStorageItem as jest.Mock).mockResolvedValue(existingProjects);
      (setStorageItem as jest.Mock).mockResolvedValue(undefined);

      await createProject('New Project', 'Technology', 'AI/ML');

      expect(setStorageItem).toHaveBeenCalledWith(
        'projects',
        expect.arrayContaining([
          existingProjects[0],
          expect.objectContaining({ name: 'New Project' }),
        ])
      );
    });

    it('should handle null projects array', async () => {
      (getStorageItem as jest.Mock).mockResolvedValue(null);
      (setStorageItem as jest.Mock).mockResolvedValue(undefined);

      const project = await createProject('First Project', 'Fitness', 'Yoga');

      expect(project.name).toBe('First Project');
      expect(setStorageItem).toHaveBeenCalledWith(
        'projects',
        expect.arrayContaining([expect.objectContaining({ name: 'First Project' })])
      );
    });
  });

  describe('getActiveProjects', () => {
    it('should return only non-deleted projects sorted by updatedAt DESC', async () => {
      const projects: Project[] = [
        {
          id: '1',
          name: 'Project 1',
          niche: 'Healthcare',
          subNiche: 'Physiotherapy',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
          isDeleted: false,
        },
        {
          id: '2',
          name: 'Project 2',
          niche: 'Finance',
          subNiche: 'Investing',
          createdAt: '2025-01-02T00:00:00.000Z',
          updatedAt: '2025-01-03T00:00:00.000Z',
          isDeleted: false,
        },
        {
          id: '3',
          name: 'Deleted Project',
          niche: 'Technology',
          subNiche: 'AI/ML',
          createdAt: '2025-01-03T00:00:00.000Z',
          updatedAt: '2025-01-04T00:00:00.000Z',
          isDeleted: true,
        },
      ];

      (getStorageItem as jest.Mock).mockResolvedValue(projects);

      const activeProjects = await getActiveProjects();

      expect(activeProjects).toHaveLength(2);
      expect(activeProjects[0].id).toBe('2');
      expect(activeProjects[1].id).toBe('1');
      expect(activeProjects.every(p => !p.isDeleted)).toBe(true);
    });

    it('should return empty array when no projects exist', async () => {
      (getStorageItem as jest.Mock).mockResolvedValue(null);

      const activeProjects = await getActiveProjects();

      expect(activeProjects).toEqual([]);
    });

    it('should return empty array when all projects are deleted', async () => {
      const projects: Project[] = [
        {
          id: '1',
          name: 'Deleted Project',
          niche: 'Healthcare',
          subNiche: 'Physiotherapy',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
          isDeleted: true,
        },
      ];

      (getStorageItem as jest.Mock).mockResolvedValue(projects);

      const activeProjects = await getActiveProjects();

      expect(activeProjects).toEqual([]);
    });
  });

  describe('updateProject', () => {
    it('should update project and set new updatedAt timestamp', async () => {
      const projects: Project[] = [
        {
          id: '1',
          name: 'Original Name',
          niche: 'Healthcare',
          subNiche: 'Physiotherapy',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
          isDeleted: false,
        },
      ];

      (getStorageItem as jest.Mock).mockResolvedValue(projects);
      (setStorageItem as jest.Mock).mockResolvedValue(undefined);

      const updatedProject = await updateProject('1', { name: 'Updated Name' });

      expect(updatedProject).not.toBeNull();
      expect(updatedProject?.name).toBe('Updated Name');
      expect(updatedProject?.niche).toBe('Healthcare');
      expect(updatedProject?.updatedAt).not.toBe('2025-01-01T00:00:00.000Z');
    });

    it('should return null when project not found', async () => {
      (getStorageItem as jest.Mock).mockResolvedValue([]);

      const result = await updateProject('non-existent', { name: 'New Name' });

      expect(result).toBeNull();
      expect(setStorageItem).not.toHaveBeenCalled();
    });

    it('should update multiple fields', async () => {
      const projects: Project[] = [
        {
          id: '1',
          name: 'Original',
          niche: 'Healthcare',
          subNiche: 'Physiotherapy',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
          isDeleted: false,
        },
      ];

      (getStorageItem as jest.Mock).mockResolvedValue(projects);
      (setStorageItem as jest.Mock).mockResolvedValue(undefined);

      const updatedProject = await updateProject('1', {
        name: 'Updated',
        niche: 'Finance',
        subNiche: 'Investing',
      });

      expect(updatedProject).toMatchObject({
        name: 'Updated',
        niche: 'Finance',
        subNiche: 'Investing',
      });
    });
  });

  describe('deleteProject', () => {
    it('should soft delete project by setting isDeleted to true', async () => {
      const projects: Project[] = [
        {
          id: '1',
          name: 'To Delete',
          niche: 'Healthcare',
          subNiche: 'Physiotherapy',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
          isDeleted: false,
        },
      ];

      (getStorageItem as jest.Mock).mockResolvedValue(projects);
      (setStorageItem as jest.Mock).mockResolvedValue(undefined);

      const result = await deleteProject('1');

      expect(result).toBe(true);
      expect(setStorageItem).toHaveBeenCalledWith(
        'projects',
        expect.arrayContaining([
          expect.objectContaining({
            id: '1',
            isDeleted: true,
          }),
        ])
      );
    });

    it('should return false when project not found', async () => {
      (getStorageItem as jest.Mock).mockResolvedValue([]);

      const result = await deleteProject('non-existent');

      expect(result).toBe(false);
      expect(setStorageItem).not.toHaveBeenCalled();
    });

    it('should update updatedAt timestamp when deleting', async () => {
      const projects: Project[] = [
        {
          id: '1',
          name: 'To Delete',
          niche: 'Healthcare',
          subNiche: 'Physiotherapy',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
          isDeleted: false,
        },
      ];

      (getStorageItem as jest.Mock).mockResolvedValue(projects);
      (setStorageItem as jest.Mock).mockResolvedValue(undefined);

      await deleteProject('1');

      const savedProjects = (setStorageItem as jest.Mock).mock.calls[0][1];
      expect(savedProjects[0].updatedAt).not.toBe('2025-01-01T00:00:00.000Z');
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile from storage', async () => {
      const userProfile: UserProfile = {
        niche: 'Healthcare',
        subNiche: 'Physiotherapy',
        onboardedAt: '2025-01-01T00:00:00.000Z',
      };

      (getStorageItem as jest.Mock).mockResolvedValue(userProfile);

      const result = await getUserProfile();

      expect(result).toEqual(userProfile);
      expect(getStorageItem).toHaveBeenCalledWith('userProfile');
    });

    it('should return null when no user profile exists', async () => {
      (getStorageItem as jest.Mock).mockResolvedValue(null);

      const result = await getUserProfile();

      expect(result).toBeNull();
    });
  });
});

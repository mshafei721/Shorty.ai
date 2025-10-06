import { getStorageItem, setStorageItem } from '../storage';
import type { Project, UserProfile } from '../types';

export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const createProject = async (
  name: string,
  niche: string,
  subNiche: string
): Promise<Project> => {
  const now = new Date().toISOString();
  const newProject: Project = {
    id: generateUUID(),
    name,
    niche,
    subNiche,
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
  };

  const projects = await getStorageItem('projects') || [];
  projects.push(newProject);
  await setStorageItem('projects', projects);

  return newProject;
};

export const getActiveProjects = async (): Promise<Project[]> => {
  const projects = await getStorageItem('projects') || [];
  return projects
    .filter(p => !p.isDeleted)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
};

export const updateProject = async (
  projectId: string,
  updates: { name?: string; niche?: string; subNiche?: string }
): Promise<Project | null> => {
  const projects = await getStorageItem('projects') || [];
  const projectIndex = projects.findIndex(p => p.id === projectId);

  if (projectIndex === -1) {
    return null;
  }

  const updatedProject = {
    ...projects[projectIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  projects[projectIndex] = updatedProject;
  await setStorageItem('projects', projects);

  return updatedProject;
};

export const deleteProject = async (projectId: string): Promise<boolean> => {
  const projects = await getStorageItem('projects') || [];
  const projectIndex = projects.findIndex(p => p.id === projectId);

  if (projectIndex === -1) {
    return false;
  }

  projects[projectIndex] = {
    ...projects[projectIndex],
    isDeleted: true,
    updatedAt: new Date().toISOString(),
  };

  await setStorageItem('projects', projects);
  return true;
};

export const getUserProfile = async (): Promise<UserProfile | null> => {
  return await getStorageItem('userProfile');
};

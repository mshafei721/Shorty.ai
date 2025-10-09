/**
 * Unit Tests: ProjectsListScreen
 *
 * Tests for the Projects List screen navigation and interactions.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProjectsListScreen from '../ProjectsListScreen';
import type { Project } from '../../storage/schema';

// Mock dependencies
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('ProjectsListScreen', () => {
  const mockProjects: Project[] = [
    {
      id: 'project_1',
      name: 'Test Project 1',
      niche: 'Tech',
      subNiche: 'AI',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      isDeleted: false,
    },
    {
      id: 'project_2',
      name: 'Test Project 2',
      niche: 'Marketing',
      subNiche: 'Social Media',
      createdAt: '2025-01-02T00:00:00.000Z',
      updatedAt: '2025-01-02T00:00:00.000Z',
      isDeleted: false,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Project List Rendering', () => {
    it('should render projects from AsyncStorage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === 'projects') {
          return Promise.resolve(JSON.stringify(mockProjects));
        }
        return Promise.resolve(null);
      });

      const { getByText } = render(<ProjectsListScreen />);

      await waitFor(() => {
        expect(getByText('Test Project 1')).toBeTruthy();
        expect(getByText('Test Project 2')).toBeTruthy();
      });
    });

    it('should filter out deleted projects', async () => {
      const projectsWithDeleted = [
        ...mockProjects,
        {
          id: 'project_deleted',
          name: 'Deleted Project',
          niche: 'Test',
          subNiche: '',
          createdAt: '2025-01-03T00:00:00.000Z',
          updatedAt: '2025-01-03T00:00:00.000Z',
          isDeleted: true,
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === 'projects') {
          return Promise.resolve(JSON.stringify(projectsWithDeleted));
        }
        return Promise.resolve(null);
      });

      const { queryByText } = render(<ProjectsListScreen />);

      await waitFor(() => {
        expect(queryByText('Deleted Project')).toBeNull();
      });
    });

    it('should show empty state when no projects exist', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const { getByText } = render(<ProjectsListScreen />);

      await waitFor(() => {
        expect(getByText(/no projects yet/i)).toBeTruthy();
      });
    });
  });

  describe('Project Navigation', () => {
    it('should navigate to ProjectDashboard when project card is pressed', async () => {
      const mockNavigate = jest.fn();
      jest.spyOn(require('@react-navigation/native'), 'useNavigation').mockReturnValue({
        navigate: mockNavigate,
      });

      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === 'projects') {
          return Promise.resolve(JSON.stringify(mockProjects));
        }
        return Promise.resolve(null);
      });

      const { getByText } = render(<ProjectsListScreen />);

      await waitFor(() => {
        expect(getByText('Test Project 1')).toBeTruthy();
      });

      const projectCard = getByText('Test Project 1');
      fireEvent.press(projectCard.parent!);

      expect(mockNavigate).toHaveBeenCalledWith('ProjectDashboard', {
        projectId: 'project_1',
      });
    });

    it('should pass correct projectId when navigating', async () => {
      const mockNavigate = jest.fn();
      jest.spyOn(require('@react-navigation/native'), 'useNavigation').mockReturnValue({
        navigate: mockNavigate,
      });

      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === 'projects') {
          return Promise.resolve(JSON.stringify(mockProjects));
        }
        return Promise.resolve(null);
      });

      const { getByText } = render(<ProjectsListScreen />);

      await waitFor(() => {
        expect(getByText('Test Project 2')).toBeTruthy();
      });

      const projectCard = getByText('Test Project 2');
      fireEvent.press(projectCard.parent!);

      expect(mockNavigate).toHaveBeenCalledWith('ProjectDashboard', {
        projectId: 'project_2',
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper testID on project cards', async () => {
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === 'projects') {
          return Promise.resolve(JSON.stringify(mockProjects));
        }
        return Promise.resolve(null);
      });

      const { getAllByTestId } = render(<ProjectsListScreen />);

      await waitFor(() => {
        const projectCards = getAllByTestId('project-card');
        expect(projectCards).toHaveLength(2);
      });
    });

    it('should have accessible labels on project cards', async () => {
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === 'projects') {
          return Promise.resolve(JSON.stringify(mockProjects));
        }
        return Promise.resolve(null);
      });

      const { getAllByTestId } = render(<ProjectsListScreen />);

      await waitFor(() => {
        const projectCards = getAllByTestId('project-card');
        expect(projectCards[0]).toHaveProperty('props.accessibilityLabel');
        expect(projectCards[0].props.accessibilityLabel).toContain('Test Project 1');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle AsyncStorage errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      const { getByText } = render(<ProjectsListScreen />);

      await waitFor(() => {
        expect(getByText(/no projects yet/i)).toBeTruthy();
        expect(consoleError).toHaveBeenCalledWith('Failed to load projects:', expect.any(Error));
      });

      consoleError.mockRestore();
    });
  });
});

import { useState, useCallback, useRef } from 'react';
import { User, CreateUserRequest } from '../types/User';
import { apiService } from '../services/apiService';

interface UserState {
  users: User[];
  loading: boolean;
  error: string | null;
  editingUser: User | null;
  operationLoading: boolean;
}

interface NotificationMethods {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
}

interface UseUserManagerWithNotificationsReturn {
  state: UserState;
  actions: {
    fetchUsers: () => Promise<void>;
    createUser: (userData: CreateUserRequest) => Promise<void>;
    updateUser: (userData: CreateUserRequest) => Promise<void>;
    deleteUser: (uuid: string) => Promise<void>;
    setEditingUser: (user: User | null) => void;
    clearError: () => void;
    refreshUser: (uuid: string) => Promise<void>;
  };
}

export const useUserManagerWithNotifications = (
  notifications?: NotificationMethods
): UseUserManagerWithNotificationsReturn => {
  const [state, setState] = useState<UserState>({
    users: [],
    loading: false,
    error: null,
    editingUser: null,
    operationLoading: false,
  });

  // Track pending operations to prevent race conditions
  const pendingOperations = useRef<Set<string>>(new Set());
  
  // Track optimistic updates for rollback capability
  const optimisticUpdates = useRef<Map<string, User[]>>(new Map());

  const updateState = useCallback((updates: Partial<UserState>) => {
    setState(current => ({ ...current, ...updates }));
  }, []);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const setEditingUser = useCallback((user: User | null) => {
    updateState({ editingUser: user });
  }, [updateState]);

  // Fetch all users
  const fetchUsers = useCallback(async () => {
    const operationId = 'fetch-users';
    
    if (pendingOperations.current.has(operationId)) {
      return; // Prevent duplicate requests
    }
    
    pendingOperations.current.add(operationId);
    updateState({ loading: true, error: null });

    try {
      const users = await apiService.getUsers();
      updateState({ 
        users, 
        loading: false,
        error: null 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch users';
      updateState({ 
        loading: false, 
        error: errorMessage 
      });
      notifications?.showError(errorMessage);
    } finally {
      pendingOperations.current.delete(operationId);
    }
  }, [updateState, notifications]);

  // Create user with optimistic updates
  const createUser = useCallback(async (userData: CreateUserRequest) => {
    const operationId = `create-${Date.now()}`;
    
    if (pendingOperations.current.has(operationId)) {
      return;
    }

    pendingOperations.current.add(operationId);
    updateState({ operationLoading: true, error: null });

    // Optimistic update - create temporary user
    const optimisticUser: User = {
      ...userData,
      uuid: `temp-${Date.now()}`,
    };

    setState(current => {
      const newUsers = [...current.users, optimisticUser];
      optimisticUpdates.current.set(operationId, current.users); // Store for rollback
      return { 
        ...current, 
        users: newUsers,
        operationLoading: false 
      };
    });

    notifications?.showInfo(`Creating user ${userData.name}...`);

    try {
      const newUser = await apiService.createUser(userData);
      
      // Replace optimistic user with real user
      setState(current => ({
        ...current,
        users: current.users.map(user => 
          user.uuid === optimisticUser.uuid ? newUser : user
        ),
        error: null
      }));

      notifications?.showSuccess(`User ${newUser.name} created successfully!`);
      optimisticUpdates.current.delete(operationId);
    } catch (error) {
      // Rollback optimistic update
      const originalUsers = optimisticUpdates.current.get(operationId);
      if (originalUsers) {
        updateState({ users: originalUsers });
        optimisticUpdates.current.delete(operationId);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
      updateState({ error: errorMessage });
      notifications?.showError(`Failed to create user: ${errorMessage}`);
    } finally {
      pendingOperations.current.delete(operationId);
      updateState({ operationLoading: false });
    }
  }, [updateState, notifications]);

  // Update user with optimistic updates
  const updateUser = useCallback(async (userData: CreateUserRequest) => {
    if (!state.editingUser) return;
    
    const operationId = `update-${state.editingUser.uuid}`;
    
    if (pendingOperations.current.has(operationId)) {
      return;
    }

    pendingOperations.current.add(operationId);
    updateState({ operationLoading: true, error: null });

    // Optimistic update
    const updatedUser: User = {
      ...state.editingUser,
      ...userData,
    };

    setState(current => {
      const newUsers = current.users.map(user =>
        user.uuid === state.editingUser?.uuid ? updatedUser : user
      );
      optimisticUpdates.current.set(operationId, current.users); // Store for rollback
      return { 
        ...current, 
        users: newUsers,
        editingUser: null,
        operationLoading: false 
      };
    });

    notifications?.showInfo(`Updating user ${userData.name}...`);

    try {
      const result = await apiService.updateUser(state.editingUser.uuid, userData);
      
      // Update with server response
      setState(current => ({
        ...current,
        users: current.users.map(user =>
          user.uuid === state.editingUser?.uuid ? result : user
        ),
        error: null
      }));

      notifications?.showSuccess(`User ${result.name} updated successfully!`);
      optimisticUpdates.current.delete(operationId);
    } catch (error) {
      // Rollback optimistic update
      const originalUsers = optimisticUpdates.current.get(operationId);
      if (originalUsers) {
        updateState({ 
          users: originalUsers,
          editingUser: state.editingUser // Restore editing user
        });
        optimisticUpdates.current.delete(operationId);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user';
      updateState({ error: errorMessage });
      notifications?.showError(`Failed to update user: ${errorMessage}`);
    } finally {
      pendingOperations.current.delete(operationId);
      updateState({ operationLoading: false });
    }
  }, [state.editingUser, updateState, notifications]);

  // Delete user with optimistic updates
  const deleteUser = useCallback(async (uuid: string) => {
    const operationId = `delete-${uuid}`;
    
    if (pendingOperations.current.has(operationId)) {
      return;
    }

    pendingOperations.current.add(operationId);
    updateState({ operationLoading: true, error: null });

    // Find user for feedback
    const userToDelete = state.users.find(user => user.uuid === uuid);
    const userName = userToDelete?.name || 'User';

    // Optimistic update - remove user immediately
    setState(current => {
      const newUsers = current.users.filter(user => user.uuid !== uuid);
      optimisticUpdates.current.set(operationId, current.users); // Store for rollback
      return { 
        ...current, 
        users: newUsers,
        operationLoading: false 
      };
    });

    notifications?.showInfo(`Deleting ${userName}...`);

    try {
      await apiService.deleteUser(uuid);
      notifications?.showSuccess(`${userName} deleted successfully!`);
      optimisticUpdates.current.delete(operationId);
    } catch (error) {
      // Rollback optimistic update
      const originalUsers = optimisticUpdates.current.get(operationId);
      if (originalUsers) {
        updateState({ users: originalUsers });
        optimisticUpdates.current.delete(operationId);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
      updateState({ error: errorMessage });
      notifications?.showError(`Failed to delete ${userName}: ${errorMessage}`);
    } finally {
      pendingOperations.current.delete(operationId);
      updateState({ operationLoading: false });
    }
  }, [state.users, updateState, notifications]);

  // Refresh individual user data
  const refreshUser = useCallback(async (uuid: string) => {
    const operationId = `refresh-${uuid}`;
    
    if (pendingOperations.current.has(operationId)) {
      return;
    }

    pendingOperations.current.add(operationId);

    try {
      // You need to implement or use an appropriate method to fetch a single user by uuid.
      const users = await apiService.getUsers();
      const updatedUser = users.find(user => user.uuid === uuid);
      if (!updatedUser) throw new Error('User not found');
      setState(current => ({
        ...current,
        users: current.users.map(user =>
          user.uuid === uuid ? updatedUser : user
        ),
        error: null
      }));
      notifications?.showSuccess(`${updatedUser.name} data refreshed`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh user';
      updateState({ error: errorMessage });
      notifications?.showError(`Failed to refresh user: ${errorMessage}`);
    } finally {
      pendingOperations.current.delete(operationId);
    }
  }, [updateState, notifications]);

  return {
    state,
    actions: {
      fetchUsers,
      createUser,
      updateUser,
      deleteUser,
      setEditingUser,
      clearError,
      refreshUser,
    },
  };
};

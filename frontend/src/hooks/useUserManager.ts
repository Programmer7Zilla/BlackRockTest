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

interface UseUserManagerReturn {
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

export const useUserManager = (): UseUserManagerReturn => {
  const [state, setState] = useState<UserState>({
    users: [],
    loading: false,
    error: null,
    editingUser: null,
    operationLoading: false,
  });

  // Keep track of pending operations to prevent race conditions
  const pendingOperations = useRef(new Set<string>());

  const updateState = useCallback((updates: Partial<UserState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const setError = useCallback((error: string | null) => {
    updateState({ error });
  }, [updateState]);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  const fetchUsers = useCallback(async () => {
    try {
      updateState({ loading: true, error: null });
      const fetchedUsers = await apiService.getUsers();
      updateState({ users: fetchedUsers });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
      setError(errorMessage);
      console.error('Error fetching users:', err);
    } finally {
      updateState({ loading: false });
    }
  }, [updateState, setError]);

  const createUser = useCallback(async (userData: CreateUserRequest) => {
    const operationId = `create-${Date.now()}`;
    pendingOperations.current.add(operationId);

    try {
      updateState({ operationLoading: true, error: null });

      // Optimistic update - add temporary user
      const tempUser: User = {
        uuid: `temp-${Date.now()}`,
        ...userData,
      };

      updateState({ 
        users: [...state.users, tempUser]
      });

      // Make API call
      const newUser = await apiService.createUser(userData);

      // Replace temporary user with real user from API
      updateState({
        users: state.users.map(user => 
          user.uuid === tempUser.uuid ? newUser : user
        )
      });

    } catch (err) {
      // Revert optimistic update on error
      updateState({
        users: state.users.filter(user => !user.uuid.startsWith('temp-'))
      });
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user';
      setError(errorMessage);
      throw err;
    } finally {
      pendingOperations.current.delete(operationId);
      updateState({ operationLoading: false });
    }
  }, [state.users, updateState, setError]);

  const updateUser = useCallback(async (userData: CreateUserRequest) => {
    if (!state.editingUser) return;

    const operationId = `update-${state.editingUser.uuid}`;
    pendingOperations.current.add(operationId);

    // Store original user for rollback
    const originalUser = state.editingUser;

    try {
      updateState({ operationLoading: true, error: null });

      // Optimistic update
      const optimisticUser: User = {
        ...originalUser,
        ...userData,
      };

      updateState({
        users: state.users.map(user =>
          user.uuid === originalUser.uuid ? optimisticUser : user
        )
      });

      // Make API call
      const updatedUser = await apiService.updateUser(originalUser.uuid, userData);

      // Update with real data from API
      updateState({
        users: state.users.map(user =>
          user.uuid === originalUser.uuid ? updatedUser : user
        ),
        editingUser: null
      });

    } catch (err) {
      // Revert optimistic update on error
      updateState({
        users: state.users.map(user =>
          user.uuid === originalUser.uuid ? originalUser : user
        )
      });
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user';
      setError(errorMessage);
      throw err;
    } finally {
      pendingOperations.current.delete(operationId);
      updateState({ operationLoading: false });
    }
  }, [state.editingUser, state.users, updateState, setError]);

  const deleteUser = useCallback(async (uuid: string) => {
    const operationId = `delete-${uuid}`;
    pendingOperations.current.add(operationId);

    // Store user for rollback
    const userToDelete = state.users.find(user => user.uuid === uuid);
    if (!userToDelete) return;

    try {
      updateState({ operationLoading: true, error: null });

      // Optimistic update - remove user immediately
      updateState({
        users: state.users.filter(user => user.uuid !== uuid)
      });

      // Make API call
      await apiService.deleteUser(uuid);

      // If we reach here, the deletion was successful
      // The optimistic update is already in place

    } catch (err) {
      // Revert optimistic update on error - add user back
      updateState({
        users: [...state.users, userToDelete].sort((a, b) => a.name.localeCompare(b.name))
      });
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user';
      setError(errorMessage);
      console.error('Error deleting user:', err);
    } finally {
      pendingOperations.current.delete(operationId);
      updateState({ operationLoading: false });
    }
  }, [state.users, updateState, setError]);

  const setEditingUser = useCallback((user: User | null) => {
    updateState({ editingUser: user, error: null });
  }, [updateState]);

  const refreshUser = useCallback(async (uuid: string) => {
    try {
      // This would require an additional API endpoint to fetch a single user
      // For now, we'll refresh all users
      await fetchUsers();
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  }, [fetchUsers]);

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

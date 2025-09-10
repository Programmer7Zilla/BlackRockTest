import React, { createContext, useContext, ReactNode } from 'react';
import { useUserManager } from '../hooks/useUserManager';
import { useNotifications, NotificationSystem } from '../components/NotificationSystem';
import { User, CreateUserRequest } from '../types/User';

interface UserContextType {
  // State
  users: User[];
  loading: boolean;
  error: string | null;
  editingUser: User | null;
  operationLoading: boolean;
  
  // Actions
  fetchUsers: () => Promise<void>;
  createUser: (userData: CreateUserRequest) => Promise<void>;
  updateUser: (userData: CreateUserRequest) => Promise<void>;
  deleteUser: (uuid: string) => Promise<void>;
  setEditingUser: (user: User | null) => void;
  clearError: () => void;
  refreshUser: (uuid: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const { state, actions } = useUserManager();
  const notifications = useNotifications();
  
  const contextValue: UserContextType = {
    // State
    users: state.users,
    loading: state.loading,
    error: state.error,
    editingUser: state.editingUser,
    operationLoading: state.operationLoading,
    
    // Actions
    ...actions,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
      <NotificationSystem
        notifications={notifications.notifications}
        onDismiss={notifications.removeNotification}
      />
    </UserContext.Provider>
  );
};

export const useUserContext = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};

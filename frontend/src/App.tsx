import React, { useEffect } from 'react';
import UserTable from './components/UserTable';
import UserForm from './components/UserForm';
import { CreateUserRequest } from './types/User';
import { useUserManager } from './hooks/useUserManager';
import './App.css';

const App: React.FC = () => {
  const { state, actions } = useUserManager();
  const { users, loading, error, editingUser, operationLoading } = state;
  const { 
    fetchUsers, 
    createUser, 
    updateUser, 
    deleteUser, 
    setEditingUser, 
    clearError 
  } = actions;

  // Initial data fetch
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSubmitForm = async (userData: CreateUserRequest) => {
    if (editingUser) {
      await updateUser(userData);
    } else {
      await createUser(userData);
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Dynamic User Data Management</h1>
        <p>Manage user information with real-time updates</p>
      </header>

      {error && (
        <div className="error-banner">
          <span>Error: {error}</span>
          <button onClick={clearError}>×</button>
        </div>
      )}

      <main className="app-main">
        <UserTable
          users={users}
          onEditUser={setEditingUser}
          onDeleteUser={deleteUser}
          loading={loading || operationLoading}
        />
        
        <UserForm
          onSubmit={handleSubmitForm}
          editingUser={editingUser}
          onCancel={handleCancelEdit}
          loading={loading || operationLoading}
        />
      </main>

      <footer className="app-footer">
      </footer>
    </div>
  );
};

export default App;

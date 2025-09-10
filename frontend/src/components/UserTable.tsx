import React from 'react';
import { User } from '../types/User';
import './UserTable.css';

interface UserTableProps {
  users: User[];
  onEditUser: (user: User) => void;
  onDeleteUser: (uuid: string) => void;
  loading: boolean;
}

const UserTable: React.FC<UserTableProps> = ({ 
  users, 
  onEditUser, 
  onDeleteUser, 
  loading 
}) => {
  const handleDelete = (uuid: string, name: string, surname: string) => {
    if (window.confirm(`Are you sure you want to delete ${name} ${surname}?`)) {
      onDeleteUser(uuid);
    }
  };

  if (loading) {
    return (
      <div className="table-container">
        <h2>Users Table</h2>
        <div className="loading">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <h2>Users Table</h2>
      {users.length === 0 ? (
        <div className="no-data">No users found</div>
      ) : (
        <table className="users-table">
          <thead>
            <tr>
              <th>UUID</th>
              <th>Name</th>
              <th>Surname</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.uuid}>
                <td className="uuid-cell" title={`Full UUID: ${user.uuid}`}>
                  <span className="uuid-short">{user.uuid.substring(0, 8)}...</span>
                  <span className="uuid-full">{user.uuid}</span>
                </td>
                <td>{user.name}</td>
                <td>{user.surname}</td>
                <td>{user.email}</td>
                <td className="actions-cell">
                  <button 
                    className="edit-btn"
                    onClick={() => onEditUser(user)}
                    title="Edit user"
                  >
                    Edit
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDelete(user.uuid, user.name, user.surname)}
                    title="Delete user"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UserTable;

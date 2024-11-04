import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminSettings = () => {
  const [users, setUsers] = useState([]);

  // Fetch all users from the backend
  useEffect(() => {
    axios.get('/api/admin/users')
      .then((response) => {
        setUsers(response.data);
      })
      .catch((error) => {
        console.error('Error fetching users:', error);
      });
  }, []);

  // Handle toggling the candidate status
  const handleCandidateToggle = (userId, isCandidate) => {
    axios.post('/api/admin/update_candidate', { userId, isCandidate })
      .then(() => {
        // Update the local state to reflect the candidate status
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId ? { ...user, is_candidate: !isCandidate } : user
          )
        );
      })
      .catch((error) => {
        console.error('Error updating candidate status:', error);
      });
  };

  return (
    <div>
      <h1>Admin Settings: Manage Candidates</h1>
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Is Candidate</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>
                <input
                  type="checkbox"
                  checked={user.is_candidate}
                  onChange={() => handleCandidateToggle(user.id, user.is_candidate)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminSettings;

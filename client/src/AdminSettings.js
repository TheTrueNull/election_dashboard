import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminSettings = () => {
  const [candidates, setCandidates] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState('Instant Runoff'); // Default to Instant Runoff
  const [firstName, setFirstName] = useState(''); // First Name Input
  const [lastName, setLastName] = useState(''); // Last Name Input
  const navigate = useNavigate();

  // Fetch all candidates from the backend
  useEffect(() => {
    axios.get('/api/admin/candidates')
      .then((response) => {
        setCandidates(response.data);
      })
      .catch((error) => {
        console.error('Error fetching candidates:', error);
      });
  }, []);

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('token');
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = '/signin.html'; // Redirect to sign-in
  };

  // Handle checkbox change for Active status
  const handleCheckboxChange = (candidateId) => {
    setCandidates((prevCandidates) =>
      prevCandidates.map((candidate) =>
        candidate.id === candidateId ? { ...candidate, is_active: !candidate.is_active } : candidate
      )
    );
  };

  // Handle dropdown selection change
  const handleMethodChange = (event) => {
    setSelectedMethod(event.target.value);
  };

  // Submit updated active statuses to the backend
  const handleSubmit = () => {
    const updatedStatuses = candidates.map(candidate => ({
      id: candidate.id,
      is_active: candidate.is_active
    }));

    axios.post('/api/admin/update_candidates', { updatedStatuses })
      .then(() => {
        alert(`Candidate statuses updated successfully! Selected method: ${selectedMethod}`);
      })
      .catch((error) => {
        console.error('Error updating candidate statuses:', error);
        alert("There was an error updating candidate statuses.");
      });
  };

  // Handle adding a new candidate
  const handleAddCandidate = () => {
    if (!firstName.trim() || !lastName.trim()) {
      alert("Please enter both first and last name.");
      return;
    }

    const newCandidate = {
      name: `${firstName} ${lastName}`,
      is_active: true
    };

    axios.post('/api/admin/add_candidate', newCandidate)
      .then(() => {
        setFirstName('');
        setLastName('');
        return axios.get('/api/admin/candidates'); // Refresh the candidate list
      })
      .then((response) => {
        setCandidates(response.data);
      })
      .catch((error) => {
        console.error('Error adding candidate:', error);
        alert("There was an error adding the candidate.");
      });
  };

  // Handle navigation back to the dashboard
  const handleBackToDashboard = () => {
    navigate('/');
  };

  return (
    <div>
      <h1>Admin Settings: Manage Candidate Status</h1>

      {/* Add Candidate Section */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <button onClick={handleAddCandidate} style={{ padding: '5px 10px', fontSize: '16px' }}>
          Add Candidate
        </button>
      </div>

      {/* Logout Button */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        display: 'flex',
        gap: '10px',
      }}>
        <button onClick={handleLogout} style={{ padding: '10px 20px', fontSize: '16px' }}>
          Logout
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Candidate Name</th>
            <th>Active</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((candidate) => (
            <tr key={candidate.id}>
              <td>{candidate.name}</td>
              <td>
                <input
                  type="checkbox"
                  checked={candidate.is_active}
                  onChange={() => handleCheckboxChange(candidate.id)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Dropdown menu */}
      <div style={{ marginTop: '20px', marginBottom: '20px' }}>
        <label htmlFor="voting-method" style={{ fontSize: '16px', marginRight: '10px' }}>
          Select Voting Method:
        </label>
        <select
          id="voting-method"
          value={selectedMethod}
          onChange={handleMethodChange}
          style={{ padding: '5px 10px', fontSize: '16px' }}
        >
          <option value="Instant Runoff">Instant Runoff</option>
          <option value="Ranked Pairs">Ranked Pairs</option>
        </select>
      </div>

      {/* Submit and Back to Dashboard Buttons */}
      <div>
        <button onClick={handleSubmit} style={{ padding: '10px 20px', fontSize: '16px', marginRight: '10px' }}>
          Submit
        </button>
        <button onClick={handleBackToDashboard} style={{ padding: '10px 20px', fontSize: '16px' }}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default AdminSettings;

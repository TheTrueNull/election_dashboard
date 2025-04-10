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
    <div style={{ maxWidth: '800pc', margin: 'auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px'}}>Admin Settings: Manage Candidate</h1>

      {/* Add Candidate Section */}
      <div style={{
        backgroundColor: '#f9f9f9',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{ marginBottom: '10px' }}>Add Candidate</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            style={{ 
              flex: 1,
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ccc',
              fontSize: '16px'
            }}
          />
        <input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          style={{ 
            flex: 1,
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid #ccc',
            fontSize: '16px'
          }}
        />
        <button 
        onClick={handleAddCandidate} 
        style={{ 
          backgroundColor: '#28a745',
          color: 'white',
          border: 'none',
          padding: '10px 15px',
          borderRadius: '5px',
          cursor:'pointer',
          fontSize: '16px' 
          }}>
          Add Candidate
        </button>
      </div>
    </div>

      {/* Back to Dashboard Button */}
      <div style={{
        textAlign: 'right',
        marginBottom: '20px',
      }}>
        <button onClick={handleBackToDashboard} 
        style={{ 
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '16px'
          }}>
          Back to Dashboard
        </button>
      </div>

      {/* Candidates Table */}
      <div style={{
        backgroundColor: '#fff',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.1)'
      }}>
        <h2>Manage Candidate Status</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ backgroundColor: '#007bff', color: 'white' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>Candidate Name</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Active</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((candidate, index) => (
              <tr key={candidate.id} style={{ backgroundColor: index % 2 === 0 ? '#f2f2f2' : '#fff' }}>
                <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{candidate.name}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
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
      </div>

      {/* Dropdown menu */}
      <div style={{ 
        marginTop: '20px',
        backgroundColor: '#f9f9f9',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.1)'
        }}>
        <label htmlFor="voting-method" style={{ fontSize: '16px', marginRight: '10px' }}>
          Select Voting Method:
        </label>
        <select
          id="voting-method"
          value={selectedMethod}
          onChange={handleMethodChange}
          style={{ 
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid #ccc',
            fontSize: '16px' 
          }}
        >
          <option value="Instant Runoff">Instant Runoff</option>
          <option value="Ranked Pairs">Ranked Pairs</option>
        </select>
      </div>

      {/* Submit and Logout Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
        <button 
        onClick={handleSubmit} 
        style={{ 
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '16px'
          }}>
          Submit
        </button>

        <button 
          onClick={handleLogout} 
          style={{ 
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            padding: '10px 20px', 
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px' 
            }}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default AdminSettings;

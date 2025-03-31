import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminSettings = () => {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidates, setSelectedCandidates] = useState([]); // Selected candidates for deletion
  const [editingCandidate, setEditingCandidate] = useState(null); // Candidate being edited
  const [editedName, setEditedName] = useState(""); // Edited name input
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const navigate = useNavigate();

  // Fetch all candidates from the backend
  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = () => {
    axios.get('/api/admin/candidates')
      .then((response) => {
        setCandidates(response.data);
      })
      .catch((error) => {
        console.error('Error fetching candidates:', error);
      });
  };

  // Handle checkbox selection for deletion
  const handleCheckboxChange = (candidateId) => {
    setSelectedCandidates((prevSelected) =>
      prevSelected.includes(candidateId)
        ? prevSelected.filter((id) => id !== candidateId) 
        : [...prevSelected, candidateId]
    );
  };

  // Handle Active/Inactive Toggle
  const handleToggleActiveStatus = (candidateId) => {
    setCandidates((prevCandidates) =>
      prevCandidates.map((candidate) =>
        candidate.id === candidateId ? { ...candidate, is_active: !candidate.is_active } : candidate
      )
    );
  };

  // Submit updated active statuses to the backend
  const handleSubmit = () => {
    const updatedStatuses = candidates.map(candidate => ({
      id: candidate.id,
      is_active: candidate.is_active
    }));

    axios.post('/api/admin/update_candidates', { updatedStatuses })
      .then(() => {
        alert("Candidate statuses updated successfully!");
        fetchCandidates();
      })
      .catch((error) => {
        console.error('Error updating candidate statuses:', error);
        alert("There was an error updating candidate statuses.");
      });
  };

  // Handle Add Candidate
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
        fetchCandidates();
      })
      .catch((error) => {
        console.error('Error adding candidate:', error);
        alert("There was an error adding the candidate.");
      });
  };

  // Handle Delete Candidates
  const handleDeleteCandidates = () => {
    if (selectedCandidates.length === 0) {
      alert("Please select candidates to delete.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete the selected candidates?")) {
      return;
    }

    axios.post('/api/admin/delete_candidates', { candidate_ids: selectedCandidates })
      .then(() => {
        alert("Candidates deleted successfully!");
        setSelectedCandidates([]);
        fetchCandidates();
      })
      .catch((error) => {
        console.error('Error deleting candidates:', error);
        alert("There was an error deleting the candidates.");
      });
  };

  // Handle Edit Candidate Name
  const handleEditCandidate = (candidate) => {
    setEditingCandidate(candidate.id);
    setEditedName(candidate.name);
  };

  const handleSaveEdit = (candidateId) => {
    axios.post('/api/admin/edit_candidate', 
      { id: candidateId, name: editedName },
      { withCredentials: true } // Ensure credentials are sent
    )
    .then(() => {
      setEditingCandidate(null);
      fetchCandidates(); // Refresh list after successful update
    })
    .catch((error) => {
      console.error('Error editing candidate:', error.response ? error.response.data : error);
      alert("There was an error editing the candidate name.");
    });
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

      {/* Logout Button */}
      <div style={{
        textAlign: 'right',
        marginBottom: '20px',
      }}>
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

      {/* Submit and Back to Dashboard Buttons */}
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
    </div>
  );
};

export default AdminSettings;

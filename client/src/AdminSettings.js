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
    <div>
      <h1>Admin Settings: Manage Candidates</h1>

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

      {/* Candidate List with Selection, Edit & Toggle */}
      <table>
        <thead>
          <tr>
            <th>Select</th>
            <th>Candidate Name</th>
            <th>Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((candidate) => (
            <tr key={candidate.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedCandidates.includes(candidate.id)}
                  onChange={() => handleCheckboxChange(candidate.id)}
                />
              </td>
              <td>
                {editingCandidate === candidate.id ? (
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                  />
                ) : (
                  candidate.name
                )}
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={candidate.is_active}
                  onChange={() => handleToggleActiveStatus(candidate.id)}
                />
              </td>
              <td>
                {editingCandidate === candidate.id ? (
                  <button onClick={() => handleSaveEdit(candidate.id)}>Save</button>
                ) : (
                  <button onClick={() => handleEditCandidate(candidate)}>Edit</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Update & Delete Buttons */}
      <button 
        onClick={handleSubmit} 
        style={{ padding: '10px 20px', fontSize: '16px', marginTop: '10px', backgroundColor: 'green', color: 'white' }}
      >
        Update Status
      </button>

      <button 
        onClick={handleDeleteCandidates} 
        style={{ padding: '10px 20px', fontSize: '16px', marginTop: '10px', marginLeft: '10px', backgroundColor: 'red', color: 'white' }}
      >
        Delete Selected Candidates
      </button>

      {/* Navigation Button */}
      <button 
        onClick={() => navigate('/')} 
        style={{ padding: '10px 20px', fontSize: '16px', marginLeft: '10px' }}
      >
        Back to Dashboard
      </button>
    </div>
  );
};

export default AdminSettings;

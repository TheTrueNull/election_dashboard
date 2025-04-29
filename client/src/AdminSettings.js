import React, { useState, useEffect, useContext } from 'react'; // 🔥 New: Import useContext
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { DarkModeContext } from './DarkModeContext'; // 🔥 New: Import DarkModeContext

const AdminSettings = () => {
  const [candidates, setCandidates] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState('Instant Runoff');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const { darkMode, toggleDarkMode } = useContext(DarkModeContext); // 🔥 Use context instead of local darkMode useState

  const navigate = useNavigate();

  // Fetch candidates when the page loads
  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = () => {
    axios.get('/api/admin/candidates')
      .then((response) => {
        const withFlags = response.data.map(c => ({ ...c, isEditing: false, editName: c.name }));
        setCandidates(withFlags);
      })
      .catch((error) => {
        console.error('Error fetching candidates:', error);
      });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = '/signin.html';
  };

  const handleCheckboxChange = (candidateId) => {
    setCandidates(prev =>
      prev.map(candidate =>
        candidate.id === candidateId
          ? { ...candidate, is_active: !candidate.is_active }
          : candidate
      )
    );
  };

  const handleMethodChange = (event) => {
    setSelectedMethod(event.target.value);
  };

  const handleSubmit = () => {
    const updatedStatuses = candidates.map(candidate => ({
      id: candidate.id,
      is_active: candidate.is_active
    }));

    localStorage.setItem('votingMethod', selectedMethod);

    axios.post('/api/admin/update_candidates', { updatedStatuses })
      .then(() => {
        alert(`Candidate statuses updated! Method: ${selectedMethod}`);
      })
      .catch((error) => {
        console.error('Error updating statuses:', error);
        alert("Error updating candidate statuses.");
      });
  };

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
        alert("Error adding the candidate.");
      });
  };

  const toggleEdit = (id) => {
    setCandidates(prev =>
      prev.map(c =>
        c.id === id
          ? { ...c, isEditing: !c.isEditing, editName: c.name }
          : { ...c, isEditing: false }
      )
    );
  };

  const handleEditChange = (id, value) => {
    setCandidates(prev =>
      prev.map(c =>
        c.id === id ? { ...c, editName: value } : c
      )
    );
  };

  const saveEdit = (id) => {
    const candidate = candidates.find(c => c.id === id);
    if (!candidate.editName.trim()) {
      alert("Name cannot be empty.");
      return;
    }

    axios.post('/api/admin/edit_candidate', { id, name: candidate.editName })
      .then(() => {
        fetchCandidates();
      })
      .catch((error) => {
        console.error('Error editing candidate:', error);
        alert("Error updating the candidate.");
      });
  };

  const deleteCandidate = (id) => {
    if (!window.confirm("Delete this candidate?")) return;

    axios.post('/api/admin/delete_candidates', { candidate_ids: [id] })
      .then(() => {
        fetchCandidates();
      })
      .catch((error) => {
        console.error('Error deleting candidate:', error);
        alert("Error deleting the candidate.");
      });
  };

  const handleBackToDashboard = () => {
    navigate('/');
  };

  return (
    <div style={{
      backgroundColor: darkMode ? '#2e2e2e' : '#fff',
      color: darkMode ? '#eaeaea' : '#000',
      minHeight: '100vh',
      width: '100%',
      margin: 'auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      transition: 'background-color 0.3s ease, color 0.3s ease'
    }}>
      
      {/* 🔥 Global Dark Mode Toggle */}
      <button
        onClick={toggleDarkMode}
        style={{
          marginBottom: '20px',
          padding: '10px 20px',
          backgroundColor: darkMode ? '#444' : '#eee',
          color: darkMode ? '#fff' : '#000',
          border: '1px solid #888',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        {darkMode ? 'Light Mode' : 'Dark Mode'}
      </button>

      {/* Admin Settings Title */}
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Admin Settings: Manage Candidates</h1>

      {/* Add Candidate Section */}
      <div style={{
        backgroundColor: darkMode ? '#3a3a3a' : '#f9f9f9',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: darkMode ? '0px 2px 5px rgba(255, 255, 255, 0.1)' : '0px 2px 5px rgba(0, 0, 0, 0.1)'
      }}>
        <h2>Add Candidate</h2>
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
              cursor: 'pointer',
              fontSize: '16px'
            }}>
            Add
          </button>
        </div>
      </div>

      {/* Back to Dashboard Button */}
      <div style={{ textAlign: 'right', marginBottom: '20px' }}>
        <button
          onClick={handleBackToDashboard}
          style={{
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Back to Dashboard
        </button>
      </div>

      {/* Manage Candidate Table */}
      <div style={{
        backgroundColor: darkMode ? '#3a3a3a' : '#fff',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: darkMode ? '0px 2px 5px rgba(255, 255, 255, 0.1)' : '0px 2px 5px rgba(0, 0, 0, 0.1)'
      }}>
        <h2>Manage Candidate Status</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ backgroundColor: '#007bff', color: 'white' }}>
              <th style={{ padding: '10px' }}>Candidate Name</th>
              <th style={{ padding: '10px' }}>Active</th>
              <th style={{ padding: '10px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c, index) => (
              <tr key={c.id} style={{ backgroundColor: index % 2 === 0 ? (darkMode ? '#2e2e2e' : '#f2f2f2') : (darkMode ? '#3a3a3a' : '#fff') }}>
                <td style={{ padding: '10px' }}>
                  {c.isEditing ? (
                    <input
                      value={c.editName}
                      onChange={(e) => handleEditChange(c.id, e.target.value)}
                      style={{ width: '100%', padding: '6px' }}
                    />
                  ) : c.name}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={c.is_active}
                    onChange={() => handleCheckboxChange(c.id)}
                  />
                </td>
                <td>
                  {c.isEditing ? (
                    <button
                      onClick={() => saveEdit(c.id)}
                      style={{
                        backgroundColor: '#28a745',
                        color: 'white',
                        marginRight: '10px',
                        padding: '5px 10px',
                        borderRadius: '4px'
                      }}
                    >
                      Save
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleEdit(c.id)}
                      style={{
                        backgroundColor: '#ffc107',
                        color: '#000',
                        marginRight: '10px',
                        padding: '5px 10px',
                        borderRadius: '4px'
                      }}
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={() => deleteCandidate(c.id)}
                    style={{
                      backgroundColor: '#dc3545',
                      color: 'white',
                      padding: '5px 10px',
                      borderRadius: '4px'
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Voting Method Selection */}
      <div style={{
        marginTop: '20px',
        backgroundColor: darkMode ? '#3a3a3a' : '#f9f9f9',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: darkMode ? '0px 2px 5px rgba(255, 255, 255, 0.1)' : '0px 2px 5px rgba(0, 0, 0, 0.1)'
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
          <option value="Coombs">Coombs Method</option>
        </select>
      </div>

      {/* Submit and Logout */}
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

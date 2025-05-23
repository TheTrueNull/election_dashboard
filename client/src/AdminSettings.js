import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminSettings = () => {
  const [candidates, setCandidates] = useState([]);
  const [elections, setElections] = useState([]);
  const [selectedElectionId, setSelectedElectionId] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState('Instant Runoff');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const navigate = useNavigate();
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [users, setUsers] = useState([]);
  useEffect(() => {
    fetchCandidates();
    fetchElections();
    fetchUsers();
  }, []);


  const fetchUsers = () => {
    axios.get('/api/admin/users')
      .then((response) => {
        const withEdit = response.data.map(u => ({
          ...u,
          isEditing: false,
          editElectionId: u.election_id
        }));
        setUsers(withEdit);
      })
      .catch((error) => console.error('Error fetching users:', error));
  };

  const fetchCandidates = () => {
    axios.get('/api/admin/candidates')
      .then((response) => {
        const withFlags = response.data.map(c => ({ ...c, isEditing: false, editName: c.name, editElectionId: c.election_id }));
        setCandidates(withFlags);
      })
      .catch((error) => {
        console.error('Error fetching candidates:', error);
      });
  };

  const fetchElections = () => {
    axios.get('/api/admin/elections')
      .then((response) => setElections(response.data))
      .catch((error) => console.error('Error fetching elections:', error));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = '/signin.html';
  };

  const handleCheckboxChange = (candidateId) => {
    setCandidates((prev) =>
      prev.map((candidate) =>
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
      is_active: true,
      election_id: selectedElectionId
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
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, isEditing: !c.isEditing, editName: c.name }
          : { ...c, isEditing: false }
      )
    );
  };

  const handleEditChange = (id, value) => {
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, editName: value } : c
      )
    );
  };

  const saveEdit = (id) => {
    const candidate = candidates.find(c => c.id === id);
    if (!candidate.editName.trim()) return alert("Name cannot be empty.");
  
    axios.post('/api/admin/edit_candidate', {
      id,
      name: candidate.editName,
      election_id: candidate.editElectionId
    })
      .then(() => {
        fetchCandidates();
      })
      .catch((error) => {
        console.error("Error editing candidate:", error);
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
        console.error("Error deleting candidate:", error);
        alert("Error deleting the candidate.");
      });
  };

  const handleUserEditToggle = (id) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, isEditing: !u.isEditing } : { ...u, isEditing: false }));
  };
  
  const handleUserElectionChange = (id, value) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, editElectionId: parseInt(value) } : u));
  };
  
  const handleUserSave = (id) => {
    const user = users.find(u => u.id === id);
    axios.post('/api/admin/update_user_election', {
      user_id: id,
      election_id: user.editElectionId
    })
      .then(() => fetchUsers())
      .catch((err) => alert("Error updating user election."));
  };

  const handleSort = (field) => {
    const direction = (sortField === field && sortDirection === 'asc') ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(direction);
  
    const sorted = [...candidates].sort((a, b) => {
      let valA = a[field];
      let valB = b[field];
  
      // Normalize string values
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
  
      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  
    setCandidates(sorted);
  };
  

  const handleBackToDashboard = () => {
    navigate('/');
  };

  return (
    <div style={{ maxWidth: '1000px', margin: 'auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Admin Settings: Manage Candidate</h1>

      <div style={{
        backgroundColor: '#f9f9f9',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.1)'
      }}>
        <h2>Add Candidate</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '16px' }}
          />
          <input
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '16px' }}
          />
          <select
            value={selectedElectionId}
            onChange={(e) => setSelectedElectionId(parseInt(e.target.value))}
            style={{ padding: '10px', borderRadius: '5px', fontSize: '16px' }}
          >
            {elections.map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
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
            Add Candidate
          </button>
        </div>
      </div>

      <div style={{ textAlign: 'right', marginBottom: '20px' }}>
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
              <th style={{ padding: '10px', cursor: 'pointer' }} onClick={() => handleSort('name')}>
                Candidate Name
              </th>
              <th style={{ padding: '10px', cursor: 'pointer' }} onClick={() => handleSort('election_id')}>
                Election ID
              </th>
              <th style={{ padding: '10px', cursor: 'pointer' }} onClick={() => handleSort('is_active')}>
                Active
              </th>
              <th style={{ padding: '10px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c, index) => (
              <tr key={c.id} style={{ backgroundColor: index % 2 === 0 ? '#f2f2f2' : '#fff' }}>
                <td style={{ padding: '10px' }}>
                  {c.isEditing ? (
                    <input
                      value={c.editName}
                      onChange={(e) => handleEditChange(c.id, e.target.value)}
                      style={{ width: '100%', padding: '6px' }}
                    />
                  ) : c.name}
                </td>
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  {c.isEditing ? (
                    <select
                      value={c.editElectionId}
                      onChange={(e) =>
                        setCandidates(prev =>
                          prev.map(x => x.id === c.id ? { ...x, editElectionId: parseInt(e.target.value) } : x)
                        )
                      }
                    >
                      {elections.map(e => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                      ))}
                    </select>
                  ) : c.election_id}
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
                      }}>
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
                      }}>
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
                    }}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{
  backgroundColor: '#fff',
  padding: '15px',
  borderRadius: '8px',
  marginTop: '30px',
  boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.1)'
}}>
  <h2>Assign Users to Elections</h2>
  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
    <thead>
      <tr style={{ backgroundColor: '#007bff', color: 'white' }}>
        <th style={{ padding: '10px' }}>Username</th>
        <th style={{ padding: '10px' }}>Election</th>
        <th style={{ padding: '10px' }}>Actions</th>
      </tr>
    </thead>
    <tbody>
      {users.map((u, index) => (
        <tr key={u.id} style={{ backgroundColor: index % 2 === 0 ? '#f2f2f2' : '#fff' }}>
          <td style={{ padding: '10px' }}>{u.username}</td>
          <td style={{ padding: '10px' }}>
            {u.isEditing ? (
              <select value={u.editElectionId} onChange={(e) => handleUserElectionChange(u.id, e.target.value)}>
                {elections.map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            ) : u.election_id}
          </td>
          <td style={{ padding: '10px' }}>
            {u.isEditing ? (
              <button onClick={() => handleUserSave(u.id)}>Save</button>
            ) : (
              <button onClick={() => handleUserEditToggle(u.id)}>Edit</button>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
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
          <option value="Coombs">Coombs Method</option>
        </select>
      </div>

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

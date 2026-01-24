import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { DarkModeContext } from './DarkModeContext';
import './App.css';

// Icons
const ArrowLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const SunIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const SortIcon = ({ direction }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: '4px', opacity: direction ? 1 : 0.3 }}>
    {direction === 'asc' ? (
      <path d="M12 5v14M5 12l7-7 7 7"/>
    ) : direction === 'desc' ? (
      <path d="M12 19V5M5 12l7 7 7-7"/>
    ) : (
      <path d="M12 5v14M5 12l7-7 7 7"/>
    )}
  </svg>
);

const AdminSettings = () => {
  const [candidates, setCandidates] = useState([]);
  const [elections, setElections] = useState([]);
  const [selectedElectionId, setSelectedElectionId] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState('Instant Runoff');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [users, setUsers] = useState([]);
  
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useContext(DarkModeContext);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    fetchCandidates();
    fetchElections();
    fetchUsers();
    const savedMethod = localStorage.getItem('votingMethod');
    if (savedMethod) setSelectedMethod(savedMethod);
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
        const withFlags = response.data.map(c => ({ 
          ...c, 
          isEditing: false, 
          editName: c.name, 
          editElectionId: c.election_id 
        }));
        setCandidates(withFlags);
      })
      .catch((error) => console.error('Error fetching candidates:', error));
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
        alert(`Settings saved successfully!`);
      })
      .catch((error) => {
        console.error('Error updating statuses:', error);
        alert("Error updating settings.");
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
      prev.map((c) => (c.id === id ? { ...c, editName: value } : c))
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
      .then(() => fetchCandidates())
      .catch((error) => {
        console.error("Error editing candidate:", error);
        alert("Error updating the candidate.");
      });
  };

  const deleteCandidate = (id) => {
    if (!window.confirm("Are you sure you want to delete this candidate?")) return;

    axios.post('/api/admin/delete_candidates', { candidate_ids: [id] })
      .then(() => fetchCandidates())
      .catch((error) => {
        console.error("Error deleting candidate:", error);
        alert("Error deleting the candidate.");
      });
  };

  const handleUserEditToggle = (id) => {
    setUsers(prev => prev.map(u => 
      u.id === id ? { ...u, isEditing: !u.isEditing } : { ...u, isEditing: false }
    ));
  };

  const handleUserElectionChange = (id, value) => {
    setUsers(prev => prev.map(u => 
      u.id === id ? { ...u, editElectionId: parseInt(value) } : u
    ));
  };

  const handleUserSave = (id) => {
    const user = users.find(u => u.id === id);
    axios.post('/api/admin/update_user_election', {
      user_id: id,
      election_id: user.editElectionId
    })
      .then(() => fetchUsers())
      .catch(() => alert("Error updating user election."));
  };

  const handleSort = (field) => {
    const direction = (sortField === field && sortDirection === 'asc') ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(direction);

    const sorted = [...candidates].sort((a, b) => {
      let valA = a[field];
      let valB = b[field];

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    setCandidates(sorted);
  };

  const getElectionName = (electionId) => {
    const election = elections.find(e => e.id === electionId);
    return election ? election.name : electionId;
  };

  return (
    <div className="admin-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <button className="btn btn-secondary" onClick={() => navigate('/')}>
              <ArrowLeftIcon />
              Back
            </button>
            <div>
              <div className="header-title">Admin Settings</div>
              <div className="header-subtitle">Manage elections and candidates</div>
            </div>
          </div>
          
          <div className="header-actions">
            <button className="btn-icon" onClick={toggleDarkMode} title={darkMode ? 'Light mode' : 'Dark mode'}>
              {darkMode ? <SunIcon /> : <MoonIcon />}
            </button>
            <button className="btn btn-primary" onClick={handleLogout}>
              <LogoutIcon />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="admin-main">
        {/* Add Candidate Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Add New Candidate</h2>
          </div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter first name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Election</label>
                <select
                  className="form-select"
                  value={selectedElectionId}
                  onChange={(e) => setSelectedElectionId(parseInt(e.target.value))}
                >
                  {elections.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button className="btn btn-success" onClick={handleAddCandidate}>
                  <PlusIcon />
                  Add Candidate
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Candidates Table Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Manage Candidates ({candidates.length})</h2>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                      Name <SortIcon direction={sortField === 'name' ? sortDirection : null} />
                    </th>
                    <th onClick={() => handleSort('election_id')} style={{ cursor: 'pointer' }}>
                      Election <SortIcon direction={sortField === 'election_id' ? sortDirection : null} />
                    </th>
                    <th onClick={() => handleSort('is_active')} style={{ cursor: 'pointer' }}>
                      Status <SortIcon direction={sortField === 'is_active' ? sortDirection : null} />
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c) => (
                    <tr key={c.id}>
                      <td>
                        {c.isEditing ? (
                          <input
                            className="inline-input"
                            value={c.editName}
                            onChange={(e) => handleEditChange(c.id, e.target.value)}
                          />
                        ) : (
                          c.name
                        )}
                      </td>
                      <td>
                        {c.isEditing ? (
                          <select
                            className="form-select"
                            value={c.editElectionId}
                            onChange={(e) =>
                              setCandidates(prev =>
                                prev.map(x => x.id === c.id ? { ...x, editElectionId: parseInt(e.target.value) } : x)
                              )
                            }
                            style={{ width: 'auto', padding: '0.5rem' }}
                          >
                            {elections.map(e => (
                              <option key={e.id} value={e.id}>{e.name}</option>
                            ))}
                          </select>
                        ) : (
                          getElectionName(c.election_id)
                        )}
                      </td>
                      <td>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            className="checkbox"
                            checked={c.is_active}
                            onChange={() => handleCheckboxChange(c.id)}
                          />
                          <span className={`badge ${c.is_active ? 'badge-success' : 'badge-muted'}`}>
                            {c.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </label>
                      </td>
                      <td>
                        <div className="table-actions">
                          {c.isEditing ? (
                            <button className="btn btn-sm btn-save" onClick={() => saveEdit(c.id)}>
                              Save
                            </button>
                          ) : (
                            <button className="btn btn-sm btn-edit" onClick={() => toggleEdit(c.id)}>
                              Edit
                            </button>
                          )}
                          <button className="btn btn-sm btn-delete" onClick={() => deleteCandidate(c.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {candidates.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No candidates found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Users Table Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Assign Users to Elections ({users.length})</h2>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Election</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.username}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td>
                        {u.isEditing ? (
                          <select
                            className="form-select"
                            value={u.editElectionId}
                            onChange={(e) => handleUserElectionChange(u.id, e.target.value)}
                            style={{ width: 'auto', padding: '0.5rem' }}
                          >
                            {elections.map(e => (
                              <option key={e.id} value={e.id}>{e.name}</option>
                            ))}
                          </select>
                        ) : (
                          getElectionName(u.election_id)
                        )}
                      </td>
                      <td>
                        <div className="table-actions">
                          {u.isEditing ? (
                            <button className="btn btn-sm btn-save" onClick={() => handleUserSave(u.id)}>
                              Save
                            </button>
                          ) : (
                            <button className="btn btn-sm btn-edit" onClick={() => handleUserEditToggle(u.id)}>
                              Edit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Voting Method Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Voting Method</h2>
          </div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group" style={{ maxWidth: '300px' }}>
                <label className="form-label">Select Algorithm</label>
                <select
                  className="form-select"
                  value={selectedMethod}
                  onChange={handleMethodChange}
                >
                  <option value="Instant Runoff">Instant Runoff (IRV)</option>
                  <option value="Ranked Pairs">Ranked Pairs</option>
                  <option value="Coombs">Coombs Method</option>
                </select>
              </div>
            </div>
            <div className="footer-actions">
              <button className="btn btn-primary" onClick={handleSubmit}>
                Save All Changes
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminSettings;

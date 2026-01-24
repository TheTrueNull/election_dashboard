import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import AdminSettings from './AdminSettings';
import { DarkModeContext } from './DarkModeContext';
import './App.css';

// Icons as simple SVG components
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

const GripIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="9" cy="6" r="2"/><circle cx="15" cy="6" r="2"/>
    <circle cx="9" cy="12" r="2"/><circle cx="15" cy="12" r="2"/>
    <circle cx="9" cy="18" r="2"/><circle cx="15" cy="18" r="2"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const TrophyIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
  </svg>
);

// Dashboard Component
const Dashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [rankedCandidates, setRankedCandidates] = useState([]);
  const [winner, setWinner] = useState('');
  const [roleId, setRoleId] = useState(null);
  const [username, setUsername] = useState('');

  const { darkMode, toggleDarkMode } = useContext(DarkModeContext);
  const navigate = useNavigate();

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Fetch user role and username
  useEffect(() => {
    axios.get('/api/user-role', { withCredentials: true })
      .then((response) => {
        setRoleId(response.data.role_id);
        setUsername(response.data.username);
      })
      .catch(() => {
        window.location.href = '/signin.html';
      });
  }, []);

  // Fetch list of candidates
  useEffect(() => {
    axios.get('/api/candidates')
      .then((response) => {
        setCandidates(response.data);
      })
      .catch((error) => {
        console.error("Error fetching candidates!", error);
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = '/signin.html';
  };

  const handleOnDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    if (source.droppableId !== destination.droppableId) {
      let sourceItems = source.droppableId === 'candidates' ? [...candidates] : [...rankedCandidates];
      let destItems = destination.droppableId === 'candidates' ? [...candidates] : [...rankedCandidates];

      const [movedItem] = sourceItems.splice(source.index, 1);
      destItems.splice(destination.index, 0, movedItem);

      if (source.droppableId === 'candidates') {
        setCandidates(sourceItems);
        setRankedCandidates(destItems);
      } else {
        setCandidates(destItems);
        setRankedCandidates(sourceItems);
      }
    } else {
      const items = source.droppableId === 'candidates' ? [...candidates] : [...rankedCandidates];
      const [movedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, movedItem);

      if (source.droppableId === 'candidates') {
        setCandidates(items);
      } else {
        setRankedCandidates(items);
      }
    }
  };

  const handleSubmitBallot = () => {
    if (rankedCandidates.length === 0) {
      alert("Please rank at least one candidate before submitting.");
      return;
    }
    const ballotData = rankedCandidates.map((candidate, index) => ({
      candidate_id: candidate.id,
      rank: index + 1
    }));

    axios.post('/api/submit_ballot', ballotData)
      .then(() => {
        alert("Ballot submitted successfully!");
        setRankedCandidates([]);
      })
      .catch((error) => {
        console.error("Error submitting ballot:", error);
        alert("There was an error submitting your ballot.");
      });
  };

  const handleCalculateWinner = () => {
    const method = localStorage.getItem('votingMethod') || 'Instant Runoff';

    axios.get('/api/calculate_winner', {
      headers: { 'x-voting-method': method }
    })
      .then((response) => {
        setWinner(response.data.winner);
      })
      .catch((error) => {
        console.error("Error calculating the winner:", error);
        alert("There was an error calculating the winner.");
      });
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo">C</div>
            <div>
              <div className="header-title">CSUN Elections</div>
              <div className="header-subtitle">Ranked Choice Voting</div>
            </div>
          </div>
          
          <div className="header-actions">
            <button className="btn-icon" onClick={toggleDarkMode} title={darkMode ? 'Light mode' : 'Dark mode'}>
              {darkMode ? <SunIcon /> : <MoonIcon />}
            </button>
            
            {roleId === 1 && (
              <button className="btn btn-secondary" onClick={() => navigate('/admin-settings')}>
                <SettingsIcon />
                Admin
              </button>
            )}
            
            <button className="btn btn-primary" onClick={handleLogout}>
              <LogoutIcon />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="welcome-section">
          <h1 className="welcome-title">Welcome back, {username}!</h1>
          <p className="welcome-subtitle">Drag candidates from left to right to rank your choices</p>
        </div>

        {/* Voting Columns */}
        <DragDropContext onDragEnd={handleOnDragEnd}>
          <div className="voting-container">
            {/* Available Candidates */}
            <div className="voting-column">
              <div className="column-header">
                <h2 className="column-title">
                  Available Candidates
                  <span className="column-count">{candidates.length}</span>
                </h2>
              </div>
              <Droppable droppableId="candidates">
                {(provided) => (
                  <div
                    className="column-content"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {candidates.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-state-icon">📋</div>
                        <p className="empty-state-text">No candidates available</p>
                      </div>
                    ) : (
                      candidates.map((candidate, index) => (
                        <Draggable key={candidate.id} draggableId={candidate.id.toString()} index={index}>
                          {(provided, snapshot) => (
                            <div
                              className={`candidate-card ${snapshot.isDragging ? 'dragging' : ''}`}
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <span className="drag-handle"><GripIcon /></span>
                              <span className="candidate-name">{candidate.name}</span>
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

            {/* Ranked Candidates */}
            <div className="voting-column">
              <div className="column-header">
                <h2 className="column-title">
                  Your Rankings
                  <span className="column-count">{rankedCandidates.length}</span>
                </h2>
              </div>
              <Droppable droppableId="rankedCandidates">
                {(provided) => (
                  <div
                    className="column-content"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {rankedCandidates.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-state-icon">🗳️</div>
                        <p className="empty-state-text">Drag candidates here to rank them</p>
                      </div>
                    ) : (
                      rankedCandidates.map((candidate, index) => (
                        <Draggable key={candidate.id} draggableId={candidate.id.toString()} index={index}>
                          {(provided, snapshot) => (
                            <div
                              className={`candidate-card ${snapshot.isDragging ? 'dragging' : ''}`}
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <span className="candidate-rank">{index + 1}</span>
                              <span className="candidate-name">{candidate.name}</span>
                              <span className="drag-handle"><GripIcon /></span>
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </div>
        </DragDropContext>

        {/* Action Buttons */}
        <div className="actions-section">
          <button className="btn btn-success" onClick={handleSubmitBallot}>
            Submit Ballot
          </button>
          <button className="btn btn-secondary" onClick={handleCalculateWinner}>
            Calculate Winner
          </button>
        </div>

        {/* Winner Display */}
        {winner && (
          <div className="winner-card">
            <div className="winner-label">
              <TrophyIcon /> Election Winner
            </div>
            <div className="winner-name">{winner}</div>
            <div className="winner-method">
              Method: {localStorage.getItem('votingMethod') || 'Instant Runoff'}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// App Wrapper
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/admin-settings" element={<AdminSettings />} />
      </Routes>
    </Router>
  );
};

export default App;

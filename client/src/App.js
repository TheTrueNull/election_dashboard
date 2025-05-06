// Import necessary libraries
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import AdminSettings from './AdminSettings';
import { DarkModeContext } from './DarkModeContext'; // 🔥 New: Import the dark mode context

// Dashboard Component
const Dashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [rankedCandidates, setRankedCandidates] = useState([]);
  const [winner, setWinner] = useState('');
  const [roleId, setRoleId] = useState(null);
  const [username, setUsername] = useState('');
  const [hoveredCandidateId, setHoveredCandidateId] = useState(null);

  // useContext to pull darkMode and toggleDarkMode globally
  const { darkMode, toggleDarkMode } = useContext(DarkModeContext);

  const navigate = useNavigate();

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

  // Handle logout by clearing token and redirecting
  const handleLogout = () => {
    localStorage.removeItem('token');
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = '/signin.html';
  };

  // Handle Drag and Drop logic
  const handleOnDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    if (source.droppableId !== destination.droppableId) {
      // Moving between lists
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
      // Reordering within the same list
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

  // Handle submitting the ballot
  const handleSubmitBallot = () => {
    if (rankedCandidates.length === 0) {
      alert("Please rank candidates before submitting.");
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

  // Handle calculating the winner
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

  // JS layout
  return (
    <div style={{
      backgroundColor: darkMode ? '#2e2e2e' : '#fff',
      color: darkMode ? '#eaeaea' : '#000',
      minHeight: '100vh',
      transition: 'background-color 0.3s ease, color 0.3s ease',
      paddingBottom: '20px',
      fontFamily: 'Segoe UI, sans-serif'
    }}>
      {/* Dark Mode Toggle */}
      <button
        onClick={toggleDarkMode}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: darkMode ? '#444' : '#eee',
          color: darkMode ? '#fff' : '#000',
          border: '1px solid #888',
          borderRadius: '5px',
          cursor: 'pointer',
          margin: '10px'
        }}
        onMouseEnter={(e) =>
          (e.target.style.backgroundColor = darkMode ? '#555' : '#ddd')
        }
        onMouseLeave={(e) =>
          (e.target.style.backgroundColor = darkMode ? '#444' : '#eee')
        }
      >
        {darkMode ? 'Light Mode' : 'Dark Mode'}
      </button>

      {/* Header */}
      <h2 style={{ textAlign: 'center', margin: '20px 0 10px' }}>Welcome, {username}!</h2>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Dashboard</h1>

      {/* Admin Button + Logout */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        display: 'flex',
        gap: '10px',
      }}>
        {roleId === 1 && (
          <button
            onClick={() => navigate('/admin-settings')}
            style={buttonStyle(darkMode)}
          >
            Admin Settings
          </button>
        )}
        <button
          onClick={handleLogout}
          style={buttonStyle(darkMode)}
        >
          Logout
        </button>
      </div>

      {/* Drag and Drop Area */}
      <DragDropContext onDragEnd={handleOnDragEnd}>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          {/* 🔥 We created a helper function renderDroppable() to avoid repeating the same JSX for each list */}
          {renderDroppable(candidates, 'candidates', setHoveredCandidateId, hoveredCandidateId, darkMode)}
          {renderDroppable(rankedCandidates, 'rankedCandidates', setHoveredCandidateId, hoveredCandidateId, darkMode)}
        </div>
      </DragDropContext>

      {/* Submit / Calculate Buttons */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          onClick={handleSubmitBallot}
          style={{ ...buttonStyle(darkMode), marginRight: '10px' }}
        >
          Submit Ballot
        </button>
        <button
          onClick={handleCalculateWinner}
          style={buttonStyle(darkMode)}
        >
          Calculate Winner
        </button>
      </div>

      {/* Winner Section */}
      {winner && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <h2>Winner: {winner}</h2>
          <p style={{ fontStyle: 'italic' }}>
            Voting Method: <strong>{localStorage.getItem('votingMethod') || 'Instant Runoff'}</strong>
          </p>
        </div>
      )}
    </div>
  );
};

// Helper function to render each droppable list
const renderDroppable = (list, droppableId, setHoveredCandidateId, hoveredCandidateId, darkMode) => (
  <Droppable droppableId={droppableId}>
    {(provided) => (
      <div
        {...provided.droppableProps}
        ref={provided.innerRef}
        style={{ backgroundColor: darkMode ? '#3a3a3a' : '#f7f7f7', padding: '8px', width: '45%' }}
      >
        <h2>{droppableId === 'candidates' ? 'All Candidates' : 'Ranked Candidates'}</h2>
        {list.map((c, index) => (
          <Draggable key={c.id} draggableId={c.id.toString()} index={index}>
            {(provided, snapshot) => {
              const isHovered = hoveredCandidateId === c.id;
              const baseColor = darkMode
                ? index % 2 === 0 ? '#3a3a3a' : '#2e2e2e'
                : index % 2 === 0 ? '#ffffff' : '#f9f9f9';
              const hoverColor = darkMode ? '#555' : '#ddd';
              const backgroundColor = isHovered ? hoverColor : baseColor;
              const dragStyle = provided.draggableProps.style;
              const scale = snapshot.isDragging ? 1.05 : 1;
              const fullTransform = `${dragStyle?.transform || ''} scale(${scale})`;

              return (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  onMouseEnter={() => setHoveredCandidateId(c.id)}
                  onMouseLeave={() => setHoveredCandidateId(null)}
                  style={{
                    ...dragStyle,
                    padding: '8px',
                    margin: '4px',
                    border: '1px solid #ccc',
                    backgroundColor,
                    transform: fullTransform,
                    transition: 'transform 0.2s ease, background-color 0.2s ease',
                    borderRadius: '8px',
                    boxShadow: darkMode
                      ? '0 2px 4px rgba(255, 255, 255, 0.1)'
                      : '0 2px 4px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {droppableId === 'rankedCandidates' && <span style={{ fontWeight: 'bold', marginRight: '10px' }}>{index + 1}.</span>}
                  {c.name}
                </div>
              );
            }}
          </Draggable>
        ))}
        {provided.placeholder}
        {droppableId === 'rankedCandidates' && list.length === 0 && (
          <p style={{
            textAlign: 'center',
            color: darkMode ? '#aaa' : '#777',
            fontStyle: 'italic',
            marginTop: '10px'
          }}>
            Drag candidates here to rank them.
          </p>
        )}
      </div>
    )}
  </Droppable>
);

// Helper function for consistent button styling
const buttonStyle = (darkMode) => ({
  padding: '10px 20px',
  fontSize: '16px',
  backgroundColor: darkMode ? '#444' : '#eee',
  color: darkMode ? '#fff' : '#000',
  border: '1px solid #888',
  borderRadius: '5px',
  cursor: 'pointer'
});

// App Wrapper Component
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

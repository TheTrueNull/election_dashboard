import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import AdminSettings from './AdminSettings'; // Admin screen

const Dashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [rankedCandidates, setRankedCandidates] = useState([]);
  const [winner, setWinner] = useState('');
  const [roleId, setRoleId] = useState(null);
  const [username, setUsername] = useState('');
  const [hoveredCandidateId, setHoveredCandidateId] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };
    const [isDarkToggleHovered, setIsDarkToggleHovered] = useState(false);
  const navigate = useNavigate();

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

  useEffect(() => {
    axios.get('/api/candidates')
      .then((response) => {
        setCandidates(response.data);
      })
      .catch((error) => {
        console.error("There was an error fetching the candidates!", error);
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
      let sourceItems = (source.droppableId === 'candidates') ? [...candidates] : [...rankedCandidates];
      let destItems = (destination.droppableId === 'candidates') ? [...candidates] : [...rankedCandidates];

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
      const items = (source.droppableId === 'candidates') ? [...candidates] : [...rankedCandidates];
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

  const handleCalculateWinner = () => {
    const method = localStorage.getItem('votingMethod') || 'Instant Runoff';
  
    console.log(`Calculating winner using ${method}...`);
  
    axios.get('/api/calculate_winner', {
      headers: { 'x-voting-method': method }
    })
      .then((response) => {
        setWinner(response.data.winner);  // ✅ Display winner
      })
      .catch((error) => {
        console.error("Error calculating the winner:", error);
        alert("There was an error calculating the winner.");
      });
  };


  return (
    <div style={{
      backgroundColor: darkMode ? '#2e2e2e' : '#fff',
      color: darkMode ? '#eaeaea' : '#000',
      minHeight: '100vh',
      transition: 'background-color 0.3s ease, color 0.3s ease',
      paddingBottom: '20px',
      fontFamily: 'Segoe UI, sans-serif'
    }}>
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
        transition: 'background-color 0.3s ease',
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


      <h2 style={{ textAlign: 'center', margin: '20px 0 10px' }}>Welcome, {username}!</h2>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Dashboard</h1>

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
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: darkMode ? '#444' : '#eee',
              color: darkMode ? '#fff' : '#000',
              border: '1px solid #888',
              borderRadius: '5px'
            }}
          >
            Admin Settings
          </button>
        )}
        <button
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: darkMode ? '#444' : '#eee',
            color: darkMode ? '#fff' : '#000',
            border: '1px solid #888',
            borderRadius: '5px'
          }}
        >
          Logout
        </button>
      </div>

      <DragDropContext onDragEnd={handleOnDragEnd}>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          {/* Candidates */}
          <Droppable droppableId="candidates">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                style={{ backgroundColor: darkMode ? '#3a3a3a' : '#e0e0e0', padding: '8px', width: '45%' }}
              >
                <h2>All Candidates</h2>
                {candidates.map((c, index) => (
                  <Draggable key={c.id} draggableId={c.id.toString()} index={index}>
                    {(provided, snapshot) => {
                      const isHovered = hoveredCandidateId === c.id;
                      const isEvenRow = index % 2 === 0;
                      const baseColor = darkMode
                        ? isEvenRow ? '#3a3a3a' : '#2e2e2e'
                        : isEvenRow ? '#ffffff' : '#f9f9f9';
                        const hoverColor = darkMode ? '#555' : '#ddd';
                        const backgroundColor = isHovered ? hoverColor : baseColor;                                              
                      const dragStyle = provided.draggableProps.style;
                      const scale = snapshot.isDragging ? 1.05 : 1;
                      const baseTransform = dragStyle?.transform || '';
                      const fullTransform = `${baseTransform} scale(${scale})`;
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
                            transition: 'transform 0.2s ease, background-color 0.2s ease',
                            transform: fullTransform,
                            borderRadius: '8px',
                            boxShadow: darkMode
                            ? '0 2px 4px rgba(255, 255, 255, 0.1)'
                            : '0 2px 4px rgba(0, 0, 0, 0.1)',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          {c.name}
                        </div>
                      );
                    }}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {/* Ranked Candidates */}
          <Droppable droppableId="rankedCandidates">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                style={{ backgroundColor: darkMode ? '#3a3a3a' : '#f7f7f7', padding: '8px', width: '45%' }}
              >
                <h2>Ranked Candidates</h2>
                {rankedCandidates.map((rc, index) => (
                  <Draggable key={rc.id} draggableId={rc.id.toString()} index={index}>
                    {(provided, snapshot) => {
                      const isHovered = hoveredCandidateId === rc.id;
                      const isEvenRow = index % 2 === 0;
                      const baseColor = darkMode
                        ? isEvenRow ? '#3a3a3a' : '#2e2e2e'
                        : isEvenRow ? '#ffffff' : '#f9f9f9';
                        const hoverColor = darkMode ? '#555' : '#ddd';
                        const backgroundColor = isHovered ? hoverColor : baseColor;                        
                      const dragStyle = provided.draggableProps.style;
                      const scale = snapshot.isDragging ? 1.05 : 1;
                      const baseTransform = dragStyle?.transform || '';
                      const fullTransform = `${baseTransform} scale(${scale})`;
                      return (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          onMouseEnter={() => setHoveredCandidateId(rc.id)}
                          onMouseLeave={() => setHoveredCandidateId(null)}
                          style={{
                            ...dragStyle,
                            padding: '8px',
                            margin: '4px',
                            border: '1px solid #ccc',
                            backgroundColor,
                            transition: 'transform 0.2s ease, background-color 0.2s ease',
                            transform: fullTransform,
                            borderRadius: '8px',
                            boxShadow: darkMode
                            ? '0 2px 4px rgba(255, 255, 255, 0.1)'
                            : '0 2px 4px rgba(0, 0, 0, 0.1)',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <span style={{ fontWeight: 'bold', marginRight: '10px' }}>{index + 1}.</span>
                          {rc.name}
                        </div>
                      );
                    }}
                  </Draggable>
                ))}
                {rankedCandidates.length === 0 && (
                  <p style={{
                    textAlign: 'center',
                    color: darkMode ? '#aaa' : '#777',
                    fontStyle: 'italic',
                    marginTop: '10px'
                  }}>
                    Drag candidates here to rank them.
                  </p>
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          onClick={handleSubmitBallot}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: darkMode ? '#444' : '#eee',
            color: darkMode ? '#fff' : '#000',
            border: '1px solid #888',
            borderRadius: '5px',
            marginRight: '10px'
          }}
        >
          Submit Ballot
        </button>
        <button
          onClick={handleCalculateWinner}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: darkMode ? '#444' : '#eee',
            color: darkMode ? '#fff' : '#000',
            border: '1px solid #888',
            borderRadius: '5px'
          }}
        >
          Calculate Winner
        </button>
      </div>

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

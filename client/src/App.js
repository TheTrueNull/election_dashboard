// App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import AdminSettings from './AdminSettings'; // Admin screen

const Dashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [rankedCandidates, setRankedCandidates] = useState([]);
  const [winner, setWinner] = useState('');
  const [roleId, setRoleId] = useState(null); // Track user role
  const [hoveredId, setHoveredId] = useState(null); //for hovering on mouse
  const [hoveredCandidateId, setHoveredCandidateId] = useState(null);
  const navigate = useNavigate();

    // Check authentication & get user role
    useEffect(() => {
      axios.get('/api/user-role', { withCredentials: true })
        .then((response) => {
          setRoleId(response.data.role_id);
        })
        .catch(() => {
          window.location.href = '/signin.html'; // Redirect to sign-in if unauthorized
        });
    }, []);

  // Fetch candidates (active only) from /api/candidates
  useEffect(() => {
    axios.get('/api/candidates')
      .then((response) => {
        setCandidates(response.data);
      })
      .catch((error) => {
        console.error("There was an error fetching the candidates!", error);
      });
  }, []);

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('token');
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = '/signin.html'; // Force a full reload to signin
  };

  // Drag and drop logic
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
      // Reordering in the same list
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

  // Submit Ballot
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

  // Calculate Winner
  const handleCalculateWinner = () => {
    // Determine selected method from localStorage
    const method = localStorage.getItem('votingMethod') || 'Instant Runoff';
    const endpoint = (method === 'Ranked Pairs')
      ? '/api/calculate_winner_ranked_pairs'
      : '/api/calculate_winner';

    axios.get(endpoint)
      .then((response) => {
        setWinner(response.data.winner);
      })
      .catch((error) => {
        console.error("Error calculating the winner:", error);
        alert("There was an error calculating the winner.");
      });
  };

  return (
    <div>
      <h1>Dashboard</h1>

      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          display: 'flex',
          gap: '10px',
        }}
        >
          {roleId === 1 && ( // Only show Admin Settings if user is an Admin
            <button
              onClick={() => navigate('/admin-settings')}
              style={{ padding: '10px 20px', fontSize: '16px' }}
            >
              Admin Settings
            </button>
          )}
        <button
          onClick={handleLogout}
          style={{ padding: '10px 20px', fontSize: '16px' }}
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
                style={{ backgroundColor: '#e0e0e0', padding: '8px', width: '45%' }}
              >
                <h2>All Candidates</h2>
                {candidates.map((c, index) => (
  <Draggable key={c.id} draggableId={c.id.toString()} index={index}>
    {(provided, snapshot) => {
      const isHovered = hoveredCandidateId === c.id;
      const backgroundColor = isHovered ? '#bdbdbd' : '#f0f0f0';

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
            transform: fullTransform, // override transform here
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
                style={{ backgroundColor: '#f7f7f7', padding: '8px', width: '45%' }}
              >
                <h2>Ranked Candidates</h2>
                {rankedCandidates.map((rc, index) => (
  <Draggable key={rc.id} draggableId={rc.id.toString()} index={index}>
    {(provided, snapshot) => {
      const isHovered = hoveredCandidateId === rc.id;
      const backgroundColor = isHovered ? '#bdbdbd' : '#d0d0d0';

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
            ...dragStyle, // drag position styles first
            padding: '8px',
            margin: '4px',
            border: '1px solid #ccc',
            backgroundColor,
            transition: 'transform 0.2s ease, background-color 0.2s ease',
            transform: fullTransform, // scale + drag movement
          }}
        >
          {rc.name}
        </div>
      );
    }}
  </Draggable>
))}



                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          onClick={handleSubmitBallot}
          style={{ padding: '10px 20px', fontSize: '16px', marginRight: '10px' }}
        >
          Submit Ballot
        </button>
        <button
          onClick={handleCalculateWinner}
          style={{ padding: '10px 20px', fontSize: '16px' }}
        >
          Calculate Winner
        </button>
      </div>

      {winner && (
        <h2 style={{ marginTop: '20px', textAlign: 'center' }}>
          Winner: {winner}
        </h2>
      )}
    </div>
  );
};

// The main App uses Router for navigation
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

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import AdminSettings from './AdminSettings'; // Import AdminSettings component

const Dashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [rankedCandidates, setRankedCandidates] = useState([]);
  const [winner, setWinner] = useState(''); // State to store the election winner
  const navigate = useNavigate();

  // Fetch candidates from the backend
  useEffect(() => {
    axios.get('/api/candidates')
      .then((response) => {
        setCandidates(response.data);
      })
      .catch((error) => {
        console.error("There was an error fetching the candidates!", error);
      });
  }, []);

  // Logout function to clear tokens and redirect to signin page
  const handleLogout = () => {
    localStorage.removeItem('token');
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    navigate('/signin.html');
  };

  // Handle when the drag ends
  const handleOnDragEnd = (result) => {
    const { source, destination } = result;

    if (!destination) return;

    if (source.droppableId !== destination.droppableId) {
      let sourceItems = source.droppableId === 'candidates' ? Array.from(candidates) : Array.from(rankedCandidates);
      let destinationItems = destination.droppableId === 'candidates' ? Array.from(candidates) : Array.from(rankedCandidates);

      const [movedItem] = sourceItems.splice(source.index, 1);
      destinationItems.splice(destination.index, 0, movedItem);

      if (source.droppableId === 'candidates') {
        setCandidates(sourceItems);
        setRankedCandidates(destinationItems);
      } else {
        setRankedCandidates(sourceItems);
        setCandidates(destinationItems);
      }
    } else {
      const items = source.droppableId === 'candidates' ? Array.from(candidates) : Array.from(rankedCandidates);
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
    axios.get('/api/calculate_winner')
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

      {/* Container for Logout and Admin Settings buttons */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        display: 'flex',
        gap: '10px',
      }}>
        <button
          onClick={() => navigate('/admin-settings')}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
          }}
        >
          Admin Settings
        </button>
        <button
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
          }}
        >
          Logout
        </button>
      </div>

      <DragDropContext onDragEnd={handleOnDragEnd}>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <Droppable droppableId="candidates">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                style={{ backgroundColor: '#e0e0e0', padding: '8px', width: '45%' }}
              >
                <h2>All Candidates</h2>
                {candidates.map(({ id, name }, index) => (
                  <Draggable key={id} draggableId={id.toString()} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{
                          padding: '8px',
                          margin: '4px',
                          backgroundColor: '#f0f0f0',
                          border: '1px solid #ccc',
                          ...provided.draggableProps.style
                        }}
                      >
                        {name}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          <Droppable droppableId="rankedCandidates">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                style={{ backgroundColor: '#f7f7f7', padding: '8px', width: '45%' }}
              >
                <h2>Ranked Candidates</h2>
                {rankedCandidates.map(({ id, name }, index) => (
                  <Draggable key={id} draggableId={id.toString()} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{
                          padding: '8px',
                          margin: '4px',
                          backgroundColor: '#d0d0d0',
                          border: '1px solid #ccc',
                          ...provided.draggableProps.style
                        }}
                      >
                        {name}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button onClick={handleSubmitBallot} style={{ padding: '10px 20px', fontSize: '16px', marginRight: '10px' }}>
          Submit Ballot
        </button>

        <button onClick={handleCalculateWinner} style={{ padding: '10px 20px', fontSize: '16px' }}>
          Calculate Winner
        </button>
      </div>

      {winner && <h2 style={{ marginTop: '20px', textAlign: 'center' }}>Winner: {winner}</h2>}
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

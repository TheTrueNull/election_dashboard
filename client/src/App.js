import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const App = () => {
  const [candidates, setCandidates] = useState([]);
  const [rankedCandidates, setRankedCandidates] = useState([]);

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

  // Handle when the drag ends
  const handleOnDragEnd = (result) => {
    const { source, destination } = result;

    // If no destination, return
    if (!destination) return;

    // Moving between lists
    if (source.droppableId !== destination.droppableId) {
      let sourceItems = source.droppableId === 'candidates' ? Array.from(candidates) : Array.from(rankedCandidates);
      let destinationItems = destination.droppableId === 'candidates' ? Array.from(candidates) : Array.from(rankedCandidates);

      // Remove from source
      const [movedItem] = sourceItems.splice(source.index, 1);
      // Add to destination
      destinationItems.splice(destination.index, 0, movedItem);

      // Update the correct lists
      if (source.droppableId === 'candidates') {
        setCandidates(sourceItems);
        setRankedCandidates(destinationItems);
      } else {
        setRankedCandidates(sourceItems);
        setCandidates(destinationItems);
      }
    } else {
      // Reordering within the same list
      const items = source.droppableId === 'candidates' ? Array.from(candidates) : Array.from(rankedCandidates);
      const [movedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, movedItem);

      // Update the list
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

    // Send the ranked candidates to the backend
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

  return (
    <div>
      <h1>Drag and Drop Candidates</h1>
      <DragDropContext onDragEnd={handleOnDragEnd}>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          {/* Candidates List Column */}
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

          {/* Ranked Candidates Column */}
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

      {/* Submit Ballot Button */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button onClick={handleSubmitBallot} style={{ padding: '10px 20px', fontSize: '16px' }}>
          Submit Ballot
        </button>
      </div>
    </div>
  );
};

export default App;

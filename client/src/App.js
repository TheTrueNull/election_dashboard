import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const App = () => {
  const [candidates, setCandidates] = useState([]);
  const [rankedCandidates, setRankedCandidates] = useState([]); // New state for ranked candidates

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

    // If there's no destination, return
    if (!destination) return;

    if (source.droppableId === 'candidates' && destination.droppableId === 'rankedCandidates') {
      // Moving from candidates list to ranked candidates
      const items = Array.from(candidates);
      const [movedItem] = items.splice(source.index, 1);
      setCandidates(items);

      const rankedItems = Array.from(rankedCandidates);
      rankedItems.splice(destination.index, 0, movedItem);
      setRankedCandidates(rankedItems);
    } else if (source.droppableId === 'rankedCandidates' && destination.droppableId === 'rankedCandidates') {
      // Rearranging within the ranked candidates
      const rankedItems = Array.from(rankedCandidates);
      const [movedItem] = rankedItems.splice(source.index, 1);
      rankedItems.splice(destination.index, 0, movedItem);
      setRankedCandidates(rankedItems);
    }
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
    </div>
  );
};

export default App;

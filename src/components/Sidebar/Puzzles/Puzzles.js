import React, { useState } from 'react';
import './Puzzles.css';

const PuzzlePage = ({ puzzles, handlePuzzleAttempt }) => {
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);

  const handleSubmit = async (e, puzzleId) => {
    e.preventDefault();
    const input = e.target.elements[`keyword-${puzzleId}`].value.trim().toLowerCase();
    
    try {
      const result = await handlePuzzleAttempt(puzzleId, input);
      
      if (result) {
        // Clear form after successful submission
        e.target.reset();
      }
    } catch (error) {
      console.error("Error submitting puzzle solution:", error);
    }
  };

  // Function to show puzzle details
  const viewPuzzleDetails = (puzzleId) => {
    const puzzle = puzzles.find(p => p.id === puzzleId);
    setSelectedPuzzle(puzzle);
  };

  // Function to go back to puzzle grid
  const backToPuzzleGrid = () => {
    setSelectedPuzzle(null);
  };

  // If a puzzle is selected, show its details
  if (selectedPuzzle) {
    return (
      <div className="puzzle-details">
        <button onClick={backToPuzzleGrid} className="back-button">
          ← Back to Puzzles
        </button>
        
        <h2>{selectedPuzzle.name}</h2>
        <p className="puzzle-description">{selectedPuzzle.description}</p>
        
        {selectedPuzzle.hint && (
          <div className="puzzle-hint">
            <h3>Hint:</h3>
            <p>{selectedPuzzle.hint}</p>
          </div>
        )}
        
        {!selectedPuzzle.completed ? (
          <form onSubmit={(e) => handleSubmit(e, selectedPuzzle.id)} className="solution-form">
            <input
              name={`keyword-${selectedPuzzle.id}`}
              placeholder="Enter solution keyword"
              className="solution-input"
            />
            <button type="submit" className="submit-button">
              Submit Solution
            </button>
          </form>
        ) : (
          <div className="completed-message">
            <h3>✅ Puzzle Completed!</h3>
            <p>Great job solving this puzzle!</p>
          </div>
        )}
      </div>
    );
  }

  // Otherwise, show the puzzle grid
  return (
    <>
      <header className="forum-header">
        <h1>🧩 Puzzle Collection</h1>
        <p>Solve puzzles to unlock more forum features!</p>
      </header>
  
      <div className="puzzles-grid">
        {puzzles.map(puzzle => (
          <div key={puzzle.id} className={`puzzle-card ${puzzle.completed ? 'completed-puzzle' : ''}`}>
            <h3>{puzzle.name}</h3>
            <p>{puzzle.completed ? 'Completed! Well done!' : 'Not yet completed'}</p>
            
            {/* Button to view puzzle details instead of Link */}
            <button 
              onClick={() => viewPuzzleDetails(puzzle.id)} 
              className="view-puzzle-button"
            >
              View Details
            </button>
            
            {/* Quick solution form directly in the grid */}
            <form
              onSubmit={(e) => handleSubmit(e, puzzle.id)}
              className="quick-solution-form"
            >
              <input
                name={`keyword-${puzzle.id}`}
                placeholder="Enter solution keyword"
                disabled={puzzle.completed}
                className="solution-input-small"
              />
              <button 
                type="submit" 
                disabled={puzzle.completed}
                className="submit-button-small"
              >
                Submit
              </button>
            </form>
            {puzzle.completed && <p className="solved-badge">✅ Solved!</p>}
          </div>
        ))}
      </div>
    </>
  );
};
  
export default PuzzlePage;
import React, { useState } from 'react';
import './Puzzles.css';
import PuzzleDetail from './PuzzleDetail';

const PuzzlePage = ({ puzzles, handlePuzzleAttempt }) => {
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);
  const [message, setMessage] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const handleSubmit = async (e, puzzleId) => {
    e.preventDefault();
    const input = e.target.elements[`keyword-${puzzleId}`].value.trim().toLowerCase();

    try {
      // Pass the input to the handlePuzzleAttempt function
      const result = await handlePuzzleAttempt(puzzleId, input);
      if (result) {
        e.target.reset();
        setMessage({ type: 'success', text: 'Correct solution!' });
      } else {
        setMessage({ type: 'error', text: 'Incorrect solution. Try again!' });
      }
    } catch (error) {
      console.error('Error submitting puzzle solution:', error);
      setMessage({ type: 'error', text: 'Error submitting solution.' });
    }
  };

  const viewPuzzleDetails = (puzzleId) => {
    const puzzle = puzzles.find(p => p.id === puzzleId);
    setSelectedPuzzle(puzzle);
    setShowDetailModal(true);
    setMessage(null); // Clear any previous messages
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setMessage(null); // Clear any messages when closing
  };

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

            <div className="puzzle-card-buttons">
              <button onClick={() => viewPuzzleDetails(puzzle.id)} className="view-puzzle-button">
                View Details
              </button>
            </div>

            <form onSubmit={(e) => handleSubmit(e, puzzle.id)} className="quick-solution-form">
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

      {/* Puzzle Details Modal */}
      {showDetailModal && selectedPuzzle && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="puzzle-detail-content">
              <button onClick={closeDetailModal} className="modal-close-button">✕</button>
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

              {message && (
                <div className={`message ${message.type}`}>
                  {message.text}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PuzzlePage;
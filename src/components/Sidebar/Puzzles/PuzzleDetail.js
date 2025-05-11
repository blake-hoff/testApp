import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './PuzzleDetail.css';

const PuzzleDetail = ({ Puzzles, handlePuzzleAttempt }) => {
  const { puzzleId } = useParams();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  
  // Find the selected puzzle
  const puzzle = Puzzles.find(p => p.id === parseInt(puzzleId, 10));
  
  // If puzzle not found, show a message and return to Puzzles page
  if (!puzzle) {
    return (
      <div className="puzzle-not-found">
        <h2>Puzzle not found</h2>
        <button onClick={() => navigate('/Puzzles')}>Return to Puzzles</button>
      </div>
    );
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    
    const input = e.target.elements.solution.value.trim().toLowerCase();
    
    try {
      const result = await handlePuzzleAttempt(puzzle.id, input);
      
      if (result) {
        setMessage({ type: 'success', text: 'Correct! Puzzle solved successfully!' });
        // Clear form after successful submission
        e.target.reset();
      } else {
        setMessage({ type: 'error', text: 'Incorrect solution. Try again!' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="puzzle-detail-container">
      <button className="back-button" onClick={() => navigate('/Puzzles')}>
        ← Back to Puzzles
      </button>
      
      <div className="puzzle-detail-card">
        <h1 className="puzzle-title">{puzzle.name}</h1>
        
        <div className="puzzle-status">
          {puzzle.completed ? (
            <span className="completed-status">✅ Completed</span>
          ) : (
            <span className="incomplete-status">⏳ Not yet completed</span>
          )}
        </div>
        
        <div className="puzzle-description">
          <h3>Description:</h3>
          <p>{puzzle.description}</p>
        </div>
        
        {puzzle.threadName && (
          <div className="puzzle-thread">
            <h3>Forum Thread:</h3>
            <p>
              <a href={`/forum/thread/${puzzle.threadId}`}>
                {puzzle.threadName}
              </a>
            </p>
          </div>
        )}
        
        {puzzle.links && puzzle.links.length > 0 && (
          <div className="puzzle-links">
            <h3>Helpful Links:</h3>
            <ul>
              {puzzle.links.map((link, index) => (
                <li key={index}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    {link.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="puzzle-submission">
          <h3>Solution Submission:</h3>
          {puzzle.completed ? (
            <div className="already-solved">
              <p>You've already solved this puzzle. Great job!</p>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit}>
                <input
                  name="solution"
                  placeholder="Enter solution keyword"
                  className="solution-input"
                  disabled={submitting}
                  autoComplete="off"
                />
                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={submitting}
                >
                  {submitting ? 'Checking...' : 'Submit Solution'}
                </button>
              </form>
              
              {message && (
                <div className={`submission-message ${message.type}`}>
                  {message.text}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PuzzleDetail;
import React from 'react';
import './Puzzles.css';

const PuzzleDetail = ({ puzzle, onClose }) => {
  return (
    <div className="puzzle-detail-modal">
      <button onClick={onClose} className="modal-close-button">✕</button>
      <h2>{puzzle.name}</h2>
      <div className="difficulty-rating">
        <span>Difficulty: {puzzle.difficulty}</span>
      </div>
      <p className="puzzle-description">{puzzle.description}</p>
      {puzzle.link && (
        <div className="puzzle-link">
          <a href={puzzle.link} target="_blank" rel="noopener noreferrer">
            Open Puzzle
          </a>
        </div>
      )}
    </div>
  );
};

export default PuzzleDetail;
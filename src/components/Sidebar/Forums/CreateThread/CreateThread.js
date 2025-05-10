import React, { useState } from 'react';
import './CreateThread.css';

const CreateThread = ({ puzzles, onCreateThread }) => {
  const [threadTitle, setThreadTitle] = useState('');
  const [threadDescription, setThreadDescription] = useState('');
  const [requiredPuzzleId, setRequiredPuzzleId] = useState(null);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!threadTitle.trim()) {
      alert('Please enter a thread title');
      return;
    }
    
    const newThread = {
      name: threadTitle,
      description: threadDescription,
      requiredPuzzleId
    };
    
    onCreateThread(newThread);
    
    // Reset form
    setThreadTitle('');
    setThreadDescription('');
    setRequiredPuzzleId(null);
  };
  
  return (
    <div className="create-thread-container">
      <div className="create-thread-card">
        <h2>Create a New Discussion Thread</h2>
        <p className="create-instruction">
          Create a new forum thread that can be unlocked by solving specific puzzles.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="thread-title">Thread Title</label>
            <input
              type="text"
              id="thread-title"
              value={threadTitle}
              onChange={(e) => setThreadTitle(e.target.value)}
              placeholder="Enter a title for your thread"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="thread-description">Description</label>
            <textarea
              id="thread-description"
              value={threadDescription}
              onChange={(e) => setThreadDescription(e.target.value)}
              placeholder="What is this thread about?"
              rows="3"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="required-puzzle">Require Puzzle to Access</label>
            <select
              id="required-puzzle"
              value={requiredPuzzleId || 'none'}
              onChange={(e) => setRequiredPuzzleId(e.target.value === 'none' ? null : parseInt(e.target.value))}
            >
              <option value="none">No Puzzle Required (Public Thread)</option>
              {puzzles.map(puzzle => (
                <option key={puzzle.id} value={puzzle.id}>
                  Require "{puzzle.name}" completion
                </option>
              ))}
            </select>
          </div>
          
          <div className="thread-preview">
            <h4>Preview</h4>
            <div className={`forum-thread-preview ${requiredPuzzleId ? 'locked-preview' : ''}`}>
              <h3>{threadTitle || 'Thread Title'}</h3>
              <p>
                {requiredPuzzleId ? (
                  <>🔒 Locked. Complete "{puzzles.find(p => p.id === Number(requiredPuzzleId))?.name}" to unlock.</>
                ) : (
                  threadDescription || 'Thread description will appear here'
                )}
              </p>
            </div>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="create-button">Create Thread</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateThread;
import './Puzzles.css';

const PuzzlePage = ({ puzzles, handlePuzzleAttempt }) => (
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
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const input = e.target.elements[`keyword-${puzzle.id}`].value.trim().toLowerCase();
                handlePuzzleAttempt(puzzle.id, input);
              }}
            >
              <input
                name={`keyword-${puzzle.id}`}
                placeholder="Enter solution keyword"
                disabled={puzzle.completed}
              />
              <button type="submit" disabled={puzzle.completed}>Submit</button>
            </form>
            {puzzle.completed && <p>✅ Solved!</p>}
          </div>
        ))}
      </div>
    </>
  );
  
  export default PuzzlePage;
  
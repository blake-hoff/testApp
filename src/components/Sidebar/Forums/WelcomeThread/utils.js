import React from 'react';

export const handleVote = (
    itemId,  
    action,
    voteStates,
    setVoteStates,
    setItems,           
    itemType    
  ) => {
    const voteKey = `${itemType}-${itemId}-vote`;
    const storedVote = localStorage.getItem(voteKey); // 'upvote', 'downvote', or null

    let newVote = null;
    if (storedVote !== action) {
      newVote = action;
    }

    const basePage = "https://blakehoff.pythonanywhere.com/api/";

    fetch(basePage + `${itemType}/${itemId}/vote`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: newVote })
    })
      .then(() => {
        // Update local state counts
        setItems(prevItems =>
          prevItems.map(item => {
            if (item.id !== itemId) return item;

            let upvotes = item.upvotes ?? 0;
            let downvotes = item.downvotes ?? 0;

            if (storedVote === 'upvote') upvotes--;
            if (storedVote === 'downvote') downvotes--;

            if (newVote === 'upvote') upvotes++;
            if (newVote === 'downvote') downvotes++;

            return { ...item, upvotes, downvotes };
          })
        );
        setVoteStates(prev => ({
          ...prev,
          [itemId]: newVote
        }));

        if (newVote) {
          localStorage.setItem(voteKey, newVote);
        } else {
          localStorage.removeItem(voteKey);  // If they unvote
        }
      });
  };
  
const VoteControls = ({ itemId, voteStates, setVoteStates, setItems, itemType, votes, handleVote }) => {
  const netVotes = (votes.upvotes ?? 0) - (votes.downvotes ?? 0);

  return (
    <div className="vote-column">
      <button
        className={`vote-btn ${voteStates[itemId] === 'upvote' ? 'active-upvote' : ''}`}
        onClick={() => handleVote(itemId, 'upvote', voteStates, setVoteStates, setItems, itemType)}
      >
        ▲
      </button>

      <span className="vote-count">
        {netVotes >= 0 ? '+' : ''}
        {netVotes}
      </span>

      <button
        className={`vote-btn ${voteStates[itemId] === 'downvote' ? 'active-downvote' : ''}`}
        onClick={() => handleVote(itemId, 'downvote', voteStates, setVoteStates, setItems, itemType)}
      >
        ▼
      </button>
    </div>
  );
};

export default VoteControls;

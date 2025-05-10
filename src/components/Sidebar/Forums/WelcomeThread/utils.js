import React from 'react';

export const handleVote = (
    itemId,  
    action,
    voteStates,
    setVoteStates,
    setItems,           
    itemType    
  ) => {
    const currentVote = voteStates[itemId];
    // const basePage = "http://localhost:5000/api/"
    const basePage = "https://blakehoff.pythonanywhere.com/api/"
  
    let newVote;
    if (currentVote === action) {
      newVote = null;
    } else {
      newVote = action;
    }
  
    fetch(basePage + `${itemType}/${itemId}/vote`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: newVote })
    })
      .then(() => {
        setItems(prevItems =>
          prevItems.map(item => {
            if (item.id !== itemId) return item;
  
            let newUpvotes = item.upvotes ?? 0;
            let newDownvotes = item.downvotes ?? 0;
  
            if (currentVote === 'upvote') newUpvotes--;
            if (currentVote === 'downvote') newDownvotes--;
            if (newVote === 'upvote') newUpvotes++;
            if (newVote === 'downvote') newDownvotes++;
  
            return {
              ...item,
              upvotes: newUpvotes,
              downvotes: newDownvotes
            };
          })
        );
        setVoteStates(prev => ({
          ...prev,
          [itemId]: newVote
        }));
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

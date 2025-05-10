import React, { useState, useEffect } from 'react';
import VoteControls, { handleVote } from './WelcomeThread/utils';
import WelcomeThread from './WelcomeThread/WelcomeThread';
import CreateThread from './CreateThread/CreateThread';
import './Forums.css';
import ConfirmDeleteDialog from './ConfirmDeleteDialog/ConfirmDeleteDialog';
import { filterAndSortThreads } from './utils';
import { Trash2, Lock, Unlock, Search, Puzzle } from 'lucide-react';

const ForumsPage = ({
  threads,
  setThreads,
  puzzles,
  currentThread,
  setCurrentThread,
  currentUser,
  threadVoteStates,
  setThreadVoteStates,
  isUnlocked,
  addNewThread,
  setActiveSidebarItem
}) => {
  const [threadsPerPage, setThreadsPerPage] = useState(3);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortOption, setSortOption] = useState('recent');

  const [currentPage, setCurrentPage] = useState(1);
  const indexOfLastThread = currentPage * threadsPerPage;
  const indexOfFirstThread = indexOfLastThread - threadsPerPage;
  const filteredThreads = filterAndSortThreads(threads, {
    searchQuery,
    filterStatus,
    sortOption,
    isUnlocked
  });
  
  const currentThreads = filteredThreads.slice(indexOfFirstThread, indexOfLastThread);
  const totalPages = Math.ceil(filteredThreads.length / threadsPerPage);

  const [isCreatingThread, setIsCreatingThread] = useState(false);

  // const basePage = "http://localhost:5000/api/"
  const basePage = "https://blakehoff.pythonanywhere.com/api/"

  const CategoryChip = ({ isUnlocked }) => (
    <div className={`chip ${isUnlocked ? 'unlocked' : 'locked'}`}>
      {isUnlocked ? <Unlock size={14} /> : <Lock size={14} />}
      <span>{isUnlocked ? 'Unlocked' : 'Locked'}</span>
    </div>
  );
  
  const PuzzleChip = ({ name }) => {
    if (!name) return null;
    return (
      <div className="chip puzzle-chip">
        <Puzzle size={14} /> {name}
      </div>
    );
  };

  const renderThreadControls = () => (
    <div className="forum-controls">
    <div className="search-bar-wrapper">
      <Search size={16} className="search-icon" />
      <input
        type="text"
        className="search-bar"
        placeholder="Search threads..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        className="filter-dropdown"
      >
        <option value="all">All</option>
        <option value="unlocked">Unlocked</option>
        <option value="locked">Locked</option>
      </select>
      <select
        value={sortOption}
        onChange={(e) => setSortOption(e.target.value)}
        className="sort-dropdown"
      >
        <option value="recent">Most Recent</option>
        <option value="upvotes">Most Upvoted</option>
        <option value="comments">Most Commented</option>
      </select>
    </div>
  );
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const [threadToDelete, setThreadToDelete] = useState(null);

  const handleDeleteThread = async (threadId) => {
    await fetch(basePage + `threads/${threadId}?username=${currentUser.username}`, {
      method: 'DELETE'
    });

    setThreads(prev => prev.filter(t => t.id !== threadId));
    setThreadToDelete(null);
  };
  
  const deleteButton = (type, author, itemId) => {
    if (author !== currentUser.username) return null;
  
    const handleClick = (e) => {
      e.stopPropagation();
      if (type === 'thread') {
        setThreadToDelete(itemId);
      }
    };
  
    return (
      <button
        className="delete-button"
        title={`Delete ${type}`}
        onClick={handleClick}
      >
        <Trash2 size={16} strokeWidth={1.5} />
      </button>
    );
  };

  const renderPaginationControls = () => {
    if (currentThread || totalPages <= 1) return null;
  
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  
    return (
      <div className="pagination-controls">
        {pages.map(page => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={page === currentPage ? 'active-page' : ''}
          >
            {page}
          </button>
        ))}
      </div>
    );
  };
  
  const renderCreateThreadButton = () => (
    <button
      className="create-thread-button"
      onClick={() => {
        setIsCreatingThread(true);
        setCurrentThread(null);
        setActiveSidebarItem('forums');
      }}
    >
      + Create New Thread
    </button>
  );
  
  const handleThreadClick = (threadId) => {
    const thread = threads.find(t => t.id === threadId);
    if (thread && (thread.requiredPuzzleId === null || isUnlocked(thread.requiredPuzzleId))) {
      setCurrentThread(threadId);
    }
  };
  
  const renderThreadContent = () => {
    const thread = threads.find(t => t.id === currentThread);

    if (!thread) {
      return (
        <div className="forum-welcome">
          <h2>Welcome to the Puzzle Forums</h2>
          <p>Select a thread from the list to start discussing puzzles!</p>
        </div>
      );
    }

    if (thread.id === 1) {
      return (
        <WelcomeThread
          currentUser={currentUser}
          threads={threads}
          setThreads={setThreads}
        />
      );
    }

    return (
      <div className="forum-thread-page">
        <div className="thread-header-with-meta">
          <h2 className="thread-title">{thread.name}</h2>
          {thread.author && (
            <span className="thread-author">Posted by {thread.author}</span>
          )}
        </div>
        <p className="thread-description">{thread.description}</p>
        <div className="thread-messages">
          <p className="no-messages-yet">No messages yet. Be the first to start the conversation!</p>
        </div>
      </div>
    );
    
  };

  if (isCreatingThread) {
    return (
      <>
        <header className="forum-header">
          <h1>🧩 Create New Thread</h1>
          <p>Create a new puzzle-locked discussion thread</p>
        </header>
        <button className="back-button" onClick={() => setIsCreatingThread(false)}>
          ← Back to Forums
        </button>
        <CreateThread
          puzzles={puzzles}
          onCreateThread={(newThread) => {
            addNewThread({ ...newThread, author: currentUser.username });
            setIsCreatingThread(false);
          }}
        />
      </>
    );
  }

  return (
    <>
      <header className="forum-header">
      <h1 className="forum-heading">
        🧩 Puzzle Forums
      </h1>
        <p>Unlock features by completing puzzles!</p>
        {renderCreateThreadButton()}
      </header>

      {currentThread ? (
        <div className="forum-content">
          <button className="back-button" onClick={() => setCurrentThread(null)}>
            ← Back to Forums
          </button>
          {renderThreadContent()}
        </div>
      ) : (
        <section className="forum-content">
          {renderThreadControls()}
          {currentThreads.map(thread => {
            const unlocked = isUnlocked(thread.requiredPuzzleId);
            return (
              <div
                key={thread.id}
                className={`forum-thread ${unlocked ? 'clickable' : 'locked-thread'}`}
                onClick={() => unlocked && handleThreadClick(thread.id)}
              >
                <div className="vote-area" onClick={(e) => e.stopPropagation()}>
                  <VoteControls
                    itemId={thread.id}
                    voteStates={threadVoteStates}
                    setVoteStates={setThreadVoteStates}
                    setItems={setThreads}
                    itemType="threads"
                    votes={{
                      upvotes: thread.upvotes ?? 0,
                      downvotes: thread.downvotes ?? 0
                    }}
                    handleVote={handleVote}
                  />
                </div>

                <div className="thread-content-wrapper">
                  <div className="thread-top-bar">
                    <h3 className="thread-title">{thread.name}</h3>
                    {unlocked && thread.author && (
                    <div className="thread-meta">
                      <span className="thread-author-badge">
                        <strong>Created by</strong>&nbsp;
                        <span className="thread-author-username">@{thread.author}</span>
                      </span>
                      {deleteButton('thread', thread.author, thread.id)}
                    </div>
                  )}
                  </div>
                  {unlocked && thread.timestamp && (
                    <p className="thread-timestamp">Created: {formatDate(thread.timestamp)}</p>
                  )}
                  <p className="thread-description">
                    {unlocked
                      ? thread.description
                      : `🔒 Locked. Complete "${
                          puzzles.find(p => p.id === thread.requiredPuzzleId)?.name || 'Unknown'
                        }" to unlock.`}
                  </p>
                  {unlocked && thread.snippet && (
                    <p className="thread-snippet">{thread.snippet}</p>
                  )}
                    <div className="thread-footer">
                      <span className="thread-post-comments-bubble">
                        {unlocked ? `${thread.postCount ?? 0} comment${thread.postCount === 1 ? '' : 's'}` : 'Locked'}
                      </span>
                      <div className="chip-group">
                        <PuzzleChip name={thread.puzzleName} />
                        <CategoryChip isUnlocked={unlocked} />
                      </div>
                    </div>
                </div>
              </div>
            );
          })}
          {renderPaginationControls()}
          {threadToDelete && (
            <ConfirmDeleteDialog
              onConfirm={() => handleDeleteThread(threadToDelete)}
              onCancel={() => setThreadToDelete(null)}
            />
          )}

        </section>
        
      )}
    </>
  );
};

export default ForumsPage;

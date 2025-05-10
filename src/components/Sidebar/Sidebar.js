import React from 'react';
import './Sidebar.css';

const Sidebar = ({ currentUser, userStats, activeSidebarItem, setActiveSidebarItem, setCurrentThread }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Puzzle Platform</h2>
      </div>

      <nav className="sidebar-nav">
        {['forums', 'puzzles', 'settings'].map(item => (
          <button 
            key={item}
            className={`sidebar-button ${activeSidebarItem === item ? 'active' : ''}`}
            onClick={() => {
              setActiveSidebarItem(item);
              setCurrentThread(null);
            }}
          >
            <span className="sidebar-icon">
              {item === 'forums' ? '💬' : item === 'puzzles' ? '🧩' : '⚙️'}
            </span>
            {item.charAt(0).toUpperCase() + item.slice(1)}
          </button>
        ))}
      </nav>

      <div className="completion-stats">
        <h3>Your Progress</h3>
        <div className="stat-item">
          <span className="stat-label">Threads Unlocked:</span>
          <span className="stat-value">{userStats.threadsUnlocked}/{userStats.totalThreads}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Puzzles Completed:</span>
          <span className="stat-value">{userStats.puzzlesCompleted}/{userStats.totalPuzzles}</span>
        </div>
      </div>

      <div className="user-profile-block">
        <img
          src={`https://api.dicebear.com/6.x/thumbs/svg?seed=${currentUser.username}`}
          className="user-avatar"
        />
        <span className="user-name">{currentUser.username}</span>
      </div>

      <button
        className="logout-button"
        onClick={() => {
          localStorage.removeItem('user');
          window.location.reload();
        }}
      >
        Log Out
      </button>
    </aside>
  );
};

export default Sidebar;

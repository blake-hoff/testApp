import React, { useState, useEffect } from 'react';
import './App.css';
import Auth from './components/AuthenticationPage/Auth';
import Sidebar from './components/Sidebar/Sidebar';
import PuzzlePage from './components/Sidebar/Puzzles/Puzzles';
import SettingsPage from './components/Sidebar/Settings/Settings';
import ForumsPage from './components/Sidebar/Forums/Forums';

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [puzzles, setPuzzles] = useState([]);

  const [threads, setThreads] = useState([]);
  

  // const basePage = "http://localhost:5000/api/"
  const basePage = "https://blakehoff.pythonanywhere.com/api/"

  const [threadVoteStates, setThreadVoteStates] = useState({});
  const [currentThread, setCurrentThread] = useState(null);
  const [activeSidebarItem, setActiveSidebarItem] = useState('forums'); // 'forums', 'puzzles', 'settings', 'create'
  const [userStats, setUserStats] = useState({
    threadsUnlocked: 1,
    totalThreads: 3,
    puzzlesCompleted: 1,
    totalPuzzles: 3
  });

  useEffect(() => {
    fetch(basePage + 'threads')
      .then(res => res.json())
      .then(data => setThreads(data));
  }, []);

  useEffect(() => {
    fetch(basePage + 'puzzles')
      .then(res => res.json())
      .then(data => setPuzzles(data));
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  if (!currentUser) {
    return <Auth onLogin={user => setCurrentUser(user)} />;
  }

  const isUnlocked = (puzzleId) => {
    if (puzzleId === null || puzzleId === undefined) return true;
    const puzzle = puzzles.find(p => p.id === puzzleId);
    return puzzle ? puzzle.completed : false;
  };

  const handlePuzzleAttempt = async (puzzleId, attempt) => {
    try {
      const puzzle = puzzles.find(p => p.id === puzzleId);
      
      if (!puzzle) {
        console.error(`Puzzle with id ${puzzleId} not found`);
        return false;
      }
      
      // Just for testing - consider any non-empty attempt as correct
      if (attempt && attempt.length > 0) {
        const updatedPuzzles = puzzles.map(p => {
          if (p.id === puzzleId) {
            return { ...p, completed: true };
          }
          return p;
        });
  
        setPuzzles(updatedPuzzles);
  
        const completedCount = updatedPuzzles.filter(p => p.completed).length;
        const unlockedCount = threads.filter(t =>
          t.requiredPuzzleId === null ||
          updatedPuzzles.find(p => p.id === t.requiredPuzzleId && p.completed)
        ).length;
  
        setUserStats({
          ...userStats,
          threadsUnlocked: unlockedCount,
          puzzlesCompleted: completedCount
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error in handlePuzzleAttempt:', error);
      return false;
    }
  };

  const addNewThread = async (newThread) => {
    const timestamp = new Date().toISOString();
    const res = await fetch(basePage + 'threads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newThread,
        author: currentUser.username,
        timestamp,
        requiredPuzzleId: newThread.requiredPuzzleId ?? null
      })
    });
    const data = await res.json();  

    const threadToAdd = {
      ...newThread,
      id: data.id,
      author: currentUser.username,
      timestamp,
      requiredPuzzleId: newThread.requiredPuzzleId ?? null
    };
    
    setThreads([...threads, threadToAdd]);
    setUserStats(prev => ({
      ...prev,
      ...userStats,
      threadsUnlocked: prev.threadsUnlocked + 1,
      totalThreads: userStats.totalThreads + 1
    }));
    
    // Switch back to forums view and show the newly created thread
    setActiveSidebarItem('forums');
    setCurrentThread(data.id);
  };


  const renderMainContent = () => {
    if (activeSidebarItem === 'forums') {
      return (
        <ForumsPage
          threads={threads}
          setThreads={setThreads}
          puzzles={puzzles}
          currentThread={currentThread}
          setCurrentThread={setCurrentThread}
          currentUser={currentUser}
          threadVoteStates={threadVoteStates}
          setThreadVoteStates={setThreadVoteStates}
          isUnlocked={isUnlocked}
          addNewThread={addNewThread}
          setActiveSidebarItem={setActiveSidebarItem}
        />
      );
    } else if (activeSidebarItem === 'puzzles') {
      return (
        <PuzzlePage
          puzzles={puzzles}
          handlePuzzleAttempt={handlePuzzleAttempt}
        />
      );
    } else if (activeSidebarItem === 'settings') {
        return <SettingsPage />;
    } 
  };

  return (
    <div className="homepage-container">
      <Sidebar
        currentUser={currentUser}
        userStats={userStats}
        activeSidebarItem={activeSidebarItem}
        setActiveSidebarItem={setActiveSidebarItem}
        setCurrentThread={setCurrentThread}
      />
      <main className="forum-main">
        {renderMainContent()}
      </main>
    </div>
  );
};

export default App;
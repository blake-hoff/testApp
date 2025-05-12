import React, { useState, useEffect } from 'react';
import './App.css';
import Auth from './components/AuthenticationPage/Auth';
import Sidebar from './components/Sidebar/Sidebar';
import PuzzlePage from './components/Sidebar/Puzzles/Puzzles';
import ForumsPage from './components/Sidebar/Forums/Forums';

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [puzzles, setPuzzles] = useState([]);
  const [threads, setThreads] = useState([]);
  

  //const basePage = "http://localhost:5000/api/"
  const basePage = "https://blakehoff.pythonanywhere.com/api/"

  const [threadVoteStates, setThreadVoteStates] = useState({});
  const [currentThread, setCurrentThread] = useState(null);
  const [activeSidebarItem, setActiveSidebarItem] = useState('forums'); // 'forums', 'puzzles', 'settings', 'create'
  const [userStats, setUserStats] = useState({
    puzzlesCompleted: 0,
  });

  // Load threads
  useEffect(() => {
    fetch(basePage + 'threads')
      .then(res => res.json())
      .then(data => setThreads(data));
  }, []);

  // Load puzzles with completion status when user is available
  useEffect(() => {
    const fetchPuzzlesWithCompletion = async () => {
      try {
        // First get all puzzles
        const puzzlesResponse = await fetch(basePage + 'puzzles');
        const puzzlesData = await puzzlesResponse.json();
        
        // If user is logged in, get their completed puzzles
        if (currentUser && currentUser.id) {
          const completedResponse = await fetch(`${basePage}users/${currentUser.id}/completed-puzzles`);
          if (completedResponse.ok) {
            const completedData = await completedResponse.json();
            const completedIds = completedData.completed_puzzle_ids || [];
            
            // Mark puzzles as completed based on the user's completion data
            const updatedPuzzles = puzzlesData.map(puzzle => ({
              ...puzzle,
              completed: completedIds.includes(puzzle.id)
            }));
            
            setPuzzles(updatedPuzzles);
            
            // Update user stats based on completed puzzles
            const completedCount = updatedPuzzles.filter(p => p.completed).length;
            const unlockedCount = threads.filter(t =>
              t.requiredPuzzleId === null ||
              updatedPuzzles.find(p => p.id === t.requiredPuzzleId && p.completed)
            ).length;
            
            setUserStats(prev => ({
              ...prev,
              puzzlesCompleted: completedCount,
              threadsUnlocked: unlockedCount,
              totalPuzzles: puzzlesData.length
            }));
          } else {
            // If API call fails, still set puzzles without completion info
            setPuzzles(puzzlesData);
          }
        } else {
          // If no user, just set puzzles without completion info
          setPuzzles(puzzlesData);
        }
      } catch (error) {
        console.error('Error fetching puzzles:', error);
      }
    };
    
    fetchPuzzlesWithCompletion();
  }, [currentUser, threads]); // Re-fetch when user or threads change

  // Load user from localStorage
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
      
      // Compare the user's attempt with the puzzle's solution
      const userAttempt = attempt.trim().toLowerCase();
      const response = await fetch(`${basePage}puzzles/${puzzle.id}/attempt`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              username: currentUser.username,
              solution: userAttempt
          })
      });

      const data = await response.json();

      if (data.success === true) {
        // Only update the specific puzzle that was solved
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
          currentUser={currentUser}  // Pass the currentUser to PuzzlePage
        />
      );
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
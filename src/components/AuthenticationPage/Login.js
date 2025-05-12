import React, { useState, useRef } from 'react';
import './auth.css';
import { Puzzle } from 'lucide-react';

const FloatingPuzzles = () => {
  const puzzles = useRef(
    [...Array(30)].map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      fontSize: `${12 + Math.random() * 90}px`,
      animationDelay: `${Math.random() * 5}s`,
      animationDuration: `${3 + Math.random() * 3}s`,
    }))
  ).current;

  return (
    <div className="floating-puzzles">
      {puzzles.map((p, i) => (
        <span key={i} className="puzzle-icon" style={p}>
          🧩
        </span>
      ))}
    </div>
  );
};


const Login = ({ onLogin, onShowSignup, successMessage }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // const basePage = "http://localhost:5000/api/"
  const basePage = "https://blakehoff.pythonanywhere.com/api/"

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try { 
      const res = await fetch(basePage + 'login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
  
      if (!res.ok) {
        alert('Login failed. Check you credentials and try again.');
        return;
      }
      const user = await res.json();
      localStorage.setItem('user', JSON.stringify(user));
      onLogin(user);

    }
    catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
  <div className="login-page-wrapper">
    <FloatingPuzzles />


  <div className="welcome-card">
    
    <div className="welcome-title-row">
      <Puzzle size={48} strokeWidth={2.2} className="welcome-icon" />
      <h1 className="app-title">Welcome to Puzzle Place!</h1>
    </div>
    <p className="app-subtitle">Try puzzles. Join discussions. Earn access.</p>
  </div>

  <div className="login-container">
    <h2>Login</h2>
    <form onSubmit={handleSubmit}>
      <div className="login-input-group">
        <label>Username</label>
        <input 
          type="text"
          value={username} 
          onChange={(event) => setUsername(event.target.value)} 
          required 
        />
      </div>
      <div className="login-input-group">
        <label>Password</label>
        <input 
          type="password"
          value={password} 
          onChange={(event) => setPassword(event.target.value)} 
          required 
        />
      </div>
      <button type="submit">Log In</button>

      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}
    </form>

    <div className="signup-section">
      <p>
        Don't have an account?{' '}
        <span className="signup-link" onClick={() => onShowSignup()}>Sign Up</span>
      </p>
    </div>
  </div>
</div>


  );
};

export default Login;

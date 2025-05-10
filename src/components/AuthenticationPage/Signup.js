import React, { useState } from 'react';
import './auth.css';

const Signup = ({ onSignup, onBackToLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');

  // const basePage = "http://localhost:5000/api/"
  const basePage = "https://blakehoff.pythonanywhere.com/api/"

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const res = await fetch(basePage + 'register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email: `${username}@gmail.com`, password})
    });
    
    if (res.ok) {
      onSignup({username});
    }
    else {
      alert('Signup failed. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <h2>Create Account</h2>
      <form onSubmit={handleSubmit}>
        <div className="login-input-group">
          <label>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div className="login-input-group">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div className="login-input-group">
          <label>Bio</label>
          <input value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>
        <button type="submit">Sign Up</button>
      </form>

      <div className="signup-section">
        <p>
          Already have an account?{' '}
          <span className="signup-link" onClick={onBackToLogin}>Log In</span>
        </p>
      </div>
    </div>
  );
};

export default Signup;

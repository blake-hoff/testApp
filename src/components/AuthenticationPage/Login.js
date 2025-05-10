import React, { useState } from 'react';
import './auth.css';

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
          <div className="success-message">
            {successMessage}
          </div>
        )}

    </form>

    <div className="signup-section">
      <p>
        Don't have an account?{' '}
        {/* <a href="#" className="signup-link">Sign Up</a> */}
        <span className="signup-link" onClick={() => onShowSignup()}>Sign Up</span>
      </p>
    </div>

    </div>

  );
};

export default Login;

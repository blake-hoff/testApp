import React, { useState } from 'react';
import Login from './Login';
import Signup from './Signup';

const Auth = ({ onLogin }) => {
  const [showSignup, setShowSignup] = useState(false);
  const [loginMessage, setLoginMessage] = useState('');

  const handleSignup = (user) => {
    setLoginMessage(`Account created for ${user.username}!`);
    setShowSignup(false);
  };

  const handleShowSignup = () => {
    setLoginMessage('');
    setShowSignup(true);
  };

  const handleBackToLogin = () => {
    setLoginMessage('');
    setShowSignup(false);
  };

  return showSignup ? (
    <Signup onSignup={handleSignup} onBackToLogin={handleBackToLogin} />
  ) : (
    <Login
      onLogin={onLogin}
      onShowSignup={handleShowSignup}
      successMessage={loginMessage}
    />
  );
};

export default Auth;

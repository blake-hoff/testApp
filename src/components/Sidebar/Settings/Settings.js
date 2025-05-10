import React from 'react';
import './Settings.css';

const SettingsPage = () => {
  return (
    <>
      <header className="forum-header">
        <h1>⚙️ Settings</h1>
        <p>Configure your puzzle platform experience</p>
      </header>

      <div className="settings-container">
        <div className="settings-card">
          <h3>Account Settings</h3>
          <p>Manage your puzzle platform account</p>
          <div className="settings-form">
            <div className="form-group">
              <label>Display Name</label>
              <input type="text" defaultValue="PuzzleSolver123" />
            </div>
            <div className="form-group">
              <label>Email Notifications</label>
              <div className="toggle-switch">
                <input type="checkbox" id="email-toggle" defaultChecked />
                <label htmlFor="email-toggle"></label>
              </div>
            </div>
            <button className="settings-button">Save Changes</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPage;

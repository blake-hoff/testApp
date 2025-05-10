import React, { useState } from 'react';
import { useEffect } from 'react';
import './WelcomeThread.css';
import VoteControls, { handleVote } from './utils';
import { Trash2 } from 'lucide-react';
import ConfirmDeleteDialog from '../ConfirmDeleteDialog/ConfirmDeleteDialog';


const WelcomeThread = ({ currentUser, threads, setThreads}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [voteStates, setVoteStates] = useState({});
  const [threadVoteStates, setThreadVoteStates] = useState({});
  const [messageToDelete, setMessageToDelete] = useState(null);

  // const basePage = "http://localhost:5000/api/"
  const basePage = "https://blakehoff.pythonanywhere.com/api/"

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
  
    const newMessageObj = {
      author: currentUser.username,
      text: newMessage,
      threadId: 1
    };
  
    fetch(basePage + 'posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newMessageObj)
    })
      .then(res => res.json())
      .then(data => {
        setMessages([...messages, data]);
        setNewMessage('');
        // Increment postCount in App.js
        setThreads(prevThreads =>
          prevThreads.map(thread =>
            thread.id === 1
              ? { ...thread, postCount: (thread.postCount || 0) + 1 }
              : thread
          )
        );
      });
  };
 
  const handleDelete = (messageId) => {
    fetch(basePage + `posts/${messageId}?username=${currentUser.username}`, {
      method: 'DELETE'
    })
      .then(res => res.json())
      .then(() => {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));

        setThreads(prevThreads =>
          prevThreads.map(thread =>
            thread.id === 1
              ? { ...thread, postCount: (thread.postCount || 1) - 1 }
              : thread
          )
        );
      });
  }; 
  
  const renderDeleteButton = (messageId, author) => {
    if (author !== currentUser.username) return null;
  
    return (
      <button
        onClick={() => setMessageToDelete(messageId)}
        className="delete-button"
        title="Delete message"
      >
        <Trash2 size={18} strokeWidth={1.5} />
      </button>
    );
  };
  
  useEffect(() => {
    fetch(basePage + 'posts?threadId=1') // or whatever the real thread ID is
      .then(res => res.json())
      .then(data => setMessages(data));
  }, []);

  return (
    <div className="welcome-thread forum-thread-page">
      <div className="thread-header">
        <h2>Welcome Thread</h2>
        <p className="thread-description">Say hi to the community!</p>
      </div>
      
      <div className="messages-container">
        {messages.length > 0 ? (
          messages.map(message => (
            <div key={message.id} className="message">
              <VoteControls
                itemId={message.id}
                voteStates={voteStates}
                setVoteStates={setVoteStates}
                setItems={setMessages}
                itemType="posts"
                votes={{ upvotes: message.upvotes ?? 0, downvotes: message.downvotes ?? 0 }}
                handleVote={handleVote}
              />
              <div className="message-body">
                <div className="message-header">
                  <span className="author">{message.author}</span>
                  <span className="timestamp">{formatDate(message.timestamp)}</span>
                  {renderDeleteButton(message.id, message.author)}
                </div>
                <div className="message-content">
                  {message.text}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-messages">
            No messages yet. Be the first to post!
          </div>
        )}
      </div>
      <div className="reply-form">
        <form onSubmit={handleSubmit}>
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Write a message..."
            rows="4"
          />
          <button type="submit">Post Reply</button>
        </form>
      </div>
      {messageToDelete && (
        <ConfirmDeleteDialog
          onConfirm={() => {
            handleDelete(messageToDelete);
            setMessageToDelete(null);
          }}
          onCancel={() => setMessageToDelete(null)}
        />
      )}
    </div>
  );
};

export default WelcomeThread;
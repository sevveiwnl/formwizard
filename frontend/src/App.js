import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://localhost:5001';

function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL, {
      path: '/socket.io'
    });

    socket.on('connect', () => {
      console.log('Connected to Socket.io server');
    });

    socket.on('message', (data) => {
      setMessage(data);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.io server');
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>FormWizard Dashboard</h1>
      <p>{message}</p>
    </div>
  );
}

export default App;


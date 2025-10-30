'use client';

import { useState, useEffect } from 'react';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Login from '../components/Login';
import Lobby from '../components/Lobby';

export default function Home() {
  const [username, setUsername] = useState('');

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  const handlePlayClick = (playerName: string) => {
    setUsername(playerName);
    if (typeof window !== 'undefined') {
      localStorage.setItem('username', playerName);
      localStorage.removeItem('playerId');
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col">
        {!username ? (
          <Login username={username} handlePlayClick={handlePlayClick} />
        ) : (
          <Lobby />
        )}
      </main>
      <Footer />
    </div>
  );
}

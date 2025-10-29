'use client';

import { useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Login from '../components/Login';
import Lobby from '../components/Lobby';
import theme from '../components/theme';

export default function Home() {
  const [username, setUsername] = useState('');

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  const handlePlayClick = (username: string) => {
    setUsername(username);
    if (typeof window !== 'undefined') {
      localStorage.setItem('username', username);
      localStorage.removeItem('playerId');
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Navbar />
      {!username && (
        <Login username={username} handlePlayClick={handlePlayClick} />
      )}
      {username && <Lobby />}
      <Footer />
    </ThemeProvider>
  );
}

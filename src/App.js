import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './context/AppContext';
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import HomePage from './pages/HomePage';
import HotTakesPage from './components/HotTakes/HotTakesPage';
import TownhallPage from './components/Townhall/TownhallPage';
import CirclesPage from './components/Circles/CirclesPage';
import VerifyPage from './components/Verify/VerifyPage';
import QuestsPage from './components/Quests/QuestsPage';
import LeaderboardPage from './components/Leaderboard/LeaderboardPage';
import ProfilePage from './components/Profile/ProfilePage';
import GamesPage from './components/Games/GamesPage';
import WalletPage from './pages/WalletPage';
import './App.css';

function App() {
  const { user } = useApp();

  if (!user) {
    return <Login />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/hottake" element={<HotTakesPage />} />
        <Route path="/townhall" element={<TownhallPage />} />
        <Route path="/circles" element={<CirclesPage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/quests" element={<QuestsPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/games" element={<GamesPage />} />
        <Route path="*" element={<Navigate to="/" />} />
        <Route path="/wallet" element={<WalletPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
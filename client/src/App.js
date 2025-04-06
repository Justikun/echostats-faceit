import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

// Default to production URLs if environment variables are not set
const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'https://api-echostats.jnury.com';

// Configure axios defaults
axios.defaults.baseURL = SERVER_URL;

console.log('Using SERVER_URL:', SERVER_URL);

const App = () => {
  const [nickname, setNickname] = useState('');
  const [playerData, setPlayerData] = useState(null);
  const [matchHistory, setMatchHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreMatches, setHasMoreMatches] = useState(true);

  const fetchPlayerData = async (searchNickname = nickname) => {
    if (!searchNickname.trim()) return;
    
    setLoading(true);
    setError('');
    setMatchHistory(null);
    setCurrentPage(0);
    setHasMoreMatches(true);
    try {
      const response = await axios.get(`/api/player?nickname=${encodeURIComponent(searchNickname)}`);
      setPlayerData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error fetching player data');
      setPlayerData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchHistory = async (page = 0) => {
    if (!playerData?.player_id) return;
    
    setHistoryLoading(true);
    try {
      const response = await axios.get(`/api/history/${playerData.player_id}?offset=${page * 20}&limit=20`);
      if (!response.data?.items) {
        throw new Error('No match history data available');
      }
      
      if (page === 0) {
        setMatchHistory(response.data);
      } else {
        setMatchHistory(prev => ({
          ...response.data,
          items: [...(prev?.items || []), ...response.data.items]
        }));
      }
      
      setHasMoreMatches(response.data.items.length === 20);
    } catch (err) {
      setError(err.response?.data?.error || 'Error fetching match history');
      if (page === 0) {
        setMatchHistory(null);
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchPlayerData();
  };

  const loadMoreMatches = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchMatchHistory(nextPage);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1>Faceit Stats</h1>
          <form onSubmit={handleSubmit} className="search-form">
            <div className="search-input-container">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter Faceit nickname"
                className="search-input"
              />
              <button type="submit" className="search-button" disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>
        </div>
      </header>

      <main className="main-content">
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {playerData && (
          <section className="player-section">
            <div className="player-card">
              <div className="player-profile">
                <img 
                  src={playerData.avatar} 
                  alt={`${playerData.nickname}'s avatar`} 
                  className="player-avatar"
                />
                <div className="player-info">
                  <h2>{playerData.nickname}</h2>
                  <p className="player-country">{playerData.country}</p>
                </div>
              </div>
              
              <div className="player-stats">
                <div className="stat-card">
                  <span className="stat-label">Level</span>
                  <span className="stat-value">{playerData.games?.cs2?.skill_level || 'N/A'}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Elo</span>
                  <span className="stat-value">{playerData.games?.cs2?.faceit_elo || 'N/A'}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Region</span>
                  <span className="stat-value">{playerData.games?.cs2?.region || 'N/A'}</span>
                </div>
              </div>

              <button 
                onClick={() => fetchMatchHistory(0)} 
                className="history-button"
                disabled={historyLoading}
              >
                {historyLoading ? 'Loading...' : 'View Match History'}
              </button>
            </div>
          </section>
        )}

        {matchHistory && (
          <section className="matches-section">
            <h3>Recent Matches</h3>
            <div className="matches-grid">
              {matchHistory.items.map((match) => (
                <div key={match.match_id} className="match-card">
                  <div className="match-header">
                    <span className="match-date">{formatDate(match.started_at)}</span>
                    {match.competition_name && (
                      <span className="match-competition">{match.competition_name}</span>
                    )}
                  </div>
                  
                  <div className="match-teams">
                    <div className={`team ${match.results.winner === 'faction1' ? 'winner' : ''}`}>
                      <span className="team-name">{match.teams.faction1.name}</span>
                      <span className="team-score">{match.teams.faction1.score}</span>
                    </div>
                    <div className={`team ${match.results.winner === 'faction2' ? 'winner' : ''}`}>
                      <span className="team-name">{match.teams.faction2.name}</span>
                      <span className="team-score">{match.teams.faction2.score}</span>
                    </div>
                  </div>
                  
                  <div className="match-footer">
                    <span className="game-mode">{match.game_mode}</span>
                  </div>
                </div>
              ))}
            </div>
            
            {hasMoreMatches && (
              <button 
                onClick={loadMoreMatches} 
                className="load-more-button"
                disabled={historyLoading}
              >
                {historyLoading ? 'Loading...' : 'Load More Matches'}
              </button>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default App;

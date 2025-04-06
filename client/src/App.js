import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';
import { getRecentSearches, addRecentSearch, setCookie } from './utils/cookies';

// Default to production URLs if environment variables are not set
const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'https://api-echostats.jnury.com';

// Configure axios defaults
axios.defaults.baseURL = SERVER_URL;

console.log('Using SERVER_URL:', SERVER_URL);

const App = () => {
  const [nickname, setNickname] = useState('');
  const [playerData, setPlayerData] = useState(null);
  const [matchHistory, setMatchHistory] = useState(null);
  const [bans, setBans] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [bansLoading, setBansLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreMatches, setHasMoreMatches] = useState(true);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const searchWrapperRef = useRef(null);

  useEffect(() => {
    setRecentSearches(getRecentSearches());

    // Add click outside listener
    const handleClickOutside = (event) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
        setShowSearchHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Add new useEffect to fetch match history when switching to match history tab
  useEffect(() => {
    if (activeTab === 'matches' && playerData && !matchHistory) {
      fetchMatchHistory(0);
    }
  }, [activeTab, playerData]);

  const fetchPlayerData = async (searchNickname = nickname) => {
    if (!searchNickname.trim()) return;
    
    setLoading(true);
    setError('');
    setMatchHistory(null);
    setBans(null);
    setCurrentPage(0);
    setHasMoreMatches(true);
    try {
      const response = await axios.get(`/api/player?nickname=${encodeURIComponent(searchNickname)}`);
      setPlayerData(response.data);
      fetchBans(response.data.player_id);
      addRecentSearch(searchNickname);
      setRecentSearches(getRecentSearches());
    } catch (err) {
      setError(err.response?.data?.error || 'Error fetching player data');
      setPlayerData(null);
    } finally {
      setLoading(false);
      setShowSearchHistory(false);
    }
  };

  const fetchBans = async (playerId) => {
    if (!playerId) return;
    
    setBansLoading(true);
    try {
      const response = await axios.get(`/api/bans/${playerId}`);
      setBans(response.data);
    } catch (err) {
      console.error('Error fetching bans:', err);
      setBans(null);
    } finally {
      setBansLoading(false);
    }
  };

  const fetchMatchHistory = async (page = 0) => {
    if (!playerData?.player_id) return;
    
    setHistoryLoading(true);
    try {
      const response = await axios.get(`/api/history/${playerData.player_id}?offset=${page * 10}&limit=10`);
      console.log('Match History Response:', response.data);
      
      if (!response.data?.items) {
        throw new Error('No match history data available');
      }
      
      // Debug log for first match
      if (response.data.items.length > 0) {
        const firstMatch = response.data.items[0];
        console.log('First match details:', {
          match_id: firstMatch.match_id,
          teams: firstMatch.teams,
          faction1Players: firstMatch.teams?.faction1?.players,
          faction2Players: firstMatch.teams?.faction2?.players
        });
      }
      
      if (page === 0) {
        setMatchHistory(response.data);
      } else {
        setMatchHistory(prev => ({
          ...response.data,
          items: [...(prev?.items || []), ...response.data.items]
        }));
      }
      
      setHasMoreMatches(response.data.items.length === 10);
    } catch (err) {
      console.error('Error fetching match history:', err);
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
    const date = new Date(timestamp * 1000);
    return `${date.toLocaleDateString()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const truncateName = (name) => {
    return name.length > 12 ? name.substring(0, 12) + '...' : name;
  };

  const handleSearchClick = (searchNickname) => {
    setNickname(searchNickname);
    fetchPlayerData(searchNickname);
  };

  const handleClearSearch = (searchToRemove, e) => {
    e.stopPropagation(); // Prevent triggering the search click
    const updatedSearches = recentSearches.filter(search => search !== searchToRemove);
    setCookie('recentSearches', JSON.stringify(updatedSearches));
    setRecentSearches(updatedSearches);
  };

  const getSkillLevelInfo = (elo) => {
    const ranges = [
      { level: 1, min: 100, max: 800 },
      { level: 2, min: 801, max: 950 },
      { level: 3, min: 951, max: 1100 },
      { level: 4, min: 1101, max: 1250 },
      { level: 5, min: 1251, max: 1400 },
      { level: 6, min: 1401, max: 1550 },
      { level: 7, min: 1551, max: 1700 },
      { level: 8, min: 1701, max: 1850 },
      { level: 9, min: 1851, max: 2000 },
      { level: 10, min: 2001, max: 3000 } // Using 3000 as a reasonable max for visualization
    ];

    const currentRange = ranges.find(range => 
      elo >= range.min && (elo <= range.max || range.level === 10)
    ) || ranges[0];

    // For level 10, show progress up to Challenger (top 1000)
    const progress = currentRange.level === 10
      ? Math.min(((elo - currentRange.min) / 500) * 100, 100) // Show progress for first 500 Elo in level 10
      : Math.min(((elo - currentRange.min) / (currentRange.max - currentRange.min)) * 100, 100);

    const getLevelColorClass = (level) => {
      if (level === 1) return 'level-1';
      if (level <= 3) return 'level-2-3';
      if (level <= 7) return 'level-4-7';
      if (level <= 9) return 'level-8-9';
      return 'level-10';
    };

    return {
      currentLevel: currentRange.level,
      progress: progress,
      range: currentRange.level === 10 ? `${currentRange.min}+` : `${currentRange.min} - ${currentRange.max}`,
      colorClass: getLevelColorClass(currentRange.level)
    };
  };

  return (
    <div className="app-container">
      <nav className="top-nav">
        <div className="nav-content">
          <div className="nav-left">
            <h1>EchoStats</h1>
          </div>
          <div className="nav-center">
            <form onSubmit={handleSubmit} className="search-form">
              <div className="search-input-container">
                <div className="search-wrapper" ref={searchWrapperRef}>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    onFocus={() => setShowSearchHistory(true)}
                    placeholder="Search Player..."
                    className="search-input"
                  />
                  {showSearchHistory && recentSearches.length > 0 && (
                    <div className="search-history-dropdown">
                      {recentSearches.map((search, index) => (
                        <div
                          key={index}
                          className="search-history-item"
                          onClick={() => handleSearchClick(search)}
                        >
                          <span>{search}</span>
                          <span 
                            className="search-history-clear"
                            onClick={(e) => handleClearSearch(search, e)}
                          >
                            ×
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>
          <div className="nav-right">
            {/* Add any right nav items here */}
          </div>
        </div>
      </nav>

      <main className="main-content">
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {playerData && (
          <>
            <div className="player-header">
              <div className="player-info-container">
                <div className="player-avatar-wrapper">
                  <img 
                    src={playerData.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(playerData.nickname) + '&background=2d2d2d&color=fff'} 
                    alt={`${playerData.nickname}'s avatar`} 
                    className="player-avatar"
                    onError={(e) => {
                      e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(playerData.nickname) + '&background=2d2d2d&color=fff';
                    }}
                  />
                </div>
                <div className="player-details">
                  <h2>{truncateName(playerData.nickname)}</h2>
                  <div className="player-meta">
                    <span className="player-country">{playerData.country}</span>
                    <span className="player-elo">Elo: {playerData.games?.cs2?.faceit_elo || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="stats-overview">
              <div className="stats-card">
                <h3>FACEIT Skill Level</h3>
                <div className="stats-details">
                  <div className="rank-info">
                    {(() => {
                      const elo = playerData.games?.cs2?.faceit_elo || 0;
                      const levelInfo = getSkillLevelInfo(elo);
                      return (
                        <>
                          <div className="rank-label">
                            <div className={`skill-level-icon ${levelInfo.colorClass}`}>
                            </div>
                            <span>Level {playerData.games?.cs2?.skill_level || 'N/A'}</span>
                          </div>
                          <div className={`rank-elo ${levelInfo.colorClass}`}>{elo} Elo</div>
                          <div className="level-bar-container">
                            <div 
                              className={`level-bar ${levelInfo.colorClass}`}
                              style={{ width: `${levelInfo.progress}%` }}
                            />
                          </div>
                          <div className="level-markers">
                            {Array.from({ length: 10 }, (_, i) => (
                              <div 
                                key={i} 
                                className={`level-marker ${i < levelInfo.currentLevel ? `active ${levelInfo.colorClass}` : ''}`}
                              />
                            ))}
                          </div>
                          <div className="level-range">
                            Range: {levelInfo.range} Elo
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="content-wrapper">
                <div className="content-tabs">
                  <button 
                    className={`tab-button ${activeTab === 'matches' ? 'active' : ''}`}
                    onClick={() => setActiveTab('matches')}
                  >
                    Match History
                  </button>
                  <button 
                    className={`tab-button ${activeTab === 'live' ? 'active' : ''}`}
                    onClick={() => setActiveTab('live')}
                  >
                    Live Game
                  </button>
                  <button 
                    className={`tab-button ${activeTab === 'highlights' ? 'active' : ''}`}
                    onClick={() => setActiveTab('highlights')}
                  >
                    Highlights
                  </button>
                </div>

                {activeTab === 'matches' && (
                  <div className="match-history">
                    <div className="history-header">
                      <h3>Match History</h3>
                      <div className="history-filters">
                      </div>
                    </div>
                    
                    {historyLoading && !matchHistory ? (
                      <div className="loading-message">Loading matches...</div>
                    ) : matchHistory && matchHistory.items.map((match) => {
                      console.log('Match teams structure:', {
                        faction1: match.teams?.faction1,
                        faction2: match.teams?.faction2
                      });
                      
                      // Ensure we have valid team data before rendering
                      const faction1Players = match.teams?.faction1?.players || [];
                      const faction2Players = match.teams?.faction2?.players || [];
                      
                      return (
                        <div key={match.match_id} className="match-row">
                          <div className="match-info">
                            <div className="match-type">{match.game_mode}</div>
                            <div className="match-result">
                              <span className={match.results?.winner === 'faction1' ? 'victory' : 'defeat'}>
                                {match.results?.winner === 'faction1' ? 'Victory' : 'Defeat'}
                              </span>
                              <span className="match-score">
                                {match.results?.score?.faction1 || 0} - {match.results?.score?.faction2 || 0}
                              </span>
                            </div>
                            <div className="match-date">{formatDate(match.started_at)}</div>
                          </div>
                          <div className="match-teams">
                            <div className="team team-1">
                              {faction1Players.map((player) => (
                                <div key={player.player_id} className="player-item">
                                  <div className="player-avatar-small">
                                    <img 
                                      src={player.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(player.nickname) + '&background=2d2d2d&color=fff'} 
                                      alt={player.nickname}
                                      onError={(e) => {
                                        e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(player.nickname) + '&background=2d2d2d&color=fff';
                                      }}
                                    />
                                  </div>
                                  <span className="player-name">{truncateName(player.nickname)}</span>
                                </div>
                              ))}
                            </div>
                            <div className="team-divider">VS</div>
                            <div className="team team-2">
                              {faction2Players.map((player) => (
                                <div key={player.player_id} className="player-item">
                                  <div className="player-avatar-small">
                                    <img 
                                      src={player.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(player.nickname) + '&background=2d2d2d&color=fff'} 
                                      alt={player.nickname}
                                      onError={(e) => {
                                        e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(player.nickname) + '&background=2d2d2d&color=fff';
                                      }}
                                    />
                                  </div>
                                  <span className="player-name">{truncateName(player.nickname)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {hasMoreMatches && (
                      <div className="load-more-container">
                        <button 
                          className="load-more-button"
                          onClick={loadMoreMatches}
                          disabled={historyLoading}
                        >
                          {historyLoading ? 'Loading...' : 'Load More Matches'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default App;

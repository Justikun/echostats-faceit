const express = require("express");
const axios = require("axios");
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const FACEIT_API_KEY = process.env.FACEIT_API_KEY;
const SERVER_URL = process.env.SERVER_URL || 'https://api-echostats.jnury.com';

// Allow both development and production URLs
const ALLOWED_ORIGINS = [
  'https://echostats.jnury.com',
  'http://localhost:3000'
];

console.log('Server Configuration:', {
  SERVER_URL,
  ALLOWED_ORIGINS
});

if (!FACEIT_API_KEY) {
  console.error('FACEIT_API_KEY is required in environment variables');
  process.exit(1);
}

// Enable CORS with specific configuration
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Helper function to handle Faceit API errors
const handleFaceitError = (error, res) => {
  console.error("Faceit API Error:", {
    message: error.message,
    response: error.response ? {
      status: error.response.status,
      data: error.response.data,
      headers: error.response.headers
    } : 'No response'
  });

  if (error.response) {
    switch (error.response.status) {
      case 400:
        return res.status(400).json({ error: "Bad request" });
      case 401:
        return res.status(401).json({ error: "Invalid API key" });
      case 403:
        return res.status(403).json({ error: "Forbidden" });
      case 404:
        return res.status(404).json({ error: "Player not found" });
      case 429:
        return res.status(429).json({ 
          error: "Rate limit exceeded",
          retryAfter: error.response.headers['retry-after']
        });
      case 503:
        return res.status(503).json({ error: "Faceit service temporarily unavailable" });
      default:
        return res.status(500).json({ 
          error: "Failed to fetch data from Faceit",
          message: error.response.data
        });
    }
  }
  
  return res.status(500).json({ 
    error: "Internal server error",
    message: error.message
  });
};

// Get player data
app.get("/api/player", async (req, res) => {
  const nickname = req.query.nickname;
  
  if (!nickname) {
    return res.status(400).json({ error: "Nickname is required" });
  }

  console.log('Fetching player data for:', {
    nickname: nickname
  });

  try {
    const url = `https://open.faceit.com/data/v4/players?nickname=${encodeURIComponent(nickname)}`;
    const response = await axios.get(
      url,
      { 
        headers: { 
          Authorization: `Bearer ${FACEIT_API_KEY}`,
          'Accept': 'application/json',
          'game': 'cs2'
        } 
      }
    );
    
    const playerData = response.data;
    console.log('Player Data Response:', {
      nickname: nickname,
      player_id: playerData.player_id,
      raw_response: response.data
    });
    
    // Format the response to include only relevant data
    const formattedData = {
      player_id: playerData.player_id,
      nickname: playerData.nickname,
      avatar: playerData.avatar,
      country: playerData.country,
      faceit_url: playerData.faceit_url,
      games: {
        cs2: {
          skill_level: playerData.games?.cs2?.skill_level,
          faceit_elo: playerData.games?.cs2?.faceit_elo,
          region: playerData.games?.cs2?.region,
          game_player_id: playerData.games?.cs2?.game_player_id,
          game_player_name: playerData.games?.cs2?.game_player_name,
          skill_level_label: playerData.games?.cs2?.skill_level_label,
          regions: playerData.games?.cs2?.regions
        }
      },
      membership_type: playerData.membership_type,
      memberships: playerData.memberships,
      verified: playerData.verified
    };
    
    res.json(formattedData);
  } catch (error) {
    handleFaceitError(error, res);
  }
});

// Get player match history
app.get("/api/history/:playerId", async (req, res) => {
  const playerId = req.params.playerId;
  const offset = parseInt(req.query.offset) || 0;
  const limit = parseInt(req.query.limit) || 10;
  
  if (!playerId) {
    return res.status(400).json({ error: "Player ID is required" });
  }

  console.log('Fetching match history for player:', {
    player_id: playerId,
    offset: offset,
    limit: limit
  });

  try {
    const url = `https://open.faceit.com/data/v4/players/${playerId}/history?game=cs2&offset=${offset}&limit=${limit}`;
    
    const response = await axios.get(
      url,
      { 
        headers: { 
          Authorization: `Bearer ${FACEIT_API_KEY}`,
          'Accept': 'application/json'
        } 
      }
    );

    console.log('Match History Response:', {
      player_id: playerId,
      total_matches: response.data.items?.length,
      raw_response: response.data
    });

    // Format the response data
    const formattedMatches = response.data.items.map(match => ({
      match_id: match.match_id,
      started_at: match.started_at,
      finished_at: match.finished_at,
      game_mode: match.game_mode,
      competition_id: match.competition_id,
      competition_name: match.competition_name,
      competition_type: match.competition_type,
      organizer_id: match.organizer_id,
      teams: {
        faction1: {
          team_id: match.teams.faction1.team_id,
          nickname: match.teams.faction1.nickname,
          avatar: match.teams.faction1.avatar,
          players: match.teams.faction1.players || [],
          score: match.results.score.faction1 || 0
        },
        faction2: {
          team_id: match.teams.faction2.team_id,
          nickname: match.teams.faction2.nickname,
          avatar: match.teams.faction2.avatar,
          players: match.teams.faction2.players || [],
          score: match.results.score.faction2 || 0
        }
      },
      results: {
        winner: match.results.winner,
        score: match.results.score
      }
    }));

    // Sort matches by date (newest first)
    formattedMatches.sort((a, b) => b.started_at - a.started_at);

    res.json({
      start: offset,
      end: offset + formattedMatches.length,
      items: formattedMatches
    });
  } catch (error) {
    handleFaceitError(error, res);
  }
});

// Get player bans
app.get("/api/bans/:playerId", async (req, res) => {
  const playerId = req.params.playerId;
  
  if (!playerId) {
    return res.status(400).json({ error: "Player ID is required" });
  }

  console.log('Fetching bans for player:', {
    player_id: playerId
  });

  try {
    const url = `https://open.faceit.com/data/v4/players/${playerId}/bans`;
    
    const response = await axios.get(
      url,
      { 
        headers: { 
          Authorization: `Bearer ${FACEIT_API_KEY}`,
          'Accept': 'application/json'
        } 
      }
    );

    console.log('Bans Response:', {
      player_id: playerId,
      total_bans: response.data.items?.length,
      raw_response: response.data
    });

    res.json(response.data);
  } catch (error) {
    handleFaceitError(error, res);
  }
});

// Get match details
app.get("/api/matches/:matchId", async (req, res) => {
  const matchId = req.params.matchId;
  
  if (!matchId) {
    return res.status(400).json({ error: "Match ID is required" });
  }

  console.log('Fetching match details:', {
    match_id: matchId
  });

  try {
    const url = `https://open.faceit.com/data/v4/matches/${matchId}`;
    
    const response = await axios.get(
      url,
      { 
        headers: { 
          Authorization: `Bearer ${FACEIT_API_KEY}`,
          'Accept': 'application/json'
        } 
      }
    );

    // Get match stats for Elo changes
    const statsUrl = `https://open.faceit.com/data/v4/matches/${matchId}/stats`;
    const statsResponse = await axios.get(
      statsUrl,
      { 
        headers: { 
          Authorization: `Bearer ${FACEIT_API_KEY}`,
          'Accept': 'application/json'
        } 
      }
    );

    const matchData = response.data;
    const statsData = statsResponse.data;

    // Format the response to include match details and stats
    const formattedData = {
      match_id: matchData.match_id,
      game_mode: matchData.game_mode,
      started_at: matchData.started_at,
      finished_at: matchData.finished_at,
      status: matchData.status,
      teams: {
        faction1: {
          ...matchData.teams.faction1,
          roster: matchData.teams.faction1.roster.map(player => ({
            ...player,
            player_stats: statsData.rounds[0]?.teams[0]?.players.find(p => p.player_id === player.player_id) || null
          }))
        },
        faction2: {
          ...matchData.teams.faction2,
          roster: matchData.teams.faction2.roster.map(player => ({
            ...player,
            player_stats: statsData.rounds[0]?.teams[1]?.players.find(p => p.player_id === player.player_id) || null
          }))
        }
      },
      results: matchData.results,
      stats: statsData
    };

    res.json(formattedData);
  } catch (error) {
    handleFaceitError(error, res);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

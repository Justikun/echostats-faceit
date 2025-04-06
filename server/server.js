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
  const offset = 0; // Fixed offset of 0
  const limit = 3; // Fixed limit of 3 matches per request
  
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
          name: match.teams.faction1.name,
          avatar: match.teams.faction1.avatar,
          roster: match.teams.faction1.roster,
          score: match.results.score.faction1 || 0
        },
        faction2: {
          team_id: match.teams.faction2.team_id,
          name: match.teams.faction2.name,
          avatar: match.teams.faction2.avatar,
          roster: match.teams.faction2.roster,
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
      start: response.data.start,
      end: response.data.end,
      items: formattedMatches
    });
  } catch (error) {
    handleFaceitError(error, res);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

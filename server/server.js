const fastify = require("fastify")({ logger: true });
const axios = require("axios");
const cors = require('@fastify/cors');
require('dotenv').config();

const PORT = process.env.PORT || 5001;
const FACEIT_API_KEY = process.env.FACEIT_API_KEY;
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5001';

// Allow both development and production URLs
const ALLOWED_ORIGINS = [
  'https://echostats.jnury.com',
  'http://localhost:3000',
  'http://192.168.1.170:3000'
];

fastify.log.info('Server Configuration:', {
  SERVER_URL,
  ALLOWED_ORIGINS
});

if (!FACEIT_API_KEY) {
  fastify.log.error('FACEIT_API_KEY is required in environment variables');
  process.exit(1);
}

// Register CORS
fastify.register(cors, {
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error('Not allowed by CORS'), false);
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
});

// Helper function to handle Faceit API errors
const handleFaceitError = (error, reply) => {
  fastify.log.error("Faceit API Error:", {
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
        return reply.code(400).send({ error: "Bad request" });
      case 401:
        return reply.code(401).send({ error: "Invalid API key" });
      case 403:
        return reply.code(403).send({ error: "Forbidden" });
      case 404:
        return reply.code(404).send({ error: "Player not found" });
      case 429:
        return reply.code(429).send({ 
          error: "Rate limit exceeded",
          retryAfter: error.response.headers['retry-after']
        });
      case 503:
        return reply.code(503).send({ error: "Faceit service temporarily unavailable" });
      default:
        return reply.code(500).send({ 
          error: "Failed to fetch data from Faceit",
          message: error.response.data
        });
    }
  }
  
  return reply.code(500).send({ 
    error: "Internal server error",
    message: error.message
  });
};

// Get player data
fastify.get("/api/player", async (request, reply) => {
  const nickname = request.query.nickname;
  
  if (!nickname) {
    return reply.code(400).send({ error: "Nickname is required" });
  }

  fastify.log.info('Fetching player data for:', {
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
    fastify.log.info('Player Data Response:', {
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
    
    return formattedData;
  } catch (error) {
    return handleFaceitError(error, reply);
  }
});

// Get player match history
fastify.get("/api/history/:playerId", async (request, reply) => {
  const playerId = request.params.playerId;
  const offset = parseInt(request.query.offset) || 0;
  const limit = parseInt(request.query.limit) || 10;
  
  if (!playerId) {
    return reply.code(400).send({ error: "Player ID is required" });
  }

  fastify.log.info('Fetching match history for player:', {
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

    fastify.log.info('Match History Response:', {
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

    return {
      start: offset,
      end: offset + formattedMatches.length,
      items: formattedMatches
    };
  } catch (error) {
    return handleFaceitError(error, reply);
  }
});

// Get player bans
fastify.get("/api/bans/:playerId", async (request, reply) => {
  const playerId = request.params.playerId;
  
  if (!playerId) {
    return reply.code(400).send({ error: "Player ID is required" });
  }

  fastify.log.info('Fetching bans for player:', {
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

    fastify.log.info('Bans Response:', {
      player_id: playerId,
      total_bans: response.data.items?.length,
      raw_response: response.data
    });

    return response.data;
  } catch (error) {
    return handleFaceitError(error, reply);
  }
});

// Get match details
fastify.get("/api/matches/:matchId", async (request, reply) => {
  const matchId = request.params.matchId;
  
  if (!matchId) {
    return reply.code(400).send({ error: "Match ID is required" });
  }

  fastify.log.info('Fetching match details:', {
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

    return formattedData;
  } catch (error) {
    return handleFaceitError(error, reply);
  }
});

// Add error handling for the server
process.on('uncaughtException', (err) => {
  fastify.log.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  fastify.log.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the server with error handling
const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    fastify.log.info(`Server is running on port ${PORT}`);
  } catch (err) {
    fastify.log.error('Error starting server:', err);
    process.exit(1);
  }
};

start();

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  fastify.log.info(`${signal} received. Shutting down gracefully...`);
  try {
    await fastify.close();
    fastify.log.info('Server closed');
    process.exit(0);
  } catch (err) {
    fastify.log.error('Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export interface PlayerData {
  player_id: string;
  nickname: string;
  avatar: string;
  country: string;
  faceit_url: string;
  games: {
    cs2: {
      skill_level: number;
      faceit_elo: number;
      region: string;
      game_player_id: string;
      game_player_name: string;
      skill_level_label: string;
      regions: string[];
    }
  };
  membership_type: string;
  memberships: string[];
  verified: boolean;
}

export interface Player {
  player_id: string;
  nickname: string;
  avatar: string;
}

export interface Team {
  team_id: string;
  nickname: string;
  avatar: string;
  players: Player[];
  score: number;
}

export interface MatchResult {
  winner: string;
  score: {
    faction1: number;
    faction2: number;
  };
}

export interface Match {
  match_id: string;
  started_at: number;
  finished_at: number;
  game_mode: string;
  competition_id: string;
  competition_name: string;
  competition_type: string;
  organizer_id: string;
  teams: {
    faction1: Team;
    faction2: Team;
  };
  results: MatchResult;
}

export interface MatchHistory {
  start: number;
  end: number;
  items: Match[];
}

export interface Ban {
  reason: string;
  starts_at: string;
  ends_at: string;
  type: string;
}

export interface Bans {
  items: Ban[];
  total: number;
} 
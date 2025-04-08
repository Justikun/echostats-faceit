'use client';

import { MatchHistory as MatchHistoryType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MatchHistoryProps {
  matchHistory: MatchHistoryType | null;
  loading: boolean;
  hasMoreMatches: boolean;
  loadMoreMatches: () => void;
}

const MatchHistory = ({ 
  matchHistory, 
  loading, 
  hasMoreMatches, 
  loadMoreMatches 
}: MatchHistoryProps) => {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return `${date.toLocaleDateString()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const truncateName = (name: string) => {
    return name.length > 12 ? name.substring(0, 12) + '...' : name;
  };

  if (loading && !matchHistory) {
    return <div className="py-8 text-center text-muted-foreground">Loading matches...</div>;
  }

  if (!matchHistory || matchHistory.items.length === 0) {
    return <div className="py-8 text-center text-muted-foreground">No match history available</div>;
  }

  return (
    <div>
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-lg">Match History</CardTitle>
      </CardHeader>
      
      <div className="space-y-4">
        {matchHistory.items.map((match) => {
          const faction1Players = match.teams?.faction1?.players || [];
          const faction2Players = match.teams?.faction2?.players || [];
          const isVictory = match.results?.winner === 'faction1';
          
          return (
            <Card key={match.match_id} className="overflow-hidden border-0">
              <div className="p-3 flex justify-between items-center bg-secondary/40 border-b">
                <div className="text-sm text-muted-foreground">{match.game_mode}</div>
                <div className="flex items-center">
                  <Badge variant={isVictory ? "success" : "destructive"} className="font-normal">
                    {isVictory ? 'Victory' : 'Defeat'}
                  </Badge>
                  <span className="text-sm ml-2 text-muted-foreground">
                    {match.results?.score?.faction1 || 0} - {match.results?.score?.faction2 || 0}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">{formatDate(match.started_at)}</div>
              </div>
              
              <CardContent className="p-3">
                <div className="flex flex-col md:flex-row justify-between">
                  <div className="mb-3 md:mb-0">
                    <div className="text-xs text-muted-foreground mb-2">Team 1</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {faction1Players.map((player) => (
                        <div key={player.player_id} className="flex items-center">
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage 
                              src={player.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.nickname)}&background=2d2d2d&color=fff&size=24`} 
                              alt={player.nickname}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.nickname)}&background=2d2d2d&color=fff&size=24`;
                              }}
                            />
                            <AvatarFallback className="text-[10px]">{player.nickname.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs">{truncateName(player.nickname)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="hidden md:flex items-center justify-center px-4">
                    <Badge variant="outline" className="font-bold">VS</Badge>
                  </div>
                  
                  <div>
                    <div className="text-xs text-muted-foreground mb-2">Team 2</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {faction2Players.map((player) => (
                        <div key={player.player_id} className="flex items-center">
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage 
                              src={player.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.nickname)}&background=2d2d2d&color=fff&size=24`} 
                              alt={player.nickname}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.nickname)}&background=2d2d2d&color=fff&size=24`;
                              }}
                            />
                            <AvatarFallback className="text-[10px]">{player.nickname.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs">{truncateName(player.nickname)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {hasMoreMatches && (
        <div className="mt-6 text-center">
          <Button 
            variant="secondary"
            onClick={loadMoreMatches}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More Matches'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default MatchHistory; 
'use client';

import { PlayerData, Bans } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface PlayerStatsProps {
  playerData: PlayerData;
  bans: Bans | null;
  loading: boolean;
}

const PlayerStats = ({ playerData, bans, loading }: PlayerStatsProps) => {
  const getSkillLevelInfo = (elo: number) => {
    const ranges = [
      { level: 1, min: 100, max: 800, range: '1-800' },
      { level: 2, min: 801, max: 950, range: '801-950' },
      { level: 3, min: 951, max: 1100, range: '951-1100' },
      { level: 4, min: 1101, max: 1250, range: '1101-1250' },
      { level: 5, min: 1251, max: 1400, range: '1251-1400' },
      { level: 6, min: 1401, max: 1550, range: '1401-1550' },
      { level: 7, min: 1551, max: 1700, range: '1551-1700' },
      { level: 8, min: 1701, max: 1850, range: '1701-1850' },
      { level: 9, min: 1851, max: 2000, range: '1851-2000' },
      { level: 10, min: 2001, max: 3000, range: '2001+' }
    ];

    const currentRange = ranges.find(range => 
      elo >= range.min && (elo <= range.max || range.level === 10)
    ) || ranges[0];

    // For level 10, show progress up to Challenger (top 1000)
    const progress = currentRange.level === 10
      ? Math.min(((elo - currentRange.min) / 500) * 100, 100) // Show progress for first 500 Elo in level 10
      : Math.min(((elo - currentRange.min) / (currentRange.max - currentRange.min)) * 100, 100);

    const getLevelColor = (level: number) => {
      if (level === 1) return '#AFAFAF'; // level-1
      if (level <= 3) return '#4CBB17'; // level-2-3
      if (level <= 7) return '#3498db'; // level-4-7
      if (level <= 9) return '#9b59b6'; // level-8-9
      return '#F05A28'; // level-10
    };

    return {
      currentLevel: currentRange.level,
      progress,
      range: currentRange.range,
      color: getLevelColor(currentRange.level)
    };
  };

  const elo = playerData.games?.cs2?.faceit_elo || 0;
  const levelInfo = getSkillLevelInfo(elo);
  const avatarUrl = playerData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(playerData.nickname)}&background=2d2d2d&color=fff`;

  return (
    <Card className="border-0 bg-card/60">
      <CardContent className="p-6">
        <div className="flex items-center mb-6">
          <Avatar className="h-16 w-16 mr-4 rounded-full">
            <AvatarImage 
              src={avatarUrl} 
              alt={playerData.nickname} 
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(playerData.nickname)}&background=2d2d2d&color=fff`;
              }}
            />
            <AvatarFallback>{playerData.nickname.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold">{playerData.nickname}</h2>
            <div className="flex items-center mt-1">
              <span className="text-sm mr-3 uppercase">{playerData.country}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">FACEIT Skill Level</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center mb-3">
                <div 
                  className="w-10 h-10 flex items-center justify-center rounded-full mr-3 font-bold text-white"
                  style={{ backgroundColor: levelInfo.color }}
                >
                  {playerData.games?.cs2?.skill_level || 'N/A'}
                </div>
                <span 
                  className="text-xl font-semibold"
                  style={{ color: levelInfo.color }}
                >
                  {elo} Elo
                </span>
              </div>
              
              <div className="relative h-2 mb-2 overflow-hidden rounded-full bg-secondary">
                <div 
                  className="h-full rounded-full"
                  style={{ 
                    width: `${levelInfo.progress}%`,
                    backgroundColor: levelInfo.color
                  }}
                />
              </div>
              
              <div className="flex justify-between mb-2">
                {Array.from({ length: 10 }, (_, i) => (
                  <div 
                    key={i} 
                    className="w-2 h-2 rounded-full"
                    style={{ 
                      backgroundColor: i < levelInfo.currentLevel 
                        ? levelInfo.color 
                        : 'rgba(75, 85, 99, 0.5)' // bg-gray-600 with opacity
                    }}
                  />
                ))}
              </div>
              
              <div className="text-xs text-muted-foreground">
                Range: {levelInfo.range} Elo
              </div>
            </CardContent>
          </Card>

          {bans && (
            <Card className="border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Ban History</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p>Loading ban history...</p>
                ) : bans.items.length > 0 ? (
                  <div className="overflow-y-auto max-h-40">
                    {bans.items.map((ban, index) => (
                      <div key={index} className="mb-2 pb-2 border-b border-gray-600/50 last:border-0">
                        <Badge variant="destructive" className="font-normal mb-1">{ban.reason}</Badge>
                        <div className="text-xs text-muted-foreground">
                          {new Date(ban.starts_at).toLocaleDateString()} - 
                          {ban.ends_at 
                            ? new Date(ban.ends_at).toLocaleDateString()
                            : 'Permanent'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No ban history</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerStats; 
'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import PlayerSearch from '@/components/PlayerSearch';
import PlayerStats from '@/components/PlayerStats';
import MatchHistory from '@/components/MatchHistory';
import { getRecentSearches, addRecentSearch } from '@/utils/cookies';
import { PlayerData, MatchHistory as MatchHistoryType, Bans } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Configure axios defaults
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5001';
axios.defaults.baseURL = SERVER_URL;

export default function Home() {
  const [nickname, setNickname] = useState('');
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [matchHistory, setMatchHistory] = useState<MatchHistoryType | null>(null);
  const [bans, setBans] = useState<Bans | null>(null);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [bansLoading, setBansLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreMatches, setHasMoreMatches] = useState(true);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [showSearchHistory, setShowSearchHistory] = useState(false);

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Fetch match history when switching to match history tab
  useEffect(() => {
    if (activeTab === 'matches' && playerData && !matchHistory) {
      fetchMatchHistory(0);
    }
  }, [activeTab, playerData, matchHistory]);

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
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error fetching player data');
      setPlayerData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchBans = async (playerId: string) => {
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
      
      setHasMoreMatches(response.data.items.length === 10);
    } catch (err: any) {
      console.error('Error fetching match history:', err);
      setError(err.response?.data?.error || 'Error fetching match history');
      if (page === 0) {
        setMatchHistory(null);
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSearchHistory(false);
    fetchPlayerData();
  };

  const loadMoreMatches = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchMatchHistory(nextPage);
  };

  const handleSearchClick = (searchNickname: string) => {
    setNickname(searchNickname);
    setShowSearchHistory(false);
    fetchPlayerData(searchNickname);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-faceit-orange">EchoStats</h1>
        <p className="text-muted-foreground">FaceIt Stats Tracker for CS2</p>
      </header>

      <PlayerSearch 
        nickname={nickname}
        setNickname={setNickname}
        handleSubmit={handleSubmit}
        recentSearches={recentSearches}
        handleSearchClick={handleSearchClick}
        loading={loading}
        showSearchHistory={showSearchHistory}
        setShowSearchHistory={setShowSearchHistory}
      />

      {error && (
        <Card className="mb-6 border-destructive/50 bg-destructive/10">
          <CardContent className="p-4">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {playerData && (
        <div className="space-y-6">
          <PlayerStats 
            playerData={playerData} 
            bans={bans}
            loading={bansLoading}
          />

          <Card className="border-0">
            <CardContent className="p-4">
              <Tabs 
                defaultValue="overview" 
                value={activeTab} 
                onValueChange={handleTabChange}
                className="w-full"
              >
                <TabsList className="mb-4 w-full justify-start border-b rounded-none bg-transparent p-0">
                  <TabsTrigger 
                    className="data-[state=active]:border-b-2 data-[state=active]:border-faceit-orange data-[state=active]:text-faceit-orange rounded-none pb-2 pt-1 px-4 bg-transparent"
                    value="overview"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger 
                    className="data-[state=active]:border-b-2 data-[state=active]:border-faceit-orange data-[state=active]:text-faceit-orange rounded-none pb-2 pt-1 px-4 bg-transparent"
                    value="matches"
                  >
                    Match History
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview">
                  <div className="p-4 text-center">
                    <p className="text-muted-foreground">Overview content will be displayed here</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="matches">
                  <MatchHistory 
                    matchHistory={matchHistory}
                    loading={historyLoading}
                    hasMoreMatches={hasMoreMatches}
                    loadMoreMatches={loadMoreMatches}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 
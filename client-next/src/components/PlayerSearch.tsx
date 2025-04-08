'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PlayerSearchProps {
  nickname: string;
  setNickname: (nickname: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  recentSearches: string[];
  handleSearchClick: (nickname: string) => void;
  loading: boolean;
  showSearchHistory: boolean;
  setShowSearchHistory: (show: boolean) => void;
}

const PlayerSearch = ({
  nickname,
  setNickname,
  handleSubmit,
  recentSearches,
  handleSearchClick,
  loading,
  showSearchHistory,
  setShowSearchHistory
}: PlayerSearchProps) => {
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
        setShowSearchHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setShowSearchHistory]);

  const handleClearSearch = (searchToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // This functionality would be handled in the parent component
  };

  return (
    <div className="w-full mb-8" ref={searchWrapperRef}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex w-full items-center">
          <Input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onFocus={() => setShowSearchHistory(true)}
            className="pr-20"
            placeholder="Enter FaceIt nickname..."
            disabled={loading}
          />
          <Button
            type="submit"
            className="absolute right-0 rounded-l-none"
            disabled={loading || !nickname.trim()}
            variant="default"
          >
            {loading ? 'Loading...' : 'Search'}
          </Button>
        </div>
        
        {showSearchHistory && recentSearches.length > 0 && (
          <Card className="absolute z-10 mt-1 w-full shadow-lg overflow-hidden">
            <CardHeader className="py-2 px-3">
              <p className="text-sm text-muted-foreground">Recent Searches</p>
            </CardHeader>
            <CardContent className="p-0">
              <ul>
                {recentSearches.map((search, index) => (
                  <li 
                    key={index}
                    className="px-4 py-2 hover:bg-muted cursor-pointer flex justify-between items-center"
                    onClick={() => handleSearchClick(search)}
                  >
                    <Badge variant="secondary" className="font-normal">
                      {search}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 rounded-full"
                      onClick={(e) => handleClearSearch(search, e)}
                    >
                      ×
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
};

export default PlayerSearch; 
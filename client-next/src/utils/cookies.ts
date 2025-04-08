export const setCookie = (name: string, value: string, days = 30) => {
  if (typeof window === 'undefined') return;
  
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = "; expires=" + date.toUTCString();
  document.cookie = name + "=" + encodeURIComponent(value) + expires + "; path=/";
};

export const getCookie = (name: string) => {
  if (typeof window === 'undefined') return '';
  
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
  }
  return '';
};

export const addRecentSearch = (nickname: string) => {
  if (!nickname) return;

  const searches = getRecentSearches();
  
  // Remove if already exists
  const filteredSearches = searches.filter(search => search !== nickname);
  
  // Add to front of array
  filteredSearches.unshift(nickname);
  
  // Keep only the last 5 searches
  const recentSearches = filteredSearches.slice(0, 5);
  
  setCookie('recentSearches', JSON.stringify(recentSearches));
};

export const getRecentSearches = (): string[] => {
  try {
    const searchesJson = getCookie('recentSearches');
    return searchesJson ? JSON.parse(searchesJson) : [];
  } catch (e) {
    console.error('Error parsing recent searches:', e);
    return [];
  }
}; 
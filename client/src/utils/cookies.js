export const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

export const setCookie = (name, value, days = 30) => {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/`;
};

export const getRecentSearches = () => {
  const searches = getCookie('recentSearches');
  return searches ? JSON.parse(searches) : [];
};

export const addRecentSearch = (nickname) => {
  const searches = getRecentSearches();
  // Remove if already exists
  const filteredSearches = searches.filter(search => search !== nickname);
  // Add to beginning
  filteredSearches.unshift(nickname);
  // Keep only last 5 searches
  const recentSearches = filteredSearches.slice(0, 5);
  setCookie('recentSearches', JSON.stringify(recentSearches));
}; 
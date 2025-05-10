export const filterAndSortThreads = (threads, { searchQuery, filterStatus, sortOption, isUnlocked }) => {
    let filtered = threads.filter(thread => {
      const unlocked = isUnlocked(thread.requiredPuzzleId);
  
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'unlocked' && unlocked) ||
        (filterStatus === 'locked' && !unlocked);
  
      const query = searchQuery.toLowerCase();
      const matchesQuery = thread.name.toLowerCase().includes(query) ||
        thread.description?.toLowerCase().includes(query) ||
        thread.snippet?.toLowerCase().includes(query);
  
      return matchesStatus && matchesQuery;
    });
  
    if (sortOption === 'recent') {
      filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else if (sortOption === 'upvotes') {
      filtered.sort((a, b) => (b.upvotes ?? 0) - (a.upvotes ?? 0));
    } else if (sortOption === 'comments') {
      filtered.sort((a, b) => (b.postCount ?? 0) - (a.postCount ?? 0));
    }
  
    return filtered;
  };
  
import axios from 'axios';

// Simple in-memory cache
const cache: { [key: string]: { data: any; timestamp: number } } = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const clearCache = () => {
  Object.keys(cache).forEach(key => {
    if (Date.now() - cache[key].timestamp > CACHE_DURATION) {
      delete cache[key];
    }
  });
};

export const fetchWithCache = async (url: string) => {
  const cacheKey = url;
  
  if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_DURATION) {
    return cache[cacheKey].data;
  }

  try {
    const response = await axios.get(url);
    cache[cacheKey] = {
      data: response.data,
      timestamp: Date.now()
    };
    return response.data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

export const getTokenPrice = async (tokenAddress: string): Promise<number> => {
  try {
    const data = await fetchWithCache(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
    return data?.pairs?.[0]?.priceUsd ? parseFloat(data.pairs[0].priceUsd) : 0;
  } catch (error) {
    console.error('Failed to fetch token price:', error);
    return 0;
  }
};

export const searchTokens = async (query: string, chain?: number) => {
  try {
    if (query.startsWith('0x') && query.length === 42) {
      const data = await fetchWithCache(`https://api.dexscreener.com/latest/dex/tokens/${query}`);
      if (data?.pairs?.[0]) {
        const token = data.pairs[0].baseToken;
        return [{
          address: token.address,
          name: token.name,
          symbol: token.symbol,
          priceUsd: data.pairs[0].priceUsd,
          volume24h: data.pairs[0].volume.h24,
          chainId: chain
        }];
      }
    } else {
      const data = await fetchWithCache(`https://api.dexscreener.com/latest/dex/search/?q=${query}`);
      return (data?.pairs || [])
        .filter((pair: any) => !chain || pair.chainId === chain)
        .map((pair: any) => ({
          address: pair.baseToken.address,
          name: pair.baseToken.name,
          symbol: pair.baseToken.symbol,
          priceUsd: pair.priceUsd,
          volume24h: pair.volume.h24,
          chainId: chain
        }));
    }
    return [];
  } catch (error) {
    console.error('Failed to search tokens:', error);
    return [];
  }
};

// Cleanup cache periodically
setInterval(clearCache, CACHE_DURATION); 
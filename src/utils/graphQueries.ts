import axios from 'axios';
import { ethers } from 'ethers';

// Graph API endpoints
const GRAPH_API_KEY = (window as any).__GRAPH_API_KEY__;

// Add error handling for missing API key
const validateApiKey = () => {
  if (!GRAPH_API_KEY || GRAPH_API_KEY === 'undefined') {
    console.error('Current GRAPH_API_KEY:', GRAPH_API_KEY);
    throw new Error('Graph API key is not configured. Please set NEXT_PUBLIC_GRAPH_API_KEY in your environment variables.');
  }
};

const GRAPH_URLS = {
  arbitrum: `https://gateway.thegraph.com/api/${GRAPH_API_KEY}/subgraphs/id/FQ6JYszEKApsBpAmiHesRsd9Ygc6mzmpNRANeVQFYoVX`,
  base: `https://gateway.thegraph.com/api/${GRAPH_API_KEY}/subgraphs/id/GqzP4Xaehti8KSfQmv3ZctFSjnSUYZ4En5NRsiTbvZpz` // Base subgraph
};

// Add V2 Graph API endpoints
const V2_GRAPH_URLS = {
  arbitrum: 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v2-arbitrum',
  base: 'https://api.studio.thegraph.com/query/48211/uniswap-v2-base/version/latest'  // Updated Base V2 subgraph
};

// Add V2 Factory addresses
const V2_FACTORY_ADDRESSES = {
  arbitrum: '0x7E0987E5b3a30e3f2828572Bb659A548460a3003', // Uniswap V2 Factory on Arbitrum
  base: '0x8909dc15e40173ff4699343b6eb8132c65e18ec6'  // Uniswap V2 Factory on Base
};

interface PoolData {
  id: string;
  token0Price: string;
  token1Price: string;
  volumeUSD: string;
  feesUSD: string;
  liquidity: string;
  tick: string;
  ticks?: LiquidityTickData[];
  token0: {
    symbol: string;
    decimals: string;
  };
  token1: {
    symbol: string;
    decimals: string;
  };
}

interface PositionData {
  id: string;
  owner: string;
  liquidity: string;
  tickLower: string;
  tickUpper: string;
  token0Balance: string;
  token1Balance: string;
  timestamp: string;
  transaction: {
    timestamp: string;
  };
}

interface HistoricalData {
  date: number;
  volumeUSD: string;
  feesUSD: string;
  tvlUSD: string;
}

interface CollectedFees {
  amount0: number;
  amount1: number;
}

interface CollectedData {
  amount0: string;
  amount1: string;
  timestamp: string;
}

// Add new interface for liquidity ticks
interface LiquidityTickData {
  tickIdx: string;
  liquidityNet: string;
  liquidityGross: string;
  price0: string;
  price1: string;
}

// Add V2 interface
interface V2PairData {
  id: string;
  reserve0: string;
  reserve1: string;
  token0Price: string;
  token1Price: string;
}

// Add interface for multiple V2 pairs
interface V2PairsData {
  depositedTokenPair: V2PairData | null;
  goddogPair: V2PairData | null;
}

// Add function to compute V2 pair address from factory
export const computeV2PairAddress = (
  factoryAddress: string,
  tokenA: string | undefined,
  tokenB: string
): string | undefined => {
  if (!tokenA) return undefined;
  
  // Sort token addresses
  const [token0, token1] = [tokenA, tokenB].sort();
  
  // Compute the CREATE2 salt from the sorted token addresses
  const salt = ethers.solidityPackedKeccak256(
    ['address', 'address'],
    [token0, token1]
  );
  
  // Compute the CREATE2 address
  return ethers.getCreate2Address(
    factoryAddress,
    salt,
    // V2 pair init code hash
    '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f'
  );
};

// Update getV2PairAddress to use factory computation
export const getV2PairAddress = async (
  token0Address: string,
  token1Address: string,
  chainId: number
): Promise<string | undefined> => {
  const network = chainId === 42161 ? 'arbitrum' : 'base';
  const factoryAddress = V2_FACTORY_ADDRESSES[network];
  
  if (!factoryAddress) {
    console.error('No V2 factory address found for network:', network);
    return undefined;
  }
  
  return computeV2PairAddress(
    factoryAddress,
    token0Address,
    token1Address
  );
};

// Rename fetchPoolData to fetchV3PoolData
export const fetchV3PoolData = async (poolAddress: string, chainId: number): Promise<PoolData | null> => {
  try {
    validateApiKey();
    const query = `
      query GetPoolData($poolId: String!) {
        pool(id: $poolId) {
          id
          token0Price
          token1Price
          volumeUSD
          feesUSD
          liquidity
          tick
          ticks
          token0 {
            symbol
            decimals
          }
          token1 {
            symbol
            decimals
          }
        }
      }
    `;

    const network = chainId === 42161 ? 'arbitrum' : 'base';
    const response = await axios.post(GRAPH_URLS[network], { 
      query,
      operationName: 'GetPoolData',
      variables: {
        poolId: poolAddress.toLowerCase()
      }
    });
    return response.data.data.pool;
  } catch (error) {
    if (error instanceof Error && error.message.includes('API key')) {
      console.error('Graph API Error:', error.message);
    } else {
      console.error('Error fetching pool data:', error);
    }
    return null;
  }
};

// Fetch position data for a specific owner
export const fetchPositionHistory = async (owner: string, chainId: number): Promise<PositionData[]> => {
  try {
    validateApiKey();
    const query = `
      query GetPositionHistory($owner: String!) {
        positions(where: { owner: $owner }) {
          id
          owner
          liquidity
          tickLower
          tickUpper
          token0Balance
          token1Balance
          transaction {
            timestamp
          }
        }
      }
    `;

    const network = chainId === 42161 ? 'arbitrum' : 'base';
    const response = await axios.post(GRAPH_URLS[network], { 
      query,
      operationName: 'GetPositionHistory',
      variables: {
        owner: owner.toLowerCase()
      }
    });
    return response.data.data.positions;
  } catch (error) {
    if (error instanceof Error && error.message.includes('API key')) {
      console.error('Graph API Error:', error.message);
    } else {
      console.error('Error fetching position history:', error);
    }
    return [];
  }
};

// Fetch historical pool data for APR calculations
export const fetchHistoricalPoolData = async (poolAddress: string, chainId: number, days: number = 30): Promise<HistoricalData[]> => {
  try {
    validateApiKey();
    const timestamp = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);
    const query = `
      query GetHistoricalPoolData($poolId: String!, $timestamp: Int!) {
        poolDayDatas(
          where: { 
            pool: $poolId,
            date_gt: $timestamp
          }
          orderBy: date
          orderDirection: asc
        ) {
          date
          volumeUSD
          feesUSD
          tvlUSD
        }
      }
    `;

    const network = chainId === 42161 ? 'arbitrum' : 'base';
    const response = await axios.post(GRAPH_URLS[network], {
      query,
      operationName: 'GetHistoricalPoolData',
      variables: {
        poolId: poolAddress.toLowerCase(),
        timestamp
      }
    });
    return response.data.data.poolDayDatas;
  } catch (error) {
    if (error instanceof Error && error.message.includes('API key')) {
      console.error('Graph API Error:', error.message);
    } else {
      console.error('Error fetching historical pool data:', error);
    }
    return [];
  }
};

// Calculate historical APR based on fees and TVL
export const calculateHistoricalAPR = (historicalData: HistoricalData[]): number => {
  if (historicalData.length === 0) return 0;

  // Calculate average daily fees
  const totalFees = historicalData.reduce((sum, day) => sum + parseFloat(day.feesUSD), 0);
  const avgDailyFees = totalFees / historicalData.length;

  // Calculate average TVL
  const avgTVL = historicalData.reduce((sum, day) => sum + parseFloat(day.tvlUSD), 0) / historicalData.length;

  // Annualize the fees and calculate APR
  const annualizedFees = avgDailyFees * 365;
  const apr = avgTVL > 0 ? (annualizedFees / avgTVL) * 100 : 0;

  return Math.min(Math.max(0, apr), 999.99); // Cap APR between 0% and 999.99%
};

// Get pool performance metrics
export const getPoolPerformanceMetrics = async (poolAddress: string, chainId: number) => {
  const historicalData = await fetchHistoricalPoolData(poolAddress, chainId);
  const poolData = await fetchV3PoolData(poolAddress, chainId);

  if (!historicalData.length || !poolData) return null;

  const apr = calculateHistoricalAPR(historicalData);
  const volume24h = parseFloat(poolData.volumeUSD);
  const tvl = parseFloat(poolData.liquidity);
  const fees24h = parseFloat(poolData.feesUSD);

  return {
    apr,
    volume24h,
    tvl,
    fees24h,
    historicalData,
    currentPrices: {
      token0Price: poolData.token0Price,
      token1Price: poolData.token1Price
    }
  };
};

// Track position performance
export const trackPositionPerformance = async (positionId: string, chainId: number) => {
  try {
    validateApiKey();
    const query = `
      query {
        position(id: "${positionId}") {
          id
          liquidity
          tickLower
          tickUpper
          token0Balance
          token1Balance
          collecteds {
            amount0
            amount1
            timestamp
          }
        }
      }
    `;

    const network = chainId === 42161 ? 'arbitrum' : 'base';
    const response = await axios.post(GRAPH_URLS[network], {
      query,
      operationName: 'TrackPositionPerformance',
      variables: {}
    });
    const position = response.data.data.position;

    // Calculate total fees collected
    const totalFeesCollected = position.collecteds.reduce(
      (acc: CollectedFees, collected: CollectedData) => ({
        amount0: acc.amount0 + parseFloat(collected.amount0),
        amount1: acc.amount1 + parseFloat(collected.amount1)
      }),
      { amount0: 0, amount1: 0 }
    );

    return {
      currentBalance: {
        token0: position.token0Balance,
        token1: position.token1Balance
      },
      feesCollected: totalFeesCollected,
      liquidity: position.liquidity,
      range: {
        tickLower: position.tickLower,
        tickUpper: position.tickUpper
      }
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('API key')) {
      console.error('Graph API Error:', error.message);
    } else {
      console.error('Error tracking position performance:', error);
    }
    return null;
  }
};

// Update V2 query to fetch by exact pair address
export const fetchV2Liquidity = async (
  chainId: number,
  depositedTokenAddress: string,
  goddogTokenAddress: string,
  wethAddress: string
): Promise<V2PairsData> => {
  try {
    // Compute both pair addresses
    const depositedTokenPairAddress = computeV2PairAddress(depositedTokenAddress, wethAddress, chainId.toString());
    const goddogPairAddress = computeV2PairAddress(goddogTokenAddress, wethAddress, chainId.toString());

    // Fetch data for both pairs in parallel
    const [depositedTokenPair, goddogPair] = await Promise.all([
      fetchPairData(depositedTokenPairAddress, chainId),
      fetchPairData(goddogPairAddress, chainId)
    ]);

    return {
      depositedTokenPair,
      goddogPair
    };
  } catch (error) {
    console.error('Error fetching V2 liquidity:', error);
    return {
      depositedTokenPair: null,
      goddogPair: null
    };
  }
};

// Add fetchPairData function
const fetchPairData = async (pairAddress: string | undefined, chainId: number): Promise<V2PairData | null> => {
  if (!pairAddress) return null;
  
  try {
    const network = chainId === 42161 ? 'arbitrum' : 'base';
    const query = `
      query GetV2PairData($pairAddress: ID!) {
        pair(id: $pairAddress) {
          id
          reserve0
          reserve1
          token0Price
          token1Price
          token0 {
            symbol
            decimals
          }
          token1 {
            symbol
            decimals
          }
          reserveUSD
        }
      }
    `;

    const response = await axios.post(V2_GRAPH_URLS[network], {
      query,
      variables: {
        pairAddress: pairAddress.toLowerCase()
      }
    });

    const pairData = response.data.data.pair;
    return pairData ? {
      ...pairData,
      liquidity: pairData.reserveUSD,
      token0Symbol: pairData.token0?.symbol,
      token1Symbol: pairData.token1?.symbol
    } : null;
  } catch (error) {
    console.error('Error fetching V2 pair data:', error);
    return null;
  }
};

// Update fetchLiquidityConcentration to handle null v3Data
export const fetchLiquidityConcentration = async (
  poolAddress: string,
  chainId: number,
  depositedTokenAddress: string,
  goddogTokenAddress: string
) => {
  if (!process.env.NEXT_PUBLIC_GRAPH_API_KEY) {
    throw new Error('Graph API key is not configured. Please set NEXT_PUBLIC_GRAPH_API_KEY in your environment variables.');
  }

  const WETH_ADDRESS = {
    42161: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    8453: '0x4200000000000000000000000000000000000006'
  };

  const wethAddress = WETH_ADDRESS[chainId as keyof typeof WETH_ADDRESS];

  try {
    const [v3Data, v2Data] = await Promise.all([
      fetchV3PoolData(poolAddress, chainId),
      fetchV2Liquidity(chainId, depositedTokenAddress, goddogTokenAddress, wethAddress)
    ]);

    return {
      v3Ticks: v3Data?.ticks ?? [], // Use optional chaining and nullish coalescing
      v2Data
    };
  } catch (error) {
    console.error('Error fetching liquidity concentration:', error);
    throw error;
  }
}; 
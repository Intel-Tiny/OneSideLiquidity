import React, { useState, useEffect, useMemo } from 'react';
import { Dialog } from '@headlessui/react';
import { Search, X } from 'lucide-react';
import axios from 'axios';

interface SelectTokenModalProps {
  open: boolean;
  onClose: () => void;
  chain: number;
  AllTokenData: any;
  BasicTokens: string[][];
  selectedToken: any;
  setSelectedToken: (token: any) => void;
  setSelectedTokenBalance: (balance: string) => void;
}

interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  logoURI?: string;
  priceUsd?: string;
  volume24h?: string;
  chainId?: number;
}

const SelectTokenModal: React.FC<SelectTokenModalProps> = ({
  open,
  onClose,
  chain,
  AllTokenData,
  BasicTokens,
  selectedToken,
  setSelectedToken,
  setSelectedTokenBalance
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'popular' | 'search'>('popular');

  // Popular tokens based on the current chain
  const popularTokens = useMemo(() => {
    if (chain === undefined || !BasicTokens[chain]) return [];
    return BasicTokens[chain].map(symbol => ({
      symbol,
      name: symbol,
      address: AllTokenData?.[chain]?.[symbol]?.address || '',
      logoURI: AllTokenData?.[chain]?.[symbol]?.logoURI || '',
      chainId: chain
    })).filter(token => token.address);
  }, [chain, BasicTokens, AllTokenData]);

  const getTokenLogo = (address: string, currentLogoURI?: string) => {
    // Default fallback icon that is guaranteed to exist
    const FALLBACK_ICON = 'https://raw.githubusercontent.com/feathericons/feather/master/icons/help-circle.svg';
    
    // Get blockchain-specific path based on chain ID
    const getBlockchainPath = () => {
      switch (chain) {
        case 42161: // Arbitrum One
          return 'arbitrum';
        case 8453: // Base
          return 'base';
        case 1: // Ethereum Mainnet
          return 'ethereum';
        default:
          return 'ethereum'; // fallback to ethereum
      }
    };

    // Only include the source if it's a valid URL
    const isValidUrl = (url?: string) => {
      if (!url) return false;
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    };

    const blockchainPath = getBlockchainPath();

    // Try multiple sources for the token logo, filtering out invalid URLs
    const sources = [
      // DexScreener API (if available in the response)
      isValidUrl(currentLogoURI) ? currentLogoURI : null,
      // Trust Wallet format with correct blockchain
      `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${blockchainPath}/assets/${address}/logo.png`,
      // CoinGecko format (chain agnostic)
      `https://assets.coingecko.com/coins/images/${address.toLowerCase()}/thumb.png`,
      // Uniswap format (chain agnostic)
      `https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/${blockchainPath}/assets/${address}/logo.png`,
      // 1inch format (chain agnostic)
      `https://tokens.1inch.io/${address}.png`,
    ].filter(Boolean) as string[]; // Filter out null values and assert type

    // Return the first valid source or the fallback icon
    return sources[0] || FALLBACK_ICON;
  };

  const searchTokens = async (query: string) => {
    if (!query) {
      setTokens([]);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // If query looks like an address
      if (query.startsWith('0x') && query.length === 42) {
        const response = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${query}`);
        if (response.data.pairs && response.data.pairs.length > 0) {
          const pair = response.data.pairs[0];
          const token = pair.baseToken;
          setTokens([{
            address: token.address,
            name: token.name,
            symbol: token.symbol,
            logoURI: getTokenLogo(token.address), // Use the updated getTokenLogo function
            priceUsd: pair.priceUsd,
            volume24h: pair.volume.h24,
            chainId: chain
          }]);
        }
      } else {
        // Search by name/symbol
        const response = await axios.get(`https://api.dexscreener.com/latest/dex/search/?q=${query}`);
        const uniqueTokens = new Map<string, TokenInfo>();
        
        for (const pair of response.data.pairs || []) {
          const token = pair.baseToken;
          if (!uniqueTokens.has(token.address)) {
            uniqueTokens.set(token.address, {
              address: token.address,
              name: token.name,
              symbol: token.symbol,
              logoURI: getTokenLogo(token.address), // Use the updated getTokenLogo function
              priceUsd: pair.priceUsd,
              volume24h: pair.volume.h24,
              chainId: chain
            });
          }
        }

        setTokens(Array.from(uniqueTokens.values()));
      }
    } catch (err) {
      setError('Failed to fetch tokens');
      console.error('Error fetching tokens:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery) {
        searchTokens(searchQuery);
      } else {
        setTokens([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, chain]);

  const handleTokenSelect = (token: TokenInfo) => {
    // Update token with enhanced logo handling
    const tokenWithLogo = {
      ...token,
      logoURI: getTokenLogo(token.address, token.logoURI)
    };
    setSelectedToken(tokenWithLogo);
    setSelectedTokenBalance("0");
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="bg-[#111111] w-full max-w-md rounded-2xl border border-gray-800/30 shadow-xl">
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <Dialog.Title className="text-sm font-medium text-yellow-400">
                  Select Token
                </Dialog.Title>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-[#1B1B1B] transition-colors"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative mb-3">
                <input
                  type="text"
                  placeholder="Search name or paste address"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setActiveTab('search');
                  }}
                  className="w-full bg-[#0A0A0A] rounded-xl px-4 py-2.5 pl-9 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-yellow-400"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setActiveTab('popular')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'popular'
                      ? 'bg-yellow-400 text-black'
                      : 'text-gray-400 hover:bg-[#1B1B1B]'
                  }`}
                >
                  Popular
                </button>
                <button
                  onClick={() => setActiveTab('search')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'search'
                      ? 'bg-yellow-400 text-black'
                      : 'text-gray-400 hover:bg-[#1B1B1B]'
                  }`}
                >
                  Search Results
                </button>
              </div>

              {isLoading && (
                <div className="text-center text-gray-400 py-2 text-sm">
                  Searching...
                </div>
              )}

              {error && (
                <div className="text-center text-red-500 py-2 text-sm">
                  {error}
                </div>
              )}
            </div>

            <div className="max-h-[300px] overflow-y-auto">
              <div className="py-1.5">
                {activeTab === 'popular' ? (
                  popularTokens.map((token: TokenInfo, index: number) => (
                    <button
                      key={token.address + index}
                      className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[#1B1B1B] transition-colors
                        ${selectedToken?.address === token.address ? 'bg-[#1B1B1B]' : ''}`}
                      onClick={() => handleTokenSelect(token)}
                    >
                      <img
                        src={getTokenLogo(token.address, token.logoURI)}
                        alt={token.symbol}
                        className="w-8 h-8 rounded-full bg-gray-800"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://raw.githubusercontent.com/feathericons/feather/master/icons/help-circle.svg';
                        }}
                      />
                      <div className="flex flex-col items-start min-w-0 flex-1">
                        <span className="font-medium text-white text-base truncate w-full">{token.symbol}</span>
                        <span className="text-sm text-gray-400 truncate w-full">{token.name}</span>
                      </div>
                      <div className="text-right ml-2 flex-shrink-0">
                        <div className="text-white text-sm">-</div>
                        <div className="text-xs text-gray-400">
                          Vol: -
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  tokens.map((token: TokenInfo, index: number) => (
                    <button
                      key={token.address + index}
                      className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[#1B1B1B] transition-colors
                        ${selectedToken?.address === token.address ? 'bg-[#1B1B1B]' : ''}`}
                      onClick={() => handleTokenSelect(token)}
                    >
                      <img
                        src={getTokenLogo(token.address, token.logoURI)}
                        alt={token.symbol}
                        className="w-8 h-8 rounded-full bg-gray-800"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://raw.githubusercontent.com/feathericons/feather/master/icons/help-circle.svg';
                        }}
                      />
                      <div className="flex flex-col items-start min-w-0 flex-1">
                        <span className="font-medium text-white text-base truncate w-full">{token.symbol}</span>
                        <span className="text-sm text-gray-400 truncate w-full">{token.name}</span>
                      </div>
                      <div className="text-right ml-2 flex-shrink-0">
                        <div className="text-white text-sm">
                          {token.priceUsd ? `$${parseFloat(token.priceUsd).toFixed(6)}` : '-'}
                        </div>
                        <div className="text-xs text-gray-400">
                          Vol: {token.volume24h ? `$${parseFloat(token.volume24h).toLocaleString()}` : '-'}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default SelectTokenModal;

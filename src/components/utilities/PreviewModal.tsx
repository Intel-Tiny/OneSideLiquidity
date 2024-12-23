import React from "react";
import { X, ExternalLink } from "lucide-react";
import Loader from "./Loader";
import FALLBACK_TOKEN from "/token-placeholder.svg";

interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
  onApprove: () => void;
  selectToken: {
    name: string;
    symbol: string;
    logoURI: string;
  };
  tokenAmount: string;
  isLoading: boolean;
  isSuccess?: boolean;
  chainId?: number;
  positionId?: string;
}

const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
  event.currentTarget.src = FALLBACK_TOKEN;
};

const PreviewModal = ({
  open,
  onClose,
  onApprove,
  selectToken,
  tokenAmount,
  isLoading,
  isSuccess,
  chainId,
  positionId
}: PreviewModalProps) => {
  if (!open) return null;

  const getUniswapUrl = () => {
    const network = chainId === 8453 ? 'base' : 'arbitrum';
    return `https://app.uniswap.org/pools/${positionId}?chain=${network}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="relative w-full max-w-md bg-[#1B1B1B] rounded-2xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">
            {isSuccess ? "Position Created!" : "Add liquidity"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {isSuccess ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-500/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-300">Your liquidity position has been created successfully!</p>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#2D2D2D] flex items-center justify-center overflow-hidden">
                <img
                  src={selectToken.logoURI || FALLBACK_TOKEN}
                  alt={selectToken.name}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-medium text-white truncate">
                    {tokenAmount}
                  </span>
                  <span className="text-lg font-medium text-white">
                    {selectToken.symbol}
                  </span>
                </div>
                <p className="text-sm text-gray-400 truncate">{selectToken.name}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          {isSuccess ? (
            <div className="space-y-3">
              <a
                href={getUniswapUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-[#FFE804] text-black font-medium rounded-xl hover:bg-[#FFE804]/90 transition-colors flex items-center justify-center gap-2"
              >
                View on Uniswap <ExternalLink className="h-4 w-4" />
              </a>
              <button
                onClick={onClose}
                className="w-full py-3 bg-[#2D2D2D] text-white font-medium rounded-xl hover:bg-[#3D3D3D] transition-colors"
              >
                Return to Home
              </button>
            </div>
          ) : (
            <button
              onClick={onApprove}
              disabled={isLoading}
              className="w-full py-3 bg-[#FFE804] text-black font-medium rounded-xl hover:bg-[#FFE804]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader /> : "Add"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;

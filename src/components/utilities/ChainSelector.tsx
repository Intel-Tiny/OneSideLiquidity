import { ChevronDown, Check } from "lucide-react";

interface ChainSelectorProps {
  chain: number;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  chains: any[];
  onChainSelect: (chain: number) => void;
}

const ChainSelector = ({ chain, isOpen, setIsOpen, chains, onChainSelect }: ChainSelectorProps) => {
  return (
    <div className="relative">
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1B1B1B] cursor-pointer hover:bg-[#2D2D2D]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <img src={chains[chain].icon} alt="chain" className="h-5 w-5 rounded-full" />
        <span>{chains[chain].name}</span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </div>
      
      {isOpen && (
        <div className="absolute top-full mt-1 right-0 w-48 bg-[#1B1B1B] rounded-lg shadow-lg border border-gray-800 overflow-hidden">
          <div className="py-1">
            {chains.map((chainItem, index) => (
              <div
                key={chainItem.chainId}
                className="flex items-center justify-between px-4 py-2 hover:bg-[#2D2D2D] cursor-pointer"
                onClick={() => {
                  onChainSelect(index);
                  setIsOpen(false);
                }}
              >
                <div className="flex items-center gap-2">
                  <img src={chainItem.icon} alt="icon" className="w-6 h-6 rounded-full" />
                  <span className="text-white">{chainItem.name}</span>
                </div>
                {chain === index && <Check className="w-4 h-4 text-blue-500" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChainSelector; 
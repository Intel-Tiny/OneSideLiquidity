import BASE from "/Base.svg";
import ARBITRUM from "/arbitrum.svg";
import { base, arbitrum } from "viem/chains";

export const URL = "https://informed-bullfrog-guided.ngrok-free.app/api"

export const managerAddress: string = "0xB05Cf01231cF2fF99499682E64D3780d57c80FdD";

export const maxTotalSupply: string =
    "115792089237316195423570985008687907853269984665640564039457584007913129639935";

export const minLimitBalance = 0.00002;

export const BasicTokens = [
  [
    "WETH",
    "USDT",
    "USDC.e",
    "DAI",
    "ARB",
    "GMX",
    "MAGIC",
    "RDNT",
    "LINK",
    "UNI",
    "wstETH",
    "WBTC",
  ],
  ["WETH", "USDT", "USDC", "DAI", "TOSHI"],
];
export const MainTokens = [
  "0x45940000009600102a1c002f0097c4a500fa00ab",
  "0xDDf7d080C82b8048BAAe54e376a3406572429b4e",
];

export const MAINSYMBOLS = [
  "HERMES",
  "GODDOG",
]

export const chainNames =[
  "Arbitrum",
  "Base",
]

export const changeColors = [
  "text-purple-400",
  "text-yellow-400",
]

export const changeBg = [
  "bg-purple-400",
  "bg-yellow-400",
]

export const changeBorder = [
  "hover:border-purple-400",
  "hover:border-yellow-400",
]

export const chainIDS = [
  "arbitrum",
  "base",
]

export const LOGO = "https://ivory-accurate-pig-375.mypinata.cloud/ipfs/QmNxKrGR1ZJ3bKYdyYXf8tuTtKF3zaDShmmFdFABfXFdJQ?pinataGatewayToken=Yn-z4l06l9aFDk0xk-gQmyfHbcCrqKcsqSbuEqjtGUOHqRX5DEWFe-t-7SxbqmMf";
export const Icon = [
  {
    icon: ARBITRUM,
    name: "Arbitrum",
    chainId: arbitrum.id,
    routerAddress: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
    factoryAddress: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    HermesTokenAddress: "0x45940000009600102a1c002f0097c4a500fa00ab",
    vaultFactoryAddress: "0x5B7B8b487D05F77977b7ABEec5F922925B9b2aFa",
  },
  {
    icon: BASE,
    name: "Base",
    chainId: base.id,
    routerAddress: "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1",
    factoryAddress: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD",
    GoddogTokenAddress: "0xDDf7d080C82b8048BAAe54e376a3406572429b4e",
    vaultFactoryAddress: "0x5B7B8b487D05F77977b7ABEec5F922925B9b2aFa",
  },
];
const truncateMiddle = (str: string, maxLength: number = 16): string => {
    if (str.length <= maxLength) return str;
    
    const ellipsis = '...';
    const charsToShow = maxLength - ellipsis.length;
    const frontChars = Math.ceil(charsToShow / 2);
    const backChars = Math.floor(charsToShow / 2);
    
    return str.substr(0, frontChars) + ellipsis + str.substr(str.length - backChars);
}

const formatFloatString = (floatString: string): string => {
    // Convert the string to a number
    const numberValue = parseFloat(floatString);
  
    // Check if the conversion was successful
    if (isNaN(numberValue)) {
      throw new Error('Invalid float string');
    }
  
    // Format the number to two decimal places
    return numberValue.toFixed(2);
  }

 export const truncateString = (str: string): string => {
    if (str.length <= 8) return str;
    return str.slice(0, 4) + '...' + str.slice(-4);
  };

export default {truncateMiddle, formatFloatString, truncateString};


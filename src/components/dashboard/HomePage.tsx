/* eslint-disable */
import { useEffect } from "react";
import { ChevronDown } from "lucide-react";
import BASE from "/Base.svg";
import ARBITRUM from "/arbitrum.svg";
import LOGO from "/Goddog.svg";
import { useState, ChangeEvent } from "react";
import Data from "../data";
import { DynamicWidget, useDynamicContext } from "@dynamic-labs/sdk-react-core";
import SelectTokenModal from "../utilities/SelectTokenModal";
import PreviewModal from "../utilities/PreviewModal";
import { base, arbitrum } from "viem/chains";
import axios from "axios";
import { getSigner } from "@dynamic-labs/ethers-v6";
import { ethers } from "ethers";
import Loader from "../utilities/Loader";
import { Toaster, toast } from "react-hot-toast";
import InteractiveLiquidityVisualization from "../utilities/Motion";
import univ3prices from "@thanpolas/univ3prices";
import { Tooltip } from 'react-tooltip';
import Uniswap_LOGO from "/uniswap.webp";
import ChainSelector from "../utilities/ChainSelector";


// import Background from '../utilities/Background'
const Icon = [
  {
    icon: ARBITRUM,
    name: "Arbitrum",
    chainId: arbitrum.id,
    routerAddress: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
    factoryAddress: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    GoddogTokenAddress: "0x45940000009600102a1c002f0097c4a500fa00ab"
  },
  {
    icon: BASE,
    name: "Base",
    chainId: base.id,
    routerAddress: "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1",
    factoryAddress: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD",
    GoddogTokenAddress: "0xDDf7d080C82b8048BAAe54e376a3406572429b4e"
  },
];
const BasicTokens = [
  [
    "WETH",
    "USDT",
    "USDC",
    "DAI",
    "ARB",
    "GMX",
    "MAGIC",
    "RDNT",
    "LINK",
    "UNI"
  ],
  [
    "WETH",
    "USDT",
    "USDC",
    "DAI",
    "TOSHI",
    "AERO"
  ],
];
type selectedTokenType = {
  name: string;
  symbol: string;
  logoURI: string;
  address: string;
  decimals: number;
};
const ARB: selectedTokenType = {
  logoURI: "https://arbitrum.foundation/logo.png",
  name: "Arbitrum",
  symbol: "ARB",
  address: "",
  decimals: 18,
};
const USDC: selectedTokenType = {
  logoURI: "https://ethereum-optimism.github.io/data/USDC/logo.png",
  name: "USD Coin",
  symbol: "USDC",
  address: "",
  decimals: 6,
};
const tokenABI = [
  // Only include the approve function
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function allowance(address owner, address spender) public view returns (uint256)",
];
function Homepage() {
  const [isSelectChain, setSelectChain] = useState(false);
  // const [fee, setFee] = useState("1%");
  // const [text, setText] = useState("");
  // @ts-ignore
  const [range, setRange] = useState<number>(0);
  const [chain, setChain] = useState(0);
  // const [walletBalance, setWalletBalance] = useState('0')
  const [myTokenList, setMyTokenList] = useState<any>(null);
  const [selectedToken, setSelectedToken] = useState<selectedTokenType | null>(null);
  const [selectedTokenBalance, setSelectedTokenBalance] = useState("");
  const [show, setShow] = useState(false);
  const [previewShow, setPreviewShow] = useState(false);
  const [amount, setAmount] = useState("");
  const [tokenPrice, setTokenPrice] = useState(0);
  // @ts-ignore
  const { primaryWallet } = useDynamicContext();
  // @ts-ignore
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // @ts-ignore
  const [isApprove, setIsApprove] = useState(false);
  const [approvedAmount, setApprovedAmount] = useState(0);
  const getPriceToTick = (price: number) => {
    return Math.floor(Math.log(price) / Math.log(1.0001));
  };
  const handleTick = (num: number) => {
    let tickCurrent = getPriceToTick(num);
    let tempCurrent = Math.floor(tickCurrent / 100) * 100;
    if (tempCurrent % 200 != 0) {
      tempCurrent += 100;
    }
    return tempCurrent;
  };
  // @ts-ignore
  const [currentTick, setCurrentTick] = useState<number>(getPriceToTick(0.1));
  const [lowerTick, setLowerTick] = useState<number>(handleTick(0.09));
  const [upperTick, setUpperTick] = useState<number>(handleTick(0.29));
  const [lowRange, highRange] = [0.958, 3.0]

  const setSelectedTokenInfo = (item: selectedTokenType) => {
    setSelectedToken(item);
    const tokenAddress = item.address;
    const url = `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`;

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        setTokenPrice(data.pairs[0].priceUsd);
      })
      .catch((error) => {
        setTokenPrice(0);
        console.log("price error", error);
      });
  };
  const handleInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value.length && value[0] != ".") {
      let inValue: string = value[value.length - 1];
      if (inValue === "." || (inValue >= "0" && inValue <= "9")) {
        setAmount(value);
      }
    } else {
      setAmount("");
      setIsApprove(false);
      setIsButtonDisabled(true);
    }
  };
  useEffect(() => {
    if (approvedAmount >= Number(amount) && amount != "") {
      setIsApprove(true);
    } else {
      setIsApprove(false);
    }
  }, [amount]);

  const handleRangeClick = () => {
    console.log("henle", selectedTokenBalance);
    if (Number(selectedTokenBalance)) {
      // setRange(item);
      setAmount(String(Number(selectedTokenBalance)));
    }
  };
  useEffect(() => {
    if (amount != "") {
      console.log("amount: ", amount);
      if (parseFloat(amount) > parseFloat(selectedTokenBalance)) {
        console.log("here");
        setIsButtonDisabled(true);
      } else setIsButtonDisabled(false);
    } else {
      setIsButtonDisabled(true);
    }
  }, [amount]);
  useEffect(() => {
    setMyTokenList(Data.Tokens);
  }, []);

  const switchNetwork = async () => {
    try {
      if (!primaryWallet) return;
      if (primaryWallet?.connector.supportsNetworkSwitching()) {
        await primaryWallet.switchNetwork(Icon[chain].chainId); // Switch to the desired network
        if (Icon[chain].name === "Arbitrum") {
          setSelectedToken(ARB);
          setSelectedTokenBalance("");
        } else {
          setSelectedToken(USDC);
          setSelectedTokenBalance("");
        }
      }
    } catch (error) {
      console.error("Failed to switch network:", error);
    }
  };
  const handleNetworkSwitch = async () => {
    try {
      if (!primaryWallet) {
        return;
      }
      await switchNetwork(); // Call the switchNetwork function
    } catch (error) {
      console.error("Error switching network:", error);
    }
  };
  const checkPoolExists = async (tokenA: string, tokenB: string, fee: number) => {
    // Ensure tokenA is less than tokenB to maintain order
    const [token0, token1] =
      tokenA < tokenB ? [tokenA, tokenB] : [tokenB, tokenA];
    const signer = await getSigner(primaryWallet as any);

    const factoryContract = new ethers.Contract(
      Icon[chain].factoryAddress,
      Data.factoryABI,
      signer
    );

    try {
      const poolAddress = await factoryContract.getPool(token0, token1, fee);
      console.log("poolAddress: ", poolAddress)
      if (poolAddress === ethers.ZeroAddress) {
        return false;
      } else {
        return true;
      }
    } catch (error) {
      console.error("Error checking pool:", error);
      return true;
    }
  };
  const getPriceAndTickFromValues = (price: number) => {
    const _tempPrice = Math.sqrt(2 ** 192 * price)
    let _tick = univ3prices.tickMath.getTickAtSqrtRatio(_tempPrice)
    _tick = _tick - (_tick % 200)
    const _price = BigInt((univ3prices.tickMath.getSqrtRatioAtTick(_tick)).toString());
    return {tick: _tick, price: _price}
  }
  const fetchPrices = async () => {
    if (!selectedToken) return;
    let address1 = selectedToken.address; // First address
    let address2 = Icon[chain].GoddogTokenAddress; // Second address
    const fee = BigInt("10000"); // uint24 value
    const alreadyPoolExist = await checkPoolExists(address1, address2, Number(fee))
    console.log("alreadyPoolExist: ", alreadyPoolExist)
    let token0: any, token1: any;
      if (address1.toLowerCase() < address2.toLowerCase()) {
        token0 = address1;
        token1 = address2;
      } else {
        token0 = address2;
        token1 = address1;
      }
      const [price1, price2] = await calculateTokenPrices(token0, token1);
      console.log("price1:", price1, " price2:", price2);
      let currentPrice = Number(price1) / Number(price2);
      const state = token0 == address1
      console.log("currentPrice:", currentPrice * lowRange);
      const lowerPrice = state ? currentPrice * lowRange: currentPrice / lowRange;
      const upperPrice = state ? currentPrice * highRange : currentPrice / highRange;
      const resLower = getPriceAndTickFromValues(lowerPrice)
      console.log("resLower: ", resLower.tick)
      const resUpper = getPriceAndTickFromValues(upperPrice)
      console.log("resUpper: ", resUpper.tick)
      const tickLower = state ? resLower.tick + 200 : resUpper.tick;
      const tickUpper = state ? resUpper.tick : resLower.tick - 200;
      const sqrtPrice = resLower.price;
      console.log("sqrtPrice: ", sqrtPrice);
    setLowerTick(tickLower);
    setUpperTick(tickUpper);
    setCurrentTick(resLower.tick);
  };
  useEffect(() => {
    // @ts-ignore
    handleNetworkSwitch(); // Call the inner async function
  }, [chain, primaryWallet]); // Add all dependencies
  useEffect(() => {
    fetchPrices();
  }, [selectedToken]);
  // @ts-ignore
  const handleApprove = async () => {
    if (!selectedToken) return;
    console.log("approve start");
    setIsApprove(true);
    setIsLoading(true);
    if (primaryWallet) {
      try {
        const signer = await getSigner(primaryWallet as any);
        console.log("signer: ", signer);
        const selectedTokenContract = new ethers.Contract(
          selectedToken.address,
          tokenABI,
          signer
        );
        const tx = await selectedTokenContract.approve(
          Icon[chain].routerAddress,
          ethers.parseUnits(amount, selectedToken.decimals)
        );
        console.log("tx start");
        await tx.wait();
        console.log("approved");
        toast.success("Successfully approved!");
        setIsLoading(false);
        setIsApprove(true);
      } catch (err) {
        setIsLoading(false);
        setIsApprove(false);
        if (String(err).includes("Error: user rejected action")) {
          toast.error(`User rejected!`);
        } else {
          toast.error(`Approve failed!`);
        }
      }
    }
  };

  const getRecentPrice = async (address: string) => {
    const tokenAddress = address; // Replace with your token address
    const url = `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`;
    try {
      const response = await axios.get(url);
      const priceUsd = response.data.pairs[0].priceUsd;
      return priceUsd;
    } catch (error) {
      return 0;
    }
  };

  const calculateTokenPrices = async (address1: string, address2: string) => {
    const price1 = await getRecentPrice(address1);
    const price2 = await getRecentPrice(address2);
    console.log("here is price1 and price2", price1, " ", price2);
    return [price1, price2];
  };
  const getApprovedAmountOfSelectedToken = async () => {
    if (!selectedToken) return;
    try {
      const signer = await getSigner(primaryWallet as any);
      console.log("signer: ", signer);

      const selectedTokenContract = new ethers.Contract(
        selectedToken.address,
        tokenABI,
        signer
      );

      const approvedAmount0 = await selectedTokenContract.allowance(
        primaryWallet?.address,
        Icon[chain].routerAddress
      );

      // Use ethers.utils.formatUnits instead of ethers.formatUnits
      const approvedAmount1 = ethers.formatUnits(
        approvedAmount0,
        selectedToken.decimals
      );

      // Convert to a number and update state
      setApprovedAmount(Number(approvedAmount1));
    } catch (error) {
      console.error("Error fetching approved amount:", error);
    }
  };

  const getApprovedAmount = async () => {
    await getApprovedAmountOfSelectedToken();
  };

  useEffect(() => {
    if (selectedToken) {
      getApprovedAmount();
      setAmount("");
    }
  }, [selectedToken]);

  // const calculateSqrtPriceX96 = (price: number) => {
  //   const sqrt = Math.sqrt(price);
  //   const Q96 = BigInt(2) ** BigInt(96);
  //   return BigInt(Math.floor(sqrt * Number(Q96)));
  // };
  
  const handleAddLiquidity = async () => {
    if (!selectedToken) return;
    setIsLoading(true);
    
    try {
      const abi = Data.routerABI;
      const signer = await getSigner(primaryWallet as any);
      const routerContract = new ethers.Contract(
        Icon[chain].routerAddress,
        abi,
        signer
      );

      const createFunctionSignature =
        "createAndInitializePoolIfNecessary(address,address,uint24,uint160)";
      let address1 = selectedToken.address; // First address
      let address2 = Icon[chain].GoddogTokenAddress; // Second address
      const fee = BigInt("10000"); // uint24 value
      const alreadyPoolExist = await checkPoolExists(address1, address2, Number(fee))
      console.log("alreadyPoolExist: ", alreadyPoolExist)
      if(alreadyPoolExist){
        toast.error("The position already exist!");
        setIsLoading(false);
        return;
      }
      let token0: any, token1: any;
      if (address1.toLowerCase() < address2.toLowerCase()) {
        token0 = address1;
        token1 = address2;
      } else {
        token0 = address2;
        token1 = address1;
      }
      const [price1, price2] = await calculateTokenPrices(token0, token1);
      console.log("price1:", price1, " price2:", price2);
      let currentPrice = Number(price1) / Number(price2);
      const state = token0 == address1
      const lowerPrice = state ? currentPrice * lowRange: currentPrice / lowRange;
      const upperPrice = state ? currentPrice * highRange : currentPrice / highRange;
      console.log("lowerPrice: ", lowerPrice);
      console.log("upperPrice: ", upperPrice);
      const resLower = getPriceAndTickFromValues(lowerPrice)
      console.log("resLower: ", resLower.tick)
      const resUpper = getPriceAndTickFromValues(upperPrice)
      console.log("resUpper: ", resUpper.tick)
      const tickLower = state ? resLower.tick + 200 : resUpper.tick;
      const tickUpper = state ? resUpper.tick : resLower.tick - 200;
      const sqrtPrice = resLower.price
      console.log("sqrtPrice: ", sqrtPrice);
      const iface = new ethers.Interface(abi);
      const params1 = [token0, token1, fee, BigInt(sqrtPrice)];
      console.log("params1:", params1);
      const data1 = iface.encodeFunctionData(createFunctionSignature, params1);
      console.log("data1", data1);

      const mintFunctionSignature =
        "mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))";
      console.log("primaryWallet.address: ", primaryWallet?.address);
      console.log("Date.now(): ", Date.now());
      const desiredAmount = BigInt(
        Number(amount) * 10 ** selectedToken.decimals
      );
      const same = token0 == address1;
      const params2 = [
        {
          token0: token0,
          token1: token1,
          fee: fee,
          tickLower: tickLower,
          tickUpper: tickUpper,
          amount0Desired: same ? desiredAmount : 0,
          amount1Desired: !same ? desiredAmount : 0,
          amount0Min: 0,
          amount1Min: 0,
          recipient: primaryWallet?.address,
          deadline: BigInt(Math.floor(Date.now() / 1000) + 1200),
        },
      ];
      console.log("params2: ", params2);
      const data2 = iface.encodeFunctionData(mintFunctionSignature, params2);
      console.log("data2", data2);
      const txData = [data1, data2];
      const tx = await routerContract.multicall(txData);
      await tx.wait();
      // const tx = await routerContract.multicall.estimateGas(txData);
      // console.log("tx", tx);
      toast.success("The position was successfully created!");
      setSelectedTokenBalance(
        String(Number(selectedTokenBalance) - Number(amount))
      );
      setIsLoading(false);
      return;
    } catch (err) {
      //fasle
      toast.error("Transaction failed!");
      return;
    }
  };
  console.log("isLoading======>", isLoading);


  const calculateImpermanentLoss = (priceRatio: number) => {
    // Standard IL formula
    const sqrtRatio = Math.sqrt(priceRatio);
    const IL = 2 * sqrtRatio / (1 + priceRatio) - 1;
    return Math.abs(IL);
  };



  const calculateAPR = () => {
    try {
      const upperPrice = Math.pow(1.0001, upperTick);
      const lowerPrice = Math.pow(1.0001, lowerTick);
      const priceRatio = upperPrice / lowerPrice;
      
      // Position size in USD
      const positionSize = parseFloat(amount || '0') * tokenPrice;
      if (positionSize === 0) return "0%";

      // Calculate minimum volume needed for full conversion over 1 year
      // We need enough volume to convert the entire position
      const minimumYearlyVolume = positionSize * 2; // Need to trade position size both ways
      const minimumDailyVolume = minimumYearlyVolume / 365;
      
      // Fee earnings from minimum required volume
      const feeTier = 0.01; // 1%
      const dailyFeeEarnings = minimumDailyVolume * feeTier;
      const yearlyFeeEarnings = dailyFeeEarnings * 365;
      
      // Calculate fee APR based on minimum volume
      const feeAPR = (yearlyFeeEarnings / positionSize) * 100;

      // Price movement return over 1 year
      // If price moves from lower to upper bound
      const priceReturn = (priceRatio - 1) * 100;
      
      // Impermanent loss at full conversion
      const impLoss = calculateImpermanentLoss(priceRatio) * 100;
      
      // Total minimum APR (fees + price movement - IL)
      const apr = feeAPR + priceReturn - impLoss;
      const result = Math.min(Math.max(0, apr), 999.99);
      
      console.log({
        positionSize,
        minimumYearlyVolume,
        feeAPR,
        priceReturn,
        impLoss,
        apr,
        result
      });
      
      return `${result.toFixed(1)}%`;
    } catch (error) {
      console.error("APR calculation error:", error);
      return "0%";
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#1B1B1B] text-white">
      <Toaster />
      
      {/* Token Selector Modal */}
      {show && (
        <SelectTokenModal
          open={show}
          onClose={() => setShow(false)}
          chain={chain}
          AllTokenData={myTokenList}
          BasicTokens={BasicTokens}
          selectedToken={selectedToken}
          setSelectedToken={setSelectedTokenInfo}
          setSelectedTokenBalance={setSelectedTokenBalance}
        />
      )}

      {/* Preview Modal */}
      {previewShow && selectedToken && (
        <PreviewModal
          open={previewShow}
          onClose={() => setPreviewShow(false)}
          onApprove={handleAddLiquidity}
          selectToken={selectedToken}
          symbol={selectedToken.symbol}
          tokenAmount={amount}
          isLoading={isLoading}
        />
      )}

      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#1B1B1B] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src={LOGO} alt="Logo" className="h-8 w-8" />
            <span className="text-xl font-medium">GODDOG</span>
          </div>
          <div className="flex items-center gap-4">
            <DynamicWidget variant="modal" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-[#111111] rounded-2xl border border-gray-800">
          {/* Uniswap V3 Branding */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <img src={Uniswap_LOGO} alt="Uniswap" className="h-5 w-5" />
              <span className="text-sm text-gray-400">Powered by Uniswap V3</span>
            </div>
          </div>

          {/* Chain Selector */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Chain</span>
              <div className="relative">
                <ChainSelector
                  chain={chain}
                  isOpen={isSelectChain}
                  setIsOpen={setSelectChain}
                  chains={Icon}
                  onChainSelect={setChain}
                />
              </div>
            </div>
          </div>

          {/* Token Input */}
          <div className="p-4">
            <div className="mb-2 text-gray-400">You sell</div>
            <div className="bg-[#1B1B1B] rounded-xl p-4">
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  className="w-full text-3xl bg-transparent outline-none"
                  placeholder="0"
                  value={amount}
                  onChange={handleInputChange}
                />
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#2D2D2D] cursor-pointer hover:bg-[#3D3D3D]"
                  onClick={() => setShow(true)}
                >
                  {selectedToken ? (
                    <>
                      <img
                        src={selectedToken.logoURI}
                        alt="token"
                        className="h-6 w-6 rounded-full"
                      />
                      <span>{selectedToken.symbol}</span>
                    </>
                  ) : (
                    <span className="whitespace-nowrap">Select Token</span>
                  )}
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="flex justify-between mt-2 text-sm text-gray-400">
                <span>~${(parseFloat(amount || '0') * tokenPrice).toFixed(2)}</span>
                <div className="flex items-center gap-2">
                  <span>Balance: {selectedTokenBalance}</span>
                  <button
                    onClick={handleRangeClick}
                    className="px-2 py-0.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Max
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Liquidity Visualization */}
          <div className="p-4 border-t border-gray-800">
            <InteractiveLiquidityVisualization
              currentTick={currentTick}
              lowerTick={lowerTick}
              upperTick={upperTick}
            />
          </div>

          {/* Position Parameters */}
          <div className="p-4 border-t border-gray-800">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-400 mb-1">Size</div>
                <div className="text-lg">
                  {Math.abs(upperTick - lowerTick)} ticks
                  <div className="text-xs text-gray-500">
                    {Math.abs(upperTick - lowerTick) / 200} × 200 tick spacing
                  </div>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Min APR</div>
                <div className="text-lg text-blue-500">
                  {selectedToken ? calculateAPR() : '0%'}
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="p-4 border-t border-gray-800">
            <button
              className={`w-full py-3 rounded-xl font-medium ${
                !selectedToken
                  ? 'bg-[#2D2D2D] text-gray-400'
                  : isLoading || isApprove
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-[#2D2D2D] text-gray-400 hover:bg-[#3D3D3D]'
              }`}
              onClick={() => {
                if (!selectedToken) {
                  setShow(true);
                } else if (!isLoading && !isApprove) {
                  handleApprove();
                } else if (isApprove) {
                  setPreviewShow(true);
                }
              }}
              disabled={isButtonDisabled || !selectedToken}
            >
              {!selectedToken 
                ? "Select Token" 
                : isLoading 
                ? <Loader /> 
                : isApprove 
                ? "Preview" 
                : "Approve"}
            </button>
          </div>
        </div>
      </div>

      {/* Add tooltips */}
      <Tooltip id="fee-tooltip" className="max-w-xs">
        <div className="p-2">
          <p className="font-semibold mb-1">Fee Tier: 1%</p>
          <p>You earn 1% of all trading volume that occurs within your price range.</p>
        </div>
      </Tooltip>

      <Tooltip id="range-tooltip" className="max-w-xs">
        <div className="p-2">
          <p className="font-semibold mb-1">Price Range</p>
          <p>The price range in which your liquidity is active. You earn fees when trades happen within this range.</p>
          <p className="mt-1">Lower tick: {lowerTick}</p>
          <p>Upper tick: {upperTick}</p>
        </div>
      </Tooltip>

      <Tooltip id="apr-tooltip" className="max-w-xs">
        <div className="p-2">
          <p className="font-semibold mb-1">Minimum APR Calculation</p>
          <p>Annual rate based on:</p>
          <ul className="list-disc pl-4 mt-1">
            <li>Minimum trading volume needed for full position conversion</li>
            <li>1% fee on all trades</li>
            <li>Price movement from {lowerTick} to {upperTick}</li>
            <li>Subtracts maximum impermanent loss</li>
          </ul>
          <p className="mt-1 text-sm">This is a conservative estimate assuming only minimum required trading volume.</p>
        </div>
      </Tooltip>
    </div>
  );
}

export default Homepage;

/* eslint-disable */
import Card from "../tailus-ui/Card";
import { useEffect } from "react";
import { ChevronDown } from "lucide-react";
import BASE from "/Base.svg";
import ARBITRUM from "/arbitrum.svg";
import LOGO from "/Goddog.svg";
import Uniswap_LOGO from "/uniswap.webp";
import { useState, ChangeEvent } from "react";
import Data from "../data";
import { DynamicWidget, useDynamicContext } from "@dynamic-labs/sdk-react-core";
import ChainItem from "../utilities/ChainItem";
import SelectTokenModal from "../utilities/SelectTokenModal";
import PreviewModal from "../utilities/PreviewModal";
import { base, arbitrum } from "viem/chains";
import axios from "axios";
import { getSigner } from "@dynamic-labs/ethers-v6";
import { ethers } from "ethers";
import { IoSettingsSharp } from "react-icons/io5";
import Loader from "../utilities/Loader";
import { Toaster, toast } from "react-hot-toast";
// import Background from '../utilities/Background'
const Icon = [
  {
    icon: ARBITRUM,
    name: "Arbitrum",
    chainId: arbitrum.id,
    routerAddress: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
  },
  {
    icon: BASE,
    name: "Base",
    chainId: base.id,
    routerAddress: "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1",
  },
];
const GoddogTokenAddress = "0xDDf7d080C82b8048BAAe54e376a3406572429b4e";
const BasicTokens = [
  ["WETH", "USDT", "USDC", "DAI"],
  ["ETH", "ARB", "WETH", "USDT", "USDC", "DAI", "MAIA", "HERMES"],
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
  const [selectedToken, setSelectedToken] = useState<selectedTokenType>(ARB);
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

  const setSelectedTokenInfo = (item: any) => {
    setSelectedToken(item);
    const tokenAddress = item.address; // Replace with your token address
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
    console.log("henle", selectedTokenBalance)
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
  const updateBalance = async () => {
    if (!primaryWallet) return;
    primaryWallet?.getBalance().then((balance) => {
      if (balance) {
        // setWalletBalance(balance)
      }
    });
  };

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
        // setWalletBalance('0')
        return;
      }
      await switchNetwork(); // Call the switchNetwork function
      await updateBalance(); // Display the balance after switching networks
    } catch (error) {
      console.error("Error switching network:", error);
    }
  };
  useEffect(() => {
    // @ts-ignore
    handleNetworkSwitch(); // Call the inner async function
  }, [chain, primaryWallet]); // Add all dependencies
// @ts-ignore
  const handleApprove = async () => {
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

  const getPriceToTick = (price: number) => {
    return Math.floor(Math.log(price) / Math.log(1.0001));
  };
  const calculateSqrtPriceX96 = (price: number) => {
    const sqrt = Math.sqrt(price);
    const Q96 = BigInt(2) ** BigInt(96);
    return BigInt(Math.floor(sqrt * Number(Q96)));
  };
  const handleAddLiquidity = async () => {
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
      let address2 = GoddogTokenAddress; // Second address
      const fee = BigInt("10000"); // uint24 value
      const [price1, price2] = await calculateTokenPrices(address1, address2);
      console.log("price1:", price1, " price2:", price2);
      let currentPrice = Number(price1) / Number(price2);
      console.log("currentPrice:", currentPrice * 0.95);
      const sqrtPrice = calculateSqrtPriceX96(currentPrice * 0.95);
      console.log("sqrtPrice: ", sqrtPrice);

      const iface = new ethers.Interface(abi);
      const params1 = [address1, address2, fee, BigInt(sqrtPrice)];
      console.log("params1:", params1);
      const data1 = iface.encodeFunctionData(createFunctionSignature, params1);
      console.log("data1", data1);
      const lowerPrice = currentPrice * 0.96;
      const upperPrice = currentPrice * 3;
      console.log("lowerPrice: ", lowerPrice);
      console.log("upperPrice: ", upperPrice);
      const tickLower = getPriceToTick(lowerPrice);
      const tickUpper = getPriceToTick(upperPrice);
      let tempTickLower = Math.floor(tickLower / 100) * 100;
      let tempTickUpper = Math.floor(tickUpper / 100) * 100;
      if (tempTickLower % 200 != 0) {
        tempTickLower += 100;
      }
      if (tempTickUpper % 200 != 0) {
        tempTickUpper += 100;
      }
      const tickLower1 = BigInt(tempTickLower);
      const tickUpper1 = BigInt(tempTickUpper);
      const mintFunctionSignature =
        "mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))";
      console.log("primaryWallet.address: ", primaryWallet?.address);
      console.log("Date.now(): ", Date.now());
      const desiredAmount = BigInt(
        Number(amount) * 10 ** selectedToken.decimals
      );
      const params2 = [
        {
          token0: address1,
          token1: address2,
          fee: fee,
          tickLower: tickLower1,
          tickUpper: tickUpper1,
          amount0Desired: desiredAmount,
          amount1Desired: 0,
          amount0Min: desiredAmount,
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
        let address2 = GoddogTokenAddress; // Second address
        const fee = BigInt("10000"); // uint24 value
        const [price1, price2] = await calculateTokenPrices(address1, address2);
        console.log("price1:", price1, " price2:", price2);
        let currentPrice = Number(price1) / Number(price2);
        console.log("currentPrice:", currentPrice * 0.95);
        const lowerPrice = currentPrice * 0.96;
        const upperPrice = currentPrice * 3;
        currentPrice = currentPrice * 0.95;
        currentPrice = 1.0 / currentPrice;
        const sqrtPrice = calculateSqrtPriceX96(currentPrice);
        console.log("sqrtPrice: ", sqrtPrice);

        const iface = new ethers.Interface(abi);
        const params1 = [address2, address1, fee, BigInt(sqrtPrice)];
        console.log("params1:", params1);
        const data1 = iface.encodeFunctionData(
          createFunctionSignature,
          params1
        );
        console.log("data1", data1);

        console.log("lowerPrice: ", lowerPrice);
        console.log("upperPrice: ", upperPrice);
        const tickLower = getPriceToTick(lowerPrice);
        const tickUpper = getPriceToTick(upperPrice);
        let tempTickLower = Math.floor(tickLower / 100) * 100;
        let tempTickUpper = Math.floor(tickUpper / 100) * 100;
        if (tempTickLower % 200 != 0) {
          tempTickLower += 100;
        }
        if (tempTickUpper % 200 != 0) {
          tempTickUpper += 100;
        }
        const tickLower1 = BigInt(tempTickLower);
        const tickUpper1 = BigInt(tempTickUpper);
        const mintFunctionSignature =
          "mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))";
        console.log("primaryWallet.address: ", primaryWallet?.address);
        console.log("Date.now(): ", Date.now());
        const desiredAmount = BigInt(
          Number(amount) * 10 ** selectedToken.decimals
        );
        const params2 = [
          {
            token0: address2,
            token1: address1,
            fee: fee,
            tickLower: -tickUpper1,
            tickUpper: -tickLower1,
            amount0Desired: 0,
            amount1Desired: desiredAmount,
            amount0Min: 0,
            amount1Min: desiredAmount,
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
        setSelectedTokenBalance(
          String(Number(selectedTokenBalance) - Number(amount))
        );
        toast.success("The position was successfully created!");
        setIsLoading(false);
        return;
      } catch (error) {
        setIsLoading(false);
        toast.error("Transaction failed!");
        return;
      }
      // //fasle
      // toast.error("Transaction failed!");
      // return;
    }
  };
  console.log("isLoading======>", isLoading);

  return (
    <div className="w-full h-full flex flex-col justify-between bg-mainbg">
      <Toaster />
      {myTokenList && (
        <SelectTokenModal
          open={show}
          onClose={() => setShow(false)}
          AllTokenData={myTokenList}
          chain={Icon[chain].chainId}
          BasicTokens={BasicTokens[chain]}
          setSelectedToken={setSelectedTokenInfo}
          setSelectedTokenBalance={setSelectedTokenBalance}
          selectedToken={selectedToken}
        />
      )}
      {/* {myTokenList && ( */}
      <PreviewModal
        open={previewShow}
        onClose={() => setPreviewShow(false)}
        selectToken={selectedToken}
        symbol={Icon[chain].icon}
        tokenAmount={amount}
        isLoading={isLoading}
        onApprove={async () => {
          setIsLoading(true);
          await handleAddLiquidity();
          setIsLoading(false);
          setIsApprove(false);
          setPreviewShow(false);
          setAmount("");
        }}
        // AllTokenData={myTokenList}
        // chain={Icon[chain].chainId}
        // BasicTokens={BasicTokens[chain]}
      />
      <div className="sticky top-0 border border-borderbg py-4 z-50">
        <div className="mx-auto flex max-w-full items-center justify-end px-2 gap-2">
          <div className=" absolute left-4">
            <img
              src={LOGO}
              alt="LOGO"
              className="rounded-full w-12 h-12 border-0 border-white"
            />
          </div>
          <div className="relative">
            <div
              className="bg-[#43454D] rounded-md flex flex-row justify-between text-gray-500 p-1 gap-1 px-2 py-1 items-center hover:cursor-pointer"
              onClick={() => setSelectChain(!isSelectChain)}
            >
              <div>
                <img
                  src={Icon[chain].icon}
                  alt="icon"
                  className="w-8 h-8 rounded-full"
                ></img>
              </div>
              <ChevronDown />
            </div>
            {isSelectChain && (
              <div className="absolute z-50 right-0 mt-7 bg-cardbg  rounded-lg w-52 p-2">
                {Icon.map((item, index) => {
                  return (
                    <ChainItem
                      key={index}
                      item={item}
                      onClick={() => {
                        setChain(index);
                        setSelectChain(false);
                        if (index == 0) setSelectedToken(ARB);
                        else setSelectedToken(USDC);
                      }}
                      isActive={chain === index}
                    />
                  );
                })}
              </div>
            )}
          </div>
          <DynamicWidget variant="modal" />
        </div>
      </div>
      <div
        className={
          "relative flex flex-1 flex-col justify-start items-center mx-auto"
        }
      >
        <div className="mx-auto pt-20">
          {/* <div className="text-white text-center text-4xl ">
            Cerberus by GODDOG
          </div> */}
          {/* <div className='text-gray-400 text-xl text-center'>
            Secure, innovative, and high-yield opportunities in the
          </div> */}
          {/* <div className='text-gray-400 text-xl text-center items-center'>
            decentralized finance landscape
          </div> */}
        </div>
        <div className="flex justify-between w-full pl-2 pr-2">
          <div className="text-white text-xl font-semibold flex gap-1 items-center">
            <img
              src={Uniswap_LOGO}
              alt="ETH"
              className="w-12 h-12 rounded-full"
            ></img>
            <div>Powered by Uniswap V3</div>
          </div>
          <div className="text-white flex gap-2 items-center">
            <IoSettingsSharp className="w-6 h-6 cursor-pointer" />
          </div>
        </div>
        <div className="w-full pb-6 flex justify-center items-center">
          <Card className="max-w-lg bg-gray border-borderbg flex flex-col rounded-3xl gap-2">
            <div className="flex text-white  font-semibold flex-row items-center gap-1">
              <p>
                Deposit
              </p>
            </div>
            <div className="rounded-xl flex flex-col gap-1">
              <div className="flex flex-row justify-between items-center gap-3">
                <input
                  className="text-5xl outline-none text-white w-full gap-2 bg-transparent"
                  placeholder="0"
                  value={amount}
                  onChange={handleInputChange}
                ></input>
                <div>
                  <img
                    src={
                      selectedToken?.logoURI
                        ? selectedToken?.logoURI
                        : Icon[chain].icon
                    }
                    alt="ETH"
                    className="w-20 rounded-full"
                  ></img>
                </div>
                <div
                  className="rounded-md flex flex-row text-gray-500 gap-3 items-center hover:cursor-pointer hover:bg-hoverbg"
                  onClick={() => setShow(true)}
                >
                  {/* <div className=" relative w-10 h-10 flex flex-row items-end">
                    <div className="w-5 h-5 absolute bottom  right-0 rounded-sm">
                      <img src={Icon[chain].icon} alt="ETH"></img>
                    </div>
                  </div> */}
                  <div className="flex flex-col justify-end">
                    <div className="flex flex-row text-2xl text-white">
                      <div>{selectedToken.symbol}</div>
                      <div className="flex items-center">
                        <ChevronDown />
                      </div>
                    </div>
                    {/* <div className="text-gray-500">{Icon[chain].name}</div> */}
                  </div>
                </div>
              </div>
              <div className="flex flex-row justify-between items-baseline">
                <div className="text-gray-400 text-xl ">
                  {parseFloat(amount) > 0
                    ? "$" + (parseFloat(amount) * tokenPrice).toFixed(3)
                    : "$0"}
                </div>
                <div className="text-gray-500 text-md hover:text-white font-semibold">
                  {/* {selectedTokenBalance !== ""
                    ? "Balance: " + selectedTokenBalance
                    : ""} */}
                  <div className="flex items-center gap-1">
                    <div className="flex items-center">
                      <p>{amount?amount:"0"} {selectedToken.symbol}</p>
                    </div>
                    <div
                      onClick={handleRangeClick} 
                      className="text-[14px] flex text-black items-center font-normal px-2 py-0.5 bg-[#FFFF00] rounded-[0.5rem] cursor-pointer"
                    >
                      <p>Max</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* <div className="w-full">
              <div className="flex row justify-between items-center gap-1">
                {Data.Range.map((item, index) => {
                  return (
                    <button
                      key={index}
                      className={`w-full bg-hoverbg border-hoverbg rounded-md border  ${
                        index === range
                          ? "border-[#5C5E65] bg-[#5C5E65] text-white font-bold"
                          : "border-borderbg"
                      } hover:border-[#5C5E65] hover:bg-[#5C5E65] hover:text-white py-2 text-gray-500 flex flex-row justify-center gap-2`}
                      onClick={() => handleRangeClick(index)}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div> */}
          </Card>
        </div>
        {selectedToken?
          (<div
            className="flex cursor-pointer items-center py-2 font-semibold rounded-2xl text-white text-xl bg-[#43454D] w-full "
          >
            <button
              className={`cursor-pointer mx-auto ${
                isLoading ? "hidden" : isApprove ? "hidden" : "block"
              }`}
              //
              disabled={isButtonDisabled}
              onClick={() => {
                handleApprove();
              }}
            >
              {parseFloat(amount) <= parseFloat(selectedTokenBalance)
                ? parseFloat(amount) > 0
                  ? "Start Approve"
                  : "Deposit and Start Earning"
                : amount != ""
                ? "Insufficient Balance"
                : "Deposit and Start Earning"}
            </button>

            <button
              className={
                isApprove
                  ? "cursor-pointer mx-auto"
                  : "hidden"
              }
              onClick={() => setPreviewShow(true)}
            >
              {isLoading ? <Loader /> : "Preview"}
            </button>
          </div>):
          (<div
            className="flex cursor-pointer items-center py-4 font-semibold rounded-3xl text-white text-2xl bg-mainbg w-full "
          >
            <p className="mx-auto">Select a token</p>
          </div>)
}
        {/* <div className="mx-auto w-full">
          <div className="text-gray-400 text-xl text-center">
            Cerberus Inu: Guarding your assets with cutting-edge DeFi
          </div>
          <div className="text-gray-400 text-xl text-center">
            strategies and multi-layered security protocols.
          </div>
        </div> */}
      </div>
    </div>
  );
}

export default Homepage;

import { twMerge } from "tailwind-merge";
import Card from "../tailus-ui/Card";
import { useEffect } from "react";
import Separator from "../tailus-ui/Separator";
import { Settings } from "lucide-react";
import { ChevronDown } from "lucide-react";
import BASE from "/Base.svg";
import GODDOG from "/Goddog.svg";
import ARBITRUM from "/arbitrum.svg";
// import FeeItem from '../utilities/FeeItem'
import { useState } from "react";
import Data from "../data";
import { DynamicWidget, useDynamicContext } from "@dynamic-labs/sdk-react-core";
import ChainItem from "../utilities/ChainItem";
import SelectTokenModal from "../utilities/SelectTokenModal";
import { base, arbitrum } from "viem/chains";
import { TokenList, schema } from "@uniswap/token-lists";
import Moralis from "moralis";
import MORALIS_KEY from "../data";



const Icon = [
  { icon: BASE, name: "Base", chainId: base.id },
  { icon: ARBITRUM, name: "Arbitrum", chainId: arbitrum.id },
];
const BasicTokens = [
  ["WETH", "USDT", "USDC", "DAI"],
  ["ETH", "ARB", "WETH", "USDT", "USDC", "DAI", "MAIA", "HERMES"],
];
type selectedTokenType = {
  name: string;
  symbol: string;
  logoURI: string;
}
function Homepage() {
  const [isSelectChain, setSelectChain] = useState(false);
  // const [fee, setFee] = useState("1%");
  // const [text, setText] = useState("");
  const [range, setRange] = useState("Max");
  const [chain, setChain] = useState(0);
  const [walletBalance, setWalletBalance] = useState("0");
  const UNISWAP_TOKEN_LIST = "https://gateway.ipfs.io/ipns/tokens.uniswap.org";
  const CORS_PROXY = "https://thingproxy.freeboard.io/fetch/";
  const [myTokenList, setMyTokenList] = useState(null);
  const [selectedToken, setSelectedToken] = useState<selectedTokenType>();
  const [selectedTokenBalance, setSelectedTokenBalance] = useState("");
  // console.log("myTokenList: " + JSON.stringify(myTokenList));

  // const handleRangeClick = (range: string) => {
  //   setRange(range);
  // };
  const [show, setShow] = useState(false);

  const { primaryWallet } = useDynamicContext();
  // const { defaultProvider } = useRpcProviders(evmProvidersSelector);
  useEffect(() => {
    const fetchTokenList = async () => {
      // try {
      //    if (!Moralis.Core.isStarted) {
      //      await Moralis.start({
      //        apiKey: String(MORALIS_KEY),
      //      });
      //    }
      // } catch (e) {
      //   console.error(e);
      // }
      try {
        const response = await fetch(CORS_PROXY + UNISWAP_TOKEN_LIST);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setMyTokenList(data); // Store the fetched token list
      } catch (err) {
        console.log(err);
      } finally {
        return;
      }
      
    };

    fetchTokenList(); // Call the fetch function
  }, []);
  const updateBalance = async () => {
    if (!primaryWallet) return;
    primaryWallet?.getBalance().then((balance) => {
      if (balance) {
        setWalletBalance(balance);
      }
    });
  };

  const switchNetwork = async () => {
    try {
      if (!primaryWallet) return;
      if (primaryWallet?.connector.supportsNetworkSwitching()) {
        await primaryWallet.switchNetwork(Icon[chain].chainId); // Switch to the desired network
      }
    } catch (error) {
      console.error("Failed to switch network:", error);
    }
  };
  const handleNetworkSwitch = async () => {
    try {
      if (!primaryWallet) {
        setWalletBalance("0");
        return;
      }
      await switchNetwork(); // Call the switchNetwork function
      await updateBalance(); // Display the balance after switching networks
      setSelectChain(false);
    } catch (error) {
      console.error("Error switching network:", error);
    }
  };
  useEffect(() => {
    handleNetworkSwitch(); // Call the inner async function
  }, [chain, primaryWallet]); // Add all dependencies

  return (
    <div
      className={twMerge(
        "relative bg-mainbg  lg:mr-0  lg:rounded-t-[--card-radius] w-full h-[80vdh] mx-auto items-center"
      )}
    >
      {myTokenList ? (
        <SelectTokenModal
          open={show}
          onClose={() => setShow(false)}
          AllTokenData={myTokenList}
          chain={Icon[chain].chainId}
          BasicTokens={BasicTokens[chain]}
          selectedToken={selectedToken}
          setSelectedToken={setSelectedToken}
          setSelectedTokenBalance={setSelectedTokenBalance}
        />
      ) : (
        <div></div>
      )}
      <div className="bg-mainbg sticky top-0 border-b border-borderbg py-4">
        <div className="mx-auto flex max-w-full items-center justify-end px-2 gap-2">
          <div className="relative">
            <div
              className="bg-darkgrey rounded-md flex flex-row justify-between text-gray-500 p-1 gap-1 px-2 py-1 items-center hover:cursor-pointer"
              onClick={() => setSelectChain(!isSelectChain)}
            >
              <img src={Icon[chain].icon} alt="icon" className="w-8 h-8"></img>
              <ChevronDown />
            </div>
            {isSelectChain && (
              <div className="absolute z-50 right-0 mt-7 bg-modalbg rounded-lg w-52 p-2">
                {Icon.map((item, index) => {
                  return (
                    <ChainItem
                      key={index}
                      item={item}
                      onClick={() => {
                        setChain(index);
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
      <div className="w-full mx-auto pt-6">
        <div className="text-white text-center text-4xl ">
          Unleash Your Invesment Potential
        </div>
        <div className="text-gray-400 text-xl text-center">
          Secure, innovative, and high-yield opportunities in the
        </div>
        <div className="text-gray-400 text-xl text-center items-center">
          decentralized finance landscape
        </div>
      </div>
      <div className="w-full h-4/5 py-6 flex justify-center items-center">
        <Card className="max-w-lg bg-cardbg border-borderbg flex flex-col gap-6">
          <div className="text-white text-4xl text-center">
            Srategic vault Deposit
          </div>
          <div className="flex flex-row justify-center items-center gap-1">
            <div className="text-gray-200 text-2xl">Performance Fee: 1%</div>
            <div className="text-gray-200 text-2xl  flex flex-row items-center gap-2">
              <Settings />
            </div>
          </div>
          <div className="bg-modalbg rounded-xl border border-borderbg bg-mediumred flex flex-col gap-2 p-3">
            <div className="flex flex-row justify-between items-baseline">
              <input
                className="text-5xl bg-modalbg outline-none text-gray-300 w-full p-0 m-0"
                placeholder="0"
              ></input>
              <div
                className="bg-darkgrey rounded-md flex flex-row text-gray-500 p-1 gap-1 py-1 items-center hover:cursor-pointer"
                onClick={() => setShow(true)}
              >
                <img src={selectedToken?.logoURI ?selectedToken?.logoURI:Icon[chain].icon} alt="ETH" className="w-8 h-8"></img>
                <ChevronDown />
              </div>
            </div>
            <div className="flex flex-row justify-between items-baseline">
              <div className="text-gray-400 ">-</div>
              <div className="text-gray-500 text-xl">
                Balance: {selectedTokenBalance !== ""?selectedTokenBalance:Number(walletBalance).toFixed(4)}
              </div>
            </div>
          </div>
          {/* <div className='bg-modalbg rounded-xl border border-borderbg bg-mediumred flex flex-col gap-2 p-3'>
            <div className='flex flex-row justify-between items-baseline'>
              <div className='text-5xl  text-gray-300 w-full'>0</div>
              <div className='bg-darkgrey rounded-md flex flex-row text-gray-500 p-1 gap-1 py-1 items-center'>
                <img src={GODDOG} alt='GODDOG' className='w-8 h-8'></img>
                <ChevronDown />
              </div>
            </div>
            <div className='flex flex-row justify-between items-baseline'>
              <div className='text-gray-400 '>-</div>
              <div className='text-gray-500 text-xl'>Balance:0</div>
            </div>
          </div> */}
          {/* <Separator className='bg-[rgba(41,59,183,0.52)]' />

            <div className='relative w-full'>
              <div className='text-gray-500 text-md mb-2'>Fee</div>
              <div className='flex flex-row justify-between'>
                <div className='text-xl text-gray-500'>1</div>
                <div className='text-xl text-gray-500'>%</div>
              </div>
            </div> */}
          <div className="w-full">
            <div className="flex row justify-between items-center gap-1">
              {Data.Range.map((item, index) => {
                return (
                  <button
                    key={index}
                    className={`w-full bg-buttonbg rounded-xl border  ${
                      item === range
                        ? "border-white text-white font-bold"
                        : "border-borderbg"
                    } hover:border-white py-2 text-gray-500 flex flex-row justify-center gap-2`}
                    // onClick={() => handleRangeClick(item)}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
          <button className="bg-red-700 p-2 shadow-lg rounded-lg text-white border border-red-500 hover:border-white">
            Deposit and Start Earning
          </button>
        </Card>
      </div>
      <div className="mx-auto w-full">
        <div className="text-gray-400 text-lg text-center">
          Cerberus Inu: Guarding your assets with cutting-edge DeFi
        </div>
        <div className="text-gray-400 text-xl text-center">
          strategies and multi-layered security protocols.
        </div>
      </div>
    </div>
  );
}

export default Homepage;

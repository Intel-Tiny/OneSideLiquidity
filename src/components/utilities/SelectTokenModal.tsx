import { Fragment, useEffect, useState } from "react";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { X, Search, BookCopy } from "lucide-react";
import Separator from "../tailus-ui/Separator";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { ethers } from "ethers";
// import Moralis from "moralis";
//@ts-ignore
import { Network, Alchemy, TokenBalancesOptionsErc20, TokenBalancesResponseErc20, TokenBalanceType } from "alchemy-sdk";
import BASE from "/Base.svg";
import ARBITRUM from "/arbitrum.svg";
import { Check } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

type selectedTokenType = {
  name: string;
  symbol: string;
  logoURI: string;
  address: string;
  decimals: number;
};

interface SelectTokenModalProps {
  open: boolean;
  onClose: () => void;
  chain: number;
  AllTokenData: any;
  BasicTokens: string[][];
  selectedToken: selectedTokenType | null;
  setSelectedToken: (token: selectedTokenType) => void;
  setSelectedTokenBalance: (balance: string) => void;
}

const SelectTokenModal = ({
  open,
  onClose,
  AllTokenData,
  chain,
  BasicTokens,
  selectedToken,
  setSelectedToken,
  setSelectedTokenBalance,
}: SelectTokenModalProps) => {
  const { primaryWallet } = useDynamicContext();
  const [filterTokens, setFilterTokens] = useState([]);
  const [searchTokens, setSearchTokens] = useState<any>([]);
  const [existingTokenList, setExistingTokenList] = useState<any>([]);
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const config = {
    apiKey: "G-_wYNAST6raSUPasw-Ql_qxT6CMK5w1",
    network: chain == 8453 ? Network.BASE_MAINNET : Network.ARB_MAINNET,
  };
  const alchemy = new Alchemy(config);

  useEffect(() => {
    const filteredTokens = AllTokenData.tokens.filter((token: any) =>
      BasicTokens.some(
        (target: any) => target === token.symbol && chain === token.chainId
      )
    );
    setFilterTokens(filteredTokens);

    // const options = {
    //   method: 'GET',
    //   headers: { accept: 'application/json', 'x-chain': 'base' }
    // }

    // fetch(
    //   'https://public-api.birdeye.so/defi/token_trending?sort_by=rank&sort_type=asc&offset=0&limit=10',
    //   options
    // )
    //   .then(res => res.json())
    //   .then(res => console.log('trending: ', res))
    //   .catch(err => console.error(err))
  }, [chain]);
  
  async function getAddress(alchemy: Alchemy, nameOrAddress: string): Promise<string> {
    if (alchemy.config.network === Network.ARB_MAINNET) {
      // For Arbitrum, assume the input is already an address
      return nameOrAddress;
    } else {
      // For other networks, attempt ENS resolution
      try {
        const resolvedAddress = await alchemy.core.resolveName(nameOrAddress);
        return resolvedAddress || nameOrAddress;
      } catch (error) {
        console.warn('ENS resolution failed, using input as address:', error);
        return nameOrAddress;
      }
    }
  }

  async function getAllTokenBalances(alchemy: Alchemy, address: string): Promise<TokenBalancesResponseErc20['tokenBalances']> {
    let allBalances: TokenBalancesResponseErc20['tokenBalances'] = [];
    let pageKey: string | undefined = undefined;
    
    do {
      const options: TokenBalancesOptionsErc20 = {
        type:  TokenBalanceType.ERC20,
        pageKey: pageKey
      };
  
      const response: TokenBalancesResponseErc20 = await alchemy.core.getTokenBalances(address, options);
      
      allBalances = allBalances.concat(response.tokenBalances);
      pageKey = response.pageKey;
    } while (pageKey);
    
    return allBalances;
  }
  async function fetchBalances() {
    try {
      
      if (primaryWallet?.address) {
        const resolvedAddress = await getAddress(alchemy, primaryWallet.address);
        const allBalances = await getAllTokenBalances(alchemy, resolvedAddress);
        console.log('All token balances:', allBalances);
        setExistingTokenList(allBalances);
      } else {
        console.error('No wallet address provided');
      }
    } catch (error) {
      console.error('Error fetching token balances:', error);
    }
  }

  // const fetchBalances = async () => {
  //   if (primaryWallet) {
  //     const response = await alchemy.core.getTokenBalances(
  //       primaryWallet?.address
  //     );
  //     console.log("response: ", response);
  //     if (response.tokenBalances.length > 0)
  //       setExistingTokenList(response.tokenBalances);
  //   }
  // };

  useEffect(() => {
    fetchBalances();
    setSearchKeyword("");
  }, [open]);
  const getTokenBalance = (tokenAddress: string, decimals: number) => {
    let balanceOfToken = 0;
    existingTokenList.map((item: any) => {
      if (item.contractAddress.toLowerCase() === tokenAddress.toLowerCase()) {
        const amount = BigInt(item.tokenBalance);
        balanceOfToken = Number(ethers.formatUnits(String(amount), decimals));
      }
    });
    return balanceOfToken.toFixed(3);
  };
  const searchTokenAddress = async () => {
    const metadata = await alchemy.core.getTokenMetadata(searchKeyword);
    if (metadata) {
      const response = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${searchKeyword}`,
        {
          method: "GET",
          headers: {},
        }
      );
      const data = await response.json();
      console.log("searchtoken", data);
      let logo = "";
      try {
        logo = data.pairs[0].info.imageUrl;
      } catch (err) {
        logo =
          "https://img.freepik.com/free-vector/ethereum-cryptocurrency-coin-neon-sign_1262-20744.jpg?semt=ais_hybrid";
      }
      console.log("logo=>", logo);

      const newFoundToken = {
        address: searchKeyword,
        name: metadata.name,
        symbol: metadata.symbol,
        decimals: metadata.decimals,
        logoURI: logo,
      };
      setSearchTokens([newFoundToken]);
    } else {
      setSearchTokens([]);
    }
  };
  useEffect(() => {
    if (ethers.isAddress(searchKeyword)) {
      searchTokenAddress();
    } else {
      const result = AllTokenData.tokens.filter((item: any) => {
        if (
          (item.name
            .toString()
            .toLowerCase()
            .includes(String(searchKeyword).toLowerCase()) ||
            item.symbol
              .toString()
              .toLowerCase()
              .includes(String(searchKeyword).toLowerCase())) &&
          item.chainId === chain
        ) {
          return item;
        }
      });
      setSearchTokens(result);
    }
  }, [searchKeyword]);
  const formatEthereumAddress = (address: string) => {
    // Check if the address starts with '0x' and is 42 characters long
    if (address.startsWith("0x") && address.length === 42) {
      // Extract the first three and last three characters
      const start = address.slice(0, 5); // '0xabc'
      const end = address.slice(-3); // 'xyz'

      // Return the formatted address
      return `${start}...${end}`;
    } else {
      throw new Error("Invalid Ethereum address");
    }
  };
  const shortenName = (name: string) => {
    // Check if the name length is greater than 10
    if (name.length > 25) {
      // Truncate the name to 7 characters and add an ellipsis
      return name.slice(0, 22) + "...";
    }
    // If the name is already 10 letters or less, return it as is
    return name;
  };

  const handleCopy = (
    event: React.MouseEvent<HTMLDivElement>,
    text: string
  ) => {
    event.stopPropagation();
    navigator.clipboard
      .writeText(text)
      .then(() => {
        console.log("Text copied to clipboard:", text);
        toast.success("Copied!");
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };

  return (
    <>
      <Transition appear show={open} as={Fragment}>
        <Dialog as="div" className="relative" onClose={onClose}>
          <div className="fixed inset-0 bg-black/65 z-40" />
          <div className="fixed inset-0 py-10 overflow-y-auto z-40">
            <div className="flex min-h-full items-center justify-center text-center">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="max-w-sm w-full min-h-[670px] flex flex-col rounded-2xl bg-[#33363F] text-left align-middle shadow-xl transition-all  border-[#33363F] border-2 ">
                  <Toaster/>
                  <div className="w-full flex flex-col gap-2 ">
                    <div className="flex flex-row items-center mx-2">
                      <div className="flex p-2 gap-1justify-center items-center rounded-xl w-full">
                        <Search className="text-gray-300 text-xl" />
                        <input
                          className="w-full border-none bg-transparent px-4 py-2 text-gray-300 text-sm outline-none"
                          type="text"
                          placeholder="Enter the token symbol or address"
                          value={searchKeyword}
                          onChange={(e) => {
                            setSearchKeyword(e.target.value);
                          }}
                        />
                      </div>
                      <X
                        className="text-xl text-gray-300 cursor-pointer"
                        onClick={onClose}
                      />
                    </div>
                    <Separator className=" bg-[#454851]" />

                    <div className="flex flex-wrap items-start gap-4 p-3">
                      {filterTokens.map((item: any, key: number) => {
                        return (
                          <div
                            key={key}
                            className="flex gap-2 rounded-full border-1 border-[#454851] border p-2 justify-center items-center cursor-pointer hover:bg-[#454851]"
                            onClick={() => {
                              onClose();
                              setSelectedToken(item);
                              setSelectedTokenBalance(
                                getTokenBalance(
                                  item.address,
                                  Number(item.decimals)
                                ).toString()
                              );
                            }}
                          >
                            <img src={item.logoURI} className="h-4 w-4 " />
                            <div className="text-sm text-gray-300">
                              {item.symbol}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {searchTokens.length > 0 && (
                      <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto custom-scrollbar p-3 pr-2 mt-2 mb-2">
                        {searchTokens.map((item: any, key: number) => {
                          return (
                            <div
                              key={key}
                              className={`flex gap-2 p-2 pr-4 justify-between items-center cursor-pointer  hover:rounded-md ${
                                selectedToken?.name == item.name
                                  ? "bg-[#484839] rounded-md hover:bg-[#484839]"
                                  : "hover:bg-[#3B3E47]"
                              }`}
                              onClick={() => {
                                onClose();
                                setSelectedToken(item);
                                setSelectedTokenBalance(
                                  getTokenBalance(
                                    item.address,
                                    Number(item.decimals)
                                  ).toString()
                                );
                              }}
                            >
                              <div className="flex gap-2 justify-center items-center">
                                <div className="relative w-10 h-10 flex flex-row items-end">
                                  <img
                                    src={item.logoURI}
                                    className="h-8 w-8 rounded-full"
                                  />
                                  <div className="w-4 h-4 absolute bottom  right-1  rounded-sm">
                                    <img
                                      src={chain == 8453 ? BASE : ARBITRUM}
                                      alt="ETH"
                                    ></img>
                                  </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                  <div className="text-lg text-white">
                                    {item.symbol}
                                  </div>
                                  <div className="flex flex-row gap-1 text-[12px] text-gray-400">
                                    <div className="">
                                      {shortenName(item.name)}
                                    </div>
                                    <div
                                      className="bg-[#4F5259] hover:text-white rounded-full px-2 flex flex-row gap-1 justify-between items-center"
                                      onClick={(event) =>
                                        handleCopy(event, item.address)
                                      }
                                    >
                                      <div>
                                        {formatEthereumAddress(item.address)}
                                      </div>
                                      <BookCopy className="h-3 w-3" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="text-gray-300 text-xl flex flex-row gap-2 items-center">
                                {getTokenBalance(
                                  item.address,
                                  Number(item.decimals)
                                )}
                                {selectedToken?.name == item.name && <Check />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {searchTokens.length === 0 && (
                      <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto custom-scrollbar p-3 pr-2 mt-2 mb-2">
                        <div className="flex justify-center items-center text-gray-300 text-xl w-full">
                          <div>No results found.</div>
                        </div>
                      </div>
                    )}
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default SelectTokenModal;

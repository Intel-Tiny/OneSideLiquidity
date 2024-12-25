/* eslint-disable */
import { useEffect } from "react";
import { ChevronDown } from "lucide-react";
import BASE from "/Base.svg";
import ARBITRUM from "/arbitrum.svg";
const LOGO =
  "https://ivory-accurate-pig-375.mypinata.cloud/ipfs/QmNxKrGR1ZJ3bKYdyYXf8tuTtKF3zaDShmmFdFABfXFdJQ?pinataGatewayToken=Yn-z4l06l9aFDk0xk-gQmyfHbcCrqKcsqSbuEqjtGUOHqRX5DEWFe-t-7SxbqmMf";
import { useState, ChangeEvent } from "react";
import { TokenList } from "../../utils/tokenList";
import {
  factoryABI,
  nonfungiblePositionManagerABI,
  vaultFactoryABI,
  vaultABI,
} from "../../utils/constants";
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
import { Tooltip } from "react-tooltip";
import Uniswap_LOGO from "/uniswap.webp";
import ChainSelector from "../utilities/ChainSelector";
import { Wallet } from "@dynamic-labs/sdk-react-core";
import AnalyticsDashboard from "../analytics/AnalyticsDashboard";
import { computeV2PairAddress } from "../../utils/graphQueries";
import FALLBACK_TOKEN from "/token-placeholder.svg";
import { URL } from "../../utils/setting";
import { getTokenInfo, getTokenMoreInfo } from "../../utils/api";
import HERMES from '/Hermes.webp';

type DynamicWallet = Wallet<any>;

const Icon = [
  {
    icon: ARBITRUM,
    name: "Arbitrum",
    chainId: arbitrum.id,
    routerAddress: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
    factoryAddress: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    GoddogTokenAddress: "0x45940000009600102a1c002f0097c4a500fa00ab",
    vaultFactoryAddress: "0x5B7B8b487D05F77977b7ABEec5F922925B9b2aFa",
  },
  {
    icon: BASE,
    name: "Base",
    chainId: base.id,
    routerAddress: "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1",
    factoryAddress: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD",
    GoddogTokenAddress: "0xDDf7d080C82b8048BAAe54e376a3406572429b4e",
    HeremusTokenAddress: "0x45940000009600102a1c002f0097c4a500fa00ab",
    vaultFactoryAddress: "0x5B7B8b487D05F77977b7ABEec5F922925B9b2aFa",
  },
];

const MEMETOKENADDRESS = [
  "0x45940000009600102a1c002f0097c4a500fa00ab",
  "0xDDf7d080C82b8048BAAe54e376a3406572429b4e",
]


const MainTokens = [
  "0xDDf7d080C82b8048BAAe54e376a3406572429b4e",
  "0x45940000009600102a1c002f0097c4a500fa00ab",
];
const BasicTokens = [
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

interface SelectedTokenType {
  name: string;
  symbol: string;
  logoURI: string;
  address: string;
  decimals: number;
}

interface PoolType {
  poolAddress: string;
  positionId: string;
  token0: string;
  token1: string;
  fee: number;
  lowerTick: number;
  upperTick: number;
  amount: number;
  sqrtPrice: number;
  recipient: string;
  chain: number;
  mainToken?: string;
}

interface VaultType {
  poolAddress: string;
  vaultAddress: string;
  token0: string;
  token1: string;
  depositAmount: number;
  chain: number;
  mainToken?: string;
}

const tokenABI = [
  // Only include the approve function
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function allowance(address owner, address spender) public view returns (uint256)",
  "function decimals() public view returns (uint256)",
];

const handleImageError = (
  event: React.SyntheticEvent<HTMLImageElement, Event>
) => {
  event.currentTarget.src = FALLBACK_TOKEN;
};

function Homepage() {
  const [isSelectChain, setSelectChain] = useState(false);
  const [chain, setChain] = useState<number | undefined>(undefined);
  const [myTokenList, setMyTokenList] = useState<any>(null);
  const [selectedToken, setSelectedToken] = useState<SelectedTokenType | null>(
    null
  );
  const [selectedTokenBalance, setSelectedTokenBalance] = useState("");
  const [show, setShow] = useState(false);
  const [previewShow, setPreviewShow] = useState(false);
  const [amount, setAmount] = useState("");
  const [tokenPrice, setTokenPrice] = useState(0);
  const { primaryWallet } = useDynamicContext() as {
    primaryWallet: DynamicWallet | null;
  };
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isApprove, setIsApprove] = useState(false);
  const [approvedAmount, setApprovedAmount] = useState(0);
  const [currentTick, setCurrentTick] = useState<number>(0);
  const [lowerTick, setLowerTick] = useState<number>(0);
  const [upperTick, setUpperTick] = useState<number>(0);
  const [lowRange] = useState(0.958);
  const [highRange] = useState(3.0);
  const [poolPair, setPoolPair] = useState<Array<PoolType>>([]);
  const [vaultPair, setVaultPair] = useState<Array<VaultType>>([]);
  const [isDeposit, setIsDeposit] = useState<boolean>(false);
  const [tokenSymbols, setTokenSymbols] = useState<{ [key: string]: string }>(
    {}
  );
  const [depositAddress, setDepositAddress] = useState<string>("");

  const managerAddress: string = "0xB05Cf01231cF2fF99499682E64D3780d57c80FdD";
  const maxTotalSupply: string =
    "115792089237316195423570985008687907853269984665640564039457584007913129639935";

  useEffect(() => {
    console.log("chaind");
    const vault = vaultPair.find(
      (vault) => vault.vaultAddress === depositAddress
    );
    console.log("vault", vault, "depositAddress", depositAddress);
    if (vault) {
      SetToken(vault);
    }
  }, [depositAddress]);

  const SetToken = async (vault: VaultType) => {
    let TokenData: any = null;
    if (MainTokens.includes(vault.token0)) {
      TokenData = await getTokenMoreInfo(vault.token1);
    } else {
      TokenData = await getTokenMoreInfo(vault.token0);
    }
    setIsDeposit(true);

    console.log("TokenData", TokenData);
    if (TokenData) {
      let tokenData = {
        name: TokenData.baseToken.name,
        symbol: TokenData.baseToken.symbol,
        logoURI: TokenData.baseToken.logoURI,
        address: TokenData.baseToken.address,
        decimals: TokenData.baseToken.decimals,
      };
      setSelectedToken(tokenData);
      setSelectedTokenInfo(tokenData);
    }
  };
  const selectPoolFromPair = (poolAddress: string) => {
    const selectedPool = poolPair.find(
      (pool) => pool.poolAddress === poolAddress
    );
    return selectedPool;
  };

  const CreateVault = async (address: string) => {
    console.log("Creating vault for address:", address);

    try {
      const signer = await getSigner(primaryWallet as any);
      if (!signer) {
        console.error("No signer available");
        return false;
      }
      console.log("chain: ", chain);
      if (chain != 0 && chain != 1) {
        console.error("chain not selected");
        return false;
      }
      const vaultFactoryContract = new ethers.Contract(
        Icon[chain].vaultFactoryAddress,
        vaultFactoryABI,
        signer
      );
      const param = {
        pool: address,
        manager: managerAddress,
        managerFee: 59420,
        rebalanceDelegate: managerAddress,
        maxTotalSupply: BigInt(maxTotalSupply),
        baseThreshold: 5400,
        limitThreshold: 12000,
        fullRangeWeight: 200000,
        period: 518400,
        minTickMove: 0,
        maxTwapDeviation: 100,
        twapDuration: 60,
        name: "Alpha Vault",
        symbol: "AV",
      };
      console.log("param: ", param);
      const tx = await vaultFactoryContract.createVault(param);
      const receipt = await tx.wait();
      console.log("receipt: ", receipt);
      console.log("receipt.logs: ", receipt.logs);
      let vaultAddress = "";
      const VaultLog = receipt.logs.find(
        (log: { topics: string[]; Data: any }) =>
          log.topics[0] === ethers.id("NewVault(address)")
      );
      console.log("VaultLog: ", VaultLog);
      vaultAddress = VaultLog.data;
      const pool = selectPoolFromPair(address);
      if (!pool) {
        return;
      }
      if (chain === undefined) {
        toast.error("Please select chain");
        return;
      }
      const selectedTokenContract = new ethers.Contract(
        pool.token0 === MEMETOKENADDRESS[chain]
          ? pool?.token1
          : pool?.token0,
        tokenABI,
        signer
      );
      const _decimal = await selectedTokenContract.decimals();
      const _amount = ethers.parseUnits(String(pool?.amount), _decimal);
      handleVault({
        poolAddress: pool?.poolAddress || "",
        vaultAddress: String("0x" + vaultAddress.slice(-40)),
        token0: pool?.token0 || "",
        token1: pool?.token1 || "",
        depositAmount: Number(_amount),
        chain: chain,
      });
      toast.success("Successfully created new vault!");
      return true;
    } catch (error) {
      toast.error("failed!");
      console.log(error);
      return false;
    }
  };

  const handleVault = async (vault: VaultType) => {
    axios
      .post(`${URL}/update/vault`, { vault })
      .then((response) => {
        console.log("Vault created successfully:", response.data);
        if (response.data.state === "success") {
          toast.success("Vault created successfully", response.data.vault);
          setVaultPair((prevVaultPair) => [
            ...prevVaultPair,
            response.data.vault,
          ]);
          setPoolPair((prevPoolPair) =>
            prevPoolPair.filter(
              (pool) => pool.poolAddress !== response.data.vault.poolAddress
            )
          );
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const fetchTokenSymbols = async () => {
    const symbols: { [key: string]: string } = {};
    for (const pool of poolPair) {
      symbols[pool.token0] = await getTokenInfo(pool.token0);
      symbols[pool.token1] = await getTokenInfo(pool.token1);
    }
    for (const vault of vaultPair) {
      symbols[vault.token0] = await getTokenInfo(vault.token0);
      symbols[vault.token1] = await getTokenInfo(vault.token1);
    }
    setTokenSymbols(symbols);
  };
  const [createdPosition, setCreatedPosition] = useState<{
    poolAddress: string;
    positionId: string;
  } | null>(null);
  const [maxClicked, setMaxClicked] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const getTokenBalance = async (tokenAddress: string) => {
    if (!primaryWallet?.address) return "0";
    try {
      const signer = await getSigner(primaryWallet as any);
      if (!signer) {
        console.error("No signer available");
        return "0";
      }

      const contract = new ethers.Contract(
        tokenAddress,
        [
          "function balanceOf(address) view returns (uint256)",
          "function decimals() view returns (uint256)",
        ],
        signer
      );

      const balance = await contract.balanceOf(primaryWallet.address);
      const _decimal = await contract.decimals();
      return ethers.formatUnits(balance, Number(_decimal));
    } catch (error) {
      console.error("Error fetching balance:", error);
      return "0";
    }
  };

  const setSelectedTokenInfo = async (item: SelectedTokenType) => {
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
    console.log("item: ", item);
    const balance = await getTokenBalance(item.address);
    console.log("balance: ", balance);
    setSelectedTokenBalance(balance);
  };
  useEffect(() => {
    console.log("this is load");
    axios
      .get(`${URL}/load/uniswap`, {
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      })
      .then((response) => {
        if (response.data.state === "success") {
          setPoolPair(response.data.pool);
          setVaultPair(response.data.vault);
          console.log("poolPair", response.data);
        } else {
          console.log("error", response.data.state);
        }
      })
      .catch((error) => {
        console.log("error", error);
      });
  }, []);

  useEffect(() => {
    if (poolPair) {
      fetchTokenSymbols();
    }
  }, [poolPair]);

  useEffect(() => {
    console.log("this is chain ", chain)
    const updateBalance = async () => {
      if (selectedToken) {
        const balance = await getTokenBalance(selectedToken.address);
        setSelectedTokenBalance(balance);
      }
    };
    updateBalance();
  }, [selectedToken, primaryWallet, chain]);

  const handleInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value.length && value[0] !== ".") {
      const inValue: string = value[value.length - 1];
      if (inValue === "." || (inValue >= "0" && inValue <= "9")) {
        setAmount(value);
        setMaxClicked(false);
      }
    } else {
      setAmount("");
      setIsApprove(false);
      setIsButtonDisabled(true);
      setMaxClicked(false);
    }
  };

  useEffect(() => {
    console.log("approvedAmount: ", approvedAmount);
    if (approvedAmount >= Number(amount) && amount != "") {
      setIsApprove(true);
    } else {
      setIsApprove(false);
    }
  }, [amount]);

  const handleRangeClick = () => {
    if (Number(selectedTokenBalance)) {
      const balance = String(Number(selectedTokenBalance));
      setAmount(balance);
      setMaxClicked(true);
      setIsApprove(approvedAmount >= parseFloat(balance));
      setIsButtonDisabled(false);
    }
  };

  useEffect(() => {
    if (selectedToken) {
      setMaxClicked(false);
      setIsApprove(false);
      setAmount("");
    }
  }, [selectedToken]);

  useEffect(() => {
    if (amount !== "") {
      if (parseFloat(amount) > parseFloat(selectedTokenBalance)) {
        setIsButtonDisabled(true);
        setIsApprove(false);
      } else {
        setIsButtonDisabled(false);
        if (approvedAmount >= parseFloat(amount)) {
          setIsApprove(true);
        } else {
          setIsApprove(false);
        }
      }
    } else {
      setIsButtonDisabled(true);
      setIsApprove(false);
    }
  }, [amount, selectedTokenBalance, approvedAmount]);

  useEffect(() => {
    setMyTokenList(TokenList);
  }, []);

  const switchNetwork = async () => {
    try {
      if (!primaryWallet || chain === undefined) return;
      if (primaryWallet?.connector.supportsNetworkSwitching()) {
        await primaryWallet.switchNetwork(Icon[chain].chainId);
        setSelectedToken(null);
        setSelectedTokenBalance("");
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
      await switchNetwork();
    } catch (error) {
      console.error("Error switching network:", error);
    }
  };

  useEffect(() => {
    handleNetworkSwitch();
  }, [chain, primaryWallet]);

  useEffect(() => {
    const updatePricesAndTicks = async () => {
      if (!selectedToken || chain === undefined) {
        return;
      }
      if (chain === undefined) {
        toast.error("Please select Chain!");
        return;
      }
      try {
        let address1 = selectedToken.address;
        let address2 = MEMETOKENADDRESS[chain];
        let token0: string, token1: string;

        if (address1.toLowerCase() < address2.toLowerCase()) {
          token0 = address1;
          token1 = address2;
        } else {
          token0 = address2;
          token1 = address1;
        }

        const [price1, price2] = await calculateTokenPrices(token0, token1);
        if (!price1 || !price2) {
          console.error("Failed to fetch token prices");
          return;
        }

        let currentPrice = Number(price1) / Number(price2);
        const state = token0 === address1;

        // Calculate price ranges
        const lowerPrice = state
          ? currentPrice * lowRange
          : currentPrice / lowRange;
        const upperPrice = state
          ? currentPrice * highRange
          : currentPrice / highRange;

        // Calculate ticks
        const resLower = getPriceAndTickFromValues(lowerPrice);
        const resUpper = getPriceAndTickFromValues(upperPrice);
        const resCurrent = getPriceAndTickFromValues(currentPrice);

        if (
          resLower.tick !== undefined &&
          resUpper.tick !== undefined &&
          resCurrent.tick !== undefined
        ) {
          const tickSpacing = 200; // Use 200 for this pool

          // Adjust ticks based on token order and spacing
          const baseTickLower = state ? resLower.tick : -resUpper.tick;
          const baseTickUpper = state ? resUpper.tick : -resLower.tick;

          // Round to nearest valid tick
          const normalizedLowerTick =
            Math.ceil(baseTickLower / tickSpacing) * tickSpacing;
          const normalizedUpperTick =
            Math.floor(baseTickUpper / tickSpacing) * tickSpacing;

          console.log("Setting ticks:", {
            lower: normalizedLowerTick,
            upper: normalizedUpperTick,
            current: resCurrent.tick,
            currentPrice,
            lowerPrice,
            upperPrice,
          });

          setLowerTick(normalizedLowerTick);
          setUpperTick(normalizedUpperTick);
          setCurrentTick(resCurrent.tick);
        }
      } catch (error) {
        console.error("Error updating prices and ticks:", error);
      }
    };

    updatePricesAndTicks();
  }, [selectedToken, chain, lowRange, highRange]);

  const checkPoolExists = async (
    tokenA: string,
    tokenB: string,
    fee: number
  ) => {
    if (chain === undefined) return false;

    const signer = await getSigner(primaryWallet as any);

    const factoryContract = new ethers.Contract(
      Icon[chain].factoryAddress,
      factoryABI,
      signer
    );

    try {
      const poolAddress = await factoryContract.getPool(tokenA, tokenB, fee);
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
    const _tempPrice = Math.sqrt(2 ** 192 * price);
    let _tick = univ3prices.tickMath.getTickAtSqrtRatio(_tempPrice);
    _tick = _tick - (_tick % 200);
    const _price = BigInt(
      univ3prices.tickMath.getSqrtRatioAtTick(_tick).toString()
    );
    return { tick: _tick, price: _price };
  };

  const handleApprove = async () => {
    if (!selectedToken || chain === undefined) return;
    setIsApprove(true);
    setIsLoading(true);
    if (primaryWallet) {
      try {
        const signer = await getSigner(primaryWallet as any);
        const selectedTokenContract = new ethers.Contract(
          selectedToken.address,
          tokenABI,
          signer
        );
        const _decimal = await selectedTokenContract.decimals();
        let targetAddress = Icon[chain].routerAddress;
        console.log("targetAddress: ", targetAddress);
        if (isDeposit) targetAddress = depositAddress;
        console.log("targetAddress: ", targetAddress);
        const tx = await selectedTokenContract.approve(
          targetAddress,
          ethers.parseUnits(amount, _decimal)
        );
        await tx.wait();
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
    const url = `https://api.dexscreener.com/latest/dex/tokens/${address}`;
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
    return [price1, price2];
  };

  const getApprovedAmountOfSelectedToken = async () => {
    if (!selectedToken || chain === undefined) return;
    try {
      const signer = await getSigner(primaryWallet as any);
      const selectedTokenContract = new ethers.Contract(
        selectedToken.address,
        tokenABI,
        signer
      );
      let targetAddress = Icon[chain].routerAddress;
      if (isDeposit) targetAddress = depositAddress;
      const approvedAmount0 = await selectedTokenContract.allowance(
        primaryWallet?.address,
        targetAddress
      );
      const _decimal = await selectedTokenContract.decimals();

      const approvedAmount1 = ethers.formatUnits(approvedAmount0, _decimal);

      setApprovedAmount(Number(approvedAmount1));
    } catch (error) {
      console.error("Error fetching approved amount:", error);
    }
  };

  useEffect(() => {
    if (selectedToken) {
      getApprovedAmountOfSelectedToken();
      setAmount("");
    }
  }, [selectedToken]);

  const handleDeposit = async () => {
    if (!selectedToken || chain === undefined) return;
    try {
      setIsLoading(true);
      const signer = await getSigner(primaryWallet as any);
      if (!signer) {
        toast.error("No signer available");
        return;
      }
      console.log("depositAddress: ", depositAddress);
      const vaultContract = new ethers.Contract(
        depositAddress,
        vaultABI,
        signer
      );
      const token0 = await vaultContract.token0();
      const same = String(token0) == selectedToken.address;
      const selectedTokenContract = new ethers.Contract(
        selectedToken.address,
        tokenABI,
        signer
      );
      const _decimal = await selectedTokenContract.decimals();
      const _amount = ethers.parseUnits(amount, _decimal);
      const tx = await vaultContract.deposit(
        same ? _amount : 0,
        !same ? _amount : 0,
        0,
        0,
        primaryWallet?.address
      );
      await tx.wait();

      axios
        .post(`${URL}/update/deposit`, {
          vaultAddress: depositAddress,
          depositAmount: Number(_amount),
        })
        .then((response) => {
          if (response.data.state === "success") {
            toast.success("Successfully deposited");
          } else {
            toast.error("Error updating deposit");
          }
        })
        .catch((error) => {
          console.error("Error updating deposit:", error);
          toast.error("Error updating deposit");
        });
      setIsLoading(false);
      setPreviewShow(false);
    } catch (error) {
      console.log(error);
      setIsLoading(false);
    }
  };
  const handleAddLiquidity = async () => {
    if (!selectedToken || chain === undefined) return;
    setIsLoading(true);

    try {
      // Input validation
      if (!amount || parseFloat(amount) <= 0) {
        toast.error("Please enter a valid amount");
        setIsLoading(false);
        return;
      }

      const signer = await getSigner(primaryWallet as any);
      if (!signer) {
        toast.error("No signer available");
        setIsLoading(false);
        return;
      }

      // Initialize contracts
      const nonfungiblePositionManager = new ethers.Contract(
        Icon[chain].routerAddress,
        nonfungiblePositionManagerABI,
        signer
      );

      // Validate token order
      if(chain === undefined) {
        toast.error("Please select a chain");
        setIsLoading(false);
        return;
      }
      let address1 = selectedToken.address;
      let address2 = MEMETOKENADDRESS[chain];
      const fee = BigInt("10000");

      let token0: string, token1: string;
      const isToken0 = address1.toLowerCase() < address2.toLowerCase();
      if (isToken0) {
        token0 = address1;
        token1 = address2;
      } else {
        token0 = address2;
        token1 = address1;
      }

      // Check user's balance
      const tokenContract = new ethers.Contract(
        selectedToken.address,
        [
          "function balanceOf(address) view returns (uint256)",
          "function allowance(address,address) view returns (uint256)",
          "function decimals() view returns (uint256)",
        ],
        signer
      );

      // Calculate desired amount with proper decimal handling
      const _decimal = await tokenContract.decimals();
      const desiredAmount = ethers.parseUnits(amount, _decimal);

      const balance = await tokenContract.balanceOf(primaryWallet?.address);
      if (balance < desiredAmount) {
        toast.error("Insufficient balance");
        setIsLoading(false);
        return;
      }

      // Check allowance
      const allowance = await tokenContract.allowance(
        primaryWallet?.address,
        Icon[chain].routerAddress
      );
      if (allowance < desiredAmount) {
        toast.error("Please approve the token first");
        setIsLoading(false);
        return;
      }

      // Check if pool exists and initialize if needed
      const poolExists = await checkPoolExists(token0, token1, Number(fee));
      if (poolExists) {
        toast.error("The position already exist!");
        setIsLoading(false);
        return;
      }
      const [price1, price2] = await calculateTokenPrices(token0, token1);
      let currentPrice = Number(price1) / Number(price2);

      const createFunctionSignature =
        "createAndInitializePoolIfNecessary(address,address,uint24,uint160)";
      // Calculate initial sqrt price based on current price
      const lowerPrice = isToken0
        ? currentPrice * lowRange
        : currentPrice / lowRange;
      const upperPrice = isToken0
        ? currentPrice * highRange
        : currentPrice / highRange;
      console.log("lowerPrice: ", lowerPrice);
      console.log("upperPrice: ", upperPrice);
      const resLower = getPriceAndTickFromValues(lowerPrice);
      console.log("resLower: ", resLower.tick);
      const resUpper = getPriceAndTickFromValues(upperPrice);
      console.log("resUpper: ", resUpper.tick);
      const tickLower = isToken0 ? resLower.tick + 200 : resUpper.tick;
      const tickUpper = isToken0 ? resUpper.tick : resLower.tick - 200;
      const sqrtPrice = resLower.price;
      console.log("sqrtPrice: ", sqrtPrice);
      const iface = new ethers.Interface(nonfungiblePositionManagerABI);
      const params1 = [token0, token1, fee, BigInt(sqrtPrice)];
      console.log("params1:", params1);
      const data1 = iface.encodeFunctionData(createFunctionSignature, params1);
      console.log("data1", data1);
      const mintFunctionSignature =
        "mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))";

      const params2 = [
        {
          token0: token0,
          token1: token1,
          fee: fee,
          tickLower: tickLower,
          tickUpper: tickUpper,
          amount0Desired: isToken0 ? desiredAmount : 0,
          amount1Desired: !isToken0 ? desiredAmount : 0,
          amount0Min: 0,
          amount1Min: 0,
          recipient: primaryWallet?.address,
          deadline: BigInt(Math.floor(Date.now() / 1000) + 1200),
        },
      ];

      console.log("Estimating gas for mint params:", params2);
      const data2 = iface.encodeFunctionData(mintFunctionSignature, params2);
      const txData = [data1, data2];
      const tx = await nonfungiblePositionManager.multicall(txData);
      toast.loading("Transaction pending...", { id: "tx-pending" });
      const receipt = await tx.wait();
      toast.dismiss("tx-pending");

      // Get position ID from transaction receipt
      const positionId = receipt.logs.find(
        (log: { topics: string[] }) =>
          log.topics[0] ===
          ethers.id("IncreaseLiquidity(uint256,uint128,uint256,uint256)")
      )?.topics[1];

      const factoryContract = new ethers.Contract(
        Icon[chain].factoryAddress,
        factoryABI,
        signer
      );
      const poolAddress = await factoryContract.getPool(token0, token1, fee);
      console.log("positionId: ", positionId);
      console.log("poolAddress: ", poolAddress);

      setCreatedPosition({
        poolAddress,
        positionId: positionId || "",
      });

      handlePool({
        poolAddress: poolAddress,
        positionId: Number(positionId),
        token0: token0,
        token1: token1,
        fee: Number(fee),
        tickLower: Number(tickLower),
        tickUpper: Number(tickUpper),
        amount: Number(amount),
        recipient: primaryWallet?.address,
        sqrtPrice: Number(sqrtPrice),
        chain: chain,
      });

      toast.success("Position created successfully!");
      setSelectedTokenBalance(
        String(Number(selectedTokenBalance) - Number(amount))
      );
      setIsSuccess(true);
    } catch (error: any) {
      console.error("Transaction error:", error);
      if (error.reason) {
        toast.error(`Transaction failed: ${error.reason}`);
      } else if (error.message) {
        toast.error(`Transaction failed: ${error.message}`);
      } else {
        toast.error("Transaction failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const testPool = () => {
    handlePool({
      poolAddress: "0x2B8A4530030021026622e6FaF9265F0aEDa19AC7",
      positionId: "4038558",
      token0: "0x45940000009600102a1c002f0097c4a500fa00ab",
      token1: "0xAB8EBCC9eecc20Bd30c7b75c7b4e8fcCcFBf01aB",
      fee: 10000,
      tickLower: -10600,
      tickUpper: 400,
      amount: 50,
      recipient: primaryWallet?.address,
      sqrtPrice: 10000,
    });
  };

  const handlePool = (pool: object) => {
    axios
      .post(`${URL}/update/pool`, {
        pool,
      })
      .then((response) => {
        if (response.data.state === "success") {
          setPoolPair((prePair) => [...prePair, response.data.pool]);
        } else {
          toast.error("Error creating position");
        }
      })
      .catch((error) => {
        console.error("Error creating position:", error);
        toast.error("Error creating position");
      });
  };

  const calculateImpermanentLoss = (priceRatio: number) => {
    const sqrtRatio = Math.sqrt(priceRatio);
    const IL = (2 * sqrtRatio) / (1 + priceRatio) - 1;
    return Math.abs(IL);
  };

  const calculateAPR = () => {
    try {
      if (
        !selectedToken ||
        !amount ||
        !tokenPrice ||
        !upperTick ||
        !lowerTick
      ) {
        return "0";
      }

      const upperPrice = Math.pow(1.0001, upperTick);
      const lowerPrice = Math.pow(1.0001, lowerTick);
      const priceRatio = upperPrice / lowerPrice;

      const positionSize = parseFloat(amount) * tokenPrice;
      if (positionSize <= 0) return "0";

      const minimumYearlyVolume = positionSize * 2;
      const minimumDailyVolume = minimumYearlyVolume / 365;

      const feeTier = 0.01;
      const dailyFeeEarnings = minimumDailyVolume * feeTier;
      const yearlyFeeEarnings = dailyFeeEarnings * 365;

      const feeAPR = (yearlyFeeEarnings / positionSize) * 100;
      const priceReturn = (priceRatio - 1) * 100;
      const impLoss = calculateImpermanentLoss(priceRatio) * 100;

      const apr = feeAPR + priceReturn - impLoss;
      const result = Math.min(Math.max(0, apr), 999.99);

      return result.toFixed(1);
    } catch (error) {
      console.error("APR calculation error:", error);
      return "0";
    }
  };

  return (
    <div className="w-full h-screen overflow-auto hide-scrollbar bg-[#0A0A0A] text-white">
      <Toaster />

      {/* Title Section with Logo and Wallet */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800/30">
        <button
          onClick={() => (window.location.href = "/")}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <img src={LOGO} alt="Logo" className="h-8 w-8" />
          <span className="font-medium text-lg">GODDOG</span>
        </button>
        <DynamicWidget />
      </div>

      {/* Main Content */}
      <div className="mt-4 flex items-center justify-center">
        <div className="w-full max-w-2xl mx-auto px-6">
          {createdPosition ? (
            <AnalyticsDashboard
              poolAddress={createdPosition.poolAddress}
              positionId={createdPosition.positionId}
              chainId={chain || 0}
              walletAddress={primaryWallet?.address || ""}
            />
          ) : (
            <div className="bg-[#111111] rounded-2xl border border-gray-800/30 shadow-xl">
              {/* Header with Uniswap branding and chain selector */}
              <div className="p-3 border-b border-gray-800/30 flex justify-between items-center">
                <div
                  className="flex items-center"
                  // onClick={() => testPool()}
                >
                  <img src={Uniswap_LOGO} alt="Uniswap" className="h-5 w-5" />
                  <span className="text-xs text-gray-400">
                    Powered by Uniswap V3
                  </span>
                </div>
                <div className="relative flex">
                  <ChainSelector
                    chain={chain}
                    isOpen={isSelectChain}
                    setIsOpen={setSelectChain}
                    chains={Icon}
                    onChainSelect={setChain}
                    modalName="Select Chain"
                  />
                </div>
              </div>

              {/* Token Input */}
              <div className="p-3">
                <div className="bg-[#0A0A0A] rounded-xl p-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="text-xs text-gray-400 mb-1">Deposit</div>
                      <input
                        type="text"
                        className="w-full text-4xl bg-transparent outline-none font-medium"
                        placeholder="0"
                        value={amount}
                        onChange={handleInputChange}
                      />
                      <div className="text-xs text-gray-400 mt-1">
                        ~${(parseFloat(amount || "0") * tokenPrice).toFixed(2)}
                      </div>
                    </div>
                    <div
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 min-w-[120px] h-[40px] ${
                        selectedToken
                          ? "bg-[#1B1B1B] hover:bg-[#2D2D2D]"
                          : chain !== undefined
                          ? "bg-[#FFE804] text-black hover:bg-[#FFE804]/90"
                          : "bg-[#1B1B1B] hover:bg-[#2D2D2D]"
                      }`}
                      onClick={
                        () => {
                          if(chain === undefined )  {
                            toast.error("Please Select Chain");
                            return;
                          }
                          setShow(true)
                        }
                      }
                    >
                      {selectedToken ? (
                        <>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#2D2D2D] flex items-center justify-center overflow-hidden">
                              <img
                                src={selectedToken.logoURI || FALLBACK_TOKEN}
                                alt={selectedToken.symbol}
                                className="w-full h-full object-cover"
                                onError={handleImageError}
                              />
                            </div>
                            <span className="font-medium">
                              {selectedToken.symbol}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Select Token</span>
                        </div>
                      )}
                      <ChevronDown
                        className={`h-4 w-4 ml-auto ${
                          selectedToken
                            ? "text-gray-400"
                            : chain !== undefined
                            ? "text-black"
                            : "text-gray-400"
                        }`}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-1.5 text-xs text-gray-400">
                    <div className="flex items-center gap-2">
                      <span>Balance: {selectedTokenBalance}</span>
                      <button
                        onClick={handleRangeClick}
                        disabled={!selectedToken || maxClicked}
                        className={`px-2 py-0.5 text-xs rounded transition-colors ${
                          !selectedToken || maxClicked
                            ? "bg-[#2D2D2D] text-gray-500 cursor-not-allowed"
                            : "bg-[#FFE804] text-black hover:bg-[#FFE804]/90"
                        }`}
                      >
                        Max
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="px-3 pb-3">
                <button
                  className={`w-full py-3 rounded-xl font-medium transition-all duration-200 ${
                    chain === undefined || !selectedToken
                      ? "bg-[#1B1B1B] text-gray-400 cursor-not-allowed"
                      : isLoading
                      ? "bg-blue-500/90 text-white hover:bg-blue-500"
                      : isApprove
                      ? "bg-[#FFE804] text-black hover:bg-[#FFE804]/90"
                      : amount && !isButtonDisabled
                      ? "bg-[#FFE804] text-black hover:bg-[#FFE804]/90"
                      : "bg-[#1B1B1B] text-gray-400 cursor-not-allowed"
                  }`}
                  onClick={() => {
                    if (chain === undefined) {
                      setSelectChain(true);
                    } else if (!selectedToken) {
                      setShow(true);
                    } else if (
                      !isLoading &&
                      !isApprove &&
                      amount &&
                      !isButtonDisabled
                    ) {
                      handleApprove();
                    } else if (isApprove) {
                      setPreviewShow(true);
                    }
                  }}
                  disabled={
                    chain === undefined ||
                    !selectedToken ||
                    isButtonDisabled ||
                    (!amount && !isApprove)
                  }
                >
                  {chain === undefined ? (
                    "Select Chain"
                  ) : !selectedToken ? (
                    "Select Token"
                  ) : amount === "" ? (
                    "Enter Amount"
                  ) : isLoading ? (
                    <Loader />
                  ) : isApprove ? (
                    "Preview"
                  ) : (
                    "Approve"
                  )}
                </button>
              </div>

              {/* Liquidity Visualization */}
              <div className="p-3 border-t border-gray-800/30">
                <InteractiveLiquidityVisualization
                  currentTick={currentTick}
                  lowerTick={lowerTick}
                  upperTick={upperTick}
                  amount={amount}
                  initialUsdValue={parseFloat(amount || "0") * tokenPrice}
                  calculatedAPR={selectedToken ? calculateAPR() : "0%"}
                  selectedToken={selectedToken}
                  chainId={chain || 0}
                  v2PairAddress={
                    selectedToken && chain !== undefined 
                      ? computeV2PairAddress(
                          Icon[chain].factoryAddress,
                          selectedToken.address,
                          MEMETOKENADDRESS[chain]
                        )
                      : undefined
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Token Selector Modal */}
      {show && (
        <SelectTokenModal
          open={show}
          onClose={() => setShow(false)}
          chain={chain ?? -1}
          AllTokenData={myTokenList}
          BasicTokens={BasicTokens}
          selectedToken={selectedToken}
          setSelectedToken={setSelectedTokenInfo}
          setSelectedTokenBalance={setSelectedTokenBalance}
          CreateVault={CreateVault}
          poolPair={poolPair}
          vaultPair={vaultPair}
          checkPoolExists={checkPoolExists}
          tokenSymbols={tokenSymbols}
          setIsDeposit={setIsDeposit}
          
          setDepositAdress={setDepositAddress}
        />
      )}

      {/* Preview Modal */}
      {previewShow && selectedToken && (
        <PreviewModal
          open={previewShow}
          onClose={() => {
            setPreviewShow(false);
            if (isSuccess) {
              setIsSuccess(false);
              // Reset other necessary states if needed
            }
          }}
          onApprove={isDeposit ? handleDeposit : handleAddLiquidity}
          selectToken={selectedToken}
          tokenAmount={amount}
          isLoading={isLoading}
          isSuccess={isSuccess}
          chainId={chain}
          positionId={createdPosition?.positionId}
          isDeposit={isDeposit}
        />
      )}

      {/* Add tooltips */}
      <Tooltip id="fee-tooltip" className="max-w-xs">
        <div className="p-2">
          <p className="font-semibold mb-1">Fee Tier: 1%</p>
          <p>
            You earn 1% of all trading volume that occurs within your price
            range.
          </p>
        </div>
      </Tooltip>

      <Tooltip id="range-tooltip" className="max-w-xs">
        <div className="p-2">
          <p className="font-semibold mb-1">Price Range</p>
          <p>
            The price range in which your liquidity is active. You earn fees
            when trades happen within this range.
          </p>
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
            <li>
              Price movement from {lowerTick} to {upperTick}
            </li>
            <li>Subtracts maximum impermanent loss</li>
          </ul>
          <p className="mt-1 text-sm">
            This is a conservative estimate assuming only minimum required
            trading volume.
          </p>
        </div>
      </Tooltip>
    </div>
  );
}

export default Homepage;

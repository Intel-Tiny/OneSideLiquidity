import Card from '../tailus-ui/Card'
import { useEffect } from 'react'
import { Settings } from 'lucide-react'
import { ChevronDown } from 'lucide-react'
import BASE from '/Base.svg'
import ARBITRUM from '/arbitrum.svg'
import LOGO from '/logo.jpg'
import { useState, ChangeEvent } from 'react'
import Data from '../data'
import { DynamicWidget, useDynamicContext } from '@dynamic-labs/sdk-react-core'
import ChainItem from '../utilities/ChainItem'
import SelectTokenModal from '../utilities/SelectTokenModal'
import { base, arbitrum } from 'viem/chains'
// import Background from '../utilities/Background'
const Icon = [
  { icon: ARBITRUM, name: 'Arbitrum', chainId: arbitrum.id },
  { icon: BASE, name: 'Base', chainId: base.id }
]
const BasicTokens = [
  ['WETH', 'USDT', 'USDC', 'DAI'],
  ['ETH', 'ARB', 'WETH', 'USDT', 'USDC', 'DAI', 'MAIA', 'HERMES']
]
type selectedTokenType = {
  name: string
  symbol: string
  logoURI: string
  address: string
}
const ARB: selectedTokenType = {
  logoURI: 'https://arbitrum.foundation/logo.png',
  name: 'Arbitrum',
  symbol: 'ARB',
  address: ''
}
const USDC: selectedTokenType = {
  logoURI: 'https://ethereum-optimism.github.io/data/USDC/logo.png',
  name: 'USD Coin',
  symbol: 'USDC',
  address: ''
}
function Homepage () {
  const [isSelectChain, setSelectChain] = useState(false)
  // const [fee, setFee] = useState("1%");
  // const [text, setText] = useState("");
  // const [range, setRange] = useState('Max')
  const range = 'Max'
  const [chain, setChain] = useState(0)
  // const [walletBalance, setWalletBalance] = useState('0')
  const [myTokenList, setMyTokenList] = useState<any>(null)
  const [selectedToken, setSelectedToken] = useState<selectedTokenType>(ARB)
  const [selectedTokenBalance, setSelectedTokenBalance] = useState('')
  const [show, setShow] = useState(false)
  const [amount, setAmount] = useState('')
  const [tokenPrice, setTokenPrice] = useState(0)
  const { primaryWallet } = useDynamicContext()
  const [isButtonDisabled, setIsButtonDisabled] = useState(false)

  const setSelectedTokenInfo = (item: any) => {
    setSelectedToken(item)
    // console.log('token info ', item)
    // console.log('token amount', selectedTokenBalance)

    const tokenAddress = item.address // Replace with your token address
    const url = `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`

    fetch(url)
      .then(response => response.json())
      .then(data => {
        console.log('Token Price:', data.pairs[0].priceUsd) // Adjust based on the response structure
        setTokenPrice(data.pairs[0].priceUsd)
      })
      .catch(error => {
        setTokenPrice(0)
        console.log('price error', error)
      })
  }
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    if (value.length && value[0] != '0' && value[0] != '.') {
      let inValue: string = value[value.length - 1]
      if (inValue === '.' || (inValue >= '0' && inValue <= '9')) {
        setAmount(value)
      }
    } else setAmount('')
  }
  useEffect(() => {
    if (amount != '') {
      if (parseFloat(amount) > parseFloat(selectedTokenBalance))
        setIsButtonDisabled(false)
      else setIsButtonDisabled(true)
    } else {
      setIsButtonDisabled(false)
    }
  }, [amount])
  useEffect(() => {
    setMyTokenList(Data.Tokens)
  }, [])
  const updateBalance = async () => {
    if (!primaryWallet) return
    primaryWallet?.getBalance().then(balance => {
      if (balance) {
        // setWalletBalance(balance)
      }
    })
  }

  const switchNetwork = async () => {
    try {
      if (!primaryWallet) return
      if (primaryWallet?.connector.supportsNetworkSwitching()) {
        await primaryWallet.switchNetwork(Icon[chain].chainId) // Switch to the desired network
      }
    } catch (error) {
      console.error('Failed to switch network:', error)
    }
  }
  const handleNetworkSwitch = async () => {
    try {
      if (!primaryWallet) {
        // setWalletBalance('0')
        return
      }
      await switchNetwork() // Call the switchNetwork function
      await updateBalance() // Display the balance after switching networks
    } catch (error) {
      console.error('Error switching network:', error)
    }
  }
  useEffect(() => {
    handleNetworkSwitch() // Call the inner async function
  }, [chain, primaryWallet]) // Add all dependencies

  return (
    <div className='w-full h-dvh'>
      {myTokenList && (
        <SelectTokenModal
          open={show}
          onClose={() => setShow(false)}
          AllTokenData={myTokenList}
          chain={Icon[chain].chainId}
          BasicTokens={BasicTokens[chain]}
          // selectedToken={selectedToken}
          setSelectedToken={setSelectedTokenInfo}
          setSelectedTokenBalance={setSelectedTokenBalance}
          selectedToken={selectedToken}
        />
      )}
      <div className='bg-mainbg sticky top-0 border-b border-borderbg py-4 z-50'>
        <div className='mx-auto flex max-w-full items-center justify-end px-2 gap-2'>
          <div className=' absolute left-4'>
            <img
              src={LOGO}
              alt='LOGO'
              className='rounded-full w-12 h-12 border-2 border-white'
            />
          </div>
          <div className='relative'>
            <div
              className='bg-darkgrey rounded-md flex flex-row justify-between text-gray-500 p-1 gap-1 px-2 py-1 items-center hover:cursor-pointer'
              onClick={() => setSelectChain(!isSelectChain)}
            >
              <img
                src={Icon[chain].icon}
                alt='icon'
                className='w-8 h-8 rounded-full'
              ></img>
              <ChevronDown />
            </div>
            {isSelectChain && (
              <div className='absolute z-50 right-0 mt-7 bg-modalbg rounded-lg w-52 p-2'>
                {Icon.map((item, index) => {
                  return (
                    <ChainItem
                      key={index}
                      item={item}
                      onClick={() => {
                        setChain(index)
                        setSelectChain(false)
                        if (index == 0) setSelectedToken(ARB)
                        else setSelectedToken(USDC)
                      }}
                      isActive={chain === index}
                    />
                  )
                })}
              </div>
            )}
          </div>
          <DynamicWidget variant='modal' />
        </div>
      </div>
      <div
        className={
          'relative w-full h-full bg-mainbg  lg:mr-0  lg:rounded-t-[--card-radius] mx-auto'
        }
      >
        <div className='mx-auto pt-6'>
          <div className='text-white text-center text-4xl '>
            Unleash Your Invesment Potential
          </div>
          <div className='text-gray-400 text-xl text-center'>
            Secure, innovative, and high-yield opportunities in the
          </div>
          <div className='text-gray-400 text-xl text-center items-center'>
            decentralized finance landscape
          </div>
        </div>
        <div className='w-full py-6 flex justify-center items-center'>
          <Card className='max-w-lg bg-cardbg border-borderbg flex flex-col gap-6'>
            <div className='text-white text-4xl text-center'>
              Srategic vault Deposit
            </div>
            <div className='flex flex-row justify-center items-center gap-1'>
              <div className='text-gray-200 text-2xl'>Performance Fee: 1%</div>
              <div className='text-gray-200 text-2xl  flex flex-row items-center gap-2'>
                <Settings />
              </div>
            </div>
            <div className='bg-modalbg rounded-xl border border-borderbg bg-mediumred flex flex-col gap-2 p-3'>
              <div className='flex flex-row justify-between items-baseline'>
                <input
                  className='text-5xl bg-modalbg outline-none text-gray-300 w-full p-0 m-0'
                  placeholder='0'
                  value={amount}
                  onChange={handleInputChange}
                ></input>
                <div
                  className='bg-darkgrey rounded-md flex flex-row text-gray-500 p-1 gap-1 py-1 items-center hover:cursor-pointer'
                  onClick={() => setShow(true)}
                >
                  <div className=' relative w-10 h-10 flex flex-row items-end'>
                    <img
                      src={
                        selectedToken?.logoURI
                          ? selectedToken?.logoURI
                          : Icon[chain].icon
                      }
                      alt='ETH'
                      className='w-10 h-10 rounded-full'
                    ></img>
                    <div className='bg-blue-950 w-5 h-5 absolute bottom  right-0 border-2 rounded-sm border-blue-950'>
                      <img src={Icon[chain].icon} alt='ETH'></img>
                    </div>
                  </div>

                  <ChevronDown />
                </div>
              </div>
              <div className='flex flex-row justify-between items-baseline'>
                <div className='text-gray-400 text-xl'>
                  {parseFloat(amount) > 0
                    ? '$' + (parseFloat(amount) * tokenPrice).toFixed(3)
                    : '-'}
                </div>
                <div className='text-gray-500 text-xl'>
                  {selectedTokenBalance !== ''
                    ? 'Balance: ' + selectedTokenBalance
                    : ''}
                </div>
              </div>
            </div>

            <div className='w-full'>
              <div className='flex row justify-between items-center gap-1'>
                {Data.Range.map((item, index) => {
                  return (
                    <button
                      key={index}
                      className={`w-full bg-buttonbg rounded-xl border  ${
                        item === range
                          ? 'border-white text-white font-bold'
                          : 'border-borderbg'
                      } hover:border-white py-2 text-gray-500 flex flex-row justify-center gap-2`}
                      // onClick={() => handleRangeClick(item)}
                    >
                      {item}
                    </button>
                  )
                })}
              </div>
            </div>
            <button
              className={`${
                isButtonDisabled
                  ? 'bg-red-700 hover:border-white text-white  border-red-500'
                  : 'bg-buttonbg text-gray-300 border-gray-600'
              } p-2 shadow-lg rounded-lg border `}
              disabled={isButtonDisabled}
            >
              {parseFloat(amount) <= parseFloat(selectedTokenBalance)
                ? parseFloat(amount) > 0
                  ? 'Start Approve'
                  : 'Deposit and Start Earning'
                : amount != ''
                ? 'Insufficient Balance'
                : 'Deposit and Start Earning'}
            </button>
          </Card>
        </div>
        <div className='mx-auto w-full'>
          <div className='text-gray-400 text-lg text-center'>
            Cerberus Inu: Guarding your assets with cutting-edge DeFi
          </div>
          <div className='text-gray-400 text-xl text-center'>
            strategies and multi-layered security protocols.
          </div>
        </div>
      </div>
    </div>
  )
}

export default Homepage

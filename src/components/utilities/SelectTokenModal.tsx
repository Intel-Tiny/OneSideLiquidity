import { Fragment, useEffect, useState } from 'react'
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild
} from '@headlessui/react'
import { X, Search } from 'lucide-react'
import Separator from '../tailus-ui/Separator'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { ethers } from 'ethers'
// import Moralis from "moralis";
import { Network, Alchemy } from 'alchemy-sdk'
import BASE from '/Base.svg'
import ARBITRUM from '/arbitrum.svg'
import { Check } from 'lucide-react'

type selectedTokenType = {
  name: string
  symbol: string
  logoURI: string
}

const SelectTokenModal = ({
  open,
  onClose,
  AllTokenData,
  chain,
  BasicTokens,
  selectedToken,
  setSelectedToken,
  setSelectedTokenBalance
}: {
  open: boolean
  onClose: () => void
  AllTokenData: any
  chain: number
  BasicTokens: any
  selectedToken: selectedTokenType
  setSelectedToken: (token: any) => void
  setSelectedTokenBalance: (balance: string) => void
}) => {
  const { primaryWallet } = useDynamicContext()
  const [filterTokens, setFilterTokens] = useState([])
  const [searchTokens, setSearchTokens] = useState<any>([])
  const [existingTokenList, setExistingTokenList] = useState<any>([])
  const [searchKeyword, setSearchKeyword] = useState<string>('')
  const config = {
    apiKey: 'G-_wYNAST6raSUPasw-Ql_qxT6CMK5w1',
    network: chain == 8453 ? Network.BASE_MAINNET : Network.ARB_MAINNET
  }
  const alchemy = new Alchemy(config)

  useEffect(() => {
    const filteredTokens = AllTokenData.tokens.filter((token: any) =>
      BasicTokens.some(
        (target: any) => target === token.symbol && chain === token.chainId
      )
    )
    setFilterTokens(filteredTokens)

    const options = {
      method: 'GET',
      headers: { accept: 'application/json', 'x-chain': 'base' }
    }

    fetch(
      'https://public-api.birdeye.so/defi/token_trending?sort_by=rank&sort_type=asc&offset=0&limit=10',
      options
    )
      .then(res => res.json())
      .then(res => console.log('trending: ', res))
      .catch(err => console.error(err))
  }, [chain])
  const fetchBalances = async () => {
    if (primaryWallet) {
      const response = await alchemy.core.getTokenBalances(
        primaryWallet?.address
      )
      setExistingTokenList(response.tokenBalances)
    }
  }
  useEffect(() => {
    fetchBalances()
  }, [primaryWallet])
  const getTokenBalance = (tokenAddress: string, decimals: number) => {
    existingTokenList.map((item: any) => {
      if (item.contractAddress === tokenAddress) {
        const amount = BigInt(item.tokenBalance)
        const balanceOfToken = Number(
          ethers.parseUnits(String(amount), decimals)
        )
        return balanceOfToken.toFixed(3)
      }
    })
    return 0
  }
  const searchTokenAddress = async () => {
    const metadata = await alchemy.core.getTokenMetadata(searchKeyword)
    console.log('metadata: ', metadata)
    if (metadata) {
      const response = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${searchKeyword}`,
        {
          method: 'GET',
          headers: {}
        }
      )
      const data = await response.json()
      // console.log('data from dexscreener: ', data)
      const logo = data.pairs[0].info.imageUrl
      // console.log('logo', logo)
      const newFoundToken = {
        address: searchKeyword,
        name: metadata.name,
        symbol: metadata.symbol,
        decimals: metadata.decimals,
        logoURI: logo
      }
      setSearchTokens([newFoundToken])
    } else {
      setSearchTokens([])
    }
  }
  useEffect(() => {
    if (ethers.isAddress(searchKeyword)) {
      searchTokenAddress()
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
          return item
        }
      })
      // console.log('result: ', result)
      setSearchTokens(result)
    }
  }, [searchKeyword])
  return (
    <>
      <Transition appear show={open} as={Fragment}>
        <Dialog as='div' className='relative' onClose={onClose}>
          <div className='fixed inset-0 bg-black/65 z-40' />
          <div className='fixed inset-0 py-10 overflow-y-auto z-40'>
            <div className='flex min-h-full items-center justify-center text-center'>
              <TransitionChild
                as={Fragment}
                enter='ease-out duration-300'
                enterFrom='opacity-0 scale-95'
                enterTo='opacity-100 scale-100'
                leave='ease-in duration-200'
                leaveFrom='opacity-100 scale-100'
                leaveTo='opacity-0 scale-95'
              >
                <DialogPanel className='max-w-lg w-full flex flex-col rounded-2xl bg-red-950 text-left align-middle shadow-xl transition-all  border-red-900 border-2 min-h-[650px]'>
                  <div className='w-full flex flex-col gap-2 '>
                    <div className='flex justify-between mx-2 p-3'>
                      <div className='text-gray-300 text-xl'>
                        Select a token
                      </div>
                      <X
                        className='text-xl text-gray-300 cursor-pointer'
                        onClick={onClose}
                      />
                    </div>
                    <div className='flex m-2 p-2 gap-2 border border-1 border-gray-400 justify-center items-center rounded-xl'>
                      <Search className='text-gray-300 text-xl' />
                      <input
                        className='w-full border-none bg-transparent px-4 py-2 text-gray-300 text-xl outline-none'
                        type='text'
                        placeholder='Search name or paste address'
                        value={searchKeyword}
                        onChange={e => {
                          setSearchKeyword(e.target.value)
                        }}
                      />
                    </div>
                    <div className='flex flex-wrap items-start gap-4 p-3'>
                      {filterTokens.map((item: any, key: number) => {
                        return (
                          <div
                            key={key}
                            className='flex gap-2 rounded-xl border-1 border-gray-400 border p-2 justify-center items-center cursor-pointer hover:bg-red-800'
                            onClick={() => {
                              onClose()
                              setSelectedToken(item)
                              setSelectedTokenBalance(
                                getTokenBalance(
                                  item.address,
                                  Number(item.decimals)
                                ).toString()
                              )
                            }}
                          >
                            <img src={item.logoURI} className='h-8 w-8 ' />
                            <div className='text-lg text-gray-300'>
                              {item.symbol}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <Separator className=' bg-red-900' />
                    {searchTokens.length > 0 && (
                      <div className='flex flex-col gap-2 max-h-[300px] overflow-y-auto custom-scrollbar p-3 pr-2 mt-2 mb-2'>
                        {searchTokens.map((item: any, key: number) => {
                          return (
                            <div
                              key={key}
                              className={`flex gap-2 p-2 pr-4 justify-between items-center cursor-pointer hover:bg-red-800 hover:rounded-md ${
                                selectedToken.name == item.name
                                  ? 'bg-red-800 rounded-md'
                                  : ''
                              }`}
                              onClick={() => {
                                onClose()
                                setSelectedToken(item)
                                setSelectedTokenBalance(
                                  getTokenBalance(
                                    item.address,
                                    Number(item.decimals)
                                  ).toString()
                                )
                              }}
                            >
                              <div className='flex gap-2 justify-center items-center'>
                                <div className='relative w-10 h-10 flex flex-row items-end'>
                                  <img
                                    src={item.logoURI}
                                    className='h-10 w-10 rounded-full'
                                  />
                                  <div className='bg-blue-950 w-5 h-5 absolute bottom  right-0 border-2 rounded-sm border-blue-950'>
                                    <img
                                      src={chain == 8453 ? BASE : ARBITRUM}
                                      alt='ETH'
                                    ></img>
                                  </div>
                                </div>

                                <div className='text-lg text-gray-300'>
                                  {item.symbol}
                                </div>
                              </div>
                              <div className='text-gray-300 text-xl flex flex-row gap-2 items-center'>
                                {getTokenBalance(
                                  item.address,
                                  Number(item.decimals)
                                )}
                                {selectedToken.name == item.name && <Check />}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {searchTokens.length === 0 && (
                      <div className='flex flex-col gap-2 max-h-[300px] overflow-y-auto custom-scrollbar p-3 pr-2 mt-2 mb-2'>
                        <div className='flex justify-center items-center text-gray-300 text-xl w-full'>
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
  )
}

export default SelectTokenModal

import { Fragment, useEffect, useState } from 'react'
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild
} from '@headlessui/react'
import { X, Search, ChevronDown } from 'lucide-react'

import Separator from '../tailus-ui/Separator'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { ethers, Log } from 'ethers'
// import Moralis from "moralis";
import { Network, Alchemy } from 'alchemy-sdk'
import BASE from '/Base.svg'
import ARBITRUM from '/arbitrum.svg'
import { Check } from 'lucide-react'

type PreviewType = {
  name: string
  symbol: string
  logoURI: string
  address: string
  decimals: number
}

const PreviewModal = ({
  open,
  onClose,
  onApprove,
  selectToken,
  symbol,
  tokenAmount
}: // AllTokenData,
// chain,
// BasicTokens
{
  open: boolean
  onClose: () => void
  onApprove: () => void
  selectToken: any
  symbol: any
  tokenAmount: string
  // AllTokenData: any
  // chain: number
  // BasicTokens: any
}) => {
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
                <DialogPanel className='max-w-lg w-full flex flex-col rounded-2xl bg-red-950 text-left align-middle shadow-xl transition-all  border-red-900 border-2 min-h-[300px] justify-center'>
                  <div className='w-full flex flex-col gap-2'>
                    <div className='flex justify-between mx-2 p-3'>
                      <div className='text-gray-300 text-xl text-center'>
                        Add liquidity
                      </div>
                      <X
                        className='text-xl text-gray-300 cursor-pointer'
                        onClick={onClose}
                      />
                    </div>
                    <div className='flex flex-row gap-2 justify-between p-5 rounded-lg border border-red-900 m-3 bg-modalbg'>
                      <div className=' relative w-10 h-10 flex flex-row items-end'>
                        <img
                          src={selectToken?.logoURI}
                          alt='ETH'
                          className='w-10 h-10 rounded-full'
                        ></img>
                        <div className='bg-blue-950 w-5 h-5 absolute bottom  right-0 border-2 rounded-sm border-blue-950'>
                          <img src={symbol} alt='ETH'></img>
                        </div>
                        <div className='text-gray-300 text-3xl ml-2'>
                          {selectToken.name}
                        </div>
                      </div>
                      <div className='text-gray-300 text-2xl text-center'>
                        {tokenAmount}
                      </div>
                    </div>

                    <div className='flex flex-col gap-2 p-3'>
                      <button
                        className='bg-red-700 hover:border-white text-white  border-red-500 border cursor-pointer p-2 rounded-lg'
                        onClick={onApprove}
                      >
                        Add
                      </button>
                    </div>
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

export default PreviewModal

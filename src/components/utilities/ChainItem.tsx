import { Check } from 'lucide-react'
interface ChainItemProps {
  item: any
  onClick: () => void
  isActive: Boolean
}
const ChainItem: React.FC<ChainItemProps> = ({ item, isActive, onClick }) => {
  return (
    <div
      className="flex flex-row gap-3 justify-between px-1 py-2 items-center hover:cursor-pointer hover:bg-[#43454D] hover:rounded-lg text-gray-100"
      onClick={onClick}
    >
      <div className="flex justify-center items-center gap-2">
        <img src={item.icon} alt="icon" className="w-8 h-8"></img>
        <span className="mr-12">{item.name}</span>
      </div>
      <div>{isActive && <Check className="w-4 h-4" />}</div>
    </div>
  );
}

export default ChainItem

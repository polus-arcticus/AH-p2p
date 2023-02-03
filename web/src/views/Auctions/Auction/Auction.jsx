import { useAuctions } from '@/hooks/useEnglishAuction'
import {useParams} from 'react-router-dom'
export const Auction = () => {
  const params = useParams()
  const { auction } = useAuctions(params.roomKey)
  console.log(params)
  return (<>hi {params.roomKey}</>)
}

import { useContext } from 'react'
import { AHP2PContext } from '../AHP2PProvider'

export const useAuctionsDB = () => {
  const { orbit } = useContext(AHP2PContext)

  const openAuctionsDB = useCallback(async () => {
    if (!orbit?.ipfs) return

      

}

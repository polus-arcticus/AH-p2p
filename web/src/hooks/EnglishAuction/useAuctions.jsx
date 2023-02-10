import { useState, useEffect, useCallback } from 'react'

import {
  AUCTIONS_KEY_MAP,
  ARCHIVES_KEY_MAP,
  getKeyMap,
  getAuctions,
} from '@/hooks/utils'
export const useAuctions = ({defaultKeyMap=AUCTIONS_KEY_MAP, defaultFilter=null}={}) => {
  const [keyMap, setKeyMap] = useState(getKeyMap(defaultKeyMap))
  const [auctions, setAuctions] = useState([])

  const fetchAuctions = useCallback(({km=defaultKeyMap,filter=defaultFilter,sort=null} ={}) => {
    const storage = getAuctions(getKeyMap(km))
    if (filter) {
      setAuctions(storage.filter((storageItem) => {
        const localValue = filter.filterKey(storageItem)
        console.log('localValue', localValue)
        console.log('filterValue', filter.filterValue(localValue))
        return filter.filterValue(localValue)
      }))
    } else {
      setAuctions(getAuctions(getKeyMap()))
    }

  },[])
  useEffect(() => {
    fetchAuctions()
  },[])
  return {auctions, keyMap, fetchAuctions}
}

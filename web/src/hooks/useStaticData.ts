import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'

export interface StaticData {
  englishAuctionAddr: string
  englishAuctionAbi: any[]
  exampleNftAddr: string
  exampleNftAbi: any[]
  exampleTokenAddr: string
  exampleTokenAbi: any[]
}

export const useStaticData = () => {
  const { chainId } = useAccount()
  const [staticData, setStaticData] = useState<StaticData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!chainId) {
      setStaticData(null)
      return
    }
    
    const loadStaticData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const data = await import(`../assets/${chainId}/Static.json`)
        setStaticData(data.default || data)
      } catch (err) {
        const errorMessage = `Failed to load static data for chain ${chainId}`
        console.error(errorMessage, err)
        setError(errorMessage)
        setStaticData(null)
      } finally {
        setLoading(false)
      }
    }
    
    loadStaticData()
  }, [chainId])

  return {
    staticData,
    loading,
    error,
    chainId
  }
}

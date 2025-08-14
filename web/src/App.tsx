import { useContext } from 'react'
import { AHP2PContext } from './provider/AHP2PProvider/AHP2PProvider'

function App() {
  const { loading } = useContext(AHP2PContext)

  return (
    <>
      {loading ? <div>Loading...</div> : <div>Ready</div>}
    </>
  )
}

export default App

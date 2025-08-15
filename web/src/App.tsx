import { useContext, useState } from 'react'
import { AHP2PContext } from './provider/AHP2PProvider/AHP2PProvider'
import { useAuctionsDB } from './hooks/useAuctionsDB'
import CreateAuctionModal from './components/CreateAuctionModal'

function App() {
  const { loading } = useContext(AHP2PContext)
  const {
    createAuction
  } = useAuctionsDB()

  const [showCreateForm, setShowCreateForm] = useState(false)

  const handleCreateAuction = () => {
    setShowCreateForm(true)
  }

  return (
    <>
      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
      ) : (
        <div style={{ padding: '20px' }}>
          <h1>Auction House P2P</h1>
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={handleCreateAuction}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              Create New Auction
            </button>
          </div>
          <div>Ready - Click the button above to create an auction!</div>
        </div>
      )}
      
      <CreateAuctionModal
        showCreateForm={showCreateForm}
        setShowCreateForm={setShowCreateForm}
        createAuction={createAuction}
      />
    </>
  )
}

export default App

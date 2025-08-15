import {
    useDisconnect,
    useEnsAvatar,
    useEnsName,
    useConnect, useAccount
} from 'wagmi'
import type { Connector } from 'wagmi'
import { useState, useEffect, useContext } from 'react'
import { AHP2PContext } from '@/provider/AHP2PProvider/AHP2PProvider'

export function WalletOptions() {
    const { connectors, connect } = useConnect()

    return connectors.map((connector) => (
        <WalletOption
            key={connector.uid}
            connector={connector}
            onClick={() => connect({ connector })}
        />
    ))
}

function WalletOption({
    connector,
    onClick,
}: {
    connector: Connector
    onClick: () => void
}) {
    const [ready, setReady] = useState(false)

    useEffect(() => {
        ; (async () => {
            const provider = await connector.getProvider()
            setReady(!!provider)
        })()
    }, [connector])

    return (
        <button disabled={!ready} onClick={onClick}>
            {connector.name}
        </button>
    )
}
export function Account() {
    const { address } = useAccount()
    const { disconnect } = useDisconnect()
    const { data: ensName } = useEnsName({ address })
    const { data: ensAvatar } = useEnsAvatar({ name: ensName! })

    return (
        <div>
            {ensAvatar && <img alt="ENS Avatar" src={ensAvatar} />}
            {address && <div>{ensName ? `${ensName} (${address})` : address}</div>}
            <button onClick={() => disconnect()}>Disconnect</button>
        </div>
    )
}

function ConnectWallet() {
    const { isConnected } = useAccount()
    if (isConnected) return <Account />
    return <WalletOptions />
}

export const NavBar = () => {
    const {loading, peerList, selfAddress } = useContext(AHP2PContext)

    return (<div style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#333',
        color: '#fff',
        fontSize: '1.2rem',
        fontWeight: 'bold',
        borderRadius: '5px',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
    }}>

        <h3>Auction House p2p</h3>
        {loading ? <div>Loading...</div> : <div>{Object.keys(peerList).length} peers</div>}
        <ConnectWallet />
    </div>)
}
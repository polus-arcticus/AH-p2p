import type { HeliaLibp2p } from "helia"
import type { Libp2p } from "@libp2p/interface"
import type { GossipSub } from "@chainsafe/libp2p-gossipsub"
import type { Identify } from "@libp2p/identify"

export type AHP2PHelia = HeliaLibp2p<
    Libp2p<{
         pubsub: GossipSub,
         identify: Identify
    }>
>

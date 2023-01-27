# Permit Chaining
Storing Permit Messages inside other Permit messages into a global consumption object.

## [EIP-712](https://eips.ethereum.org/EIPS/eip-712) Chains
If one is familiar with signing a permit message before an erc20, they are familiar with the usage. This project explores placing ones permit messages inside others' permit messages and, naturally, so on and so forth into some pre-determined onchain consumable.

## Ipfs libp2p webrtc
Beyond an initial ping to a signalling server, agents can communicate many to many in network time with libp2p-webrtc and ipfs pubsub. Agents can express 'forward commitments' by chaining EIP-712 together with other agents in real time prior to some end date.  This permit chain is than consumed by a transaction on the network and simply attempts to execute the prescribed logic.

## Example
Tip jar
Tipping small amounts is not a character of large tx cost chains, but writing a permit message is less costly, a content creator can than chain tips together in a single permit message, and attempt to sweep them by consuming the diff from a tip well. 

Expands on the concept of eip-712 permit into multi-user commit games.  Once pooled, a set of statechanges are coordinated with ipfs pubsub, enabling the summing of many microtransactions externally by a client, and the offering of claims to be redeemable onchain afterwords.

### Work Through
In the Tipping Pool game, a creator roots a tipping jar permit chain, an appreciative agent may, instead of occuring costly transaction fees, signs a permit on your tip chain, a 'promise' than the alotted funds on that tip will be there when you redeem the permit message.  In the happy scenario, many different agents provide smaller sums, summing to what amounts to be a value > the cost of the transaction.

## Usage
`DOMAIN=<localnet> CLUSTER_SECRET=<arbitrary> docker compose up`
### Down
`docker compose down`
### Rebuild
`docker compose build`

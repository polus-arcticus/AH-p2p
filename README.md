# Auction House: Peer 2 Peer
Auction your NFTs with the power of IPFS pubsub over WebRTC and the magic of multiplayer metatransactions.

## About
A critical challenge with offchain orderbooks is the necessity of performing order revalidation.  A user signals their intent to make a trade by signing an offchain signature that can be used to move their funds.  However because there is no escrow, users are free to move their funds out of their wallet prematurely causing errors during matching and opening up the orderbook to griefing and false deapth.  Revalidation has been solved with heavy duty indexing systems that constantly monitor the validity of placed orders, introducing an O(n) runtime cost on O(1) orders.  Solutions to improve the efficiency of these systems often reduce the efficacy of validation, such as not being aware of the total bids of a user, and just focusing if their total funds can make an individual bid or ask.  Additionally these systems have to not only outscale, but maintain times faster than blockspeed as invalidation can happen within a block

AH P2P considers an alternative approach. To Sell an Nft, A seller collects offchain bids, orders them from highest to lowest, and allows a contract to attempt to find the most valuable valid one.

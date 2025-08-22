# Auction House: Peer 2 Peer
Auction your NFTs with the power of IPFS pubsub over WebRTC and the magic of multiplayer metatransactions.

## About
A critical challenge with offchain orderbooks is the necessity of performing order revalidation.  A user signals their intent to make a trade by signing an offchain signature that can be used to move their funds.  However because there is no escrow, users are free to move their funds out of their wallet prematurely causing errors during matching and opening up the orderbook to griefing and false deapth.  Revalidation has been solved with heavy duty indexing systems that constantly monitor the validity of placed orders, introducing an O(n) runtime cost on O(1) orders.  Solutions to improve the efficiency of these systems often reduce the efficacy of validation, such as not being aware of the total bids of a user, and just focusing if their total funds can make an individual bid or ask.  Additionally these systems have to not only outscale, but maintain times faster than blockspeed as invalidation can happen within a block

AH P2P considers an alternative approach. To Sell an Nft, A seller collects offchain bid in realtime over ipfs pubsub. orders them from highest to lowest, and allows a contract to attempt to find the most valuable valid one.  This approach forgoes the need of a central market maker or revalidation service.  While the auctioneer may pay more gas in order to sell their nft, the process is gasless for bidders. As offchain orderbooks crumble under their own weight and the market looks beyond centralized marketplaces, AH P2P exists as enticing option.  

The P2P metatransaction system is extendible well beyond auction games and can be extending with reputation systems and commit reveal systems.  The use of Webrtc for auction rooms offloads alot of bandwidth off the hub node, and hubs can be added by anyone to faciliate the initial handshake between peers.  Even if the server goes down an auction room can still run with its already connected participants.



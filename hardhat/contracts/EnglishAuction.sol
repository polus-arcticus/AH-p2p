pragma solidity 0.8.17;
import 'hardhat/console.sol';

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract EnglishAuction {
  uint256 chainId;
  bytes32 DOMAIN_SEPARATOR;
  bytes32 AUCTION_TYPE_HASH = keccak256("Auction(address auctioneer,address nft,uint256 nftId,address token,uint256 bidStart,uint256 deadline,bytes32 auctionSigHash,Bid[] bids,bytes[] bidSigs)Bid(address bidder,uint256 amount,uint256 nonce,bytes32 auctionSigHash)");
  bytes32 BID_TYPE_HASH = keccak256("Bid(address bidder,uint256 amount,uint256 nonce,bytes32 auctionSigHash)");

  struct Bid {
    address bidder;
    uint256 amount;
    uint256 nonce;
    bytes32 auctionSigHash;
  }

  struct Auction {
    address auctioneer;
    address nft;
    uint256 nftId;
    address token;
    uint256 bidStart;
    uint256 deadline;
    bytes32 auctionSigHash;
    Bid[] bids;
    bytes[] bidSigs;
  }

  mapping (address => uint256) usedNonces;

  constructor() {
    uint256 ch;
    assembly {
      ch := chainid()
    }
    DOMAIN_SEPARATOR = keccak256(
      abi.encode(
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
        keccak256(bytes("EnglishAuction")),
        keccak256(bytes("1")),
        ch,
        address(this)
    )
    );
    chainId = ch;
  }

  function consumeAuction(
    uint8 v,
    bytes32 r,
    bytes32 s,
    Auction memory auction
  ) external {
    bytes32 hashStruct = keccak256(
      abi.encode(
        AUCTION_TYPE_HASH,
        auction.auctioneer,
        auction.nft,
        auction.nftId,
        auction.token,
        auction.bidStart,
        auction.deadline,
        auction.auctionSigHash,
        hashBids(auction.bids),
        hashBidSigs(auction.bidSigs)
    )
    );
    bytes32 hash = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, hashStruct));
    //console.log(ecrecover(hash,v,r,s), 'ecrecover');
    //console.log(ECDSA.recover(hash, v, r, s));
    //console.log('^ ecdsa reover');
    //console.log(msg.sender, 'message.sender');
    console.log('ecrecover', ecrecover(hash,v,r,s));
    require(ecrecover(hash, v, r, s) == msg.sender, "bids are self signed, auction is not");

    Bid memory highestBidder = Bid(address(0), 0, 0, auction.auctionSigHash);
    for (uint i=0;i < auction.bids.length; i++) {
      bytes32 hashStruct = keccak256(
        abi.encode(
          BID_TYPE_HASH,
          auction.bids[i].bidder,
          auction.bids[i].amount,
          auction.bids[i].nonce,
          auction.bids[i].auctionSigHash
      )
      );
      address signer = recoverSigner(
        keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, hashStruct)),
        auction.bidSigs[i]
      );
      console.log('bid signer', signer);

      console.log(signer, 'bids loop');
      if (signer == auction.bids[i].bidder) {
        if (auction.bids[i].amount > highestBidder.amount) {
          highestBidder = auction.bids[i];
        }
      } else {
        console.log('signature no in, handle faulty situation');
        console.log('signature-bids mismatch');
      }
    }

    if (usedNonces[highestBidder.bidder] <= highestBidder.nonce) {
      IERC1155(auction.nft).safeTransferFrom(auction.auctioneer, highestBidder.bidder, auction.nftId, 1, abi.encode('data'));
      IERC20(auction.token).transferFrom(highestBidder.bidder, auction.auctioneer, highestBidder.amount);
      usedNonces[highestBidder.bidder] += 1;
    } else {
      console.log('warning, nonce not unique');
    }
  }
  function hashBidSigs(bytes[] memory bidSigs) internal returns (bytes32) {
    bytes memory packed;
    for (uint i =0; i < bidSigs.length ; i++) {
      packed = abi.encodePacked(packed, keccak256(bidSigs[i])); 
    }
    return keccak256(packed);
  }

  function hashBids(Bid[] memory bids) internal returns (bytes32) {
    bytes memory packed;
    for (uint i =0; i < bids.length ; i++) {
      bytes32 hashStruct = keccak256(
        abi.encode(
          BID_TYPE_HASH,
          bids[i].bidder,
          bids[i].amount,
          bids[i].nonce,
          bids[i].auctionSigHash
      )
      );
      //type no supported in packed mode
      packed = abi.encodePacked(packed, hashStruct); 
    }
    return keccak256(packed);
  }

  /// signature methods.
  function splitSignature(bytes memory sig)
  internal
  pure
  returns (uint8 v, bytes32 r, bytes32 s)
  {
    require(sig.length == 65);

    assembly {
      // first 32 bytes, after the length prefix.
      r := mload(add(sig, 32))
      // second 32 bytes.
      s := mload(add(sig, 64))
      // final byte (first byte of the next 32 bytes).
      v := byte(0, mload(add(sig, 96)))
    }

    return (v, r, s);
  }

  function recoverSigner(bytes32 message, bytes memory sig)
  internal
  pure
  returns (address)
  {
    (uint8 v, bytes32 r, bytes32 s) = splitSignature(sig);

    return ecrecover(message, v, r, s);
  }
  /// builds a prefixed hash to mimic the behavior of eth_sign.
  function prefixed(bytes32 hash) internal pure returns (bytes32) {
    return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
  }
}

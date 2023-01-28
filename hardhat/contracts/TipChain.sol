pragma solidity 0.8.17;

import 'hardhat/console.sol';


contract TipChain {

  bytes32 DOMAIN_SEPARATOR = keccak256(
    abi.encode(
      keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
  ),
  keccak256(bytes("permit-chaining")),
  keccak256(bytes("1")),
  1,
  address(this)
  )
  );

bytes32 tipChainTypeHash = keccak256("TipChain(address claimer,uint256 deadline,Tip[] tips,bytes[] tipSigs)Tip(address sender,uint256 amount,uint256 senderNonce)");
bytes32 tipTypeHash = keccak256("Tip(address sender,uint256 amount,uint256 senderNonce)");

struct Tip {
  address sender;
  uint256 amount;
  uint256 senderNonce;
}

struct TipChain {
  address claimer;
  uint256 deadline;
  Tip[] tips;
  bytes[] tipSigs;
}

mapping(address => uint256) usedNonces;

constructor() {

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
function hashTipSigs(bytes[] memory tipSigs) internal returns (bytes32) {
  bytes memory packed;
  for (uint i =0; i < tipSigs.length ; i++) {
    packed = abi.encodePacked(packed, keccak256(tipSigs[i])); 
  }
  return keccak256(packed);
}

function hashTips(Tip[] memory tips) internal returns (bytes32) {
  bytes memory packed;
  for (uint i =0; i < tips.length ; i++) {
    bytes32 hashStruct = keccak256(
      abi.encode(
        tipTypeHash,
        tips[i].sender,
        tips[i].amount,
        tips[i].senderNonce
    )
    );
    //type no supported in packed mode
    packed = abi.encodePacked(packed, hashStruct); 
  }
  return keccak256(packed);
}

function claimTipChain(
  uint8 v,
  bytes32 r,
  bytes32 s,
  TipChain memory tipChain
) external {
  // It will delightfully more efficient if users come together to make a big sig send that a user can claim in a single sweep
  //require(st.nftIdBalances[tipChain.claimerNftId][msg.sender] > 0, "ReceiverPayFacet::msg.sender must own nft to claim");

  bytes32 hashStruct = keccak256(
    abi.encode(
      tipChainTypeHash,
      tipChain.claimer,
      tipChain.deadline,
      hashTips(tipChain.tips),
      hashTipSigs(tipChain.tipSigs)
  )
  );
  bytes32 hash = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, hashStruct));
  //console.log(ecrecover(hash,v,r,s), 'ecrecover');
  //console.log(ECDSA.recover(hash, v, r, s));
  //console.log('^ ecdsa reover');
  //console.log(msg.sender, 'message.sender');
  require(ecrecover(hash, v, r, s) == msg.sender, "tip jar is self signed, tips are not");

  for (uint i=0;i < tipChain.tips.length; i++) {
    bytes32 hashStruct = keccak256(
      abi.encode(
        tipTypeHash,
        tipChain.tips[i].sender,
        tipChain.tips[i].amount,
        tipChain.tips[i].senderNonce
    )
    );
    address signer = recoverSigner(
      keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, hashStruct)),
      tipChain.tipSigs[i]
    );
    console.log('tip signer', signer);

    console.log(signer, 'tips loop');
    if (signer == tipChain.tips[i].sender) {
      if (usedNonces[tipChain.tips[i].sender] <= tipChain.tips[i].senderNonce) {
        /* transfer
           st.nftIdCawDeposits[tipChain.tips[i].senderNftId] -= tipChain.tips[i].amount;
           st.nftIdCawDeposits[tipChain.claimerNftId] += tipChain.tips[i].amount;
           st.nftIdUsedNonces[tipChain.tips[i].senderNftId]++;
         */

      }
    } else {
      console.log('signature no in, handle faulty situation');
    }
  }
}

}

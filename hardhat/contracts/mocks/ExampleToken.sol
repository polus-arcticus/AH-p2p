// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ExampleToken is ERC20 {
  constructor() ERC20("Example Token", "extn") {
        _mint(msg.sender, 4000*10**18);
  }

  function faucet() public {
    _mint(msg.sender, 10**18);
  }

  
}


// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.24;

interface IERC7572 {
  function contractURI() external view returns (string memory);

  event ContractURIUpdated();
}
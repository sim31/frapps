# Respect1155

A non-transferrable reputation token contract based on ERC-1155. It implements [fungibility out of non-fungible tokens](https://peakd.com/dao/@sim31/fungibility-out-of-non-fungible-tokens).

Respect is awarded as NTTs (non-fungible tokens) which can have attributes that signify details like when respect was earned and how. Each Respect NTT also has an associated "value" representing amount of respect, which stored on chain and determined at the time of issuance. And then there's fungible Respect token, where balance of each account is determined by summing the values of all Respect NTTs an account has earned.

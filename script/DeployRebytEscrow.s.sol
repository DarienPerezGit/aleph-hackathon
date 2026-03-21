// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/RebytEscrow.sol";
import "../contracts/MockZKVerifier.sol";

contract DeployRebytEscrow is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address relayerAddress = vm.envAddress("SOLVER_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        RebytEscrow escrow = new RebytEscrow(relayerAddress);

        // Deploy MockZKVerifier as the initial ZK verifier.
        // Replace with the real snarkjs-generated ZKVerifier.sol before enabling zkEnabled.
        MockZKVerifier mockVerifier = new MockZKVerifier();
        escrow.setZKVerifier(address(mockVerifier));

        // ZK enforcement is OFF by default — existing fund() flow unaffected.
        // Flip with: cast send <escrow> "setZKEnabled(bool)" true --private-key $PRIVATE_KEY
        // escrow.setZKEnabled(true);  // uncomment only when real verifier is deployed

        vm.stopBroadcast();

        console.log("RebytEscrow deployed at:  ", address(escrow));
        console.log("MockZKVerifier deployed at:", address(mockVerifier));
        console.log("zkEnabled:                 ", escrow.zkEnabled());
    }
}

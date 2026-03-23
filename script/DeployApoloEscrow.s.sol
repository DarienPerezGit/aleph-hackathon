// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/ApoloEscrow.sol";

/// @notice Deploy ApoloEscrow without ZK enabled (zkEnabled=false, zkVerifier=address(0)).
///
/// Use this for the base escrow deploy. Wire the ZK verifier separately via:
///   forge script script/DeployVerifier.s.sol --broadcast
///   forge script script/DeployEscrowWithZK.s.sol --broadcast
///
/// The zkEnabled=false default means fund() flows work immediately without proofs.
/// For a ZK-enabled escrow with the real Groth16 verifier, use DeployEscrowWithZK.s.sol.
contract DeployApoloEscrow is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address relayerAddress = vm.envAddress("SOLVER_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);
        ApoloEscrow escrow = new ApoloEscrow(relayerAddress);
        vm.stopBroadcast();

        console.log("ApoloEscrow deployed at:", address(escrow));
        console.log("zkEnabled:              ", escrow.zkEnabled());
        console.log("zkVerifier:             ", escrow.zkVerifier());
        console.log("");
        console.log("To enable ZK, run DeployVerifier.s.sol then DeployEscrowWithZK.s.sol");
    }
}


// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {ApoloSessionRouter} from "contracts/ApoloSessionRouter.sol";

contract DeployApoloSessionRouter is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0));
        if (deployerPrivateKey == 0) {
            deployerPrivateKey = vm.envOr("SOLVER_PRIVATE_KEY", uint256(0));
        }
        require(deployerPrivateKey != 0, "Set PRIVATE_KEY or SOLVER_PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);
        ApoloSessionRouter router = new ApoloSessionRouter();
        vm.stopBroadcast();

        console2.log("ApoloSessionRouter deployed at:", address(router));
    }
}

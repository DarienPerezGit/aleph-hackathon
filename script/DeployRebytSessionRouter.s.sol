// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {RebytSessionRouter} from "contracts/RebytSessionRouter.sol";

contract DeployRebytSessionRouter is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0));
        if (deployerPrivateKey == 0) {
            deployerPrivateKey = vm.envOr("SOLVER_PRIVATE_KEY", uint256(0));
        }
        require(deployerPrivateKey != 0, "Set PRIVATE_KEY or SOLVER_PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);
        RebytSessionRouter router = new RebytSessionRouter();
        vm.stopBroadcast();

        console2.log("RebytSessionRouter deployed at:", address(router));
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ApoloSessionRouter {
    address public authorizedSessionKey;
    uint256 public maxSpendAmount;
    uint256 public expiresAt;
    address public escrowAddress;

    event SessionKeyAuthorized(address indexed sessionKey, uint256 maxAmount, uint256 expires);
    event IntentExecuted(bytes32 indexed intentHash, address indexed sessionKey, uint256 amount);

    function setupSession(
        address _sessionKey,
        uint256 _maxSpendAmount,
        uint256 _expirationTime,
        address _escrowAddress
    ) external {
        require(
            msg.sender == address(this) || authorizedSessionKey == address(0),
            "Unauthorized/Already setup"
        );
        require(_sessionKey != address(0), "Invalid session key");
        require(_escrowAddress != address(0), "Invalid escrow");

        authorizedSessionKey = _sessionKey;
        maxSpendAmount = _maxSpendAmount;
        expiresAt = _expirationTime;
        escrowAddress = _escrowAddress;

        emit SessionKeyAuthorized(_sessionKey, _maxSpendAmount, _expirationTime);
    }

    function executeIntent(bytes32 intentHash, bytes calldata signature, uint256 intentAmount) external {
        require(authorizedSessionKey != address(0), "Session not setup");
        require(block.timestamp <= expiresAt, "Session key expired");
        require(intentAmount <= maxSpendAmount, "Exceeds max spend limit");

        bytes32 digest = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", intentHash));
        address signer = _recover(digest, signature);
        require(signer == authorizedSessionKey, "Invalid session key signature");

        maxSpendAmount -= intentAmount;

        (bool success, ) = escrowAddress.call{value: intentAmount}(
            abi.encodeWithSignature("fund(bytes32,uint256)", intentHash, intentAmount)
        );
        require(success, "Escrow fund failed");

        emit IntentExecuted(intentHash, signer, intentAmount);
    }

    function _recover(bytes32 hash, bytes calldata signature) internal pure returns (address) {
        require(signature.length == 65, "Invalid signature length");

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }

        if (v < 27) {
            v += 27;
        }
        require(v == 27 || v == 28, "Invalid signature v");

        address recovered = ecrecover(hash, v, r, s);
        require(recovered != address(0), "Invalid signature");
        return recovered;
    }

    receive() external payable {}
}

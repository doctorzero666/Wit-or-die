// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract GamePool {
    address public owner;
    uint256 public totalPot;

    mapping(address => uint256) public deposits;

    event Deposited(address indexed player, uint256 amount);
    event Payout(address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function deposit() external payable {
        require(msg.value > 0, "zero deposit");
        deposits[msg.sender] += msg.value;
        totalPot += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function payout(address to, uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "insufficient");
        totalPot -= amount;
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "transfer failed");
        emit Payout(to, amount);
    }
}

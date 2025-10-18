// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * DelegationStorage Contract
 * Lưu delegation trên blockchain thay vì localStorage
 */
contract DelegationStorage {
    
    struct Delegation {
        address delegator;
        address delegate;
        bytes32 authority;
        bytes[] caveats;
        bytes signature;
        uint256 timestamp;
        bool isActive;
    }
    
    // Mapping: delegator => delegate => delegation
    mapping(address => mapping(address => Delegation)) public delegations;
    
    // Events
    event DelegationStored(
        address indexed delegator,
        address indexed delegate,
        bytes32 authority,
        uint256 timestamp
    );
    
    event DelegationRevoked(
        address indexed delegator,
        address indexed delegate
    );
    
    /**
     * Store delegation on blockchain
     */
    function storeDelegation(
        address _delegate,
        bytes32 _authority,
        bytes[] calldata _caveats,
        bytes calldata _signature
    ) external {
        require(_delegate != address(0), "Invalid delegate");
        require(_delegate != msg.sender, "Cannot delegate to self");
        
        // Store delegation
        delegations[msg.sender][_delegate] = Delegation({
            delegator: msg.sender,
            delegate: _delegate,
            authority: _authority,
            caveats: _caveats,
            signature: _signature,
            timestamp: block.timestamp,
            isActive: true
        });
        
        emit DelegationStored(msg.sender, _delegate, _authority, block.timestamp);
    }
    
    /**
     * Get delegation data
     */
    function getDelegation(
        address _delegator,
        address _delegate
    ) external view returns (
        bytes32 authority,
        bytes[] memory caveats,
        bytes memory signature,
        uint256 timestamp,
        bool isActive
    ) {
        Delegation memory delegation = delegations[_delegator][_delegate];
        return (
            delegation.authority,
            delegation.caveats,
            delegation.signature,
            delegation.timestamp,
            delegation.isActive
        );
    }
    
    /**
     * Check if delegation is active
     */
    function isDelegationActive(
        address _delegator,
        address _delegate
    ) external view returns (bool) {
        return delegations[_delegator][_delegate].isActive;
    }
    
    /**
     * Revoke delegation
     */
    function revokeDelegation(address _delegate) external {
        require(delegations[msg.sender][_delegate].isActive, "Delegation not active");
        
        delegations[msg.sender][_delegate].isActive = false;
        
        emit DelegationRevoked(msg.sender, _delegate);
    }
    
    /**
     * Get delegation count for a delegator
     */
    function getDelegationCount(address _delegator) external view returns (uint256) {
        // This is a simplified version
        // In practice, you'd need to track delegates in an array
        return 0;
    }
}

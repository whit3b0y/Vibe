// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AgentMarketplace {
    struct Agent {
        address owner;
        string name;
        string category;
        uint256 pricePerMonth;
        string webhookUrl;
        string twitterHandle;
        bool active;
        uint256 createdAt;
    }

    struct Subscription {
        uint256 agentId;
        address subscriber;
        uint256 expiresAt;
    }

    uint256 public nextAgentId;
    mapping(uint256 => Agent) public agents;
    mapping(address => mapping(uint256 => Subscription)) public subscriptions;

    uint256 public platformFee = 5; // 5%
    address public owner;

    event AgentRegistered(
        uint256 indexed agentId,
        address indexed owner,
        string name,
        string category,
        uint256 pricePerMonth
    );

    event SubscriptionCreated(
        uint256 indexed agentId,
        address indexed subscriber,
        uint256 expiresAt
    );

    event AgentUpdated(uint256 indexed agentId);
    event AgentDeactivated(uint256 indexed agentId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyAgentOwner(uint256 agentId) {
        require(agents[agentId].owner == msg.sender, "Not agent owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function registerAgent(
        string memory _name,
        string memory _category,
        uint256 _pricePerMonth,
        string memory _webhookUrl,
        string memory _twitterHandle
    ) external returns (uint256) {
        require(bytes(_name).length > 0, "Name required");
        require(bytes(_webhookUrl).length > 0, "Webhook URL required");
        require(_pricePerMonth > 0, "Price must be > 0");

        uint256 agentId = nextAgentId++;

        agents[agentId] = Agent({
            owner: msg.sender,
            name: _name,
            category: _category,
            pricePerMonth: _pricePerMonth,
            webhookUrl: _webhookUrl,
            twitterHandle: _twitterHandle,
            active: true,
            createdAt: block.timestamp
        });

        emit AgentRegistered(agentId, msg.sender, _name, _category, _pricePerMonth);

        return agentId;
    }

    function subscribe(uint256 _agentId) external payable {
        Agent storage agent = agents[_agentId];
        require(agent.active, "Agent not active");
        require(msg.value >= agent.pricePerMonth, "Insufficient payment");

        uint256 expiresAt = block.timestamp + 30 days;

        // If already subscribed, extend subscription
        if (subscriptions[msg.sender][_agentId].expiresAt > block.timestamp) {
            expiresAt = subscriptions[msg.sender][_agentId].expiresAt + 30 days;
        }

        subscriptions[msg.sender][_agentId] = Subscription({
            agentId: _agentId,
            subscriber: msg.sender,
            expiresAt: expiresAt
        });

        // Calculate and distribute payment
        uint256 fee = (msg.value * platformFee) / 100;
        uint256 agentOwnerPayment = msg.value - fee;

        // Pay agent owner
        payable(agent.owner).transfer(agentOwnerPayment);

        emit SubscriptionCreated(_agentId, msg.sender, expiresAt);
    }

    function checkAccess(uint256 _agentId, address _user) external view returns (bool) {
        return subscriptions[_user][_agentId].expiresAt > block.timestamp;
    }

    function getAgent(uint256 _agentId) external view returns (Agent memory) {
        return agents[_agentId];
    }

    function getSubscription(address _user, uint256 _agentId) external view returns (Subscription memory) {
        return subscriptions[_user][_agentId];
    }

    function updateAgent(
        uint256 _agentId,
        string memory _name,
        string memory _category,
        uint256 _pricePerMonth,
        string memory _webhookUrl
    ) external onlyAgentOwner(_agentId) {
        Agent storage agent = agents[_agentId];
        agent.name = _name;
        agent.category = _category;
        agent.pricePerMonth = _pricePerMonth;
        agent.webhookUrl = _webhookUrl;

        emit AgentUpdated(_agentId);
    }

    function deactivateAgent(uint256 _agentId) external onlyAgentOwner(_agentId) {
        agents[_agentId].active = false;
        emit AgentDeactivated(_agentId);
    }

    function withdrawFees() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    function setPlatformFee(uint256 _fee) external onlyOwner {
        require(_fee <= 20, "Fee too high");
        platformFee = _fee;
    }
}

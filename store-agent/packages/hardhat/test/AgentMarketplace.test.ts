import { expect } from "chai";
import { ethers } from "hardhat";
import { AgentMarketplace } from "../typechain-types";

describe("AgentMarketplace", function () {
  let marketplace: AgentMarketplace;
  let owner: any;
  let seller: any;
  let buyer: any;

  beforeEach(async function () {
    [owner, seller, buyer] = await ethers.getSigners();

    const AgentMarketplace = await ethers.getContractFactory("AgentMarketplace");
    marketplace = await AgentMarketplace.deploy();
  });

  describe("Agent Registration", function () {
    it("should register an agent", async function () {
      const tx = await marketplace.connect(seller).registerAgent(
        "Trading Bot",
        "Trading",
        ethers.parseEther("0.01"),
        "https://example.com/webhook",
        "@tradingbot"
      );

      await tx.wait();

      const agent = await marketplace.getAgent(0);
      expect(agent.name).to.equal("Trading Bot");
      expect(agent.owner).to.equal(seller.address);
    });
  });

  describe("Subscription", function () {
    beforeEach(async function () {
      await marketplace.connect(seller).registerAgent(
        "Trading Bot",
        "Trading",
        ethers.parseEther("0.01"),
        "https://example.com/webhook",
        "@tradingbot"
      );
    });

    it("should allow subscription with correct payment", async function () {
      await marketplace.connect(buyer).subscribe(0, {
        value: ethers.parseEther("0.01"),
      });

      const hasAccess = await marketplace.checkAccess(0, buyer.address);
      expect(hasAccess).to.be.true;
    });

    it("should reject subscription with insufficient payment", async function () {
      await expect(
        marketplace.connect(buyer).subscribe(0, {
          value: ethers.parseEther("0.005"),
        })
      ).to.be.revertedWith("Insufficient payment");
    });
  });

  describe("Access Control", function () {
    it("should return false for non-subscribers", async function () {
      await marketplace.connect(seller).registerAgent(
        "Trading Bot",
        "Trading",
        ethers.parseEther("0.01"),
        "https://example.com/webhook",
        "@tradingbot"
      );

      const hasAccess = await marketplace.checkAccess(0, buyer.address);
      expect(hasAccess).to.be.false;
    });
  });
});

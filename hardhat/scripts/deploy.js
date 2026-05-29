const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment of NationalAssemblyVoting...");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);

  // Deploy contract
  const NationalAssemblyVoting = await hre.ethers.getContractFactory("NationalAssemblyVoting");
  const votingContract = await NationalAssemblyVoting.deploy();

  await votingContract.waitForDeployment();
  const contractAddress = await votingContract.getAddress();

  console.log("NationalAssemblyVoting successfully deployed to:", contractAddress);

  // Whitelist 3 mock delegate accounts from Hardhat Signers for demo purposes
  const signers = await hre.ethers.getSigners();
  // Skip signer 0 as it is the Admin (electionCommission)
  if (signers.length > 3) {
    console.log("Automatically whitelisting 3 delegates for demo...");
    
    // Delegate 1: signers[1]
    await votingContract.addDelegate(signers[1].address, "Tran Van A", "Ha Noi");
    console.log(`Whitelisted delegate 1: ${signers[1].address} - Tran Van A (Ha Noi)`);

    // Delegate 2: signers[2]
    await votingContract.addDelegate(signers[2].address, "Nguyen Thi B", "TP. Ho Chi Minh");
    console.log(`Whitelisted delegate 2: ${signers[2].address} - Nguyen Thi B (TP. Ho Chi Minh)`);

    // Delegate 3: signers[3]
    await votingContract.addDelegate(signers[3].address, "Pham Van C", "Da Nang");
    console.log(`Whitelisted delegate 3: ${signers[3].address} - Pham Van C (Da Nang)`);
  }

  // Save contract address and ABI to frontend src directory for direct React access
  const frontendContractsDir = path.join(__dirname, "..", "..", "frontend", "src", "contracts");

  if (!fs.existsSync(frontendContractsDir)) {
    fs.mkdirSync(frontendContractsDir, { recursive: true });
  }

  // Save contract address
  fs.writeFileSync(
    path.join(frontendContractsDir, "contract-address.json"),
    JSON.stringify({ NationalAssemblyVoting: contractAddress }, undefined, 2)
  );
  console.log("Contract address saved to frontend.");

  // Copy ABI artifact to frontend
  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "NationalAssemblyVoting.sol",
    "NationalAssemblyVoting.json"
  );

  if (fs.existsSync(artifactPath)) {
    fs.copyFileSync(
      artifactPath,
      path.join(frontendContractsDir, "NationalAssemblyVoting.json")
    );
    console.log("Contract ABI saved to frontend.");
  } else {
    console.warn("Artifact file not found. Please run 'npx hardhat compile' first.");
  }

  console.log("Deployment and synchronization completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

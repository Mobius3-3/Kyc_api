const { Contract, Wallet, providers, ethers } = require("ethers")
const { KYCverifyABI } = require("../constants/KYCverificationABI.js")

exports.verify = async (request, res) => {
 try {
  const userAddress = request.body.address

    // Validate address format
    if (!ethers.utils.isAddress(userAddress)) {
    return res.status(400).json({ error: "Invalid Ethereum address" });
    }

  const KYCAddress = process.env.KYC_CONTRACT_ADDRESS
//   console.log(process.env.RPC_PROVIDER_URL)
  const provider = new providers.JsonRpcProvider(process.env.RPC_PROVIDER_URL)
    
  const signer = new Wallet(process.env.WALLET_PRIVATE, provider);

  const contract = new Contract(KYCAddress, KYCverifyABI, signer);

    // Interact with smart contract
    const tx = await contract.verifyUser(userAddress, true);
    await tx.wait(); // Wait for transaction confirmation

    return res.status(200).json({ status: "verified", txHash: tx.hash });
 
} catch (error) {
  // Handle network errors
  if (error.message?.includes("Insufficient MATIC")) {
    return res.status(400).json({ error: "Insufficient MATIC to perform the transaction." });
  }

  if (error.message?.includes("Network connectivity issue")) {
    return res.status(503).json({ error: "Network connectivity issue. Please try again later." });
  }

  if (error.message?.includes("replacement fee too low")) {
    return res.status(500).json({ error: "Nonce conflict or low gas fee. Please retry." });
  }

  return res.status(500).json({ error: "Blockchain transaction failed.", detail: error.reason || error.message });
 }
}

exports.check = async (req, res) => {
  try {
    const address = req.body.address;

    if (!ethers.utils.isAddress(address)) {
      return res.status(400).json({ error: "Invalid Ethereum address" });
    }

    const KYCAddress = process.env.KYC_CONTRACT_ADDRESS;
    const provider = new providers.JsonRpcProvider(process.env.RPC_PROVIDER_URL);

    const contract = new Contract(KYCAddress, KYCverifyABI, provider);

    const isVerified = await contract.checkKYC(address);

    return res.status(200).json({ address, verified: isVerified });
  } catch (error) {
    console.error("Check failed:", error);
    return res.status(500).json({ error: error.reason || "Check failed" });
  }
}

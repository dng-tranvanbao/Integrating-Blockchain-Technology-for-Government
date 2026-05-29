import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { ethers } from "ethers";
import contractAddressMap from "../contracts/contract-address.json";
import contractArtifact from "../contracts/NationalAssemblyVoting.json";

// Delegate data structure definition
export interface Delegate {
  wallet: string;
  name: string;
  province: string;
  active: boolean;
}

// Proposal data structure definition
export interface Proposal {
  id: number;
  title: string;
  description: string;
  votesYes: number;
  votesNo: number;
  votesAbstain: number;
  votingStarted: boolean;
  votingEnded: boolean;
}

interface Web3ContextType {
  account: string | null;
  isAdmin: boolean;
  isDelegate: boolean;
  delegateProfile: Delegate | null;
  proposals: Proposal[];
  delegates: Delegate[];
  userVotes: { [key: number]: boolean };
  loading: boolean;
  wrongNetwork: boolean;
  connectWallet: () => Promise<void>;
  refreshState: () => Promise<void>;
  contract: ethers.Contract | null;
  provider: ethers.BrowserProvider | null;
  currentChainId: number | null;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
};

export const Web3Provider = ({ children }: { children: ReactNode }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDelegate, setIsDelegate] = useState(false);
  const [delegateProfile, setDelegateProfile] = useState<Delegate | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [userVotes, setUserVotes] = useState<{ [key: number]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [wrongNetwork, setWrongNetwork] = useState(false);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [currentChainId, setCurrentChainId] = useState<number | null>(null);

  const contractAddress = contractAddressMap.NationalAssemblyVoting;
  const contractABI = contractArtifact.abi;

  // Web3 Initialization
  const initWeb3 = async (userAccount: string | null = null) => {
    try {
      setLoading(true);
      if (!(window as any).ethereum) {
        console.warn("MetaMask is not installed!");
        setLoading(false);
        return;
      }

      const tempProvider = new ethers.BrowserProvider((window as any).ethereum);
      setProvider(tempProvider);

      const network = await tempProvider.getNetwork();
      const activeChainId = Number(network.chainId);
      setCurrentChainId(activeChainId);
      
      const isWrong = activeChainId !== 31337;
      setWrongNetwork(isWrong);

      if (isWrong) {
        setIsAdmin(false);
        setIsDelegate(false);
        setDelegateProfile(null);
        setProposals([]);
        setDelegates([]);
        setLoading(false);
        return;
      }

      let currentAccount = userAccount;
      if (!currentAccount) {
        const accounts = await tempProvider.send("eth_accounts", []);
        if (accounts.length > 0) {
          currentAccount = accounts[0];
        }
      }

      if (currentAccount) {
        const checksummedAccount = ethers.getAddress(currentAccount);
        setAccount(checksummedAccount);

        const signer = await tempProvider.getSigner();
        const tempContract = new ethers.Contract(contractAddress, contractABI, signer);
        setContract(tempContract);

        // Load roles and details from contract
        await loadContractData(tempContract, checksummedAccount);
      } else {
        // Read-only contract access for guests
        const tempContract = new ethers.Contract(contractAddress, contractABI, tempProvider);
        setContract(tempContract);
        await loadContractData(tempContract, null);
      }
    } catch (error) {
      console.error("Error initializing Web3:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadContractData = async (activeContract: ethers.Contract, userAddress: string | null) => {
    try {
      // 1. Check if user is Admin (Secretary)
      const commissionAddr = await activeContract.electionCommission();
      const isUserAdmin = userAddress ? ethers.getAddress(userAddress) === ethers.getAddress(commissionAddr) : false;
      setIsAdmin(isUserAdmin);

      // 2. Check if user is a Whitelisted Delegate
      if (userAddress) {
        const profile = await activeContract.delegateProfiles(userAddress);
        if (profile && profile.wallet !== ethers.ZeroAddress && profile.active) {
          setIsDelegate(true);
          setDelegateProfile({
            wallet: profile.wallet,
            name: profile.name,
            province: profile.province,
            active: profile.active,
          });
        } else {
          setIsDelegate(false);
          setDelegateProfile(null);
        }
      } else {
        setIsDelegate(false);
        setDelegateProfile(null);
      }

      // 3. Load list of Proposals and user voting statuses
      const propCountBig = await activeContract.proposalsCount();
      const propCount = Number(propCountBig);
      const tempProposals: Proposal[] = [];
      const tempUserVotes: { [key: number]: boolean } = {};

      for (let i = 1; i <= propCount; i++) {
        const p = await activeContract.proposals(i);
        tempProposals.push({
          id: Number(p.id),
          title: p.title,
          description: p.description,
          votesYes: Number(p.votesYes),
          votesNo: Number(p.votesNo),
          votesAbstain: Number(p.votesAbstain),
          votingStarted: p.votingStarted,
          votingEnded: p.votingEnded,
        });

        if (userAddress) {
          const voted = await activeContract.hasVoted(i, userAddress);
          tempUserVotes[i] = voted;
        }
      }
      setProposals(tempProposals);
      setUserVotes(tempUserVotes);

      // 4. Load Whitelisted Delegates
      try {
        const delegateAddresses: string[] = await activeContract.getDelegateAddresses();
        const tempDelegates: Delegate[] = [];
        
        for (const addr of delegateAddresses) {
          const profile = await activeContract.delegateProfiles(addr);
          if (profile.wallet !== ethers.ZeroAddress) {
            tempDelegates.push({
              wallet: profile.wallet,
              name: profile.name,
              province: profile.province,
              active: profile.active
            });
          }
        }
        setDelegates(tempDelegates);
      } catch (err) {
        console.error("Could not load delegate list:", err);
      }

    } catch (error) {
      console.error("Error loading information from contract:", error);
    }
  };

  const connectWallet = async () => {
    if (!(window as any).ethereum) {
      alert("Please install MetaMask to use this feature!");
      return;
    }
    try {
      setLoading(true);
      const accounts = await (window as any).ethereum.request({
        method: "eth_requestAccounts",
      });
      if (accounts.length > 0) {
        await initWeb3(accounts[0]);
      }
    } catch (error) {
      console.error("MetaMask connection error:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshState = async () => {
    if (contract) {
      setLoading(true);
      await loadContractData(contract, account);
      setLoading(false);
    } else {
      await initWeb3(account);
    }
  };

  useEffect(() => {
    initWeb3();

    // Listen for MetaMask account/chain changes
    if ((window as any).ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          initWeb3(accounts[0]);
        } else {
          setAccount(null);
          setIsAdmin(false);
          setIsDelegate(false);
          setDelegateProfile(null);
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      (window as any).ethereum.on("accountsChanged", handleAccountsChanged);
      (window as any).ethereum.on("chainChanged", handleChainChanged);

      return () => {
        if ((window as any).ethereum.removeListener) {
          (window as any).ethereum.removeListener("accountsChanged", handleAccountsChanged);
          (window as any).ethereum.removeListener("chainChanged", handleChainChanged);
        }
      };
    }
  }, []);

  return (
    <Web3Context.Provider
      value={{
        account,
        isAdmin,
        isDelegate,
        delegateProfile,
        proposals,
        delegates,
        userVotes,
        loading,
        wrongNetwork,
        connectWallet,
        refreshState,
        contract,
        provider,
        currentChainId,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

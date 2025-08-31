import { useState, useEffect, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { useWeb3Modal, useWeb3ModalProvider, useWeb3ModalAccount, useDisconnect } from '@web3modal/ethers/react';
import { Balances, DailyLimit, Bet, BettingStep } from '../types';
import { 
    CHADFLIP_CONTRACT_ADDRESS, 
    CHAD_TOKEN_ADDRESS, 
    MON_TOKEN_ADDRESS, 
    MONAD_TESTNET_CHAIN_ID,
    chadFlipContractABI, 
    erc20ABI 
} from '../constants';

/**
 * Parses a blockchain transaction error and returns a user-friendly message.
 */
const parseBlockchainError = (error: any): string => {
  console.error("Blockchain Error:", error); // Log the full error for debugging

  // 1. User rejected the transaction
  if (error.code === 'ACTION_REJECTED' || (error.message && (error.message.toLowerCase().includes('user denied') || error.message.toLowerCase().includes('transaction rejected')))) {
    return 'Transaction Rejected: You cancelled the action in your wallet.';
  }

  // 2. Insufficient funds for gas
  if (error.code === 'INSUFFICIENT_FUNDS' || (error.message && error.message.toLowerCase().includes('insufficient funds'))) {
      return 'Gas Error: You have insufficient MON in your wallet to pay for the transaction fee.';
  }
  
  // 3. Extract revert reason from various possible locations
  let reason = '';
  if (error.reason) {
    reason = error.reason;
  } else if (error.data?.message) {
    reason = error.data.message;
  } else if (error.error?.message) {
    reason = error.error.message;
  } else if (error.message) {
    // Fallback for when the reason is just in the message string
    const match = error.message.match(/revert(?:ed)?(?: with reason string)? ["'](.*?)["']/);
    if (match && match[1]) {
      reason = match[1];
    }
  }

  if (reason) {
      // Clean up common RPC provider prefixes.
      const cleanReason = reason
        .replace('execution reverted:', '')
        .replace('execution reverted', '')
        .replace('VM Exception while processing transaction: reverted with reason string', '')
        .replace(/'/g, "")
        .trim();

      const lowerCaseReason = cleanReason.toLowerCase();

      // 4. Map known revert reasons to user-friendly messages
      if (lowerCaseReason.includes('insufficient balance')) {
          return 'Transaction Failed: Your CHAD balance is too low to place this bet.';
      }
      if (lowerCaseReason.includes('daily limit exceeded')) {
          return 'Transaction Failed: This bet would exceed your daily betting limit.';
      }
      if (lowerCaseReason.includes('erc20: transfer amount exceeds balance')) {
          return 'Transaction Failed: Insufficient MON balance for the required collateral.';
      }
      if (lowerCaseReason.includes('insufficient allowance')) {
          return 'Approval Failed: The contract is not approved for the required token amount. Please try the transaction again to approve.';
      }
      
      // Capitalize the first letter for display
      const displayReason = cleanReason.charAt(0).toUpperCase() + cleanReason.slice(1);
      return `Transaction Failed: ${displayReason}`;
  }
  
  // 5. Fallback for other errors
  if (error.code) {
    return `An unexpected error occurred (Code: ${error.code}). Please check your connection and try again.`;
  }
  
  return 'An unexpected transaction error occurred. Please check the console for more details and try again.';
};

/**
 * A hook to manage all Web3 interactions, using Web3Modal for wallet connection.
 */
const useWeb3 = () => {
  // Web3Modal hooks
  const { open } = useWeb3Modal();
  const { address, chainId, isConnected } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();
  const { disconnect: w3mDisconnect } = useDisconnect();

  // Application state
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [chadFlipContract, setChadFlipContract] = useState<ethers.Contract | null>(null);
  const [chadTokenContract, setChadTokenContract] = useState<ethers.Contract | null>(null);
  const [monTokenContract, setMonTokenContract] = useState<ethers.Contract | null>(null);
  
  const [balances, setBalances] = useState<Balances>({ chad: 0, mon: 0 });
  const [dailyLimit, setDailyLimit] = useState<DailyLimit>({ used: 0, limit: 5000 });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [bettingStep, setBettingStep] = useState<BettingStep>('idle');
  const [tokenDecimals, setTokenDecimals] = useState<{chad: number, mon: number}>({chad: 18, mon: 18});

  const formatBalance = (balance: bigint, decimals: number) => {
      return parseFloat(ethers.formatUnits(balance, decimals));
  };

  const fetchContractData = useCallback(async (currentSigner: ethers.JsonRpcSigner, chadFlip: ethers.Contract, chad: ethers.Contract, mon: ethers.Contract) => {
    setLoading(true);
    setError(null);
    try {
        const userAddress = await currentSigner.getAddress();
        
        const results = await Promise.allSettled([
            chad.decimals(),
            chad.balanceOf(userAddress),
            MON_TOKEN_ADDRESS !== "0x0000000000000000000000000000000000000000" ? mon.decimals() : Promise.resolve(18),
            MON_TOKEN_ADDRESS !== "0x0000000000000000000000000000000000000000" ? mon.balanceOf(userAddress) : Promise.resolve(0n),
            chadFlip.dailyBetLimit(),
            chadFlip.dailyBetAmount(userAddress),
        ]);

        const [ chadDecimalsResult, chadBalanceResult, monDecimalsResult, monBalanceResult, dailyLimitResult, dailyUsedResult ] = results;
        
        const newDecimals = { chad: 18, mon: 18 };
        if (chadDecimalsResult.status === 'fulfilled') newDecimals.chad = Number(chadDecimalsResult.value);
        if (monDecimalsResult.status === 'fulfilled') newDecimals.mon = Number(monDecimalsResult.value);
        setTokenDecimals(newDecimals);

        const newBalances: Balances = { chad: 0, mon: 0 };
        if (chadBalanceResult.status === 'fulfilled') newBalances.chad = formatBalance(chadBalanceResult.value, newDecimals.chad);
        if (monBalanceResult.status === 'fulfilled') newBalances.mon = formatBalance(monBalanceResult.value, newDecimals.mon);
        setBalances(newBalances);

        const newDailyLimit: DailyLimit = { used: 0, limit: 5000 };
        if (dailyLimitResult.status === 'fulfilled') newDailyLimit.limit = formatBalance(dailyLimitResult.value, newDecimals.chad);
        if (dailyUsedResult.status === 'fulfilled') newDailyLimit.used = formatBalance(dailyUsedResult.value, newDecimals.chad);
        setDailyLimit(newDailyLimit);

    } catch (e: any) {
        console.error("Error fetching account data:", e);
        setError("Could not fetch account data.");
    } finally {
        setLoading(false);
    }
  }, []);

  // Effect to initialize provider, signer, and contracts when wallet connects or disconnects
  useEffect(() => {
    const setup = async () => {
      if (isConnected && walletProvider && address && chainId === Number(MONAD_TESTNET_CHAIN_ID)) {
        setError(null);
        const ethersProvider = new ethers.BrowserProvider(walletProvider);
        const currentSigner = await ethersProvider.getSigner();
        setSigner(currentSigner);

        const chadFlip = new ethers.Contract(CHADFLIP_CONTRACT_ADDRESS, chadFlipContractABI, currentSigner);
        const chad = new ethers.Contract(CHAD_TOKEN_ADDRESS, erc20ABI, currentSigner);
        const mon = new ethers.Contract(MON_TOKEN_ADDRESS, erc20ABI, currentSigner);
        
        setChadFlipContract(chadFlip);
        setChadTokenContract(chad);
        setMonTokenContract(mon);
        
        await fetchContractData(currentSigner, chadFlip, chad, mon);
      } else if (isConnected && chainId !== Number(MONAD_TESTNET_CHAIN_ID)) {
        setError("Wrong network. Please switch to Monad Testnet in your wallet.");
      } else {
        // Handle disconnection: clear all web3 state
        setError(null);
        setSigner(null);
        setChadFlipContract(null);
        setChadTokenContract(null);
        setMonTokenContract(null);
        setBalances({chad: 0, mon: 0});
        setDailyLimit({used: 0, limit: 5000});
      }
    };
    setup();
  }, [isConnected, walletProvider, address, chainId, fetchContractData]);

  const openModal = useCallback(() => {
    setError(null);
    open();
  }, [open]);

  const disconnect = useCallback(() => {
      w3mDisconnect();
  }, [w3mDisconnect]);
  
  const refreshData = useCallback(() => {
    if(signer && chadFlipContract && chadTokenContract && monTokenContract){
      fetchContractData(signer, chadFlipContract, chadTokenContract, monTokenContract);
    }
  }, [signer, chadFlipContract, chadTokenContract, monTokenContract, fetchContractData]);

  const placeBet = async (bet: Omit<Bet, 'id' | 'entryPrice'>) => {
    if (!chadFlipContract || !chadTokenContract || !monTokenContract || !signer || !address) {
      setError("Please connect your wallet first.");
      setBettingStep('error');
      return false;
    }
    setError(null);
    setLoading(true);

    try {
      const amount = ethers.parseUnits(bet.amount.toString(), tokenDecimals.chad);
      
      const currentChadAllowance = await chadTokenContract.allowance(address, CHADFLIP_CONTRACT_ADDRESS);
      if (currentChadAllowance < amount) {
        setBettingStep('approving_chad');
        const approveTx = await chadTokenContract.approve(CHADFLIP_CONTRACT_ADDRESS, amount);
        await approveTx.wait();
      }

      if (bet.leverage > 1) {
          const collateralNeeded = ethers.parseUnits((bet.amount * (bet.leverage - 1)).toString(), tokenDecimals.mon);
          const currentMonAllowance = await monTokenContract.allowance(address, CHADFLIP_CONTRACT_ADDRESS);
          if (currentMonAllowance < collateralNeeded) {
            setBettingStep('approving_mon');
            const approveMonTx = await monTokenContract.approve(CHADFLIP_CONTRACT_ADDRESS, collateralNeeded);
            await approveMonTx.wait();
          }
      }
      
      setBettingStep('placing_bet');
      const predictionUp = bet.direction === 'UP';
      const tx = await chadFlipContract.placeBet( CHAD_TOKEN_ADDRESS, amount, bet.leverage, predictionUp );
      await tx.wait();
      
      setBettingStep('success');
      await refreshData();
      return true;
    } catch (e: any) {
      console.error("Bet placement failed:", e);
      setError(parseBlockchainError(e));
      setBettingStep('error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const memoizedAddress = useMemo(() => address, [address]);

  return { 
    openModal,
    disconnect, 
    address: memoizedAddress, 
    balances, 
    dailyLimit, 
    placeBet, 
    loading, 
    error, 
    refreshData, 
    bettingStep, 
    setBettingStep 
  };
};

export default useWeb3;
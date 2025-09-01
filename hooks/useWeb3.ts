import { useState, useEffect, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { useConnectWallet, useWallets } from '@web3-onboard/react';
import { Balances, DailyLimit, Bet, BettingStep, BetResult } from '../types';
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
 * A hook to manage all Web3 interactions, using Web3-Onboard for wallet connection.
 */
const useWeb3 = () => {
  // Web3-Onboard hooks
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();
  const connectedWallets = useWallets();

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
        const provider = currentSigner.provider;
        
        const [
            chadDecimalsResult,
            monDecimalsResult,
            chadBalanceResult,
            nativeMonBalanceResult,
            dailyLimitResult,
            dailyUsedResult,
        ] = await Promise.allSettled([
            chad.decimals(),
            (MON_TOKEN_ADDRESS !== ethers.ZeroAddress ? mon.decimals() : Promise.resolve(18)),
            chad.balanceOf(userAddress),
            provider.getBalance(userAddress), // Fetch native MON balance for display
            chadFlip.dailyBetLimit(),
            chadFlip.dailyBetAmount(userAddress),
        ]);
        
        const newDecimals = { chad: 18, mon: 18 };
        if (chadDecimalsResult.status === 'fulfilled') newDecimals.chad = Number(chadDecimalsResult.value);
        if (monDecimalsResult.status === 'fulfilled') newDecimals.mon = Number(monDecimalsResult.value);
        setTokenDecimals(newDecimals);

        const newBalances: Balances = { chad: 0, mon: 0 };
        if (chadBalanceResult.status === 'fulfilled') newBalances.chad = formatBalance(chadBalanceResult.value, newDecimals.chad);
        if (nativeMonBalanceResult.status === 'fulfilled') newBalances.mon = formatBalance(nativeMonBalanceResult.value, 18);
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

  const primaryWallet = useMemo(() => connectedWallets[0], [connectedWallets]);

  const address = useMemo(() => primaryWallet?.accounts[0]?.address, [primaryWallet]);
  const refreshData = useCallback(() => {
    if(signer && chadFlipContract && chadTokenContract && monTokenContract){
      fetchContractData(signer, chadFlipContract, chadTokenContract, monTokenContract);
    }
  }, [signer, chadFlipContract, chadTokenContract, monTokenContract, fetchContractData]);

  useEffect(() => {
    const setup = async () => {
      if (primaryWallet) {
        const connectedChainId = parseInt(primaryWallet.chains[0].id, 16);
        
        if (connectedChainId !== Number(MONAD_TESTNET_CHAIN_ID)) {
          setError("Wrong network. Please switch to Monad Testnet in your wallet.");
          setSigner(null);
          setChadFlipContract(null);
          setChadTokenContract(null);
          setMonTokenContract(null);
          return;
        }

        setError(null);
        const ethersProvider = new ethers.BrowserProvider(primaryWallet.provider, 'any');
        const currentSigner = await ethersProvider.getSigner();
        setSigner(currentSigner);

        const chadFlip = new ethers.Contract(CHADFLIP_CONTRACT_ADDRESS, chadFlipContractABI, currentSigner);
        const chad = new ethers.Contract(CHAD_TOKEN_ADDRESS, erc20ABI, currentSigner);
        const mon = new ethers.Contract(MON_TOKEN_ADDRESS, erc20ABI, currentSigner);
        
        setChadFlipContract(chadFlip);
        setChadTokenContract(chad);
        setMonTokenContract(mon);
        
        await fetchContractData(currentSigner, chadFlip, chad, mon);
      } else {
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
  }, [primaryWallet, fetchContractData]);
  
  const openModal = useCallback(() => {
    setError(null);
    connect();
  }, [connect]);

  const doDisconnect = useCallback(() => {
      if (wallet) {
          disconnect(wallet);
      }
  }, [wallet, disconnect]);
  
  const placeBet = async (bet: Omit<Bet, 'id' | 'entryPrice'>): Promise<bigint | null> => {
    if (!chadFlipContract || !chadTokenContract || !monTokenContract || !signer || !primaryWallet) {
      setError("Please connect your wallet first.");
      setBettingStep('error');
      return null;
    }
    setError(null);
    setLoading(true);

    try {
      const amount = ethers.parseUnits(bet.amount.toString(), tokenDecimals.chad);
      const userAddress = primaryWallet.accounts[0].address;
      
      const currentChadAllowance = await chadTokenContract.allowance(userAddress, CHADFLIP_CONTRACT_ADDRESS);
      if (currentChadAllowance < amount) {
        setBettingStep('approving_chad');
        const approveTx = await chadTokenContract.approve(CHADFLIP_CONTRACT_ADDRESS, amount);
        const approveReceipt = await approveTx.wait();
        if (!approveReceipt || approveReceipt.status === 0) {
          throw new Error("CHAD approval transaction failed.");
        }
      }

      if (bet.leverage > 1) {
          if (MON_TOKEN_ADDRESS === ethers.ZeroAddress) {
              throw new Error("Leverage Error: The MON Token Address is not configured. Please update it in `constants.ts`.");
          }
          const collateralNeeded = ethers.parseUnits((bet.amount * (bet.leverage - 1)).toString(), tokenDecimals.mon);
          
          const erc20MonBalance = await monTokenContract.balanceOf(userAddress);
          if (erc20MonBalance < collateralNeeded) {
              const needed = ethers.formatUnits(collateralNeeded, tokenDecimals.mon);
              const has = ethers.formatUnits(erc20MonBalance, tokenDecimals.mon);
              throw new Error(`Insufficient MON collateral. You need ${needed} but have ${has} ERC20 MON.`);
          }

          const currentMonAllowance = await monTokenContract.allowance(userAddress, CHADFLIP_CONTRACT_ADDRESS);
          if (currentMonAllowance < collateralNeeded) {
            setBettingStep('approving_mon');
            const approveMonTx = await monTokenContract.approve(CHADFLIP_CONTRACT_ADDRESS, collateralNeeded);
            const approveMonReceipt = await approveMonTx.wait();
            if (!approveMonReceipt || approveMonReceipt.status === 0) {
              throw new Error("MON collateral approval transaction failed.");
            }
          }
      }
      
      setBettingStep('placing_bet');
      const predictionUp = bet.direction === 'UP';

      const tx = await chadFlipContract.placeBet( CHAD_TOKEN_ADDRESS, amount, bet.leverage, predictionUp, bet.duration );
      const receipt = await tx.wait();
      
      if (!receipt || receipt.status === 0) {
          console.error("Transaction failed (reverted). Receipt:", receipt);
          throw new Error("Bet placement transaction failed. The contract may have rejected it.");
      }

      let betPlacedEvent = null;
      const betPlacedEventTopic = chadFlipContract.interface.getEvent('BetPlaced').topicHash;

      for (const log of receipt.logs) {
        if (log.topics[0] === betPlacedEventTopic) {
          try {
            betPlacedEvent = chadFlipContract.interface.parseLog(log);
            break;
          } catch (e) {
            console.warn("Found BetPlaced event topic but failed to parse log:", log, e);
          }
        }
      }

      if (!betPlacedEvent) {
          console.error("Could not find BetPlaced event in transaction receipt.", receipt);
          throw new Error('Could not find BetPlaced event in transaction receipt. The transaction may have succeeded, but the event was not processed correctly.');
      }

      const contractBetId = betPlacedEvent.args.betId;
      
      setBettingStep('success');
      refreshData();
      return contractBetId;

    } catch (e: any) {
      console.error("Bet placement failed:", e);
      refreshData();
      setError(parseBlockchainError(e));
      setBettingStep('error');
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const resolveBet = async (bet: Bet, finalPrice: number): Promise<BetResult | null> => {
      if (!chadFlipContract || typeof bet.contractBetId === 'undefined') {
          setError("Cannot resolve bet: contract not ready or bet ID is missing.");
          return null;
      }
      setLoading(true);
      setError(null);
      try {
          const priceWentUp = finalPrice > bet.entryPrice;
          const tx = await chadFlipContract.resolveBet(bet.contractBetId, priceWentUp);
          const receipt = await tx.wait();
          
          if (!receipt || receipt.status === 0) {
            console.error("Transaction failed (reverted). Receipt:", receipt);
            throw new Error("Bet resolution transaction failed. The contract may have rejected it.");
          }

          let betResolvedEvent = null;
          const betResolvedEventTopic = chadFlipContract.interface.getEvent('BetResolved').topicHash;

          for (const log of receipt.logs) {
            if (log.topics[0] === betResolvedEventTopic) {
              try {
                betResolvedEvent = chadFlipContract.interface.parseLog(log);
                break;
              } catch (e) {
                console.warn("Found BetResolved event topic but failed to parse log:", log, e);
              }
            }
          }

          if (!betResolvedEvent) {
              console.error("Could not find BetResolved event in transaction receipt. Receipt:", receipt);
              throw new Error("Could not confirm bet result from the blockchain. Please refresh data manually.");
          }
          
          const { won, payoutAmount } = betResolvedEvent.args;
          
          return {
              won: won,
              payout: formatBalance(payoutAmount, tokenDecimals.chad)
          };

      } catch (e: any) {
          console.error("Bet resolution failed:", e);
          setError(parseBlockchainError(e));
          return null;
      } finally {
          setLoading(false);
      }
  };

  return { 
    openModal,
    disconnect: doDisconnect, 
    address, 
    balances, 
    dailyLimit, 
    placeBet, 
    resolveBet,
    loading: connecting || loading, 
    error, 
    refreshData, 
    bettingStep, 
    setBettingStep,
  };
};

export default useWeb3;
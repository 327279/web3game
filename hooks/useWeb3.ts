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

const PRICE_PRECISION = 10**8;

/**
 * Parses a blockchain transaction error and returns a user-friendly message.
 */
const parseBlockchainError = (error: any): string => {
  console.error("Blockchain Error:", error); // Log the full error for debugging

  if (error.code === 'ACTION_REJECTED' || (error.message && (error.message.toLowerCase().includes('user denied') || error.message.toLowerCase().includes('transaction rejected')))) {
    return 'Transaction Rejected: You cancelled the action in your wallet.';
  }

  if (error.code === 'INSUFFICIENT_FUNDS' || (error.message && error.message.toLowerCase().includes('insufficient funds'))) {
      return 'Gas Error: You have insufficient MON in your wallet to pay for the transaction fee.';
  }
  
  let reason = '';
  if (error.reason) {
    reason = error.reason;
  } else if (error.data?.message) {
    reason = error.data.message;
  } else if (error.error?.message) {
    reason = error.error.message;
  } else if (error.message) {
    const match = error.message.match(/revert(?:ed)?(?: with reason string)? ["'](.*?)["']/);
    if (match && match[1]) {
      reason = match[1];
    }
  }

  if (reason) {
      const cleanReason = reason.replace('execution reverted:', '').replace('ChadFlip:', '').trim();
      return `Transaction Failed: ${cleanReason}`;
  }
  
  if (error.code) {
    return `An unexpected error occurred (Code: ${error.code}). Please check your connection and try again.`;
  }
  
  return 'An unexpected transaction error occurred. Please check the console for more details and try again.';
};

/**
 * A hook to manage all Web3 interactions, using Web3-Onboard for wallet connection.
 */
const useWeb3 = () => {
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();
  const connectedWallets = useWallets();

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

  const fetchContractData = useCallback(async (currentSigner: ethers.JsonRpcSigner, chadFlip: ethers.Contract, chad: ethers.Contract) => {
    setLoading(true);
    setError(null);
    try {
        const userAddress = await currentSigner.getAddress();
        const provider = currentSigner.provider;
        
        const [
            chadDecimalsResult,
            chadBalanceResult,
            nativeMonBalanceResult,
            dailyLimitResult,
            dailyUsedResult,
        ] = await Promise.allSettled([
            chad.decimals(),
            chad.balanceOf(userAddress),
            provider.getBalance(userAddress),
            chadFlip.dailyBetLimit(),
            chadFlip.getPlayerDailyUsed(userAddress),
        ]);
        
        const newDecimals = { chad: 18, mon: 18 }; // Assume MON is 18 if not available
        if (chadDecimalsResult.status === 'fulfilled') newDecimals.chad = Number(chadDecimalsResult.value);
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
    if(signer && chadFlipContract && chadTokenContract){
      fetchContractData(signer, chadFlipContract, chadTokenContract);
    }
  }, [signer, chadFlipContract, chadTokenContract, fetchContractData]);

  useEffect(() => {
    const setup = async () => {
      if (primaryWallet) {
        const connectedChainId = parseInt(primaryWallet.chains[0].id, 16);
        
        if (connectedChainId !== Number(MONAD_TESTNET_CHAIN_ID)) {
          setError("Wrong network. Please switch to Monad Testnet in your wallet.");
          setSigner(null);
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
        
        await fetchContractData(currentSigner, chadFlip, chad);
      } else {
        setError(null);
        setSigner(null);
        setBalances({chad: 0, mon: 0});
        setDailyLimit({used: 0, limit: 5000});
      }
    };
    setup();
  }, [primaryWallet, fetchContractData]);
  
  const openModal = useCallback(() => { connect(); }, [connect]);
  const doDisconnect = useCallback(() => { if (wallet) { disconnect(wallet); } }, [wallet, disconnect]);
  
  const placeBet = async (bet: Omit<Bet, 'contractBetId'>): Promise<bigint | null> => {
    if (!chadFlipContract || !chadTokenContract || !monTokenContract || !signer) {
      setError("Please connect your wallet first.");
      setBettingStep('error');
      return null;
    }
    setError(null);
    setLoading(true);

    try {
      const userAddress = await signer.getAddress();
      const amount = ethers.parseUnits(bet.amount.toString(), tokenDecimals.chad);
      
      const currentChadAllowance = await chadTokenContract.allowance(userAddress, CHADFLIP_CONTRACT_ADDRESS);
      if (currentChadAllowance < amount) {
        setBettingStep('approving_chad');
        const approveTx = await chadTokenContract.approve(CHADFLIP_CONTRACT_ADDRESS, amount);
        const approveReceipt = await approveTx.wait();
        if (!approveReceipt || approveReceipt.status === 0) throw new Error("CHAD approval transaction failed.");
      }

      if (bet.leverage > 1) {
          if (MON_TOKEN_ADDRESS === ethers.ZeroAddress) {
              throw new Error("Leverage Error: The MON Token Address is not configured in `constants.ts`.");
          }
          const collateralNeeded = ethers.parseUnits((bet.amount * (bet.leverage - 1)).toString(), tokenDecimals.mon);
          
          const erc20MonBalance = await monTokenContract.balanceOf(userAddress);
          if (erc20MonBalance < collateralNeeded) {
              const needed = ethers.formatUnits(collateralNeeded, tokenDecimals.mon);
              throw new Error(`Insufficient MON collateral. You need ${needed} but have ${ethers.formatUnits(erc20MonBalance, tokenDecimals.mon)}.`);
          }

          const currentMonAllowance = await monTokenContract.allowance(userAddress, CHADFLIP_CONTRACT_ADDRESS);
          if (currentMonAllowance < collateralNeeded) {
            setBettingStep('approving_mon');
            const approveMonTx = await monTokenContract.approve(CHADFLIP_CONTRACT_ADDRESS, collateralNeeded);
            const approveMonReceipt = await approveMonTx.wait();
            if (!approveMonReceipt || approveMonReceipt.status === 0) throw new Error("MON collateral approval transaction failed.");
          }
      }
      
      setBettingStep('placing_bet');
      const predictionUp = bet.direction === 'UP';
      const entryPriceScaled = BigInt(Math.round(bet.entryPrice * PRICE_PRECISION));

      const tx = await chadFlipContract.placeBet(amount, bet.leverage, predictionUp, bet.duration, entryPriceScaled);
      const receipt = await tx.wait();
      
      if (!receipt || receipt.status === 0) {
          throw new Error("Bet placement transaction failed. The contract reverted it.");
      }

      for (const log of receipt.logs) {
        try {
          const parsedLog = chadFlipContract.interface.parseLog(log);
          if (parsedLog && parsedLog.name === "BetPlaced") {
            const contractBetId = parsedLog.args.betId;
            setBettingStep('success');
            refreshData();
            return contractBetId;
          }
        } catch (e) {
          // Ignore logs that are not from this contract
        }
      }

      throw new Error('Could not find BetPlaced event in transaction receipt.');

    } catch (e: any) {
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
          const finalPriceScaled = BigInt(Math.round(finalPrice * PRICE_PRECISION));
          const tx = await chadFlipContract.resolveBet(bet.contractBetId, finalPriceScaled);
          const receipt = await tx.wait();
          
          if (!receipt || receipt.status === 0) {
            throw new Error("Bet resolution transaction failed. The contract reverted it.");
          }

          for (const log of receipt.logs) {
            try {
                const parsedLog = chadFlipContract.interface.parseLog(log);
                if (parsedLog && parsedLog.name === "BetResolved") {
                    const { won, payoutAmount } = parsedLog.args;
                    return {
                        won: won,
                        payout: formatBalance(payoutAmount, tokenDecimals.chad)
                    };
                }
            } catch (e) {
                // Ignore other logs
            }
          }
          
          throw new Error("Could not confirm bet result from the blockchain.");

      } catch (e: any) {
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

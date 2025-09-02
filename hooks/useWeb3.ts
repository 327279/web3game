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
    // A more robust regex to catch revert reasons
    const match = error.message.match(/revert(?:ed)?(?: with reason string)? ["'](.*?.)["']/i);
    if (match && match[1]) {
      reason = match[1];
    } else if (error.message.includes('reverted')) {
      // Fallback for generic revert messages
      reason = 'The contract reverted the transaction. Check your inputs or balances.';
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
          return;
        }

        const provider = new ethers.BrowserProvider(primaryWallet.provider, 'any');
        const currentSigner = await provider.getSigner();
        setSigner(currentSigner);

        const chadFlip = new ethers.Contract(CHADFLIP_CONTRACT_ADDRESS, chadFlipContractABI, currentSigner);
        setChadFlipContract(chadFlip);

        const chadToken = new ethers.Contract(CHAD_TOKEN_ADDRESS, erc20ABI, currentSigner);
        setChadTokenContract(chadToken);

        if (MON_TOKEN_ADDRESS && MON_TOKEN_ADDRESS !== "0x0000000000000000000000000000000000000000") {
            const monToken = new ethers.Contract(MON_TOKEN_ADDRESS, erc20ABI, currentSigner);
            setMonTokenContract(monToken);
        } else {
            console.warn("MON_TOKEN_ADDRESS is not configured. Leveraged bets will fail.");
            setMonTokenContract(null);
        }

        await fetchContractData(currentSigner, chadFlip, chadToken);
      } else {
        setSigner(null);
        setChadFlipContract(null);
        setChadTokenContract(null);
        setMonTokenContract(null);
        setBalances({ chad: 0, mon: 0 });
        setDailyLimit({ used: 0, limit: 5000 });
        setError(null);
      }
    };
    setup();
  }, [primaryWallet, fetchContractData]);
  
  const placeBet = useCallback(async (bet: Omit<Bet, 'id' | 'contractBetId'>): Promise<bigint | null> => {
    if (!signer || !chadFlipContract || !chadTokenContract || !address) {
        setError("Wallet not connected or contract not initialized.");
        setBettingStep('error');
        return null;
    }
    setLoading(true);
    setError(null);
    try {
        const amountWei = ethers.parseUnits(bet.amount.toString(), tokenDecimals.chad);
        const entryPriceBigInt = BigInt(Math.round(bet.entryPrice * PRICE_PRECISION));

        if (bet.leverage > 1) {
            if (!monTokenContract) {
                throw new Error("MON token address not configured. Leveraged bets are disabled.");
            }
            const collateralRequired = BigInt(bet.amount) * BigInt(bet.leverage - 1);
            const collateralWei = ethers.parseUnits(collateralRequired.toString(), tokenDecimals.mon);
            
            setBettingStep('approving_mon');
            const monAllowance = await monTokenContract.allowance(address, CHADFLIP_CONTRACT_ADDRESS);
            if (monAllowance < collateralWei) {
                const approveMonTx = await monTokenContract.approve(CHADFLIP_CONTRACT_ADDRESS, ethers.MaxUint256);
                await approveMonTx.wait();
            }
        }
        
        setBettingStep('approving_chad');
        const chadAllowance = await chadTokenContract.allowance(address, CHADFLIP_CONTRACT_ADDRESS);
        if (chadAllowance < amountWei) {
            const approveChadTx = await chadTokenContract.approve(CHADFLIP_CONTRACT_ADDRESS, ethers.MaxUint256);
            await approveChadTx.wait();
        }

        setBettingStep('placing_bet');
        const tx = await chadFlipContract.placeBet(
            amountWei,
            bet.leverage,
            bet.direction === 'UP',
            bet.duration,
            entryPriceBigInt
        );

        const receipt = await tx.wait();

        let betIdFromEvent: bigint | null = null;
        for (const log of receipt.logs) {
            try {
                const iface = chadFlipContract.interface;
                const parsedLog = iface.parseLog(log);
                if (parsedLog && parsedLog.name === 'BetPlaced') {
                    betIdFromEvent = parsedLog.args.betId;
                    break;
                }
            } catch (e) { /* Not a ChadFlip event, ignore */ }
        }

        if (betIdFromEvent === null) {
            throw new Error("Could not find BetPlaced event in transaction receipt.");
        }
        
        setBettingStep('success');
        refreshData();
        return betIdFromEvent;
    } catch (e: any) {
        setError(parseBlockchainError(e));
        setBettingStep('error');
        return null;
    } finally {
        setLoading(false);
    }
  }, [signer, address, chadFlipContract, chadTokenContract, monTokenContract, tokenDecimals, refreshData]);

  const resolveBet = useCallback(async (bet: Bet, finalPrice: number): Promise<BetResult | null> => {
      if (!signer || !chadFlipContract || !bet.contractBetId) {
          setError("Cannot resolve: Missing contract or bet ID.");
          return null;
      }
      setLoading(true);
      setError(null);
      try {
          const finalPriceBigInt = BigInt(Math.round(finalPrice * PRICE_PRECISION));
          const tx = await chadFlipContract.resolveBet(bet.contractBetId, finalPriceBigInt);
          const receipt = await tx.wait();

          let betResultFromEvent: { won: boolean; payout: bigint } | null = null;
          for (const log of receipt.logs) {
            try {
                const iface = chadFlipContract.interface;
                const parsedLog = iface.parseLog(log);
                if (parsedLog && parsedLog.name === 'BetResolved' && parsedLog.args.betId === bet.contractBetId) {
                    betResultFromEvent = {
                        won: parsedLog.args.won,
                        payout: parsedLog.args.payoutAmount,
                    };
                    break;
                }
            } catch (e) { /* Not a ChadFlip event, ignore */ }
          }
          
          if (!betResultFromEvent) {
              throw new Error("Could not find BetResolved event for this bet.");
          }

          return {
              won: betResultFromEvent.won,
              payout: parseFloat(ethers.formatUnits(betResultFromEvent.payout, tokenDecimals.chad)),
              betAmount: bet.amount,
              leverage: bet.leverage,
          };
      } catch (e: any) {
          setError(parseBlockchainError(e));
          return null;
      } finally {
          setLoading(false);
      }
  }, [signer, chadFlipContract, tokenDecimals.chad]);

  return {
    openModal: () => connect(),
    disconnect: () => primaryWallet && disconnect(primaryWallet),
    address,
    balances,
    dailyLimit,
    placeBet,
    resolveBet,
    loading,
    error,
    refreshData,
    bettingStep,
    setBettingStep,
    chadFlipContract,
    tokenDecimals,
  };
};

export default useWeb3;

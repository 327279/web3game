import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { Balances, DailyLimit, Bet, WalletType, BettingStep } from '../types';
import { 
    CHADFLIP_CONTRACT_ADDRESS, 
    CHAD_TOKEN_ADDRESS, 
    MON_TOKEN_ADDRESS, 
    MONAD_TESTNET_CHAIN_ID, 
    MONAD_TESTNET_CONFIG,
    MONAD_TESTNET_HEX_CHAIN_ID,
    chadFlipContractABI, 
    erc20ABI 
} from '../constants';

// Add type definitions for various wallet providers on the window object.
declare global {
  interface Window {
    ethereum?: any;
    okxwallet?: any;
    phantom?: { ethereum?: any };
  }
}

/**
 * Parses a blockchain transaction error and returns a user-friendly message.
 */
const parseBlockchainError = (error: any): string => {
  if (error.code === 'ACTION_REJECTED') {
    return 'You rejected the transaction.';
  }
  if (error.reason) {
    const reason = error.reason.toLowerCase();
    if (reason.includes('insufficient balance')) return 'Insufficient CHAD balance.';
    if (reason.includes('daily limit exceeded')) return 'Daily betting limit exceeded.';
    if (reason.includes('erc20: transfer amount exceeds balance')) return 'Insufficient MON balance for collateral.';
    return `Transaction failed: ${error.reason}`;
  }
  if (error.message) {
    const message = error.message.toLowerCase();
    if (message.includes('user denied')) return 'You rejected the transaction.';
    if (message.includes('insufficient funds')) return 'Insufficient funds for gas fee.';
  }
  return 'Transaction failed. Please check the console for details.';
};

/**
 * A hook to manage all Web3 interactions, including wallet connection, network management, and smart contract interactions.
 */
const useWeb3 = () => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [rawProvider, setRawProvider] = useState<any | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [address, setAddress] = useState<string | null>(null);
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

  /**
   * Fetches all relevant on-chain data for the connected user.
   */
  const fetchContractData = useCallback(async (currentProvider: ethers.BrowserProvider, currentSigner: ethers.JsonRpcSigner, chadFlip: ethers.Contract, chad: ethers.Contract, mon: ethers.Contract) => {
    setLoading(true);
    setError(null);
    try {
        const userAddress = await currentSigner.getAddress();

        // Pre-flight checks to ensure contracts are deployed.
        const contractCodes = await Promise.all([
            currentProvider.getCode(CHAD_TOKEN_ADDRESS),
            currentProvider.getCode(CHADFLIP_CONTRACT_ADDRESS)
        ]);
        if (contractCodes[0] === '0x') throw new Error("CHAD token contract not found on this network.");
        if (contractCodes[1] === '0x') throw new Error("ChadFlip game contract not found on this network.");

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
        if (chadDecimalsResult.status === 'fulfilled') newDecimals.chad = Number(chadDecimalsResult.value); else console.error("Failed to fetch CHAD decimals:", chadDecimalsResult.reason);
        if (monDecimalsResult.status === 'fulfilled') newDecimals.mon = Number(monDecimalsResult.value); else console.warn("Could not fetch MON decimals:", monDecimalsResult.reason);
        setTokenDecimals(newDecimals);

        const newBalances: Balances = { chad: 0, mon: 0 };
        if (chadBalanceResult.status === 'fulfilled') newBalances.chad = formatBalance(chadBalanceResult.value, newDecimals.chad); else { setError("Could not fetch CHAD balance."); console.error(chadBalanceResult.reason); }
        if (monBalanceResult.status === 'fulfilled') newBalances.mon = formatBalance(monBalanceResult.value, newDecimals.mon); else console.warn("Could not fetch MON balance:", monBalanceResult.reason);
        setBalances(newBalances);

        const newDailyLimit: DailyLimit = { used: 0, limit: 5000 };
        if (dailyLimitResult.status === 'fulfilled') newDailyLimit.limit = formatBalance(dailyLimitResult.value, newDecimals.chad); else { setError("Could not fetch daily limit."); console.error(dailyLimitResult.reason); }
        if (dailyUsedResult.status === 'fulfilled') newDailyLimit.used = formatBalance(dailyUsedResult.value, newDecimals.chad); else console.warn("Could not fetch used daily amount:", dailyUsedResult.reason);
        setDailyLimit(newDailyLimit);

    } catch (e: any) {
        console.error("An unexpected error occurred while fetching account data:", e);
        setError(e.message || "An unexpected error occurred while fetching account data.");
    } finally {
        setLoading(false);
    }
  }, []);

  /**
   * Switches the wallet's network to the Monad Testnet, or adds it if it doesn't exist.
   */
  const switchToMonadTestnet = async (provider: any) => {
    try {
        await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: MONAD_TESTNET_HEX_CHAIN_ID }],
        });
    } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
            try {
                await provider.request({
                    method: 'wallet_addEthereumChain',
                    params: [MONAD_TESTNET_CONFIG],
                });
            } catch (addError) {
                console.error("Failed to add Monad Testnet:", addError);
                throw new Error("Failed to add Monad Testnet to your wallet.");
            }
        } else {
            console.error("Failed to switch network:", switchError);
            throw new Error("Failed to switch to Monad Testnet. Please do it manually in your wallet.");
        }
    }
  };
  
  /**
   * Connects to the user's wallet, handling network validation and switching.
   */
  const connectWallet = useCallback(async (walletType: WalletType) => {
    setError(null);
    setLoading(true);

    try {
        let selectedProvider: any = null;
        switch (walletType) {
            case 'metamask': selectedProvider = window.ethereum?.isMetaMask ? window.ethereum : (window.ethereum?.providers?.find((p: any) => p.isMetaMask) || null); break;
            case 'okx': selectedProvider = window.okxwallet || (window.ethereum?.providers?.find((p: any) => p.isOkxWallet) || null); break;
            case 'phantom': selectedProvider = window.phantom?.ethereum; break;
        }

        if (!selectedProvider) {
            throw new Error(`${walletType.charAt(0).toUpperCase() + walletType.slice(1)} wallet is not installed.`);
        }

        // Request account access
        await selectedProvider.request({ method: 'eth_requestAccounts' });

        const newProvider = new ethers.BrowserProvider(selectedProvider);
        const network = await newProvider.getNetwork();

        if (network.chainId !== MONAD_TESTNET_CHAIN_ID) {
            setError("Wrong network. Attempting to switch...");
            await switchToMonadTestnet(selectedProvider);
            // After switching, re-initialize provider to get the new network's state
            const finalProvider = new ethers.BrowserProvider(selectedProvider);
            const finalSigner = await finalProvider.getSigner();
            const finalAddress = await finalSigner.getAddress();
            
            setRawProvider(selectedProvider);
            setProvider(finalProvider);
            setSigner(finalSigner);
            setAddress(finalAddress);

            const chadFlip = new ethers.Contract(CHADFLIP_CONTRACT_ADDRESS, chadFlipContractABI, finalSigner);
            const chad = new ethers.Contract(CHAD_TOKEN_ADDRESS, erc20ABI, finalSigner);
            const mon = new ethers.Contract(MON_TOKEN_ADDRESS, erc20ABI, finalSigner);
            
            setChadFlipContract(chadFlip);
            setChadTokenContract(chad);
            setMonTokenContract(mon);
            await fetchContractData(finalProvider, finalSigner, chadFlip, chad, mon);
            return; // Exit after successful switch and data fetch
        }

        const newSigner = await newProvider.getSigner();
        const newAddress = await newSigner.getAddress();
        
        setRawProvider(selectedProvider);
        setProvider(newProvider);
        setSigner(newSigner);
        setAddress(newAddress);
        
        const chadFlip = new ethers.Contract(CHADFLIP_CONTRACT_ADDRESS, chadFlipContractABI, newSigner);
        const chad = new ethers.Contract(CHAD_TOKEN_ADDRESS, erc20ABI, newSigner);
        const mon = new ethers.Contract(MON_TOKEN_ADDRESS, erc20ABI, newSigner);
        
        setChadFlipContract(chadFlip);
        setChadTokenContract(chad);
        setMonTokenContract(mon);
        await fetchContractData(newProvider, newSigner, chadFlip, chad, mon);

    } catch (e: any) {
        console.error("Connection failed:", e);
        setError(e.message || "Failed to connect wallet.");
    } finally {
        setLoading(false);
    }
  }, [fetchContractData]);
  
  const disconnect = useCallback(() => {
      setProvider(null);
      setRawProvider(null);
      setSigner(null);
      setAddress(null);
      setChadFlipContract(null);
      setChadTokenContract(null);
      setMonTokenContract(null);
      setBalances({chad: 0, mon: 0});
      setDailyLimit({used: 0, limit: 5000});
  }, []);
  
  const refreshData = useCallback(() => {
    if(provider && signer && chadFlipContract && chadTokenContract && monTokenContract){
      fetchContractData(provider, signer, chadFlipContract, chadTokenContract, monTokenContract);
    }
  }, [provider, signer, chadFlipContract, chadTokenContract, monTokenContract, fetchContractData]);

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

  useEffect(() => {
    if (rawProvider && rawProvider.on) {
      // For robustness, reload the page on account or network changes.
      // This is a simple and effective way to ensure a clean state.
      const handleAccountsChanged = () => window.location.reload();
      const handleChainChanged = () => window.location.reload();
      
      rawProvider.on('accountsChanged', handleAccountsChanged);
      rawProvider.on('chainChanged', handleChainChanged);

      return () => {
        if (rawProvider.removeListener) {
            rawProvider.removeListener('accountsChanged', handleAccountsChanged);
            rawProvider.removeListener('chainChanged', handleChainChanged);
        }
      }
    }
  }, [rawProvider]);

  return { connectWallet, disconnect, address, balances, dailyLimit, placeBet, loading, error, refreshData, bettingStep, setBettingStep };
};

export default useWeb3;
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { Balances, DailyLimit, Bet, WalletType, BettingStep } from '../types';
import { CHADFLIP_CONTRACT_ADDRESS, CHAD_TOKEN_ADDRESS, MON_TOKEN_ADDRESS, chadFlipContractABI, erc20ABI } from '../constants';

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
 * @param error The error object caught from ethers.js.
 * @returns A string containing a user-friendly error message.
 */
const parseBlockchainError = (error: any): string => {
  // Ethers v6 specific error for user rejected transaction
  if (error.code === 'ACTION_REJECTED') {
    return 'You rejected the transaction.';
  }

  // Check for revert reason from the contract
  if (error.reason) {
    const reason = error.reason.toLowerCase();
    if (reason.includes('insufficient balance')) {
      return 'Insufficient CHAD balance.';
    }
    if (reason.includes('daily limit exceeded')) {
      return 'Daily betting limit exceeded.';
    }
    // A more specific check for insufficient collateral
    if (reason.includes('erc20: transfer amount exceeds balance')) {
      return 'Insufficient MON balance for collateral.';
    }
    // Return the reason directly if it's a custom message we haven't parsed
    return `Transaction failed: ${error.reason}`;
  }

  // Generic message for other types of errors
  if (error.message) {
    const message = error.message.toLowerCase();
    if (message.includes('user denied')) {
        return 'You rejected the transaction.';
    }
    if (message.includes('insufficient funds')) {
        return 'Insufficient funds for gas fee.';
    }
  }

  return 'Transaction failed. Please check the console for details.';
};


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

  const fetchContractData = useCallback(async (currentSigner: ethers.JsonRpcSigner, chadFlip: ethers.Contract, chad: ethers.Contract, mon: ethers.Contract) => {
    try {
        setLoading(true);
        const userAddress = await currentSigner.getAddress();
        
        const [chadBalance, monBalance, dailyBetUsed, dailyBetLimit, chadDecimals, monDecimals] = await Promise.all([
            chad.balanceOf(userAddress),
            mon.balanceOf(userAddress),
            chadFlip.dailyBetAmount(userAddress),
            chadFlip.dailyBetLimit(),
            chad.decimals(),
            mon.decimals()
        ]);
        
        const decimals = {
            chad: Number(chadDecimals),
            mon: Number(monDecimals)
        };
        setTokenDecimals(decimals);

        setBalances({
            chad: formatBalance(chadBalance, decimals.chad),
            mon: formatBalance(monBalance, decimals.mon),
        });
        setDailyLimit({
            used: formatBalance(dailyBetUsed, decimals.chad), // Daily bet is in CHAD
            limit: formatBalance(dailyBetLimit, decimals.chad),
        });
    } catch (e) {
        console.error("Error fetching contract data:", e);
        setError("Failed to fetch account data. Make sure contract addresses in constants.ts are correct and you are on the right network.");
    } finally {
        setLoading(false);
    }
  }, []);

  const connectWallet = useCallback(async (walletType: WalletType) => {
    setError(null);
    if (CHADFLIP_CONTRACT_ADDRESS.includes('...') || CHAD_TOKEN_ADDRESS.includes('...') || MON_TOKEN_ADDRESS.includes('...')) {
        setError("Contract addresses are not configured. Please update constants.ts");
        return;
    }

    let selectedProvider: any = null;

    // EIP-6963 suggests providers be in an array to avoid conflicts.
    const providers: any[] = (window.ethereum as any)?.providers || [];

    switch (walletType) {
        case 'metamask':
            // Prioritize finding the specific provider in the array.
            selectedProvider = providers.find(p => p.isMetaMask);
            // Fallback to the default window.ethereum if it's MetaMask.
            if (!selectedProvider && window.ethereum?.isMetaMask) {
                selectedProvider = window.ethereum;
            }
            if (!selectedProvider) {
                setError("MetaMask is not installed or is being overridden by another wallet. Please disable other wallet extensions or use a different browser profile.");
            }
            break;
        case 'okx':
            // OKX can have its own global object or be in the providers array.
            selectedProvider = window.okxwallet || providers.find(p => p.isOkxWallet);
            // Fallback to the default window.ethereum if it's OKX.
            if (!selectedProvider && window.ethereum?.isOkxWallet) {
                selectedProvider = window.ethereum;
            }
            if (!selectedProvider) {
                setError("OKX Wallet is not installed. Please install it to use this app.");
            }
            break;
        case 'phantom':
            // Phantom has a distinct injection pattern.
            if (window.phantom?.ethereum?.isPhantom) {
                selectedProvider = window.phantom.ethereum;
            } else {
                setError("Phantom Wallet is not installed. Please install it to use this app.");
            }
            break;
        default:
            setError("Invalid wallet type selected.");
    }

    if (!selectedProvider) {
        return; // Exit if provider not found or an error was set
    }

    try {
        setLoading(true);
        const newProvider = new ethers.BrowserProvider(selectedProvider);
        const newSigner = await newProvider.getSigner();
        const newAddress = await newSigner.getAddress();

        const chadFlip = new ethers.Contract(CHADFLIP_CONTRACT_ADDRESS, chadFlipContractABI, newSigner);
        const chad = new ethers.Contract(CHAD_TOKEN_ADDRESS, erc20ABI, newSigner);
        const mon = new ethers.Contract(MON_TOKEN_ADDRESS, erc20ABI, newSigner);

        setRawProvider(selectedProvider); // Store the selected raw provider
        setProvider(newProvider);
        setSigner(newSigner);
        setAddress(newAddress);
        setChadFlipContract(chadFlip);
        setChadTokenContract(chad);
        setMonTokenContract(mon);

        await fetchContractData(newSigner, chadFlip, chad, mon);

    } catch (e: any) {
        console.error("Connection failed:", e);
        if (e.code === 'ACTION_REJECTED') {
            setError('You rejected the connection request.');
        } else {
            setError("Failed to connect wallet. Make sure you are on the correct network.");
        }
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
      setTokenDecimals({chad: 18, mon: 18});
  }, []);
  
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
      
      // 1. Check CHAD allowance and approve if necessary
      const currentChadAllowance = await chadTokenContract.allowance(address, CHADFLIP_CONTRACT_ADDRESS);
      if (currentChadAllowance < amount) {
        setBettingStep('approving_chad');
        const approveTx = await chadTokenContract.approve(CHADFLIP_CONTRACT_ADDRESS, amount);
        await approveTx.wait();
      }

      // 2. Check MON allowance and approve if necessary for leverage
      if (bet.leverage > 1) {
          const collateralNeeded = ethers.parseUnits((bet.amount * (bet.leverage - 1)).toString(), tokenDecimals.mon);
          const currentMonAllowance = await monTokenContract.allowance(address, CHADFLIP_CONTRACT_ADDRESS);
          if (currentMonAllowance < collateralNeeded) {
            setBettingStep('approving_mon');
            const approveMonTx = await monTokenContract.approve(CHADFLIP_CONTRACT_ADDRESS, collateralNeeded);
            await approveMonTx.wait();
          }
      }
      
      // 3. Place the actual bet
      setBettingStep('placing_bet');
      const predictionUp = bet.direction === 'UP';
      const tx = await chadFlipContract.placeBet(
        CHAD_TOKEN_ADDRESS,
        amount,
        bet.leverage,
        predictionUp
      );
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
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          disconnect();
          setError("Account changed. Please reconnect your wallet.");
        } else {
          disconnect();
        }
      };
      const handleChainChanged = () => {
        disconnect();
        setError("Network changed. Please reconnect your wallet.");
      };
      
      rawProvider.on('accountsChanged', handleAccountsChanged);
      rawProvider.on('chainChanged', handleChainChanged);

      return () => {
        if (rawProvider.removeListener) {
            rawProvider.removeListener('accountsChanged', handleAccountsChanged);
            rawProvider.removeListener('chainChanged', handleChainChanged);
        }
      }
    }
  }, [rawProvider, disconnect]);

  return { connectWallet, disconnect, address, balances, dailyLimit, placeBet, loading, error, refreshData, bettingStep, setBettingStep };
};

export default useWeb3;
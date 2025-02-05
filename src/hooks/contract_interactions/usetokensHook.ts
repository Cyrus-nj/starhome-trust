import { useState, useCallback, useRef } from "react";
import {
  useContract,
  useAccount,
  useSendTransaction,
} from "@starknet-react/core";
import { rpcProvideUr, starhomesContract } from "@/utils/constants";
import { universalErc20Abi } from "@/data/universalTokenabi";
import { RpcProvider } from 'starknet';
import { saveTokenData, getTokenData } from "@/utils/indexedDb";

export const useToken = (tokenAddress: string) => {
  const provider = new RpcProvider({ nodeUrl: `${rpcProvideUr}` });
  const { address: owner } = useAccount();
  const spender = starhomesContract;
  const formattedTokenAddress = tokenAddress as `0x${string}`;
  const formattedOwner = owner;
  const formattedSpender = spender;
  const fetchInProgress = useRef(false);

  const { contract } = useContract({
    abi: universalErc20Abi,
    address: formattedTokenAddress,
    provider: provider,
  });

  const [tokenData, setTokenData] = useState<{
    name: string | null;
    symbol: string | null;
    decimals: number | null;
    balance: string | null;
    allowance: string | null;
  }>({
    name: null,
    symbol: null,
    decimals: null,
    balance: null,
    allowance: null,
  });

  const fetchAndCacheTokenData = useCallback(async () => {
    if (!contract || !formattedOwner || fetchInProgress.current) return;

    try {
      fetchInProgress.current = true;
      console.log('Fetching token data for:', {
        tokenAddress: formattedTokenAddress,
        ownerAddress: formattedOwner
      });

      // First check cache
      const cachedData = await getTokenData(formattedTokenAddress, formattedOwner);
      
      if (cachedData && Date.now() - cachedData.timestamp < 5 * 60 * 1000) { // 5 minutes cache
        console.log('Using cached token data:', cachedData);
        setTokenData({
          name: cachedData.name,
          symbol: cachedData.symbol,
          decimals: cachedData.decimals,
          balance: cachedData.balance,
          allowance: cachedData.allowance,
        });
        return;
      }

      // If no cache or expired, fetch fresh data
      const [name, symbol, decimals, balance, allowance] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.balance_of(formattedOwner),
        contract.allowance(formattedOwner, formattedSpender),
      ]);

      const newData = {
        name: name.toString(),
        symbol: symbol.toString(),
        decimals: Number(decimals),
        balance: balance.toString(),
        allowance: allowance.toString(),
      };

      // Save to cache
      await saveTokenData(formattedTokenAddress, formattedOwner, newData);
      
      setTokenData(newData);
      console.log('Fetched and cached new token data:', newData);
    } catch (error) {
      console.error('Error fetching token data:', error);
    } finally {
      fetchInProgress.current = false;
    }
  }, [contract, formattedOwner, formattedSpender, formattedTokenAddress]);

  const { sendAsync: sendTransaction } = useSendTransaction({});

  const approveAndInvest = useCallback(
    async (
      amount: number,
      investmentId: string,
      investCallback: (id: string, amountInTokenUnits: number) => Promise<any>
    ) => {
      if (!contract || !formattedOwner) {
        throw new Error('Contract or owner not initialized');
      }

      try {
        // Force refresh token data before investment
        await fetchAndCacheTokenData();
        
        const tokenDecimals = tokenData.decimals || 18;
        const amountInToken = BigInt(amount * Math.pow(10, tokenDecimals));
        const currentAllowance = tokenData.allowance ? BigInt(tokenData.allowance) : BigInt(0);
        const currentBalance = tokenData.balance ? BigInt(tokenData.balance) : BigInt(0);

        if (currentBalance < amountInToken) {
          throw new Error('Insufficient balance');
        }

        if (currentAllowance >= amountInToken) {
          await investCallback(investmentId, Number(amountInToken));
          return;
        }

        const additionalAllowance = amountInToken - currentAllowance;
        const increaseAllowanceCall = await contract.populate('increase_allowance', [
          formattedSpender,
          additionalAllowance
        ]);
        const approveCall = await contract.populate('approve', [
          formattedSpender, 
          amountInToken
        ]);

        const tx = await sendTransaction([increaseAllowanceCall, approveCall]);
        console.log('Transaction completed:', tx);
        
        // Refresh token data after approval
        await fetchAndCacheTokenData();
        
        await investCallback(investmentId, Number(amountInToken));
      } catch (error) {
        console.error('Error in approveAndInvest:', error);
        throw error;
      }
    },
    [contract, formattedOwner, formattedSpender, sendTransaction, tokenData, fetchAndCacheTokenData]
  );

  return {
    ...tokenData,
    approveAndInvest,
    allowance: tokenData.allowance,
    refreshTokenData: fetchAndCacheTokenData
  };
};
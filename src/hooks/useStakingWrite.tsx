import { useContract, useSendTransaction } from "@starknet-react/core";
import { STAKING_CONTRACT_ADDRESS } from "./useStakingContract";
import abi from "../data/abi";
import { toast } from "sonner";

export function useStakingWrite() {
  const { contract } = useContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi
  });

  const { send: sendStake, isPending: isStakePending } = useSendTransaction({
    calls: contract ? [] : undefined
  });

  const { send: sendWithdraw, isPending: isWithdrawPending } = useSendTransaction({
    calls: contract ? [] : undefined
  });

  const { send: sendClaimRewards, isPending: isClaimRewardsPending } = useSendTransaction({
    calls: contract ? [] : undefined
  });

  const stake = async (amount: bigint) => {
    console.log("Staking amount:", amount);
    if (!contract) {
      console.error("Contract not initialized");
      return;
    }

    try {
      await sendStake([
        contract.populate("stake", [amount])
      ]);
      toast.success("Stake transaction sent successfully");
    } catch (error) {
      console.error("Staking error:", error);
      toast.error("Failed to stake tokens");
      throw error;
    }
  };

  const withdraw = async (amount: bigint) => {
    console.log("Withdrawing amount:", amount);
    if (!contract) {
      console.error("Contract not initialized");
      return;
    }

    try {
      await sendWithdraw([
        contract.populate("withdraw", [amount])
      ]);
      toast.success("Withdrawal transaction sent successfully");
    } catch (error) {
      console.error("Withdrawal error:", error);
      toast.error("Failed to withdraw tokens");
      throw error;
    }
  };

  const claimRewards = async () => {
    console.log("Claiming rewards");
    if (!contract) {
      console.error("Contract not initialized");
      return;
    }

    try {
      await sendClaimRewards([
        contract.populate("claim_rewards", [])
      ]);
      toast.success("Claim rewards transaction sent successfully");
    } catch (error) {
      console.error("Claim rewards error:", error);
      toast.error("Failed to claim rewards");
      throw error;
    }
  };

  return {
    stake,
    withdraw,
    claimRewards,
    isStakePending,
    isWithdrawPending,
    isClaimRewardsPending,
    loading: isStakePending || isWithdrawPending || isClaimRewardsPending
  };
}
import React, { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InvestmentAsset } from "@/types/investment";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { tokenOptions } from "@/utils/constants";

interface FinancialDetailsProps {
  formData: Partial<InvestmentAsset>;
  handleInputChange: (field: keyof InvestmentAsset, value: any) => void;
}

const FinancialDetails: React.FC<FinancialDetailsProps> = ({
  formData,
  handleInputChange,
}) => {
  // Update Available Staking Amount when Asset Value changes
  useEffect(() => {
    // if (formData.available_staking_amount) {
    //   return;
    // }
    if (formData.asset_value) {
      handleInputChange("available_staking_amount", formData.asset_value);
    }
  }, [
    formData.asset_value,
    formData.available_staking_amount,
    formData.investment_token,
    handleInputChange,
  ]);

  const handleNonNegativeInput = (
    field: keyof InvestmentAsset,
    value: string
  ) => {
    const numValue = Number(value);
    if (numValue < 0) {
      toast.error(`${field} cannot be negative`);
      return;
    }
    handleInputChange(field, value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
      <div className="space-y-2">
        <Label>Asset Value</Label>
        <Input
          type="number"
          required
          min="0"
          value={formData.asset_value || ""}
          onChange={(e) =>
            handleNonNegativeInput("asset_value", e.target.value)
          }
          placeholder="Enter asset value"
        />
      </div>

      <div className="space-y-2">
        <Label>Available Staking Amount</Label>
        <Input
          type="number"
          required
          value={formData.available_staking_amount || ""}
          disabled
          placeholder="Same as Asset Value"
          className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
        />
      </div>

      <div className="space-y-2">
        <Label>Minimum Investment</Label>
        <Input
          type="number"
          required
          min="0"
          value={formData.min_investment_amount || ""}
          onChange={(e) =>
            handleNonNegativeInput("min_investment_amount", e.target.value)
          }
          placeholder="Enter minimum investment amount"
        />
      </div>

      <div className="space-y-2">
        <Label>Expected ROI (%)</Label>
        <Input
          type="number"
          required
          min="0"
          step="0.01"
          value={formData.expected_roi || ""}
          onChange={(e) =>
            handleNonNegativeInput("expected_roi", e.target.value)
          }
          placeholder="Enter expected ROI percentage"
        />
      </div>

      <div className="space-y-2">
        <Label>Annual Rental Income</Label>
        <Input
          type="number"
          required
          min="0"
          value={formData.rental_income || ""}
          onChange={(e) =>
            handleNonNegativeInput("rental_income", e.target.value)
          }
          placeholder="Enter annual rental income"
        />
      </div>
      <div className="space-y-2">
        <Label>Investment token</Label>
        <Select
          value={formData.investment_token}
          onValueChange={(value) =>
            handleInputChange("investment_token", value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select token" />
          </SelectTrigger>
          <SelectContent>
            {tokenOptions.map((token) => (
              <SelectItem key={token.symbol} value={token.address}>
                {token.symbol}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Annual Maintenance Costs</Label>
        <Input
          type="number"
          required
          min="0"
          value={formData.maintenance_costs || ""}
          onChange={(e) =>
            handleNonNegativeInput("maintenance_costs", e.target.value)
          }
          placeholder="Enter annual maintenance costs"
        />
      </div>
    </div>
  );
};

export default FinancialDetails;

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarketAnalysis as MarketAnalysisType } from "@/types/starknet_types/investment";

interface MarketAnalysisProps {
  marketAnalysis: Partial<MarketAnalysisType>;
  handleMarketAnalysisChange: (
    field: keyof MarketAnalysisType,
    value: string
  ) => void;
}

const MarketAnalysis: React.FC<MarketAnalysisProps> = ({
  marketAnalysis,
  handleMarketAnalysisChange,
}) => {
  return (
    <div className="bg-gray-50 p-6 rounded-lg animate-fade-in">
      <h3 className="text-lg font-semibold mb-4">Market Analysis</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Area Growth Rate (%)</Label>
          <Input
            required
            value={marketAnalysis?.area_growth || ""}
            onChange={(e) =>
              handleMarketAnalysisChange("area_growth", e.target.value)
            }
            placeholder="Annual area growth rate"
          />
        </div>

        <div className="space-y-2">
          <Label>Occupancy Rate (%)</Label>
          <Input
            required
            value={marketAnalysis?.occupancy_rate || ""}
            onChange={(e) =>
              handleMarketAnalysisChange("occupancy_rate", e.target.value)
            }
            placeholder="Current occupancy rate"
          />
        </div>

        <div className="space-y-2">
          <Label>Comparable Properties</Label>
          <Input
            required
            value={marketAnalysis?.comparable_properties || ""}
            onChange={(e) =>
              handleMarketAnalysisChange(
                "comparable_properties",
                e.target.value
              )
            }
            placeholder="Similar properties in the area"
          />
        </div>

        <div className="space-y-2">
          <Label>Demand Trend</Label>
          <Input
            required
            value={marketAnalysis?.demand_trend || ""}
            onChange={(e) =>
              handleMarketAnalysisChange("demand_trend", e.target.value)
            }
            placeholder="Current market demand trend"
          />
        </div>
      </div>
    </div>
  );
};

export default MarketAnalysis;
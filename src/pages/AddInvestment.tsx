/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { useAccount } from "@starknet-react/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { PinataSDK } from "pinata-web3";

import BasicInformation from "@/components/investment/BasicInformation";
import FinancialDetails from "@/components/investment/FinancialDetails";
import FileUploadSection from "@/components/investment/FileUploadSection";
import BulletPointInput from "@/components/investment/BulletPointInput";
import { InvestmentAsset, MarketAnalysis } from "@/types/investment";
import { usePropertyCreate } from "@/hooks/contract_interactions/usePropertyWrite";

// Initialize Pinata SDK
const pinata = new PinataSDK({
  pinataJwt: import.meta.env.VITE_PINATA_JWT,
  pinataGateway: import.meta.env.VITE_PINATA_GATEWAY || "gateway.pinata.cloud",
});

const AddInvestment = () => {
  const { address } = useAccount();
  const { handleListInvestmentProperty, contractStatus } = usePropertyCreate();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState(0);
  const [uploadedSize, setUploadedSize] = useState(0);
  const [totalUploadSize, setTotalUploadSize] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // State for bullet points
  const [additionalFeatures, setAdditionalFeatures] = useState<string[]>([]);
  const [riskFactors, setRiskFactors] = useState<string[]>([]);
  const [highlights, setHighlights] = useState<string[]>([]);

  const generateShortUUID = () => {
    const fullUUID = crypto.randomUUID();
    return fullUUID.replace(/-/g, "").substring(0, 21);
  };

  const [formData, setFormData] = useState<Partial<InvestmentAsset>>({
    id: generateShortUUID(),
    owner: address,
    investorId: address, // Changed from investor_id to investorId
    isActive: true,
    investmentToken: "",
    marketAnalysis: {
      areaGrowth: "",
      occupancyRate: "",
      comparableProperties: "",
      demandTrend: "",
    },
    legalDetails: {
      ownership: "",
      zoning: "",
      permits: "",
      documentsId: "",
    },
  });

  const handleInputChange = (field: keyof InvestmentAsset, value: any) => {
    if (
      [
        "asset_value",
        "property_price",
        "rental_income",
        "maintenance_costs",
        "min_investment_amount",
        "available_staking_amount",
      ].includes(field)
    ) {
      value = BigInt(value || 0);
    } else if (field === "constructionYear") {
      value = Number(value || 0);
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleMarketAnalysisChange = (
    field: keyof MarketAnalysis,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      market_analysis: {
        ...prev.marketAnalysis!,
        [field]: value,
      },
    }));
  };

  const validateFiles = (files: File[], isDocument: boolean = false) => {
    const maxSize = isDocument ? 20 * 1024 * 1024 : 10 * 1024 * 1024;

    return files.filter((file) => {
      if (isDocument) {
        if (
          ![
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          ].includes(file.type)
        ) {
          toast.error(`${file.name} is not a valid document type`);
          return false;
        }
      } else if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }

      if (file.size > maxSize) {
        toast.error(
          `${file.name} is too large (max ${maxSize / 1024 / 1024}MB)`
        );
        return false;
      }
      return true;
    });
  };

  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
    isDocument: boolean = false
  ) => {
    const files = event.target.files;
    if (!files) return;

    const validFiles = validateFiles(Array.from(files), isDocument);
    if (isDocument) {
      setSelectedDocs((prev) => [...prev, ...validFiles]);
    } else {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    isDocument: boolean = false
  ) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files) return;

    const validFiles = validateFiles(Array.from(files), isDocument);
    if (isDocument) {
      setSelectedDocs((prev) => [...prev, ...validFiles]);
    } else {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const handleUpload = async (files: File[], isDocuments: boolean = false) => {
    const totalSize = files.reduce((acc, file) => acc + file.size, 0);
    setTotalUploadSize((prev) => prev + totalSize);

    try {
      const upload = await pinata.upload.fileArray(files).addMetadata({
        name: `investment-${formData.id}-${isDocuments ? "docs" : "images"}`,
        keyValues: {
          type: isDocuments ? "documents" : "images",
          propertyId: formData.id,
          uploadDate: new Date().toISOString(),
        },
      });

      const ipfsUrl = await pinata.gateways.convert(upload.IpfsHash);

      if (isDocuments) {
        handleInputChange("legalDetails", {
          ...formData.legalDetails,
          documents_id: ipfsUrl,
        });
      } else {
        handleInputChange("images", ipfsUrl);
      }

      toast.success(
        `${isDocuments ? "Documents" : "Images"} uploaded successfully!`
      );
      return ipfsUrl;
    } catch (error) {
      console.error(
        `Error uploading ${isDocuments ? "documents" : "images"}:`,
        error
      );
      toast.error(`Failed to upload ${isDocuments ? "documents" : "images"}`);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      // Convert bullet points to strings
      const updatedFormData = {
        ...formData,
        additionalFeatures: additionalFeatures.join("\n"),
        riskFactors: riskFactors.join("\n"),
        highlights: highlights.join("\n"),
      };

      const status = await handleListInvestmentProperty(updatedFormData);

      if (status.status === "success") {
        toast.success("Investment created successfully!");
        setSelectedFiles([]);
        setSelectedDocs([]);
        setUploadProgress(0);
        setUploadedFiles(0);
        setUploadedSize(0);
        setTotalUploadSize(0);
      }
    } catch (error) {
      console.error("Error creating investment:", error);
      toast.error("Failed to create investment");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-24">
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Create New Investment Property</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <BasicInformation
                formData={formData}
                handleInputChange={handleInputChange}
              />
              <FinancialDetails
                formData={formData}
                handleInputChange={handleInputChange}
              />
              
              {/* Grid layout for file upload sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FileUploadSection
                  selectedFiles={selectedFiles}
                  selectedDocs={[]}
                  isUploading={isUploading}
                  uploadProgress={uploadProgress}
                  uploadedFiles={uploadedFiles}
                  uploadedSize={uploadedSize}
                  totalUploadSize={totalUploadSize}
                  handleFileSelect={handleFileSelect}
                  handleDrop={handleDrop}
                  setSelectedFiles={setSelectedFiles}
                  setSelectedDocs={setSelectedDocs}
                  setPreviewUrl={setPreviewUrl}
                  setShowPreviewModal={setShowPreviewModal}
                  type="images"
                />
                <FileUploadSection
                  selectedFiles={[]}
                  selectedDocs={selectedDocs}
                  isUploading={isUploading}
                  uploadProgress={uploadProgress}
                  uploadedFiles={uploadedFiles}
                  uploadedSize={uploadedSize}
                  totalUploadSize={totalUploadSize}
                  handleFileSelect={handleFileSelect}
                  handleDrop={handleDrop}
                  setSelectedFiles={setSelectedFiles}
                  setSelectedDocs={setSelectedDocs}
                  setPreviewUrl={setPreviewUrl}
                  setShowPreviewModal={setShowPreviewModal}
                  type="documents"
                />
              </div>

              {/* Grid layout for bullet points */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <BulletPointInput
                  label="Highlights"
                  points={highlights}
                  onChange={setHighlights}
                />
                <BulletPointInput
                  label="Risk Factors"
                  points={riskFactors}
                  onChange={setRiskFactors}
                />
                <BulletPointInput
                  label="Additional Features"
                  points={additionalFeatures}
                  onChange={setAdditionalFeatures}
                />
              </div>

              <Button
                type="submit"
                disabled={isUploading}
                className="w-full animate-fade-in"
              >
                {isUploading ? "Creating Investment..." : "Create Investment"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in">
          <div className="bg-white rounded-lg p-4 w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Document Preview</h3>
              <button
                type="button"
                onClick={() => {
                  setShowPreviewModal(false);
                  setPreviewUrl(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <iframe
                src={previewUrl}
                className="w-full h-full min-h-[60vh]"
                title="Document Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddInvestment;
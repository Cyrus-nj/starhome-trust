import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { useUserWrite } from "@/hooks/contract_interactions/useUserWrite";
import { toast } from "sonner";
import { User, Loader2 } from "lucide-react";
import { useAccount, useTransactionReceipt } from "@starknet-react/core";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserReadByAddress } from "@/hooks/contract_interactions/useUserRead";
import { User as UserType } from "@/types/user";
import pinata from "@/hooks/services_hooks/pinata";
import { Switch } from "@/components/ui/switch";
import { useTransactionStatus } from "@/hooks/useTransactionStatus";
import { TransactionWidget } from "../txmodal";
import ImageUploader from "../property/form/ImageUploader";
import { ProfileImageUploader } from "./profileUploader";
import { useWalletConnect } from "@/hooks/useWalletConnect";

export function UserRegistrationModal() {
  const { address } = useAccount();
  const { connectWallet, isConnecting, error } = useWalletConnect();
  const { handleRegisterUser, handleEditUser, contractStatus } = useUserWrite();
  const { user: currentUser, isLoading: isLoadingUser } = useUserReadByAddress(
    address || ""
  );
  const {
    isChecking,
    checkTransaction,
    status: txStatus,
  } = useTransactionStatus();

  const [formData, setFormData] = useState<Partial<UserType>>({
    name: "",
    email: "",
    phone: "",
    profile_image: "",
    is_verified: false,
    is_authorized: false,
    is_agent: false,
    is_investor: false,
  });
  const [uploadLoading, setUploadLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [ipfsHash, setIpfsHash] = useState("");
  const [isUserRegistered, setIsUserRegistered] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File>();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [tx, setTx] = useState<string>("");
  const { data, error: txError } = useTransactionReceipt({
    hash: tx,
    watch: true,
    enabled: true,
    retry: 9000,
  });
  useEffect(() => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }
  }, [address]);

  useEffect(() => {
    const isUnregistered = (userData: any) => {
      return (
        !userData ||
        userData.name === "0" ||
        userData.name === 0 ||
        userData.name === "" ||
        userData.phone === "0" ||
        userData.phone === 0 ||
        userData.phone === "" ||
        userData.email === "0" ||
        userData.email === 0 ||
        userData.email === ""
      );
    };

    if (currentUser && !isLoadingUser) {
      const unregistered = isUnregistered(currentUser);
      setIsUserRegistered(!unregistered);

      if (!unregistered) {
        setFormData({
          name: currentUser.name,
          email: currentUser.email,
          phone: currentUser.phone,
          profile_image: currentUser.profile_image,
          is_verified: currentUser.is_verified,
          is_agent: currentUser.is_agent,
          is_investor: currentUser.is_investor,
        });
        if (currentUser.profile_image) {
          setIpfsHash(currentUser.profile_image);
        }
      }
    }
  }, [currentUser, isLoadingUser]);

  const validateForm = () => {
    if (!formData.name?.trim()) {
      toast.error("Name is required");
      return false;
    }
    if (
      !formData.email?.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      toast.error("Valid email is required");
      return false;
    }
    if (!formData.phone?.trim() || !/^\+?[\d\s-]{10,}$/.test(formData.phone)) {
      toast.error("Valid phone number is required");
      return false;
    }
    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = async () => {
    if (!selectedFile) return;

    if (ipfsHash) {
      toast.error(
        "Image Already Uploaded. Please submit the form or reset to upload a new image"
      );
      return;
    }

    try {
      setUploadLoading(true);
      // const file = e.target.files[0];
      const file = selectedFile;
      const upload = await pinata.upload.file(file);
      const ipfsUrl = await pinata.gateways.convert(upload.IpfsHash);
      setIpfsHash(ipfsUrl);

      console.log("ipfs url", ipfsUrl);
      console.log("setted ipfs url", ipfsHash);

      // setFormData((prev) => ({
      //   ...prev,
      //   profile_image: ipfsUrl,
      // }));

      toast.success("Image uploaded successfully");
      return ipfsUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setUploadLoading(false);
    }
  };

  const validateFile = (file: File): File | null => {
    if (!file.type.startsWith("image/")) {
      toast.error(`${file.name} is not an image file`);
      return null;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(`${file.name} is too large (max 10MB)`);
      return null;
    }

    return file;
  };
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIpfsHash("");

    const validatedFile = validateFile(file);
    if (validatedFile) {
      setSelectedFile(validatedFile);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const validatedFile = validateFile(file);
    if (validatedFile) {
      setSelectedFile(validatedFile);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      connectWallet();
      toast.error("Please connect your wallet first");
      return;
    }

    if (!validateForm() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const imageUrl = await handleImageUpload();
      setIpfsHash(imageUrl);

      console.log(`availbe ipfs url ${ipfsHash}`);
      const userData = {
        ...formData,
        id: address,
        profile_image: !formData.profile_image
          ? imageUrl
          : formData.profile_image,

        timestamp: Math.floor(Date.now() / 1000),
      };

      console.log(`sending user data ${userData}`);
      const response = isUserRegistered
        ? await handleEditUser(userData)
        : await handleRegisterUser(userData);
      await setTx(response.transaction_hash);

      const tx = await checkTransaction(response.transaction_hash);

      if (tx.isSuccess) {
        toast.success(
          isUserRegistered
            ? "Profile updated successfully!"
            : "Registration successful!"
        );
        if (data.isSuccess) {
          window.location.reload();
          setIsOpen(false);
        }
        // setIsOpen(false);
        // // Force reload the page and show shimmer while data is being fetched
        // window.location.reload();
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(
        isUserRegistered ? "Failed to update profile" : "Failed to register"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      profile_image: "",
      is_verified: false,
      is_agent: false,
      is_investor: false,
    });
    setIpfsHash("");
    setSelectedFile(undefined);
  };

  const handleSwitchChange = (
    type: "agent" | "investor" | "authorized" | "verified",
    checked: boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      is_agent: type === "agent" ? checked : prev.is_agent,
      is_investor: type === "investor" ? checked : prev.is_investor,
      is_authorized: type === "authorized" ? checked : prev.is_authorized,
      is_verified: type === "verified" ? checked : prev.is_verified,
    }));
    console.log(`${type} switch changed to:`, checked);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full text-xs sm:text-sm h-8 sm:h-10 flex items-center gap-2"
        >
          <User className="w-4 h-4" />
          {isUserRegistered ? "Update Profile" : "Create Account"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isUserRegistered ? "Update Profile" : "Create New Account"}
          </DialogTitle>
          <DialogDescription>
            {isUserRegistered
              ? "Update your profile information below."
              : "Fill in your details to create a new account."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name || ""}
              onChange={handleInputChange}
              placeholder="Enter your name"
              required
              disabled={!address || isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email || ""}
              onChange={handleInputChange}
              placeholder="Enter your email"
              required
              disabled={!address || isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone || ""}
              onChange={handleInputChange}
              placeholder="Enter your phone number"
              required
              disabled={!address || isSubmitting}
            />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="agent-switch">Register as Agent</Label>
              <Switch
                id="agent-switch"
                checked={formData.is_agent}
                onCheckedChange={(checked) =>
                  handleSwitchChange("agent", checked)
                }
                disabled={!address || isSubmitting}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="investor-switch">Register as Investor</Label>
              <Switch
                id="investor-switch"
                checked={formData.is_investor}
                onCheckedChange={(checked) =>
                  handleSwitchChange("investor", checked)
                }
                disabled={!address || isSubmitting}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="User-authorization">Verified user </Label>
              <Switch
                id="authorization-switch"
                checked={formData.is_authorized}
                onCheckedChange={(checked) =>
                  handleSwitchChange("authorized", checked)
                }
                disabled={!address || isSubmitting}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="User-authorization">
                Be an Authorize asset lister
              </Label>
              <Switch
                id="investor-switch"
                checked={formData.is_verified}
                onCheckedChange={(checked) =>
                  handleSwitchChange("verified", checked)
                }
                disabled={!address || isSubmitting}
              />
            </div>
          </div>
          <div className="">
            {/* <Label htmlFor="profile_image">Profile Image</Label> */}
            {/* <Input
              id="profile_image"
              name="profile_image"
              type="file"
              onChange={handleImageUpload}
              accept="image/*"
              className="file:mr-2 file:my-2 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-primary/10"
              disabled={!address || isSubmitting || Boolean(ipfsHash)}
            /> */}
            <ProfileImageUploader
              selectedFile={selectedFile}
              isUploading={uploadLoading}
              uploadProgress={uploadProgress}
              handleFileSelect={handleFileSelect}
              handleDrop={handleDrop}
              setSelectedFile={setSelectedFile}
            />
            {formData.profile_image && (
              <img
                src={formData.profile_image}
                alt="Profile preview"
                className="mt-2 w-24 h-24 rounded-full object-cover"
              />
            )}
          </div>
          {tx === "" ? <></> : <TransactionWidget hash={tx} />}

          <div className="flex gap-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={
                isConnecting || isSubmitting || uploadLoading || isChecking
              }
            >
              {(isSubmitting || uploadLoading) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {uploadLoading
                ? "Uploading Image"
                : !address
                ? "Connect Wallet"
                : isUserRegistered
                ? "Update Profile"
                : "Create Account"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              disabled={isSubmitting || uploadLoading}
            >
              Reset
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

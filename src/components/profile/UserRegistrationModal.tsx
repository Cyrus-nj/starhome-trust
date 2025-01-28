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
import { useAccount } from "@starknet-react/core";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserReadByAddress } from "@/hooks/contract_interactions/useUserRead";
import { User as UserType } from "@/types/user";
import pinata from "@/hooks/services_hooks/pinata";

export function UserRegistrationModal() {
  const { address } = useAccount();
  const { handleRegisterUser, contractStatus } = useUserWrite();
  const { user: currentUser, isLoading: isLoadingUser } = useUserReadByAddress(address || "");
  
  const [formData, setFormData] = useState<Partial<UserType>>({
    name: "",
    email: "",
    phone: "",
    profile_image: "",
    is_verified: false,
    is_agent: false,
    is_investor: false,
  });
  const [uploadLoading, setUploadLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [ipfsHash, setIpfsHash] = useState("");

  const isUserRegistered = currentUser && currentUser.name && currentUser.phone && currentUser.email;

  useEffect(() => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }
  }, [address]);

  useEffect(() => {
    if (isUserRegistered) {
      console.log("Pre-filling user data:", currentUser);
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
    } else {
      console.log("No user data to pre-fill");
      setFormData({
        name: "",
        email: "",
        phone: "",
        profile_image: "",
        is_verified: false,
        is_agent: false,
        is_investor: false,
      });
    }
  }, [currentUser, isUserRegistered]);

  const validateForm = () => {
    if (!formData.name?.trim()) {
      toast.error("Name is required");
      return false;
    }
    if (!formData.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    if (ipfsHash) {
      toast.error("Image Already Uploaded. Please submit the form or reset to upload a new image");
      return;
    }

    try {
      setUploadLoading(true);
      const file = e.target.files[0];
      const upload = await pinata.upload.file(file);
      const ipfsUrl = await pinata.gateways.convert(upload.IpfsHash);

      setFormData((prev) => ({
        ...prev,
        profile_image: ipfsUrl,
      }));
      setIpfsHash(upload.IpfsHash);

      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!validateForm() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      console.log("Current form data:", formData);
      const userData = {
        ...formData,
        id: address,
        profile_image: formData.profile_image || "",
        is_verified: false,
        is_authorized: false,
        timestamp: Math.floor(Date.now() / 1000),
      };

      console.log("Submitting user data:", userData);
      
      const response = await handleRegisterUser(userData);
      
      if (response.status === "success") {
        toast.success(isUserRegistered ? "Profile updated successfully!" : "Registration successful!");
        setIsOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(isUserRegistered ? "Failed to update profile" : "Failed to register");
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
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full text-xs sm:text-sm h-8 sm:h-10 flex items-center gap-2">
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
              value={formData.name || ''}
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
              value={formData.email || ''}
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
              value={formData.phone || ''}
              onChange={handleInputChange}
              placeholder="Enter your phone number"
              required
              disabled={!address || isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile_image">Profile Image</Label>
            <Input
              id="profile_image"
              name="profile_image"
              type="file"
              onChange={handleImageUpload}
              accept="image/*"
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-primary/10"
              disabled={!address || isSubmitting || Boolean(ipfsHash)}
            />
            {formData.profile_image && (
              <img
                src={formData.profile_image}
                alt="Profile preview"
                className="mt-2 w-24 h-24 rounded-full object-cover"
              />
            )}
          </div>
          <div className="flex gap-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={!address || isSubmitting || uploadLoading}
            >
              {(isSubmitting || uploadLoading) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {uploadLoading ? (
                "Uploading Image"
              ) : !address ? (
                "Connect Wallet"
              ) : isUserRegistered ? (
                "Update Profile"
              ) : (
                "Create Account"
              )}
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
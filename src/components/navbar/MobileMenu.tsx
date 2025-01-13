import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import NavigationLinks from "./NavigationLinks";
import WalletDropdown from "./WalletDropdown";

interface MobileMenuProps {
  isOpen: boolean;
  toggleMenu: () => void;
  navigation: Array<{ label: string; href: string; isPage?: boolean }>;
  address: string | undefined;
  handleGoogleSignIn: () => void;
  handleConnectWallet: () => void;
  handleDisconnect: () => void;
}

const MobileMenu = ({
  isOpen,
  toggleMenu,
  navigation,
  address,
  handleGoogleSignIn,
  handleConnectWallet,
  handleDisconnect,
}: MobileMenuProps) => {
  return (
    <>
      <div className="md:hidden">
        <Button variant="ghost" size="icon" onClick={toggleMenu}>
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black" onClick={toggleMenu} />
          <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl">
            <div className="flex flex-col space-y-4 p-6">
              <NavigationLinks
                items={navigation}
                className="text-gray-600 hover:text-gray-900 border border-transparent hover:border-gray-200 px-3 py-2 rounded-md block"
                onClick={() => toggleMenu()}
              />
              <WalletDropdown
                address={address}
                handleGoogleSignIn={handleGoogleSignIn}
                handleConnectWallet={handleConnectWallet}
                handleDisconnect={handleDisconnect}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileMenu;
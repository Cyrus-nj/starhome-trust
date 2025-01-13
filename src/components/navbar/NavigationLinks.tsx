import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationItem {
  label: string;
  href: string;
  isPage?: boolean;
}

interface NavigationLinksProps {
  items: NavigationItem[];
  className?: string;
  onClick?: () => void;
}

const NavigationLinks = ({ items, className, onClick }: NavigationLinksProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleAnchorClick = async (href: string) => {
    console.log("Handling anchor click for:", href);
    
    const sectionId = href.split('#')[1];
    
    const scrollToSection = () => {
      console.log("Attempting to scroll to section:", sectionId);
      const element = document.getElementById(sectionId);
      if (element) {
        console.log("Found element, scrolling into view");
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      } else {
        console.log("Element not found:", sectionId);
      }
    };

    if (location.pathname !== '/') {
      console.log("Not on home page, navigating home first");
      navigate('/');
      // Wait for navigation and component mount
      setTimeout(scrollToSection, 300);
    } else {
      console.log("Already on home page, scrolling directly");
      scrollToSection();
    }

    if (onClick) {
      onClick();
    }
  };

  return (
    <div className="flex items-center space-x-6">
      {items.map((item) => {
        const isActive = location.pathname === item.href || 
                        (item.href.startsWith("/#") && location.pathname === "/");
        
        const linkContent = (
          <div className="flex items-center gap-1 group">
            <span>{item.label}</span>
            {item.isPage && (
              <ChevronDown 
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isActive ? "text-primary rotate-180" : "text-gray-400 group-hover:text-gray-600"
                )}
              />
            )}
          </div>
        );

        const linkStyles = item.isPage
          ? cn(
              className,
              "relative px-4 py-2 rounded-md border-2",
              isActive ? "border-primary text-primary" : "border-transparent",
              "transition-all duration-300"
            )
          : cn(
              className,
              "relative px-4 py-2 rounded-md border-2 border-transparent",
              "transition-all duration-300",
              "hover:border-primary hover:animate-pulse"
            );

        return item.isPage ? (
          <Link
            key={item.label}
            to={item.href}
            className={linkStyles}
            onClick={onClick}
          >
            {linkContent}
          </Link>
        ) : (
          <button
            key={item.label}
            className={linkStyles}
            onClick={() => handleAnchorClick(item.href)}
          >
            {linkContent}
          </button>
        );
      })}
    </div>
  );
};

export default NavigationLinks;
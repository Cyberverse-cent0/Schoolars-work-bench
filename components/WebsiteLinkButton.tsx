import { ExternalLink, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WebsiteLinkButtonProps {
  websiteUrl?: string;
  className?: string;
}

export default function WebsiteLinkButton({ 
  websiteUrl = process.env.WEBSITE_URL || "http://localhost:5173",
  className = ""
}: WebsiteLinkButtonProps) {
  const handleWebsiteClick = () => {
    window.open(websiteUrl, '_blank');
  };

  return (
    <Button 
      onClick={handleWebsiteClick}
      className={`flex items-center gap-2 ${className}`}
      variant="outline"
    >
      <Globe className="w-4 h-4" />
      <span>Visit Website</span>
      <ExternalLink className="w-4 h-4" />
    </Button>
  );
}

import { useState, useRef } from "react";
import { Camera, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/hooks/useApi";
import { ImageCropModal } from "@/components/ImageCropModal";
import { useAuth } from "@/contexts/AuthContext";

interface ProfilePictureUploadProps {
  currentImage?: string | null;
  onImageUpdate: (imageUrl: string) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ProfilePictureUpload({ 
  currentImage, 
  onImageUpdate, 
  size = "md",
  className = ""
}: ProfilePictureUploadProps) {
  const { token } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-20 h-20 text-lg"
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setSelectedFile(file);
    setShowCropModal(true);
    setError("");
  };

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    setUploading(true);
    setError("");

    try {
      // Convert blob to file for upload
      const croppedFile = new File([croppedImageBlob], "profile-picture.jpg", {
        type: "image/jpeg",
      });

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("file", croppedFile);

      // Upload the cropped image
      const response = await fetch("/api/upload/profile-picture", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to upload profile picture");
      }

      const { profilePictureUrl } = await response.json();
      // Add cache-busting timestamp to prevent caching issues
      const imageUrlWithTimestamp = `${profilePictureUrl}?t=${Date.now()}`;
      onImageUpdate(imageUrlWithTimestamp);
    } catch (err: any) {
      setError(err.message || "Failed to upload profile picture");
    } finally {
      setUploading(false);
      setSelectedFile(null);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />
      
      <div 
        className={`${sizeClasses[size]} rounded-full bg-primary/10 flex items-center justify-center cursor-pointer group hover:bg-primary/20 transition-colors relative overflow-hidden`}
        onClick={handleClick}
      >
        {currentImage ? (
          <img 
            src={currentImage} 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="font-semibold text-primary">
            {currentImage ? "" : "U"}
          </span>
        )}
        
        {/* Upload overlay */}
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {uploading ? (
            <Loader2 className="w-4 h-6 text-white animate-spin" />
          ) : (
            <Camera className="w-4 h-6 text-white" />
          )}
        </div>
      </div>

      {error && (
        <div className="absolute -bottom-6 left-0 right-0 text-xs text-destructive text-center">
          {error}
        </div>
      )}

      {/* Crop Modal */}
      {selectedFile && (
        <ImageCropModal
          isOpen={showCropModal}
          onClose={() => {
            setShowCropModal(false);
            setSelectedFile(null);
          }}
          imageFile={selectedFile}
          onCropComplete={handleCropComplete}
          aspect={1} // Square aspect ratio for profile pictures
          circular={true} // Circular crop for profile pictures
        />
      )}
    </div>
  );
}

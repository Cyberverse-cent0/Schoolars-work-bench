import { useState, useRef, useCallback } from "react";
import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Scissors, Move, RotateCw, Check, X } from "lucide-react";

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageFile: File;
  onCropComplete: (croppedImageBlob: Blob) => void;
  aspect?: number;
  circular?: boolean;
}

export function ImageCropModal({ 
  isOpen, 
  onClose, 
  imageFile, 
  onCropComplete, 
  aspect = 1,
  circular = false 
}: ImageCropModalProps) {
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 50,
    height: 50,
    x: 25,
    y: 25,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [imgSrc, setImgSrc] = useState<string>("");
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);

  // Convert file to data URL for preview
  useState(() => {
    if (imageFile && isOpen) {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        if (reader.result) {
          setImgSrc(reader.result as string);
        }
      });
      reader.readAsDataURL(imageFile);
    }
  });

  const generateCroppedImage = useCallback(async () => {
    if (!completedCrop || !imgRef.current) return;

    const image = imgRef.current;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Set canvas size to match the crop
    const pixelCrop = completedCrop;
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Apply rotation
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotate * Math.PI) / 180);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    // Draw the cropped image
    ctx.drawImage(
      image,
      pixelCrop.x * scaleX,
      pixelCrop.y * scaleY,
      pixelCrop.width * scaleX,
      pixelCrop.height * scaleY,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    ctx.restore();

    // If circular, create circular clipping
    if (circular) {
      const circularCanvas = document.createElement("canvas");
      const circularCtx = circularCanvas.getContext("2d");
      if (!circularCtx) return;

      const size = Math.min(canvas.width, canvas.height);
      circularCanvas.width = size;
      circularCanvas.height = size;

      circularCtx.save();
      circularCtx.beginPath();
      circularCtx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      circularCtx.closePath();
      circularCtx.clip();

      // Center the image in the circular canvas
      const offsetX = (size - canvas.width) / 2;
      const offsetY = (size - canvas.height) / 2;
      circularCtx.drawImage(canvas, offsetX, offsetY);
      circularCtx.restore();

      circularCanvas.toBlob((blob) => {
        if (blob) onCropComplete(blob);
      }, "image/jpeg", 0.9);
    } else {
      canvas.toBlob((blob) => {
        if (blob) onCropComplete(blob);
      }, "image/jpeg", 0.9);
    }
  }, [completedCrop, rotate, circular, onCropComplete]);

  const handleCropComplete = useCallback((crop: PixelCrop) => {
    setCompletedCrop(crop);
  }, []);

  const handleApplyCrop = () => {
    generateCroppedImage();
    onClose();
  };

  const handleRotateLeft = () => {
    setRotate((prev) => prev - 90);
  };

  const handleRotateRight = () => {
    setRotate((prev) => prev + 90);
  };

  const handleReset = () => {
    setCrop({
      unit: "%",
      width: 50,
      height: 50,
      x: 25,
      y: 25,
    });
    setRotate(0);
    setScale(1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="w-5 h-5" />
            Crop Profile Picture
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Image with crop overlay */}
          <div className="flex justify-center">
            <div className="relative max-w-lg">
              {imgSrc && (
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={handleCropComplete}
                  aspect={aspect}
                  circularCrop={circular}
                  className="max-w-full"
                >
                  <img
                    ref={imgRef}
                    src={imgSrc}
                    alt="Upload preview"
                    style={{
                      transform: `scale(${scale}) rotate(${rotate}deg)`,
                      maxHeight: "400px",
                      maxWidth: "100%",
                    }}
                  />
                </ReactCrop>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRotateLeft}>
              <RotateCw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleRotateRight}>
              <RotateCw className="w-4 h-4 rotate-180" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <Move className="w-4 h-4" />
            </Button>
          </div>

          {/* Preview */}
          {completedCrop && imgRef.current && (
            <div className="flex justify-center">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Preview</p>
                <div className="relative inline-block">
                  <canvas
                    ref={(canvas) => {
                      if (!canvas || !imgRef.current || !completedCrop) return;

                      const image = imgRef.current;
                      const ctx = canvas.getContext("2d");
                      if (!ctx) return;

                      const scaleX = image.naturalWidth / image.width;
                      const scaleY = image.naturalHeight / image.height;

                      canvas.width = 100;
                      canvas.height = 100;

                      if (circular) {
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(50, 50, 50, 0, Math.PI * 2);
                        ctx.closePath();
                        ctx.clip();
                      }

                      ctx.drawImage(
                        image,
                        completedCrop.x * scaleX,
                        completedCrop.y * scaleY,
                        completedCrop.width * scaleX,
                        completedCrop.height * scaleY,
                        0,
                        0,
                        100,
                        100
                      );

                      if (circular) {
                        ctx.restore();
                      }
                    }}
                    className="border border-border rounded-full"
                    style={{ width: "100px", height: "100px" }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleApplyCrop} disabled={!completedCrop}>
              <Check className="w-4 h-4 mr-2" />
              Apply Crop
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

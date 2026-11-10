
import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";

const createCroppedImage = (imageSrc, pixelCrop) => {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      context.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Image cropping failed."));
            return;
          }

          resolve(
            new File([blob], "product-image.jpg", {
              type: "image/jpeg",
            })
          );
        },
        "image/jpeg",
        0.9
      );
    };

    image.onerror = () => reject(new Error("Unable to load image."));
    image.src = imageSrc;
  });
};

export default function ProductImageCropper({
  image,
  onCropComplete,
  onCancel,
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const handleCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleSave = async () => {
    try {
      const croppedFile = await createCroppedImage(
        image,
        croppedAreaPixels
      );

      onCropComplete(croppedFile);
    } catch (error) {
      console.error("Crop error:", error);
      alert("Unable to crop image. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-xl p-5 shadow-lg">
      <h2 className="text-xl font-semibold text-[#5C3A2E] mb-4">
        Crop Product Image
      </h2>

      <div className="relative w-full h-80 bg-gray-900 rounded-lg overflow-hidden">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={1}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={handleCropComplete}
        />
      </div>

      <div className="mt-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Zoom
        </label>

        <input
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={(event) => setZoom(Number(event.target.value))}
          className="w-full accent-[#8B6248]"
        />
      </div>

      <div className="flex justify-end gap-3 mt-5">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={!croppedAreaPixels}
          className="px-5 py-2 bg-[#5C3A2E] text-white rounded-lg hover:bg-[#8B6248] disabled:opacity-50"
        >
          Crop Image
        </button>
      </div>
    </div>
  );
}

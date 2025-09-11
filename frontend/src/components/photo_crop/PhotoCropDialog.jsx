import React, { useRef, useState, useCallback } from "react";
import { Dialog, DialogActions, DialogContent, Button, DialogTitle } from "@mui/material";
import Cropper from "react-easy-crop";

const PhotoCropDialog = ({ open, imageSrc, onClose, onSave, filename }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Helper function to create image from src
  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', error => reject(error));
      image.setAttribute('crossOrigin', 'anonymous'); // needed to avoid canvas taint
      image.src = url;
    });

  const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Set canvas size to the cropped area
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Draw the cropped image
    ctx.drawImage(
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

    // Convert canvas to blob
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const file = new File([blob], `${filename || "cropped_photo"}.png`, {
              type: "image/png",
              lastModified: Date.now(),
            });
            resolve(file);
          } else {
            throw new Error('Canvas toBlob failed');
          }
        },
        'image/png',
        0.9 // Higher quality for better results
      );
    });
  };

  const handleSave = async () => {
    try {
      if (!croppedAreaPixels) {
        console.error('No crop area selected');
        return;
      }

      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels);
      onSave(croppedFile);
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  };

  const handleClose = () => {
    // Reset state when closing
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Recortar Imagen</DialogTitle>
      <DialogContent sx={{ height: 400, position: 'relative' }}>
        {imageSrc && (
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1} // square crop
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            showGrid={true}
            cropShape="round" // Makes it a circular crop for profile photos
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary">
          Cancelar
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={!croppedAreaPixels}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PhotoCropDialog;
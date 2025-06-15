
import React, { useState } from 'react';

interface PropertyImageGalleryProps {
  images: string[];
  title: string;
}

const PropertyImageGallery: React.FC<PropertyImageGalleryProps> = ({ images, title }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-xl flex items-center justify-center shadow-lg mb-6">
        <span className="text-gray-500 text-lg">Sem imagens disponíveis</span>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="space-y-4">
        <div className="aspect-video rounded-xl overflow-hidden shadow-xl">
          <img
            src={images[currentImageIndex]}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-3">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`aspect-video rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-105 ${
                  index === currentImageIndex 
                    ? 'border-blue-500 ring-2 ring-blue-200' 
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <img
                  src={image}
                  alt={`${title} ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyImageGallery;

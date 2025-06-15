
import React from 'react';

interface PropertyMultimediaProps {
  virtualTourUrl?: string;
  videoUrl?: string;
}

const PropertyMultimedia: React.FC<PropertyMultimediaProps> = ({ virtualTourUrl, videoUrl }) => {
  if (!virtualTourUrl && !videoUrl) {
    return null;
  }

  return (
    <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
      <h4 className="font-semibold text-lg mb-4 text-green-800 dark:text-green-200">Recursos Multimídia</h4>
      <div className="space-y-3">
        {virtualTourUrl && (
          <div className="flex items-center">
            <span className="font-medium text-green-700 dark:text-green-300 mr-3">Tour Virtual:</span>
            <a 
              href={virtualTourUrl} 
              target="_blank" 
              rel="noopener" 
              className="text-blue-600 hover:text-blue-800 underline break-words font-medium"
            >
              Visualizar Tour Virtual
            </a>
          </div>
        )}
        {videoUrl && (
          <div className="flex items-center">
            <span className="font-medium text-green-700 dark:text-green-300 mr-3">Vídeo:</span>
            <a 
              href={videoUrl} 
              target="_blank" 
              rel="noopener" 
              className="text-blue-600 hover:text-blue-800 underline break-words font-medium"
            >
              Assistir Vídeo
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyMultimedia;

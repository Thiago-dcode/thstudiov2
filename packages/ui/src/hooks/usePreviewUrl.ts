import {  useEffect,  useState } from 'react';

export const usePreviewUrl = ({
  defaultUrl,
  files,
}: {
  defaultUrl?: string;
  files?: FileList;
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(defaultUrl);

 useEffect(() => {
    if (files && files.length > 0) {
      const file = files[0];
      // Create object URL for preview
      setPreviewUrl(URL.createObjectURL(file));
    }

  }, [files]);

  return {
    previewUrl,
  };
};

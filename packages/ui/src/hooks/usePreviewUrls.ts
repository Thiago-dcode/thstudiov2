import { useEffect, useState, useRef, useMemo, useCallback } from 'react';

const hasFiles = (fileList?: FileList): boolean => {
  return !!(fileList && fileList.length > 0);
};

const filesAreEqual = (prev: FileList, current: FileList): boolean => {
  if (prev.length !== current.length) return false;
  return !Array.from(prev).some((file, i) => {
    const currentFile = current[i];
    return !currentFile || file.name !== currentFile.name || file.size !== currentFile.size;
  });
};

const createPreviewUrls = (files: FileList): string[] => {
  return Array.from(files).map(file => URL.createObjectURL(file));
};

const isDefaultUrls = (urls: string[], defaultUrls: string[]): boolean => {
  return urls.length === defaultUrls.length && urls.every((url, i) => url === defaultUrls[i]);
};

const revokeBlobUrls = (urls: string[]): void => {
  urls.forEach(url => {
    if (url?.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  });
};

export const usePreviewUrls = ({
  defaultUrl = [],
  files,
}: {
  defaultUrl?: string | string[];
  files?: FileList;
}) => {
  const defaultUrls = useMemo(
    () => (Array.isArray(defaultUrl) ? defaultUrl : [defaultUrl]),
    [defaultUrl]
  );
  
  const [previewUrls, setPreviewUrls] = useState<string[]>(defaultUrls);
  const prevUrlsRef = useRef<string[]>(defaultUrls);
  const prevFilesRef = useRef<FileList | undefined>(undefined);

  // Cleanup function to revoke all blob URLs (doesn't set state to avoid infinite loops)
  const cleanup = useCallback(() => {
    revokeBlobUrls(prevUrlsRef.current);
  }, []);

  useEffect(() => {
    const currentUrls = prevUrlsRef.current;
    const prevFiles = prevFilesRef.current;
    const currentHasFiles = hasFiles(files);
    const prevHadFiles = hasFiles(prevFiles);

    // Check if files changed
    const filesChanged = !prevFiles || 
      !currentHasFiles || 
      !prevHadFiles || 
      (files && prevFiles ? !filesAreEqual(prevFiles, files) : true);

    // Handle file changes
    if (currentHasFiles && files && filesChanged) {
      const urls = createPreviewUrls(files);
      setPreviewUrls(urls);
      prevUrlsRef.current = urls;
      prevFilesRef.current = files;
    } else if (!currentHasFiles && prevHadFiles) {
      // Files cleared - reset to default if not already
      if (!isDefaultUrls(prevUrlsRef.current, defaultUrls)) {
        setPreviewUrls(defaultUrls);
        prevUrlsRef.current = defaultUrls;
      }
      prevFilesRef.current = undefined;
    } else if (!currentHasFiles) {
      prevFilesRef.current = undefined;
    }

    // Cleanup: revoke blob URLs from previous render
    return () => {
      revokeBlobUrls(currentUrls);
    };
  }, [files, defaultUrls]);

  // Cleanup on unmount - only revoke URLs, don't set state
  useEffect(() => {
    return () => {
      revokeBlobUrls(prevUrlsRef.current);
    };
  }, []);

  return { previewUrls, cleanup };
};

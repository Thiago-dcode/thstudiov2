import { useEffect, useState, useRef, useMemo, useCallback } from 'react';

const hasFiles = (files?: FileList | File): boolean => {
  if (!files) return false;
  if (files instanceof File) return true;
  return files.length > 0;
};

const filesAreEqual = (prev: FileList | File | undefined, current: FileList | File | undefined): boolean => {
  if (!prev || !current) return false;
  
  // Handle single File case
  if (prev instanceof File && current instanceof File) {
    return prev.name === current.name && prev.size === current.size;
  }
  
  // Handle FileList case
  if (prev instanceof FileList && current instanceof FileList) {
    if (prev.length !== current.length) return false;
    return !Array.from(prev).some((file, i) => {
      const currentFile = current[i];
      return !currentFile || file.name !== currentFile.name || file.size !== currentFile.size;
    });
  }
  
  // Mixed types are not equal
  return false;
};

const createPreviewUrls = (files: FileList | File): string[] => {
  if (files instanceof File) {
    return [URL.createObjectURL(files)];
  }
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
  files?: FileList |File;
}) => {
  const defaultUrls = useMemo(
    () => {
      const urls = Array.isArray(defaultUrl) ? defaultUrl : (defaultUrl ? [defaultUrl] : []);
      return urls.filter(Boolean); // Remove any falsy values
    },
    [defaultUrl]
  );
  
  // Initialize with preview URLs if files are provided on mount
  const getInitialUrls = () => {
    if (hasFiles(files)) {
      return createPreviewUrls(files!);
    }
    return defaultUrls;
  };

  const [previewUrls, setPreviewUrls] = useState<string[]>(getInitialUrls);
  const prevUrlsRef = useRef<string[]>(getInitialUrls());
  const prevFilesRef = useRef<FileList | File | undefined>(files);

  // Cleanup function to revoke all blob URLs (doesn't set state to avoid infinite loops)
  const cleanup = useCallback(() => {
    revokeBlobUrls(prevUrlsRef.current);
  }, []);

  useEffect(() => {
    const currentUrls = prevUrlsRef.current;
    const prevFiles = prevFilesRef.current;
    const currentHasFiles = hasFiles(files);
    const prevHadFiles = hasFiles(prevFiles);

    // Check if files changed (by reference or content)
    const filesChanged = !prevFiles || 
      !currentHasFiles || 
      !prevHadFiles || 
      (files && prevFiles ? !filesAreEqual(prevFiles, files) : true);

    // Handle file changes
    // If prevFiles is undefined (mount/remount) and we have files, always create URLs
    if (currentHasFiles && files && (filesChanged || !prevFiles)) {
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
      // No files - set to default if not already
      if (!isDefaultUrls(prevUrlsRef.current, defaultUrls)) {
        setPreviewUrls(defaultUrls);
        prevUrlsRef.current = defaultUrls;
      }
      prevFilesRef.current = undefined;
    }

    // Cleanup: revoke blob URLs from previous render (but not current ones)
    return () => {
      // Only revoke URLs that are not the current ones
      const urlsToRevoke = currentUrls.filter(url => !prevUrlsRef.current.includes(url));
      revokeBlobUrls(urlsToRevoke);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]); // Only depend on files - defaultUrls is stable via useMemo

  // Cleanup on unmount - only revoke URLs, don't set state
  useEffect(() => {
    return () => {
      revokeBlobUrls(prevUrlsRef.current);
    };
  }, []);

  return { previewUrls, cleanup };
};

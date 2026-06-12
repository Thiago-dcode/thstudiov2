"use client";

import { useEffect, useState } from "react";

export const useLoadAsset = (data: { asset: string }) => {
  const [asset, setAsset] = useState<string | null>(null);

  useEffect(() => {
    import(`../../assets/${data.asset}`)
      .then((module) => setAsset(module.default))
      .catch(() => setAsset(null));
  }, [data]);

  return {
    asset,
  };
};

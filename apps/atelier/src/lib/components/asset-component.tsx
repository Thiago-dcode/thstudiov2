import { useLoadAsset } from "@/lib/hooks/useLoadAsset";
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import Image ,{ImageProps}from "next/image";

type Props = {
    file: string
} & Omit<ImageProps, 'src'>

export const AssetComponent = ({ file, ...imageProps }: Props) => {
    const { asset } = useLoadAsset({ asset: file });
    if (!asset) return <Spinner />;
  
    return <Image src={asset} {...imageProps} />;
};
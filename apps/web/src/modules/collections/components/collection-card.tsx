export const CollectionCard = ({
    images,
    title
}: {
    images: string[];
    title?: string;
}) => {
    return (
        <article className="group cursor-pointer aspect-square relative">
            <div className="absolute inset-0 flex items-center justify-center">
                {images.length === 0 ? (
                    <div className="absolute w-[78%] h-[78%] rounded-md overflow-hidden border border-border shadow-md bg-fg-2 group-hover:scale-105 transition-transform duration-200">
                        <div className="w-full h-full" />
                    </div>
                ) : (
                    images.slice().reverse().map((image, revIdx) => {
                        const i = images.length - 1 - revIdx;
                        
                        if (i === 0) {
                            return (
                                <div key={i} className="absolute w-[78%] h-[78%] rounded-md overflow-hidden border border-border shadow-md bg-fg-2 group-hover:scale-105 transition-transform duration-200 z-10">
                                    {image ? (
                                        <img src={image} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full" />
                                    )}
                                </div>
                            );
                        }

                        // Generate dynamic rotation and translation based on the index
                        const rotation = i % 2 === 0 ? i * 3 : -(i * 3);
                        const tx = i % 2 === 0 ? i * 2 : -(i * 2); // pixels
                        const ty = i % 2 === 0 ? -(i * 2) : i * 2; // pixels

                        return (
                            <div 
                                key={i}
                                className="absolute w-[78%] h-[78%] rounded-md overflow-hidden border border-border shadow-sm bg-fg-2"
                                style={{
                                    transform: `rotate(${rotation}deg) translate(${tx}px, ${ty}px)`
                                }}
                            >
                                {image && <img src={image} alt="" className="w-full h-full object-cover" />}
                            </div>
                        );
                    })
                )}
            </div>
            {title && (
                <div className="absolute bottom-[12%] left-[12%] z-20 pointer-events-none">
                    <h3 className="text-xs text-bg/90 font-semibold text-foreground truncate bg-text/50  px-2 py-1 shadow-md max-w-full pointer-events-auto">
                        {title}
                    </h3>
                </div>
            )}
        </article>
    );
};

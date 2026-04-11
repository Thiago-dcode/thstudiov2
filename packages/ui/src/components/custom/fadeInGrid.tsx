import { useRef, useMemo } from "react";

type FadeInGridComponent = React.HtmlHTMLAttributes<HTMLDivElement> & {
    children: React.ReactNode[],
    dependencies?:any[]
}

export const FadeInDiv = ({ children, dependencies=[], ...props }: FadeInGridComponent) => {
    const lastCountRef = useRef(0);
    
    // Memoize the children with animation styles
    // This only recalculates when children.length changes
    const animatedChildren = useMemo(() => {
        const previousCount = lastCountRef.current;
        const currentCount = children.length;
        
        // Update ref for next render
        lastCountRef.current = currentCount;
        
        return children.map((child, i) => {
            // Items beyond the previous count are "new"
            const isNewElement = i >= previousCount;
            const idx = isNewElement ? i - previousCount : 0;

            return (
                <div key={`animation-grid-child-${i}`} style={{
                    opacity: isNewElement ? 0 : 1,
                    animationName: isNewElement ? 'fadeInUp' : 'none',
                    animationDuration: isNewElement ? '0.5s' : undefined,
                    animationTimingFunction: isNewElement ? 'ease-out' : undefined,
                    animationFillMode: isNewElement ? 'forwards' : undefined,
                    animationDelay: isNewElement ? `${idx * 100}ms` : undefined
                }}>
                    {child}
                </div>
            );
        });
    }, [...dependencies, children.length]);

    return (
        <div {...props} className="flex flex-wrap gap-2 items-start justify-start w-full">
            {animatedChildren}
        </div>
    )
}
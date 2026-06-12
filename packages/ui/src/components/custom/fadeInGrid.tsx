import { useEffect, useMemo, useState } from "react";

type FadeInGridComponent = React.HtmlHTMLAttributes<HTMLDivElement> & {
    children: React.ReactNode[],
    dependencies?: unknown[]
}

export const FadeInDiv = ({ children, dependencies=[], ...props }: FadeInGridComponent) => {
    const [previousCount, setPreviousCount] = useState(children.length);
    
    // Memoize the children with animation styles
    // This only recalculates when children.length changes
    const animatedChildren = useMemo(() => {
        const depsLen = dependencies.length;

        return children.map((child, i) => {
            // Items beyond the previous count are "new"
            const isNewElement = i >= previousCount;
            const idx = isNewElement ? (i - previousCount + depsLen * 0) : 0;

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
    }, [dependencies, children, previousCount]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPreviousCount(children.length)
    }, [children.length])

    return (
        <div {...props} className="flex flex-wrap gap-2 items-start justify-start w-full">
            {animatedChildren}
        </div>
    )
}

import { FullPortfolio } from "@repo/common-lib/types/portfolio"
import { PortfolioMediaCard } from "./portfolio-media-card"
import "@/modules/portfolios/assets/portfolio-grid.css";

const STYLE = 'mansonry-grid'
export const PortfolioGrid = ({ portfolio }: {
    portfolio: FullPortfolio
}) => {



    return (
        <div className={STYLE}>
            {portfolio.media.map((m) => (
                <PortfolioMediaCard key={m.id} media={m} />
            ))}
        </div>
    )
}
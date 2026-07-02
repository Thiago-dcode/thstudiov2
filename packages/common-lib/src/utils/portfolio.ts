import { MediaPortfolio } from "../types/media";
import { FullPortfolio, FullPortfolioItem } from "../types/portfolio";


type MediaItemPortfolio = MediaPortfolio & {
    fromCollection?: string
}
export function buildPortfolioItemsFromFullPortfolio(portfolio: FullPortfolio): FullPortfolioItem[] {

    const portfolioItems: FullPortfolioItem[] = [];


    portfolio.media.forEach(m => {
        portfolioItems.push({ ...m, item: 'media' })

    });
    portfolio.collections.forEach(col => {
        portfolioItems.push({ ...col, item: 'collection' })

    });

     portfolioItems.sort((a, b) => a.position - b.position);
     let currentIndex = 0;
     return portfolioItems.map(item => {

        const _item=  {
            ...item,
            index:currentIndex,
        }
        if(item.item === 'media'){
            currentIndex++;
        }
        else if(item.item ==='collection'){
            currentIndex += item.media.length;
        }
        return _item;
     })
}

export function extractMediaFromPortfolioItems(portfolioItems: FullPortfolioItem[]) {

    const media: MediaItemPortfolio[] = [];

    for (let i = 0; i < portfolioItems.length; i++) {
        const item = portfolioItems[i];

        if (item.item === 'media') {

            media.push(item);
        }
        else if (item.item === 'collection') {

            media.push(...item.media.map(m => {

                return { ...m, fromCollection: item.title }
            }));
        }

    }

    return media;

}
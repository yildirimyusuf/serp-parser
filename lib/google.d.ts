import { Serp } from './models';
export declare class GoogleSERP {
    #private;
    serp: Serp;
    private $;
    constructor(html: string, options?: Record<string, boolean>);
    private parse;
    private getOrganic;
    private getFeatured;
    private getSnippet;
    private parseSitelinks;
    private getRelatedKeywords;
    private parseCachedAndSimilarUrls;
    private getPagination;
    private getVideos;
    private getHotels;
    private getHotelSearchFilters;
    private getHotelOffers;
    private getAdwords;
    private getAds;
    private getAdSitelinks;
    private getLocals;
    private getTopStories;
    private getShopResults;
    private elementText;
    private elementHref;
}

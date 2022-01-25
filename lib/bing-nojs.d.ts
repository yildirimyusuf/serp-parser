import { Serp } from './models';
export declare class BingNojsSERP {
    #private;
    serp: Serp;
    private $;
    constructor(html: string, options?: Record<string, boolean>);
    private parse;
    private parseBing;
    private getOrganic;
    private getSnippet;
    private parseSitelinks;
    private getRelatedKeywords;
    private getHotels;
    private getAdwords;
    private getAds;
    private getAdSitelinks;
    private elementText;
    private elementHref;
}

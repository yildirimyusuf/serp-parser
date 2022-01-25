import { Serp } from './models';
export declare class GoogleMobileSERP {
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
    private getAdwords;
    private getAds;
    private getAdSitelinks;
    private elementText;
    private elementHref;
}

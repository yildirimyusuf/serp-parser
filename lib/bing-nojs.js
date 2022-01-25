"use strict";
var _BingNojsSERP_DEF_OPTIONS;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BingNojsSERP = void 0;
const tslib_1 = require("tslib");
const cheerio = tslib_1.__importStar(require("cheerio"));
const models_1 = require("./models");
const utils = tslib_1.__importStar(require("./utils"));
class BingNojsSERP {
    constructor(html, options) {
        this.serp = {
            currentPage: 1,
            keyword: '',
            organic: [],
            pagination: [],
            relatedKeywords: [],
        };
        _BingNojsSERP_DEF_OPTIONS.set(this, {
            organic: true,
            related: true,
            ads: true,
            hotels: true,
        });
        this.$ = cheerio.load(html, {
            normalizeWhitespace: true,
            xmlMode: false,
        });
        this.parse(options);
    }
    parse(options) {
        const $ = this.$;
        const CONFIG = {
            noResultsNojs: '#b_results li.b_no',
        };
        if ($(CONFIG.noResultsNojs).length === 1) {
            this.serp.error = 'No results page';
            // No need to parse anything for no results page
            return;
        }
        if ($('body').attr('onload')) {
            this.parseBing(options);
        }
        else {
            this.serp.error = 'Not Bing nojs page';
            return;
        }
    }
    parseBing(opt) {
        const serp = this.serp;
        const options = opt ? opt : tslib_1.__classPrivateFieldGet(this, _BingNojsSERP_DEF_OPTIONS, "f");
        const $ = this.$;
        const CONFIG = {
            keyword: 'input[name="q"]',
        };
        serp.keyword = $(CONFIG.keyword).val();
        if (options.organic) {
            this.getOrganic();
        }
        if (options.related) {
            this.getRelatedKeywords();
        }
        if (options.ads) {
            this.getAdwords();
        }
        if (options.hotels) {
            this.getHotels();
        }
    }
    getOrganic() {
        const $ = this.$;
        const CONFIG = {
            // results: '#b_results li.b_algo h2 > a',
            results: '#b_results li.b_algo',
        };
        $(CONFIG.results).each((index, element) => {
            const position = index + 1;
            const link = $(element).find('h2 > a');
            const url = link.prop('href');
            const domain = utils.getDomain(url);
            const title = link.text();
            const snippet = this.getSnippet(element);
            const linkType = utils.getLinkType(url);
            const result = {
                domain,
                linkType,
                position,
                snippet,
                title,
                url,
            };
            this.parseSitelinks(element, result);
            this.serp.organic.push(result);
        });
    }
    getSnippet(element) {
        let text;
        text = this.$(element).find('.b_caption > p').text();
        if (!text) {
            text = this.$(element).find('.b_mText p').text();
        }
        return text.replace(/(&nbsp;)/g, ' ').replace(/ +(?= )/g, '');
    }
    parseSitelinks(element, result) {
        const $ = this.$;
        const CONFIG = {
            inline: '.b_vlist2col.b_deep li a',
        };
        const links = $(element).find(CONFIG.inline);
        if (links.length === 0) {
            return;
        }
        result.sitelinks = [];
        links.each((i, el) => {
            var _a;
            const sitelink = {
                href: $(el).attr('href'),
                title: $(el).text(),
                type: models_1.SitelinkType.inline,
            };
            (_a = result.sitelinks) === null || _a === void 0 ? void 0 : _a.push(sitelink);
        });
    }
    getRelatedKeywords() {
        const relatedKeywords = [];
        const query = '.Sljvkf.iIWm4b a';
        this.$(query).each((i, elem) => {
            relatedKeywords.push({
                keyword: this.$(elem).text(),
                path: this.$(elem).prop('href'),
            });
        });
        this.serp.relatedKeywords = relatedKeywords;
    }
    getHotels() {
        const $ = this.$;
        if (!$('#b_results > li.b_ans.b_mop .b_ilhTitle').text().startsWith('Hotels')) {
            return;
        }
        const hotelsFeature = $('#b_results > li.b_ans.b_mop');
        // TODO: SPLIT FURTHER TO getSearchFilters, getHotelOffers
        const CONFIG = {
            hotelOffers: '.b_scard',
            hotelStars: '.b_factrow',
            hotelStarsRegex: /\d(?=-star)/,
            name: '.lc_content h2',
            rating: '.csrc.sc_rc1',
            ratingRegex: /\d*\.?,?\d/,
            votes: '.b_factrow > span[title]',
            votesRegex: /\((.*)\)/,
        };
        const hotels = [];
        // HOTELS
        const hotelOffers = hotelsFeature.find(CONFIG.hotelOffers);
        hotelOffers.each((ind, elem) => {
            const name = this.elementText(elem, CONFIG.name);
            const ratingText = this.$(elem).find(CONFIG.rating).attr('aria-label');
            const ratingMatch = (ratingText.match(CONFIG.ratingRegex) || ['0.0'])[0];
            const rating = parseFloat(ratingMatch.replace(',', '.'));
            // TODO regex replace all
            const votesText = this.$(elem).find(CONFIG.votes).first().attr('title');
            const votesNumber = (votesText.match(CONFIG.votesRegex) || [0, 0])[1];
            const hotelStars = utils.getFirstMatch($($(elem).find(CONFIG.hotelStars)[1]).text(), CONFIG.hotelStarsRegex);
            const stars = parseInt(hotelStars, 10);
            // const desc html
            const description = '';
            const moreInfoLink = '';
            const hotel = {
                description,
                moreInfoLink,
                name,
                rating,
                stars,
                votes: votesNumber,
            };
            hotels.push(hotel);
        });
        this.serp.hotels = {
            hotels,
            moreHotels: '',
        };
    }
    getAdwords() {
        const $ = this.$;
        const serp = this.serp;
        const CONFIG = {
            top: 'li.b_ad',
        };
        const adwords = {};
        // TODO: refactor this
        if ($(CONFIG.top).length) {
            adwords.adwordsTop = [];
            this.getAds(adwords.adwordsTop);
        }
        serp.adwords = adwords.adwordsTop ? adwords : undefined;
    }
    getAds(adsList) {
        const $ = this.$;
        const CONFIG = {
            ads: 'li.b_ad > ul > li',
            snippet: '.b_caption p',
            title: 'h2 a',
            url: 'h2 a',
        };
        $(CONFIG.ads).each((i, e) => {
            const title = this.elementText(e, CONFIG.title);
            const url = this.elementHref(e, CONFIG.url);
            const domain = utils.getDomain(url, 'https://www.bingadservices.com/pagead');
            const linkType = utils.getLinkType(url, 'https://www.bingadservices.com/pagead');
            const snippet = this.elementText(e, CONFIG.snippet);
            const sitelinks = this.getAdSitelinks(e);
            const position = i + 1;
            const ad = {
                domain,
                linkType,
                position,
                sitelinks,
                snippet,
                title,
                url,
            };
            adsList.push(ad);
        });
    }
    // TODO Figure out new BLOCK sitelinks at Hotels page
    getAdSitelinks(ad) {
        const $ = this.$;
        const CONFIG = {
            sitelinks: '.ad_vsltitle a',
        };
        const sitelinks = [];
        $(ad)
            .find(CONFIG.sitelinks)
            .each((i, el) => {
            const sitelink = {
                href: $(el).attr('href'),
                title: $(el).text(),
                type: models_1.SitelinkType.inline,
            };
            sitelinks.push(sitelink);
        });
        return sitelinks;
    }
    // Helper methods
    elementText(el, query) {
        return this.$(el).find(query).text();
    }
    elementHref(el, query) {
        return this.$(el).find(query).attr('href');
    }
}
exports.BingNojsSERP = BingNojsSERP;
_BingNojsSERP_DEF_OPTIONS = new WeakMap();

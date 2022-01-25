"use strict";
var _GoogleNojsSERP_DEF_OPTIONS;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleNojsSERP = void 0;
const tslib_1 = require("tslib");
const cheerio = tslib_1.__importStar(require("cheerio"));
const models_1 = require("./models");
const utils = tslib_1.__importStar(require("./utils"));
class GoogleNojsSERP {
    constructor(html, options) {
        this.serp = {
            currentPage: 1,
            keyword: '',
            organic: [],
            pagination: [],
            relatedKeywords: [],
        };
        _GoogleNojsSERP_DEF_OPTIONS.set(this, {
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
    parse(opt) {
        const $ = this.$;
        const CONFIG = {
            noResultsNojs: 'span.r0bn4c.rQMQod:contains(" - did not match any documents.")',
        };
        if ($(CONFIG.noResultsNojs).length === 1) {
            this.serp.error = 'No results page';
            // No need to parse anything for no results page
            return;
        }
        if ($('body').attr('jsmodel') === 'hspDDf') {
            this.parseGoogle(opt);
        }
        else {
            this.serp.error = 'Not Google nojs page';
            return;
        }
    }
    parseGoogle(opt) {
        const serp = this.serp;
        const options = opt ? opt : tslib_1.__classPrivateFieldGet(this, _GoogleNojsSERP_DEF_OPTIONS, "f");
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
            results: '#main > div > div.ZINbbc.xpd.O9g5cc.uUPGi > div.kCrYT:first-child > a',
        };
        $(CONFIG.results).each((index, element) => {
            const position = index + 1;
            const url = utils.getUrlFromQuery($(element).prop('href'));
            const domain = utils.getDomain(url);
            const title = $(element).children('h3').text();
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
        if (this.$(element).parent('.kCrYT').nextAll('.kCrYT').find('.Ap5OSd').length === 0) {
            text = this.$(element).parent('.kCrYT').nextAll('.kCrYT').text();
        }
        else
            text = this.$(element).parent('.kCrYT').nextAll('.kCrYT').find('.Ap5OSd').text();
        return text.replace(/(&nbsp;)/g, ' ').replace(/ +(?= )/g, '');
    }
    parseSitelinks(element, result) {
        const $ = this.$;
        const CONFIG = {
            next: '.kCrYT',
            inline: 'span a',
        };
        const links = $(element).parent().nextAll(CONFIG.next).find(CONFIG.inline);
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
        if (!$('#main > div:not(.xpd) h2.zBAuLc').text().startsWith('Hotels')) {
            return;
        }
        const hotelsFeature = $('#main > div:not(.xpd) h2.zBAuLc').closest('.xpd');
        // TODO: SPLIT FURTHER TO getSearchFilters, getHotelOffers
        const CONFIG = {
            description: 'div.BNeawe',
            hotelOffers: '.X7NTVe',
            hotelStars: 'div.BNeawe',
            hotelStarsRegex: /\d(?=-star)/,
            moreInfoLink: 'a.tHmfQe',
            name: 'h3',
            rating: '.Eq0J8:first-child',
            votes: '.Eq0J8:last-child',
            votesRegex: /\((\d+,?)+\)/,
        };
        const moreHotelsLink = hotelsFeature.children().last().find('a').attr('href');
        const hotels = [];
        // HOTELS
        const hotelOffers = hotelsFeature.find(CONFIG.hotelOffers);
        hotelOffers.each((ind, elem) => {
            const name = this.elementText(elem, CONFIG.name);
            const rating = parseFloat(this.elementText(elem, CONFIG.rating));
            // TODO regex replace all
            const votes = this.elementText(elem, CONFIG.votes).slice(1, -1).replace(',', '');
            const votesNumber = parseInt(votes, 10);
            const hotelStars = utils.getFirstMatch($(elem).find(CONFIG.hotelStars).text(), CONFIG.hotelStarsRegex);
            const stars = parseInt(hotelStars, 10);
            // const desc html
            const descriptionNode = $(elem).find(CONFIG.description).last().find('br').last()[0].nextSibling;
            const description = descriptionNode ? $(descriptionNode).text() : undefined;
            const moreInfoLink = this.elementHref(elem, CONFIG.moreInfoLink);
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
            moreHotels: moreHotelsLink,
        };
    }
    getAdwords() {
        const $ = this.$;
        const serp = this.serp;
        const CONFIG = {
            top: '.uEierd',
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
            ads: '.uEierd',
            snippet: 'div.BmP5tf span',
            title: 'div[role="heading"]',
            url: 'a.C8nzq',
        };
        $(CONFIG.ads).each((i, e) => {
            const title = this.elementText(e, CONFIG.title);
            const url = this.elementHref(e, CONFIG.url);
            const domain = utils.getDomain(url, 'https://www.googleadservices.com/pagead');
            const linkType = utils.getLinkType(url, 'https://www.googleadservices.com/pagead');
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
            sitelinks: '.sJxfee a',
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
exports.GoogleNojsSERP = GoogleNojsSERP;
_GoogleNojsSERP_DEF_OPTIONS = new WeakMap();

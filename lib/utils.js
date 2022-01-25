"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTimeTaken = exports.getTotalResults = exports.getLinkType = exports.getFirstMatch = exports.getUrlFromQuery = exports.getDomain = void 0;
const models_1 = require("./models");
const getDomain = (url, base) => {
    const href = new URL(url, base);
    return href.hostname;
};
exports.getDomain = getDomain;
const getUrlFromQuery = (query) => {
    const searchParams = new URLSearchParams(query.replace('/url?', ''));
    // if there is no q parameter, url is related to google search and we will return it in full
    return searchParams.get('q') || 'https://google.com' + query;
};
exports.getUrlFromQuery = getUrlFromQuery;
const getFirstMatch = (str, reg) => {
    str = str ? str : '';
    const matches = str.match(reg);
    return matches ? matches[0] : '';
};
exports.getFirstMatch = getFirstMatch;
const getLinkType = (url, base) => {
    const href = new URL(url, base);
    return href.pathname !== '/' ? models_1.LinkType.landing : models_1.LinkType.home;
};
exports.getLinkType = getLinkType;
const getTotalResults = (text) => {
    const resultsRegex = /[\d,]+(?= results)/g;
    const resultsMatched = exports.getFirstMatch(text, resultsRegex).replace(/,/g, '');
    return resultsMatched !== '' ? parseInt(resultsMatched, 10) : undefined;
};
exports.getTotalResults = getTotalResults;
const getTimeTaken = (text) => {
    const timeRegex = /[\d.]+(?= seconds)/g;
    const timeMatched = exports.getFirstMatch(text, timeRegex);
    return timeMatched !== '' ? parseFloat(timeMatched) : undefined;
};
exports.getTimeTaken = getTimeTaken;

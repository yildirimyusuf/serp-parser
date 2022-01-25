import { LinkType } from './models';
export declare const getDomain: (url: string, base?: string | undefined) => string;
export declare const getUrlFromQuery: (query: string) => string;
export declare const getFirstMatch: (str: string, reg: RegExp) => string;
export declare const getLinkType: (url: string, base?: string | undefined) => LinkType;
export declare const getTotalResults: (text: string) => number | undefined;
export declare const getTimeTaken: (text: string) => number | undefined;

import { Actor, log } from 'apify';
import { gotScraping } from 'got-scraping';
import { readFile } from 'node:fs/promises';

await Actor.init();

const DEFAULT_START_URL = 'https://europa.eu/eures/portal/jv-se/search?page=1&resultsPerPage=10&orderBy=BEST_MATCH&keywordsEverywhere=admin&lang=en';
const API_SEARCH_ENDPOINT = 'https://europa.eu/eures/api/jv-searchengine/public/jv-search/search';
const MAX_BATCH_SIZE = 50;
const REQUEST_TIMEOUT_MS = 30000;

const loadLocalInput = async () => {
    try {
        const raw = await readFile('INPUT.json', 'utf8');
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
};

const actorInput = (await Actor.getInput()) || {};
const input = Object.keys(actorInput).length ? actorInput : await loadLocalInput();
const {
    startUrl,
    startUrls,
    url,
    results_wanted: resultsWantedRaw = 20,
    max_pages: maxPagesRaw = 10,
    proxyConfiguration,
} = input;

const dataset = await Actor.openDataset();

const RESULTS_WANTED = Number.isFinite(+resultsWantedRaw) ? Math.max(1, +resultsWantedRaw) : 20;
const MAX_PAGES = Number.isFinite(+maxPagesRaw) ? Math.max(1, +maxPagesRaw) : 10;

const normalizeText = (value) => String(value || '').replace(/\s+/g, ' ').trim();
const htmlToText = (html) => normalizeText(String(html || '').replace(/<[^>]+>/g, ' '));

const sanitizeDescriptionHtml = (html) => {
    if (html === null || html === undefined) return undefined;

    const allowedTags = new Set(['p', 'br', 'strong', 'b', 'em', 'i', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'ul', 'ol']);
    const source = String(html)
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<!--([\s\S]*?)-->/g, ' ');

    const normalized = source
        .replace(/<\s*([a-z0-9]+)([^>]*)>/gi, (_m, tagName) => {
            const tag = String(tagName || '').toLowerCase();
            if (!allowedTags.has(tag)) return '';
            return tag === 'br' ? '<br>' : `<${tag}>`;
        })
        .replace(/<\s*\/\s*([a-z0-9]+)\s*>/gi, (_m, tagName) => {
            const tag = String(tagName || '').toLowerCase();
            return allowedTags.has(tag) && tag !== 'br' ? `</${tag}>` : '';
        })
        .replace(/\n{2,}/g, '\n')
        .trim();

    return normalized || undefined;
};

const sanitizeValue = (value) => {
    if (value === null || value === undefined) return undefined;

    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed ? trimmed : undefined;
    }

    if (Array.isArray(value)) {
        const arr = value.map(sanitizeValue).filter((v) => v !== undefined);
        return arr.length ? arr : undefined;
    }

    if (typeof value === 'object') {
        const out = {};
        for (const [key, nestedValue] of Object.entries(value)) {
            const cleaned = sanitizeValue(nestedValue);
            if (cleaned !== undefined) out[key] = cleaned;
        }
        return Object.keys(out).length ? out : undefined;
    }

    return value;
};

const cleanRecord = (record) => sanitizeValue(record) || {};

const getByPaths = (obj, paths) => {
    for (const path of paths) {
        const parts = path.split('.');
        let current = obj;

        for (const part of parts) {
            if (!current || typeof current !== 'object') {
                current = undefined;
                break;
            }
            current = current[part];
        }

        if (current !== undefined && current !== null && current !== '') return current;
    }

    return undefined;
};

const flattenLocationMap = (locationMap) => {
    if (!locationMap || typeof locationMap !== 'object') {
        return { location_country_codes: undefined, location_region_codes: undefined };
    }

    const countries = Object.keys(locationMap).filter(Boolean);
    const regions = [];

    for (const values of Object.values(locationMap)) {
        if (!Array.isArray(values)) continue;
        for (const value of values) {
            const clean = normalizeText(value);
            if (clean && !regions.includes(clean)) regions.push(clean);
        }
    }

    return {
        location_country_codes: countries.length ? countries.join(',') : undefined,
        location_region_codes: regions.length ? regions.join(',') : undefined,
    };
};

const pickTranslation = (translations) => {
    if (!translations || typeof translations !== 'object') {
        return {
            translation_language: undefined,
            translated_title: undefined,
            translated_description_text: undefined,
        };
    }

    const entries = Object.entries(translations);
    if (!entries.length) {
        return {
            translation_language: undefined,
            translated_title: undefined,
            translated_description_text: undefined,
        };
    }

    const [langCode, data] = entries[0];
    return {
        translation_language: normalizeText(langCode) || undefined,
        translated_title: normalizeText(data?.title) || undefined,
        translated_description_text: data?.description ? htmlToText(data.description) : undefined,
    };
};

const parseCsv = (value) => {
    if (typeof value !== 'string') return [];
    return value.split(',').map((item) => normalizeText(item)).filter(Boolean);
};

const parseRequiredLanguages = (value) => {
    return parseCsv(value).map((entry) => {
        const match = /^([^()]+)\(([^()]+)\)$/.exec(entry);
        if (!match) {
            return { isoCode: entry, level: 'PROFICIENT' };
        }

        return {
            isoCode: normalizeText(match[1]),
            level: normalizeText(match[2]) || 'PROFICIENT',
        };
    });
};

const createSessionId = () => `${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;

const parseKeywords = (searchParams) => {
    const mapping = [
        ['keywordsEverywhere', 'EVERYWHERE'],
        ['keywordsTitle', 'TITLE'],
        ['keywordsDescription', 'DESCRIPTION'],
        ['keywordsEmployer', 'EMPLOYER'],
        ['keywordsLegalID', 'LEGAL_ID'],
        ['keywordsJvId', 'JOB_VACANCY_ID'],
    ];

    const keywords = [];
    for (const [param, specificSearchCode] of mapping) {
        const raw = searchParams.get(param);
        const keyword = normalizeText(raw);
        if (!keyword) continue;
        keywords.push({ keyword, specificSearchCode });
    }

    return keywords;
};

const parseSourceConfig = (sourceUrl) => {
    const parsed = new URL(sourceUrl);
    const searchParams = parsed.searchParams;

    const pageValue = Number.parseInt(searchParams.get('page') || '1', 10);
    const resultsPerPageValue = Number.parseInt(searchParams.get('resultsPerPage') || '10', 10);

    const lang = normalizeText(searchParams.get('lang')) || 'en';
    const keywords = parseKeywords(searchParams);

    const criteria = {
        keywords,
        publicationPeriod: normalizeText(searchParams.get('publicationPeriod')) || null,
        occupationUris: parseCsv(searchParams.get('escoOccupation')),
        skillUris: parseCsv(searchParams.get('escoSkill')),
        requiredExperienceCodes: parseCsv(searchParams.get('experience')),
        positionScheduleCodes: parseCsv(searchParams.get('positionScheduleCodes')),
        sectorCodes: parseCsv(searchParams.get('sector')),
        educationAndQualificationLevelCodes: parseCsv(searchParams.get('educationAndQualificationLevel')),
        educationGroupCodes: parseCsv(searchParams.get('educationGroupCodes')),
        positionOfferingCodes: parseCsv(searchParams.get('positionOfferingCodes')),
        locationCodes: parseCsv(searchParams.get('locationCodes')),
        euresFlagCodes: parseCsv(searchParams.get('euresFlagCodes')),
        otherBenefitsCodes: parseCsv(searchParams.get('otherBenefitsCodes')),
        requiredLanguages: parseRequiredLanguages(searchParams.get('requiredLanguages')),
        sortSearch: normalizeText(searchParams.get('orderBy')) || 'BEST_MATCH',
        page: Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1,
        resultsPerPage: Number.isFinite(resultsPerPageValue) && resultsPerPageValue > 0
            ? Math.min(resultsPerPageValue, MAX_BATCH_SIZE)
            : 10,
        minNumberPost: Number.isFinite(+searchParams.get('minNumberPost')) ? +searchParams.get('minNumberPost') : null,
        sessionId: createSessionId(),
        requestLanguage: lang,
        userPreferredLanguage: normalizeText(searchParams.get('jvDisplayLanguage')) || lang,
    };

    return {
        sourceUrl,
        lang,
        criteria,
    };
};

const mapApiItem = (raw, sourceUrl) => {
    if (!raw || typeof raw !== 'object') return {};

    const id = getByPaths(raw, ['id', 'jvId', 'jobId', 'vacancyId']);
    const descriptionHtml = sanitizeDescriptionHtml(getByPaths(raw, ['description', 'jobDescription']));
    const locationFlat = flattenLocationMap(raw.locationMap);
    const translationFlat = pickTranslation(raw.translations);
    const jobCategoryCodes = Array.isArray(raw.jobCategoriesCodes) ? raw.jobCategoriesCodes.filter(Boolean) : [];
    const positionScheduleCodes = Array.isArray(raw.positionScheduleCodes) ? raw.positionScheduleCodes.filter(Boolean) : [];
    const availableLanguages = Array.isArray(raw.availableLanguages) ? raw.availableLanguages.filter(Boolean) : [];

    const mapped = {
        title: getByPaths(raw, ['title', 'jobTitle', 'vacancyTitle', 'positionTitle']),
        identifier: id,
        url: id ? `https://europa.eu/eures/portal/jv-se/jv-details/${encodeURIComponent(String(id))}?lang=en` : undefined,
        company: getByPaths(raw, ['company', 'employer.name', 'employerName']),
        publication_date: getByPaths(raw, ['publicationDate', 'publishedDate', 'datePosted']),
        creation_date: getByPaths(raw, ['creationDate']),
        last_modification_date: getByPaths(raw, ['lastModificationDate']),
        number_of_posts: getByPaths(raw, ['numberOfPosts']),
        eures_flag: getByPaths(raw, ['euresFlag']),
        score: getByPaths(raw, ['score']),
        position_offering_code: getByPaths(raw, ['positionOfferingCode']),
        translation_type: getByPaths(raw, ['translationType']),
        employer_name: getByPaths(raw, ['employer.name']),
        job_category_codes: jobCategoryCodes.length ? jobCategoryCodes.join(',') : undefined,
        job_category_primary: jobCategoryCodes.length ? jobCategoryCodes[0] : undefined,
        position_schedule_codes: positionScheduleCodes.length ? positionScheduleCodes.join(',') : undefined,
        available_languages: availableLanguages.length ? availableLanguages.join(',') : undefined,
        description_html: descriptionHtml,
        description_text: descriptionHtml ? htmlToText(descriptionHtml) : undefined,
        summary: descriptionHtml ? htmlToText(descriptionHtml).slice(0, 1200) : undefined,
        location_country_codes: locationFlat.location_country_codes,
        location_region_codes: locationFlat.location_region_codes,
        translation_language: translationFlat.translation_language,
        translated_title: translationFlat.translated_title,
        translated_description_text: translationFlat.translated_description_text,
        source: 'EURES',
        source_url: sourceUrl,
    };

    return cleanRecord(mapped);
};

const requestCandidates = [];
if (Array.isArray(startUrls) && startUrls.length) {
    for (const value of startUrls) {
        if (typeof value === 'string' && value.trim()) requestCandidates.push(value.trim());
        else if (value && typeof value === 'object' && value.url) requestCandidates.push(String(value.url).trim());
    }
}
if (typeof startUrl === 'string' && startUrl.trim()) requestCandidates.push(startUrl.trim());
if (typeof url === 'string' && url.trim()) requestCandidates.push(url.trim());
if (!requestCandidates.length) requestCandidates.push(DEFAULT_START_URL);

const uniqueRequestCandidates = [...new Set(requestCandidates)];
const sourceConfigs = uniqueRequestCandidates.map(parseSourceConfig);

const proxyInput = proxyConfiguration && typeof proxyConfiguration === 'object' ? proxyConfiguration : undefined;
const useApifyProxy = Boolean(proxyInput?.useApifyProxy);
const proxyConf = useApifyProxy
    ? await Actor.createProxyConfiguration({ ...proxyInput, useApifyProxy: true })
    : undefined;

const seenRecordKeys = new Set();
let pendingBatch = [];
let saved = 0;

const flushBatch = async (reason) => {
    if (!pendingBatch.length) return;
    const payload = pendingBatch;
    pendingBatch = [];
    await dataset.pushData(payload);
    saved += payload.length;
    log.info(`Pushed ${payload.length} records in batch (${reason}). Total pushed: ${saved}`);
};

const pushIfAvailable = async (candidate) => {
    if (saved + pendingBatch.length >= RESULTS_WANTED) return;

    const record = cleanRecord(candidate);
    if (!Object.keys(record).length) return;

    const dedupeKey = record.identifier
        || record.url
        || `${record.title || ''}|${record.company || ''}|${record.creation_date || ''}`;
    if (!dedupeKey) return;
    if (seenRecordKeys.has(dedupeKey)) return;

    seenRecordKeys.add(dedupeKey);
    pendingBatch.push(record);

    if (pendingBatch.length >= MAX_BATCH_SIZE) {
        await flushBatch('threshold');
    }
};

const fetchPage = async (criteria, proxyUrl) => {
    const response = await gotScraping.post(API_SEARCH_ENDPOINT, {
        responseType: 'json',
        proxyUrl,
        json: criteria,
        timeout: { request: REQUEST_TIMEOUT_MS },
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0',
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json;charset=UTF-8',
            'Origin': 'https://europa.eu',
            'Referer': 'https://europa.eu/eures/portal/jv-se/search?lang=en',
        },
    });

    return response.body;
};

for (const source of sourceConfigs) {
    if (saved >= RESULTS_WANTED) break;

    log.info(`Processing source: ${source.sourceUrl}`);

    const basePage = Math.max(1, Number(source.criteria.page) || 1);
    const perPage = Math.max(1, Math.min(MAX_BATCH_SIZE, Number(source.criteria.resultsPerPage) || 10));

    for (let pageOffset = 0; pageOffset < MAX_PAGES; pageOffset++) {
        if (saved >= RESULTS_WANTED) break;

        const remaining = RESULTS_WANTED - (saved + pendingBatch.length);
        if (remaining <= 0) break;

        const requestCriteria = {
            ...source.criteria,
            page: basePage + pageOffset,
            resultsPerPage: Math.min(perPage, remaining),
        };

        let data;
        try {
            const proxyUrl = proxyConf ? await proxyConf.newUrl() : undefined;
            data = await fetchPage(requestCriteria, proxyUrl);
        } catch (error) {
            log.error(`Request failed for page ${requestCriteria.page}: ${error.message}`);
            break;
        }

        const items = Array.isArray(data?.jvs) ? data.jvs : [];
        log.info(`Page ${requestCriteria.page}: received ${items.length} jobs`);

        if (!items.length) break;

        for (const item of items) {
            if (saved + pendingBatch.length >= RESULTS_WANTED) break;
            const mapped = mapApiItem(item, API_SEARCH_ENDPOINT);
            await pushIfAvailable(mapped);
        }

        await flushBatch(`page-${requestCriteria.page}`);

        if (items.length < requestCriteria.resultsPerPage) break;
    }
}

await flushBatch('final');
log.info(`Finished. Saved ${saved} job records.`);
await Actor.exit();

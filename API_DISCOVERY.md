## Selected API

- Endpoint: `https://europa.eu/eures/api/jv-searchengine/public/jv-search/search`
- Method: `POST`
- Auth: `None` (public endpoint)
- Pagination: JSON body fields `page` and `resultsPerPage`
- Query controls in payload: `keywords`, `sortSearch`, `locationCodes`, `positionOfferingCodes`, `positionScheduleCodes`, `sectorCodes`, `educationAndQualificationLevelCodes`, `educationGroupCodes`, `requiredExperienceCodes`, `euresFlagCodes`, `otherBenefitsCodes`, `requiredLanguages`, `minNumberPost`, `requestLanguage`, `userPreferredLanguage`

### Verified on March 24, 2026

- Request returned `200 application/json`
- Response shape: `numberRecords`, `jvs`, `facets`
- First page for keyword `admin` returned 10 jobs and over 300k total records

### Key fields in `jvs[]`

- `id`
- `title`
- `description`
- `creationDate`
- `lastModificationDate`
- `numberOfPosts`
- `locationMap`
- `euresFlag`
- `jobCategoriesCodes`
- `positionScheduleCodes`
- `positionOfferingCode`
- `employer`
- `availableLanguages`
- `score`
- `translationType`
- `translations`

## API Ranking (Skill Scoring)

- Returns JSON directly: `+30`
- More than 15 fields: `+25`
- No auth required: `+20`
- Pagination support: `+15`
- Matches and extends current actor fields: `+10`
- **Total score: `100/100`**

## Discovery Notes

- Direct calls to `https://europa.eu/eures/api/jv-searchengine/search` return `401`.
- Public search endpoint lives under `public/jv-search/search` and accepts full criteria via JSON body.
- URLScan public submit/search was limited for anonymous usage in this environment, so endpoint extraction was completed via live bundle/runtime inspection and direct endpoint verification.

## Null and Duplicate Handling

Before pushing to dataset, records are normalized to remove:

- `null`
- `undefined`
- empty strings
- empty arrays
- empty objects

Duplicates are skipped using a de-dup key priority:

1. `identifier`
2. `url`
3. `title|company|creation_date`

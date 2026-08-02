## What does EURES Job Scraper do?

EURES Job Scraper collects structured job vacancy data from EURES, the European employment portal. Provide an EURES search URL with your keywords and filters, set the result and page limits, and receive job records with titles, employers, locations, dates, categories, language information, and descriptions.

The dataset is useful for recruitment research, hiring intelligence, job aggregation, labor market analysis, employer research, and recurring vacancy monitoring across European countries. Results are available through Apify dataset exports and can be connected to other tools through the Apify API, webhooks, or integrations.

## Why use EURES Job Scraper?

- **European hiring coverage** - Collect vacancies published through EURES and organize them into a consistent dataset.
- **Search URL control** - Reuse an EURES results URL with its existing keywords, language, sorting, date, occupation, sector, and location filters.
- **Useful job context** - Capture vacancy identifiers, employers, publication dates, position counts, category codes, schedule codes, language values, and source links.
- **Description-ready records** - Use `description_text` for analysis and `description_html` when the published formatting is useful in a downstream workflow.
- **Clean datasets** - Duplicate vacancies are skipped and empty values are removed from saved records.
- **Repeatable collection** - Set a result limit and page limit for testing, scheduled monitoring, or larger research runs.

## What data can you extract from EURES?

| Field | Type | Description |
|-------|------|-------------|
| `identifier` | String | EURES vacancy identifier. |
| `title` | String | Job or vacancy title. |
| `url` | String | Direct EURES vacancy detail URL. |
| `company` | String | Hiring company or organization. |
| `employer_name` | String | Employer name when provided in the vacancy data. |
| `publication_date` | String | Date shown as the vacancy publication date. |
| `creation_date` | String | Source creation timestamp when available. |
| `last_modification_date` | String | Last source update timestamp when available. |
| `number_of_posts` | Number | Number of positions advertised. |
| `location_country_codes` | String | Comma-separated country codes from the vacancy location data. |
| `location_region_codes` | String | Comma-separated regional codes from the vacancy location data. |
| `job_category_codes` | String | Comma-separated job category codes. |
| `job_category_primary` | String | Primary job category code. |
| `position_schedule_codes` | String | Comma-separated schedule codes, such as full-time values. |
| `position_offering_code` | String | Position offering code when provided. |
| `available_languages` | String | Comma-separated language codes available for the vacancy. |
| `translation_type` | String | Translation type from the source data. |
| `translation_language` | String | Language code for the selected translation. |
| `translated_title` | String | Translated vacancy title when available. |
| `translated_description_text` | String | Plain-text translated description when available. |
| `description_html` | String | Formatted vacancy description using safe published formatting. |
| `description_text` | String | Plain-text vacancy description. |
| `summary` | String | Short text summary derived from the description. |
| `eures_flag` | Boolean | EURES flag value when present in the source data. |
| `score` | Number | Source search score when provided. |
| `source` | String | Source label, normally `EURES`. |
| `source_url` | String | EURES data source URL used for the collection. |

Some fields are optional because employers, countries, and vacancy types do not all publish the same information.

## How to scrape EURES job data

1. Open EURES and create a search with the keywords, country, language, occupation, or other filters you need.
2. Copy the complete EURES search results URL.
3. Paste the URL into the `startUrl` input.
4. Set `results_wanted` and `max_pages` for the size of the run.
5. Start the Actor and review the dataset preview.
6. Export the results as JSON, CSV, Excel, XML, or another Apify-supported format.

The easiest workflow is to prepare the search on EURES first, then pass that URL to the Actor. This keeps the search criteria visible and makes scheduled runs easier to reproduce.

## Input Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `startUrl` | String | No | EURES search URL | Complete EURES search results URL. If omitted, the prefilled EURES search URL is used. |
| `results_wanted` | Integer | No | `20` | Maximum number of vacancy records to save. Accepted range: `1` to `10000`. |
| `max_pages` | Integer | No | `10` | Maximum number of EURES result pages to process. Accepted range: `1` to `200`. |
| `proxyConfiguration` | Object | No | `{ "useApifyProxy": false }` | Optional Apify proxy settings for longer or repeated runs. |

## Usage Examples

### Basic vacancy search

Start with a small EURES search to check the result fields and dataset quality.

```json
{
  "startUrl": "https://europa.eu/eures/portal/jv-se/search?page=1&resultsPerPage=10&orderBy=BEST_MATCH&keywordsEverywhere=admin&lang=en",
  "results_wanted": 20,
  "max_pages": 5
}
```

### Targeted role search

Pass an EURES URL containing a focused title search and collect a larger dataset for recruitment research.

```json
{
  "startUrl": "https://europa.eu/eures/portal/jv-se/search?page=1&resultsPerPage=25&orderBy=BEST_MATCH&keywordsTitle=data%20analyst&lang=en",
  "results_wanted": 100,
  "max_pages": 10
}
```

### Scheduled monitoring run

Use a filtered EURES search URL with a bounded result count and Apify proxy settings for recurring monitoring.

```json
{
  "startUrl": "https://europa.eu/eures/portal/jv-se/search?page=1&resultsPerPage=25&orderBy=PUBLICATION_DATE&publicationPeriod=LAST_7_DAYS&keywordsEverywhere=engineer&lang=en",
  "results_wanted": 200,
  "max_pages": 20,
  "proxyConfiguration": {
    "useApifyProxy": true,
    "apifyProxyGroups": ["RESIDENTIAL"]
  }
}
```

## Sample Output

Each dataset item represents one vacancy. The following example shows the main fields returned by a typical record.

```json
{
  "identifier": "NmU1MjRhN2YtOWUzNy00NjY0LWE1NDAtMTdkM2VmOTA2YzMzIDgx",
  "title": "Site Admin",
  "url": "https://europa.eu/eures/portal/jv-se/jv-details/NmU1MjRhN2YtOWUzNy00NjY0LWE1NDAtMTdkM2VmOTA2YzMzIDgx?lang=en",
  "company": "Enersense Oyj",
  "employer_name": "Enersense Oyj",
  "publication_date": "2026-03-21",
  "creation_date": "2026-03-19T08:02:45.000Z",
  "last_modification_date": "2026-03-21T10:14:09.000Z",
  "number_of_posts": 1,
  "location_country_codes": "FI",
  "location_region_codes": "FI1B",
  "job_category_codes": "3112",
  "job_category_primary": "3112",
  "position_schedule_codes": "FULL_TIME",
  "available_languages": "en,fi",
  "description_html": "Enersense Engineering is currently seeking a Site Admin for a data centre project in Helsinki.",
  "description_text": "Enersense Engineering is currently seeking a Site Admin for a data centre project in Helsinki.",
  "summary": "Enersense Engineering is currently seeking a Site Admin for a data centre project in Helsinki.",
  "eures_flag": true,
  "source": "EURES",
  "source_url": "https://europa.eu/eures/api/jv-searchengine/public/jv-search/search"
}
```

## Tips for best results

- **Validate the search first** - Run 20 to 50 results before increasing the limits.
- **Use a complete URL** - Keep the filters in the EURES URL so scheduled runs repeat the same search.
- **Choose the right description field** - Use `description_text` for natural-language processing, keyword analysis, and reporting. Use `description_html` when formatting matters.
- **Set a reasonable page limit** - A higher `max_pages` can broaden coverage, while a smaller value keeps test runs shorter.
- **Review missing values carefully** - Empty fields usually mean the vacancy source did not publish that information.
- **Schedule repeat runs** - Daily or weekly runs can support hiring trend reports and new-vacancy monitoring.

## Integrations and export formats

- **Google Sheets** - Review vacancies, create hiring trackers, and share reports.
- **Airtable** - Build a searchable vacancy database for recruitment teams.
- **Make or Zapier** - Send new dataset items into alerts, CRM records, or internal workflows.
- **Webhooks** - Notify another service when a run finishes.
- **Apify API** - Read datasets programmatically and connect the Actor to your own application.

Apify datasets can be downloaded as JSON, CSV, Excel, XML, and other supported formats. JSON is useful for applications and data pipelines, CSV is convenient for spreadsheet analysis, and Excel is suitable for business reporting.

## Frequently Asked Questions

### Can I use any EURES search URL?

Yes. Copy a public EURES search results URL and provide it as `startUrl`. The Actor uses the search criteria contained in that URL.

### How many vacancies can I collect?

You can request up to `10000` records in one run, subject to the number of matching vacancies and the `max_pages` limit.

### What happens if a vacancy does not include salary or location details?

The record can still be saved. EURES vacancies differ in the information employers publish, so optional fields may be absent.

### What is the difference between `description_html` and `description_text`?

`description_html` preserves supported published formatting, while `description_text` contains a clean plain-text version for analysis and search.

### Is proxy configuration required?

No. Short test runs can use the default setting. For larger or repeated runs, you can configure Apify Proxy in `proxyConfiguration` when needed.

### Can I schedule EURES vacancy monitoring?

Yes. Create an Apify schedule for the Actor and reuse the same `startUrl`, result limit, and page limit on each run.

### Is it legal to collect EURES job data?

You are responsible for using the data lawfully. Follow EURES terms, applicable privacy and data-protection rules, and any restrictions that apply to your intended use.

## Related Actors

- [APEC Jobs Scraper](https://apify.com/shahidirfan/apec-jobs-scraper) - Collect French executive and professional vacancies from APEC.fr.
- [Stepstone Job Scraper](https://apify.com/shahidirfan/stepstone-job-scraper) - Extract job listings from Stepstone.de for German and European hiring research.
- [Learn4Good Job Scraper](https://apify.com/shahidirfan/learn4good-job-scraper) - Collect worldwide job postings, teaching roles, and career listings from Learn4Good.

## Support

For issues, missing fields, or feature requests, use the Issues tab on the Actor page in Apify Console. Include the input URL, run details, and an example of the affected record when reporting a problem.

## Legal Notice

This Actor is intended for legitimate collection and analysis of publicly available vacancy information. Users are responsible for complying with EURES terms, applicable laws, privacy requirements, and the rules of any system where the exported data is used.

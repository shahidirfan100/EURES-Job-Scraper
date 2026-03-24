# EURES Job Scraper

Extract EURES job vacancy data fast and reliably for recruitment research, labor market analysis, and lead generation. Collect structured job records with titles, companies, locations, posting dates, and description content in a format ready for dashboards, spreadsheets, and automation. Use it to gather fresh European job listings at scale with minimal setup.

## Features

- **Targeted vacancy collection** — Collect job listings directly from EURES search result pages.
- **Structured job dataset** — Export normalized fields for titles, employers, locations, and dates.
- **Rich description capture** — Get both formatted and plain-text description variants for each vacancy.
- **Duplicate-safe output** — Keep datasets clean with consistent record deduplication.
- **Run-size control** — Limit collection volume with configurable result and page limits.

## Use Cases

### Recruitment Research
Track open roles by job title, employer, and country to understand current hiring activity. Build reusable datasets for sourcing strategy and staffing operations.

### Labor Market Intelligence
Monitor hiring demand across regions and categories using publication and location fields. Compare trends over time to identify high-growth roles and markets.

### Employer Lead Generation
Find organizations that are actively hiring and prioritize outreach based on role type and geography. Turn job signals into prospecting lists for sales and partnerships.

### Reporting and Content Workflows
Create weekly hiring reports, internal briefings, and market updates from fresh vacancy records. Feed clean data into BI tools and newsletter workflows.

---

## Input Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `startUrl` | String | No | EURES search URL | EURES search URL where collection starts. |
| `results_wanted` | Integer | No | `20` | Maximum number of vacancies to save. |
| `max_pages` | Integer | No | `10` | Maximum number of listing pages to process. |
| `proxyConfiguration` | Object | No | — | Proxy settings for more stable runs. |

---

## Output Data

Each item in the dataset contains:

| Field | Type | Description |
|-------|------|-------------|
| `identifier` | String | EURES vacancy identifier. |
| `title` | String | Vacancy title. |
| `company` | String | Hiring organization name. |
| `url` | String | Vacancy detail URL. |
| `publication_date` | String | Publication date shown for the vacancy. |
| `creation_date` | String | Source creation timestamp. |
| `last_modification_date` | String | Last update timestamp from source data. |
| `number_of_posts` | Number | Number of open positions. |
| `location_country` | String | Country displayed in the listing. |
| `location_region` | String | Region or locality displayed in the listing. |
| `location_country_codes` | String | Flattened country code list. |
| `location_region_codes` | String | Flattened region code list. |
| `job_category_codes` | String | Comma-joined job category codes. |
| `job_category_primary` | String | Primary job category code. |
| `position_schedule_codes` | String | Comma-joined schedule codes. |
| `position_offering_code` | String | Offering type code. |
| `available_languages` | String | Comma-joined available language codes. |
| `translation_type` | String | Translation type value. |
| `translation_language` | String | Translation language key. |
| `translated_title` | String | Translated title value. |
| `translated_description_text` | String | Plain-text translated description. |
| `description_html` | String | Formatted vacancy description markup. |
| `description_text` | String | Plain-text vacancy description. |
| `summary` | String | Vacancy summary text. |
| `eures_flag` | Boolean | EURES flag value from source data. |
| `employer_name` | String | Employer name from nested source fields. |
| `source` | String | Source label. |
| `source_url` | String | Source request URL used for extraction. |

---

## Usage Examples

### Basic Extraction

Collect a small batch to validate your filters and output shape:

```json
{
  "startUrl": "https://europa.eu/eures/portal/jv-se/search?page=1&resultsPerPage=10&orderBy=BEST_MATCH&keywordsEverywhere=admin&lang=en",
  "results_wanted": 20,
  "max_pages": 5
}
```

### Market Monitoring Run

Collect a broader dataset for trend tracking and weekly reporting:

```json
{
  "startUrl": "https://europa.eu/eures/portal/jv-se/search?page=1&resultsPerPage=10&orderBy=BEST_MATCH&keywordsEverywhere=engineer&lang=en",
  "results_wanted": 200,
  "max_pages": 20
}
```

### Reliable Production Run

Enable proxy support for repeated or longer collections:

```json
{
  "startUrl": "https://europa.eu/eures/portal/jv-se/search?page=1&resultsPerPage=10&orderBy=BEST_MATCH&keywordsEverywhere=healthcare&lang=en",
  "results_wanted": 100,
  "max_pages": 10,
  "proxyConfiguration": {
    "useApifyProxy": true,
    "apifyProxyGroups": ["RESIDENTIAL"]
  }
}
```

---

## Sample Output

```json
{
  "identifier": "NmU1MjRhN2YtOWUzNy00NjY0LWE1NDAtMTdkM2VmOTA2YzMzIDgx",
  "title": "Site Admin",
  "company": "Enersense Oyj",
  "url": "https://europa.eu/eures/portal/jv-se/jv-details/NmU1MjRhN2YtOWUzNy00NjY0LWE1NDAtMTdkM2VmOTA2YzMzIDgx?lang=en",
  "publication_date": "2026-03-21",
  "creation_date": "2026-03-19T08:02:45.000Z",
  "last_modification_date": "2026-03-21T10:14:09.000Z",
  "number_of_posts": 1,
  "location_country": "Finland",
  "location_region": "Helsinki",
  "job_category_codes": "3112",
  "position_schedule_codes": "FULL_TIME",
  "description_text": "Enersense Engineering is currently seeking a Site Admin for a data centre project in Helsinki.",
  "summary": "Site Admin role supporting a data centre project in Helsinki.",
  "source": "EURES",
  "source_url": "https://europa.eu/eures/api/jv-searchengine/search"
}
```

---

## Tips for Best Results

### Start with Small Batches
- Use `results_wanted` between `20` and `50` for first-run validation.
- Confirm field coverage before scaling to larger runs.

### Use Focused Search URLs
- Start from a working EURES search page with relevant keywords.
- Narrow geography or job intent to improve data relevance.

### Balance Coverage and Speed
- Increase `max_pages` only when you need broader market coverage.
- Keep page limits bounded for faster, more predictable runs.

### Choose the Right Description Field
- Use `description_text` for NLP, analytics, and keyword clustering.
- Use `description_html` when formatted content is required downstream.

---

## Proxy Configuration

For reliable collection at scale, residential proxies are recommended:

```json
{
  "proxyConfiguration": {
    "useApifyProxy": true,
    "apifyProxyGroups": ["RESIDENTIAL"]
  }
}
```

---

## Integrations

Connect your dataset with:

- **Google Sheets** — Build live hiring trackers and shareable reports.
- **Airtable** — Create searchable vacancy databases for teams.
- **Make** — Trigger automations after each successful run.
- **Zapier** — Route new vacancy data into CRMs and alerts.
- **Webhooks** — Send records to internal APIs and custom workflows.

### Export Formats

- **JSON** — Best for APIs, scripts, and programmatic pipelines.
- **CSV** — Best for spreadsheet analysis and quick filtering.
- **Excel** — Best for business reporting and stakeholder sharing.
- **XML** — Best for legacy systems and structured integrations.

---

## Frequently Asked Questions

### How many vacancies can I collect?
You can collect up to your configured `results_wanted` limit, constrained by available listings and `max_pages`.

### Why are some fields empty in certain records?
Vacancy details vary by employer and country, so some fields may not be available for every listing.

### What is the difference between `description_html` and `description_text`?
`description_html` keeps formatting, while `description_text` is the plain-text version for analysis.

### Can I use my own EURES search page URL?
Yes. Set your target EURES search page in `startUrl`.

### Should I always enable proxies?
For short test runs, proxy may not be necessary. For larger or repeated runs, proxy improves reliability.

### Is this suitable for recurring monitoring?
Yes. Run it on a schedule to maintain a fresh dataset for ongoing hiring intelligence.

---

## Support

For issues or feature requests, use the Issues tab in the actor repository or contact support through Apify Console.

### Resources

- [Apify Documentation](https://docs.apify.com/)
- [Apify API Reference](https://docs.apify.com/api/v2)
- [Apify Scheduling](https://docs.apify.com/platform/schedules)

---

## Legal Notice

This actor is intended for legitimate data collection and market research workflows. You are responsible for complying with website terms, data usage policies, and applicable local laws in your jurisdiction.

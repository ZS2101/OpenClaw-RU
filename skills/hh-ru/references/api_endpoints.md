# HeadHunter API — Endpoint Reference

Base URL: `https://api.hh.ru/`
All endpoints use HTTPS, return JSON. Pagination via `page` (0-based) and `per_page` (max 100, default 20).
User-Agent header is required; use `User-Agent: OpenClaw/1.0 (agent@example.com)`.

## Auth Levels

| Badge   | Meaning                                |
| ------- | -------------------------------------- |
| 🔓 anon | No auth required                       |
| 🔐 app  | Client credentials (application token) |
| 👤 user | OAuth2 user token (applicant)          |
| 🏢 emp  | OAuth2 employer/manager token          |

## Vacancies (Public)

### GET /vacancies — Search

🔓 anon
Params: `text` (query string), `area` (area id), `experience` (noExperience, between1And3, between3And6, moreThan6), `employment` (full, part, project, volunteer, probation), `schedule` (fullDay, shift, flexible, remote, flyInFlyOut), `salary` (int), `currency` (RUR, USD, EUR), `only_with_salary` (bool), `professional_role` (int), `order_by` (relevance, salary_asc, salary_desc, publication_time), `search_field` (name, company_name, description), `clusters` (bool), `per_page`, `page`

Example: `GET /vacancies?text=python+developer&area=1&experience=between1And3&per_page=20`

Returns: `{ items: [...], found: 1234, pages: 62, page: 0, per_page: 20 }`

### GET /vacancies/{id} — Single vacancy

🔓 anon
Returns full vacancy object with description, key_skills, branded_description, etc.

### GET /vacancies?similar_to={id} — Similar vacancies

🔓 anon

## Vacancies (Employer)

All require 🏢 emp token.

| Method | Path                       | Description         |
| ------ | -------------------------- | ------------------- |
| POST   | /vacancies                 | Publish vacancy     |
| PUT    | /vacancies/{id}            | Edit vacancy        |
| POST   | /vacancies/{id}/prolongate | Prolongate          |
| DELETE | /vacancies/{id}            | Move to hidden      |
| GET    | /vacancies/active          | List published      |
| GET    | /vacancies/archived        | List archived       |
| GET    | /vacancies/hidden          | List hidden         |
| POST   | /vacancies/{id}/archive    | Archive             |
| POST   | /vacancies/{id}/restore    | Restore from hidden |
| GET    | /vacancies/{id}/stats      | Statistics          |
| GET    | /vacancies/{id}/visitors   | Views               |

## Employers / Companies

### GET /employers — Search employers

🔓 anon
Params: `text`, `area`, `type` (company, private_person, agency), `only_with_vacancies`, `per_page`, `page`

### GET /employers/{id} — Company info

🔓 anon
Returns company details, logo URLs, industries, open vacancies count, etc.

### GET /employers/{id}/vacancies — Company vacancies

🔓 anon

## Resumes (Applicant)

### GET /resumes/mine — My resumes

👤 user
Returns list of applicant's own resumes.

### GET /resumes/{id} — Resume detail

👤 user (owner) or 🏢 emp (with access)

## Resumes (Employer Search)

### GET /resumes — Search resume database

🏢 emp
Params: `text`, `area`, `specialization`, `experience`, `gender`, `age_from`, `age_to`, `salary`, `currency`, `relocation`, `education_level`, `search_field`, `order_by`, `per_page`, `page`

## Dictionaries / Справочники

### GET /dictionaries — All dictionaries

🔓 anon
Returns all reference data: experience, employment, schedule, industries, professional_roles, languages, etc.

### GET /areas — Region tree

🔓 anon
Full tree of regions (countries → regions → cities). `GET /areas/{id}` for a subtree.

### GET /specializations — Professional areas & specializations

🔓 anon

### GET /metro — Metro stations

🔓 anon
Params: `city` (int, required)

## Suggests / Подсказки (Autocomplete)

### GET /suggests/educational_institutions

🔓 anon — `?text=мгу`

### GET /suggests/companies

🔓 anon — `?text=сбер`

### GET /suggests/areas

🔓 anon — `?text=мос`

### GET /suggests/fields_of_study

🔓 anon — `?text=информ`

### GET /suggests/skill_set

🔓 anon — `?text=python`

### GET /suggests/positions

🔓 anon — `?text=разраб`

### GET /suggests/vacancy_search_keyword

🔓 anon — `?text=python`

### GET /suggests/resume_search_keyword

👤 user — `?text=python`

## Negotiations / Отклики

### GET /negotiations — List responses

👤 user — applicant's responses to vacancies

### POST /negotiations — Respond to vacancy

👤 user — body: `{ vacancy_id, resume_id, message }`

### GET /negotiations/{id} — Single response details

👤 user

### PUT /negotiations/active — Employer actions on responses

🏢 emp — invite, reject, etc.

## Salary Statistics

### GET /salary_statistics/dictionaries/salary_rates

🔓 anon — Get available salary currencies and rates

## Rate Limits

- Anonymous: ~100 req/min
- Authorized (app): ~500 req/min
- Authorized (user): depends on token scope

Headers in response: `X-Ratelimit-Remaining`, `X-Ratelimit-Reset`

## Error Responses

```json
{
  "errors": [
    {
      "type": "bad_request",
      "value": "error description"
    }
  ],
  "description": "Human-readable description"
}
```

HTTP 429 = rate limit exceeded. HTTP 403 = insufficient permissions.

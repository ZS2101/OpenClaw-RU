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

## OAuth2 / Авторизация

### GET https://hh.ru/oauth/authorize — Authorization request

🔓 anon — User opens this URL in browser. Parameters:

- `response_type=code` (required)
- `client_id` (required, from dev.hh.ru app)
- `redirect_uri` (optional, must match app settings)
- `state` (optional, passed back to redirect URI)

User authorizes on hh.ru → hh.ru redirects to `redirect_uri?code=AUTHORIZATION_CODE`.

### POST /token — Get token

🔓 anon — Exchange authorization code for tokens. Parameters:

- `grant_type=authorization_code` (for user token)
- `client_id`, `client_secret`
- `code` (from redirect URI)
- `redirect_uri` (must match)

Response: `{ "access_token": "...", "refresh_token": "...", "token_type": "bearer", "expires_in": 1209600 }`
Token lifetime: 14 days.

Refresh: `grant_type=refresh_token` with `refresh_token` param.

App-level: `grant_type=client_credentials` — no user context, limited access.

### DELETE /token — Invalidate token

👤 user | 🏢 emp — Revoke the current access token.

### GET /me — Current user info

👤 user | 🏢 emp — Returns info about the authorized user/employer/application.

---

## Vacancies (Public)

### GET /vacancies — Search

🔓 anon
Params: `text` (query), `area` (area id), `experience` (noExperience, between1And3, between3And6, moreThan6), `employment` (full, part, project, volunteer, probation), `schedule` (fullDay, shift, flexible, remote, flyInFlyOut), `salary` (int), `currency` (RUR, USD, EUR), `only_with_salary` (bool), `professional_role` (int), `order_by` (relevance, salary_asc, salary_desc, publication_time), `search_field` (name, company_name, description), `clusters` (bool), `per_page`, `page`

Returns: `{ items: [...], found: N, pages: N, page: N, per_page: N }`

### GET /vacancies/{vacancy_id} — Single vacancy

🔓 anon — Returns full vacancy object with description, key_skills, branded_description.

### GET /vacancies/{vacancy_id}/similar_vacancies — Similar vacancies

🔓 anon

### GET /vacancies/{vacancy_id}/related_vacancies — Related vacancies

🔓 anon

---

## Vacancies (Employer)

All require 🏢 emp token.

| Method | Path                                                     | Description                       |
| ------ | -------------------------------------------------------- | --------------------------------- |
| POST   | /vacancies                                               | Publish vacancy                   |
| PUT    | /vacancies/{vacancy_id}                                  | Edit vacancy                      |
| GET    | /vacancies/{vacancy_id}/prolongate                       | Check if prolongation is possible |
| POST   | /vacancies/{vacancy_id}/prolongate                       | Prolongate vacancy                |
| GET    | /employers/{employer_id}/vacancies/active                | List published                    |
| GET    | /employers/{employer_id}/vacancies/archived              | List archived                     |
| PUT    | /employers/{employer_id}/vacancies/archived/{vacancy_id} | Archive vacancy                   |
| GET    | /employers/{employer_id}/vacancies/hidden                | List hidden                       |
| PUT    | /employers/{employer_id}/vacancies/hidden/{vacancy_id}   | Hide/delete vacancy               |
| DELETE | /employers/{employer_id}/vacancies/hidden/{vacancy_id}   | Restore from hidden               |
| GET    | /vacancies/{vacancy_id}/stats                            | Statistics                        |
| GET    | /vacancies/{vacancy_id}/visitors                         | Views                             |
| GET    | /vacancies/{vacancy_id}/upgrades                         | Available upgrades for vacancy    |

### GET /vacancy_conditions — Field conditions

🏢 emp — Conditions for fields when creating/editing vacancies (required fields, limits).

### Vacancy drafts

| Method | Path                                    | Description             |
| ------ | --------------------------------------- | ----------------------- |
| POST   | /vacancies/drafts                       | Create draft            |
| GET    | /vacancies/drafts                       | List drafts             |
| GET    | /vacancies/drafts/{draft_id}            | Get draft               |
| PUT    | /vacancies/drafts/{draft_id}            | Edit draft              |
| DELETE | /vacancies/drafts/{draft_id}            | Delete draft            |
| POST   | /vacancies/drafts/{draft_id}/publish    | Publish draft           |
| GET    | /vacancies/drafts/{draft_id}/duplicates | Check for duplicates    |
| DELETE | /vacancies/auto_publication             | Cancel auto-publication |

### Preferred negotiations order

🔓 anon/🏢 emp

- `GET /vacancies/{vacancy_id}/preferred_negotiations_order` — View sorting preference
- `PUT /vacancies/{vacancy_id}/preferred_negotiations_order` — Update sorting preference

---

## Employers / Companies

### GET /employers — Search employers

🔓 anon
Params: `text`, `area`, `type` (company, private_person, agency), `only_with_vacancies`, `per_page`, `page`

### GET /employers/{employer_id} — Company info

🔓 anon — Returns company details, logo URLs, industries, open vacancies count.

### GET /employers/{employer_id}/vacancies/active — Company vacancies

🔓 anon

### Employer addresses

🏢 emp

- `GET /employers/{employer_id}/addresses` — List addresses
- `GET /employers/{employer_id}/addresses/{address_id}` — Get address

### Employer departments

🏢 emp — `GET /employers/{employer_id}/departments` — Departments list.

### Employer tests

🏢 emp — `GET /employers/{employer_id}/tests` — Tests list.

### Employer vacancy areas

🏢 emp — `GET /employers/{employer_id}/vacancy_areas/active` — Regions with active vacancies.

### Employer branded templates

🏢 emp — `GET /employers/{employer_id}/vacancy_branded_templates` — Branded vacancy templates.

---

## Employer Managers

All 🏢 emp.

| Method | Path                                                                     | Description                         |
| ------ | ------------------------------------------------------------------------ | ----------------------------------- |
| GET    | /employers/{employer_id}/manager_types                                   | Manager types & permissions         |
| GET    | /employers/{employer_id}/managers                                        | List managers                       |
| POST   | /employers/{employer_id}/managers                                        | Add manager                         |
| GET    | /employers/{employer_id}/managers/{manager_id}                           | Get manager                         |
| PUT    | /employers/{employer_id}/managers/{manager_id}                           | Edit manager                        |
| DELETE | /employers/{employer_id}/managers/{manager_id}                           | Delete manager                      |
| GET    | /employers/{employer_id}/managers/{manager_id}/limits/resume             | Daily resume view limit             |
| GET    | /employers/{employer_id}/managers/{manager_id}/method_access             | Check paid method access            |
| GET    | /employers/{employer_id}/managers/{manager_id}/negotiations_statistics   | Manager response stats              |
| GET    | /employers/{employer_id}/managers/{manager_id}/settings                  | Manager preferences                 |
| GET    | /employers/{employer_id}/managers/{manager_id}/vacancies/available_types | Available vacancy publication types |
| GET    | /manager_accounts/mine                                                   | My manager accounts                 |

---

## Employer Services & Stats

🏢 emp

- `GET /employers/{employer_id}/services/available_publications` — Available publication options
- `GET /employers/{employer_id}/services/payable_api_actions/active` — Active paid API services
- `GET /employers/{employer_id}/negotiations_statistics` — Response statistics

---

## Negotiations / Отклики и переписка

### Applicant-side

👤 user — All responses/negotiations of the applicant.

| Method | Path                         | Description             |
| ------ | ---------------------------- | ----------------------- |
| GET    | /negotiations                | List responses          |
| POST   | /negotiations                | Respond to vacancy      |
| GET    | /negotiations/{id}           | Single response details |
| PUT    | /negotiations/{id}           | Edit cover letter       |
| GET    | /negotiations/{nid}/messages | Read messages           |
| POST   | /negotiations/{nid}/messages | Send message            |

POST /negotiations body: `{ "vacancy_id": "...", "resume_id": "...", "message": "..." }`

- `vacancy_id` — required, from search results
- `resume_id` — required, from `GET /resumes/mine`
- `message` — optional cover letter, max ~2000 chars

### Employer-side

🏢 emp

| Method | Path                                  | Description                                 |
| ------ | ------------------------------------- | ------------------------------------------- |
| GET    | /negotiations                         | List responses (by vacancy_id, status, etc) |
| PUT    | /negotiations/{id}                    | Perform actions: invite, reject, etc        |
| GET    | /negotiations/{nid}/messages          | Read messages with applicant                |
| POST   | /negotiations/{nid}/messages          | Send message to applicant                   |
| POST   | /negotiations/phone_interview         | Invite applicant to phone interview         |
| POST   | /negotiations/read                    | Mark responses as read                      |
| GET    | /negotiations/response                | Get response collection                     |
| PUT    | /negotiations/{collection_name}/{nid} | Action on collection response               |
| GET    | /negotiations/{nid}/test/solution     | Get attached test results                   |

### Negotiations history per resume

🏢 emp — `GET /resumes/{resume_id}/negotiations_history` — History of responses for a specific resume.

---

## Mail Templates (Employer responses)

🏢 emp

| Method | Path                                                  | Description                       |
| ------ | ----------------------------------------------------- | --------------------------------- |
| GET    | /employers/{employer_id}/mail_templates               | List response templates           |
| PUT    | /employers/{employer_id}/mail_templates/{template_id} | Edit template                     |
| GET    | /message_templates/{template}                         | Templates for a specific response |

These are pre-saved message templates for quick responses to applicants (invitations, rejections, etc.).

---

## Applicant Comments

🏢 emp — Comments on applicants (visible only within the company).

| Method | Path                                            | Description    |
| ------ | ----------------------------------------------- | -------------- |
| GET    | /applicant_comments/{applicant_id}              | List comments  |
| POST   | /applicant_comments/{applicant_id}              | Add comment    |
| PUT    | /applicant_comments/{applicant_id}/{comment_id} | Edit comment   |
| DELETE | /applicant_comments/{applicant_id}/{comment_id} | Delete comment |

---

## Resumes (Applicant)

### GET /resumes/mine — My resumes

👤 user — Returns list of applicant's own resumes.

### GET /resumes/{resume_id} — Resume detail

👤 user (owner) or 🏢 emp (with access)

---

## Resumes (Employer Search)

### GET /resumes — Search resume database

🏢 emp
Params: `text`, `area`, `specialization`, `experience`, `gender`, `age_from`, `age_to`, `salary`, `currency`, `relocation`, `education_level`, `search_field`, `order_by`, `per_page`, `page`

### Saved searches

🏢 emp

| Method | Path                                                            | Description                        |
| ------ | --------------------------------------------------------------- | ---------------------------------- |
| GET    | /saved_searches/resumes                                         | List saved searches                |
| POST   | /saved_searches/resumes                                         | Create saved search                |
| GET    | /saved_searches/resumes/{id}                                    | Get saved search                   |
| PUT    | /saved_searches/resumes/{id}                                    | Update saved search                |
| DELETE | /saved_searches/resumes/{id}                                    | Delete saved search                |
| PUT    | /saved_searches/resumes/{saved_search_id}/managers/{manager_id} | Transfer search to another manager |

---

## Chats / Чаты

👤 user | 🏢 emp

| Method | Path                                              | Description                        |
| ------ | ------------------------------------------------- | ---------------------------------- |
| GET    | /common/chats                                     | List chats                         |
| GET    | /common/chats/counters/unread                     | Unread message count               |
| GET    | /common/chats/files/conditions                    | File requirements for chat uploads |
| POST   | /common/chats/files/upload_links                  | Get file upload link               |
| POST   | /common/chats/without_vacancy                     | Create chat without vacancy        |
| GET    | /common/chats/{chat_id}/messages                  | Get messages                       |
| POST   | /common/chats/{chat_id}/messages                  | Send message                       |
| PUT    | /common/chats/{chat_id}/messages/{message_id}     | Edit message                       |
| DELETE | /common/chats/{chat_id}/messages/{message_id}     | Delete message                     |
| PUT    | /common/chats/{chat_id}/message/{message_id}/read | Mark message read                  |
| GET    | /common/chats/{chat_id}/participants              | Get participants                   |
| PUT    | /common/chats/{chat_id}/participants              | Add participant                    |
| PUT    | /common/chats/{chat_id}/leave                     | Leave chat                         |
| PUT    | /common/chats/{chat_id}/write_possibility         | Allow/deny applicant to write      |

---

## Dictionaries / Справочники

All 🔓 anon.

| Method | Path                                     | Description                                                                                      |
| ------ | ---------------------------------------- | ------------------------------------------------------------------------------------------------ |
| GET    | /dictionaries                            | All reference data (experience, employment, schedule, industries, professional_roles, languages) |
| GET    | /areas                                   | Full region tree (countries → regions → cities)                                                  |
| GET    | /areas/{area_id}                         | Subtree from area                                                                                |
| GET    | /areas/countries                         | Countries dictionary                                                                             |
| GET    | /industries                              | Company industries                                                                               |
| GET    | /languages                               | All languages                                                                                    |
| GET    | /locales                                 | Available locales                                                                                |
| GET    | /locales/resume                          | Locales for resumes                                                                              |
| GET    | /specializations                         | Professional areas & specializations                                                             |
| GET    | /professional_roles                      | Professional roles                                                                               |
| GET    | /skills                                  | Key skills dictionary                                                                            |
| GET    | /metro                                   | Metro stations (all cities)                                                                      |
| GET    | /metro/{city_id}                         | Metro stations in city                                                                           |
| GET    | /districts                               | Districts in all cities                                                                          |
| GET    | /educational_institutions                | Educational institutions                                                                         |
| GET    | /educational_institutions/{id}/faculties | Faculties of an institution                                                                      |

---

## Suggests / Подсказки (Autocomplete)

All 🔓 anon unless noted.

| Method | Path                               | Auth    |
| ------ | ---------------------------------- | ------- |
| GET    | /suggests/areas                    | 🔓      |
| GET    | /suggests/area_leaves              | 🔓      |
| GET    | /suggests/companies                | 🔓      |
| GET    | /suggests/educational_institutions | 🔓      |
| GET    | /suggests/fields_of_study          | 🔓      |
| GET    | /suggests/skill_set                | 🔓      |
| GET    | /suggests/positions                | 🔓      |
| GET    | /suggests/vacancy_positions        | 🔓      |
| GET    | /suggests/vacancy_search_keyword   | 🔓      |
| GET    | /suggests/professional_roles       | 🔓      |
| GET    | /suggests/resume_search_keyword    | 👤 user |

Param: `text` (required) for all suggests.

---

## Salary Statistics / Зарплатная статистика

### GET /salary_statistics/dictionaries/salary_rates

🔓 anon — Available salary currencies and rates.

🔐 app / 🏢 emp (paid):

- `GET /salary_statistics/dictionaries/employee_levels` — Competency levels
- `GET /salary_statistics/dictionaries/professional_areas` — Professional areas & specializations
- `GET /salary_statistics/dictionaries/salary_areas` — Regions & cities
- `GET /salary_statistics/dictionaries/salary_industries` — Industries
- `GET /salary_statistics/paid/salary_evaluation/{area_id}` — Salary evaluation (no forecast)

---

## Clickme Ads

🏢 emp — `GET /clickme/statistics` — Ad campaign statistics.

---

## Webhook API

👤 user | 🏢 emp

| Method | Path                                     | Description                |
| ------ | ---------------------------------------- | -------------------------- |
| POST   | /webhook/subscriptions                   | Subscribe to notifications |
| GET    | /webhook/subscriptions                   | List subscriptions         |
| PUT    | /webhook/subscriptions/{subscription_id} | Edit subscription          |
| DELETE | /webhook/subscriptions/{subscription_id} | Delete subscription        |

---

## Rate Limits

- Anonymous: ~100 req/min
- Authorized (app): ~500 req/min
- Authorized (user): depends on token scope

Headers: `X-Ratelimit-Remaining`, `X-Ratelimit-Reset`

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

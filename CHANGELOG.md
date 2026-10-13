# Changelog

## 0.2.0

- Renamed the npm package from `n8n-nodes-joinpoint` to `n8n-nodes-joinpoints`
  (matching the actual product name, "Joinpoints") ahead of the first public
  release and n8n community node verification submission.
- Reworked the node from 3 basic operations into 6 resources with a total of
  ~16 operations: `New / Create`, `Change`, `Get Information`, `Get Statistic`,
  `Commercial Document`, and `Structure`.
- Joinpoint references (target joinpoint, user, team, template, etc.) now use
  resourceLocator fields with a searchable "From List" mode (backed by the
  `/search` endpoint) plus a manual "ID" mode.
- Authentication now uses a `Joinpoints API` credential (App ID, Access Key,
  Secret). The node fetches a fresh access token once per execution and reuses
  it for every item in that run — no external auth sub-workflow, and no
  persisted/cached token between runs (e.g. no Data Table) — see
  [Authentication](README.md#authentication).
  An earlier iteration of this version used a manually supplied `Access
  Token` parameter fed from an external auth sub-workflow; that was replaced
  by the per-run credential-based fetch described above.
- Replaced the placeholder icon with the actual Joinpoints logo mark
  (`nodes/Joinpoint/joinpoint.svg`).

## 0.1.0

- Initial release of the Joinpoint node.
- Operations: Get, Get Statistic, List.

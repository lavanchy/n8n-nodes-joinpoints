# n8n-nodes-joinpoints

This is an n8n community node. It lets you interact with the [Joinpoints](https://app.joinpoints.io/) API in your n8n workflows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Authentication](#authentication)
[Compatibility](#compatibility)
[Usage](#usage)
[Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

- **New / Create**
    - **Create** — create a new joinpoint under a destination joinpoint, optionally based on a template
    - **Post** — add a timeline entry to a joinpoint (or create a new joinpoint within its timeline), optionally with file attachments
- **Change**
    - **Assign Team** — assign a team to a joinpoint
    - **Assign User** — assign or remove a user from a joinpoint
    - **Update** — update one or more joinpoint properties
    - **Update Relation** — add or remove joinpoints from a custom multi-joinpoint relation attribute
- **Get Information**
    - **Get** — return basic details of a joinpoint
    - **Get All Details** — return all details of a joinpoint
    - **List** — list joinpoints with basic details, filtered by optional parameters
    - **List Content** — return all timeline entries of a joinpoint
    - **List Full** — list joinpoints with full details, filtered by optional parameters
    - **Search** — search joinpoints by a query string in a given property
- **Get Statistic**
    - **Get** — return runtime statistics of a joinpoint
- **Commercial Document**
    - **List** — list commercial documents (e.g. invoices, offers), optionally filtered by joinpoint, type, and date range
- **Structure**
    - **List Directories** — list all pipelines, archives, and lists in the Joinpoints account
    - **Get Template Meta** — get a template's metadata, including its attributes (internal names, data types, required flags)

Fields that reference another joinpoint (e.g. the target joinpoint, a user, or a team) use a resource locator: pick one from a searchable list (backed by the Joinpoints `/search` endpoint) or enter its ID directly.

### Filtering by a custom attribute (List / List Full)

The **Custom Filters** field under List / List Full filters by a template's custom attributes (find their `internal_name` via **Structure → Get Template Meta**, e.g. `c_115`):

- **Equals** sends the field's full `internal_name` as-is, e.g. `c_115` or `test_attribute_1` filters on `_fc_c_115` / `_fc_test_attribute_1`. This is the only operator documented in the official [Joinpoints API docs](https://app.joinpoints.io/res/swagger/joinpoints-JoinpointsAPI-1-1-swagger.json).
- **At Least (Min)** / **At Most (Max)** are **not documented by Joinpoints** — this behavior was found by testing against the live API. They only work on custom attributes, and only with the attribute's **numeric ID**, not its `c_`-prefixed `internal_name`: for an attribute with `internal_name` `c_115`, the node sends `_fc_115_min` / `_fc_115_max` (the node strips the `c_` prefix for you — just enter `c_115` as the Field Internal Name and pick Min/Max). Sending the full `c_115_min` as the field name instead of the bare numeric ID makes the request fail with a server error, not just "no match" — this is a backend quirk, not a formatting choice.

## Authentication

This node uses a **Joinpoints API** credential (App ID, Access Key, Secret). At the start of each execution, the node calls Joinpoint's OAuth-style endpoint (`GET /api/oauth/auth`, implicit grant) once to obtain an access token, then reuses that same token for every item/operation in that run. The token is **not** persisted or cached anywhere (e.g. no Data Table) — each new execution fetches its own fresh token.

## Compatibility

Requires n8n with community nodes API version 1 support (`n8nNodesApiVersion: 1`). No other n8n features (e.g. Data Tables) are required.

## Usage

1. Create a **Joinpoints API** credential with your App ID, Access Key, and Secret.
2. Add the Joinpoints node, select the credential, a **Resource**, and an **Operation**.
3. Fill in the remaining resource/operation-specific parameters. For joinpoint references, either search and pick from the list or switch to **ID** mode and enter one manually.

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [Joinpoints API docs (Swagger)](https://app.joinpoints.io/res/swagger/joinpoints-JoinpointsAPI-1-1-swagger.json)

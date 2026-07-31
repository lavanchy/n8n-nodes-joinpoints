# n8n-nodes-joinpoint

This is an n8n community node. It lets you interact with the [Joinpoint](https://app.joinpoints.io/) API in your n8n workflows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Usage](#usage)
[Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

- Joinpoint
    - **Get** — return basic details of a Joinpoint
    - **Get Statistic** — return runtime statistics of a Joinpoint
    - **List** — list Joinpoints, optionally filtered by a source Joinpoint ID

## Credentials

This node does not use a stored n8n credential. Instead, each operation takes an
**Access Token** parameter directly. This token is expected to come from an external
auth subworkflow (it should not be fetched directly from the Joinpoint `/auth`
endpoint) and is valid for 1 hour.

## Compatibility

Requires n8n with community nodes API version 1 support (`n8nNodesApiVersion: 1`).

## Usage

1. Add the Joinpoint node to your workflow.
2. Select an operation (Get, Get Statistic, or List).
3. Provide the Access Token obtained from your auth subworkflow.
4. Depending on the operation, provide the Joinpoint ID (Get, Get Statistic) or an
   optional Source Joinpoint ID (List).

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [Joinpoint API docs (Swagger)](https://app.joinpoints.io/res/swagger/joinpoints-JoinpointsAPI-1-1-swagger.json)

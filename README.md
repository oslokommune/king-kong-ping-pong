# King Kong Ping Pong

## What
A small service to continously poll itself through an API gateway and notifies a
Slack webhook if the state changes

## Why
A need to test a full integration of Kong arose

## Usage

### Configuration
The following environment variables are required

`KONG_API_KEY=<an api key generated for a consumer in the API gateway>`
`SLACK_WEBHOOK_URL=<a Slack webhook URL>`
`UPSTREAM_URL=<the URL the service can reach itself on through the API gateway>`

### Docker
1. make build-image
2. make run-image

### Standalone
1. make run

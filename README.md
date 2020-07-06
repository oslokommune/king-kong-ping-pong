# King Kong Ping Pong

## What
A small service to continously poll itself through an API gateway and notifies a
Slack webhook if the state changes

## Why
A need to test a full integration of Kong arose

## Usage

### Configuration
The following environment variables can be configured

`KONG_API_KEY` || required <br>
An API key generated for a consumer in the API gateway.

`SLACK_WEBHOOK_URL` || required <br>
A Slack webhook URL.

`UPSTREAM_URL` || required <br>
The URL the service can reach itself on through the API gateway.

`AT_CHANNEL` || optional FALSE
If TRUE, king-kong-ping-pong will notify the channel with @channel on errors

`INITIAL_PING_DELAY_MS` || optional, default 10000 <br>
The delay until the first request to /pong is sent.

`PING_TIMEOUT_MS` || optional, default 10000 <br>
How long to wait for a response from /pong. A timeout accounts for one error.

`LOG_LEVEL` || optional, default "info" <br>
How noisy the log should be

`PING_INTERVAL_MS` || optional, default 5000 <br>
How often the service should poll itself.

`PORT` || optional, default 3000 <br>
The port the service should be listening on

`LOG_PRETTY_PRINT` || optional, default FALSE <br>
Decides if the log output should be pretty printed

`LOG_SIMPLE_LOGGING` || optional, default FALSE <br>
Decides if the log output should be a simpler version of production log. Useful for developing.

`ERRORS_BEFORE_NOTIFY` || optional, default 3 <br>
How many errors can happen before a Slack notification is sent. If value is `3`, then if three consecutive requests
fail (three errors with no successes in between), the fourth consecutive error will result in a failure report to the
Slack webhook.   
 

### Docker
1. make build-image
2. make run-image

### Standalone
1. make run

## Deployment
Deployment is done via the [Charts repo](https://github.com/oslokommune/developer-portal-charts)

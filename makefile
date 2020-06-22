.PHONY: help
SHELL = /bin/bash

NAME=`jq .name -r package.json`
VERSION=`jq .version -r package.json`
REPOSITORY=docker.pkg.github.com/tuuturu/backend-template

help: ## Print this menu
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

bump:
	npm version patch

build-image:
	docker build \
		--build-arg NPM_TOKEN=${NPM_TOKEN} \
		--tag ${REPOSITORY}/${NAME}:${VERSION} \
		--tag ${REPOSITORY}/${NAME}:latest \
		.
push-image:
	docker push ${REPOSITORY}/${NAME}:${VERSION}
	docker push ${REPOSITORY}/${NAME}:latest

release: bump build-image push-image ## Bump, build a docker image and push it to a repository
	@echo "🚀 Release is ready for deploy"

run: ## Run the service locally
	npx nodemon server.js

.PHONY: help
help: ## Display this help message.
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

.PHONY: setup
setup: ## Install dependencies.
	npm install

.PHONY: build
build: ## Build the application for deployment.
	npm run build

.PHONY: start stop
start: ## Start the application.
	npm run dev
stop: ## Stop the application.
	echo "n/a - vite runs in the foreground"

.PHONY: lint
lint: ## Run linters.
	npm run lint

.PHONY: test
test: ## Run the test suite.
	npm run test -- --run

.PHONY: deploy
deploy: ## Deploy the application to GitHub Pages.
	npm run deploy

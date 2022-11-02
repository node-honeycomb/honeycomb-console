BIN_MOCHA = ./node_modules/.bin/_mocha
BIN_ISTANBUL = ./node_modules/.bin/istanbul

VERSION = $(shell cat package.json | awk -F '"' '/version" *: *"/{print $$4}')
BUILD_NO = $(shell cat package.json | awk -F '"' '/build" *: *"/{print $$4}')

TESTS_ENV = test/env.js

install:
	@npm install --registry=https://registry.npmmirror.com --legacy-peer-deps
	@cd assets && npm install --registry=https://registry.npmmirror.com --legacy-peer-deps

test:
	NODE_ENV=test $(BIN_MOCHA) \
		--recursive \
		-t 30000 \
		-R spec \
		-r $(TESTS_ENV) \
		$(TESTS)

release: clean
	@mkdir -p ./out/release
	@rsync -av . ./out/release --exclude assets/.honeypack_cache  --exclude .github --exclude .git --exclude test --exclude out --exclude node_modules --exclude run --exclude logs
	@cd out/release && npm install --production --registry=https://registry.npmmirror.com
	@cd out/release/assets && npm install --dev --registry=https://registry.npmmirror.com
	@cd out/release/assets && NODE_ENV=production ./node_modules/.bin/honeypack build && mv .package ../
	@mkdir out/release/assets.final
	@cp -rf out/release/assets/static out/release/assets.final/
	@mv out/release/.package/* out/release/assets.final/
	@rm -rf out/release/assets/
	@rm -rf out/release/.package/
	@mv -f out/release/assets.final out/release/assets
	@cd out/release/config && cat config_production.js > config.js

test-cov:
	@$(BIN_ISTANBUL) cover ${BIN_MOCHA} -- \
		--recursive \
		-t 60000 \
		-R tap \
		-r $(TESTS_ENV) \
		test

package: release
	@cd out/release/config && cat config_production.js > config.js
	@cd out && mv release admin_$(VERSION)_$(BUILD_NO)
	@cd out && tar -czf admin_$(VERSION)_$(BUILD_NO).tgz admin_$(VERSION)_$(BUILD_NO)

daily: release
	@cd out/release/config && cat config_daily.js > config.js
	@cd out && mv release admin_$(VERSION)_$(BUILD_NO)
	@cd out && tar -czf honeycomb-console_$(VERSION)_$(BUILD_NO).tgz admin_$(VERSION)_$(BUILD_NO)

clean:
	@rm -rf ./out
	@rm -rf assets/node_modules
	@rm -rf node_modules

tag:
	@cat package.json | awk -F '"' '/version" *: *"/{print "v"$$4}' | xargs -I {} git tag {}

release-linux:
	docker run -it --rm -v $(shell pwd):/workspace centos/nodejs-8-centos7 /bin/bash -c \
	"cd /workspace  && registry=https://registry.npm.taobao.org make package"

.PHONY: install test

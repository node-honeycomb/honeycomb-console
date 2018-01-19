TEST = $(shell ls -S `find test -type f -name "*.test.js"`)

test:
	@node --harmony ./node_modules/.bin/mocha $(TEST) -t 10000

.PHONY: all test clean


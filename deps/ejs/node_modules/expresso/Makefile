
PREFIX ?= /usr/local
BIN = bin/expresso
JSCOV = deps/jscoverage/node-jscoverage
DOCS = docs/index.md
HTMLDOCS = $(DOCS:.md=.html)

test: $(BIN)
	@./$(BIN) --growl $(TEST_FLAGS)

test-cov:
	@./$(BIN) -I lib --cov $(TEST_FLAGS)

test-serial:
	@./$(BIN) --serial $(TEST_FLAGS) test/serial/*.test.js

install: install-jscov install-expresso

uninstall:
	rm -f $(PREFIX)/bin/expresso
	rm -f $(PREFIX)/bin/node-jscoverage

install-jscov: $(JSCOV)
	install $(JSCOV) $(PREFIX)/bin

install-expresso:
	install $(BIN) $(PREFIX)/bin

$(JSCOV):
	cd deps/jscoverage && ./configure && make && mv jscoverage node-jscoverage

clean:
	@cd deps/jscoverage && git clean -fd

docs: docs/api.html $(HTMLDOCS)

%.html: %.md
	@echo "... $< > $@"
	@ronn --html $< \
		| cat docs/layout/head.html - docs/layout/foot.html \
		> $@

docs/api.html: bin/expresso
	dox \
		--title "Expresso" \
		--ribbon "http://github.com/visionmedia/expresso" \
		--desc "Insanely fast TDD framework for [node](http://nodejs.org) featuring code coverage reporting." \
		$< > $@

docclean:
	rm -f docs/*.html

.PHONY: test test-cov install uninstall install-expresso install-jscov clean docs docclean
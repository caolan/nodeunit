PACKAGE = nodeunit
NODEJS = $(if $(shell test -f /usr/bin/nodejs && echo "true"),nodejs,node)

PREFIX ?= /usr/local
BINDIR ?= $(PREFIX)/bin
DATADIR ?= $(PREFIX)/share
MANDIR ?= $(PREFIX)/share/man
LIBDIR ?= $(PREFIX)/lib
NODEJSLIBDIR ?= $(LIBDIR)/$(NODEJS)

BUILDDIR = dist

DOCS = $(shell find doc -name '*.md' \
				|sed 's|.md|.1|g' \
				|sed 's|doc/|man1/|g' \
				)


$(shell if [ ! -d $(BUILDDIR) ]; then mkdir $(BUILDDIR); fi)

all: build doc

browser:
	# super hacky build script for browser version!
	rm -f browser.js
	cat deps/json2.js >> browser.js
	echo "nodeunit = (function(){" >> browser.js
	echo "var assert = {};" >> browser.js
	echo "var types = {};" >> browser.js
	echo "var core = {};" >> browser.js
	cat deps/async.js >> browser.js
	echo "(function(exports){" >> browser.js
	cat lib/assert.js >> browser.js
	echo "})(assert);" >> browser.js
	echo "(function(exports){" >> browser.js
	cat lib/types.js >> browser.js
	echo "})(types);" >> browser.js
	echo "(function(exports){" >> browser.js
	cat lib/core.js >> browser.js
	echo "})(core);" >> browser.js
	echo "core.assert = assert;" >> browser.js
	echo "return core; })();" >> browser.js
	#sed -i "/ = require/d" browser.js
	sed -i "/\@REMOVE_LINE_FOR_BROWSER/d" browser.js

build: stamp-build

stamp-build: $(wildcard  deps/* lib/*.js)
	touch $@;
	mkdir -p $(BUILDDIR)/nodeunit
	cp -R bin deps lib package.json $(BUILDDIR)/nodeunit
	printf '#!/bin/sh\n$(NODEJS) $(NODEJSLIBDIR)/$(PACKAGE)/bin/nodeunit $$@' > $(BUILDDIR)/nodeunit.sh

test:
	$(NODEJS) ./bin/nodeunit test

install: build
	install --directory $(NODEJSLIBDIR)
	cp -a $(BUILDDIR)/nodeunit $(NODEJSLIBDIR)
	install --mode=0755 $(BUILDDIR)/nodeunit.sh $(BINDIR)/nodeunit
	install --directory $(MANDIR)/man1/
	cp -a man1/nodeunit.1 $(MANDIR)/man1/

uninstall:
	rm -rf $(NODEJSLIBDIR)/nodeunit $(NODEJSLIBDIR)/nodeunit.js $(BINDIR)/nodeunit
	rm -rf $(MANDIR)/man1/nodeunit.1

clean:
	rm -rf $(BUILDDIR) stamp-build

lint:
	nodelint --config nodelint.cfg ./index.js ./bin/nodeunit ./bin/nodeunit.json ./lib/*.js ./lib/reporters/*.js ./test/*.js

doc: man1 $(DOCS)
	@true

man1:
	@if ! test -d man1 ; then mkdir -p man1 ; fi

# use `npm install ronn` for this to work.
man1/%.1: doc/%.md
	ronn --roff $< > $@

.PHONY: browser test install uninstall build all

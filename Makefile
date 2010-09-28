PACKAGE = nodeunit
NODEJS = $(if $(shell test -f /usr/bin/nodejs && echo "true"),nodejs,node)

PREFIX ?= /usr/local
BINDIR ?= $(PREFIX)/bin
DATADIR ?= $(PREFIX)/share
LIBDIR ?= $(PREFIX)/lib
NODEJSLIBDIR ?= $(LIBDIR)/$(NODEJS)

BUILDDIR = dist

$(shell if [ ! -d $(BUILDDIR) ]; then mkdir $(BUILDDIR); fi)

all: build

build: stamp-build

stamp-build: $(wildcard  deps/* lib/*.js)
	touch $@;
	mkdir -p $(BUILDDIR)/nodeunit
	cp -R deps lib/*.js $(BUILDDIR)/nodeunit
	find $(BUILDDIR)/nodeunit/ -type f | xargs sed -i 's/\.\.\/deps/.\/deps/'
	printf '#!/bin/sh\n$(NODEJS) $(NODEJSLIBDIR)/$(PACKAGE)/cli.js $$@' > $(BUILDDIR)/nodeunit.sh
	printf "module.exports = require('$(PACKAGE)/nodeunit')" > $(BUILDDIR)/nodeunit.js

test:
	node ./lib/cli.js test

install: build
	install --directory $(NODEJSLIBDIR)
	cp -a $(BUILDDIR)/nodeunit $(NODEJSLIBDIR)
	install --mode=0644 $(BUILDDIR)/nodeunit.js $(NODEJSLIBDIR)
	install --mode=0755 $(BUILDDIR)/nodeunit.sh $(BINDIR)/nodeunit

uninstall:
	rm -rf $(NODEJSLIBDIR)/nodeunit $(NODEJSLIBDIR)/nodeunit.js $(BINDIR)/nodeunit

clean:
	rm -rf $(BUILDDIR) stamp-build

lint:
	nodelint --config nodelint.cfg ./index.js ./lib/*.js ./test/*.js

.PHONY: test install uninstall build all

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
	cp -R bin deps lib package.json $(BUILDDIR)/nodeunit
	printf '#!/bin/sh\n$(NODEJS) $(NODEJSLIBDIR)/$(PACKAGE)/bin/nodeunit $$@' > $(BUILDDIR)/nodeunit.sh

test:
	$(NODEJS) ./bin/nodeunit test

install: build
	install --directory $(NODEJSLIBDIR)
	cp -a $(BUILDDIR)/nodeunit $(NODEJSLIBDIR)
	install --mode=0755 $(BUILDDIR)/nodeunit.sh $(BINDIR)/nodeunit

uninstall:
	rm -rf $(NODEJSLIBDIR)/nodeunit $(NODEJSLIBDIR)/nodeunit.js $(BINDIR)/nodeunit

clean:
	rm -rf $(BUILDDIR) stamp-build

lint:
	nodelint --config nodelint.cfg ./index.js ./bin/nodeunit ./bin/nodeunit.json ./lib/*.js ./lib/reporters/*.js ./test/*.js

.PHONY: test install uninstall build all

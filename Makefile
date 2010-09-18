PREFIX ?= /usr/local

test:
	./bin/nodeunit test

install:
	cp -r ./ $(PREFIX)/lib/nodeunit
	ln -s $(PREFIX)/lib/nodeunit/bin/nodeunit $(PREFIX)/bin/nodeunit

uninstall:
	rm -rf $(PREFIX)/lib/nodeunit
	rm -f $(PREFIX)/bin/nodeunit

.PHONY: test install uninstall

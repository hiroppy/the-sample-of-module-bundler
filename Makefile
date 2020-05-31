.PHONY: install
install:
	cd ./tests/fixtures/cjs-node-modules && npm i
	cd ./tests/fixtures/esm-node-modules && npm i
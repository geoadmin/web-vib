SHELL = /bin/bash
INSTALL_DIRECTORY = .venv
PIP_CMD = $(INSTALL_DIRECTORY)/bin/pip
FLASK_CMD := $(INSTALL_DIRECTORY)/bin/flask
MAKO_CMD := $(INSTALL_DIRECTORY)/bin/mako-render
SERVER_PORT ?= 9000
FLASK_APP = vib/main.py
FLASK_DEBUG ?= 1

# Branch name
BRANCH_NAME =


.PHONY: all
all: vib/templates/glmap.html
	@if [ ! -d $(INSTALL_DIRECTORY) ]; then virtualenv $(INSTALL_DIRECTORY); fi
	$(PIP_CMD) install --upgrade pip setuptools;
	$(PIP_CMD) install -r requirements.txt;

.PHONY: serve
serve:
	export FLASK_APP=$(FLASK_APP) && export FLASK_DEBUG=$(FLASK_DEBUG) && ${FLASK_CMD} run --port=$(SERVER_PORT);

vib/templates/glmap.mako.html:
vib/templates/glmap.html: vib/templates/glmap.mako.html
	${MAKO_CMD} --var "branch_name=${BRANCH_NAME}" $< > $@

.PHONY: clean
clean:
	rm -f vib/templates/glmap.html

.PHONY: cleanall
cleanall: clean
	vib/templates/glmap.html

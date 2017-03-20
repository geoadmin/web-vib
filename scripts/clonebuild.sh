#!/bin/bash

# bail out on any error
set -o errexit

get_s3_basepath () {
  echo "/vib/$BRANCH_NAME/"
}

create_snapshot_dir () {
  if [ ! -d "${CLONEDIR}" ]; then
    mkdir -p "${CLONEDIR}"
  fi
}

update_and_reset_git_project () {
  echo "Reseting repository to HEAD for branch=${BRANCH_NAME}"
  git fetch
  git checkout $BRANCH_NAME
  git reset --hard origin/$BRANCH_NAME
}

# set some variables and defaults
CLONEDIR=${@:$OPTIND:1}
BRANCH_NAME=${@:$OPTIND+1:1}
DEEP_CLEAN=${@:$OPTIND+2:1}

create_snapshot_dir
cd ${CLONEDIR}

if [ ! -d web-vib ]; then
  echo "Cloning branch=${BRANCH_NAME}, into directory=${CLONEDIR}"
  git clone -b ${BRANCH_NAME} https://github.com/geoadmin/web-vib.git
  cd web-vib
else
  cd web-vib
  update_and_reset_git_project
  if [ "$DEEP_CLEAN" = "true" ]; then
    make cleanall
  else
    make clean
  fi
fi

BRANCH_NAME=$(get_s3_basepath $BRANCH_NAME)

echo "s3 path is: ${BRANCH_NAME}"
echo "Building the project"
export BRANCH_NAME=$BRANCH_NAME
make all

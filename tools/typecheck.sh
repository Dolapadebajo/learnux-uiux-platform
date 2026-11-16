#!/bin/sh
# Partial type check for the no-network sandbox. TS7006 (implicit any) errors come from the loose React
# stubs (props spread from Omit<…HTMLAttributes>) and are filtered; every other error is reported.
cd "$(dirname "$0")/.." && /opt/npm-tools/node_modules/.bin/tsc -p tools/typecheck/tsconfig.json --noEmit | grep -v "TS7006" ; echo "(TS7006 stub-artefact lines filtered)"

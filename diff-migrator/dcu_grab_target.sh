#!/bin/sh
set -e

cd ..

DCU_SERVER=https://ccadmin-stage-zbba.oracleoutsourcing.com
API_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkMzIyNGJjOC1iZjljLTRhNWMtYjFhNi05MjIwYzI3NzQ1MWUiLCJpc3MiOiJhcHBsaWNhdGlvbkF1dGgiLCJleHAiOjE1NzEwMzExNTYsImlhdCI6MTUzOTQ5NTE1Nn0=.d8gGlYAtIZeVqE0vftJJ3qCKdDQjtHiMSiqA3CFfLdc=

export CC_APPLICATION_KEY=${API_KEY}
dcu --grab --clean --node ${DCU_SERVER} -k ${API_KEY}


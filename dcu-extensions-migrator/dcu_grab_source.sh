#!/bin/sh
set -e

cd ..

DCU_SERVER=https://ccadmin-test-zbba.oracleoutsourcing.com
API_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJlOWM0YzZjNC1mNTVkLTQ3ZmQtYmZkYy1lZmEyOWYxZjllZGEiLCJpc3MiOiJhcHBsaWNhdGlvbkF1dGgiLCJleHAiOjE1NTM5MTg3NTMsImlhdCI6MTUyMjM4Mjc1M30=.g4Ws3V9PYZGnF/bIxtSLWeOBtHTbzVWjliEyS+Jb7oo=

export CC_APPLICATION_KEY=${API_KEY}
dcu --grab --clean --node ${DCU_SERVER} -k ${API_KEY}

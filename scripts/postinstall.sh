#!/bin/bash -eu
set -o pipefail

current_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$current_dir/../.git/hooks"
rm -f commit-msg
ln -s "../../scripts/commit-msg" commit-msg
#!/bin/bash
# Publish the PUBLIC files to gh-pages from an isolated worktree.
# Target: https://sindrimar02.github.io/hljomaholl-preview/ (noindex).
#
# Never checkout gh-pages inside the main tree: its files live at the repo root,
# so clearing the root there would delete the real source.
# The local server and the QA/audit scripts are deliberately NOT published.
#
# NOTE: this script rewrites the gh-pages branch, so the last push needs --force.
# The workspace backup guard blocks force pushes from inside a Claude session by
# design; run this script yourself in a terminal for redeploys.
set -e
REPO="$(cd "$(dirname "$0")" && pwd)"
WT="$(mktemp -d)/hljomaholl-pages"

git -C "$REPO" worktree add --detach -q "$WT"
cd "$WT"
git branch -D gh-pages >/dev/null 2>&1 || true
git checkout -q --orphan gh-pages
git rm -rq --cached . >/dev/null 2>&1 || true
find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +

cp -R "$REPO/assets" .
cp -R "$REPO/fonts" .
cp "$REPO/index.html" "$REPO/robots.txt" .
touch .nojekyll

# GATE 1 - check the STAGED tree, byte-for-byte what gets published. A preview that
# ships without a usable favicon shows the ARTIX helm from the origin root in the
# client's tab. Rules and history: _tools/favicon-guard.mjs
node "$REPO"/../_tools/favicon-guard.mjs "$WT"

git add -A
git -c user.email=sindri@klubbr.is -c user.name="Sindri Már" \
    commit -q -m "Deploy $(git -C "$REPO" rev-parse --short HEAD) (noindex preview)"
git push -q --force origin gh-pages
cd "$REPO"
git worktree remove --force "$WT"
echo "published:"; git -C "$REPO" ls-tree --name-only origin/gh-pages

# GATE 2 - on-disk correct is not proof the client sees an icon: the build can rename
# files and the Pages CDN takes a minute. Check the DEPLOYED url. Polls ~3 min.
node "$REPO"/../_tools/favicon-verify-live.mjs "https://sindrimar02.github.io/hljomaholl-preview/"

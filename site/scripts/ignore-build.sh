#!/bin/sh
# Vercel's Ignored Build Step (site/vercel.json's ignoreCommand), run from site/: exit 0 skips the
# build, any other exit builds. A build takes about six minutes, and the team's spend cap pauses
# every project when it's reached, so only the builds that can change the site run.

branch="$VERCEL_GIT_COMMIT_REF"

# The snapshots (sources) have no site, the bot's data branches and Dependabot's are built again
# once merged into main
case "$branch" in
    sources | data/* | dependabot/*)
        echo "Skipped: $branch doesn't need its own preview"
        exit 0
        ;;
esac

# The first build of a branch has nothing to compare with
previous="$VERCEL_GIT_PREVIOUS_SHA"
if [ -z "$previous" ]; then
    echo "Building: no earlier build of $branch"
    exit 1
fi

# The site and what the package builds it from. A previous commit missing from Vercel's shallow
# clone makes git diff fail, which builds too.
if git diff --quiet "$previous" HEAD -- . ../src ../data ../schema ../package.json \
    ../pnpm-lock.yaml ../pnpm-workspace.yaml ../tsup.config.ts ../tsconfig.json \
    ../datapackage.json ../ids.lock.json; then
    echo "Skipped: nothing the site is built from changed since ${previous}"
    exit 0
fi

echo "Building: the site or its data changed since ${previous}"
exit 1

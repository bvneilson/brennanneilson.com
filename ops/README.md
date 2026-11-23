# ops

Files for the Mac-side stats job. Nothing here runs in CI or on Vercel.

- `flagship-runner.sh` pulls `main` into `~/flagship-runner`, runs `npm ci` only when `package-lock.json` changed, picks the highest `~/.nvm/versions/node/v24.*/bin/node`, and runs `scripts/publish-stats.ts`. It fails loudly if no Node 24 exists. No login shell, no dotfiles sourced.
- `com.brennan.flagship.stats.plist` is the launchd template. It runs the wrapper every hour and logs to `~/Library/Logs/flagship-stats.log`.
- `stats-config.example.json` shows the shape of the private config at `~/.config/flagship/stats-config.json`. The real file is never committed.

Test-only switches (used by `tests/flagship-runner.test.ts`, never set in the plist):

- `FLAGSHIP_RUNNER_SKIP_PULL=1` skips fetch and pull.
- `FLAGSHIP_RUNNER_DRY_RUN=1` prints the resolved node and script paths, then exits before publishing.

## Install (after the merge to main)

1. `git clone https://github.com/bvneilson/brennanneilson.com ~/flagship-runner && cd ~/flagship-runner && npm ci`
2. Copy the plist: `cp ~/flagship-runner/ops/com.brennan.flagship.stats.plist ~/Library/LaunchAgents/`
3. Reload the job:
   `launchctl bootout gui/$(id -u)/com.brennan.flagship.stats`, then
   `launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.brennan.flagship.stats.plist`
4. Run it now: `launchctl kickstart -k gui/$(id -u)/com.brennan.flagship.stats`
5. Confirm a fresh `generatedAt` in `stats.json` on the `site-stats` branch.

The plist hardcodes the home directory. Edit the path if the user is not `brennanneilson`.

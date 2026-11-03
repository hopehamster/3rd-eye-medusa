# VPS access

The Medusa backend runs in Docker on a Hostinger VPS. The storefront is on
Vercel and needs none of this.

## Where the credential lives

`C:\Users\Owner\Documents\GitHub\main secrets.txt` — the **PS SSH Credentials**
block. It is a four-line table, not key/value pairs:

```
Host:     <ip>
Username: <user>
Password: <token> <token> <token> <token> <token>
VPS ID:   <id>
```

**The password is the FIRST whitespace-separated token on the Password line.**

Read it as a whole line and you get `Access denied / Configured password was not
accepted` — the line contains extra tokens that are not part of the secret.
Never print the value.

## Connect

OpenSSH on Windows cannot take a password non-interactively, so use PuTTY:

```powershell
& 'C:\Program Files\PuTTY\plink.exe' -batch -ssh -pw '<first-token>' root@<ip> "echo ok"
```

For anything with quotes or `$` in it, base64 the script and decode on the far
side — that is the only quoting that reliably survives PowerShell -> plink -> bash:

```powershell
$b64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($bash))
& 'C:\Program Files\PuTTY\plink.exe' -batch -ssh -pw '<token>' root@<ip> "echo $b64 | base64 -d | bash"
```

## Layout on the box

- `/docker/medusa-3es` — compose project (medusa, postgres, redis, meilisearch)
- `/docker/medusa-3es/repo` — git checkout of `main`, source of truth
- `/docker/medusa-3es/backend` — what the container actually runs (rsynced from repo by deploy.sh)
- backend listens on 127.0.0.1:9000, published at https://api.3rdeyesupply.com

**This box hosts other projects.** Only ever touch `/docker/medusa-3es` and the
`medusa` service. Other containers must stay untouched.

## Deploy the backend

```bash
cd /docker/medusa-3es && nohup bash deploy.sh > /tmp/deploy.log 2>&1 < /dev/null &
```

The `< /dev/null` matters: without it plink waits on the channel and the call
times out even though the deploy is running. Then poll:

```bash
tail -f /tmp/deploy.log                      # ends with "deploy done"
curl -s -o /dev/null -w '%{http_code}' https://api.3rdeyesupply.com/health   # expect 200
```

Takes 2-4 minutes (image build). A failed build leaves the running container
untouched, so production survives it.

## Run code inside the backend

Scripts live in `apps/backend/src/scripts` and are compiled by `medusa build`, so
a type error there breaks the deploy. Run the build locally first.

```bash
docker compose exec -T medusa sh -c './node_modules/.bin/medusa exec ./src/scripts/<name>.ts'
# write mode where the script supports it:
docker compose exec -T medusa sh -c 'WRITE_REHOST=1 ./node_modules/.bin/medusa exec ./src/scripts/rehost-product-images.ts'
```

Most scripts are report-only by default and key off a `WRITE_*=1` env var.

## Query the database

```bash
docker compose exec -T postgres psql -U medusa -d medusa-3es -A -F '|' -c "SELECT ..."
```

Raw SQL writes emit no product events, so product edits made this way leave the
search index stale (`search_pg_product_v3.document`). The API reads the DB, the
`/store` listing reads the index — patch both or the catalogue disagrees with
itself.

## File transfer

```powershell
& 'C:\Program Files\PuTTY\pscp.exe' -pw '<token>' .\local.txt root@<ip>:/tmp/remote.txt
```

## Health checks worth running after any change

```bash
curl -s -o /dev/null -w '%{http_code}' https://api.3rdeyesupply.com/health
docker compose -f /docker/medusa-3es/docker-compose.yml ps
docker ps --format '{{.Names}}'        # confirm no other project restarted
```

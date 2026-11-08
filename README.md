# akjon.dev Subdomain Registry

A free, open-source subdomain registry for developers and students. Get your own `yourname.akjon.dev` (or `yourname.code-space.me` / `yourname.id-card.me`) to host your portfolio, blog, or personal projects.

The entire system is powered by Infrastructure-as-Code using DNSControl and synced live with Cloudflare via GitHub Actions.

> **Recommended:** use the [JSON Generator](https://akjon.dev/generate-json) on our website to build your record file. It fills in the right format for GitHub Pages and Vercel (CNAME or A record), validates the Vercel TXT value, and avoids the most common PR validation errors.

## Requirements

- **Hosting**: Your subdomain must point to a static host: **GitHub Pages** (CNAME) or **Vercel** (CNAME or A record + `_vercel` TXT verification). Each has its own setup step below.
- **Username Matching**: The name of your JSON file must match your GitHub username exactly (e.g. if your username is `arif-dev`, your file must be `domains/akjon.dev/arif-dev.json`).
- **Ownership**: You must be the owner of the GitHub account matching the filename. Automated verification ensures that you can only modify your own domain records.

## How to Register Your Subdomain

### 1. Fork and Clone

Fork this repository to your GitHub account, then clone your fork:

```bash
git clone https://github.com/YOUR-USERNAME/domain.git
cd domain
```

### 2. Create Your Record File

Inside the `domains/` folder, pick one of the three domains (`akjon.dev`, `code-space.me`, `id-card.me`) and create a file named exactly after your GitHub username with a `.json` extension. (The [JSON Generator](https://akjon.dev/generate-json ) can build the contents for you.)

Example (`domains/akjon.dev/YOUR-USERNAME.json`):

```json
{
  "owner": {
    "username": "YOUR-USERNAME"
  },
  "records": {
    "CNAME": "YOUR-USERNAME.github.io"
  }
}
```

### 3. Submit a Pull Request

```bash
git add domains/akjon.dev/YOUR-USERNAME.json
git commit -m "feat: register YOUR-USERNAME.akjon.dev"
git push origin main
```

Then open a Pull Request against the `main` branch of this repository. Once it is merged, DNS syncs with Cloudflare within about 5 minutes.

### 4a. Set Up GitHub Pages (if you use GitHub Pages)

> **This step is required.** Without it, visitors will see a certificate error
> (`SSL_ERROR_BAD_CERT_DOMAIN`) saying the certificate is only valid for
> `*.github.io` and `github.com`. DNS alone is not enough: GitHub must also be
> told that your subdomain belongs to your Pages site so it can issue an HTTPS
> certificate for it.

Do this **after** your pull request has been merged and DNS has synced:

1. Open the repository that hosts your site on GitHub and go to **Settings → Pages**.
2. Under **Build and deployment**, choose your source (a branch, or **GitHub Actions**).
3. Under **Custom domain**, enter your full subdomain (e.g. `yourname.akjon.dev`) and click **Save**.
4. Wait for the **DNS check successful** message.
5. Wait for GitHub to issue the HTTPS certificate. This usually takes a few minutes but can take up to an hour.
6. Tick **Enforce HTTPS** once it becomes available.

**Important notes**

- If you deploy with a **GitHub Actions** workflow, a `CNAME` file in your repo is **ignored**. You must set the custom domain in **Settings → Pages**.
- If you deploy from a **branch**, GitHub creates a `CNAME` file in the branch for you when you save the custom domain. Do not delete it.
- The custom domain must be exactly the subdomain you registered here.
- A custom domain can only be attached to one GitHub Pages site at a time. If it is already used by another repo or account, remove it there first.

### 4b. Set Up Vercel (if you use Vercel)

> 💡 **Tip:** the [JSON Generator](https://akjon.dev/generator.html) builds this file for you. Choose **Vercel**, pick **CNAME** (default) or **A record**, paste your values, and copy the result.

Vercel needs a `CNAME` (or `A`) record **and** a TXT verification record. Put **both in the same single file** (`domains/akjon.dev/YOUR-USERNAME.json`):

```json
{
  "owner": {
    "username": "YOUR-USERNAME"
  },
  "records": {
    "CNAME": "xxxxxxxxxxxxxxxx.vercel-dns-017.com",
    "TXT": {
      "name": "_vercel",
      "value": "vc-domain-verify=YOUR-USERNAME.akjon.dev,xxxxxxxxxxxxxxxxxxxx"
    }
  }
}
```

1. In Vercel, open your project → **Settings → Domains** and add `YOUR-USERNAME.akjon.dev`.
2. Copy the TXT value Vercel shows you (it starts with `vc-domain-verify=`).
3. Paste it as `value` above, then open your PR.
4. After the PR is merged, click **Refresh** in Vercel to verify.

**Important notes**

- **Do not** create a file named `_vercel.YOUR-USERNAME.json`. The PR validator rejects it. Use the `TXT` object with `"name": "_vercel"` inside your normal file instead.
- The registry publishes your TXT record at `_vercel.akjon.dev` (not `_vercel.YOUR-USERNAME.akjon.dev`), which is where Vercel looks for it.
- The TXT `value` must start with `vc-domain-verify=YOUR-USERNAME.akjon.dev,` (your exact subdomain and domain). Otherwise the PR fails validation, so nobody can verify someone else's subdomain.
- **CNAME is the default.** Use the **CNAME target** shown in your Vercel dashboard (Settings → Domains). If you prefer an A record, replace the `CNAME` line with `"A": ["216.198.79.1"]` (check the dashboard for the current IP). Use **only one** of CNAME or A, never both.

### Troubleshooting

| Problem | Cause / fix |
| --- | --- |
| `SSL_ERROR_BAD_CERT_DOMAIN`, certificate valid only for `*.github.io` | You have not set the custom domain in **Settings → Pages** yet (step 4a), or GitHub is still issuing the certificate. Wait up to an hour after saving. |
| "DNS check unsuccessful" in Pages settings | Your PR is not merged or synced yet. Wait a few minutes and click **Check again**. Run `dig yourname.akjon.dev CNAME` to confirm it points to `yourname.github.io`. |
| "Enforce HTTPS" is greyed out | The certificate has not been issued yet. Wait, or remove and re-add the custom domain to trigger it again. |
| Vercel says "Invalid Configuration" or won't verify | Make sure the PR is merged and synced (5 min), the TXT value was copied exactly from Vercel, and your A/CNAME matches the dashboard. |
| Site shows 404 from GitHub | The site is not deployed yet, or the Pages source is not set. Check **Settings → Pages** and the Actions tab. |
| Browser cannot bypass the error | All `.dev` domains are HSTS-preloaded, so browsers only allow HTTPS. The only fix is a valid certificate. |

## Automated Validation & Maintenance

The Core Domain Validator runs on every Pull Request:

- **Ownership Check**: Verifies the PR author is authorized to modify the requested domain.
- **Schema Validation**: Ensures the JSON structure is valid.
- **Syncing**: Merged changes sync with Cloudflare DNS within 5 minutes.

## Guidelines & Restrictions

- Allowed characters: lowercase alphanumeric (`a-z`, `0-9`) and dashes (`-`).
- Reserved subdomains: `www`, `api`, `admin`, `root`, `support`, `mail`, `ssl` and a few more are blacklisted.

## Workflow Labels

- `type: domain-update`: Modification to an existing record.
- `Record Valid` / `Record Invalid`: Automatic status indicators.
- `bypass`: Used by maintainers to skip verification.

Maintained by @s8rr

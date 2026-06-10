# akjon.dev Subdomain Registry

A free, open-source subdomain registry for developers and students. Get your own `yourname.akjon.dev` (or associated namespaces) to host your portfolio, blog, or personal projects.

The entire system is powered by Infrastructure-as-Code using DNSControl and synced live with Cloudflare via GitHub Actions.

## Requirements 

- **Hosting**: Your subdomain must point to a static hosting provider (GitHub Pages, Vercel, Netlify, Cloudflare Pages, etc.).
- **Username Matching**: The name of your JSON file must match your GitHub username exactly (e.g., if your username is `arif-dev`, your file must be `domains/akjon.dev/arif-dev.json`).
- **Ownership**: You must be the owner of the GitHub account matching the filename. Automated verification ensures that you can only modify your own domain records.

## How to Register Your Subdomain

### 1. Fork and Clone
Fork this repository to your GitHub account, then clone it locally:

```bash
git clone https://github.com/s8rr/domain.git
cd domain
```

### 2. Create Your Record File

Inside the ``domains/`` folder, choose your domain from this three ``akjon.dev``,``code-space.me``,``id-card.me`` and create a new file named exactly after your GitHub username with a ``.json`` extension.

Example (``domains/s8rr.json``):

```json
{
  "owner": {
    "username": "s8rr"
  },
  "records": {
    "CNAME": "s8rr.github.io"
  },
}
```
### 3. Submit a Pull Request

Commit your changes and open a Pull Request against our ``main`` branch:

```bash
git add domains/YOUR-USERNAME.json
git commit -m "feat: register YOUR-USERNAME.akjon.dev"
git push origin main
```
## Automated Validation & Maintenance
### Core Domain Validator runs on every Pull Request:
- **Ownership Check**: Verifies the PR author is authorized to modify the requested domain.
- Schema Validation: Ensures JSON structure is valid.
- Syncing: Merged changes sync with Cloudflare DNS within 5 minutes.

## Guidelines & Restrictions
- Allowed Characters: Lowercase alphanumeric (a-z, 0-9) and dashes (-).
- Reserved Subdomains: ``www``, ``api``, ``admin``, ``root``, ``support``, ``mail``, ``ssl`` and few more are blacklisted.

## Workflow Labels
- type: domain-update: Modification to existing record.
- Record Valid / Record Invalid: Automatic status indicators.
- bypass: Used by maintainers to skip verification.

Maintained with ❤️ by @s8rr

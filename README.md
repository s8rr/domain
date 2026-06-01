# PSA Updating the core logic to so it can handel 3 domain and updateing the docs to match the main domain akjon.dev


A free, open-source subdomain registry developers and students. Get your own ``yourname.code-space.me`` subdomain to host your portfolio, blog, or personal projects.

The entire system is powered by Infrastructure-as-Code using DNSControl and synced live with Cloudflare via GitHub Actions.
### Requirements

 - Your subdomain must point to a static hosting provider (GitHub Pages, Vercel, Netlify, Cloudflare Pages, etc.).

 - Username Matching: The name of your JSON file must match your GitHub username exactly (e.g., if your username is ``arif-dev``, your file must be ``domains/arif-dev.json``).

- Ownership: You must be the owner of the GitHub account matching the filename. Automated verification ensures that you can only modify your own domain records.

## How to Register Your Subdomain
### 1. Fork and Clone

Fork this repository to your GitHub account, then clone it locally:
Bash

```bash
git clone https://github.com/YOUR-USERNAME/code-space.git
cd code-space
```
### 2. Create Your Record File

Inside the ``domains/`` folder, create a new file named exactly after your GitHub username with a ``.json`` extension.

Example (``domains/s8rr.json``):
JSON
```json
{
  "owner": "s8rr",
  "records": {
    "CNAME": "s8rr.github.io"
  }
}
```
 - CNAME Record: Used for pointing your subdomain to a URL (e.g., ``username.github.io``).

 - A Record: If you need to map to an IP address, change ``"CNAME"`` to ``"A"`` and provide the IP string.

### 3. Submit a Pull Request

Commit your changes, push them to your fork, and open a Pull Request against our ``main`` branch:

```Bash
git add domains/YOUR-USERNAME.json
git commit -m "feat: register YOUR-USERNAME.code-space.me"
git push origin main
```
## Automated Validation & Maintenance

### Our system runs a Core Domain Validator on every Pull Request to ensure the registry remains secure and stable:

 - Ownership Check: The system automatically verifies that the GitHub user submitting the PR is the authorized owner of the domain record being modified.
 - Schema Validation: Ensures your JSON structure is valid. If your file is malformed or unauthorized, the system will apply an Invalid Record label and provide feedback via a PR comment.

 - Syncing: Once merged, our automated GitHub Actions sync your configuration with Cloudflare DNS within 5 minutes.

## Guidelines & Restrictions
### Allowed Characters

 - Lowercase alphanumeric characters (a-z, 0-9)

 - Dashes (-)

 - No spaces, special characters, or uppercase letters.

## Reserved Subdomains

### The following subdomains are blacklisted and cannot be claimed:
``www``, ``api``, ``admin``, ``root``, ``support``, ``mail``, ``ssl``.

## Workflow Labels
### You may see the following labels applied to your PR:

 - type: new-domain: New registration detected.
 - type: domain-update: Modification to an existing record.
 - Record Valid / Record Invalid: Automatic status indicators based on validation results.
 - bypass: Used by maintainers to skip automated verification.

Maintained with ❤️ by @s8rr.

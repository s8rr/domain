# code-space.me

A free, open-source subdomain registry for Bangladeshi developers and students. Get your own `yourname.code-space.me` subdomain to host your portfolio, blog, or personal projects.

The entire system is powered by Infrastructure-as-Code using DNSControl and synced live with Cloudflare via GitHub Actions.

## Requirements

- Your subdomain must point to a static hosting provider (GitHub Pages, Vercel, Netlify, Cloudflare Pages, etc.).
- The name of your JSON file **must match your GitHub username** exactly (e.g., if your username is `arif-dev`, your file must be `domains/arif-dev.json`). This is a security feature to prevent domain squatting.

## How to Register Your Subdomain

### 1. Fork and Clone
Fork this repository to your GitHub account, then clone it locally:
```bash
git clone [https://github.com/YOUR-USERNAME/domain.git](https://github.com/YOUR-USERNAME/domain.git)
cd domain

```

### 2. Create Your Record File

Inside the `domains/` folder, create a new file named exactly after your GitHub username with a `.json` extension.

**Example (`domains/s8rr.json`):**

```json
{
  "owner": {
    "username": "s8rr",
    "email": "hello@sabbir.is-a.dev"
  },
  "records": {
    "CNAME": "s8rr.github.io"
  }
}

```

*Note: If you need to map to an IP address instead of a CNAME, change `"CNAME"` to `"A"` and provide your server's IP string or an array of IPs.*

### 3. Submit a Pull Request

Commit your changes, push them to your fork, and open a Pull Request against our `main` branch:

```bash
git add domains/YOUR-USERNAME.json
git commit -m "feat: register YOUR-USERNAME.code-space.me"
git push origin main

```

Our automated GitHub Action will run a lint check on your file structure. Once a maintainer reviews and merges your PR, the DNS updates will push live to Cloudflare within 5 minutes.

## Allowed Characters

* Lowercase alphanumeric characters (`a-z`, `0-9`)
* Dashes (`-`)
* No spaces, special characters, or uppercase letters.

## Reserved Subdomains

The following subdomains are blacklisted and cannot be claimed: `www`, `api`, `admin`, `root`, `support`, `mail`, `ssl`.

---

Maintained with ❤️ by [@s8rr](https://www.google.com/search?q=https://github.com/s8rr).

```


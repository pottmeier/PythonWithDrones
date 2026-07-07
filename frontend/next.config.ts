import os from 'os'

/** @type {import('next').NextConfig} */
const isPages = process.env.GITHUB_ACTIONS === 'true'
const repo = 'PythonWithDrones'

// dev server only (ignored in the static export build) — lets phones on the
// LAN load /_next/* assets when hitting the dev server via its LAN IP
// instead of localhost, which Next.js otherwise blocks as cross-origin.
// Computed from this machine's own network interfaces so it works for
// whoever runs `npm run dev`, not just one hardcoded IP.
function getLanIPs() {
  const nets = os.networkInterfaces()
  const ips: string[] = []
  for (const addrs of Object.values(nets)) {
    for (const addr of addrs ?? []) {
      if (addr.family === 'IPv4' && !addr.internal) ips.push(addr.address)
    }
  }
  return ips
}

const nextConfig = {
  output: 'export',          // zwingt Next.js zu statischem Export
  basePath: isPages ? `/${repo}` : '',   // Routen enthalten Repo-Namen
  assetPrefix: isPages ? `/${repo}/` : '', // CSS/JS lädt korrekt
  trailingSlash: true,       // wichtig für /level/1/index.html
  images: { unoptimized: true },    // verhindert Fehler bei <Image>
  env: {
    NEXT_PUBLIC_BASE_PATH: isPages ? `/${repo}` : '', // optional im Code nutzbar
  },
  allowedDevOrigins: getLanIPs(),
}

module.exports = nextConfig
/** @type {import('next').NextConfig} */
const isPages = process.env.GITHUB_ACTIONS === 'true'
const repo = 'PythonWithDrones'

const nextConfig = {
  output: 'export',          // zwingt Next.js zu statischem Export
  basePath: isPages ? `/${repo}` : '',   // Routen enthalten Repo-Namen
  assetPrefix: isPages ? `/${repo}/` : '', // CSS/JS lädt korrekt
  trailingSlash: true,       // wichtig für /level/1/index.html
  images: { unoptimized: true },    // verhindert Fehler bei <Image>
  env: {
    NEXT_PUBLIC_BASE_PATH: isPages ? `/${repo}` : '', // optional im Code nutzbar
  },
}

module.exports = nextConfig
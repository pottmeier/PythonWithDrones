// frontend/next.config.js
/** @type {import('next').NextConfig} */
const isPages = process.env.GITHUB_ACTIONS === 'true'
const repo = 'PythonWithDrones'

module.exports = {
  output: 'export',            // required for App Router static export
  images: { unoptimized: true },
  // Optional: if deploying to https://<user>.github.io/<repo>
  basePath: isPages ? `/${repo}` : undefined,
  assetPrefix: isPages ? `/${repo}/` : undefined,
  trailingSlash: true,          // avoids some 404s on Pages
  env: {
    NEXT_PUBLIC_BASE_PATH: isPages ? `/${repo}` : '',
  },
}

# The Playwright base image already carries Chromium and every system library it
# needs. Installing Chromium by hand on a plain node image is the usual source of
# "works locally, blank PDF in production".
#
# The tag MUST match the `playwright` version in package.json — the image ships
# the browser build that version expects, and a mismatch fails at launch with
# "Executable doesn't exist". That is why playwright is pinned exactly there.
FROM mcr.microsoft.com/playwright:v1.62.1-noble

# pdftotext. Extraction is pure code and never spends a token, so it has to be
# present in the image.
RUN apt-get update \
 && apt-get install -y --no-install-recommends poppler-utils \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# scripts/ is copied before the install because package.json has a postinstall
# that copies KaTeX out of node_modules; without it `npm ci` fails on a missing
# module. better-sqlite3 needs its own install scripts, so --ignore-scripts is
# not an option.
COPY package.json package-lock.json* ./
COPY scripts ./scripts
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# Uploads, the extract cache, generated PDFs and the SQLite file all live here.
# Mount a persistent volume on it, or a redeploy wipes the accounts and the
# credit history.
ENV ESTUDO_DATA_DIR=/data
RUN mkdir -p /data

EXPOSE 3000

# Chromium needs a writable /dev/shm; the default 64MB is enough for one render
# at a time, and render.ts launches a single page.
CMD ["npm", "run", "start"]

FROM oven/bun:1 AS base
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .

USER bun
EXPOSE 8080
# --smol runs Bun's GC more aggressively and grows the heap more slowly,
# keeping RSS low on small Railway instances.
CMD ["bun", "--smol", "src/index.ts"]

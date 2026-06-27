FROM oven/bun:1 AS base
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
USER bun
EXPOSE 8080
# --smol runs Bun's GC more aggressively and grows the heap more slowly,
# keeping RSS low on the 512MB instance. The memory "climb" is GC sawtooth,
# not a leak (the heap is reclaimed without a restart); --smol lowers the
# sawtooth peaks to reduce OOM risk under bursts. CPU sits at ~2-5%, so the
# extra GC work is effectively free for this workload.
CMD ["bun", "--smol", "src/index.ts"]

FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --production --frozen-lockfile --ignore-scripts

COPY src ./src

ENV NODE_ENV=production

CMD ["bun", "run", "src/dockerWatch.ts"]

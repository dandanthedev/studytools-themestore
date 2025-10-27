FROM oven/bun:1

WORKDIR /app

COPY package.json .
COPY bun.lock .
COPY tsconfig.json .

RUN bun install

COPY . .

RUN bunx convex deploy
RUN bun run build

EXPOSE 3000

CMD ["bun","run", "start"]
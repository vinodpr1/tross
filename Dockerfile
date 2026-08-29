FROM oven/bun:1

WORKDIR /app

COPY package.json package-lock.json ./

RUN bun install

COPY . .

RUN bun run build

EXPOSE 3100

CMD ["bun", "run", "start:backend"]

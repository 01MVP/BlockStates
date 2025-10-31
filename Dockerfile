# syntax=docker/dockerfile:1

ARG NEXT_PUBLIC_SERVER_API=http://127.0.0.1:3001

FROM node:20-slim AS server-build
WORKDIR /app/server

COPY server/package.json server/package-lock.json ./
COPY server/pnpm-lock.yaml ./pnpm-lock.yaml
COPY server/prisma ./prisma

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

RUN npm ci

COPY server/tsconfig.json ./tsconfig.json
COPY server/src ./src

RUN npm run build
RUN npx prisma generate

FROM node:20-slim AS client-build
WORKDIR /app/client

ARG NEXT_PUBLIC_SERVER_API
ENV NEXT_PUBLIC_SERVER_API=${NEXT_PUBLIC_SERVER_API}

COPY client/package.json client/pnpm-lock.yaml ./

RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
RUN pnpm install --frozen-lockfile

COPY client .

RUN pnpm build

FROM node:20-slim AS runner
WORKDIR /app

ARG NEXT_PUBLIC_SERVER_API
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_SERVER_API=${NEXT_PUBLIC_SERVER_API}
ENV PORT=3000
ENV SERVER_PORT=3001

RUN apt-get update \
  && apt-get install -y --no-install-recommends dumb-init openssl \
  && rm -rf /var/lib/apt/lists/*

COPY --from=server-build /app/server/node_modules ./server/node_modules
COPY --from=server-build /app/server/dist ./server/dist
COPY --from=server-build /app/server/prisma ./server/prisma
COPY --from=server-build /app/server/package.json ./server/package.json

COPY --from=client-build /app/client/.next/standalone ./client
COPY --from=client-build /app/client/.next/static ./client/.next/static
COPY --from=client-build /app/client/public ./client/public

COPY docker/start.sh ./start.sh

RUN chmod +x ./start.sh

EXPOSE 3000 3001

ENTRYPOINT ["dumb-init", "--"]
CMD ["./start.sh"]

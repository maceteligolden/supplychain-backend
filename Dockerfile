FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare yarn@1.22.22 --activate

FROM base AS deps
COPY package.json yarn.lock ./
ENV HUSKY=0
RUN yarn install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY package.json yarn.lock ./
COPY prisma ./prisma
COPY tsconfig.json ./
COPY src ./src
RUN yarn prisma:generate
RUN yarn build

FROM base AS runner
ENV NODE_ENV=production
ENV HUSKY=0
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json yarn.lock ./
EXPOSE 5009
CMD ["sh", "-c", "yarn prisma migrate deploy && yarn seed && node dist/index.js"]

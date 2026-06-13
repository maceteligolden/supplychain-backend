FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare yarn@stable --activate

FROM base AS deps
COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn prisma:generate
RUN yarn build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json ./
EXPOSE 5009
CMD ["node", "dist/index.js"]

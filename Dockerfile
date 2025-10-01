# Build stage
FROM node:20-slim AS builder

WORKDIR /opt/outline

# Copy package files
COPY package.json yarn.lock ./
COPY patches ./patches

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN yarn build

# ---
# Runtime stage
FROM node:20-slim AS runner

LABEL org.opencontainers.image.source="https://github.com/Ed-BW/outlineAIwiki"

WORKDIR /opt/outline
ENV NODE_ENV=production

# Copy built application from builder
COPY --from=builder /opt/outline/build ./build
COPY --from=builder /opt/outline/server ./server
COPY --from=builder /opt/outline/public ./public
COPY --from=builder /opt/outline/.sequelizerc ./.sequelizerc
COPY --from=builder /opt/outline/node_modules ./node_modules
COPY --from=builder /opt/outline/package.json ./package.json

# Install wget for healthcheck
RUN apt-get update \
  && apt-get install -y wget \
  && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN addgroup --gid 1001 nodejs && \
  adduser --uid 1001 --ingroup nodejs nodejs && \
  chown -R nodejs:nodejs /opt/outline/build && \
  mkdir -p /var/lib/outline && \
  chown -R nodejs:nodejs /var/lib/outline

ENV FILE_STORAGE_LOCAL_ROOT_DIR=/var/lib/outline/data
RUN mkdir -p "$FILE_STORAGE_LOCAL_ROOT_DIR" && \
  chown -R nodejs:nodejs "$FILE_STORAGE_LOCAL_ROOT_DIR" && \
  chmod 1777 "$FILE_STORAGE_LOCAL_ROOT_DIR"

USER nodejs

HEALTHCHECK --interval=1m --start-period=30s CMD wget -qO- "http://localhost:${PORT:-3000}/_health" | grep -q "OK" || exit 1

EXPOSE 3000
CMD ["yarn", "start"]

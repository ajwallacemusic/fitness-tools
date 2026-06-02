# Build core + api from the workspace, then run the api on Cloud Run.
FROM node:22-slim AS build
WORKDIR /app
# corepack reads the root package.json "packageManager" field and activates the
# pinned pnpm (10.33.0) on first invocation, matching the host. This avoids the
# pnpm-11 supply-chain guardrails (minimumReleaseAge, strict ignored-builds,
# verify-deps-before-run) that previously required env-var workarounds.
RUN corepack enable
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/core/package.json packages/core/package.json
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --frozen-lockfile
COPY packages/core packages/core
COPY apps/api apps/api
RUN pnpm -C packages/core build && pnpm -C apps/api build
# --legacy: pnpm 10+ otherwise refuses to deploy a workspace that is not set up
# with inject-workspace-packages; --legacy copies the linked workspace dep instead.
RUN pnpm --filter @fitness-tools/api deploy --prod --legacy /out

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /out /app
USER node
EXPOSE 8080
CMD ["node", "dist/server.js"]

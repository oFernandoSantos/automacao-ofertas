FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Apply schema changes before serving the app. Both scripts are idempotent.
CMD ["sh", "-c", "npm run db:migrate && npm run db:seed && npm run start"]

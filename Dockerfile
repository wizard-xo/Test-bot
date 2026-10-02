FROM node:24.4.1-alpine

RUN apk update && \
apk add --no-cache git ffmpeg
COPY package.json .
RUN npm i --legacy-peer-deps
COPY . .
EXPOSE 8080

CMD ["npm", "start"]

FROM node:16-alpine3.15

# set our node environment, either development or production
# defaults to production, compose overrides this to development on build and run
ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

# 安装Alphine必要apk包
RUN apk add --no-cache python3 make g++ && rm -rf /var/cache/apk/*
RUN apk add --no-cache git openssh

# you'll likely want the latest npm, regardless of node version, for speed and fixes
# but pin this version for the best stability
RUN npm i npm@latest pnpm -g
RUN npm install typescript -g

# install dependencies first, in a different location for easier app bind mounting for local development
# 先把dependencies安装好，这样如果改代码不修改dependencies的话不用重新build dockerfile
RUN mkdir -p /home/node/app && chown -R node:node /home/node/
WORKDIR /home/node/
COPY package.json pnpm-lock.yaml ./
RUN pnpm install
ENV PATH /home/node/node_modules/.bin:$PATH

# copy in our source code last, as it changes the most
WORKDIR /home/node/app
COPY . .

# the official node image provides an unprivileged user as a security best practice
# https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md#non-root-user
RUN chown -R node /home/node
USER node

RUN pnpm build

CMD [ "pnpm", "run", "start" ]
FROM node:20.2.0 as build
ARG BUILD_CONTEXT

WORKDIR /app

ARG USERNAME=sneedex
ARG USER_UID=1001
ARG USER_GID=$USER_UID

RUN groupadd --gid $USER_GID $USERNAME \
  && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME \
  && apt-get update \
  && apt-get install -y sudo \
  && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
  && chmod 0440 /etc/sudoers.d/$USERNAME

COPY package.json ./
COPY yarn.lock ./

RUN yarn install

COPY . .

ENV NODE_ENV production

USER sneedex

EXPOSE 3000

CMD ["yarn", "start"]

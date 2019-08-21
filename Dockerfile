FROM node:8.4.0-alpine

EXPOSE 8888

COPY . .

RUN apk add --no-cache --virtual .gyp \
    autoconf \
    automake \
    g++ \
    libpng-dev \
    libtool \
    make \
    nasm \
    python \
    git \
  && npm i \
  && npm rebuild bcrypt --build-from-source \
  && apk del .gyp

RUN npm install --production

CMD [ "npm", "start" ]
FROM node:8.4.0-alpine

EXPOSE 8888

COPY . .

RUN npm install --production

CMD [ "npm", "start" ]
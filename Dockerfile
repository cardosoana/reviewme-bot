FROM node:6.9.2

WORKDIR /home/app

COPY . .

CMD ["bin/hubot", "-a", "slack"]

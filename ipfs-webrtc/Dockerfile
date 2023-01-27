FROM node
WORKDIR /app
COPY package.json .
RUN npm i
COPY . .
## EXPOSE [Port you mentioned in the vite.config file]
ARG port
ENV env_port $port
EXPOSE $port
CMD ["npm", "run", "dev"]


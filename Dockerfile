# Usar uma imagem base oficial do Node.js
FROM node:14

# Definir o diretório de trabalho dentro do contêiner
WORKDIR /usr/src/app

# Copiar o package.json e package-lock.json para o diretório de trabalho
COPY package*.json ./

# Instalar as dependências do Node.js
RUN npm install

# Copiar o restante do código da aplicação para o diretório de trabalho
COPY . .

# Expor a porta em que a aplicação irá rodar
EXPOSE 3000

# Definir o comando para iniciar a aplicação
CMD ["node", "server.js"]
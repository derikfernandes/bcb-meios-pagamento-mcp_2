FROM node:20-alpine

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY src ./src

# Compilar TypeScript
RUN npm run build

# Expor porta
EXPOSE 3000

# Comando para iniciar o servidor HTTP
CMD ["npm", "run", "start:http"]

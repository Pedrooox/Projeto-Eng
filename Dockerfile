FROM node:22-slim

# Instala Python e compiladores C++ necessários para o better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia os arquivos de dependências e instala apenas o necessário para produção
COPY package*.json ./
RUN npm install --omit=dev

# Copia o restante do código (server.js, db.js, routes/ e public/)
COPY . .

# Cria a pasta para persistência do banco SQLite
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["npm", "start"]
# Guia de Deployment para ChatGPT

Este guia explica como fazer deploy do servidor MCP para uso com ChatGPT e outros clientes que requerem acesso via HTTP/HTTPS.

## Requisitos para ChatGPT

ChatGPT **requer**:
- ✅ Servidor acessível via HTTPS (não aceita localhost)
- ✅ Suporte a Server-Sent Events (SSE)
- ✅ Assinatura ChatGPT Pro, Plus, Team, Education ou Enterprise

## Opções de Deployment

### 1. Render (Recomendado - Free Tier Disponível)

Render oferece deploy gratuito com HTTPS automático.

**Passos:**

1. Crie uma conta em [render.com](https://render.com)
2. Conecte seu repositório GitHub
3. Clique em "New Web Service"
4. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:http`
   - **Environment**: Node
   - **Plan**: Free

O arquivo `render.yaml` já está configurado para deploy automático.

**URL resultante**: `https://seu-app.onrender.com`

### 2. Railway

Railway oferece $5 de crédito gratuito por mês.

**Passos:**

1. Crie uma conta em [railway.app](https://railway.app)
2. Clique em "New Project" → "Deploy from GitHub repo"
3. Selecione este repositório
4. Railway detectará automaticamente o `railway.json` e configurará o deploy

**URL resultante**: `https://seu-app.railway.app`

### 3. Heroku

**Passos:**

1. Instale o Heroku CLI
2. Execute:
```bash
heroku login
heroku create seu-app-name
git push heroku main
```

Adicione um `Procfile`:
```
web: npm run start:http
```

**URL resultante**: `https://seu-app-name.herokuapp.com`

### 4. Docker (Qualquer provedor)

Use o `Dockerfile` incluído para fazer deploy em qualquer provedor que suporte containers:

```bash
# Build
docker build -t bcb-mcp-server .

# Run localmente para testar
docker run -p 3000:3000 bcb-mcp-server

# Push para registry (exemplo: Docker Hub)
docker tag bcb-mcp-server seu-usuario/bcb-mcp-server
docker push seu-usuario/bcb-mcp-server
```

Provedores compatíveis:
- Google Cloud Run
- AWS ECS/Fargate
- Azure Container Instances
- DigitalOcean App Platform

### 5. Desenvolvimento Local com ngrok

Para testar localmente com ChatGPT durante desenvolvimento:

**Passos:**

1. Instale ngrok: [ngrok.com](https://ngrok.com)
2. Inicie o servidor local:
```bash
npm run dev:http
```

3. Em outro terminal, inicie o ngrok:
```bash
ngrok http 3000
```

4. Use a URL HTTPS fornecida pelo ngrok (exemplo: `https://abc123.ngrok.io`)

**Nota**: URLs do ngrok mudam a cada execução no plano gratuito.

## Verificando o Deployment

Após o deploy, verifique se o servidor está funcionando:

```bash
# Health check
curl https://seu-servidor.com/health

# Deve retornar:
# {"status":"ok","service":"bcb-meios-pagamento-mcp"}
```

## Configurando no ChatGPT

Depois de fazer o deploy:

1. Acesse ChatGPT com assinatura Pro/Plus/Team/Enterprise
2. Ative o "Developer Mode"
3. Adicione um novo MCP Server:
   - **Nome**: BCB Meios de Pagamento
   - **URL SSE**: `https://seu-servidor.com/sse`
   - **Tipo**: Server-Sent Events

4. Teste fazendo uma pergunta:
```
Quais foram os dados de PIX em dezembro de 2023?
```

## Variáveis de Ambiente

Configure as seguintes variáveis no seu provedor de deploy:

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `PORT` | `3000` (ou automático) | Porta do servidor |
| `NODE_ENV` | `production` | Ambiente de execução |

## Monitoramento

Verifique os logs do servidor:

**Render:**
```bash
# No dashboard do Render, acesse "Logs"
```

**Railway:**
```bash
railway logs
```

**Docker:**
```bash
docker logs <container-id>
```

## Solução de Problemas

### Erro: "Cannot connect to server"
- Verifique se a URL HTTPS está correta
- Confirme que o endpoint `/sse` está acessível
- Teste o health check: `curl https://seu-servidor.com/health`

### Erro: "SSE connection failed"
- Verifique se CORS está habilitado (já configurado no código)
- Confirme que o servidor suporta streaming HTTP

### Servidor retorna 404
- Certifique-se de que fez o build: `npm run build`
- Verifique se o comando de start está correto: `npm run start:http`

## Custos Estimados

| Provedor | Free Tier | Custo Mensal Estimado |
|----------|-----------|----------------------|
| Render | Sim (com limitações) | $0 - $7 |
| Railway | $5 crédito/mês | $5 - $10 |
| Heroku | Não (desde 2022) | $7 - $25 |
| ngrok | Sim | $0 (desenvolvimento) |

## Segurança

**Recomendações para produção:**

1. **Adicione rate limiting**:
```bash
npm install express-rate-limit
```

2. **Adicione autenticação** (se necessário):
```javascript
// Em src/http-server.ts
app.use((req, res, next) => {
  const token = req.headers.authorization;
  if (token !== `Bearer ${process.env.API_KEY}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

3. **Configure HTTPS adequadamente** (automático na maioria dos provedores)

4. **Monitore uso** para evitar abusos da API do BCB

## Próximos Passos

Após o deployment bem-sucedido:

1. ✅ Teste todas as ferramentas no ChatGPT
2. ✅ Configure alertas de monitoramento
3. ✅ Documente a URL do servidor para sua equipe
4. ✅ Considere adicionar cache para reduzir chamadas à API do BCB

## Suporte

Para problemas:
- Verifique os logs do servidor
- Consulte a documentação da API do BCB
- Abra uma issue no GitHub do projeto

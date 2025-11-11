# Configuração para OpenAI MCP

Este documento descreve como configurar o servidor MCP BCB para funcionar com a OpenAI.

## Endpoints Disponíveis

O servidor expõe os seguintes endpoints compatíveis com a especificação MCP da OpenAI:

### 1. Informações do Servidor
- **Endpoint**: `GET /`
- **Descrição**: Retorna informações sobre o servidor MCP
- **Resposta**:
```json
{
  "name": "bcb-meios-pagamento-mcp",
  "version": "1.0.0",
  "protocol": "mcp",
  "description": "Servidor MCP para API de Dados Abertos de Meios de Pagamento do Banco Central do Brasil",
  "endpoints": {
    "tools": "/tools",
    "callTool": "/tools/call",
    "sse": "/sse",
    "health": "/health",
    "info": "/mcp/info"
  },
  "capabilities": {
    "tools": {}
  }
}
```

### 2. Listar Tools
- **Endpoint**: `GET /tools`
- **Descrição**: Lista todas as tools disponíveis
- **Resposta**:
```json
{
  "tools": [
    {
      "name": "consultar_meios_pagamento_mensal",
      "description": "Consulta dados mensais sobre meios de pagamento...",
      "inputSchema": {
        "type": "object",
        "properties": {
          "ano_mes": {
            "type": "string",
            "description": "Ano e mês no formato YYYYMM (exemplo: '202312')"
          },
          "top": {
            "type": "number",
            "description": "Número máximo de registros a retornar (padrão: 100)"
          },
          "skip": {
            "type": "number",
            "description": "Número de registros a pular para paginação"
          },
          "filtro": {
            "type": "string",
            "description": "Filtro OData para refinar a consulta"
          }
        },
        "required": ["ano_mes"]
      }
    },
    ...
  ]
}
```

### 3. Chamar Tool
- **Endpoint**: `POST /tools/call`
- **Descrição**: Executa uma tool específica
- **Body**:
```json
{
  "name": "consultar_meios_pagamento_mensal",
  "arguments": {
    "ano_mes": "202312",
    "top": 100
  }
}
```
- **Resposta de Sucesso**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "{...dados da API...}"
    }
  ]
}
```
- **Resposta de Erro**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "Erro ao executar tool: ..."
    }
  ],
  "isError": true
}
```

### 4. Health Check
- **Endpoint**: `GET /health`
- **Descrição**: Verifica se o servidor está funcionando
- **Resposta**:
```json
{
  "status": "ok",
  "service": "bcb-meios-pagamento-mcp"
}
```

### 5. Informações MCP
- **Endpoint**: `GET /mcp/info`
- **Descrição**: Retorna informações específicas do protocolo MCP
- **Resposta**:
```json
{
  "name": "bcb-meios-pagamento-mcp",
  "version": "1.0.0",
  "protocol": "mcp",
  "capabilities": {
    "tools": {}
  }
}
```

### 6. SSE Endpoint (Alternativo)
- **Endpoint**: `GET /sse`
- **Descrição**: Endpoint Server-Sent Events para clientes MCP padrão
- **Uso**: Para clientes que preferem comunicação via SSE

## Configuração na OpenAI

### Opção 1: Endpoints REST (Recomendado)

1. **URL Base**: `https://seu-servidor.com`
2. **Endpoints**:
   - Listar Tools: `GET /tools`
   - Chamar Tool: `POST /tools/call`
3. **Headers**: 
   - `Content-Type: application/json`
   - `Accept: application/json`

### Opção 2: SSE (Alternativo)

1. **URL SSE**: `https://seu-servidor.com/sse`
2. **Tipo**: Server-Sent Events (SSE)
3. **Endpoint de Mensagens**: `POST /message`

## Formato das Tools

Todas as tools seguem o formato MCP padrão:

```typescript
{
  name: string;           // Nome único da tool
  description: string;    // Descrição da tool
  inputSchema: {          // JSON Schema
    type: "object";
    properties: { ... };
    required: string[];
  };
}
```

## Exemplo de Uso

### Listar Tools
```bash
curl https://seu-servidor.com/tools
```

### Chamar Tool
```bash
curl -X POST https://seu-servidor.com/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "consultar_meios_pagamento_mensal",
    "arguments": {
      "ano_mes": "202312"
    }
  }'
```

## Troubleshooting

### Problema: OpenAI não encontra as tools

**Solução 1**: Verifique se o endpoint `/tools` está retornando o formato correto:
```bash
curl https://seu-servidor.com/tools
```

**Solução 2**: Verifique se o servidor está acessível publicamente (HTTPS)

**Solução 3**: Verifique os logs do servidor para erros

**Solução 4**: Use o endpoint SSE como alternativa:
```
URL: https://seu-servidor.com/sse
```

### Problema: Erro ao chamar tool

**Solução 1**: Verifique se os parâmetros obrigatórios estão sendo enviados

**Solução 2**: Verifique se o formato do body está correto:
```json
{
  "name": "nome_da_tool",
  "arguments": { ... }
}
```

**Solução 3**: Verifique os logs do servidor para detalhes do erro

## CORS

O servidor está configurado para aceitar requisições de qualquer origem (`*`). Para produção, considere restringir para domínios específicos.

## Segurança

- O servidor não requer autenticação por padrão
- Para produção, considere adicionar autenticação (API keys, OAuth, etc.)
- Use HTTPS em produção
- Considere rate limiting para prevenir abuso

## Testes

### Teste Local

1. Inicie o servidor:
```bash
npm run start:http
```

2. Teste os endpoints:
```bash
# Health check
curl http://localhost:3000/health

# Listar tools
curl http://localhost:3000/tools

# Chamar tool
curl -X POST http://localhost:3000/tools/call \
  -H "Content-Type: application/json" \
  -d '{"name": "consultar_meios_pagamento_mensal", "arguments": {"ano_mes": "202312"}}'
```

### Teste em Produção

Substitua `localhost:3000` pela URL do seu servidor em produção.


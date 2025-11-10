# Servidor MCP - Dados Abertos de Meios de Pagamento do BCB

Servidor MCP (Model Context Protocol) para acessar os dados abertos de meios de pagamento do Banco Central do Brasil através de LLMs como Claude, ChatGPT e outros.

<a href="https://glama.ai/mcp/servers/@derikfernandes/bcb-meios-pagamento-mcp_2">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@derikfernandes/bcb-meios-pagamento-mcp_2/badge" alt="BCB Payment Methods Server MCP server" />
</a>

## 📋 Descrição

Este servidor MCP fornece acesso programático à API de Dados Abertos de Meios de Pagamento do Banco Central do Brasil, permitindo que assistentes de IA consultem informações sobre:

- 💳 Transações com cartões de pagamento
- 📊 Dados mensais e trimestrais de meios de pagamento
- 🏪 Estabelecimentos credenciados
- 💰 Taxas de intercâmbio e desconto
- 🏧 Estatísticas de terminais ATM
- 👥 Informações sobre portadores de cartão
- 📱 Dados sobre PIX, TED, DOC, boletos e outros

## 🚀 Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/bcb-meios-pagamento-mcp.git
cd bcb-meios-pagamento-mcp

# Instale as dependências
npm install

# Compile o TypeScript
npm run build
```

## 🔧 Configuração

Este servidor oferece **duas formas de uso**:

### Opção 1: Claude Desktop (Uso Local)

Para uso local com Claude Desktop, adicione ao arquivo de configuração (`~/Library/Application Support/Claude/claude_desktop_config.json` no macOS ou `%APPDATA%/Claude/claude_desktop_config.json` no Windows):

```json
{
  "mcpServers": {
    "bcb-meios-pagamento": {
      "command": "node",
      "args": ["/caminho/completo/para/bcb-meios-de-pagamentos/dist/index.js"]
    }
  }
}
```

### Opção 2: ChatGPT (Servidor Remoto)

ChatGPT requer que o servidor esteja hospedado com HTTPS. Siga estas etapas:

#### Passo 1: Deploy do Servidor

Escolha uma opção de deployment:

**Opção A - Render (Recomendado - Free Tier)**
1. Crie uma conta em [render.com](https://render.com)
2. Conecte seu repositório GitHub
3. Use as configurações do arquivo `render.yaml` incluído
4. Seu servidor estará disponível em `https://seu-app.onrender.com`

**Opção B - Railway**
1. Crie uma conta em [railway.app](https://railway.app)
2. Faça deploy do repositório
3. Use as configurações do arquivo `railway.json` incluído
4. Seu servidor estará disponível em `https://seu-app.railway.app`

**Opção C - ngrok (Desenvolvimento Local)**
```bash
# Terminal 1: Inicie o servidor HTTP
npm run dev:http

# Terminal 2: Exponha via ngrok
ngrok http 3000
```

Consulte [DEPLOYMENT.md](./DEPLOYMENT.md) para guia completo de deployment.

#### Passo 2: Configurar no ChatGPT

1. Acesse ChatGPT com assinatura **Pro, Plus, Team, Education ou Enterprise**
2. Ative o **Developer Mode**
3. Adicione um novo MCP Server:
   - **Nome**: BCB Meios de Pagamento
   - **URL SSE**: `https://seu-servidor.com/sse`
   - **Tipo**: Server-Sent Events (SSE)

4. Teste perguntando: *"Quais foram os dados de PIX em dezembro de 2023?"*

### Opção 3: Outros LLMs

Este servidor segue o protocolo MCP padrão e é compatível com qualquer LLM que suporte:
- **Modo Local**: Protocolo stdio (como Claude Desktop)
- **Modo Remoto**: Protocolo SSE via HTTP/HTTPS (como ChatGPT)

## 🛠️ Ferramentas Disponíveis

### 1. `consultar_meios_pagamento_mensal`
Consulta dados mensais sobre meios de pagamento (PIX, TED, DOC, boletos, etc.).

**Parâmetros:**
- `ano_mes` (obrigatório): Formato YYYYMM (ex: "202312")
- `top` (opcional): Número máximo de registros
- `skip` (opcional): Paginação
- `filtro` (opcional): Filtro OData

**Exemplo:**
```
Consulte os dados de meios de pagamento para dezembro de 2023
```

### 2. `consultar_meios_pagamento_trimestral`
Consulta dados trimestrais de cartões e transferências.

**Parâmetros:**
- `trimestre` (obrigatório): Formato YYYYQ (ex: "20234")
- `top` (opcional): Número máximo de registros
- `skip` (opcional): Paginação
- `filtro` (opcional): Filtro OData

**Exemplo:**
```
Mostre os dados trimestrais do 4º trimestre de 2023
```

### 3. `consultar_transacoes_cartoes`
Consulta estoque e transações de cartões.

**Parâmetros:**
- `trimestre` (obrigatório): Formato YYYYQ
- `top` (opcional): Número máximo de registros
- `ordenar_por` (opcional): Campo para ordenação
- `filtro` (opcional): Filtro OData

### 4. `consultar_estabelecimentos_credenciados`
Consulta quantidade de estabelecimentos credenciados.

**Parâmetros:**
- `trimestre` (obrigatório): Formato YYYYQ
- `top` (opcional): Número máximo de registros
- `ordenar_por` (opcional): Campo para ordenação
- `filtro` (opcional): Filtro OData

### 5. `consultar_taxas_intercambio`
Consulta taxas de intercâmbio do mercado.

**Parâmetros:**
- `trimestre` (obrigatório): Formato YYYYQ
- `top` (opcional): Número máximo de registros
- `filtro` (opcional): Filtro OData

### 6. `consultar_taxas_desconto`
Consulta taxas de desconto cobradas de estabelecimentos.

**Parâmetros:**
- `trimestre` (obrigatório): Formato YYYYQ
- `top` (opcional): Número máximo de registros
- `filtro` (opcional): Filtro OData

### 7. `consultar_terminais_atm`
Consulta estatísticas sobre terminais ATM.

**Parâmetros:**
- `trimestre` (obrigatório): Formato YYYYQ
- `top` (opcional): Número máximo de registros
- `filtro` (opcional): Filtro OData

### 8. `consultar_portadores_cartao`
Consulta informações sobre portadores de cartão.

**Parâmetros:**
- `trimestre` (obrigatório): Formato YYYYQ
- `top` (opcional): Número máximo de registros
- `filtro` (opcional): Filtro OData

## 📖 Exemplos de Uso

Após configurar o servidor, você pode fazer perguntas naturais ao seu assistente de IA:

```
Quais foram os dados de PIX em dezembro de 2023?

Mostre as transações com cartões no último trimestre de 2023

Quantos estabelecimentos estavam credenciados no 3º trimestre de 2023?

Quais são as taxas de intercâmbio atuais?
```

## 🔍 Filtros OData

Você pode usar filtros OData para refinar suas consultas:

```
Modalidade eq 'PIX'
Trimestre eq '20234'
Valor gt 1000000
```

Operadores suportados:
- `eq`: igual
- `ne`: diferente
- `gt`: maior que
- `ge`: maior ou igual
- `lt`: menor que
- `le`: menor ou igual
- `and`: e lógico
- `or`: ou lógico

## 🔗 API do Banco Central

Este servidor utiliza a API oficial de Dados Abertos do Banco Central do Brasil:
https://olinda.bcb.gov.br/olinda/servico/MPV_DadosAbertos/versao/v1/swagger-ui3

## 📄 Licença

MIT

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

## 📧 Contato

Para dúvidas ou sugestões, abra uma issue no GitHub.

## 📚 Documentação Adicional

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guia completo de deployment para ChatGPT
- [GUIA_CONFIGURACAO.md](./GUIA_CONFIGURACAO.md) - Configuração detalhada
- [EXEMPLOS.md](./EXEMPLOS.md) - Exemplos de uso

## 🔄 Atualizações

- v1.0.0 (2024): Versão inicial com 8 ferramentas principais
- v1.1.0 (2025): Adicionado suporte para ChatGPT via HTTP/SSE
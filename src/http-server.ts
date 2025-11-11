#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import express from "express";
import cors from "cors";

const API_BASE_URL = "https://olinda.bcb.gov.br/olinda/servico/MPV_DadosAbertos/versao/v1/odata";

// Interface para parâmetros de consulta
interface QueryParams {
  formato?: string;
  top?: number;
  skip?: number;
  filter?: string;
  orderby?: string;
}

// Função auxiliar para construir URL com parâmetros
function buildUrl(endpoint: string, params: QueryParams = {}): string {
  const url = new URL(`${API_BASE_URL}/${endpoint}`);

  if (params.formato) url.searchParams.append("$format", params.formato);
  if (params.top) url.searchParams.append("$top", params.top.toString());
  if (params.skip) url.searchParams.append("$skip", params.skip.toString());
  if (params.filter) url.searchParams.append("$filter", params.filter);
  if (params.orderby) url.searchParams.append("$orderby", params.orderby);

  return url.toString();
}

// Função auxiliar para fazer requisições à API
async function fetchBCBData(endpoint: string, params: QueryParams = {}) {
  try {
    const url = buildUrl(endpoint, params);
    const response = await axios.get(url, {
      headers: {
        "Accept": "application/json"
      }
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Erro ao consultar API do BCB: ${error.message}`);
    }
    throw error;
  }
}

// Definição das ferramentas com metadados para ChatGPT
const tools: Tool[] = [
  {
    name: "consultar_meios_pagamento_mensal",
    description: "Consulta dados mensais sobre meios de pagamento, incluindo operações com boletos bancários, PIX, TED, DOC e outros. Use o formato YYYYMM para o parâmetro ano_mes (exemplo: '202312' para dezembro de 2023).",
    inputSchema: {
      type: "object",
      properties: {
        ano_mes: {
          type: "string",
          description: "Ano e mês no formato YYYYMM (exemplo: '202312')",
        },
        top: {
          type: "number",
          description: "Número máximo de registros a retornar (padrão: 100)",
        },
        skip: {
          type: "number",
          description: "Número de registros a pular para paginação",
        },
        filtro: {
          type: "string",
          description: "Filtro OData para refinar a consulta (exemplo: \"Modalidade eq 'PIX'\")",
        },
      },
      required: ["ano_mes"],
    },
  },
  {
    name: "consultar_meios_pagamento_trimestral",
    description: "Consulta dados trimestrais sobre operações com cartões de pagamento e transferências de crédito. Use o formato YYYYQ para o parâmetro trimestre (exemplo: '20234' para o 4º trimestre de 2023).",
    inputSchema: {
      type: "object",
      properties: {
        trimestre: {
          type: "string",
          description: "Ano e trimestre no formato YYYYQ (exemplo: '20234' para 4º trimestre de 2023)",
        },
        top: {
          type: "number",
          description: "Número máximo de registros a retornar (padrão: 100)",
        },
        skip: {
          type: "number",
          description: "Número de registros a pular para paginação",
        },
        filtro: {
          type: "string",
          description: "Filtro OData para refinar a consulta",
        },
      },
      required: ["trimestre"],
    },
  },
  {
    name: "consultar_transacoes_cartoes",
    description: "Consulta estoque e transações de cartões de pagamento por trimestre. Retorna dados sobre quantidade e valor das transações realizadas com cartões.",
    inputSchema: {
      type: "object",
      properties: {
        trimestre: {
          type: "string",
          description: "Ano e trimestre no formato YYYYQ (exemplo: '20234')",
        },
        top: {
          type: "number",
          description: "Número máximo de registros a retornar (padrão: 100)",
        },
        ordenar_por: {
          type: "string",
          description: "Campo para ordenação (exemplo: 'Trimestre desc')",
        },
        filtro: {
          type: "string",
          description: "Filtro OData para refinar a consulta",
        },
      },
      required: ["trimestre"],
    },
  },
  {
    name: "consultar_estabelecimentos_credenciados",
    description: "Consulta quantidade de estabelecimentos credenciados para aceitar meios de pagamento eletrônico por trimestre.",
    inputSchema: {
      type: "object",
      properties: {
        trimestre: {
          type: "string",
          description: "Ano e trimestre no formato YYYYQ (exemplo: '20234')",
        },
        top: {
          type: "number",
          description: "Número máximo de registros a retornar (padrão: 100)",
        },
        ordenar_por: {
          type: "string",
          description: "Campo para ordenação",
        },
        filtro: {
          type: "string",
          description: "Filtro OData para refinar a consulta",
        },
      },
      required: ["trimestre"],
    },
  },
  {
    name: "consultar_taxas_intercambio",
    description: "Consulta taxas de intercâmbio praticadas no mercado de meios de pagamento por trimestre.",
    inputSchema: {
      type: "object",
      properties: {
        trimestre: {
          type: "string",
          description: "Ano e trimestre no formato YYYYQ (exemplo: '20234')",
        },
        top: {
          type: "number",
          description: "Número máximo de registros a retornar (padrão: 100)",
        },
        filtro: {
          type: "string",
          description: "Filtro OData para refinar a consulta",
        },
      },
      required: ["trimestre"],
    },
  },
  {
    name: "consultar_taxas_desconto",
    description: "Consulta taxas de desconto cobradas de estabelecimentos comerciais por operações com meios de pagamento.",
    inputSchema: {
      type: "object",
      properties: {
        trimestre: {
          type: "string",
          description: "Ano e trimestre no formato YYYYQ (exemplo: '20234')",
        },
        top: {
          type: "number",
          description: "Número máximo de registros a retornar (padrão: 100)",
        },
        filtro: {
          type: "string",
          description: "Filtro OData para refinar a consulta",
        },
      },
      required: ["trimestre"],
    },
  },
  {
    name: "consultar_terminais_atm",
    description: "Consulta estatísticas sobre terminais de autoatendimento (ATM/caixas eletrônicos) por trimestre.",
    inputSchema: {
      type: "object",
      properties: {
        trimestre: {
          type: "string",
          description: "Ano e trimestre no formato YYYYQ (exemplo: '20234')",
        },
        top: {
          type: "number",
          description: "Número máximo de registros a retornar (padrão: 100)",
        },
        filtro: {
          type: "string",
          description: "Filtro OData para refinar a consulta",
        },
      },
      required: ["trimestre"],
    },
  },
  {
    name: "consultar_portadores_cartao",
    description: "Consulta informações sobre portadores de cartões de pagamento por trimestre.",
    inputSchema: {
      type: "object",
      properties: {
        trimestre: {
          type: "string",
          description: "Ano e trimestre no formato YYYYQ (exemplo: '20234')",
        },
        top: {
          type: "number",
          description: "Número máximo de registros a retornar (padrão: 100)",
        },
        filtro: {
          type: "string",
          description: "Filtro OData para refinar a consulta",
        },
      },
      required: ["trimestre"],
    },
  },
];

// Criar servidor MCP
function createMCPServer() {
  const server = new Server(
    {
      name: "bcb-meios-pagamento-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Handler para listagem de ferramentas
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools,
    };
  });

  // Handler para execução de ferramentas
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "consultar_meios_pagamento_mensal": {
          const { ano_mes, top = 100, skip, filtro } = args as {
            ano_mes: string;
            top?: number;
            skip?: number;
            filtro?: string;
          };

          const data = await fetchBCBData(`MeiosdePagamentosMensalDA(AnoMes=@AnoMes)?@AnoMes='${ano_mes}'`, {
            formato: "json",
            top,
            skip,
            filter: filtro,
          });

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        case "consultar_meios_pagamento_trimestral": {
          const { trimestre, top = 100, skip, filtro } = args as {
            trimestre: string;
            top?: number;
            skip?: number;
            filtro?: string;
          };

          const data = await fetchBCBData(`MeiosdePagamentosTrimestralDA(trimestre=@trimestre)?@trimestre='${trimestre}'`, {
            formato: "json",
            top,
            skip,
            filter: filtro,
          });

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        case "consultar_transacoes_cartoes": {
          const { trimestre, top = 100, ordenar_por, filtro } = args as {
            trimestre: string;
            top?: number;
            ordenar_por?: string;
            filtro?: string;
          };

          const data = await fetchBCBData(`Quantidadeetransacoesdecartoes(trimestre=@trimestre)?@trimestre='${trimestre}'`, {
            formato: "json",
            top,
            orderby: ordenar_por,
            filter: filtro,
          });

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        case "consultar_estabelecimentos_credenciados": {
          const { trimestre, top = 100, ordenar_por, filtro } = args as {
            trimestre: string;
            top?: number;
            ordenar_por?: string;
            filtro?: string;
          };

          const data = await fetchBCBData(`EstabCredTransDA(trimestre=@trimestre)?@trimestre='${trimestre}'`, {
            formato: "json",
            top,
            orderby: ordenar_por,
            filter: filtro,
          });

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        case "consultar_taxas_intercambio": {
          const { trimestre, top = 100, filtro } = args as {
            trimestre: string;
            top?: number;
            filtro?: string;
          };

          const data = await fetchBCBData(`TaxasIntercambioDA(trimestre=@trimestre)?@trimestre='${trimestre}'`, {
            formato: "json",
            top,
            filter: filtro,
          });

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        case "consultar_taxas_desconto": {
          const { trimestre, top = 100, filtro } = args as {
            trimestre: string;
            top?: number;
            filtro?: string;
          };

          const data = await fetchBCBData(`TaxasDescontoDA(trimestre=@trimestre)?@trimestre='${trimestre}'`, {
            formato: "json",
            top,
            filter: filtro,
          });

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        case "consultar_terminais_atm": {
          const { trimestre, top = 100, filtro } = args as {
            trimestre: string;
            top?: number;
            filtro?: string;
          };

          const data = await fetchBCBData(`TerminaisATMDA(trimestre=@trimestre)?@trimestre='${trimestre}'`, {
            formato: "json",
            top,
            filter: filtro,
          });

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        case "consultar_portadores_cartao": {
          const { trimestre, top = 100, filtro } = args as {
            trimestre: string;
            top?: number;
            filtro?: string;
          };

          const data = await fetchBCBData(`PortadoresCartaoDA(trimestre=@trimestre)?@trimestre='${trimestre}'`, {
            formato: "json",
            top,
            filter: filtro,
          });

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        default:
          throw new Error(`Ferramenta desconhecida: ${name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Erro ao executar ${name}: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

// Função auxiliar para listar tools (usada em endpoints REST)
async function listTools() {
  return { tools };
}

// Função auxiliar para chamar uma tool (usada em endpoints REST)
async function callTool(name: string, args: any) {
  try {
    switch (name) {
      case "consultar_meios_pagamento_mensal": {
        const { ano_mes, top = 100, skip, filtro } = args as {
          ano_mes: string;
          top?: number;
          skip?: number;
          filtro?: string;
        };

        if (!ano_mes) {
          throw new Error("Parâmetro 'ano_mes' é obrigatório");
        }

        const data = await fetchBCBData(`MeiosdePagamentosMensalDA(AnoMes=@AnoMes)?@AnoMes='${ano_mes}'`, {
          formato: "json",
          top,
          skip,
          filter: filtro,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case "consultar_meios_pagamento_trimestral": {
        const { trimestre, top = 100, skip, filtro } = args as {
          trimestre: string;
          top?: number;
          skip?: number;
          filtro?: string;
        };

        if (!trimestre) {
          throw new Error("Parâmetro 'trimestre' é obrigatório");
        }

        const data = await fetchBCBData(`MeiosdePagamentosTrimestralDA(trimestre=@trimestre)?@trimestre='${trimestre}'`, {
          formato: "json",
          top,
          skip,
          filter: filtro,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case "consultar_transacoes_cartoes": {
        const { trimestre, top = 100, ordenar_por, filtro } = args as {
          trimestre: string;
          top?: number;
          ordenar_por?: string;
          filtro?: string;
        };

        if (!trimestre) {
          throw new Error("Parâmetro 'trimestre' é obrigatório");
        }

        const data = await fetchBCBData(`Quantidadeetransacoesdecartoes(trimestre=@trimestre)?@trimestre='${trimestre}'`, {
          formato: "json",
          top,
          orderby: ordenar_por,
          filter: filtro,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case "consultar_estabelecimentos_credenciados": {
        const { trimestre, top = 100, ordenar_por, filtro } = args as {
          trimestre: string;
          top?: number;
          ordenar_por?: string;
          filtro?: string;
        };

        if (!trimestre) {
          throw new Error("Parâmetro 'trimestre' é obrigatório");
        }

        const data = await fetchBCBData(`EstabCredTransDA(trimestre=@trimestre)?@trimestre='${trimestre}'`, {
          formato: "json",
          top,
          orderby: ordenar_por,
          filter: filtro,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case "consultar_taxas_intercambio": {
        const { trimestre, top = 100, filtro } = args as {
          trimestre: string;
          top?: number;
          filtro?: string;
        };

        if (!trimestre) {
          throw new Error("Parâmetro 'trimestre' é obrigatório");
        }

        const data = await fetchBCBData(`TaxasIntercambioDA(trimestre=@trimestre)?@trimestre='${trimestre}'`, {
          formato: "json",
          top,
          filter: filtro,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case "consultar_taxas_desconto": {
        const { trimestre, top = 100, filtro } = args as {
          trimestre: string;
          top?: number;
          filtro?: string;
        };

        if (!trimestre) {
          throw new Error("Parâmetro 'trimestre' é obrigatório");
        }

        const data = await fetchBCBData(`TaxasDescontoDA(trimestre=@trimestre)?@trimestre='${trimestre}'`, {
          formato: "json",
          top,
          filter: filtro,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case "consultar_terminais_atm": {
        const { trimestre, top = 100, filtro } = args as {
          trimestre: string;
          top?: number;
          filtro?: string;
        };

        if (!trimestre) {
          throw new Error("Parâmetro 'trimestre' é obrigatório");
        }

        const data = await fetchBCBData(`TerminaisATMDA(trimestre=@trimestre)?@trimestre='${trimestre}'`, {
          formato: "json",
          top,
          filter: filtro,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case "consultar_portadores_cartao": {
        const { trimestre, top = 100, filtro } = args as {
          trimestre: string;
          top?: number;
          filtro?: string;
        };

        if (!trimestre) {
          throw new Error("Parâmetro 'trimestre' é obrigatório");
        }

        const data = await fetchBCBData(`PortadoresCartaoDA(trimestre=@trimestre)?@trimestre='${trimestre}'`, {
          formato: "json",
          top,
          filter: filtro,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Ferramenta desconhecida: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Erro ao executar ${name}: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

// Iniciar servidor HTTP com SSE
async function main() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Middleware
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  app.use(express.json());

  // Handler para OPTIONS (preflight)
  app.options('*', (req, res) => {
    res.sendStatus(200);
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'bcb-meios-pagamento-mcp' });
  });

  // Endpoint raiz com informações do servidor
  app.get('/', (req, res) => {
    res.json({
      name: 'bcb-meios-pagamento-mcp',
      version: '1.0.0',
      protocol: 'mcp',
      description: 'Servidor MCP para API de Dados Abertos de Meios de Pagamento do Banco Central do Brasil',
      endpoints: {
        tools: '/tools',
        callTool: '/tools/call',
        sse: '/sse',
        health: '/health',
        info: '/mcp/info'
      },
      capabilities: {
        tools: {},
      },
    });
  });

  // Endpoint para informações do servidor MCP
  app.get('/mcp/info', (req, res) => {
    res.json({
      name: 'bcb-meios-pagamento-mcp',
      version: '1.0.0',
      protocol: 'mcp',
      capabilities: {
        tools: {},
      },
    });
  });

  // Endpoint REST para listar tools (compatível com OpenAI MCP)
  app.get('/tools', async (req, res) => {
    try {
      const response = await listTools();
      // Garantir que o formato está correto conforme especificação MCP
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('X-MCP-Server', 'bcb-meios-pagamento-mcp');
      res.setHeader('X-MCP-Version', '1.0.0');
      res.json(response);
    } catch (error) {
      console.error('Erro ao listar tools:', error);
      res.status(500).json({ 
        error: 'Erro ao listar tools',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Endpoint REST para chamar uma tool (compatível com OpenAI MCP)
  app.post('/tools/call', async (req, res) => {
    try {
      const { name, arguments: args } = req.body;

      if (!name) {
        return res.status(400).json({ 
          error: 'Nome da tool é obrigatório',
          isError: true 
        });
      }

      const response = await callTool(name, args || {});
      // Garantir headers corretos
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('X-MCP-Server', 'bcb-meios-pagamento-mcp');
      res.json(response);
    } catch (error) {
      console.error('Erro ao chamar tool:', error);
      res.status(500).json({ 
        error: 'Erro ao executar tool',
        message: error instanceof Error ? error.message : String(error),
        isError: true
      });
    }
  });

  const transports = new Map<string, SSEServerTransport>();

  // SSE endpoint para MCP (compatível com clientes MCP padrão)
  app.get('/sse', async (req, res) => {
    console.error('Nova conexão SSE estabelecida');

    const server = createMCPServer();
    const transport = new SSEServerTransport('/message', res);

    const sessionId = transport.sessionId;
    transports.set(sessionId, transport);

    transport.onclose = () => {
      transports.delete(sessionId);
    };

    req.on('close', () => {
      transports.delete(sessionId);
    });

    await server.connect(transport);

    // Cleanup quando a conexão fechar
    req.on('close', () => {
      console.error('Conexão SSE fechada');
    });
  });

  // Endpoint para mensagens MCP
  app.post('/message', async (req, res) => {
    const sessionId = req.query.sessionId;

    if (typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'sessionId é obrigatório' });
    }

    const transport = transports.get(sessionId);

    if (!transport) {
      return res.status(410).json({ error: 'Sessão não encontrada' });
    }

    try {
      await transport.handlePostMessage(req, res, req.body);
    } catch (error) {
      console.error('Erro ao processar mensagem MCP:', error);
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Erro ao processar mensagem MCP',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  });

  app.listen(PORT, () => {
    console.error(`Servidor MCP BCB rodando na porta ${PORT}`);
    console.error(`SSE endpoint: http://localhost:${PORT}/sse`);
    console.error(`Tools endpoint: http://localhost:${PORT}/tools`);
    console.error(`Call tool endpoint: http://localhost:${PORT}/tools/call`);
  });
}

main();

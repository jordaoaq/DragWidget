# ai-chat-widget

Widget flutuante e arrastável construído com React + TypeScript.

## Características

- Widget arrastável usando `react-draggable`
- Botão de Reset: Limpa o chat imediatamente e cancela requisições pendentes para evitar respostas tardias.
- Integração com n8n: Suporte a webhooks dinâmicos e persistência de sessão via `resumeUrl`.
- TypeScript para type safety
- Vite para desenvolvimento rápido

## Configuração de Variáveis de Ambiente

Para que o widget funcione corretamente, você precisa configurar a URL do webhook.

1. Copie o arquivo de exemplo:

   ```bash
   cp .env.example .env
   ```

2. Edite o arquivo `.env` e adicione sua URL do webhook:

   ```env
   VITE_WEBHOOK_URL=https://seu-n8n.com/webhook/...
   ```

## Como executar

1. Instale as dependências:

```bash
npm install
```

2. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

## Build para produção

```
├── src/
│   ├── App.tsx           # Componente principal
│   ├── App.css           # Estilos do App
│   ├── FloatingWidget.tsx # Componente do widget arrastável
│   ├── FloatingWidget.css # Estilos do widget
│   ├── main.tsx          # Entry point
│   └── index.css         # Estilos globais
├── index.html            # HTML principal
├── package.json          # Dependências
├── tsconfig.json         # Configuração TypeScript
└── vite.config.ts        # Configuração Vite
```

## Créditos

Baseado em código de Shibi do Stack Overflow (CC BY-SA 4.0)

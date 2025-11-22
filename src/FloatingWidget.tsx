import React, { useState, useEffect, useRef } from "react";
import Draggable from "react-draggable";
import "./FloatingWidget.css";

// Interface para tipagem clara das mensagens
interface Message {
  id: number;
  text: string;
  type: "clientMessage" | "agentMessage";
}

// Interface para a resposta do webhook
interface N8nResponse {
  agentMessage?: string; // A resposta textual do agente
  resumeUrl?: string; // A URL para continuar a conversa
  chatEnded?: boolean; // Indica se o chat foi finalizado
  [key: string]: any;
}

const FloatingWidget: React.FC = () => {
  // --- Configuração inicial ---
  const INITIAL_WEBHOOK =
    import.meta.env.VITE_WEBHOOK_URL ||
    "/n8n-proxy/webhook/sdr_agent_planejados";

  // --- Estados do componente ---
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Seja bem-vindo! 🌟 Sou Aura, sua consultora virtual da Aura. Estamos prontos para desenhar seu projeto de alto padrão. Qual a sua visão ou ambiente de interesse?",
      type: "agentMessage",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isChatEnded, setIsChatEnded] = useState(false);
  const [currentWebhookUrl, setCurrentWebhookUrl] = useState(INITIAL_WEBHOOK);

  // Referência para rolar até o final do chat
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Referência para cancelar requisições pendentes
  const abortControllerRef = useRef<AbortController | null>(null);

  // --- Funções auxiliares ---
  // Normaliza URLs retornadas pelo n8n para usar o proxy local
  const normalizeUrl = (url: string): string => {
    if (url.startsWith("https://weblinker.vya.digital")) {
      return url.replace("https://weblinker.vya.digital", "/n8n-proxy");
    }
    return url;
  };

  // Rola automaticamente para o final do chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Efeito para rolar ao final sempre que mensagens ou estado de digitação mudarem
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // --- Função para resetar a conversa ---
  const handleReset = async () => {
    // Cancela qualquer requisição em andamento
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsTyping(false);
    setIsChatEnded(false);

    // Reseta o estado local imediatamente
    setMessages([
      {
        id: Date.now(),
        text: "Seja bem-vindo! 🌟 Sou Aura, sua consultora virtual da Aura. Estamos prontos para desenhar seu projeto de alto padrão. Qual a sua visão ou ambiente de interesse?",
        type: "agentMessage",
      },
    ]);

    // Se estivermos em uma conversa ativa (URL diferente da inicial), avisa o backend
    if (currentWebhookUrl && currentWebhookUrl !== INITIAL_WEBHOOK) {
      try {
        await fetch(currentWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reset: true }),
        });
      } catch (error) {
        console.error("Erro ao enviar sinal de reset:", error);
      }
    }

    // Garante que a URL volte para a inicial
    setCurrentWebhookUrl(INITIAL_WEBHOOK);
  };

  // --- Função para enviar mensagens para o webhook ---
  const sendMessageToN8n = async (text: string) => {
    // Cancela requisição anterior se houver (evita sobreposição)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsTyping(true);
    const payload = {
      clientMessage: text,
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await fetch(currentWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const textResponse = await response.text();
      console.log("Status da resposta:", response.status);
      console.log("Texto da resposta:", textResponse);

      // Se a resposta estiver vazia ou for 204, apenas desativa o typing
      if (!textResponse || response.status === 204) {
        console.log("Resposta vazia ou 204 - aguardando próxima interação");
        return;
      }

      const data: N8nResponse[] = JSON.parse(textResponse);
      console.log("Resposta do webhook:", data);

      if (data.length > 0) {
        const firstResponse = data[0];

        // Atualiza o resumeUrl para manter o fluxo (normalizando para usar o proxy)
        if (firstResponse.resumeUrl) {
          const normalizedUrl = normalizeUrl(firstResponse.resumeUrl);
          setCurrentWebhookUrl(normalizedUrl);
        }

        // Aguarda a mensagem do agente enquanto os pontos de digitação estão ativos
        if (firstResponse.agentMessage) {
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Simula o tempo de digitação
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              text: firstResponse.agentMessage || "",
              type: "agentMessage",
            },
          ]);
        }

        // Verifica se o chat foi finalizado
        if (firstResponse.chatEnded) {
          setIsChatEnded(true);
        }
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("Requisição cancelada.");
        return;
      }
      console.error("Erro na comunicação com o webhook:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: "Erro ao conectar com o servidor.",
          type: "agentMessage",
        },
      ]);
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setIsTyping(false);
    }
  };

  // --- Função para enviar mensagens do cliente ---
  const handleSend = () => {
    if (inputValue.trim() === "") return;

    const newMessage: Message = {
      id: Date.now(),
      text: inputValue,
      type: "clientMessage",
    };

    // Adiciona a mensagem do usuário ao estado
    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");

    // Envia a mensagem para o webhook
    sendMessageToN8n(newMessage.text);
  };

  // --- Renderização do componente ---
  return (
    <Draggable handle=".widget-header">
      <div className="floating-widget">
        {/* Cabeçalho do widget */}
        {/* Cabeçalho do widget */}
        <div className="widget-header">
          <span
            style={{
              background: "#bd1313",
              color: "white",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "14px",
              justifySelf: "start",
            }}
          >
            vya.digital
          </span>
          <h3>Agente SDR</h3>
          <div className="header-icon"></div>
        </div>

        {/* Corpo do chat */}
        <div className="chat-body">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`chat-bubble ${
                message.type === "clientMessage" ? "outbound" : "inbound"
              }`}
            >
              {message.text}
            </div>
          ))}

          {isTyping && (
            <div className="typing-indicator">
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Rodapé do chat */}
        <div className={`chat-footer ${isChatEnded ? "chat-ended" : ""}`}>
          <input
            type="text"
            className="chat-input"
            placeholder="Digite sua mensagem..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
            disabled={isTyping || isChatEnded}
          />
          <button
            className="send-button"
            onClick={handleSend}
            disabled={isTyping || isChatEnded}
          >
            Enviar
          </button>
          <button className="reset-button" onClick={handleReset}>
            Resetar
          </button>
        </div>
      </div>
    </Draggable>
  );
};

export default FloatingWidget;

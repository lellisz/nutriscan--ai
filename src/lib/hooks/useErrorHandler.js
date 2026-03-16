import { useToast } from "../../components/feedback/ToastProvider";

export function useErrorHandler() {
  const toast = useToast();

  const handleError = (error, options = {}) => {
    const {
      title = "Erro",
      showDetails = false,
      retry = null,
    } = options;

    let message = error?.message || "Algo deu errado";

    // Mensagens amigáveis para erros comuns
    if (error?.message?.includes("Failed to fetch")) {
      message = "Erro de conexão. Verifique sua internet.";
    } else if (error?.message?.includes("402")) {
      message = "Você usou seus 2 scans gratuitos. Faça upgrade para continuar.";
    } else if (error?.message?.includes("upgrade to premium")) {
      message = "Você usou seus 2 scans gratuitos. Faça upgrade para continuar.";
    } else if (error?.message?.includes("429")) {
      // Extract retry-after time if available
      const retryMatch = error?.message?.match(/em (\d+) segundos/);
      if (retryMatch) {
        message = `Você escaneou muitas vezes. ${error.message}`;
      } else {
        message = "Muitas requisições. Aguarde alguns segundos.";
      }
    } else if (error?.message?.includes("401")) {
      message = "Sessão expirada. Faça login novamente.";
    } else if (error?.message?.includes("timeout")) {
      message = "Operação demorou muito. Tente novamente.";
    } else if (error?.message?.includes("Too many requests")) {
      const retryMatch = error?.message?.match(/em (\d+) segundos/);
      if (retryMatch) {
        message = `Você escaneou muitas vezes. ${error.message}`;
      } else {
        message = "Você escaneou muitas vezes. Aguarde alguns segundos.";
      }
    }

    toast.error(message);

    // Log para Sentry em Sprint 2
    console.error(`[${title}]`, error);
  };

  const handleSuccess = (message = "Sucesso!") => {
    toast.success(message);
  };

  const handleRetry = async (fn, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await fn();
        toast.success("Pronto!");
        return result;
      } catch (error) {
        // Don't retry on 402 (payment required) - user must upgrade
        if (error?.message?.includes("402") || error?.message?.includes("upgrade to premium")) {
          handleError(error, { title: "Upgrade necessário" });
          throw error;
        }

        // Don't retry on 429 (rate limit) - user must wait
        if (error?.message?.includes("429") || error?.message?.includes("Too many requests")) {
          handleError(error, { title: "Limite de requisições atingido" });
          throw error;
        }

        if (attempt === maxRetries) {
          handleError(error, { title: "Falha após retentativas" });
          throw error;
        }

        // Show retry attempt
        toast.info(`Tentando novamente... (${attempt}/${maxRetries})`);
        
        // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
      }
    }
  };

  return {
    handleError,
    handleSuccess,
    handleRetry,
  };
}

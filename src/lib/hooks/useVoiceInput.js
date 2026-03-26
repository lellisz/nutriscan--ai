/**
 * useVoiceInput — Registro de alimentos por voz (Web Speech API + Groq)
 *
 * Estados:
 *   idle → listening → processing → result | error
 *
 * Retorna:
 *   { state, transcript, foods, error, isSupported, start, reset }
 */

import { useState, useRef, useCallback } from "react";
import { apiClient } from "../api/client";

const STATES = {
  IDLE: "idle",
  LISTENING: "listening",
  PROCESSING: "processing",
  RESULT: "result",
  ERROR: "error",
};

export function useVoiceInput() {
  const [state, setState] = useState(STATES.IDLE);
  const [transcript, setTranscript] = useState("");
  const [foods, setFoods] = useState([]);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  const SpeechRecognition =
    typeof window !== "undefined"
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  const isSupported = Boolean(SpeechRecognition);

  const start = useCallback(() => {
    if (!isSupported) {
      setError("Reconhecimento de voz não suportado neste navegador.");
      setState(STATES.ERROR);
      return;
    }

    setError(null);
    setFoods([]);
    setTranscript("");
    setState(STATES.LISTENING);

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const current = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(" ");
      setTranscript(current);
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech") {
        setError("Nenhuma fala detectada. Tente novamente.");
      } else if (event.error === "not-allowed") {
        setError("Permissão de microfone negada. Verifique as configurações do navegador.");
      } else {
        setError("Erro no reconhecimento de voz. Tente novamente.");
      }
      setState(STATES.ERROR);
    };

    recognition.onend = async () => {
      const finalTranscript = recognitionRef.current?._finalTranscript || transcript;
      recognitionRef.current = null;

      if (!finalTranscript.trim()) {
        setError("Nenhuma fala detectada. Tente novamente.");
        setState(STATES.ERROR);
        return;
      }

      setState(STATES.PROCESSING);
      try {
        const result = await apiClient.fetch("/api/voice", {
          method: "POST",
          body: JSON.stringify({ text: finalTranscript }),
        });

        if (!result.foods || result.foods.length === 0) {
          setError("Não consegui identificar alimentos. Tente dizer mais claramente.");
          setState(STATES.ERROR);
          return;
        }

        setFoods(result.foods);
        setState(STATES.RESULT);
      } catch (err) {
        setError(err.message || "Erro ao processar voz. Tente novamente.");
        setState(STATES.ERROR);
      }
    };

    // Guardar referência para o transcript final
    recognition.onspeechend = () => {
      if (recognitionRef.current) {
        recognitionRef.current._finalTranscript = transcript;
      }
    };

    recognition.start();
  }, [isSupported, SpeechRecognition, transcript]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current._finalTranscript = transcript;
      recognitionRef.current.stop();
    }
  }, [transcript]);

  const reset = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setState(STATES.IDLE);
    setTranscript("");
    setFoods([]);
    setError(null);
  }, []);

  return {
    state,
    transcript,
    foods,
    error,
    isSupported,
    isListening: state === STATES.LISTENING,
    isProcessing: state === STATES.PROCESSING,
    hasResult: state === STATES.RESULT,
    start,
    stop,
    reset,
    STATES,
  };
}

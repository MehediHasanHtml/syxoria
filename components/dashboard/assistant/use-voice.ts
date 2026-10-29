"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/* The browser's speech recognition (Chrome, Edge, Safari): not in the DOM typings yet */
type Alternative = { transcript: string };
type Result = { isFinal: boolean; 0: Alternative };
type ResultEvent = { results: { length: number; [i: number]: Result } };
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: ResultEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

function recognition(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const never = () => () => {};

/**
 * Speaking to Syxoria instead of typing: the browser turns speech into words as they come
 * (`heard`), and the finished sentence goes to `onSpoken`. Where the browser cannot listen,
 * `supported` is false and the microphone is not offered. Nothing is recorded or kept.
 */
export function useVoice(onSpoken: (text: string) => void) {
  const supported = useSyncExternalStore(never, () => recognition() !== null, () => false);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [problem, setProblem] = useState<"denied" | "failed" | null>(null);
  const rec = useRef<Recognition | null>(null);
  const said = useRef("");
  const spoken = useRef(onSpoken);

  useEffect(() => {
    spoken.current = onSpoken;
  }, [onSpoken]);

  useEffect(() => () => rec.current?.abort(), []);

  const start = useCallback(() => {
    const Recognition = recognition();
    if (!Recognition || rec.current) return;
    const r = new Recognition();
    r.lang = document.documentElement.lang || navigator.language || "en";
    r.interimResults = true;
    r.continuous = false;
    said.current = "";
    setHeard("");
    setProblem(null);
    r.onresult = (e) => {
      let words = "";
      for (let i = 0; i < e.results.length; i++) words += e.results[i][0].transcript;
      setHeard(words);
      if (e.results[e.results.length - 1].isFinal) said.current = words;
    };
    r.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") setProblem("denied");
      else if (e.error !== "aborted") setProblem("failed");
    };
    r.onend = () => {
      rec.current = null;
      setListening(false);
      setHeard("");
      const sentence = said.current.trim();
      if (sentence) spoken.current(sentence);
    };
    rec.current = r;
    setListening(true);
    try {
      r.start();
    } catch {
      rec.current = null;
      setListening(false);
      setProblem("failed");
    }
  }, []);

  const stop = useCallback(() => rec.current?.stop(), []);

  return { supported, listening, heard, problem, start, stop };
}

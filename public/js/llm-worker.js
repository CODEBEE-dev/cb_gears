// llm-worker.js — ES Module Worker
// type: 'module' 방식으로 생성해야 합니다.

import { WebWorkerMLCEngineHandler } from 'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.81/lib/index.js';

const handler = new WebWorkerMLCEngineHandler();
self.onmessage = (msg) => { handler.onmessage(msg); };

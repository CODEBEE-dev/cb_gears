// aiTutor.js — AI Tutor 메인 로직
// WebGPU 기반 브라우저 로컬 LLM(@mlc-ai/web-llm)을 이용한 채팅 패널

var aiTutor = new function() {
  var self = this;

  var WEB_LLM_URL = 'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.81/lib/index.js';

  // ── 모델 서버 설정 ──────────────────────────────────────────────────────────
  var APP_CONFIG = {
    model_list: [
      {
        model: 'https://aitutor.codebridge.ai.kr/models/Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC/resolve/main/',
        model_id: 'Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC',
        model_lib: 'https://aitutor.codebridge.ai.kr/wasm/Qwen2-1.5B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm',
      },
      {
        model: 'https://aitutor.codebridge.ai.kr/models/gemma-2-2b-it-q4f16_1-MLC/resolve/main/',
        model_id: 'gemma-2-2b-it-q4f16_1-MLC',
        model_lib: 'https://aitutor.codebridge.ai.kr/wasm/gemma-2-2b-it-q4f16_1-ctx4k_cs1k-webgpu.wasm',
      },
    ],
  };

  var BASE_SYSTEM_PROMPT =
    '당신은 Bridge Bot의 AI 튜터입니다.\n' +
    'Bridge Bot은 블록 코딩과 Python(ev3dev2 / Pybricks)으로 가상 로봇을 프로그래밍하고 ' +
    '3D 시뮬레이터에서 직접 실행해볼 수 있는 교육용 플랫폼입니다.\n\n' +
    '## 역할\n' +
    '- 학생이 Python 코드를 이해하고 작성할 수 있도록 친절하고 명확하게 안내합니다.\n' +
    '- 블록 코드를 Python으로 변환하는 원리, 로봇 제어 로직, 센서 활용법을 설명합니다.\n' +
    '- 코드에 오류가 있으면 원인을 짚어주고 수정 방법을 알려줍니다.\n' +
    '- 개념 설명 시 Bridge Bot 시뮬레이터 맥락에 맞는 예제를 사용합니다.\n\n' +
    '## 답변 규칙\n' +
    '- 항상 한국어로 답변합니다.\n' +
    '- 코드 예시는 반드시 ```python ... ``` 형식의 코드 블록으로 작성합니다.\n' +
    '- 답변은 간결하게 유지하되, 이해에 필요한 내용은 빠짐없이 포함합니다.\n' +
    '- 학생의 현재 코드가 제공된 경우 그 코드를 기준으로 답변합니다.\n' +
    '- 모르는 내용은 모른다고 솔직하게 말합니다.';

  // ── 상태 변수 ───────────────────────────────────────────────────────────────
  self.engine = null;
  self.worker = null;
  self.CreateWebWorkerMLCEngine = null;
  self.isLoading = false;
  self.isStreaming = false;
  self.conversationHistory = [];

  // ── 초기화 ──────────────────────────────────────────────────────────────────
  this.init = function() {
    if (!navigator.gpu) {
      self.appendSystemNotice(
        'WebGPU를 지원하지 않는 브라우저입니다. Chrome 113+ 에서 이용해주세요.'
      );
      self.setInputEnabled(false);
      return;
    }

    $('#aiTutorSend').click(self.handleSend);
    $('#aiTutorTextarea').on('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        self.handleSend();
      }
    });
    $('#aiTutorTextarea').on('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 128) + 'px';
    });

    // 드롭다운 변경 시 즉시 새 모델 로드
    $('#llm-model-select').on('change', function() {
      self.reloadModel();
    });

    // web-llm 라이브러리를 미리 import
    import(WEB_LLM_URL).then(function(mod) {
      self.CreateWebWorkerMLCEngine = mod.CreateWebWorkerMLCEngine;
    }).catch(function(e) {
      console.error('[aiTutor] web-llm 로드 실패:', e);
      self.appendSystemNotice('AI Tutor 라이브러리 로드에 실패했습니다.');
      self.setInputEnabled(false);
    });
  };

  // ── Python 탭 진입 시 / 드롭다운 변경 시 호출 ─────────────────────────────
  // 엔진이 없을 때만 로드 (이미 로드됐으면 무시)
  this.ensureModelLoaded = function() {
    if (self.engine || self.isLoading || !navigator.gpu) return;
    var modelId = $('#llm-model-select').val();
    if (modelId) self.loadModel(modelId);
  };

  // 드롭다운 변경 시 기존 엔진 파기 후 즉시 새 모델 로드
  this.reloadModel = function() {
    if (self.worker) {
      self.worker.terminate();
      self.worker = null;
    }
    self.engine = null;
    self.isLoading = false;
    self.isStreaming = false;
    self.conversationHistory = [];
    self.hideProgress();
    self.setInputEnabled(true);

    var modelId = $('#llm-model-select').val();
    if (modelId) self.loadModel(modelId);
  };

  // ── 모델 로드 ───────────────────────────────────────────────────────────────
  this.loadModel = function(modelId, onReady) {
    if (self.isLoading) return;

    if (!self.CreateWebWorkerMLCEngine) {
      // 라이브러리 import가 아직 안 끝난 경우: 완료 후 재시도
      import(WEB_LLM_URL).then(function(mod) {
        self.CreateWebWorkerMLCEngine = mod.CreateWebWorkerMLCEngine;
        self.loadModel(modelId, onReady);
      });
      return;
    }

    self.isLoading = true;
    self.setInputEnabled(false);
    self.showProgress();

    if (self.worker) {
      self.worker.terminate();
      self.worker = null;
      self.engine = null;
    }

    self.worker = new Worker('js/llm-worker.js', { type: 'module' });

    self.CreateWebWorkerMLCEngine(
      self.worker,
      modelId,
      {
        appConfig: APP_CONFIG,
        initProgressCallback: function(report) {
          var pct = Math.round((report.progress || 0) * 100);
          $('#llm-progress-bar').css('width', pct + '%');
          $('#llm-progress-text').text(report.text || '');
        }
      }
    ).then(function(eng) {
      self.engine = eng;
      self.isLoading = false;
      self.hideProgress();
      self.setInputEnabled(true);
      self.appendSystemNotice('모델 로드 완료. 질문을 입력하세요.');
      if (typeof onReady === 'function') onReady();
    }).catch(function(err) {
      console.error('[aiTutor] 모델 로드 실패:', err);
      self.appendSystemNotice('모델 로드에 실패했습니다: ' + (err.message || String(err)));
      self.isLoading = false;
      self.hideProgress();
      self.setInputEnabled(true);
    });
  };

  // ── 메시지 전송 핸들러 ──────────────────────────────────────────────────────
  this.handleSend = function() {
    if (self.isLoading || self.isStreaming) return;

    var text = $('#aiTutorTextarea').val().trim();
    if (!text) return;

    $('#aiTutorTextarea').val('');
    $('#aiTutorTextarea').css('height', 'auto');
    $('#aiTutorTextarea').focus();

    self.appendUserMessage(text);
    self.conversationHistory.push({ role: 'user', content: text });

    // 엔진이 아직 없으면 (드물지만 로드 전 전송 시) 로드 후 응답
    if (!self.engine) {
      var modelId = $('#llm-model-select').val();
      self.loadModel(modelId, function() {
        self.streamResponse();
      });
      return;
    }

    self.streamResponse();
  };

  // ── 스트리밍 응답 ────────────────────────────────────────────────────────────
  this.streamResponse = function() {
    self.isStreaming = true;
    self.setInputEnabled(false);

    var systemContent = BASE_SYSTEM_PROMPT;
    try {
      var currentCode = '';
      if (typeof pythonPanel !== 'undefined' && pythonPanel.editor) {
        currentCode = pythonPanel.editor.getValue();
      }
      if (currentCode.trim()) {
        systemContent += '\n\n## 학생의 현재 Python 코드\n```python\n' + currentCode + '\n```';
      }
    } catch(e) {}

    var messages = [{ role: 'system', content: systemContent }].concat(self.conversationHistory);

    var $bubble = self.appendAssistantMessage();
    var $raw = $('<pre class="streaming-raw"></pre>').appendTo($bubble);
    var fullText = '';

    self.engine.chat.completions.create({
      messages: messages,
      stream: true,
      temperature: 0.7,
    }).then(async function(chunks) {
      try {
        for await (var chunk of chunks) {
          var delta = (chunk.choices[0] && chunk.choices[0].delta && chunk.choices[0].delta.content) || '';
          fullText += delta;
          $raw.text(fullText);
          self.scrollToBottom();
        }
      } catch(e) {
        console.error('[aiTutor] 스트리밍 오류:', e);
        $raw.text('[오류 발생: ' + (e.message || String(e)) + ']');
      } finally {
        $raw.remove();
        var fragment = self.parseAndHighlight(fullText);
        $bubble.append(fragment);
        self.conversationHistory.push({ role: 'assistant', content: fullText });
        self.isStreaming = false;
        self.setInputEnabled(true);
        self.scrollToBottom();
        $('#aiTutorTextarea').focus();
      }
    }).catch(function(err) {
      console.error('[aiTutor] completions.create 오류:', err);
      $raw.text('[오류 발생: ' + (err.message || String(err)) + ']');
      self.isStreaming = false;
      self.setInputEnabled(true);
    });
  };

  // ── 코드 펜스 파싱 + Prism 하이라이팅 ─────────────────────────────────────
  this.parseAndHighlight = function(rawText) {
    var fragment = document.createDocumentFragment();
    var parts = rawText.split(/(```[\s\S]*?```)/g);

    parts.forEach(function(part) {
      var fenceMatch = part.match(/^```(\w*)\n?([\s\S]*?)```$/);
      if (fenceMatch) {
        var lang = fenceMatch[1] || 'plaintext';
        var code = fenceMatch[2];

        var blockDiv = document.createElement('div');
        blockDiv.className = 'code-block';

        var header = document.createElement('div');
        header.className = 'code-block-header';

        var langSpan = document.createElement('span');
        langSpan.className = 'code-block-lang';
        langSpan.textContent = lang;

        var copyBtn = document.createElement('button');
        copyBtn.className = 'code-copy-btn';
        copyBtn.textContent = '복사';
        (function(codeStr, btn) {
          btn.addEventListener('click', function() {
            navigator.clipboard.writeText(codeStr).then(function() {
              btn.textContent = '복사됨';
              setTimeout(function() { btn.textContent = '복사'; }, 1500);
            }).catch(function() {
              btn.textContent = '복사 실패';
              setTimeout(function() { btn.textContent = '복사'; }, 1500);
            });
          });
        })(code, copyBtn);

        header.appendChild(langSpan);
        header.appendChild(copyBtn);

        var pre = document.createElement('pre');
        pre.className = 'code-block-body';

        var grammar = (typeof Prism !== 'undefined') && Prism.languages[lang];
        if (grammar) {
          pre.innerHTML = Prism.highlight(code, grammar, lang);
        } else {
          pre.textContent = code;
        }

        blockDiv.appendChild(header);
        blockDiv.appendChild(pre);
        fragment.appendChild(blockDiv);

      } else if (part.trim()) {
        var p = document.createElement('p');
        p.className = 'assistant-text';
        p.innerHTML = part
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>');
        fragment.appendChild(p);
      }
    });

    return fragment;
  };

  // ── DOM 헬퍼 ────────────────────────────────────────────────────────────────
  this.appendUserMessage = function(text) {
    var $div = $('<div class="user-bubble"></div>').text(text);
    $('.aiTutorMessages').append($div);
    self.scrollToBottom();
  };

  this.appendAssistantMessage = function() {
    var $div = $('<div class="assistant-bubble"></div>');
    $('.aiTutorMessages').append($div);
    self.scrollToBottom();
    return $div;
  };

  this.appendSystemNotice = function(text) {
    var $div = $('<div class="system-notice"></div>').text(text);
    $('.aiTutorMessages').append($div);
    self.scrollToBottom();
  };

  // ── 프로그레스 UI ────────────────────────────────────────────────────────────
  this.showProgress = function() {
    $('#llm-progress-bar').css('width', '0%');
    $('#llm-progress-text').text('');
    $('#llm-progress-container').show();
  };

  this.hideProgress = function() {
    $('#llm-progress-container').hide();
    $('#llm-progress-bar').css('width', '0%');
  };

  // ── 입력 활성/비활성 ─────────────────────────────────────────────────────────
  this.setInputEnabled = function(enabled) {
    $('#aiTutorTextarea').prop('disabled', !enabled);
    $('#aiTutorSend').prop('disabled', !enabled);
  };

  // ── 스크롤 최하단 ────────────────────────────────────────────────────────────
  this.scrollToBottom = function() {
    var el = $('.aiTutorMessages')[0];
    if (el) el.scrollTop = el.scrollHeight;
  };
};

aiTutor.init();

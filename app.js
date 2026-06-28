const $ = (selector) => document.querySelector(selector);

const banks = {
  school: {
    repeat: [
      "Please open your book to page ten.",
      "I have English class on Monday morning.",
      "The library is next to the office.",
      "May I borrow your pencil?",
      "We have a science test tomorrow.",
      "My favorite subject is music.",
      "Please clean your desk before lunch."
    ],
    read: [
      "I go to school by bus every day.",
      "Our teacher is kind and patient.",
      "There are thirty students in my class.",
      "I usually do my homework after dinner.",
      "The school playground is very big.",
      "My friend and I study English together."
    ],
    passage: [
      "School Club",
      "Amy joins the art club after school. She likes drawing animals and flowers. Her teacher helps her use many colors. Amy feels happy when she shows her pictures to her classmates."
    ],
    questions: [
      ["What subject do you like best?", "I like English best because it is useful and interesting."],
      ["Where do you study after school?", "I usually study at home or in the library."],
      ["Who is your favorite teacher?", "My favorite teacher is my English teacher. She is very kind."],
      ["What do you do during break time?", "I talk with my friends or play ball outside."],
      ["Do you like tests? Why or why not?", "Not really. Tests make me nervous, but they help me study."],
      ["How do you go to school?", "I go to school by bus."],
      ["What do you usually bring to school?", "I bring books, pencils, and a water bottle."]
    ]
  },
  family: {
    repeat: [
      "My brother is taller than me.",
      "We eat dinner together every night.",
      "My mother is cooking in the kitchen.",
      "I called my grandmother yesterday.",
      "My family went to the park last weekend.",
      "Please help me wash the dishes.",
      "My cousin lives near my house."
    ],
    read: [
      "My father likes to watch baseball games.",
      "I help my parents clean the house on Sundays.",
      "My sister and I share a small room.",
      "We usually visit my grandparents in winter.",
      "My family takes a walk after dinner.",
      "I like talking with my best friend."
    ],
    passage: [
      "Family Dinner",
      "Kevin's family has dinner at seven o'clock. His father makes soup, and his mother cooks fish. Kevin sets the table. After dinner, everyone talks about their day."
    ],
    questions: [
      ["How many people are there in your family?", "There are four people in my family."],
      ["What do you like to do with your family?", "We like to watch movies and eat dinner together."],
      ["Who do you talk to when you have a problem?", "I usually talk to my mother because she listens to me."],
      ["Do you have any brothers or sisters?", "Yes, I have one younger sister."],
      ["What does your family do on weekends?", "We often go shopping or visit my grandparents."],
      ["Who cooks at home?", "My mother usually cooks at home."],
      ["Describe your best friend.", "My best friend is friendly, funny, and helpful."]
    ]
  },
  daily: {
    repeat: [
      "I get up at six thirty.",
      "It is sunny and warm today.",
      "Please turn off the light.",
      "I need to buy a new umbrella.",
      "The bus stop is across the street.",
      "I brush my teeth before breakfast.",
      "Let's meet at the train station."
    ],
    read: [
      "I usually eat breakfast at home.",
      "There is a convenience store near my house.",
      "I like listening to music on the bus.",
      "My room is small but comfortable.",
      "I drink a lot of water every day.",
      "I go to bed before eleven o'clock."
    ],
    passage: [
      "A Rainy Day",
      "It rains hard this morning. Lisa takes an umbrella to school. Her shoes get wet, but she is not late. After class, the sky becomes clear again."
    ],
    questions: [
      ["What time do you usually get up?", "I usually get up at six thirty."],
      ["What do you do after dinner?", "I do my homework and then take a shower."],
      ["What is the weather like today?", "It is warm and sunny today."],
      ["Where do you usually go on weekends?", "I usually go to the park or a bookstore."],
      ["What do you do before going to bed?", "I brush my teeth and read a book."],
      ["Do you like rainy days?", "No, I do not. I do not like getting wet."],
      ["How do you relax?", "I listen to music or watch a short video."]
    ]
  },
  shopping: {
    repeat: [
      "How much is this sandwich?",
      "I would like a cup of tea.",
      "This T-shirt is too small for me.",
      "May I have the menu, please?",
      "The supermarket closes at ten.",
      "I need a bag, please.",
      "Let's have noodles for lunch."
    ],
    read: [
      "I often buy bread at the bakery.",
      "This restaurant is famous for beef noodles.",
      "My sister wants to buy a new jacket.",
      "The apples are fresh and cheap today.",
      "I like drinking milk tea after school.",
      "We waited ten minutes for a table."
    ],
    passage: [
      "At a Café",
      "Tom goes to a small café with his friend. He orders a sandwich and a cup of orange juice. The food is good, and the clerk is friendly. Tom wants to visit the café again."
    ],
    questions: [
      ["What food do you like best?", "I like noodles best because they are delicious."],
      ["Where do you usually buy drinks?", "I usually buy drinks at a convenience store."],
      ["Do you like shopping? Why?", "Yes, I like shopping because it is fun."],
      ["What did you eat for breakfast today?", "I ate bread and eggs for breakfast."],
      ["How often do you eat out?", "I eat out about twice a week."],
      ["What would you say when you order food?", "I would say, May I have a sandwich, please?"],
      ["Do you prefer tea or juice?", "I prefer juice because it tastes sweet."]
    ]
  }
};

banks.mixed = {
  repeat: Object.values(banks).flatMap((bank) => bank.repeat),
  read: Object.values(banks).flatMap((bank) => bank.read),
  passage: banks.daily.passage,
  questions: Object.values(banks).flatMap((bank) => bank.questions)
};

let currentSet = null;
let voices = [];
let recorder = null;
let activeKey = null;
let activeStream = null;
let chunks = [];
let audioContext = null;
let analyser = null;
let meterFrame = null;
let peak = 0;
const recordings = new Map();

function sample(items, count) {
  return [...items].sort(() => Math.random() - 0.5).slice(0, count);
}

function makeSet() {
  const theme = $("#theme").value;
  const bank = banks[theme];
  const passage = theme === "mixed"
    ? sample([banks.school.passage, banks.family.passage, banks.daily.passage, banks.shopping.passage], 1)[0]
    : bank.passage;
  return {
    repeat: sample(bank.repeat, 5),
    read: sample(bank.read, 5),
    passage,
    questions: sample(bank.questions, 7)
  };
}

function notify(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function checkBrowser() {
  const isFile = location.protocol === "file:";
  const isHttps = location.protocol === "https:";
  const isLocalhost = location.hostname === "127.0.0.1" || location.hostname === "localhost";
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  $("#fileNotice").hidden = !isFile;
  const canRecord = Boolean(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
  const secure = window.isSecureContext || isLocalhost;
  const card = $("#statusCard");
  if (canRecord && secure && !isFile) {
    card.className = "status-card ok";
    card.innerHTML = isIOS
      ? "✅ iPhone 錄音環境正常<br>請按「● 錄音」並允許麥克風。"
      : "✅ 錄音環境正常<br>請按「● 錄音」開始測試。";
  } else if (isIOS && !isHttps) {
    card.className = "status-card warn";
    card.innerHTML = "⚠️ iPhone 需要 HTTPS 才能錄音<br>目前可以看題目，但錄音可能會被拒。";
  } else if (canRecord && isFile) {
    card.className = "status-card warn";
    card.innerHTML = "⚠️ 目前是檔案模式<br>請上傳到 HTTPS 網站後用 iPhone 開啟。";
  } else {
    card.className = "status-card warn";
    card.innerHTML = "⚠️ 這個瀏覽器或網址不支援錄音<br>請用 iPhone Safari 開啟 HTTPS 網址。";
  }
}

function quality(voice) {
  const name = `${voice.name} ${voice.voiceURI}`.toLowerCase();
  let score = 0;
  if (/natural|neural|online/.test(name)) score += 100;
  if (/aria|jenny|guy|sonia|ryan|samantha|ava|emma|brian|daniel/.test(name)) score += 35;
  if (/microsoft|google|apple/.test(name)) score += 20;
  if (/en-us/.test(voice.lang.toLowerCase())) score += 10;
  return score;
}

function loadVoices() {
  if (!("speechSynthesis" in window)) {
    $("#voice").innerHTML = `<option value="">此瀏覽器不支援朗讀</option>`;
    return;
  }
  voices = speechSynthesis.getVoices()
    .filter((voice) => voice.lang.toLowerCase().startsWith("en"))
    .sort((a, b) => quality(b) - quality(a));
  $("#voice").innerHTML = `<option value="">自動選擇英文聲音</option>` + voices.map((voice) => {
    const natural = /natural|neural|online/i.test(`${voice.name} ${voice.voiceURI}`) ? "・自然語音" : "";
    return `<option value="${encodeURIComponent(voice.voiceURI)}">${voice.name} (${voice.lang})${natural}</option>`;
  }).join("");
}

function selectedVoice() {
  const value = $("#voice").value;
  return voices.find((voice) => encodeURIComponent(voice.voiceURI) === value) || voices[0] || null;
}

function speak(text, twice = false) {
  if (!("speechSynthesis" in window)) {
    notify("此瀏覽器不支援英文朗讀");
    return;
  }
  speechSynthesis.cancel();
  speechSynthesis.resume?.();
  const say = () => {
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = selectedVoice();
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang || "en-US";
    utterance.rate = Number($("#rate").value);
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onerror = () => notify("朗讀失敗，請換一個英文聲音");
    speechSynthesis.speak(utterance);
    return utterance;
  };
  const first = say();
  if (twice) first.onend = () => setTimeout(say, 600);
}

function row({ key, number, text, speakText, answer = "" }) {
  return `
    <div class="question" data-key="${key}">
      <div class="q-number">${number}.</div>
      <div class="q-text">${text}</div>
      <div class="tools">
        <button class="mini" data-speak="${encodeURIComponent(speakText)}">▶ 播放</button>
        <button class="mini" data-record="${key}">● 錄音</button>
      </div>
      <div class="meter-wrap">
        <div class="meter"><span></span></div>
        <span class="meter-text">錄音中，請說話…</span>
      </div>
      <div class="player" data-player="${key}"></div>
      ${answer ? `<div class="answer">參考回答：${answer}</div>` : ""}
    </div>`;
}

function render() {
  const s = currentSet;
  $("#paper").innerHTML = `
    <section class="part">
      <h2>第一部分：複誦</h2>
      <p class="instruction">題目播放兩次。聽完後，請立刻完整複誦一次。</p>
      ${s.repeat.map((text, index) => row({
        key: `repeat-${index}`,
        number: index + 1,
        text,
        speakText: text
      })).join("")}
    </section>
    <section class="part">
      <h2>第二部分：朗讀</h2>
      <p class="instruction">先準備，再以正常速度清楚朗讀。</p>
      ${s.read.map((text, index) => row({
        key: `read-${index}`,
        number: index + 1,
        text,
        speakText: text
      })).join("")}
      <div class="passage">
        <strong>SHORT PASSAGE · ${s.passage[0]}</strong><br>
        ${s.passage[1]}
      </div>
      ${row({
        key: "passage",
        number: "短文",
        text: "請錄下你朗讀整篇短文的聲音。",
        speakText: s.passage[1]
      })}
    </section>
    <section class="part">
      <h2>第三部分：回答問題</h2>
      <p class="instruction">每題聽完後，請用英文回答。</p>
      ${s.questions.map((item, index) => row({
        key: `answer-${index}`,
        number: index + 1,
        text: item[0],
        speakText: item[0],
        answer: item[1]
      })).join("")}
    </section>`;
  recordings.clear();
}

function stopMeter() {
  if (meterFrame) cancelAnimationFrame(meterFrame);
  meterFrame = null;
  analyser = null;
  if (audioContext) audioContext.close?.().catch(() => {});
  audioContext = null;
}

function startMeter(stream, key) {
  stopMeter();
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  peak = 0;
  audioContext = new AudioContextClass();
  const source = audioContext.createMediaStreamSource(stream);
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 1024;
  source.connect(analyser);
  const data = new Uint8Array(analyser.fftSize);
  const question = document.querySelector(`[data-key="${key}"]`);
  const bar = question?.querySelector(".meter span");
  const label = question?.querySelector(".meter-text");
  const tick = () => {
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (const value of data) {
      const centered = (value - 128) / 128;
      sum += centered * centered;
    }
    const level = Math.sqrt(sum / data.length);
    peak = Math.max(peak, level);
    if (bar) bar.style.width = `${Math.min(100, Math.round(level * 260))}%`;
    if (label) label.textContent = level > 0.015 ? "有收到聲音" : "錄音中，請靠近麥克風";
    meterFrame = requestAnimationFrame(tick);
  };
  tick();
}

function supportedMime() {
  const choices = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4"
  ];
  return choices.find((type) => MediaRecorder.isTypeSupported?.(type)) || "";
}

function cleanupStream() {
  activeStream?.getTracks().forEach((track) => track.stop());
  activeStream = null;
}

function showRecording(key, blob) {
  const old = recordings.get(key);
  if (old) URL.revokeObjectURL(old.url);
  const url = URL.createObjectURL(blob);
  recordings.set(key, { blob, url });
  const host = document.querySelector(`[data-player="${key}"]`);
  const extension = blob.type.includes("mp4") ? "m4a" : "webm";
  host.innerHTML = `
    <audio controls src="${url}"></audio>
    <div>
      <a href="${url}" download="gept-${key}.${extension}">下載錄音檔</a>
    </div>`;
  host.querySelector("audio").addEventListener("error", () => {
    notify("錄音檔已產生，但此瀏覽器不能播放；請先下載檔案測試");
  });
}

async function startRecording(key, button) {
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    notify("這個瀏覽器不支援錄音，請用 Chrome 或 Edge");
    return;
  }
  try {
    activeStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    activeKey = key;
    chunks = [];
    const mimeType = supportedMime();
    recorder = mimeType ? new MediaRecorder(activeStream, { mimeType }) : new MediaRecorder(activeStream);
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onstop = () => {
      stopMeter();
      const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
      document.querySelector(`[data-key="${key}"]`)?.classList.remove("active");
      button.classList.remove("recording");
      button.textContent = "● 重新錄";
      cleanupStream();
      activeKey = null;
      if (!blob.size) {
        notify("沒有錄到資料，請重試");
        return;
      }
      showRecording(key, blob);
      notify(peak < 0.012 ? "錄到了，但音量很小；請提高麥克風音量" : "錄音完成，可以播放或下載");
    };
    recorder.start(250);
    startMeter(activeStream, key);
    document.querySelector(`[data-key="${key}"]`)?.classList.add("active");
    button.classList.add("recording");
    button.textContent = "■ 停止";
    notify("開始錄音");
  } catch (error) {
    cleanupStream();
    const name = error?.name || "";
    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      notify("麥克風權限被拒；iPhone 請確認使用 HTTPS，並允許麥克風");
    } else if (name === "NotFoundError") {
      notify("找不到麥克風裝置");
    } else {
      notify(`無法啟動錄音：${name || "未知錯誤"}`);
    }
  }
}

function stopRecording() {
  if (recorder?.state === "recording") recorder.stop();
}

function clearRecordings() {
  stopRecording();
  recordings.forEach((item) => URL.revokeObjectURL(item.url));
  recordings.clear();
  document.querySelectorAll(".player").forEach((player) => { player.innerHTML = ""; });
  document.querySelectorAll("[data-record]").forEach((button) => {
    button.classList.remove("recording");
    button.textContent = "● 錄音";
  });
  notify("已清除本頁錄音");
}

function updateScore() {
  const delivery = $("#delivery").value;
  const language = $("#language").value;
  if (delivery === "" || language === "") {
    $("#scoreResult").textContent = "尚未評分";
    return;
  }
  const total = (Number(delivery) + Number(language)) * 10;
  $("#scoreResult").textContent = `總分 ${total} / 100：${total >= 80 ? "通過標準" : "還需要練習"}`;
}

$("#generateBtn").addEventListener("click", () => {
  stopRecording();
  currentSet = makeSet();
  render();
  notify("已重新產生題目");
});

$("#testVoiceBtn").addEventListener("click", () => {
  speak("Hello. This is the English voice test. Please listen and repeat.");
});

$("#clearBtn").addEventListener("click", clearRecordings);
$("#theme").addEventListener("change", () => {
  currentSet = makeSet();
  render();
});
$("#delivery").addEventListener("change", updateScore);
$("#language").addEventListener("change", updateScore);

$("#paper").addEventListener("click", (event) => {
  const speakButton = event.target.closest("[data-speak]");
  if (speakButton) {
    const question = speakButton.closest(".question");
    const isRepeat = question?.dataset.key?.startsWith("repeat") || question?.dataset.key?.startsWith("answer");
    speak(decodeURIComponent(speakButton.dataset.speak), isRepeat);
    return;
  }

  const recordButton = event.target.closest("[data-record]");
  if (recordButton) {
    const key = recordButton.dataset.record;
    if (recorder?.state === "recording") {
      if (activeKey === key) stopRecording();
      else notify("請先停止目前這題的錄音");
    } else {
      startRecording(key, recordButton);
    }
  }
});

checkBrowser();
loadVoices();
if ("speechSynthesis" in window) speechSynthesis.onvoiceschanged = loadVoices;
currentSet = makeSet();
render();

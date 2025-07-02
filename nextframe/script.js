// script.js
const output = document.getElementById("output");
const uploadedPreview = document.getElementById("uploadedPreview");
const errorBox = document.getElementById("errorBox");

let frames = []; // base64 이미지 저장용
let lastSuccessFrame = 0;
let isGenerating = false;
let currentProjectId = null;

let db;
const DB_NAME = "DeforumDB";
const STORE_NAME = "projects";

function generateUUID() {
  return crypto.randomUUID();
}

function initDB() {
  const request = indexedDB.open(DB_NAME, 1);
  request.onerror = (e) => console.error("DB 오류", e);
  request.onsuccess = (e) => {
    db = e.target.result;
    loadProjectList();
  };
  request.onupgradeneeded = (e) => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME);
    }
  };
}

function saveToDB(id, data) {
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).put(data, id);
}

function loadFromDB(id, callback) {
  const tx = db.transaction(STORE_NAME, "readonly");
  const req = tx.objectStore(STORE_NAME).get(id);
  req.onsuccess = () => callback(req.result);
}

function loadProjectList() {
  const list = document.getElementById("projectList");
  list.innerHTML = "";
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const req = store.openCursor();
  req.onsuccess = (e) => {
    const cursor = e.target.result;
    if (cursor) {
      const data = cursor.value;
      const li = document.createElement("li");
      li.innerText = data.name || cursor.key;
      li.dataset.key = cursor.key;
      li.onclick = () => loadProject(cursor.key);
      list.appendChild(li);
      cursor.continue();
    }
  };
}

function autoSave() {
  const name = document.getElementById("projectName").value.trim();
  if (!name) return;
  const projectData = {
    id: currentProjectId || generateUUID(),
    name: name,
    apiKey: document.getElementById("apiKey").value.trim(),
    prompt: document.getElementById("prompt").value.trim(),
    frameCount: parseInt(document.getElementById("frameCount").value),
    imageSize: document.getElementById("imageSize").value,
    inputImageBase64: uploadedPreview.querySelector("img")?.src || null,
    frames: frames,
    lastSuccessFrame: lastSuccessFrame
  };
  currentProjectId = projectData.id;
  saveToDB(projectData.id, projectData);
  loadProjectList();
}

function loadProject(id) {
  loadFromDB(id, (data) => {
    if (!data) return;
    currentProjectId = id;
    document.getElementById("projectName").value = data.name || id;
    document.getElementById("apiKey").value = data.apiKey;
    document.getElementById("prompt").value = data.prompt;
    document.getElementById("frameCount").value = data.frameCount;
    document.getElementById("imageSize").value = data.imageSize;
    lastSuccessFrame = data.lastSuccessFrame || 0;

    if (data.inputImageBase64) {
      const img = document.createElement("img");
      img.src = data.inputImageBase64;
      img.width = 256;
      img.style.cursor = "pointer";
      img.onclick = () => window.open(img.src, "_blank");
      uploadedPreview.innerHTML = "";
      uploadedPreview.appendChild(img);
    } else {
      uploadedPreview.innerHTML = "";
    }

    output.innerHTML = "";
    frames = data.frames || [];
    frames.forEach((src, i) => {
      const img = document.createElement("img");
      img.src = src;
      img.alt = `frame_${i + 1}`;
      img.width = 256;
      img.style.cursor = "pointer";
      img.onclick = () => window.open(img.src, "_blank");
      output.appendChild(img);
    });
  });
}

function validateInputs() {
  const projectName = document.getElementById("projectName").value.trim();
  const apiKey = document.getElementById("apiKey").value.trim();
  const prompt = document.getElementById("prompt").value.trim();
  const frameCount = parseInt(document.getElementById("frameCount").value);
  if (!projectName || !apiKey || !prompt || !frameCount) {
    errorBox.innerText = "⚠ 모든 항목을 입력해주세요.";
    return false;
  }
  const image = document.getElementById("inputImage").files?.[0];
  if (!image || !image.name.endsWith(".png")) {
    errorBox.innerText = "⚠ 투명 배경 PNG 이미지를 업로드해주세요.";
    return false;
  }
  errorBox.innerText = "";
  return true;
}

function generateImages(startFrom = 1) {
  if (!validateInputs() || isGenerating) return;
  isGenerating = true;

  if (startFrom === 1) {
    output.innerHTML = "";
    frames = [];
    lastSuccessFrame = 0;
  }

  const apiKey = document.getElementById("apiKey").value.trim();
  const prompt = document.getElementById("prompt").value.trim();
  const frameCount = parseInt(document.getElementById("frameCount").value);
  const imageFile = document.getElementById("inputImage").files?.[0];
  if (!imageFile) return;

  const headers = {
    "Authorization": `Bearer ${apiKey}`
  };

  async function generateFrame(i) {
    const form = new FormData();
    form.append("prompt", `${prompt} (frame ${i})`);
    form.append("n", "1");
    form.append("response_format", "b64_json");
    form.append("image", imageFile);

    const skeleton = document.createElement("div");
    skeleton.className = "skeleton";
    skeleton.innerText = `프레임 ${i} 생성 중...`;
    output.appendChild(skeleton);

    try {
      const res = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers,
        body: form
      });

      const data = await res.json();
      if (!res.ok) {
        const error = data?.error || {};
        const msg = `코드: ${error.code || 'unknown'}\n메시지: ${error.message || '에러 발생'}\n매개변수: ${error.param || '없음'}`;
        throw new Error(msg);
      }

      const b64 = data.data?.[0]?.b64_json;
      if (b64) {
        const img = document.createElement("img");
        img.src = `data:image/png;base64,${b64}`;
        img.alt = `frame_${i}`;
        img.width = 256;
        img.style.cursor = "pointer";
        img.onclick = () => window.open(img.src, "_blank");
        output.replaceChild(img, skeleton);
        frames.push(img.src);
        lastSuccessFrame = i;
        autoSave();
        return true;
      } else {
        skeleton.innerText = `프레임 ${i} 실패`;
        return false;
      }
    } catch (err) {
      skeleton.innerText = `프레임 ${i} 오류: ${err.message}`;
      errorBox.innerText = `⚠ 프레임 ${i} 생성 중 오류: ${err.message}`;
      return false;
    }
  }

  (async () => {
    for (let i = startFrom; i <= frameCount; i++) {
      const success = await generateFrame(i);
      if (!success) break;
    }
    isGenerating = false;
  })();
}

function resumeFromLast() {
  generateImages(lastSuccessFrame + 1);
}

document.getElementById("resumeBtn")?.addEventListener("click", resumeFromLast);
document.getElementById("generateBtn")?.addEventListener("click", () => generateImages());
document.getElementById("downloadBtn")?.addEventListener("click", downloadZip);

document.getElementById("inputImage").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = document.createElement("img");
    img.src = e.target.result;
    img.width = 256;
    img.style.cursor = "pointer";
    img.onclick = () => window.open(img.src, "_blank");
    uploadedPreview.innerHTML = "";
    uploadedPreview.appendChild(img);
    autoSave();
  };
  reader.readAsDataURL(file);
});

function downloadZip() {
  if (frames.length === 0) return;
  const zip = new JSZip();
  frames.forEach((src, i) => {
    const base64Data = src.split(",")[1];
    zip.file(`frame_${i + 1}.png`, base64Data, { base64: true });
  });
  zip.generateAsync({ type: "blob" }).then((blob) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "frames.zip";
    a.click();
  });
}

initDB();
["projectName", "apiKey", "prompt", "frameCount", "imageSize"].forEach(id => {
  document.getElementById(id).addEventListener("input", autoSave);
});

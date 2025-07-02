// script.js
const output = document.getElementById("output");
const uploadedPreview = document.getElementById("uploadedPreview");
const errorBox = document.getElementById("errorBox");

let frames = []; // base64 이미지 저장용
let lastSuccessFrame = 0;
let isGenerating = false; // 중복 호출 방지

function validateInputs() {
  const projectName = document.getElementById("projectName").value.trim();
  const apiKey = document.getElementById("apiKey").value.trim();
  const prompt = document.getElementById("prompt").value.trim();
  const frameCount = parseInt(document.getElementById("frameCount").value);

  if (!projectName || !apiKey || !prompt || !frameCount) {
    errorBox.innerText = "⚠ 모든 항목을 입력해주세요.";
    return false;
  }
  errorBox.innerText = "";
  return true;
}

function newProject() {
  document.getElementById("projectName").value = "";
  document.getElementById("apiKey").value = "";
  document.getElementById("prompt").value = "";
  document.getElementById("frameCount").value = "";
  document.getElementById("imageSize").value = "1024x576";
  document.getElementById("inputImage").value = "";
  uploadedPreview.innerHTML = "";
  output.innerHTML = "";
  frames = [];
  lastSuccessFrame = 0;
  autoSave();
}

function autoSave() {
  const name = document.getElementById("projectName").value.trim();
  if (!name) return;
  const projectData = {
    apiKey: document.getElementById("apiKey").value.trim(),
    prompt: document.getElementById("prompt").value.trim(),
    frameCount: parseInt(document.getElementById("frameCount").value),
    imageSize: document.getElementById("imageSize").value,
    inputImageBase64: uploadedPreview.querySelector("img")?.src || null,
    frames: frames,
    lastSuccessFrame: lastSuccessFrame
  };
  localStorage.setItem(name, JSON.stringify(projectData));
  loadProjectList();
}

function loadProjectList() {
  const list = document.getElementById("projectList");
  list.innerHTML = "";
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const li = document.createElement("li");
    li.innerText = key;
    li.onclick = () => loadProject(key);
    list.appendChild(li);
  }
}

function loadProject(name) {
  const data = JSON.parse(localStorage.getItem(name));
  if (!data) return;

  document.getElementById("projectName").value = name;
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
}

function generateImages(startFrom = 1) {
  if (!validateInputs()) return;
  if (isGenerating) return;
  isGenerating = true;

  if (startFrom === 1) {
    output.innerHTML = "";
    frames = [];
    lastSuccessFrame = 0;
  }

  const apiKey = document.getElementById("apiKey").value.trim();
  const prompt = document.getElementById("prompt").value.trim();
  const frameCount = parseInt(document.getElementById("frameCount").value);
  const size = document.getElementById("imageSize").value;
  const [width, height] = size.split("x").map(Number);

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`,
  };

  async function generateFrame(i) {
    const skeleton = document.createElement("div");
    skeleton.className = "skeleton";
    skeleton.innerText = `프레임 ${i} 생성 중...`;
    output.appendChild(skeleton);

    const body = {
      model: "dall-e-2",
      prompt: `${prompt} (frame ${i})`,
      n: 1,
      size: `${width}x${height}`,
      response_format: "b64_json",
    };

    try {
      const res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorDetails = `코드: ${data?.error?.code || 'unknown'}\n메시지: ${data?.error?.message || '에러 발생'}\n매개변수: ${data?.error?.param || '없음'}`;
        throw new Error(errorDetails);
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
      skeleton.innerText = `프레임 ${i} 오류:\n${err.message}`;
      errorBox.innerText = `⚠ 프레임 ${i} 생성 중 오류 발생: ${err.message}`;
      return false;
    }
  }

  (async () => {
    for (let i = startFrom; i <= frameCount; i++) {
      const success = await generateFrame(i);
      if (!success) {
        console.warn(`프레임 ${i} 생성 실패로 중단됨.`);
        break;
      }
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

const inputImage = document.getElementById("inputImage");
inputImage.addEventListener("change", (event) => {
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

["projectName", "apiKey", "prompt", "frameCount", "imageSize"].forEach(id => {
  document.getElementById(id).addEventListener("input", autoSave);
});

loadProjectList();
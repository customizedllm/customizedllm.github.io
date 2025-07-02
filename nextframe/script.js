// script.js
const output = document.getElementById("output");
const uploadedPreview = document.getElementById("uploadedPreview");
const errorBox = document.getElementById("errorBox");

let frames = []; // base64 이미지 저장용

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
}

function saveProject() {
  if (!validateInputs()) return;

  const name = document.getElementById("projectName").value.trim();
  const projectData = {
    apiKey: document.getElementById("apiKey").value.trim(),
    prompt: document.getElementById("prompt").value.trim(),
    frameCount: parseInt(document.getElementById("frameCount").value),
    imageSize: document.getElementById("imageSize").value,
    inputImageBase64: uploadedPreview.querySelector("img")?.src || null,
    frames: frames,
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

  uploadedPreview.innerHTML = data.inputImageBase64 ? `<img src="${data.inputImageBase64}" width="256" />` : "";
  output.innerHTML = "";
  frames = data.frames || [];
  frames.forEach((src, i) => {
    const img = document.createElement("img");
    img.src = src;
    img.alt = `frame_${i + 1}`;
    img.width = 256;
    output.appendChild(img);
  });
}

function generateImages() {
  if (!validateInputs()) return;
  output.innerHTML = "";
  frames = [];

  const apiKey = document.getElementById("apiKey").value.trim();
  const prompt = document.getElementById("prompt").value.trim();
  const frameCount = parseInt(document.getElementById("frameCount").value);
  const size = document.getElementById("imageSize").value;

  let [width, height] = size.split("x").map(Number);

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`,
  };

  for (let i = 1; i <= frameCount; i++) {
    const body = {
      prompt: prompt + ` (frame ${i})`,
      n: 1,
      size: `${width}x${height}`,
      response_format: "b64_json",
    };

    fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    })
      .then((res) => res.json())
      .then((data) => {
        const b64 = data.data?.[0]?.b64_json;
        if (b64) {
          const img = document.createElement("img");
          img.src = `data:image/png;base64,${b64}`;
          img.alt = `frame_${i}`;
          img.width = 256;
          output.appendChild(img);
          frames.push(img.src);
        }
      });
  }
}

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

// 이미지 업로드 미리보기
const inputImage = document.getElementById("inputImage");
inputImage.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    uploadedPreview.innerHTML = `<img src="${e.target.result}" width="256" />`;
  };
  reader.readAsDataURL(file);
});

// 로딩 시 초기화
loadProjectList();

/* script.js */
let uploadedImageBase64 = null;

function validateInputs() {
  const requiredFields = ['projectName', 'apiKey', 'prompt', 'frameCount'];
  let valid = true;

  requiredFields.forEach(id => {
    const field = document.getElementById(id);
    if (!field.value.trim()) {
      field.classList.add('error');
      showError(`❗ '${field.placeholder || id}' 필드를 입력해주세요.`);
      valid = false;
    } else {
      field.classList.remove('error');
    }
  });

  return valid;
}

function showError(message) {
  let errorBox = document.getElementById("errorBox");
  errorBox.innerText = message;
  setTimeout(() => {
    errorBox.innerText = '';
  }, 3000);
}

function saveProject() {
  if (!validateInputs()) return;
  const name = document.getElementById("projectName").value || `Project ${Date.now()}`;
  const data = {
    name: name,
    apiKey: document.getElementById("apiKey").value,
    prompt: document.getElementById("prompt").value,
    frameCount: document.getElementById("frameCount").value,
    imageSize: document.getElementById("imageSize").value,
    inputImageBase64: uploadedImageBase64
  };
  localStorage.setItem(name, JSON.stringify(data));
  loadProjectList();
}

function loadProject(name) {
  const data = JSON.parse(localStorage.getItem(name));
  document.getElementById("projectName").value = data.name;
  document.getElementById("apiKey").value = data.apiKey;
  document.getElementById("prompt").value = data.prompt;
  document.getElementById("frameCount").value = data.frameCount;
  document.getElementById("imageSize").value = data.imageSize;
  uploadedImageBase64 = data.inputImageBase64 || null;

  const uploadedPreview = document.getElementById("uploadedPreview");
  uploadedPreview.innerHTML = '';
  if (uploadedImageBase64) {
    const uploaded = document.createElement("img");
    uploaded.src = `data:image/png;base64,${uploadedImageBase64}`;
    uploaded.className = 'preview-frame';
    uploaded.alt = '업로드 이미지';
    uploadedPreview.appendChild(uploaded);
  }
}

function loadProjectList() {
  const list = document.getElementById("projectList");
  list.innerHTML = '';
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      const li = document.createElement("li");
      li.innerText = key;
      li.onclick = () => loadProject(key);
      list.appendChild(li);
    }
  }
}

function newProject() {
  document.getElementById("projectName").value = '';
  document.getElementById("apiKey").value = '';
  document.getElementById("prompt").value = '';
  document.getElementById("frameCount").value = '';
  document.getElementById("imageSize").value = '1024x576';
  document.getElementById("inputImage").value = null;
  document.getElementById("uploadedPreview").innerHTML = '';
  document.getElementById("output").innerHTML = '';
  uploadedImageBase64 = null;
}

function generateImages() {
  if (!validateInputs()) return;
  const inputImage = document.getElementById("inputImage").files[0];
  const frameCount = parseInt(document.getElementById("frameCount").value);
  const uploadedPreview = document.getElementById("uploadedPreview");
  const output = document.getElementById("output");
  output.innerHTML = '';

  if (inputImage) {
    const reader = new FileReader();
    reader.onload = function () {
      uploadedImageBase64 = reader.result.split(",")[1];

      // 업로드된 이미지 미리보기 표시
      const uploaded = document.createElement("img");
      uploaded.src = reader.result;
      uploaded.className = 'preview-frame';
      uploaded.alt = '업로드 이미지';
      uploadedPreview.innerHTML = '';
      uploadedPreview.appendChild(uploaded);

      for (let i = 1; i <= frameCount; i++) {
        const img = document.createElement("img");
        img.src = `data:image/png;base64,${uploadedImageBase64}`;
        img.className = 'preview-frame';
        img.alt = `프레임 ${i}`;
        output.appendChild(img);
      }
    };
    reader.readAsDataURL(inputImage);
  } else if (uploadedImageBase64) {
    // 기존에 저장된 Base64 이미지가 있는 경우
    const uploaded = document.createElement("img");
    uploaded.src = `data:image/png;base64,${uploadedImageBase64}`;
    uploaded.className = 'preview-frame';
    uploaded.alt = '업로드 이미지';
    uploadedPreview.innerHTML = '';
    uploadedPreview.appendChild(uploaded);

    for (let i = 1; i <= frameCount; i++) {
      const img = document.createElement("img");
      img.src = `data:image/png;base64,${uploadedImageBase64}`;
      img.className = 'preview-frame';
      img.alt = `프레임 ${i}`;
      output.appendChild(img);
    }
  } else {
    alert("이미지를 먼저 업로드해주세요. 이후 프레임은 이 이미지를 기반으로 생성됩니다.");
  }
}

window.onload = loadProjectList;

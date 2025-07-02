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
    imageSize: document.getElementById("imageSize").value
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
}

function generateImages() {
  if (!validateInputs()) return;
  const inputImage = document.getElementById("inputImage").files[0];
  const frameCount = parseInt(document.getElementById("frameCount").value);
  const output = document.getElementById("output");
  output.innerHTML = '';

  if (inputImage) {
    const reader = new FileReader();
    reader.onload = function () {
      const base64Image = reader.result.split(",")[1];
      for (let i = 1; i <= frameCount; i++) {
        const img = document.createElement("img");
        img.src = `data:image/png;base64,${base64Image}`; // 여기에 실제 생성된 이미지로 대체 필요
        img.className = 'preview-frame';
        img.alt = `프레임 ${i}`;
        output.appendChild(img);
      }
    };
    reader.readAsDataURL(inputImage);
  } else {
    alert("이미지를 먼저 업로드해주세요. 이후 프레임은 이 이미지를 기반으로 생성됩니다.");
  }
}

window.onload = loadProjectList;
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
}

function generateImages() {
  if (!validateInputs()) return;
  alert("이미지 생성 로직은 여기에 구현됩니다.");
  // 실제 OpenAI API 호출 로직 구현 필요
}

window.onload = loadProjectList;

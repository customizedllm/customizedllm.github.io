async function generateImages() {
  const apiKey = document.getElementById("apiKey").value;
  const basePrompt = document.getElementById("prompt").value;
  const frameCount = parseInt(document.getElementById("frameCount").value);
  const imageSize = document.getElementById("imageSize").value;
  const outputDiv = document.getElementById("output");

  if (!apiKey || !basePrompt || !frameCount || !imageSize) {
    alert("모든 항목을 입력해주세요.");
    return;
  }

  outputDiv.innerHTML = '';
  for (let i = 0; i < frameCount; i++) {
    const prompt = `${basePrompt}, frame ${i + 1}, slightly forward`;
    outputDiv.innerHTML += `<p>📸 생성 중: ${i + 1}/${frameCount}</p>`;

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: imageSize
      })
    });

    const data = await response.json();

    if (data.error) {
      outputDiv.innerHTML += `<p style="color:red;">🚫 에러: ${data.error.message}</p>`;
      break;
    }

    const img = document.createElement("img");
    img.src = data.data[0].url;
    outputDiv.appendChild(img);

    await new Promise(r => setTimeout(r, 3000)); // OpenAI rate limit 조정
  }
}

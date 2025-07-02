async function generateImages() {
  const apiKey = document.getElementById("apiKey").value;
  const basePrompt = document.getElementById("prompt").value;
  const frameCount = parseInt(document.getElementById("frameCount").value);
  const outputDiv = document.getElementById("output");
  outputDiv.innerHTML = '';

  for (let i = 0; i < frameCount; i++) {
    const prompt = `${basePrompt}, frame ${i + 1}, slightly forward`;
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
        size: "1024x576"
      })
    });

    const data = await response.json();
    const img = document.createElement("img");
    img.src = data.data[0].url;
    outputDiv.appendChild(img);

    await new Promise(r => setTimeout(r, 3000)); // API rate limit 조정
  }
}

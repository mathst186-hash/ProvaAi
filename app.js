const $ = (id) => document.getElementById(id);
const form = $("examForm");
const statusBox = $("status");
const resultSection = $("resultSection");
const resultText = $("resultText");
const generateBtn = $("generateBtn");

$("year").textContent = new Date().getFullYear();

function showStatus(message, error = false) {
  statusBox.textContent = message;
  statusBox.classList.remove("hidden", "error");
  if (error) statusBox.classList.add("error");
}
function hideStatus() { statusBox.classList.add("hidden"); }

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideStatus();
  generateBtn.disabled = true;
  generateBtn.textContent = "Gerando avaliação...";
  showStatus("A IA está preparando as questões. Isso pode levar alguns segundos.");
  const payload = {
    provider: $("provider").value,
    subject: $("subject").value,
    stage: $("stage").value,
    grade: $("grade").value,
    quantity: Number($("quantity").value),
    difficulty: $("difficulty").value,
    type: $("type").value,
    topic: $("topic").value,
    extra: $("extra").value,
    includeAnswerKey: $("answerKey").checked
  };
  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Não foi possível gerar a avaliação.");
    resultText.value = data.text;
    resultSection.classList.remove("hidden");
    showStatus(`Avaliação gerada com ${data.provider === "openai" ? "OpenAI" : "Gemini"}. Revise o material antes de usar.`);
    resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    showStatus(error.message || "Falha de conexão. Tente novamente.", true);
  } finally {
    generateBtn.disabled = false;
    generateBtn.innerHTML = "<span>✦</span> Gerar avaliação";
  }
});

$("printBtn").addEventListener("click", () => {
  const text = resultText.value;
  if (!text.trim()) return;
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    showStatus("O navegador bloqueou a janela de impressão. Permita pop-ups e tente novamente.", true);
    return;
  }
  const escaped = text.replace(/[&<>"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]));
  printWindow.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Avaliação - ProvaIA</title><style>body{font:12pt/1.55 Georgia,serif;color:#111;margin:2cm}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit}h1{font-size:18pt}@page{margin:2cm}</style></head><body><pre>${escaped}</pre><script>window.onload=()=>window.print();<\/script></body></html>`);
  printWindow.document.close();
});

$("downloadBtn").addEventListener("click", () => {
  const blob = new Blob([resultText.value], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "avaliacao-provaia.txt"; a.click();
  URL.revokeObjectURL(url);
});
$("copyBtn").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(resultText.value);
    showStatus("Texto copiado.");
  } catch {
    resultText.select();
    showStatus("Selecione o texto e use a opção Copiar do seu celular.", true);
  }
});

let installPrompt;
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  $("installBtn").classList.remove("hidden");
});
$("installBtn").addEventListener("click", async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  $("installBtn").classList.add("hidden");
});
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}

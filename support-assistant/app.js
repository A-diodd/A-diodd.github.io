const manifestUrl = "manifest.json";
const uploadDir = "uploadable/";

const rulesSummary = document.querySelector("#rules-summary");
const ruleList = document.querySelector("#rule-list");
const repoFiles = document.querySelector("#repo-files");
const checkSamples = document.querySelector("#check-samples");
const sampleStatus = document.querySelector("#sample-status");
const fileInput = document.querySelector("#file-input");
const dropZone = document.querySelector("#drop-zone");
const results = document.querySelector("#results");

let manifest = null;

function extensionOf(name) {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot).toLowerCase() : "";
}

function groupFor(ext) {
  return manifest.groups.find((group) => group.extensions.includes(ext));
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function renderRules() {
  const extensions = manifest.groups.flatMap((group) => group.extensions);
  rulesSummary.textContent = `一次最多 ${manifest.maxFiles} 个文件，单个不超过 ${formatBytes(manifest.maxBytes)}。`;
  ruleList.replaceChildren();
  for (const group of manifest.groups) {
    const item = document.createElement("li");
    item.textContent = `${group.label}：${group.extensions.join(" ")}`;
    ruleList.append(item);
  }
  fileInput.accept = extensions.join(",");
}

function renderRepoFiles() {
  repoFiles.replaceChildren();
  for (const file of manifest.files) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = uploadDir + file.name;
    link.textContent = file.name;
    const note = document.createElement("span");
    note.textContent = file.description;
    item.append(link, note);
    repoFiles.append(item);
  }
}

function classify(file) {
  const ext = extensionOf(file.name);
  const group = groupFor(ext);
  if (!group) {
    return { ok: false, reason: `${ext || "无扩展名"} 不在允许列表里` };
  }
  if (file.size === 0) {
    return { ok: false, reason: "文件是空的" };
  }
  if (file.size > manifest.maxBytes) {
    return { ok: false, reason: `超过 ${formatBytes(manifest.maxBytes)}` };
  }
  return { ok: true, reason: "可以上传", kind: group.kind };
}

const previewUrls = [];

function renderResults(files) {
  previewUrls.splice(0).forEach((url) => URL.revokeObjectURL(url));
  results.replaceChildren();
  const accepted = [];
  files.forEach((file, index) => {
    const verdict = index >= manifest.maxFiles
      ? { ok: false, reason: `超过 ${manifest.maxFiles} 个文件的上限` }
      : classify(file);
    if (verdict.ok) accepted.push(file.name);
    const item = document.createElement("li");
    const title = document.createElement("strong");
    title.textContent = `${file.name} · ${formatBytes(file.size)}`;
    const detail = document.createElement("span");
    detail.className = verdict.ok ? "ok" : "bad";
    detail.textContent = verdict.reason;
    item.append(title, detail);
    if (verdict.ok && verdict.kind === "image") {
      const image = document.createElement("img");
      image.className = "preview";
      image.alt = file.name;
      const url = URL.createObjectURL(file);
      previewUrls.push(url);
      image.src = url;
      item.append(image);
    } else if (verdict.ok && verdict.kind === "text") {
      const snippet = document.createElement("pre");
      snippet.className = "snippet";
      snippet.textContent = "正在读取…";
      item.append(snippet);
      file.text().then((text) => {
        snippet.textContent = text.slice(0, 400);
      }).catch(() => {
        snippet.textContent = "无法读取文本内容";
      });
    }
    results.append(item);
  });
  return accepted;
}

async function loadSamples() {
  checkSamples.disabled = true;
  sampleStatus.textContent = "正在读取仓库里的示例文件…";
  try {
    const files = await Promise.all(manifest.files.map(async (entry) => {
      const response = await fetch(uploadDir + entry.name);
      if (!response.ok) throw new Error(entry.name);
      const blob = await response.blob();
      return new File([blob], entry.name, { type: blob.type });
    }));
    const accepted = renderResults(files);
    sampleStatus.textContent = accepted.length === files.length
      ? `${accepted.length} 个示例文件都可以上传。`
      : "有示例文件未通过检查。";
  } catch (error) {
    sampleStatus.textContent = `读取失败：${error.message}`;
  } finally {
    checkSamples.disabled = false;
  }
}

fileInput.addEventListener("change", () => {
  renderResults([...fileInput.files]);
  sampleStatus.textContent = "";
});

["dragenter", "dragover"].forEach((name) => {
  dropZone.addEventListener(name, (event) => {
    event.preventDefault();
    dropZone.classList.add("over");
  });
});

["dragleave", "drop"].forEach((name) => {
  dropZone.addEventListener(name, (event) => {
    event.preventDefault();
    dropZone.classList.remove("over");
  });
});

dropZone.addEventListener("drop", (event) => {
  renderResults([...event.dataTransfer.files]);
  sampleStatus.textContent = "";
});

checkSamples.addEventListener("click", loadSamples);

fetch(manifestUrl)
  .then((response) => {
    if (!response.ok) throw new Error("manifest.json");
    return response.json();
  })
  .then((data) => {
    manifest = data;
    renderRules();
    renderRepoFiles();
  })
  .catch(() => {
    rulesSummary.textContent = "没能读到上传规则。";
    checkSamples.disabled = true;
  });

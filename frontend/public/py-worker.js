importScripts("https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js");

let pyodide = null;

async function loadPyodideAndPackages() {
  try {
    pyodide = await loadPyodide();
    self.post_action_to_main = (action) => {
      self.postMessage({ type: "ACTION", action: action });
    };
    self.postMessage({ type: "READY" });
  } catch (err) {
    console.error("Failed to load Pyodide in worker:", err);
    self.postMessage({ type: "ERROR", message: err.message });
  }
}

loadPyodideAndPackages();

self.onmessage = async (event) => {
  const { code, gameScript } = event.data;
  if (!pyodide) {
    self.postMessage({ type: "ERROR", message: "Pyodide not ready yet" });
    return;
  }
  try {
    await pyodide.runPythonAsync(gameScript);
    await pyodide.runPythonAsync(code);
    self.postMessage({ type: "FINISHED" });
  } catch (error) {
    self.postMessage({ type: "ERROR", message: error.message });
  }
};
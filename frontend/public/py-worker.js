importScripts("https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js");

let pyodide = null;

async function loadPyodideAndPackages() {
  try {
    const instance = await loadPyodide();
    self.pyodide = instance;
    pyodide = instance;
    self.post_action_to_main = (action) => {
      self.postMessage({ type: "ACTION", action: action });
    };
    self.postMessage({ type: "READY" });
  } catch (err) {
    self.postMessage({ type: "ERROR", message: err.message });
  }
}

loadPyodideAndPackages();

self.onmessage = async (event) => {
  const { code, gameScript, spawn } = event.data;
  if (!self.pyodide) {
    self.postMessage({ type: "ERROR", message: "Worker not initialized yet" });
    return;
  }
  try {
    self.initial_spawn = spawn;
    self.pyodide.globals.set("initial_spawn", spawn);
    await self.pyodide.runPythonAsync(gameScript);
    await self.pyodide.runPythonAsync(code);
    self.postMessage({ type: "FINISHED" });
  } catch (error) {
    self.postMessage({ type: "ERROR", message: error.message });
  }
};
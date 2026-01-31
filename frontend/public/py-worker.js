importScripts("https://cdn.jsdelivr.net/pyodide/v0.29.3/full/pyodide.js");

let isGameInitialized = false;

async function loadPyodideAndPackages() {
  try {
    const instance = await loadPyodide();
    self.pyodide = instance;
    await self.pyodide.loadPackage(['pyyaml','pydantic'])
    const helperCode = await ( await fetch("https://pottmeier.github.io/PythonWithDrones/python/model.py")).text(); //TODO: Match to basepath
    self.pyodide.FS.writeFile("model.py", helperCode)
    self.post_action_to_main = (action) => {
      self.postMessage({ type: "ACTION", action: action?.toJs?.({ dict_convert: true }) ?? action });
    };
    self.postMessage({ type: "READY" });
  } catch (err) {
    self.postMessage({ type: "ERROR", message: err.message });
  }
}

loadPyodideAndPackages();

self.onmessage = async (event) => {
  const { type, code, gameScript, spawn } = event.data;
  if (!self.pyodide) {
    self.postMessage({ type: "ERROR", message: "Worker not initialized yet" });
    return;
  }
  if (type === "RESET") {
    self.initial_spawn = spawn;
    await self.pyodide.runPythonAsync("reset_internal_state(js.initial_spawn)");
    return;
  }
  if (type === "RUN") {
    try {
      if (!isGameInitialized) {
        self.initial_spawn = spawn;
        await self.pyodide.runPythonAsync(gameScript);
        isGameInitialized = true;
      }

      await self.pyodide.runPythonAsync(code);
      self.postMessage({ type: "FINISHED" });
    } catch (error) {
      self.postMessage({ type: "ERROR", message: error.message });
    }
  }
};
importScripts("https://cdn.jsdelivr.net/pyodide/v0.29.3/full/pyodide.js");

const scriptURL = self.location.href;
const basePath = scriptURL.substring(0, scriptURL.lastIndexOf('/'));

async function loadPyodideAndPackages() {
  try {
    // initialize pyodide
    self.pyodide = await loadPyodide();
    await self.pyodide.loadPackage(['pyyaml','pydantic'])

    // convert python objects to JS objects 
    self.post_action_to_main = (action) => {
      self.postMessage({ 
        type: "ACTION", 
        action: action?.toJs?.({ dict_convert: true }) ?? action 
      });
    };

    // preload python code
    const modelCode = await (await fetch(`${basePath}/python/model.py`)).text();
    const gameCode = await (await fetch(`${basePath}/python/game.py`)).text();
    self.pyodide.FS.writeFile("model.py", modelCode);
    self.pyodide.FS.writeFile("game.py", gameCode);
    self.pyodide.FS.mkdirTree("/levels");

    self.postMessage({ type: "READY" });
  } catch (error) {
    self.postMessage({ type: "ERROR", message: error.message });
  }
}

loadPyodideAndPackages();

self.onmessage = async (event) => {
  const { type, code, spawn, registry, levelData, levelName } = event.data;

  if (!self.pyodide) {
    self.postMessage({ type: "ERROR", message: "Worker not initialized yet" });
    return;
  }

  if (type === "LOAD_LEVEL") {
    try {
      const levelYaml = await fetch(`${basePath}/levels/${levelName}`).then(r => r.text());
      self.pyodide.FS.writeFile("/levels/active_level.yaml", levelYaml);
      
      self.level_data = levelData;
      self.block_registry = registry;
      self.initial_spawn = spawn;
      
      await self.pyodide.runPythonAsync(`
        import game
        import js
        game.level = None
        game.initialize_level(js.initial_spawn, js.block_registry, js.level_data)
      `);
      self.postMessage({ type: "LEVEL_LOADED" });
    } catch (error) {
      self.postMessage({ type: "ERROR", message: "Failed to load level file: " + error.message });
    }
    return;
  }

  if (type === "RUN") {
    self.user_code = code;
    try {
      await self.pyodide.runPythonAsync(`
        import game
        import js
        exec(js.user_code, game.__dict__)
      `);
      self.postMessage({ type: "FINISHED" });
    } catch (error) {
      self.postMessage({ type: "ERROR", message: error.message });
    }
  }
};
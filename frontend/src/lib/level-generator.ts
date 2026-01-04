// Helper: Seeded Random Number Generator (0 to 1)
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function randomInt(min: number, max: number, seed: number) {
  return Math.floor(seededRandom(seed) * (max - min + 1)) + min;
}

// Helper: Fisher-Yates Shuffle
function shuffleArray(array: any[], seed: number) {
  let m = array.length, t, i;
  let currentSeed = seed;
  while (m) {
    i = Math.floor(seededRandom(currentSeed++) * m--);
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }
  return array;
}

function ensureLayerExists(level: any, layerIndex: number, width: number, depth: number) {
  const layerName = `layer_${layerIndex}`;
  if (!level.layers[layerName]) {
    // Create a new empty layer
    // Array(depth) creates Rows (Z-axis)
    // Array(width) creates Columns (X-axis)
    level.layers[layerName] = Array(depth).fill(null).map(() => Array(width).fill("empty"));
  }
  return level.layers[layerName];
}

export function generateLevel(blueprint: any, seed: number = Date.now()): any {
  // 1. Deep Copy
  const level = JSON.parse(JSON.stringify(blueprint));
  if (!level.procedural) return level;

  // Get map dimensions from the base layer
  const baseLayer = level.layers['layer_0'];
  const depth = baseLayer.length;       // Z-axis size (Number of rows)
  const width = baseLayer[0].length;    // X-axis size (Number of columns)

  let currentSeed = seed;

  for (const rule of level.procedural) {
    const layerName = rule.target_layer;
    const currentLayer = level.layers[layerName];
    if (!currentLayer) continue;

    // --- A. FIND SLOTS ---
    const availableSlots: { x: number, z: number }[] = [];
    
    // Z Loop (Rows)
    for (let z = 0; z < currentLayer.length; z++) {
      // X Loop (Columns)
      for (let x = 0; x < currentLayer[z].length; x++) {
        
        if (currentLayer[z][x] === rule.placeholder) {
            // Check spawn protection (using X and Z coordinates)
            // Ensure your YAML spawn object actually has .x and .z properties!
            const isSpawnPosition = (x === level.spawn.x && z === level.spawn.z);
            
            if (isSpawnPosition) {
                currentLayer[z][x] = "empty";
            } else {
                availableSlots.push({ x, z });
            }
        }
      }
    }

    // --- B. PREPARE ITEMS ---
    const itemPool: any[] = [];
    
    rule.items.forEach((itemDef: any) => {
      for (let i = 0; i < itemDef.count; i++) {
        if (itemDef.id === 'tree') {
          itemPool.push({
            type: 'tree',
            min_height: itemDef.min_height || 2,
            max_height: itemDef.max_height || 4
          });
        } else {
          itemPool.push({ type: 'static', id: itemDef.id });
        }
      }
    });

    // Fill remaining slots
    const remainingCount = availableSlots.length - itemPool.length;
    for (let i = 0; i < remainingCount; i++) {
      itemPool.push({ type: 'static', id: 'empty' });
    }

    // --- C. SHUFFLE & PLACE ---
    const shuffledItems = shuffleArray(itemPool, currentSeed);
    currentSeed += 100;

    const treesToGrow: { x: number; z: number; height: number }[] = [];

    availableSlots.forEach((slot, index) => {
      const item = shuffledItems[index];
      
      // Access Logic: layer[z][x]
      
      if (item.type === 'static') {
        currentLayer[slot.z][slot.x] = item.id;
      } 
      else if (item.type === 'tree') {
        currentLayer[slot.z][slot.x] = "tree_trunk"; 
        
        const treeHeight = randomInt(item.min_height, item.max_height, currentSeed + index);
        
        // Save X and Z for vertical growth
        treesToGrow.push({ x: slot.x, z: slot.z, height: treeHeight });
      }
    });

    // --- D. GROWTH PHASE (Verticality / Y-Axis) ---
    const startLayerIndex = parseInt(layerName.split('_')[1]) + 1;

    treesToGrow.forEach(tree => {
      // Loop upwards (Y-Axis)
      for (let h = 1; h < tree.height; h++) {
        const targetLayerIndex = startLayerIndex + (h - 1);
        
        // ensureLayerExists returns matrix[z][x]
        const targetLayer = ensureLayerExists(level, targetLayerIndex, width, depth);
        
        const isTop = (h === tree.height - 1);
        const blockToPlace = isTop ? "tree_leaves" : "tree_trunk";
        
        // Place block at [z][x]
        targetLayer[tree.z][tree.x] = blockToPlace;
      }
    });
  }

  return level;
}
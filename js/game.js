const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const statusEl = document.getElementById("status");
const buildMenu = document.getElementById("buildMenu");

const GRID = 96;
const ASSET = "Assets/sprites/";

const spriteFiles = [
    "barrel.png","colonist_1.png","colonist_2.png","colonist_3.png","colonist_4.png","colonist_5.png",
    "crater_large.png","crater_small.png","drone_large.png","drone_small.png","dune_small.png","flag.png",
    "habitat.png","habitat_small.png","ice_deposit.png","iron_ore.png","lamp_post.png","life_support_tower.png",
    "miner.png","oxygen_plant.png","plant_rock_cluster.png","plants_cluster.png","radio_tower.png","rare_minerals.png",
    "regolith.png","resource_crate.png","ridge_1.png","ridge_2.png","robot_worker.png","rock_small_1.png",
    "rock_small_2.png","rock_spire.png","rocket_export.png","rocks_mid.png","rover.png","satellite_dish.png",
    "solar_array_large.png","solar_panel.png","spire_cluster.png","storage.png","storage_large.png","supply_box.png",
    "tank_station_1.png","tank_station_2.png","terminal.png","terrain_1_1.png","terrain_1_2.png","terrain_1_3.png",
    "terrain_1_4.png","terrain_1_5.png","terrain_2_1.png","terrain_2_2.png","terrain_2_3.png","terrain_2_4.png",
    "terrain_2_5.png","terrain_3_1.png","terrain_3_2.png","terrain_3_3.png","terrain_3_4.png","terrain_3_5.png",
    "ui_build_button.png","ui_demolish_button.png","ui_fast_button.png","ui_health_bars.png","ui_menu_button.png",
    "ui_pause_button.png","ui_resources_panel.png","ui_selection.png","ui_sell_button.png","ui_settings_button.png",
    "ui_upgrade_button.png","water_extractor.png","wind_sensor.png"
];

const images = {};
let loadedCount = 0;

function loadSprites() {
    return Promise.all(spriteFiles.map(file => new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
            images[file] = img;
            loadedCount++;
            statusEl.textContent = `Loading sprites ${loadedCount}/${spriteFiles.length}`;
            resolve();
        };
        img.onerror = () => {
            console.warn("Could not load", file);
            resolve();
        };
        img.src = ASSET + file;
    })));
}

const colony = {
    credits: 1200,
    iron: 0,
    water: 60,
    oxygen: 100,
    power: 60,
    population: 3
};

let selectedBuilding = "miner";
let selectedPlaced = null;
let paused = false;
let speed = 1;
let simulationAccumulator = 0;
let lastTime = performance.now();

const buildingData = {
    habitat: { name:"Habitat", cost:300, sprite:"habitat.png", size:1.25 },
    miner: { name:"Iron Miner", cost:200, sprite:"miner.png", size:1.05 },
    solar: { name:"Solar Array", cost:150, sprite:"solar_panel.png", size:1.1 },
    oxygen: { name:"Oxygen Plant", cost:250, sprite:"oxygen_plant.png", size:1.08 },
    water: { name:"Water Extractor", cost:250, sprite:"water_extractor.png", size:1.05 },
    storage: { name:"Storage", cost:180, sprite:"storage.png", size:1.05 },
    lifeSupport: { name:"Life Support", cost:325, sprite:"life_support_tower.png", size:1.0 },
    solarLarge: { name:"Large Solar", cost:420, sprite:"solar_array_large.png", size:1.25 },
    tanksA: { name:"Tank Station", cost:350, sprite:"tank_station_1.png", size:1.2 },
    tanksB: { name:"Water Tanks", cost:350, sprite:"tank_station_2.png", size:1.15 },
    storageLarge: { name:"Large Storage", cost:420, sprite:"storage_large.png", size:1.15 },
    satellite: { name:"Satellite Dish", cost:280, sprite:"satellite_dish.png", size:.8 },
    radio: { name:"Radio Tower", cost:220, sprite:"radio_tower.png", size:.75 },
    sensor: { name:"Wind Sensor", cost:140, sprite:"wind_sensor.png", size:.65 },
    terminal: { name:"Terminal", cost:175, sprite:"terminal.png", size:.75 },
    lamp: { name:"Lamp", cost:75, sprite:"lamp_post.png", size:.65 },
    flag: { name:"Mars Flag", cost:50, sprite:"flag.png", size:.8 },
    export: { name:"Rocket Export", cost:700, sprite:"rocket_export.png", size:1.65 }
};

const buildings = [
    {type:"habitat", x:4*GRID, y:3*GRID},
    {type:"solar", x:6*GRID, y:3*GRID},
    {type:"storage", x:5*GRID, y:5*GRID}
];

const terrainTiles = [
    "terrain_1_1.png","terrain_1_2.png","terrain_1_3.png","terrain_1_4.png","terrain_1_5.png",
    "terrain_2_1.png","terrain_2_2.png","terrain_2_3.png","terrain_2_4.png","terrain_2_5.png",
    "terrain_3_1.png","terrain_3_2.png","terrain_3_3.png","terrain_3_4.png","terrain_3_5.png"
];

const scenerySprites = [
    "crater_large.png","crater_small.png","dune_small.png","plant_rock_cluster.png","plants_cluster.png",
    "ridge_1.png","ridge_2.png","rock_small_1.png","rock_small_2.png","rock_spire.png","rocks_mid.png","spire_cluster.png",
    "barrel.png","resource_crate.png","supply_box.png"
];

const resourceNodes = [
    {sprite:"iron_ore.png", x:2.0*GRID, y:2.0*GRID, label:"Iron"},
    {sprite:"ice_deposit.png", x:9.0*GRID, y:2.1*GRID, label:"Ice"},
    {sprite:"regolith.png", x:2.5*GRID, y:6.3*GRID, label:"Regolith"},
    {sprite:"rare_minerals.png", x:9.3*GRID, y:6.2*GRID, label:"Rare Minerals"}
];

const worldProps = [];
for (let i = 0; i < 22; i++) {
    const sprite = scenerySprites[i % scenerySprites.length];
    worldProps.push({
        sprite,
        x: (1 + ((i * 3.13) % 10)) * GRID,
        y: (1 + ((i * 5.27) % 7)) * GRID,
        scale: .45 + (i % 4) * .08
    });
}

const units = [
    {kind:"colonist", frames:["colonist_1.png","colonist_2.png","colonist_3.png","colonist_4.png","colonist_5.png"], x:4.4*GRID,y:4.3*GRID, vx:17,vy:9, frame:0},
    {kind:"rover", frames:["rover.png"], x:7.0*GRID,y:5.5*GRID, vx:-15,vy:7, frame:0},
    {kind:"drone", frames:["drone_large.png","drone_small.png"], x:6.7*GRID,y:2.0*GRID, vx:12,vy:13, frame:0},
    {kind:"robot", frames:["robot_worker.png"], x:5.3*GRID,y:6.2*GRID, vx:10,vy:-12, frame:0}
];

function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(innerWidth * dpr);
    canvas.height = Math.floor(innerHeight * dpr);
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    ctx.setTransform(dpr,0,0,dpr,0,0);
}

function buildButtons() {
    buildMenu.innerHTML = "";
    Object.entries(buildingData).forEach(([key, data]) => {
        const button = document.createElement("button");
        button.className = "build-card" + (key === selectedBuilding ? " selected" : "");
        button.innerHTML = `<img src="${ASSET + data.sprite}" alt=""><span>${data.name}<br>$${data.cost}</span>`;
        button.onclick = () => {
            selectedBuilding = key;
            selectedPlaced = null;
            [...buildMenu.children].forEach(b => b.classList.remove("selected"));
            button.classList.add("selected");
            statusEl.textContent = "Place " + data.name + " on an empty grid tile.";
        };
        buildMenu.appendChild(button);
    });
}

function spriteCatalog() {
    const grid = document.getElementById("catalogGrid");
    grid.innerHTML = "";
    spriteFiles.forEach(file => {
        const item = document.createElement("div");
        item.className = "catalog-item";
        item.innerHTML = `<img src="${ASSET + file}" alt=""><div>${file}</div>`;
        grid.appendChild(item);
    });
}

function drawImageCentered(file, cx, cy, maxW, maxH) {
    const img = images[file];
    if (!img) return;
    const s = Math.min(maxW / img.width, maxH / img.height);
    const w = img.width * s;
    const h = img.height * s;
    ctx.drawImage(img, cx - w/2, cy - h/2, w, h);
}

function drawTerrain() {
    const cols = Math.ceil(innerWidth / GRID) + 1;
    const rows = Math.ceil(innerHeight / GRID) + 1;
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const file = terrainTiles[(x * 7 + y * 11) % terrainTiles.length];
            const img = images[file];
            if (img) ctx.drawImage(img, x*GRID, y*GRID, GRID+1, GRID+1);
            else {
                ctx.fillStyle = "#9a3f28";
                ctx.fillRect(x*GRID,y*GRID,GRID+1,GRID+1);
            }
        }
    }
    ctx.strokeStyle = "rgba(255,255,255,.045)";
    ctx.lineWidth = 1;
    for (let x=0; x<innerWidth; x+=GRID) {
        ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,innerHeight); ctx.stroke();
    }
    for (let y=0; y<innerHeight; y+=GRID) {
        ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(innerWidth,y); ctx.stroke();
    }
}

function drawProps() {
    worldProps.forEach(p => {
        drawImageCentered(p.sprite, p.x, p.y, GRID*p.scale, GRID*p.scale);
    });
    resourceNodes.forEach(n => {
        drawImageCentered(n.sprite, n.x, n.y, GRID*1.15, GRID*1.15);
    });
}

function drawBuildings() {
    buildings.forEach((building, index) => {
        const data = buildingData[building.type];
        const size = GRID * data.size;
        drawImageCentered(data.sprite, building.x + GRID/2, building.y + GRID/2, size, size);

        if (selectedPlaced === index) {
            ctx.strokeStyle = "#7cff5e";
            ctx.lineWidth = 3;
            ctx.strokeRect(building.x+3, building.y+3, GRID-6, GRID-6);
        }
    });
}

function drawUnits() {
    const frameTime = Math.floor(performance.now()/220);
    units.forEach(u => {
        const file = u.frames[frameTime % u.frames.length];
        const size = u.kind === "rover" ? GRID*.75 : GRID*.55;
        drawImageCentered(file, u.x, u.y, size, size);
    });
}

function updateUnits(dt) {
    units.forEach(u => {
        u.x += u.vx * dt;
        u.y += u.vy * dt;
        if (u.x < GRID || u.x > innerWidth - GRID) u.vx *= -1;
        if (u.y < GRID || u.y > innerHeight - GRID*1.8) u.vy *= -1;
    });
}

function occupiedAt(gx, gy) {
    return buildings.findIndex(b => b.x === gx && b.y === gy);
}

function placeOrSelect(clientX, clientY) {
    const gx = Math.floor(clientX / GRID) * GRID;
    const gy = Math.floor(clientY / GRID) * GRID;

    if (gy < GRID || gy > innerHeight - GRID*1.6) return;

    const occupied = occupiedAt(gx,gy);
    if (occupied >= 0) {
        selectedPlaced = occupied;
        statusEl.textContent = buildingData[buildings[occupied].type].name + " selected.";
        return;
    }

    const data = buildingData[selectedBuilding];
    if (!data) return;
    if (colony.credits < data.cost) {
        statusEl.textContent = "Not enough credits for " + data.name + ".";
        return;
    }

    colony.credits -= data.cost;
    buildings.push({type:selectedBuilding, x:gx, y:gy});
    selectedPlaced = buildings.length - 1;
    statusEl.textContent = data.name + " constructed.";
    updateHUD();
}

canvas.addEventListener("pointerdown", e => {
    placeOrSelect(e.clientX, e.clientY);
});

function productionTick() {
    if (paused) return;

    buildings.forEach(building => {
        switch (building.type) {
            case "miner":
                if (colony.power >= 1) { colony.iron += 2; colony.power -= 1; }
                break;
            case "solar":
                colony.power += 4;
                break;
            case "solarLarge":
                colony.power += 10;
                break;
            case "oxygen":
            case "lifeSupport":
                if (colony.power >= 2) { colony.oxygen += 3; colony.power -= 2; }
                break;
            case "water":
            case "tanksB":
                if (colony.power >= 2) { colony.water += 2; colony.power -= 2; }
                break;
            case "habitat":
                colony.population = Math.max(colony.population, 3);
                break;
            case "export":
                if (colony.iron >= 20) {
                    colony.iron -= 20;
                    colony.credits += 85;
                }
                break;
        }
    });

    colony.oxygen = Math.max(0, colony.oxygen - 0.12 * colony.population);
    colony.water = Math.max(0, colony.water - 0.07 * colony.population);
    colony.power = Math.max(0, colony.power);
    updateHUD();
}

function updateHUD() {
    document.getElementById("credits").textContent = Math.floor(colony.credits);
    document.getElementById("iron").textContent = Math.floor(colony.iron);
    document.getElementById("water").textContent = Math.floor(colony.water);
    document.getElementById("oxygen").textContent = Math.floor(colony.oxygen);
    document.getElementById("power").textContent = Math.floor(colony.power);
    document.getElementById("population").textContent = colony.population;
}

document.getElementById("sellBtn").onclick = () => {
    if (colony.iron >= 10) {
        colony.iron -= 10;
        colony.credits += 40;
        statusEl.textContent = "Sold 10 iron for $40.";
        updateHUD();
    } else {
        statusEl.textContent = "You need at least 10 iron to sell.";
    }
};

document.getElementById("demolishBtn").onclick = () => {
    if (selectedPlaced == null || !buildings[selectedPlaced]) {
        statusEl.textContent = "Select a building first.";
        return;
    }
    const removed = buildings.splice(selectedPlaced,1)[0];
    colony.credits += Math.floor(buildingData[removed.type].cost * .35);
    selectedPlaced = null;
    updateHUD();
    statusEl.textContent = "Building demolished. 35% salvage returned.";
};

document.getElementById("pauseBtn").onclick = () => {
    paused = !paused;
    statusEl.textContent = paused ? "Simulation paused." : "Simulation resumed.";
};

document.getElementById("speedBtn").onclick = () => {
    speed = speed === 1 ? 2 : 1;
    statusEl.textContent = speed === 2 ? "Simulation speed: 2×" : "Simulation speed: 1×";
};

document.getElementById("menuBtn").onclick = () => {
    document.getElementById("catalog").classList.remove("hidden");
};

document.getElementById("closeCatalog").onclick = () => {
    document.getElementById("catalog").classList.add("hidden");
};

function loop(now) {
    const dt = Math.min((now-lastTime)/1000, .05);
    lastTime = now;

    if (!paused) {
        updateUnits(dt * speed);
        simulationAccumulator += dt * speed;
        while (simulationAccumulator >= 1) {
            productionTick();
            simulationAccumulator -= 1;
        }
    }

    ctx.clearRect(0,0,innerWidth,innerHeight);
    drawTerrain();
    drawProps();
    drawBuildings();
    drawUnits();

    requestAnimationFrame(loop);
}

window.addEventListener("resize", resizeCanvas);

resizeCanvas();
buildButtons();
spriteCatalog();
updateHUD();

loadSprites().then(() => {
    statusEl.textContent = "Select a building, then tap the Mars surface.";
    requestAnimationFrame(loop);
});

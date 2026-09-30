const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const GRID = 64;

let selectedBuilding = null;

const colony = {
    credits: 1000,
    iron: 0,
    water: 50,
    oxygen: 100,
    power: 50
};

const buildings = [];

const buildingData = {

    miner: {
        cost: 200,
        icon: "⛏",
        name: "Iron Miner"
    },

    solar: {
        cost: 150,
        icon: "☀",
        name: "Solar Array"
    },

    oxygen: {
        cost: 250,
        icon: "🫁",
        name: "Oxygen Plant"
    },

    water: {
        cost: 250,
        icon: "💧",
        name: "Water Extractor"
    }

};

function selectBuilding(type) {

    selectedBuilding = type;

    document.getElementById("status").innerText =
        "Place " + buildingData[type].name;
}

canvas.addEventListener("click", event => {

    if (!selectedBuilding)
        return;

    const rect = canvas.getBoundingClientRect();

    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;

    x = Math.floor(x / GRID) * GRID;
    y = Math.floor(y / GRID) * GRID;

    const data = buildingData[selectedBuilding];

    if (colony.credits < data.cost) {

        document.getElementById("status").innerText =
            "Not enough credits.";

        return;
    }

    const occupied = buildings.some(
        b => b.x === x && b.y === y
    );

    if (occupied)
        return;

    colony.credits -= data.cost;

    buildings.push({
        type: selectedBuilding,
        x,
        y
    });

    document.getElementById("status").innerText =
        data.name + " constructed.";

    updateHUD();
});

function drawMars() {

    ctx.fillStyle = "#9a3f28";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    // grid

    ctx.strokeStyle = "rgba(255,255,255,.08)";

    for (let x = 0; x < canvas.width; x += GRID) {

        ctx.beginPath();

        ctx.moveTo(x,0);
        ctx.lineTo(x,canvas.height);

        ctx.stroke();
    }

    for (let y = 0; y < canvas.height; y += GRID) {

        ctx.beginPath();

        ctx.moveTo(0,y);
        ctx.lineTo(canvas.width,y);

        ctx.stroke();
    }
}

function drawBuildings() {

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = "32px Arial";

    buildings.forEach(building => {

        const data = buildingData[building.type];

        ctx.fillStyle = "#311611";

        ctx.fillRect(
            building.x + 4,
            building.y + 4,
            GRID - 8,
            GRID - 8
        );

        ctx.fillStyle = "white";

        ctx.fillText(
            data.icon,
            building.x + GRID/2,
            building.y + GRID/2
        );
    });
}

function updateHUD() {

    document.getElementById("credits").innerText =
        Math.floor(colony.credits);

    document.getElementById("iron").innerText =
        Math.floor(colony.iron);

    document.getElementById("water").innerText =
        Math.floor(colony.water);

    document.getElementById("oxygen").innerText =
        Math.floor(colony.oxygen);

    document.getElementById("power").innerText =
        Math.floor(colony.power);
}

function productionTick() {

    buildings.forEach(building => {

        switch(building.type) {

            case "miner":

                if (colony.power >= 1) {

                    colony.iron += 2;
                    colony.power -= 1;
                }

                break;

            case "solar":

                colony.power += 4;

                break;

            case "oxygen":

                if (colony.power >= 2) {

                    colony.oxygen += 3;
                    colony.power -= 2;
                }

                break;

            case "water":

                if (colony.power >= 2) {

                    colony.water += 2;
                    colony.power -= 2;
                }

                break;
        }

    });

    // colony survival

    colony.oxygen -= 0.5;
    colony.water -= 0.25;

    colony.oxygen =
        Math.max(0,colony.oxygen);

    colony.water =
        Math.max(0,colony.water);

    updateHUD();
}

function gameLoop() {

    drawMars();

    drawBuildings();

    requestAnimationFrame(gameLoop);
}

setInterval(
    productionTick,
    1000
);

updateHUD();

gameLoop();

window.addEventListener("resize", () => {

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

});

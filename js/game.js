const canvas=document.getElementById("game");
const ctx=canvas.getContext("2d");
const statusEl=document.getElementById("status");
const buildMenu=document.getElementById("buildMenu");
const GRID=96,ASSET="Assets/sprites/",BASE_ASSET="Assets/sprites/BaseBuilder/",ROAD_ASSET=BASE_ASSET+"Roads/",WALL_ASSET=BASE_ASSET+"Walls/",PLAZA_ASSET=BASE_ASSET+"Plazas/",DECOR_ASSET=BASE_ASSET+"Decor/";
const spriteFiles=["mars_base_background.png","mars_soldier.png","barrel.png","colonist_1.png","colonist_2.png","colonist_3.png","colonist_4.png","colonist_5.png","crater_large.png","crater_small.png","drone_large.png","drone_small.png","dune_small.png","flag.png","habitat.png","habitat_small.png","ice_deposit.png","iron_ore.png","lamp_post.png","life_support_tower.png","miner.png","oxygen_plant.png","plant_rock_cluster.png","plants_cluster.png","radio_tower.png","rare_minerals.png","regolith.png","resource_crate.png","ridge_1.png","ridge_2.png","robot_worker.png","rock_small_1.png","rock_small_2.png","rock_spire.png","rocket_export.png","rocks_mid.png","rover.png","satellite_dish.png","solar_array_large.png","solar_panel.png","spire_cluster.png","storage.png","storage_large.png","supply_box.png","tank_station_1.png","tank_station_2.png","terminal.png","terrain_1_1.png","terrain_1_2.png","terrain_1_3.png","terrain_1_4.png","terrain_1_5.png","terrain_2_1.png","terrain_2_2.png","terrain_2_3.png","terrain_2_4.png","terrain_2_5.png","terrain_3_1.png","terrain_3_2.png","terrain_3_3.png","terrain_3_4.png","terrain_3_5.png","ui_build_button.png","ui_demolish_button.png","ui_fast_button.png","ui_health_bars.png","ui_menu_button.png","ui_pause_button.png","ui_resources_panel.png","ui_selection.png","ui_sell_button.png","ui_settings_button.png","ui_upgrade_button.png","water_extractor.png","wind_sensor.png","command_center.png","base_gate.png","greenhouse_1.png","greenhouse_2.png","planter_1.png","planter_2.png","refinery.png","rover_garage.png","road_tile_1.png","road_tile_2.png","wall_1.png","wall_2.png","wall_3.png","wall_4.png","ore_crate.png","transport_rover.png"];
const baseBuilderFiles=["command_center.png","habitat_dome_small.png","habitat_dome_large.png","water_processing_complex.png","solar_power_station.png","life_support_complex.png","greenhouse_complex.png","storage_warehouse.png","industrial_refinery.png","satellite_comms_center.png","rover_garage.png","landing_pad.png","base_gate.png","wall_tower.png","wall_straight.png","wall_corner.png","road_straight.png","road_corner.png","road_cross.png","build_pad.png","garden_planter.png","fountain_plaza.png","exploration_rover.png","astronaut.png","utility_drone.png","cargo_crates.png"];
const puzzleFiles={
  "P/Roads/road_straight.png":ROAD_ASSET+"road_straight.png",
  "P/Roads/road_corner.png":ROAD_ASSET+"road_corner.png",
  "P/Roads/road_t.png":ROAD_ASSET+"road_t.png",
  "P/Roads/road_cross.png":ROAD_ASSET+"road_cross.png",
  "P/Roads/road_end.png":ROAD_ASSET+"road_end.png",
  "P/Walls/wall_straight_custom.png":WALL_ASSET+"wall_straight_custom.png",
  "P/Walls/wall_straight.png":WALL_ASSET+"wall_straight.png",
  "P/Walls/wall_corner.png":WALL_ASSET+"wall_corner.png",
  "P/Walls/wall_tower.png":WALL_ASSET+"wall_tower.png",
  "P/Walls/gate.png":WALL_ASSET+"gate.png",
  "P/Plazas/plaza.png":PLAZA_ASSET+"plaza.png",
  "P/Plazas/build_pad.png":PLAZA_ASSET+"build_pad.png",
  "P/Plazas/parking_pad.png":PLAZA_ASSET+"parking_pad.png",
  "P/Plazas/landing_pad.png":PLAZA_ASSET+"landing_pad.png",
  "P/Decor/planter.png":DECOR_ASSET+"planter.png",
  "P/Decor/fountain.png":DECOR_ASSET+"fountain.png",
  "P/Decor/light.png":DECOR_ASSET+"light.png",
  "P/Decor/crate.png":DECOR_ASSET+"crate.png",
  "P/Decor/terminal.png":DECOR_ASSET+"terminal.png"
};
const images={};let loadedCount=0;
function loadOne(key,url){return new Promise(function(resolve){const img=new Image();img.onload=function(){images[key]=img;loadedCount++;statusEl.textContent="Loading colony art…";resolve()};img.onerror=function(){resolve()};img.src=url})}
function loadSprites(){
  const jobs=spriteFiles.map(function(file){return loadOne(file,ASSET+file)});
  baseBuilderFiles.forEach(function(file){jobs.push(loadOne("BB/"+file,BASE_ASSET+file))});
  Object.keys(puzzleFiles).forEach(function(key){jobs.push(loadOne(key,puzzleFiles[key]))});
  return Promise.all(jobs);
}

const colony={credits:1500,iron:80,water:80,oxygen:110,power:80,population:3,hqLevel:1};
let selectedBuilding="miner",selectedPlaced=null,paused=false,speed=1,activeTab="economy",simulationAccumulator=0,lastTime=performance.now();
let gameMode="base";
let layoutDragIndex=null,layoutDragOffsetX=0,layoutDragOffsetY=0;
let fortTool="wall",fortRotation=0,fortErase=false;
const fortPieces=[];
const expedition={x:innerWidth*0.5,y:innerHeight*0.5,targetX:null,targetY:null,cargo:0,capacity:40,suitOxygen:100,harvestCooldown:0,health:100,attackCooldown:0};
const expeditionArmy={
  x:innerWidth*.5,y:innerHeight*.9,targetCamp:null,speed:135,attackCooldown:0,
  heading:-Math.PI/2,moveSpeed:0,maxMoveSpeed:135,turnRate:2.6,
  health:320,maxHealth:320,active:true,
  vehicles:[
    {ox:0,oy:0,health:120,maxHealth:120},
    {ox:-34,oy:62,health:90,maxHealth:90},
    {ox:34,oy:62,health:90,maxHealth:90}
  ],
  soldiers:[
    {ox:-22,oy:108,health:55,maxHealth:55},
    {ox:0,oy:116,health:55,maxHealth:55},
    {ox:22,oy:108,health:55,maxHealth:55},
    {ox:-38,oy:144,health:45,maxHealth:45},
    {ox:38,oy:144,health:45,maxHealth:45}
  ]
};
const combatProjectiles=[];
const combatExplosions=[];

const GAME_SAVE_KEY="marsTycoonSaveV2";
const campaign={
  sector:1,
  selectedSector:1,
  campsCleared:0,
  raidsWon:0,
  nextRaid:55,
  raidCooldown:0
};
const researchState={
  military:0,
  engineering:0,
  exploration:0
};
const researchData={
  military:{
    name:"Military Systems",
    desc:"Improves convoy weapons and automated base defenses.",
    effects:["Convoy damage +10% / level","Turret damage +6 / level","Raid response fire rate improved"],
    cost:function(lv){return {credits:260+lv*220,iron:35+lv*30}}
  },
  engineering:{
    name:"Fortification Engineering",
    desc:"Reinforces the south gate and speeds colony construction.",
    effects:["Gate health +60 / level","Construction time -10% / level","Repair losses reduced"],
    cost:function(lv){return {credits:220+lv*190,iron:45+lv*28}}
  },
  exploration:{
    name:"Expedition Logistics",
    desc:"Extends scouting range and improves convoy mobility and cargo.",
    effects:["Cargo +10 / level","Fog reveal +25px / level","Convoy speed +8% / level"],
    cost:function(lv){return {credits:200+lv*180,iron:30+lv*25}}
  }
};
const baseRaid={
  active:false,
  enemies:[],
  defenders:[],
  spawnTimer:0,
  attackCooldown:0,
  gateHealth:220,
  gateMaxHealth:220
};
const fogCanvas=document.createElement("canvas");
const fogCtx=fogCanvas.getContext("2d");

function researchCost(key){
  const level=researchState[key]||0;
  return researchData[key].cost(level);
}
function applyResearchBonuses(){
  expedition.capacity=40+researchState.exploration*10;
  expeditionArmy.maxMoveSpeed=135*(1+researchState.exploration*.08);
  baseRaid.gateMaxHealth=220+researchState.engineering*60;
  if(!baseRaid.active)baseRaid.gateHealth=baseRaid.gateMaxHealth;
}
function buyResearch(key){
  const level=researchState[key]||0;
  if(level>=3)return;
  const cost=researchCost(key);
  if(colony.credits<cost.credits||colony.iron<cost.iron){
    statusEl.textContent="Not enough resources for research.";
    return;
  }
  colony.credits-=cost.credits;
  colony.iron-=cost.iron;
  researchState[key]=level+1;
  applyResearchBonuses();
  renderResearchPanel();
  updateHUD();updateExpeditionHUD();saveGame();
  statusEl.textContent=researchData[key].name+" upgraded to Lv."+researchState[key]+".";
}
function renderResearchPanel(){
  const grid=document.getElementById("researchGrid");
  if(!grid)return;
  grid.innerHTML="";
  Object.keys(researchData).forEach(function(key){
    const d=researchData[key],level=researchState[key]||0,cost=researchCost(key);
    const card=document.createElement("div");
    card.className="research-card"+(level>=3?" maxed":"");
    card.innerHTML="<h3>"+d.name+"</h3>"+
      '<div class="research-level">LEVEL '+level+" / 3</div>"+
      '<div class="research-desc">'+d.desc+"</div>"+
      '<div class="research-effects">'+d.effects.map(function(x){return "• "+x}).join("<br>")+"</div>"+
      '<button class="research-buy" '+(level>=3?"disabled":"")+">"+
      (level>=3?"MAX LEVEL":"RESEARCH • $"+cost.credits+" + "+cost.iron+" iron")+"</button>";
    const btn=card.querySelector("button");
    if(level<3)btn.onclick=function(){buyResearch(key)};
    grid.appendChild(card);
  });
}
function openResearch(){
  document.body.classList.add("research-mode");
  document.getElementById("researchPanel").classList.remove("hidden");
  renderResearchPanel();
  paused=true;
}
function closeResearch(){
  document.body.classList.remove("research-mode");
  document.getElementById("researchPanel").classList.add("hidden");
  paused=false;
}
const researchTopBtn=document.getElementById("researchModeBtn"); if(researchTopBtn)researchTopBtn.style.display="none";
document.getElementById("closeResearchBtn").onclick=closeResearch;

function saveGame(){
  try{
    localStorage.setItem(GAME_SAVE_KEY,JSON.stringify({
      colony:colony,
      campaign:campaign,
      research:researchState,
      camps:outsideEnemyCamps.map(function(c){return {active:c.active,health:c.health};})
    }));
  }catch(e){}
}
function loadGame(){
  try{
    const raw=localStorage.getItem(GAME_SAVE_KEY);
    if(!raw)return false;
    const data=JSON.parse(raw);
    if(data.colony)Object.assign(colony,data.colony);
    if(data.campaign)Object.assign(campaign,data.campaign);
    if(data.research)Object.assign(researchState,data.research);
    if(Array.isArray(data.camps)){
      data.camps.forEach(function(s,i){
        if(outsideEnemyCamps[i]&&s){
          outsideEnemyCamps[i].active=s.active!==false;
          outsideEnemyCamps[i].health=Math.max(0,s.health??outsideEnemyCamps[i].maxHealth);
        }
      });
    }
    return true;
  }catch(e){return false}
}
setInterval(saveGame,10000);
const enemyPatrolVehicles=[
  {campIndex:0,x:null,y:null,health:85,maxHealth:85,speed:92,cooldown:0,active:true,launched:false},
  {campIndex:1,x:null,y:null,health:110,maxHealth:110,speed:86,cooldown:0,active:true,launched:false},
  {campIndex:2,x:null,y:null,health:75,maxHealth:75,speed:98,cooldown:0,active:true,launched:false}
];

// ------------------------------------------------------------
// FIRST-RUN TUTORIAL
// ------------------------------------------------------------
const TUTORIAL_STORAGE_KEY="marsTycoonTutorialCompleteV1";
let tutorialIndex=0;
let tutorialWasPaused=false;
let tutorialResizeHandler=null;

const tutorialSteps=[
  {
    title:"Welcome to Mars",
    text:"You are in charge of a growing Mars colony. Keep resources stable, expand the base, and prepare expeditions beyond the perimeter.",
    hint:"This training only appears on the first run. You can skip it at any time.",
    target:".commander-card"
  },
  {
    title:"Watch your resources",
    text:"Credits pay for construction. Iron is a core building material. Water, oxygen, and power keep the colony operating, while population shows how many colonists you support.",
    hint:"If life-support resources fall too low, expansion becomes harder.",
    target:"#resources"
  },
  {
    title:"Build the colony",
    text:"Use the build bar to choose structures. Economy buildings improve production, life-support buildings keep colonists supplied, and utility buildings unlock support functions.",
    hint:"Select a building card, then place it inside the colony.",
    target:"#buildPanel"
  },
  {
    title:"Follow colony goals",
    text:"Colony Goals give you short objectives such as constructing buildings, upgrading structures, and increasing your resources.",
    hint:"Completing these goals is a good way to learn the early game.",
    target:"#missionPanel"
  },
  {
    title:"Upgrade structures",
    text:"Tap an existing building to open its management panel. Upgrades increase production, capacity, and Colony Power.",
    hint:"The Command Hub also controls progression and unlocks higher-tier structures.",
    target:".commander-card"
  },
  {
    title:"Explore outside",
    text:"Use the OUTSIDE button when you are ready to leave the base. Move across the terrain, collect ore and other resources, then return before your suit oxygen runs out.",
    hint:"Your expedition cargo is deposited when you return to the colony.",
    target:"#zoneSwitch"
  },
  {
    title:"Training complete",
    text:"Your colony is ready. Start by managing resources and expanding carefully, then use expeditions to bring valuable material back to the base.",
    hint:"Good luck, Commander.",
    target:null
  }
];

function tutorialEls(){
  return {
    overlay:document.getElementById("tutorialOverlay"),
    spot:document.getElementById("tutorialSpotlight"),
    title:document.getElementById("tutorialTitle"),
    text:document.getElementById("tutorialText"),
    hint:document.getElementById("tutorialHint"),
    progress:document.getElementById("tutorialProgressBar"),
    back:document.getElementById("tutorialBackBtn"),
    next:document.getElementById("tutorialNextBtn"),
    skip:document.getElementById("tutorialSkipBtn")
  };
}

function tutorialCompleted(){
  try{return localStorage.getItem(TUTORIAL_STORAGE_KEY)==="1"}catch(e){return false}
}
function saveTutorialCompleted(){
  try{localStorage.setItem(TUTORIAL_STORAGE_KEY,"1")}catch(e){}
}
function positionTutorialSpotlight(){
  const e=tutorialEls(),step=tutorialSteps[tutorialIndex];
  if(!e.spot||!step||!step.target){if(e.spot)e.spot.style.opacity="0";return}
  const target=document.querySelector(step.target);
  if(!target){e.spot.style.opacity="0";return}
  const r=target.getBoundingClientRect(),pad=7;
  e.spot.style.left=Math.max(4,r.left-pad)+"px";
  e.spot.style.top=Math.max(4,r.top-pad)+"px";
  e.spot.style.width=Math.max(20,Math.min(innerWidth-r.left+pad-4,r.width+pad*2))+"px";
  e.spot.style.height=Math.max(20,Math.min(innerHeight-r.top+pad-4,r.height+pad*2))+"px";
  e.spot.style.opacity="1";
}
function renderTutorial(){
  const e=tutorialEls(),step=tutorialSteps[tutorialIndex];
  if(!e.overlay||!step)return;
  e.title.textContent=step.title;
  e.text.textContent=step.text;
  e.hint.textContent=step.hint||"";
  e.progress.style.width=((tutorialIndex+1)/tutorialSteps.length*100)+"%";
  e.back.disabled=tutorialIndex===0;
  e.next.textContent=tutorialIndex===tutorialSteps.length-1?"START COLONY":"NEXT";
  requestAnimationFrame(positionTutorialSpotlight);
}
function startTutorial(force){
  if(!force&&tutorialCompleted())return;
  const e=tutorialEls();
  if(!e.overlay)return;
  tutorialIndex=0;
  tutorialWasPaused=paused;
  paused=true;
  document.body.classList.add("tutorial-open");
  e.overlay.classList.remove("hidden");
  e.overlay.setAttribute("aria-hidden","false");
  tutorialResizeHandler=positionTutorialSpotlight;
  window.addEventListener("resize",tutorialResizeHandler);
  renderTutorial();
}
function finishTutorial(){
  const e=tutorialEls();
  if(!e.overlay)return;
  saveTutorialCompleted();
  e.overlay.classList.add("hidden");
  e.overlay.setAttribute("aria-hidden","true");
  document.body.classList.remove("tutorial-open");
  if(tutorialResizeHandler)window.removeEventListener("resize",tutorialResizeHandler);
  tutorialResizeHandler=null;
  paused=tutorialWasPaused;
  statusEl.textContent="Training complete. Build and expand your Mars colony.";
}
function skipTutorial(){finishTutorial()}
function nextTutorial(){
  if(tutorialIndex>=tutorialSteps.length-1){finishTutorial();return}
  tutorialIndex++;
  renderTutorial();
}
function previousTutorial(){
  if(tutorialIndex<=0)return;
  tutorialIndex--;
  renderTutorial();
}

document.getElementById("tutorialNextBtn")?.addEventListener("click",nextTutorial);
document.getElementById("tutorialBackBtn")?.addEventListener("click",previousTutorial);
document.getElementById("tutorialSkipBtn")?.addEventListener("click",skipTutorial);


const buildingData={
command:{name:"Command Center",cost:500,sprite:"command_center.png",baseSprite:"command_center.png",size:1.85,category:"utility",unlock:1,baseProd:"Colony HQ",basePower:-2,capacity:0,score:300,placeable:false},
greenhouse:{name:"Greenhouse",cost:320,sprite:"greenhouse_1.png",baseSprite:"greenhouse_complex.png",size:1.25,category:"life",unlock:1,baseProd:"Food +3/s",basePower:-2,capacity:35,score:125},
refinery:{name:"Refinery",cost:460,sprite:"refinery.png",baseSprite:"industrial_refinery.png",size:1.35,category:"economy",unlock:2,baseProd:"Ore value +25%",basePower:-4,capacity:80,score:180},
roverGarage:{name:"Rover Garage",cost:420,sprite:"rover_garage.png",baseSprite:"rover_garage.png",size:1.35,category:"utility",unlock:2,baseProd:"Expedition support",basePower:-2,capacity:2,score:165},
habitat:{name:"Habitat",cost:300,sprite:"habitat.png",baseSprite:"habitat_dome_large.png",size:1.25,category:"life",unlock:1,baseProd:"Population +2",basePower:-1,capacity:4,score:120},
miner:{name:"Iron Miner",cost:200,sprite:"miner.png",size:1.05,category:"economy",unlock:1,baseProd:"Iron +2/s",basePower:-1,capacity:30,score:90},
solar:{name:"Solar Array",cost:150,sprite:"solar_panel.png",baseSprite:"solar_power_station.png",size:1.1,category:"economy",unlock:1,baseProd:"Power +4/s",basePower:4,capacity:20,score:70},
oxygen:{name:"Oxygen Plant",cost:250,sprite:"oxygen_plant.png",baseSprite:"life_support_complex.png",size:1.08,category:"life",unlock:1,baseProd:"O2 +3/s",basePower:-2,capacity:30,score:100},
water:{name:"Water Extractor",cost:250,sprite:"water_extractor.png",baseSprite:"water_processing_complex.png",size:1.05,category:"life",unlock:1,baseProd:"Water +2/s",basePower:-2,capacity:30,score:100},
storage:{name:"Storage",cost:180,sprite:"storage.png",baseSprite:"storage_warehouse.png",size:1.05,category:"economy",unlock:1,baseProd:"Storage",basePower:0,capacity:100,score:75},
lifeSupport:{name:"Life Support",cost:325,sprite:"life_support_tower.png",size:1,category:"life",unlock:2,baseProd:"O2 +5/s",basePower:-3,capacity:45,score:145},
solarLarge:{name:"Large Solar",cost:420,sprite:"solar_array_large.png",size:1.25,category:"economy",unlock:2,baseProd:"Power +10/s",basePower:10,capacity:40,score:160},
tanksA:{name:"Tank Station",cost:350,sprite:"tank_station_1.png",size:1.2,category:"life",unlock:2,baseProd:"Storage",basePower:0,capacity:160,score:130},
tanksB:{name:"Water Tanks",cost:350,sprite:"tank_station_2.png",size:1.15,category:"life",unlock:2,baseProd:"Water cap",basePower:0,capacity:180,score:130},
storageLarge:{name:"Large Storage",cost:420,sprite:"storage_large.png",size:1.15,category:"economy",unlock:3,baseProd:"Storage",basePower:0,capacity:250,score:170},
satellite:{name:"Satellite Dish",cost:280,sprite:"satellite_dish.png",baseSprite:"satellite_comms_center.png",size:.8,category:"utility",unlock:2,baseProd:"Research",basePower:-1,capacity:0,score:115},
researchLab:{name:"Research Center",cost:0,sprite:"satellite_dish.png",baseSprite:"satellite_comms_center.png",size:1.1,category:"utility",unlock:1,baseProd:"Technology research",basePower:-2,capacity:0,score:180,placeable:false},
radio:{name:"Radio Tower",cost:220,sprite:"radio_tower.png",size:.75,category:"utility",unlock:2,baseProd:"Comms",basePower:-1,capacity:0,score:90},
sensor:{name:"Wind Sensor",cost:140,sprite:"wind_sensor.png",size:.65,category:"utility",unlock:1,baseProd:"Forecast",basePower:0,capacity:0,score:55},
terminal:{name:"Terminal",cost:175,sprite:"terminal.png",size:.75,category:"utility",unlock:2,baseProd:"Automation",basePower:-1,capacity:0,score:80},
lamp:{name:"Lamp",cost:75,sprite:"lamp_post.png",size:.65,category:"decor",unlock:1,baseProd:"Decoration",basePower:0,capacity:0,score:20},
flag:{name:"Mars Flag",cost:50,sprite:"flag.png",size:.8,category:"decor",unlock:1,baseProd:"Decoration",basePower:0,capacity:0,score:15},
export:{name:"Rocket Export",cost:700,sprite:"rocket_export.png",size:1.65,category:"economy",unlock:3,baseProd:"Auto export",basePower:-4,capacity:0,score:260}
};

const buildings=[];
function baseGeometry(){
  const topSafe=92,bottomSafe=118;
  const w=Math.min(innerWidth*.94,1480);
  const h=Math.min(innerHeight-topSafe-bottomSafe,760);
  const cx=innerWidth/2,cy=topSafe+h/2;
  return {cx:cx,cy:cy,left:cx-w/2,right:cx+w/2,top:cy-h/2,bottom:cy+h/2,w:w,h:h};
}
function getBuildPlots(){
  const b=baseGeometry(),u=Math.min(b.w/11.5,b.h/7.6);
  return [
    {id:"hq",x:b.cx,y:b.cy,fixed:"command",scale:1.6},
    {id:"research",x:b.cx,y:b.cy-2.55*u,fixed:"researchLab",scale:1.0},
    {id:"greenhouse",x:b.cx-3.45*u,y:b.cy-2.2*u,fixed:"greenhouse",scale:1.02},
    {id:"solar",x:b.cx+3.45*u,y:b.cy-2.2*u,fixed:"solar",scale:1.05},
    {id:"habitat",x:b.cx-3.55*u,y:b.cy-.6*u,fixed:"habitat",scale:1.12},
    {id:"water",x:b.cx+3.5*u,y:b.cy-.55*u,fixed:"water",scale:1.02},
    {id:"storage",x:b.cx-3.45*u,y:b.cy+1.55*u,fixed:"storage",scale:1.0},
    {id:"garage",x:b.cx+2.2*u,y:b.cy+1.7*u,fixed:"roverGarage",scale:1.08},
    {id:"oxygen",x:b.cx+3.55*u,y:b.cy+1.0*u,fixed:"oxygen",scale:1.0},
    {id:"plotA",x:b.cx-1.75*u,y:b.cy-2.15*u,scale:.98},
    {id:"plotB",x:b.cx+1.7*u,y:b.cy-2.15*u,scale:.98},
    {id:"plotC",x:b.cx-1.75*u,y:b.cy+1.95*u,scale:.98},
    {id:"plotD",x:b.cx+3.95*u,y:b.cy+2.15*u,scale:.92},
    {id:"plotE",x:b.cx-4.05*u,y:b.cy+2.45*u,scale:.92}
  ];
}
function syncBuildingsToPlots(){
  const plots=getBuildPlots();
  buildings.forEach(function(b){
    const p=plots.find(function(q){return q.id===b.plotId});
    if(p){b.x=p.x-GRID/2;b.y=p.y-GRID/2}
  });
}
function seedBaseLayout(){
  if(buildings.length){syncBuildingsToPlots();return}
  getBuildPlots().forEach(function(p){
    if(p.fixed)buildings.push({type:p.fixed,plotId:p.id,x:p.x-GRID/2,y:p.y-GRID/2,level:1});
  });
}
const terrainTiles=["terrain_1_1.png","terrain_1_2.png","terrain_1_3.png","terrain_1_4.png","terrain_1_5.png","terrain_2_1.png","terrain_2_2.png","terrain_2_3.png","terrain_2_4.png","terrain_2_5.png","terrain_3_1.png","terrain_3_2.png","terrain_3_3.png","terrain_3_4.png","terrain_3_5.png"];
const scenerySprites=["crater_large.png","crater_small.png","dune_small.png","plant_rock_cluster.png","plants_cluster.png","ridge_1.png","ridge_2.png","rock_small_1.png","rock_small_2.png","rock_spire.png","rocks_mid.png","spire_cluster.png","barrel.png","resource_crate.png","supply_box.png"];
const resourceNodes=[{sprite:"iron_ore.png",x:2*GRID,y:2*GRID},{sprite:"ice_deposit.png",x:9*GRID,y:2.1*GRID},{sprite:"regolith.png",x:2.5*GRID,y:6.3*GRID},{sprite:"rare_minerals.png",x:9.3*GRID,y:6.2*GRID}];
const worldProps=[];for(let i=0;i<22;i++)worldProps.push({sprite:scenerySprites[i%scenerySprites.length],x:(1+((i*3.13)%10))*GRID,y:(1+((i*5.27)%7))*GRID,scale:.45+(i%4)*.08});
const units=[{kind:"colonist",frames:["colonist_1.png","colonist_2.png","colonist_3.png","colonist_4.png","colonist_5.png"],x:4.4*GRID,y:4.3*GRID,vx:17,vy:9},{kind:"rover",frames:["rover.png"],x:7*GRID,y:5.5*GRID,vx:-15,vy:7},{kind:"drone",frames:["drone_large.png","drone_small.png"],x:6.7*GRID,y:2*GRID,vx:12,vy:13},{kind:"robot",frames:["robot_worker.png"],x:5.3*GRID,y:6.2*GRID,vx:10,vy:-12}];

function resizeCanvas(){const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.floor(innerWidth*dpr);canvas.height=Math.floor(innerHeight*dpr);canvas.style.width=innerWidth+"px";canvas.style.height=innerHeight+"px";ctx.setTransform(dpr,0,0,dpr,0,0)}
function multiplier(b){return 1+(b.level-1)*.45}
function buildingScore(b){return Math.floor(buildingData[b.type].score*(1+(b.level-1)*.35))}
function colonyScore(){return 1250+buildings.reduce(function(s,b){return s+buildingScore(b)},0)}
function upgradeCost(b){const d=buildingData[b.type],L=b.level;return{credits:Math.floor(d.cost*(.75+L*.85)),iron:Math.floor(12+L*18)}}
function canUpgrade(b){const c=upgradeCost(b);return !isConstructing(b)&&colony.credits>=c.credits&&colony.iron>=c.iron&&b.level<10}

function constructionTimeFor(type){
  const d=buildingData[type];
  if(!d)return 8;
  const base=Math.max(6,Math.min(30,Math.round(d.cost/35)));
  return Math.max(3,Math.round(base*(1-researchState.engineering*.10)));
}
function isConstructing(b){return (b.constructionRemaining||0)>0}
function constructionLabel(b){return Math.max(0,Math.ceil(b.constructionRemaining||0))+"s"}

function filteredKeys(){return Object.entries(buildingData).filter(function(entry){return entry[1].category===activeTab&&entry[1].placeable!==false}).map(function(entry){return entry[0]})}
function buildButtons(){buildMenu.innerHTML="";filteredKeys().forEach(function(key){const data=buildingData[key],locked=colony.hqLevel<data.unlock,button=document.createElement("button");button.className="build-card"+(key===selectedBuilding?" selected":"")+(locked?" locked":"");const primary=data.baseSprite?BASE_ASSET+data.baseSprite:ASSET+data.sprite;button.innerHTML='<img src="'+primary+'" onerror="this.onerror=null;this.src=\''+ASSET+data.sprite+'\'" alt=""><span>'+data.name+"<br>$"+data.cost+" • "+constructionTimeFor(key)+"s</span>"+(locked?'<div class="level-lock">HQ '+data.unlock+"</div>":"");button.onclick=function(){if(locked){statusEl.textContent="Upgrade Command Hub to Lv."+data.unlock+" first.";return}selectedBuilding=key;selectedPlaced=null;refreshBuildSelection();hideSelectedPanel();statusEl.textContent="Place "+data.name+" on an empty tile."};buildMenu.appendChild(button)})}
function refreshBuildSelection(){const keys=filteredKeys();Array.from(buildMenu.children).forEach(function(b,i){b.classList.toggle("selected",keys[i]===selectedBuilding)})}
document.querySelectorAll(".tab").forEach(function(tab){tab.onclick=function(){document.querySelectorAll(".tab").forEach(function(t){t.classList.remove("active")});tab.classList.add("active");activeTab=tab.dataset.tab;buildButtons()}});

function buildingSprite(data,placed){
  if(placed&&placed.sprite&&images["BB/"+placed.sprite])return "BB/"+placed.sprite;
  if(data&&data.baseSprite&&images["BB/"+data.baseSprite])return "BB/"+data.baseSprite;
  return data?data.sprite:null;
}
function baseArt(name,fallback){
  const puzzleCandidates={
    "road_straight.png":"P/Roads/road_straight.png",
    "road_corner.png":"P/Roads/road_corner.png",
    "road_cross.png":"P/Roads/road_cross.png",
    "build_pad.png":"P/Plazas/build_pad.png",
    "fountain_plaza.png":"P/Decor/fountain.png",
    "garden_planter.png":"P/Decor/planter.png",
    "cargo_crates.png":"P/Decor/crate.png",
    "wall_straight.png":"P/Walls/wall_straight.png",
    "wall_corner.png":"P/Walls/wall_corner.png",
    "wall_tower.png":"P/Walls/wall_tower.png",
    "base_gate.png":"P/Walls/gate.png",
    "landing_pad.png":"P/Plazas/landing_pad.png"
  };
  const p=puzzleCandidates[name];
  if(p&&images[p])return p;
  return images["BB/"+name]?"BB/"+name:fallback;
}
function spriteCatalog(){const grid=document.getElementById("catalogGrid");grid.innerHTML="";spriteFiles.forEach(function(file){const item=document.createElement("div");item.className="catalog-item";item.innerHTML='<img src="'+ASSET+file+'" alt=""><div>'+file+"</div>";grid.appendChild(item)})}
function drawImageCentered(file,cx,cy,maxW,maxH){const img=images[file];if(!img)return;const s=Math.min(maxW/img.width,maxH/img.height),w=img.width*s,h=img.height*s;ctx.drawImage(img,cx-w/2,cy-h/2,w,h)}
function drawTerrain(){
  const bg=images["mars_base_background.png"];
  if(bg){
    // Cover the whole screen while preserving the artwork aspect ratio.
    const scale=Math.max(innerWidth/bg.width,innerHeight/bg.height);
    const w=bg.width*scale,h=bg.height*scale;
    const x=(innerWidth-w)/2,y=(innerHeight-h)/2;
    ctx.drawImage(bg,x,y,w,h);
    return;
  }

  // Fallback if the custom background has not been copied into Assets yet.
  ctx.fillStyle="#8b3f2c";
  ctx.fillRect(0,0,innerWidth,innerHeight);
  const mars=images["terrain_1_2.png"]||images["terrain_2_1.png"];
  if(mars){
    const s=160;
    ctx.globalAlpha=.42;
    for(let y=0;y<innerHeight;y+=s)for(let x=0;x<innerWidth;x+=s)ctx.drawImage(mars,x,y,s+1,s+1);
    ctx.globalAlpha=1;
  }
}
function drawRotated(file,cx,cy,maxW,maxH,angle){
  const im=images[file];if(!im)return;
  const s=Math.min(maxW/im.width,maxH/im.height),w=im.width*s,h=im.height*s;
  ctx.save();ctx.translate(cx,cy);ctx.rotate(angle);ctx.drawImage(im,-w/2,-h/2,w,h);ctx.restore();
}
function drawBaseInfrastructure(){
  const b=baseGeometry(),u=Math.min(b.w/11.5,b.h/7.6);
  ctx.save();

  const hasCustomBaseBackground=!!images["mars_base_background.png"];
  if(!hasCustomBaseBackground){
    ctx.fillStyle="#aaa08e";
    ctx.strokeStyle="#504b43";
    ctx.lineWidth=4;

    // Legacy flat colony floor.
    const fortBottomY=fortPieces.length
      ? Math.max.apply(null,fortPieces.map(function(p){return p.y}))
      : b.bottom-u*.10;
    const floorTop=b.top+u*.12;
    const floorBottom=Math.min(b.bottom-u*.06,fortBottomY+u*.10);
    ctx.beginPath();
    ctx.roundRect(b.left+u*.15,floorTop,b.w-u*.30,Math.max(80,floorBottom-floorTop),22);
    ctx.fill();ctx.stroke();

    // Legacy landscaped city blocks.
    ctx.fillStyle="rgba(77,112,62,.62)";
    [
      [-4.5,-2.8,2.8,1.35],[1.75,-2.8,2.85,1.35],
      [-4.5,.55,2.75,1.8],[1.85,.55,2.85,1.9]
    ].forEach(function(r){
      ctx.beginPath();
      ctx.roundRect(b.cx+r[0]*u,b.cy+r[1]*u,r[2]*u,r[3]*u,18);
      ctx.fill();
    });
  }

  // Internal roads removed from the base layout.

  // central civic plaza
  const plaza=images["P/Plazas/plaza.png"]?"P/Plazas/plaza.png":baseArt("fountain_plaza.png",null);
  if(plaza&&images[plaza]) drawImageCentered(plaza,b.cx,b.cy,u*3.25,u*2.45);

  // coherent perimeter (automatic only until the player creates a custom fort)
  if(fortPieces.length===0&&!images["mars_base_background.png"]){
  const wall=baseArt("wall_straight.png","wall_2.png");
  const wc=baseArt("wall_corner.png","wall_4.png");
  const tower=baseArt("wall_tower.png",null);
  const gate=baseArt("base_gate.png","base_gate.png");
  const top=b.top+u*.05,bottom=b.bottom-u*.10,left=b.left+u*.08,right=b.right-u*.08;

  for(let x=left+u*.62;x<right-u*.45;x+=u*1.12) drawImageCentered(wall,x,top,u*1.2,u*.7);
  for(let x=left+u*.62;x<right-u*.45;x+=u*1.12){
    if(Math.abs(x-b.cx)>u*1.65) drawImageCentered(wall,x,bottom,u*1.2,u*.7);
  }
  for(let y=top+u*.82;y<bottom-u*.45;y+=u*1.0){
    drawRotated(wall,left,y,u*1.2,u*.7,Math.PI/2);
    drawRotated(wall,right,y,u*1.2,u*.7,Math.PI/2);
  }
  if(wc&&images[wc]){
    const cs=u*1.2;
    drawImageCentered(wc,left,top,cs,cs);
    drawRotated(wc,right,top,cs,cs,Math.PI/2);
    drawRotated(wc,left,bottom,cs,cs,-Math.PI/2);
    drawRotated(wc,right,bottom,cs,cs,Math.PI);
  }
  if(tower&&images[tower]){
    drawImageCentered(tower,left+u*.3,top+u*.42,u*1.0,u*1.5);
    drawImageCentered(tower,right-u*.3,top+u*.42,u*1.0,u*1.5);
  }
  drawImageCentered(gate,b.cx,bottom+u*.18,u*3.0,u*1.55);
  }
  if(fortPieces.length>0)drawCustomFort();

  // The fortified background already contains its own south gate and threshold.

  // build pads snap directly beside roads
  getBuildPlots().forEach(function(p){
    const militaryY=b.bottom-u*1.58;
    const tooCloseToMilitary=Math.abs(p.x-b.cx)<u*2.15&&Math.abs(p.y-militaryY)<u*1.35;
    if(tooCloseToMilitary)return;
    if(p.id==="hq"||buildings.some(function(bb){return bb.plotId===p.id}))return;
    const pad=images["P/Plazas/build_pad.png"]?"P/Plazas/build_pad.png":baseArt("build_pad.png",null);
    if(pad&&images[pad]) drawImageCentered(pad,p.x,p.y,u*1.45,u*1.08);
    ctx.fillStyle="rgba(38,36,32,.78)";
    ctx.font="bold 10px Arial";
    ctx.textAlign="center";
    ctx.fillText("BUILD",p.x,p.y+4);
  });

  const landing=images["P/Plazas/landing_pad.png"]?"P/Plazas/landing_pad.png":null;
  const parking=images["P/Plazas/parking_pad.png"]?"P/Plazas/parking_pad.png":null;
  if(landing) drawImageCentered(landing,b.cx-4.1*u,b.cy+2.6*u,u*2.35,u*1.7);
  if(parking) drawImageCentered(parking,b.cx+3.15*u,b.cy+2.45*u,u*2.05,u*1.45);

  ctx.restore();
}
function spawnColonyDefenders(){
  const b=baseGeometry(),u=Math.min(b.w/11.5,b.h/7.6);
  const count=4+researchState.military;
  baseRaid.defenders=[];
  for(let i=0;i<count;i++){
    const lane=(i-(count-1)/2)*u*.48;
    baseRaid.defenders.push({
      x:b.cx+lane,
      y:b.bottom-u*1.18-(i%2)*u*.18,
      homeX:b.cx+lane,
      homeY:b.bottom-u*1.18-(i%2)*u*.18,
      hp:70+researchState.military*15,
      maxHp:70+researchState.military*15,
      cooldown:.15+i*.11,
      speed:74+researchState.military*7,
      state:"hold",
      target:null,
      active:true
    });
  }
}
function startBaseRaid(){
  if(baseRaid.active||gameMode!=="base")return;
  const b=baseGeometry();
  baseRaid.active=true;
  baseRaid.gateHealth=baseRaid.gateMaxHealth;
  baseRaid.enemies=[];
  spawnColonyDefenders();

  const count=Math.min(9,3+campaign.sector*2);
  for(let i=0;i<count;i++){
    baseRaid.enemies.push({
      x:b.cx+(i-(count-1)/2)*58,
      y:b.bottom+100+i*16,
      hp:55+campaign.sector*12,
      maxHp:55+campaign.sector*12,
      speed:32+campaign.sector*3,
      cooldown:.5+i*.12,
      active:true
    });
  }
  statusEl.textContent="DEFENSE AI ACTIVE: Raider force approaching the south gate!";
}
function nearestRaidEnemy(x,y){
  let best=null,bestD=Infinity;
  baseRaid.enemies.forEach(function(e){
    if(!e.active||e.hp<=0)return;
    const d=Math.hypot(e.x-x,e.y-y);
    if(d<bestD){best=e;bestD=d}
  });
  return best?{enemy:best,d:bestD}:null;
}
function nearestDefender(x,y){
  let best=null,bestD=Infinity;
  baseRaid.defenders.forEach(function(d){
    if(!d.active||d.hp<=0)return;
    const dist=Math.hypot(d.x-x,d.y-y);
    if(dist<bestD){best=d;bestD=dist}
  });
  return best?{defender:best,d:bestD}:null;
}
function updateColonyDefenseAI(dt){
  if(!baseRaid.active)return;
  const b=baseGeometry(),u=Math.min(b.w/11.5,b.h/7.6);
  const defensiveLineY=b.bottom-u*.62;

  baseRaid.defenders.forEach(function(d){
    if(!d.active||d.hp<=0)return;

    // Low-health troops fall back and recover behind the firing line.
    if(d.hp<d.maxHp*.28){
      d.state="retreat";
      d.target=null;
      const dx=d.homeX-d.x,dy=(d.homeY-u*.42)-d.y,dist=Math.hypot(dx,dy);
      if(dist>5){d.x+=dx/dist*d.speed*dt;d.y+=dy/dist*d.speed*dt}
      else d.hp=Math.min(d.maxHp,d.hp+7*dt);
      return;
    }

    const threat=nearestRaidEnemy(d.x,d.y);
    if(!threat){d.state="hold";d.target=null;return}
    d.target=threat.enemy;

    // AI chooses an intercept lane but stays safely inside the colony wall.
    const desiredX=Math.max(b.left+u*.9,Math.min(b.right-u*.9,threat.enemy.x));
    const desiredY=Math.min(defensiveLineY,d.homeY+u*.28);
    const dx=desiredX-d.x,dy=desiredY-d.y,dist=Math.hypot(dx,dy);
    if(dist>18){
      d.state="intercept";
      d.x+=dx/dist*d.speed*dt;
      d.y+=dy/dist*d.speed*dt;
    }else d.state="engage";

    d.cooldown-=dt;
    const range=Math.hypot(threat.enemy.x-d.x,threat.enemy.y-d.y);
    if(range<300&&d.cooldown<=0){
      const damage=15+researchState.military*4;
      spawnTracer(d.x,d.y-8,threat.enemy.x,threat.enemy.y,false);
      threat.enemy.hp=Math.max(0,threat.enemy.hp-damage);
      if(threat.enemy.hp<=0){
        threat.enemy.active=false;
        spawnExplosion(threat.enemy.x,threat.enemy.y,22);
      }
      d.cooldown=Math.max(.30,.72-researchState.military*.07);
    }
  });
}
function updateBaseRaid(dt){
  if(!baseRaid.active)return;
  const b=baseGeometry();
  const gateX=b.cx,gateY=b.bottom-18;
  let alive=0;

  updateColonyDefenseAI(dt);

  baseRaid.enemies.forEach(function(e){
    if(!e.active||e.hp<=0)return;
    alive++;

    // Raiders prioritize nearby defenders before attacking the gate.
    const defenderThreat=nearestDefender(e.x,e.y);
    const targetDefender=defenderThreat&&defenderThreat.d<145?defenderThreat.defender:null;
    const tx=targetDefender?targetDefender.x:gateX;
    const ty=targetDefender?targetDefender.y:gateY;
    const dx=tx-e.x,dy=ty-e.y,dist=Math.hypot(dx,dy);

    if(dist>(targetDefender?105:82)){
      e.x+=dx/dist*e.speed*dt;
      e.y+=dy/dist*e.speed*dt;
    }else{
      e.cooldown-=dt;
      if(e.cooldown<=0){
        if(targetDefender){
          targetDefender.hp=Math.max(0,targetDefender.hp-(8+campaign.sector*2));
          spawnTracer(e.x,e.y,targetDefender.x,targetDefender.y,true);
          if(targetDefender.hp<=0){
            targetDefender.active=false;
            spawnExplosion(targetDefender.x,targetDefender.y,16);
          }
        }else{
          baseRaid.gateHealth=Math.max(0,baseRaid.gateHealth-(7+campaign.sector));
          spawnTracer(e.x,e.y,gateX,gateY,true);
        }
        e.cooldown=1.05;
      }
    }
  });

  // Automated turrets prioritize the hostile closest to the gate.
  baseRaid.attackCooldown-=dt;
  if(baseRaid.attackCooldown<=0){
    let target=null,best=Infinity;
    baseRaid.enemies.forEach(function(e){
      if(!e.active||e.hp<=0)return;
      const d=Math.hypot(e.x-gateX,e.y-gateY);
      if(d<best){best=d;target=e}
    });
    if(target){
      const turretSide=target.x<gateX?-1:1;
      const u=Math.min(b.w/11.5,b.h/7.6);
      const fireX=b.cx+turretSide*u*2.35,fireY=b.bottom-u*.60;
      spawnTracer(fireX,fireY,target.x,target.y,false);
      target.hp-=24+campaign.sector*3+researchState.military*6;
      if(target.hp<=0){
        target.active=false;
        spawnExplosion(target.x,target.y,25);
      }
      baseRaid.attackCooldown=Math.max(.24,.5-researchState.military*.06);
    }
  }

  if(baseRaid.gateHealth<=0){
    baseRaid.active=false;
    baseRaid.defenders=[];
    colony.credits=Math.max(0,colony.credits-(150-researchState.engineering*25));
    colony.iron=Math.max(0,colony.iron-(25-researchState.engineering*4));
    campaign.nextRaid=75;
    statusEl.textContent="South gate breached. Defense AI failed; emergency repairs started.";
    updateHUD();saveGame();
    return;
  }

  if(alive===0){
    baseRaid.active=false;
    const survivors=baseRaid.defenders.filter(function(d){return d.active&&d.hp>0}).length;
    baseRaid.defenders=[];
    campaign.raidsWon++;
    campaign.nextRaid=Math.max(28,55-campaign.sector*4);
    colony.credits+=120+campaign.sector*25;
    statusEl.textContent="Colony defended! "+survivors+" AI-controlled defenders survived.";
    updateHUD();updateMissions();saveGame();
  }
}
function drawDefenseTurrets(){
  const b=baseGeometry(),u=Math.min(b.w/11.5,b.h/7.6);
  const pts=[
    {x:b.cx-u*2.35,y:b.bottom-u*.60},
    {x:b.cx+u*2.35,y:b.bottom-u*.60}
  ];
  pts.forEach(function(p){
    const threat=nearestRaidEnemy(p.x,p.y);
    const a=threat?Math.atan2(threat.enemy.y-p.y,threat.enemy.x-p.x):Math.PI/2;
    ctx.save();
    ctx.translate(p.x,p.y);
    ctx.fillStyle="#252a2e";
    ctx.strokeStyle="#e89a43";
    ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(0,0,u*.24,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.rotate(a);
    ctx.fillStyle="#59636b";
    ctx.fillRect(0,-u*.055,u*.40,u*.11);
    ctx.fillStyle="#ffb34f";
    ctx.beginPath();ctx.arc(u*.40,0,u*.07,0,Math.PI*2);ctx.fill();
    ctx.restore();
  });
}
function drawColonyDefenders(){
  if(!baseRaid.active)return;
  baseRaid.defenders.forEach(function(d){
    if(!d.active||d.hp<=0)return;
    if(images["mars_soldier.png"])drawImageCentered("mars_soldier.png",d.x,d.y-8,GRID*.38,GRID*.38);
    else{
      ctx.save();ctx.fillStyle="#5d7654";ctx.beginPath();ctx.arc(d.x,d.y-7,5,0,Math.PI*2);ctx.fill();ctx.fillRect(d.x-5,d.y-2,10,16);ctx.restore();
    }
    drawHealthBar(d.x,d.y-32,30,4,d.hp/d.maxHp,"#79d173");
  });
}
function drawBaseRaid(){
  if(!baseRaid.active)return;
  const b=baseGeometry(),gateX=b.cx,gateY=b.bottom-18;
  baseRaid.enemies.forEach(function(e){
    if(!e.active||e.hp<=0)return;
    const a=Math.atan2(gateY-e.y,gateX-e.x);
    drawRotated("rover.png",e.x,e.y,GRID*.75,GRID*.55,a);
    drawHealthBar(e.x,e.y-27,42,5,e.hp/e.maxHp,"#d85b4b");
  });
  drawColonyDefenders();
  drawDefenseTurrets();
  drawHealthBar(gateX,gateY-34,110,7,baseRaid.gateHealth/baseRaid.gateMaxHealth,"#79d173");
  ctx.save();
  ctx.fillStyle="rgba(10,12,14,.82)";
  ctx.beginPath();ctx.roundRect(gateX-70,gateY-58,140,20,7);ctx.fill();
  ctx.fillStyle="#ffd174";ctx.font="bold 9px Arial";ctx.textAlign="center";ctx.textBaseline="middle";
  ctx.fillText("DEFENSE AI • SOUTH GATE",gateX,gateY-48);
  ctx.restore();
}
function updateRaidScheduler(dt){
  if(gameMode!=="base"||baseRaid.active||campaign.campsCleared<1)return;
  campaign.nextRaid-=dt;
  if(campaign.nextRaid<=0)startBaseRaid();
}

function drawResearchMarker(){
  if(gameMode!=="base")return;
  const lab=buildings.find(function(b){return b.type==="researchLab"});
  if(!lab)return;
  const cx=lab.x+GRID/2,cy=lab.y+GRID/2;
  const pulse=12+Math.sin(performance.now()/350)*4;
  ctx.save();
  ctx.strokeStyle="rgba(89,205,255,.75)";
  ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(cx,cy,pulse,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle="rgba(7,14,20,.82)";
  ctx.beginPath();ctx.roundRect(cx-45,cy-62,90,18,7);ctx.fill();
  ctx.fillStyle="#8fddff";
  ctx.font="bold 9px Arial";
  ctx.textAlign="center";
  ctx.textBaseline="middle";
  ctx.fillText("RESEARCH",cx,cy-53);
  ctx.restore();
}

function drawMilitaryDeploymentZone(){
  if(gameMode!=="base")return;
  const b=baseGeometry(),u=Math.min(b.w/11.5,b.h/7.6);

  // Move the yard upward and make it wider so it is not crowded against the wall/UI.
  const y=b.bottom-u*1.58;
  const yardW=u*4.35;
  const yardH=u*1.55;

  const parking=images["P/Plazas/parking_pad.png"]?"P/Plazas/parking_pad.png":null;
  const landing=images["P/Plazas/landing_pad.png"]?"P/Plazas/landing_pad.png":null;
  if(parking) drawImageCentered(parking,b.cx,y,yardW,yardH);
  else if(landing) drawImageCentered(landing,b.cx,y,yardW,yardH);

  ctx.save();

  // Clean military pad frame.
  ctx.fillStyle="rgba(15,19,22,.18)";
  ctx.strokeStyle="rgba(240,197,94,.68)";
  ctx.lineWidth=2;
  ctx.beginPath();
  ctx.roundRect(b.cx-yardW*.50,y-yardH*.50,yardW,yardH,16);
  ctx.fill();ctx.stroke();

  // Center exit lane stays completely clear.
  ctx.fillStyle="rgba(58,62,62,.72)";
  ctx.fillRect(b.cx-u*.38,y+u*.18,u*.76,u*1.45);
  ctx.strokeStyle="rgba(240,197,94,.58)";
  ctx.setLineDash([9,8]);
  ctx.beginPath();
  ctx.moveTo(b.cx,y+u*.26);
  ctx.lineTo(b.cx,y+u*1.53);
  ctx.stroke();
  ctx.setLineDash([]);

  // Deployment label.
  ctx.fillStyle="rgba(10,13,16,.88)";
  ctx.beginPath();
  ctx.roundRect(b.cx-u*.92,y-yardH*.50-u*.06,u*1.84,u*.30,8);
  ctx.fill();
  ctx.fillStyle="#ffd174";
  ctx.font="bold 9px Arial";
  ctx.textAlign="center";
  ctx.textBaseline="middle";
  ctx.fillText("MILITARY DEPLOYMENT",b.cx,y-yardH*.50+u*.09);

  // Left/right vehicle bay labels.
  ctx.fillStyle="rgba(0,0,0,.52)";
  ctx.fillRect(b.cx-u*1.92,y-u*.55,u*.84,u*.18);
  ctx.fillRect(b.cx+u*1.08,y-u*.55,u*.84,u*.18);
  ctx.fillStyle="#c9d0d3";
  ctx.font="bold 7px Arial";
  ctx.fillText("VEHICLE BAY",b.cx-u*1.50,y-u*.46);
  ctx.fillText("MUSTER",b.cx+u*1.50,y-u*.46);
  ctx.restore();

  // Vehicles are spread left / center / right instead of stacked.
  drawRotated("transport_rover.png",b.cx-u*1.30,y-u*.04,u*.98,u*.60,-Math.PI/2);
  drawRotated("rover.png",b.cx-u*.02,y-u*.10,u*.76,u*.52,-Math.PI/2);
  drawRotated("rover.png",b.cx+u*1.30,y-u*.04,u*.76,u*.52,-Math.PI/2);

  // Soldiers in two tidy rows on the right half.
  if(images["mars_soldier.png"]){
    [
      [.78,.28],[1.08,.28],[1.38,.28],
      [.92,.58],[1.22,.58]
    ].forEach(function(pos){
      drawImageCentered("mars_soldier.png",b.cx+pos[0]*u,y+pos[1]*u,u*.31,u*.31);
    });
  }

  // Supplies stay on the outer edges, leaving center path open.
  drawImageCentered("resource_crate.png",b.cx-u*1.90,y+u*.48,u*.32,u*.32);
  drawImageCentered("supply_box.png",b.cx-u*1.58,y+u*.48,u*.31,u*.31);
  drawImageCentered("terminal.png",b.cx+u*1.82,y+u*.48,u*.28,u*.28);

  // Guard posts / floodlights frame the gate approach.
  drawImageCentered("lamp_post.png",b.cx-u*.92,y+u*.62,u*.27,u*.43);
  drawImageCentered("lamp_post.png",b.cx+u*.92,y+u*.62,u*.27,u*.43);
}



function drawProps(){
  const b=baseGeometry(),u=Math.min(b.w/11.5,b.h/7.6);
  const planter=images["P/Decor/planter.png"]?"P/Decor/planter.png":baseArt("garden_planter.png","planter_1.png");
  const fountain=images["P/Decor/fountain.png"]?"P/Decor/fountain.png":null;
  const light=images["P/Decor/light.png"]?"P/Decor/light.png":null;
  const crate=images["P/Decor/crate.png"]?"P/Decor/crate.png":baseArt("cargo_crates.png","resource_crate.png");
  const terminal=images["P/Decor/terminal.png"]?"P/Decor/terminal.png":"terminal.png";

  [[-1.55,-.9],[1.55,-.9],[-1.55,.9],[1.55,.9],[-3.0,-1.3],[3.0,-1.3],[-3.0,1.25],[3.0,1.25]].forEach(function(p){
    drawImageCentered(planter,b.cx+p[0]*u,b.cy+p[1]*u,u*.72,u*.72);
  });

  if(fountain) drawImageCentered(fountain,b.cx,b.cy+u*.82,u*1.2,u*1.2);

  [[-2.4,-.2],[2.4,-.2],[-2.4,1.05],[2.4,1.05],[-3.6,-1.95],[3.6,-1.95],[-3.6,1.95],[3.6,1.95]].forEach(function(p){
    if(light) drawImageCentered(light,b.cx+p[0]*u,b.cy+p[1]*u,u*.5,u*.95);
  });

  drawImageCentered(crate,b.cx-4.0*u,b.cy+2.15*u,u*.85,u*.7);
  drawImageCentered(crate,b.cx+4.0*u,b.cy+2.1*u,u*.85,u*.7);
  drawImageCentered(terminal,b.cx+1.0*u,b.cy+.62*u,u*.6,u*.82);
}
function drawBuildings(){
  const plots=getBuildPlots();
  buildings.slice().sort(function(a,b){return a.y-b.y}).forEach(function(b){
    const index=buildings.indexOf(b),d=buildingData[b.type],plot=plots.find(function(p){return p.id===b.plotId});
    const scale=(plot&&plot.scale?plot.scale:1)*(1+Math.min((b.level-1)*.022,.15));
    const file=buildingSprite(d,b),u=Math.min(baseGeometry().w/12,baseGeometry().h/8);
    const customScale=(typeof b.scale==="number"?b.scale:1);
    const size=u*1.95*d.size*scale*customScale;
    if(b.rotation)drawRotated(file,b.x+GRID/2,b.y+GRID/2,size,size,b.rotation*Math.PI/180);
    else drawImageCentered(file,b.x+GRID/2,b.y+GRID/2,size,size);
    if(isConstructing(b)){
      const cx=b.x+GRID/2,cy=b.y+GRID/2;
      ctx.save();
      ctx.fillStyle="rgba(8,12,16,.72)";
      ctx.beginPath();ctx.roundRect(cx-42,cy-13,84,26,8);ctx.fill();
      ctx.strokeStyle="#f0c55e";ctx.lineWidth=1.5;ctx.stroke();
      ctx.fillStyle="#ffd174";ctx.font="bold 11px Arial";ctx.textAlign="center";ctx.textBaseline="middle";
      ctx.fillText("BUILD "+constructionLabel(b),cx,cy);
      ctx.restore();
    }
    ctx.save();ctx.font="bold 10px Arial";ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillStyle=index===selectedPlaced?"#74ec69":"rgba(15,18,22,.88)";
    ctx.beginPath();ctx.roundRect(b.x+GRID/2+u*.28,b.y+GRID/2-u*.58,31,18,7);ctx.fill();
    ctx.fillStyle=index===selectedPlaced?"#132112":"#ffd174";ctx.fillText("Lv."+b.level,b.x+GRID/2+u*.28+15.5,b.y+GRID/2-u*.58+9);
    if(index===selectedPlaced){ctx.strokeStyle="#7cff5e";ctx.lineWidth=3;ctx.beginPath();ctx.arc(b.x+GRID/2,b.y+GRID/2,u*.62,0,Math.PI*2);ctx.stroke()}
    ctx.restore();
  });
}
function drawUnits(){
  const frame=Math.floor(performance.now()/220);
  units.forEach(function(u){
    let file=u.frames[frame%u.frames.length];
    if(u.kind==="colonist"&&images["BB/astronaut.png"])file="BB/astronaut.png";
    if(u.kind==="rover"&&images["BB/exploration_rover.png"])file="BB/exploration_rover.png";
    if(u.kind==="drone"&&images["BB/utility_drone.png"])file="BB/utility_drone.png";
    const size=u.kind==="rover"?GRID*.8:GRID*.58;
    drawImageCentered(file,u.x,u.y,size,size);
  });
}
function updateUnits(dt){
  // Keep base workers, miners, rovers, drones and robots stationary.
  // Combat/expedition units still move through their dedicated AI systems.
  return;
}
function buildingAtPoint(x,y){
  let best=-1,bestDist=Infinity;
  buildings.forEach(function(b,i){
    const cx=b.x+GRID/2,cy=b.y+GRID/2,d=Math.hypot(x-cx,y-cy);
    if(d<75&&d<bestDist){best=i;bestDist=d}
  });
  return best;
}
function nearestFreePlot(x,y){
  let best=null,bestDist=Infinity;
  getBuildPlots().forEach(function(p){
    if(p.id==="hq"||buildings.some(function(b){return b.plotId===p.id}))return;
    const d=Math.hypot(x-p.x,y-p.y);
    if(d<bestDist){best=p;bestDist=d}
  });
  return bestDist<95?best:null;
}
function placeOrSelect(x,y){
  const hit=buildingAtPoint(x,y);
  if(hit>=0){
    if(buildings[hit].type==="researchLab"){
      selectedPlaced=null;
      hideSelectedPanel();
      openResearch();
      statusEl.textContent="Research Center opened.";
      return;
    }
    selectedPlaced=hit;showSelectedPanel();
    statusEl.textContent=buildingData[buildings[hit].type].name+" selected.";
    return;
  }
  const d=buildingData[selectedBuilding];
  if(gameMode==="layout"){
    const bg=baseGeometry();
    if(x<bg.left+55||x>bg.right-55||y<bg.top+55||y>bg.bottom-70){statusEl.textContent="Place buildings inside the base walls.";return}
    buildings.push({type:selectedBuilding,plotId:null,sprite:(buildingData[selectedBuilding].baseSprite||buildingData[selectedBuilding].sprite),rotation:0,scale:1,x:x-GRID/2,y:y-GRID/2,level:1,constructionRemaining:constructionTimeFor(selectedBuilding)});
    selectedPlaced=buildings.length-1;
    refreshLayoutOutput();
    statusEl.textContent=d.name+" added to custom layout.";
    return;
  }
  const p=nearestFreePlot(x,y);
  if(!p){statusEl.textContent="Tap an empty build pad inside the colony.";return}
  if(!d)return;
  if(colony.hqLevel<d.unlock){statusEl.textContent="Requires Command Hub Lv."+d.unlock+".";return}
  if(colony.credits<d.cost){statusEl.textContent="Not enough credits.";return}
  colony.credits-=d.cost;
  buildings.push({type:selectedBuilding,plotId:p.id,sprite:(buildingData[selectedBuilding].baseSprite||buildingData[selectedBuilding].sprite),rotation:0,scale:1,x:p.x-GRID/2,y:p.y-GRID/2,level:1,constructionRemaining:constructionTimeFor(selectedBuilding)});
  selectedPlaced=buildings.length-1;
  showSelectedPanel();updateHUD();updateMissions();
  statusEl.textContent=d.name+" constructed.";
}
canvas.addEventListener("pointerdown",function(e){
  if(gameMode==="layout"){
    if(fortErase||fortTool!=="none"){placeFortPiece(e.clientX,e.clientY);return}
    const hit=buildingAtPoint(e.clientX,e.clientY);
    if(hit>=0){
      layoutDragIndex=hit;
      layoutDragOffsetX=e.clientX-(buildings[hit].x+GRID/2);
      layoutDragOffsetY=e.clientY-(buildings[hit].y+GRID/2);
      document.body.classList.add("dragging");
      canvas.setPointerCapture&&canvas.setPointerCapture(e.pointerId);
      return;
    }
    placeOrSelect(e.clientX,e.clientY);
    return;
  }
  if(gameMode==="base")placeOrSelect(e.clientX,e.clientY);
});
canvas.addEventListener("pointermove",function(e){
  if(gameMode!=="layout"||layoutDragIndex==null)return;
  const bg=baseGeometry(),x=Math.max(bg.left+55,Math.min(bg.right-55,e.clientX-layoutDragOffsetX)),y=Math.max(bg.top+55,Math.min(bg.bottom-70,e.clientY-layoutDragOffsetY));
  buildings[layoutDragIndex].x=x-GRID/2;buildings[layoutDragIndex].y=y-GRID/2;buildings[layoutDragIndex].plotId=null;
  refreshLayoutOutput();
});
function endLayoutDrag(){if(layoutDragIndex!=null){layoutDragIndex=null;document.body.classList.remove("dragging");refreshLayoutOutput();statusEl.textContent="Building moved. Copy layout when finished."}}
canvas.addEventListener("pointerup",endLayoutDrag);
canvas.addEventListener("pointercancel",endLayoutDrag);

function showSelectedPanel(){const panel=document.getElementById("selectedPanel"),b=buildings[selectedPlaced];if(!b){panel.classList.add("hidden");return}const d=buildingData[b.type],c=upgradeCost(b),m=multiplier(b);panel.classList.remove("hidden");document.getElementById("selectedSprite").src=(b.sprite&&images["BB/"+b.sprite])?BASE_ASSET+b.sprite:((d.baseSprite&&images["BB/"+d.baseSprite])?BASE_ASSET+d.baseSprite:ASSET+d.sprite);document.getElementById("selectedName").textContent=d.name;document.getElementById("selectedLevel").textContent=b.level;document.getElementById("selectedProgressText").textContent=b.level+"/10";document.getElementById("selectedProgressBar").style.width=(b.level/10*100)+"%";document.getElementById("statProduction").textContent=isConstructing(b)?("Building • "+constructionLabel(b)):d.baseProd+" x"+m.toFixed(2);document.getElementById("statPower").textContent=(d.basePower>=0?"+":"")+Math.round(d.basePower*m)+"/s";document.getElementById("statCapacity").textContent=Math.round(d.capacity*m)||"—";document.getElementById("statScore").textContent=buildingScore(b);document.getElementById("upgradeCostText").textContent=b.level>=10?"MAX LEVEL":"$"+c.credits+" + "+c.iron+" iron";const req=document.getElementById("upgradeRequirements");req.innerHTML=b.level>=10?'<span class="req-ok">Maximum building level reached.</span>':'<div class="'+(colony.credits>=c.credits?"req-ok":"req-bad")+'">Credits: '+Math.floor(colony.credits)+" / "+c.credits+'</div><div class="'+(colony.iron>=c.iron?"req-ok":"req-bad")+'">Iron: '+Math.floor(colony.iron)+" / "+c.iron+'</div><div class="req-ok">Command Hub: Lv.'+colony.hqLevel+"</div>";document.getElementById("upgradeBtn").disabled=!canUpgrade(b)}
function hideSelectedPanel(){document.getElementById("selectedPanel").classList.add("hidden")}
document.getElementById("closeSelected").onclick=function(){selectedPlaced=null;hideSelectedPanel()};
document.getElementById("upgradeBtn").onclick=function(){const b=buildings[selectedPlaced];if(!b)return;const c=upgradeCost(b);if(!canUpgrade(b)){showSelectedPanel();return}colony.credits-=c.credits;colony.iron-=c.iron;b.level++;if(b.type==="habitat"&&b.level%2===0)colony.population++;if(b.type==="command"){colony.hqLevel=Math.min(3,b.level)}updateHUD();buildButtons();updateMissions();showSelectedPanel();statusEl.textContent=buildingData[b.type].name+" upgraded to Lv."+b.level+"."};

function updateConstruction(dt){
  buildings.forEach(function(b){
    if(!isConstructing(b))return;
    const before=b.constructionRemaining;
    b.constructionRemaining=Math.max(0,b.constructionRemaining-dt);
    if(before>0&&b.constructionRemaining<=0){
      statusEl.textContent=buildingData[b.type].name+" construction complete.";
      updateHUD();updateMissions();
    }
  });
}
function colonyIncomePerSecond(){
  let income=2; // Command administration / colony tax baseline.
  buildings.forEach(function(b){
    if(isConstructing(b))return;
    const m=multiplier(b);
    switch(b.type){
      case "habitat": income+=1.1*m; break;
      case "greenhouse": income+=.65*m; break;
      case "storage": case "storageLarge": income+=.45*m; break;
      case "roverGarage": income+=.75*m; break;
      case "satellite": case "radio": income+=.40*m; break;
      case "researchLab": income+=.55*m; break;
      case "refinery": income+=1.25*m; break;
    }
  });
  return income;
}
function productionTick(){
  if(paused)return;

  // Passive colony economy.
  colony.credits+=colonyIncomePerSecond();

  buildings.forEach(function(b){
    if(isConstructing(b))return;
    const m=multiplier(b);
    switch(b.type){
      case "miner":
        if(colony.power>=m){colony.iron+=2*m;colony.power-=m}
        break;
      case "solar":
        colony.power+=4*m;
        break;
      case "solarLarge":
        colony.power+=10*m;
        break;
      case "oxygen":
      case "lifeSupport":
        if(colony.power>=2*m){colony.oxygen+=3*m;colony.power-=2*m}
        break;
      case "water":
      case "tanksB":
        if(colony.power>=2*m){colony.water+=2*m;colony.power-=2*m}
        break;
      case "greenhouse":
        if(colony.power>=2*m){colony.oxygen+=.8*m;colony.power-=2*m}
        break;
      case "refinery":
        if(colony.power>=4*m){colony.power-=4*m}
        break;
      case "roverGarage":
        colony.power=Math.max(0,colony.power-.25*m);
        break;
      case "export":
        if(colony.iron>=20){colony.iron-=20;colony.credits+=85*m}
        break;
    }
  });

  colony.oxygen=Math.max(0,colony.oxygen-.12*colony.population);
  colony.water=Math.max(0,colony.water-.07*colony.population);
  colony.power=Math.max(0,colony.power);

  updateHUD();
  if(selectedPlaced!=null)showSelectedPanel();
  updateMissions();
}
function updateHUD(){document.getElementById("credits").textContent=Math.floor(colony.credits);document.getElementById("credits").title="Income: +$"+colonyIncomePerSecond().toFixed(1)+"/s";document.getElementById("iron").textContent=Math.floor(colony.iron);document.getElementById("water").textContent=Math.floor(colony.water);document.getElementById("oxygen").textContent=Math.floor(colony.oxygen);document.getElementById("power").textContent=Math.floor(colony.power);document.getElementById("population").textContent=colony.population;document.getElementById("hqLabel").textContent="Command Hub Lv."+colony.hqLevel;document.getElementById("colonyPowerScore").textContent=colonyScore().toLocaleString()}

const missions=[{label:"Build 5 structures",value:function(){return buildings.length},target:5},{label:"Upgrade a building to Lv.3",value:function(){return Math.max.apply(null,buildings.map(function(b){return b.level}))},target:3},{label:"Reach 150 iron",value:function(){return Math.floor(colony.iron)},target:150},{label:"Clear an enemy camp",value:function(){return campaign.campsCleared},target:1},{label:"Defend the colony",value:function(){return campaign.raidsWon},target:1},{label:"Command Hub Lv.2",value:function(){return colony.hqLevel},target:2}];
function updateMissions(){const list=document.getElementById("missionList");list.innerHTML="";missions.forEach(function(m){const v=Math.min(m.value(),m.target),done=v>=m.target,el=document.createElement("div");el.className="mission"+(done?" done":"");el.innerHTML='<div class="mission-line"><span>'+(done?"✓ ":"")+m.label+"</span><b>"+v+"/"+m.target+'</b></div><div class="mission-progress"><div style="width:'+(v/m.target*100)+'%"></div></div>';list.appendChild(el)})}

document.getElementById("sellBtn").onclick=function(){if(colony.iron>=10){colony.iron-=10;colony.credits+=40;statusEl.textContent="Sold 10 iron for $40.";updateHUD()}else statusEl.textContent="You need at least 10 iron."};
document.getElementById("demolishBtn").onclick=function(){if(selectedPlaced==null||!buildings[selectedPlaced]){statusEl.textContent="Select a building first.";return}if(buildings[selectedPlaced].type==="command"||buildings[selectedPlaced].type==="researchLab"){statusEl.textContent="This core colony building cannot be demolished.";return}const removed=buildings.splice(selectedPlaced,1)[0];colony.credits+=Math.floor(buildingData[removed.type].cost*.35);selectedPlaced=null;hideSelectedPanel();updateHUD();updateMissions();statusEl.textContent="Building demolished. 35% salvage returned."};
document.getElementById("pauseBtn").onclick=function(){paused=!paused;statusEl.textContent=paused?"Simulation paused.":"Simulation resumed."};
document.getElementById("speedBtn").onclick=function(){speed=speed===1?2:1;statusEl.textContent="Simulation speed: "+speed+"x"};
document.getElementById("menuBtn").onclick=function(){document.getElementById("catalog").classList.remove("hidden")};
document.getElementById("closeCatalog").onclick=function(){document.getElementById("catalog").classList.add("hidden")};

function fortSprite(type,sprite){
  if(sprite){
    const key="P/Walls/"+sprite;
    if(images[key])return key;
  }
  if(type==="wall")return images["P/Walls/wall_straight_custom.png"]?"P/Walls/wall_straight_custom.png":(images["P/Walls/wall_straight.png"]?"P/Walls/wall_straight.png":baseArt("wall_straight.png","wall_2.png"));
  if(type==="corner")return images["P/Walls/wall_corner.png"]?"P/Walls/wall_corner.png":baseArt("wall_corner.png","wall_4.png");
  if(type==="tower")return images["P/Walls/wall_tower.png"]?"P/Walls/wall_tower.png":baseArt("wall_tower.png",null);
  if(type==="gate")return images["P/Walls/gate.png"]?"P/Walls/gate.png":baseArt("base_gate.png","base_gate.png");
  return null;
}
function fortSize(type){
  const u=Math.min(baseGeometry().w/11.5,baseGeometry().h/7.6);
  if(type==="tower")return {w:u*1.0,h:u*1.5};
  if(type==="gate")return {w:u*3.4,h:u*1.25};
  if(type==="corner")return {w:u*1.15,h:u*1.15};
  return {w:u*1.2,h:u*.7};
}
function snapFortPoint(x,y){
  const b=baseGeometry(),step=24;
  return {x:Math.max(b.left-20,Math.min(b.right+20,Math.round(x/step)*step)),y:Math.max(b.top-20,Math.min(b.bottom+20,Math.round(y/step)*step))};
}
function drawCustomFort(){
  fortPieces.forEach(function(p){
    const file=fortSprite(p.type,p.sprite),s=fortSize(p.type);
    if(file)drawRotated(file,p.x,p.y,s.w,s.h,p.rotation*Math.PI/180);
  });
}
function fortPieceAt(x,y){
  let found=-1,best=Infinity;
  fortPieces.forEach(function(p,i){const d=Math.hypot(x-p.x,y-p.y);if(d<42&&d<best){best=d;found=i}});
  return found;
}
function placeFortPiece(x,y){
  if(fortErase){
    const i=fortPieceAt(x,y);
    if(i>=0){fortPieces.splice(i,1);refreshLayoutOutput();statusEl.textContent="Fort piece removed."}
    else statusEl.textContent="Tap a fort piece to erase.";
    return;
  }
  if(fortTool==="none")return false;
  const p=snapFortPoint(x,y);
  fortPieces.push({type:fortTool,sprite:fortTool==="wall"?"wall_straight_custom.png":null,x:p.x,y:p.y,rotation:fortRotation});
  refreshLayoutOutput();
  statusEl.textContent=fortTool+" placed.";
  return true;
}
function refreshFortStatus(){
  const label=document.getElementById("fortStatus");
  if(label)label.textContent=(fortErase?"Erase mode":(fortTool==="none"?"Building drag mode":fortTool.charAt(0).toUpperCase()+fortTool.slice(1)+" selected • "+fortRotation+"°"));
  document.body.classList.toggle("fort-placement",gameMode==="layout"&&(fortTool!=="none"||fortErase));
}
document.querySelectorAll(".fort-tool").forEach(function(btn){
  btn.onclick=function(){
    document.querySelectorAll(".fort-tool").forEach(function(b){b.classList.remove("active")});
    btn.classList.add("active");fortTool=btn.dataset.fort;fortErase=false;document.getElementById("eraseFortBtn").classList.remove("active");refreshFortStatus();
  };
});
document.getElementById("rotateFortBtn").onclick=function(){fortRotation=(fortRotation+90)%360;refreshFortStatus()};
document.getElementById("eraseFortBtn").onclick=function(){fortErase=!fortErase;document.getElementById("eraseFortBtn").classList.toggle("active",fortErase);refreshFortStatus()};
document.getElementById("clearFortBtn").onclick=function(){fortPieces.length=0;refreshLayoutOutput();statusEl.textContent="Custom fort cleared."};

function applySavedLayout(layout){
  if(!layout)return false;
  const b=baseGeometry();
  if(Array.isArray(layout.buildings)){
    buildings.length=0;
    layout.buildings.forEach(function(x){
      const cx=(typeof x.nx==="number")?b.left+x.nx*b.w:x.x;
      const cy=(typeof x.ny==="number")?b.top+x.ny*b.h:x.y;
      buildings.push({type:x.type,level:x.level||1,plotId:x.plotId||null,sprite:x.sprite||null,rotation:x.rotation||0,scale:(typeof x.scale==="number"?x.scale:1),x:cx-GRID/2,y:cy-GRID/2,constructionRemaining:0});
    });
  }
  if(Array.isArray(layout.fort)){
    fortPieces.length=0;
    layout.fort.forEach(function(p){
      fortPieces.push({
        type:p.type,
        sprite:p.sprite||null,
        x:(typeof p.nx==="number")?b.left+p.nx*b.w:p.x,
        y:(typeof p.ny==="number")?b.top+p.ny*b.h:p.y,
        rotation:p.rotation||0
      });
    });
  }
  return true;
}

function exportLayoutData(){
  const b=baseGeometry();
  const data={
    version:1,
    canvas:{width:Math.round(innerWidth),height:Math.round(innerHeight)},
    base:{left:Math.round(b.left),top:Math.round(b.top),width:Math.round(b.w),height:Math.round(b.h)},
    fort:fortPieces.map(function(p){return {type:p.type,sprite:p.sprite||null,x:Math.round(p.x),y:Math.round(p.y),nx:+((p.x-b.left)/b.w).toFixed(4),ny:+((p.y-b.top)/b.h).toFixed(4),rotation:p.rotation};}),
    buildings:buildings.map(function(x){
      const cx=x.x+GRID/2,cy=x.y+GRID/2;
      return {
        type:x.type,
        sprite:x.sprite||(buildingData[x.type].baseSprite||buildingData[x.type].sprite),
        level:x.level,
        plotId:x.plotId||null,
        rotation:x.rotation||0,
        scale:(typeof x.scale==="number"?x.scale:1),
        constructionRemaining:+(x.constructionRemaining||0).toFixed(1),
        x:Math.round(cx),
        y:Math.round(cy),
        nx:+((cx-b.left)/b.w).toFixed(4),
        ny:+((cy-b.top)/b.h).toFixed(4)
      };
    })
  };
  return JSON.stringify(data,null,2);
}
function refreshLayoutOutput(){
  const el=document.getElementById("layoutOutput");
  if(el)el.value=exportLayoutData();
}
async function copyLayoutData(){
  const text=exportLayoutData();
  refreshLayoutOutput();
  try{await navigator.clipboard.writeText(text);statusEl.textContent="Layout JSON copied. Paste it into ChatGPT."}
  catch(e){statusEl.textContent="Select the layout JSON and copy it manually."}
}
function downloadLayoutData(){
  const text=exportLayoutData(),blob=new Blob([text],{type:"application/json"}),url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download="mars_tycoon_layout.json";a.click();URL.revokeObjectURL(url);
}
document.getElementById("copyLayoutBtn").onclick=copyLayoutData;
document.getElementById("downloadLayoutBtn").onclick=downloadLayoutData;

function sectorName(n){
  return ["","Frontier Basin","Crimson Highlands","Valles Warzone"][n]||("Sector "+n);
}
function refreshSectorMap(){
  document.querySelectorAll(".sector-btn").forEach(function(btn){
    const n=+btn.dataset.sector;
    const unlocked=n<=Math.min(3,campaign.sector);
    btn.classList.toggle("locked",!unlocked);
    btn.classList.toggle("active",n===campaign.selectedSector);
    btn.disabled=!unlocked;
  });
  const el=document.getElementById("sectorStatus");
  if(el)el.textContent="Sector "+campaign.selectedSector+" • "+sectorName(campaign.selectedSector);
}
function selectSector(n){
  if(n>campaign.sector||n<1||n>3)return;
  campaign.selectedSector=n;
  outsideEnemyCamps.forEach(function(c,i){
    const scale=1+(n-1)*.28;
    c.maxHealth=Math.round([120,150,110][i]*scale);
    c.health=c.maxHealth;
    c.active=true;
    c.units.forEach(function(u){
      const base=[40,45,35][Math.min(i,2)]||40;
      u.maxHp=Math.round(Math.max(base,u.maxHp)*scale);
      u.hp=u.maxHp;u.cooldown=0;
    });
  });
  resetEnemyPatrols();
  refreshSectorMap();saveGame();
  statusEl.textContent="Entered "+sectorName(n)+". Enemy strength increased.";
}
document.querySelectorAll(".sector-btn").forEach(function(btn){
  btn.onclick=function(){selectSector(+btn.dataset.sector)};
});

function setMode(mode){
  gameMode=mode;
  document.body.classList.toggle("outside-mode",mode==="outside");
  document.body.classList.toggle("layout-mode",mode==="layout");
  document.getElementById("baseModeBtn").classList.toggle("active",mode==="base");
  document.getElementById("layoutModeBtn").classList.toggle("active",mode==="layout");
  document.getElementById("outsideModeBtn").classList.toggle("active",mode==="outside");
  document.getElementById("expeditionPanel").classList.toggle("hidden",mode!=="outside");
  document.getElementById("layoutPanel").classList.toggle("hidden",mode!=="layout");
  if(mode==="layout"){paused=true;selectedPlaced=null;hideSelectedPanel();refreshLayoutOutput();refreshFortStatus();statusEl.textContent="Layout mode: build the fort or switch to BUILDINGS to drag structures.";}
  else if(mode==="outside"){
    selectedPlaced=null;hideSelectedPanel();
    expedition.x=innerWidth*.5;expedition.y=innerHeight*.70;expedition.targetX=null;expedition.targetY=null;expeditionArmy.x=innerWidth*.5;expeditionArmy.y=innerHeight*.79;expeditionArmy.heading=-Math.PI/2;expeditionArmy.moveSpeed=0;expeditionArmy.targetCamp=null;resetEnemyPatrols();
    statusEl.textContent="Tap terrain to move. Tap an enemy camp to deploy the military convoy and engage automatically.";
  }else if(mode==="base"){
    paused=false;
    depositCargo();
    statusEl.textContent="Back at the colony base. Military convoy staged at the south gate.";
  }
  refreshSectorMap();
  updateExpeditionHUD();
}
document.getElementById("baseModeBtn").onclick=function(){setMode("base")};
document.getElementById("layoutModeBtn").onclick=function(){setMode("layout")};
document.getElementById("outsideModeBtn").onclick=function(){setMode("outside")};
document.getElementById("returnBaseBtn").onclick=function(){setMode("base")};

const outsideNodes=[
  {type:"iron",sprite:"iron_ore.png",x:.18,y:.28,amount:22,active:true},
  {type:"iron",sprite:"iron_ore.png",x:.78,y:.68,amount:26,active:true},
  {type:"ice",sprite:"ice_deposit.png",x:.72,y:.24,amount:18,active:true},
  {type:"regolith",sprite:"regolith.png",x:.28,y:.72,amount:16,active:true},
  {type:"rare",sprite:"rare_minerals.png",x:.52,y:.20,amount:10,active:true}
];
const outsideEnemyCamps=[
  {x:.17,y:.18,size:1.0,name:"Raider Camp Alpha",health:120,maxHealth:120,active:true,units:[
    {ox:-46,oy:38,hp:40,maxHp:40,cooldown:0},{ox:44,oy:32,hp:40,maxHp:40,cooldown:0},{ox:0,oy:58,hp:55,maxHp:55,cooldown:0}
  ]},
  {x:.80,y:.30,size:1.12,name:"Raider Camp Beta",health:150,maxHealth:150,active:true,units:[
    {ox:-52,oy:36,hp:45,maxHp:45,cooldown:0},{ox:48,oy:40,hp:45,maxHp:45,cooldown:0},{ox:0,oy:62,hp:60,maxHp:60,cooldown:0}
  ]},
  {x:.68,y:.76,size:.96,name:"Raider Camp Gamma",health:110,maxHealth:110,active:true,units:[
    {ox:-42,oy:34,hp:35,maxHp:35,cooldown:0},{ox:38,oy:30,hp:35,maxHp:35,cooldown:0}
  ]}
];
function campScreenPos(c){return{x:c.x*innerWidth,y:c.y*innerHeight}}
function liveCampUnits(c){return c.units.filter(function(u){return u.hp>0})}
function drawHealthBar(x,y,w,h,ratio,fill){
  ctx.save();ctx.fillStyle="rgba(8,10,12,.85)";ctx.fillRect(x-w/2,y,w,h);
  ctx.fillStyle=fill;ctx.fillRect(x-w/2+1,y+1,(w-2)*Math.max(0,Math.min(1,ratio)),h-2);
  ctx.strokeStyle="rgba(255,255,255,.25)";ctx.strokeRect(x-w/2,y,w,h);ctx.restore();
}
function drawEnemyUnit(camp,u){
  const p=campScreenPos(camp),x=p.x+u.ox,y=p.y+u.oy;
  const a=Math.atan2(expeditionArmy.y-y,expeditionArmy.x-x);
  ctx.save();
  ctx.translate(x,y);
  ctx.rotate(a+Math.PI/2);
  ctx.fillStyle="#6d3b36";
  ctx.beginPath();ctx.arc(0,-8,5,0,Math.PI*2);ctx.fill();
  ctx.fillRect(-5,-2,10,15);
  ctx.fillStyle="#21191a";
  ctx.fillRect(3,1,14,3);
  ctx.fillStyle="#4b2b29";
  ctx.fillRect(-7,11,5,9);ctx.fillRect(2,11,5,9);
  ctx.restore();
  drawHealthBar(x,y-26,34,5,u.hp/u.maxHp,"#d85b4b");
}
function drawEnemyCamp(camp){
  if(!camp.active)return;
  const p=campScreenPos(camp),x=p.x,y=p.y,s=GRID*camp.size;
  ctx.save();
  ctx.fillStyle="rgba(82,24,18,.38)";
  ctx.beginPath();ctx.ellipse(x,y+18,s*.92,s*.48,0,0,Math.PI*2);ctx.fill();
  drawImageCentered(images["BB/habitat_dome_small.png"]?"BB/habitat_dome_small.png":"habitat_small.png",x,y,s*1.45,s*1.15);
  drawImageCentered("resource_crate.png",x-s*.55,y+s*.24,s*.4,s*.4);
  drawImageCentered("barrel.png",x+s*.55,y+s*.20,s*.32,s*.32);
  liveCampUnits(camp).forEach(function(u){drawEnemyUnit(camp,u)});
  drawHealthBar(x,y-s*.62,110,7,camp.health/camp.maxHealth,"#e36a4f");
  ctx.fillStyle="rgba(20,8,8,.86)";
  ctx.beginPath();ctx.roundRect(x-58,y-s*.86,116,22,7);ctx.fill();
  ctx.strokeStyle="#d95b42";ctx.stroke();
  ctx.fillStyle="#ffb09e";ctx.font="bold 10px Arial";ctx.textAlign="center";ctx.textBaseline="middle";
  ctx.fillText(camp.name,x,y-s*.86+11);
  ctx.restore();
}
function resetOutsideNodes(){outsideNodes.forEach(function(n){n.active=true})}
function updateExpeditionHUD(){
  document.getElementById("cargoText").textContent=Math.floor(expedition.cargo)+" / "+expedition.capacity;
  document.getElementById("cargoBar").style.width=Math.min(100,expedition.cargo/expedition.capacity*100)+"%";
  document.getElementById("suitOxygenText").textContent=Math.max(0,Math.floor(expedition.suitOxygen))+"%";
  document.getElementById("suitOxygenBar").style.width=Math.max(0,expedition.suitOxygen)+"%";
}
function depositCargo(){
  if(expedition.cargo>0){colony.iron+=expedition.cargo;statusEl.textContent="Returned with "+Math.floor(expedition.cargo)+" ore.";expedition.cargo=0}
  expedition.suitOxygen=100;expedition.health=100;expeditionArmy.health=expeditionArmy.maxHealth;expeditionArmy.vehicles.forEach(function(v){v.health=v.maxHealth});expeditionArmy.soldiers.forEach(function(s){s.health=s.maxHealth});expeditionArmy.x=innerWidth*.5;expeditionArmy.y=innerHeight*.9;expeditionArmy.heading=-Math.PI/2;expeditionArmy.moveSpeed=0;expeditionArmy.targetCamp=null;resetEnemyPatrols();resetOutsideNodes();updateHUD();updateExpeditionHUD();
}
function resetEnemyPatrols(){
  enemyPatrolVehicles.forEach(function(v){
    const camp=outsideEnemyCamps[v.campIndex];
    const p=campScreenPos(camp);
    v.x=p.x;v.y=p.y+42;v.health=v.maxHealth;v.cooldown=0;
    v.active=!!camp.active;v.launched=false;
  });
}
function livePatrolsForCamp(camp){
  const idx=outsideEnemyCamps.indexOf(camp);
  return enemyPatrolVehicles.filter(function(v){return v.active&&v.health>0&&v.campIndex===idx});
}
function nearestPatrolToArmy(maxDist){
  let best=null,bestD=(typeof maxDist==="number"?maxDist:Infinity);
  enemyPatrolVehicles.forEach(function(v){
    if(!v.active||v.health<=0||v.x==null)return;
    const d=Math.hypot(expeditionArmy.x-v.x,expeditionArmy.y-v.y);
    if(d<bestD){bestD=d;best=v}
  });
  return best?{vehicle:best,d:bestD}:null;
}
function damageArmyFromPatrol(amount){
  const liveSoldiers=expeditionArmy.soldiers.filter(function(s){return s.health>0});
  const liveVehicles=expeditionArmy.vehicles.filter(function(v){return v.health>0});
  if(liveSoldiers.length){
    const s=liveSoldiers[Math.floor(Math.random()*liveSoldiers.length)];
    s.health=Math.max(0,s.health-amount);
  }else if(liveVehicles.length){
    const v=liveVehicles[Math.floor(Math.random()*liveVehicles.length)];
    v.health=Math.max(0,v.health-amount);
  }
  expeditionArmy.health=
    expeditionArmy.vehicles.reduce(function(n,v){return n+v.health},0)+
    expeditionArmy.soldiers.reduce(function(n,s){return n+s.health},0);
}
function updateEnemyPatrols(dt){
  enemyPatrolVehicles.forEach(function(v){
    const camp=outsideEnemyCamps[v.campIndex];
    if(!camp||!camp.active||v.health<=0){v.active=false;return}
    if(v.x==null||v.y==null){
      const cp=campScreenPos(camp);v.x=cp.x;v.y=cp.y+42;
    }

    // Patrol launches when its camp is targeted, then intercepts the convoy.
    if(expeditionArmy.targetCamp===camp)v.launched=true;
    if(!v.launched)return;

    const dx=expeditionArmy.x-v.x,dy=expeditionArmy.y-v.y,dist=Math.hypot(dx,dy);
    if(dist>105){
      v.x+=dx/dist*v.speed*dt;
      v.y+=dy/dist*v.speed*dt;
      return;
    }

    if(v.cooldown>0)v.cooldown-=dt;
    if(v.cooldown<=0){
      spawnTracer(v.x,v.y,expeditionArmy.x,expeditionArmy.y,true);
      damageArmyFromPatrol(10);
      v.cooldown=1.15;
      statusEl.textContent="Enemy patrol vehicle intercepting the convoy.";
      if(expeditionArmy.health<=0){
        spawnExplosion(expeditionArmy.x,expeditionArmy.y,34);
        statusEl.textContent="Army convoy destroyed by enemy patrols.";
        expeditionArmy.health=expeditionArmy.maxHealth;
        expeditionArmy.vehicles.forEach(function(a){a.health=a.maxHealth});
        expeditionArmy.soldiers.forEach(function(a){a.health=a.maxHealth});
        expeditionArmy.x=innerWidth*.5;expeditionArmy.y=innerHeight*.9;
        expeditionArmy.targetCamp=null;
        v.launched=false;
      }
    }
  });
}
function drawEnemyPatrols(){
  enemyPatrolVehicles.forEach(function(v){
    if(!v.active||v.health<=0||v.x==null)return;
    const angle=Math.atan2(expeditionArmy.y-v.y,expeditionArmy.x-v.x);
    drawRotated("rover.png",v.x,v.y,GRID*.82,GRID*.60,angle+Math.PI/2);
    ctx.save();
    ctx.strokeStyle="#d95b42";ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(v.x,v.y,25,0,Math.PI*2);ctx.stroke();
    ctx.restore();
    drawHealthBar(v.x,v.y-30,44,5,v.health/v.maxHealth,"#d85b4b");
  });
}
function campThreatLabel(camp){
  const strength=liveCampUnits(camp).length+livePatrolsForCamp(camp).length*2+Math.ceil(camp.health/80);
  return strength>=7?"HIGH":(strength>=4?"MEDIUM":"LOW");
}
function advanceSectorIfCleared(){
  if(outsideEnemyCamps.some(function(c){return c.active}))return;
  campaign.sector=Math.min(3,campaign.sector+1);
  campaign.nextRaid=Math.max(28,55-campaign.sector*4);
  outsideEnemyCamps.forEach(function(c,i){
    c.maxHealth=Math.round(c.maxHealth*(1.18+campaign.sector*.03));
    c.health=c.maxHealth;
    c.active=true;
    c.units.forEach(function(u){
      u.maxHp=Math.round(u.maxHp*(1.10+campaign.sector*.025));
      u.hp=u.maxHp;u.cooldown=0;
    });
  });
  resetEnemyPatrols();
  statusEl.textContent="Sector "+campaign.sector+" unlocked. Enemy camps have reinforced.";
  saveGame();
}
function campAtPoint(x,y){
  let best=null,bestD=Infinity;
  outsideEnemyCamps.forEach(function(c){
    if(!c.active)return;
    const p=campScreenPos(c),d=Math.hypot(x-p.x,y-p.y);
    if(d<145&&d<bestD){best=c;bestD=d}
  });
  return best;
}
function dispatchArmyToCamp(camp){
  if(!camp||!camp.active)return false;
  expeditionArmy.targetCamp=camp;
  expeditionArmy.active=true;
  expeditionArmy.moveSpeed=0;
  livePatrolsForCamp(camp).forEach(function(v){v.launched=true});
  statusEl.textContent="Army convoy dispatched to "+camp.name+" • Threat "+campThreatLabel(camp)+" • Enemy patrols mobilizing.";
  return true;
}
function updateArmy(dt){
  if(!expeditionArmy.active||!expeditionArmy.targetCamp)return;
  const camp=expeditionArmy.targetCamp;
  if(!camp.active){expeditionArmy.targetCamp=null;return}
  const p=campScreenPos(camp),dx=p.x-expeditionArmy.x,dy=p.y-expeditionArmy.y,dist=Math.hypot(dx,dy);
  if(dist>118){
    const desired=Math.atan2(dy,dx);
    let delta=((desired-expeditionArmy.heading+Math.PI*3)%(Math.PI*2))-Math.PI;
    const maxTurn=expeditionArmy.turnRate*dt;
    delta=Math.max(-maxTurn,Math.min(maxTurn,delta));
    expeditionArmy.heading+=delta;

    // Slow down for sharp turns and when approaching the camp.
    const turnSlow=1-Math.min(.65,Math.abs(delta)/(maxTurn||1)*.45);
    const approachSlow=Math.max(.35,Math.min(1,(dist-118)/240));
    const targetSpeed=expeditionArmy.maxMoveSpeed*turnSlow*approachSlow;
    const accel=210*dt;
    if(expeditionArmy.moveSpeed<targetSpeed) expeditionArmy.moveSpeed=Math.min(targetSpeed,expeditionArmy.moveSpeed+accel);
    else expeditionArmy.moveSpeed=Math.max(targetSpeed,expeditionArmy.moveSpeed-accel*1.4);

    expeditionArmy.x+=Math.cos(expeditionArmy.heading)*expeditionArmy.moveSpeed*dt;
    expeditionArmy.y+=Math.sin(expeditionArmy.heading)*expeditionArmy.moveSpeed*dt;
    statusEl.textContent="Army convoy moving to "+camp.name+".";
    return;
  }
  expeditionArmy.moveSpeed=Math.max(0,expeditionArmy.moveSpeed-260*dt);

  if(expeditionArmy.attackCooldown>0)expeditionArmy.attackCooldown-=dt;
  if(expeditionArmy.attackCooldown>0)return;

  const units=liveCampUnits(camp);
  const activeVehicles=expeditionArmy.vehicles.filter(function(v){return v.health>0}).length;
  const activeSoldiers=expeditionArmy.soldiers.filter(function(s){return s.health>0}).length;
  const attackPower=Math.round((10+activeVehicles*5+activeSoldiers*2)*(1+researchState.military*.10));
  const patrolThreat=nearestPatrolToArmy(190);

  if(patrolThreat){
    const pv=patrolThreat.vehicle;
    expeditionArmy.vehicles.filter(function(v){return v.health>0}).slice(0,2).forEach(function(){
      spawnTracer(expeditionArmy.x,expeditionArmy.y,pv.x,pv.y,false);
    });
    pv.health=Math.max(0,pv.health-attackPower);
    if(pv.health<=0){
      pv.active=false;
      spawnExplosion(pv.x,pv.y,28);
      statusEl.textContent="Enemy patrol vehicle destroyed.";
    }else{
      statusEl.textContent="Convoy engaging enemy patrol vehicle.";
    }
  }else if(units.length){
    const target=units[0];
    const cp=campScreenPos(camp),tx=cp.x+target.ox,ty=cp.y+target.oy;
    const liveV=expeditionArmy.vehicles.filter(function(v){return v.health>0});
    const liveS=expeditionArmy.soldiers.filter(function(s){return s.health>0});
    liveV.slice(0,2).forEach(function(v){
      spawnTracer(expeditionArmy.x+v.ox*.35,expeditionArmy.y+v.oy*.2,tx,ty,false);
    });
    liveS.slice(0,3).forEach(function(s){
      spawnTracer(expeditionArmy.x+s.ox*.35,expeditionArmy.y+s.oy*.25,tx,ty,false);
    });
    target.hp=Math.max(0,target.hp-attackPower);
    if(target.hp<=0)spawnExplosion(tx,ty,18);
    statusEl.textContent="Convoy engaging guards at "+camp.name+".";
  }else{
    const cp=campScreenPos(camp);
    spawnTracer(expeditionArmy.x,expeditionArmy.y,cp.x,cp.y,false);
    camp.health=Math.max(0,camp.health-(attackPower+8));
    statusEl.textContent="Army attacking "+camp.name+".";
    if(camp.health<=0){
      spawnExplosion(cp.x,cp.y,42);
      camp.active=false;
      const lootIron=14+campaign.sector*4;
      const lootCredits=70+campaign.sector*20;
      expedition.cargo=Math.min(expedition.capacity,expedition.cargo+lootIron);
      colony.credits+=lootCredits;
      campaign.campsCleared++;
      expeditionArmy.targetCamp=null;
      statusEl.textContent=camp.name+" cleared • +"+lootIron+" cargo • +$"+lootCredits+".";
      updateExpeditionHUD();updateHUD();updateMissions();saveGame();
      advanceSectorIfCleared();
    }
  }
  expeditionArmy.attackCooldown=.55;
}
function drawArmyConvoy(){
  if(gameMode!=="outside"||!expeditionArmy.active)return;
  const angle=expeditionArmy.heading;
  const fx=Math.cos(angle),fy=Math.sin(angle);
  const rx=-fy,ry=fx;
  function transform(ox,oy){
    // ox = side-to-side offset, oy = distance BEHIND the lead vehicle.
    return {
      x:expeditionArmy.x+rx*ox-fx*oy,
      y:expeditionArmy.y+ry*ox-fy*oy
    };
  }

  expeditionArmy.vehicles.forEach(function(v,i){
    if(v.health<=0)return;
    const p=transform(v.ox,v.oy);
    const file=i===0?"transport_rover.png":"rover.png";
    drawRotated(file,p.x,p.y,GRID*(i===0?1.05:.78),GRID*(i===0?.72:.58),angle);
    drawHealthBar(p.x,p.y-28,40,5,v.health/v.maxHealth,"#79d173");
  });

  expeditionArmy.soldiers.forEach(function(s){
    if(s.health<=0)return;
    const p=transform(s.ox,s.oy);

    // Always use the armored Mars soldier PNG when available,
    // including while the convoy is idle after combat.
    if(images["mars_soldier.png"]){
      const idle=!expeditionArmy.targetCamp&&expeditionArmy.moveSpeed<4;
      const size=idle?GRID*.50:GRID*.44;
      drawImageCentered("mars_soldier.png",p.x,p.y-(idle?12:9),size,size);
      drawHealthBar(p.x,p.y-(idle?39:34),30,4,s.health/s.maxHealth,"#79d173");
    }else{
      ctx.save();
      ctx.translate(p.x,p.y);
      ctx.rotate(angle+Math.PI/2);
      ctx.fillStyle="#51614c";
      ctx.beginPath();ctx.arc(0,-7,5,0,Math.PI*2);ctx.fill();
      ctx.fillRect(-5,-2,10,14);
      ctx.fillStyle="#22282a";
      ctx.fillRect(3,1,14,3);
      ctx.fillStyle="#6f7e69";
      ctx.fillRect(-7,10,5,9);ctx.fillRect(2,10,5,9);
      ctx.restore();
      drawHealthBar(p.x,p.y-20,25,4,s.health/s.maxHealth,"#79d173");
    }
  });

  drawHealthBar(expeditionArmy.x,expeditionArmy.y-54,70,7,expeditionArmy.health/expeditionArmy.maxHealth,"#65c95f");
}
function spawnTracer(x1,y1,x2,y2,enemy){
  combatProjectiles.push({
    x:x1,y:y1,tx:x2,ty:y2,
    vx:(x2-x1)*5,vy:(y2-y1)*5,
    life:.20,maxLife:.20,enemy:!!enemy
  });
}
function spawnExplosion(x,y,size){
  combatExplosions.push({x:x,y:y,life:.55,maxLife:.55,size:size||28});
}
function updateCombatFx(dt){
  for(let i=combatProjectiles.length-1;i>=0;i--){
    const p=combatProjectiles[i];
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;
    if(p.life<=0)combatProjectiles.splice(i,1);
  }
  for(let i=combatExplosions.length-1;i>=0;i--){
    combatExplosions[i].life-=dt;
    if(combatExplosions[i].life<=0)combatExplosions.splice(i,1);
  }
}
function drawCombatFx(){
  ctx.save();
  combatProjectiles.forEach(function(p){
    ctx.strokeStyle=p.enemy?"#ff6b50":"#ffd86b";
    ctx.lineWidth=2.2;
    ctx.shadowBlur=8;
    ctx.shadowColor=ctx.strokeStyle;
    ctx.beginPath();
    ctx.moveTo(p.x,p.y);
    ctx.lineTo(p.x-p.vx*.025,p.y-p.vy*.025);
    ctx.stroke();
  });
  combatExplosions.forEach(function(e){
    const t=e.life/e.maxLife,r=e.size*(1.1-t*.25);
    ctx.globalAlpha=Math.max(0,t);
    ctx.fillStyle="#ff9b3e";
    ctx.beginPath();ctx.arc(e.x,e.y,r,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#ffd36a";
    ctx.beginPath();ctx.arc(e.x,e.y,r*.48,0,Math.PI*2);ctx.fill();
  });
  ctx.restore();
}
function nearestEnemyThreat(){
  let hit=null,best=Infinity;
  outsideEnemyCamps.forEach(function(c){
    if(!c.active)return;
    const p=campScreenPos(c);
    liveCampUnits(c).forEach(function(u){
      const ux=p.x+u.ox,uy=p.y+u.oy,d=Math.hypot(expedition.x-ux,expedition.y-uy);
      if(d<best){best=d;hit={camp:c,unit:u,x:ux,y:uy,d:d}}
    });
  });
  return hit;
}
function drawPlayerCombatHUD(){
  if(gameMode!=="outside")return;
  drawHealthBar(expedition.x,expedition.y-34,42,6,expedition.health/100,"#6ed36d");
}
function drawOutsideBasePreview(){
  // Show the player's colony as a distant miniature outpost in OUTSIDE mode.
  const b=baseGeometry();
  const scale=Math.max(.20,Math.min(.28,innerWidth/1900*.26));
  const targetX=innerWidth*.50;
  const targetY=innerHeight*.88;

  ctx.save();
  ctx.globalAlpha=.96;

  // Ground halo behind the base so it reads as a distant settlement.
  ctx.fillStyle="rgba(78,54,42,.40)";
  ctx.beginPath();
  ctx.ellipse(targetX,targetY+8,b.w*scale*.53,b.h*scale*.31,0,0,Math.PI*2);
  ctx.fill();

  // Reuse the actual current base layout, scaled down into the outside map.
  ctx.translate(targetX-b.cx*scale,targetY-b.cy*scale);
  ctx.scale(scale,scale);
  drawBaseInfrastructure();
  drawBuildings();
  ctx.restore();

  // Label and safe-zone ring.
  ctx.save();
  ctx.strokeStyle="rgba(116,223,112,.75)";
  ctx.lineWidth=2;
  ctx.setLineDash([7,6]);
  ctx.beginPath();
  ctx.ellipse(targetX,targetY+8,b.w*scale*.54,b.h*scale*.32,0,0,Math.PI*2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle="rgba(9,14,12,.86)";
  ctx.beginPath();
  ctx.roundRect(targetX-48,targetY-b.h*scale*.35-20,96,20,7);
  ctx.fill();
  ctx.fillStyle="#8ee887";
  ctx.font="bold 10px Arial";
  ctx.textAlign="center";
  ctx.textBaseline="middle";
  ctx.fillText("YOUR BASE",targetX,targetY-b.h*scale*.35-10);
  ctx.restore();
}

function drawOutsideFog(){
  if(fogCanvas.width!==innerWidth||fogCanvas.height!==innerHeight){
    fogCanvas.width=innerWidth;fogCanvas.height=innerHeight;
  }
  fogCtx.clearRect(0,0,innerWidth,innerHeight);
  fogCtx.fillStyle="rgba(9,7,8,.68)";
  fogCtx.fillRect(0,0,innerWidth,innerHeight);
  fogCtx.globalCompositeOperation="destination-out";

  function reveal(x,y,r){
    const grad=fogCtx.createRadialGradient(x,y,r*.25,x,y,r);
    grad.addColorStop(0,"rgba(0,0,0,1)");
    grad.addColorStop(.72,"rgba(0,0,0,.85)");
    grad.addColorStop(1,"rgba(0,0,0,0)");
    fogCtx.fillStyle=grad;
    fogCtx.beginPath();fogCtx.arc(x,y,r,0,Math.PI*2);fogCtx.fill();
  }

  reveal(innerWidth*.5,innerHeight*.88,220);
  reveal(expedition.x,expedition.y,165+researchState.exploration*25);
  reveal(expeditionArmy.x,expeditionArmy.y,190+researchState.exploration*25);

  // Cleared camps remain mapped.
  outsideEnemyCamps.forEach(function(c){
    if(!c.active){const p=campScreenPos(c);reveal(p.x,p.y,120)}
  });

  fogCtx.globalCompositeOperation="source-over";
  ctx.drawImage(fogCanvas,0,0);
}
function drawOutsideTerrain(){
  ctx.fillStyle="#7f3524";ctx.fillRect(0,0,innerWidth,innerHeight);
  const tile=images["terrain_2_3.png"]||images["terrain_1_3.png"];
  if(tile){for(let y=0;y<innerHeight;y+=GRID)for(let x=0;x<innerWidth;x+=GRID)ctx.drawImage(tile,x,y,GRID+1,GRID+1)}
  worldProps.slice(0,14).forEach(function(p,i){drawImageCentered(p.sprite,(p.x*1.3+i*37)%innerWidth,(p.y*1.1+i*23)%innerHeight,GRID*.5,GRID*.5)});
  drawOutsideBasePreview();
  outsideEnemyCamps.forEach(drawEnemyCamp);
  drawEnemyPatrols();
  outsideNodes.forEach(function(n){if(n.active)drawImageCentered(n.sprite,n.x*innerWidth,n.y*innerHeight,GRID*1.25,GRID*1.25)});
  drawImageCentered("colonist_1.png",expedition.x,expedition.y,GRID*.65,GRID*.65);drawPlayerCombatHUD();drawArmyConvoy();drawCombatFx();drawOutsideFog();
}
function updateOutside(dt){
  expedition.suitOxygen=Math.max(0,expedition.suitOxygen-dt*.75);
  if(expedition.suitOxygen<=0){statusEl.textContent="Suit oxygen depleted. Returning to base.";setMode("base");return}
  if(expedition.targetX!=null){
    const dx=expedition.targetX-expedition.x,dy=expedition.targetY-expedition.y,dist=Math.hypot(dx,dy),speedPx=120;
    if(dist<4){expedition.targetX=null;expedition.targetY=null}
    else{expedition.x+=dx/dist*speedPx*dt;expedition.y+=dy/dist*speedPx*dt}
  }
  if(expedition.harvestCooldown>0)expedition.harvestCooldown-=dt;
  if(expedition.attackCooldown>0)expedition.attackCooldown-=dt;
  updateArmy(dt);
  updateEnemyPatrols(dt);
  updateCombatFx(dt);
  const threat=nearestEnemyThreat();
  if(threat){
    const u=threat.unit;
    if(u.cooldown>0)u.cooldown-=dt;
    if(threat.d<165){
      statusEl.textContent="Under fire near "+threat.camp.name+". Tap the camp to attack.";
      if(u.cooldown<=0){
        const campPos=campScreenPos(threat.camp);
        const armyTargeted=Math.hypot(expeditionArmy.x-campPos.x,expeditionArmy.y-campPos.y)<180&&expeditionArmy.targetCamp===threat.camp;
        spawnTracer(threat.x,threat.y,armyTargeted?expeditionArmy.x:expedition.x,armyTargeted?expeditionArmy.y:expedition.y,true);
        const armyNear=armyTargeted;
        if(armyNear){
          const liveSoldiers=expeditionArmy.soldiers.filter(function(s){return s.health>0});
          const liveVehicles=expeditionArmy.vehicles.filter(function(v){return v.health>0});
          if(liveSoldiers.length){
            const s=liveSoldiers[Math.floor(Math.random()*liveSoldiers.length)];
            s.health=Math.max(0,s.health-9);
          }else if(liveVehicles.length){
            const v=liveVehicles[Math.floor(Math.random()*liveVehicles.length)];
            v.health=Math.max(0,v.health-8);
          }
          expeditionArmy.health=
            expeditionArmy.vehicles.reduce(function(n,v){return n+v.health},0)+
            expeditionArmy.soldiers.reduce(function(n,s){return n+s.health},0);

          if(expeditionArmy.health<=0){
            statusEl.textContent="Army convoy destroyed. Returning surviving forces.";
            expeditionArmy.health=expeditionArmy.maxHealth;
            expeditionArmy.vehicles.forEach(function(v){v.health=v.maxHealth});
            expeditionArmy.soldiers.forEach(function(s){s.health=s.maxHealth});
            expeditionArmy.x=innerWidth*.5;
            expeditionArmy.y=innerHeight*.9;
            expeditionArmy.targetCamp=null;
          }
        }else{
          expedition.health=Math.max(0,expedition.health-6);
          if(expedition.health<=0){
            statusEl.textContent="Expedition defeated. Emergency return to base.";
            expedition.health=100;
            expedition.cargo=0;
            setMode("base");
            return;
          }
        }
        u.cooldown=1.0+Math.random()*.5;
      }
    }
  }
  outsideNodes.forEach(function(n){
    if(!n.active||expedition.harvestCooldown>0)return;
    const nx=n.x*innerWidth,ny=n.y*innerHeight;
    if(Math.hypot(expedition.x-nx,expedition.y-ny)<58){
      const free=expedition.capacity-expedition.cargo;
      if(free<=0){statusEl.textContent="Cargo full. Return to base.";return}
      const take=Math.min(n.amount,free);expedition.cargo+=take;n.active=false;expedition.harvestCooldown=.5;
      statusEl.textContent="Collected "+take+" "+(n.type==="ice"?"ice":"ore")+".";
    }
  });
  updateExpeditionHUD();
}
const oldCanvasPointer=canvas.onpointerdown;
canvas.addEventListener("pointerdown",function(e){
  if(gameMode==="outside"){const camp=campAtPoint(e.clientX,e.clientY);if(camp){dispatchArmyToCamp(camp);return}expedition.targetX=e.clientX;expedition.targetY=e.clientY;return}
},true);

function loop(now){const dt=Math.min((now-lastTime)/1000,.05);lastTime=now;if(gameMode==="outside"){if(!paused)updateOutside(dt*speed);ctx.clearRect(0,0,innerWidth,innerHeight);drawOutsideTerrain();requestAnimationFrame(loop);return}if(!paused){updateUnits(dt*speed);updateConstruction(dt*speed);updateRaidScheduler(dt*speed);updateBaseRaid(dt*speed);updateCombatFx(dt*speed);simulationAccumulator+=dt*speed;while(simulationAccumulator>=1){productionTick();simulationAccumulator-=1}}ctx.clearRect(0,0,innerWidth,innerHeight);drawTerrain();drawBaseInfrastructure();drawProps();drawBuildings();drawResearchMarker();drawMilitaryDeploymentZone();drawBaseRaid();drawCombatFx();drawUnits();requestAnimationFrame(loop)}
window.addEventListener("resize",function(){resizeCanvas();syncBuildingsToPlots();if(gameMode==="layout")refreshLayoutOutput()});
resizeCanvas();if(!applySavedLayout(window.BASE_LAYOUT))seedBaseLayout();(function(){const b=baseGeometry();units[0].x=b.cx-80;units[0].y=b.cy+80;units[1].x=b.cx+170;units[1].y=b.cy+160;units[2].x=b.cx+120;units[2].y=b.cy-120;units[3].x=b.cx-170;units[3].y=b.cy+150})();loadGame();applyResearchBonuses();resetEnemyPatrols();refreshSectorMap();buildButtons();spriteCatalog();updateHUD();updateMissions();updateExpeditionHUD();
loadSprites().then(function(){statusEl.textContent="Tap a building to manage or upgrade it.";requestAnimationFrame(loop);setTimeout(function(){startTutorial(false)},250)});

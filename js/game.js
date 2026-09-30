const canvas=document.getElementById("game");
const ctx=canvas.getContext("2d");
const statusEl=document.getElementById("status");
const buildMenu=document.getElementById("buildMenu");
const GRID=96,ASSET="Assets/sprites/",BASE_ASSET="Assets/sprites/BaseBuilder/";
const spriteFiles=["barrel.png","colonist_1.png","colonist_2.png","colonist_3.png","colonist_4.png","colonist_5.png","crater_large.png","crater_small.png","drone_large.png","drone_small.png","dune_small.png","flag.png","habitat.png","habitat_small.png","ice_deposit.png","iron_ore.png","lamp_post.png","life_support_tower.png","miner.png","oxygen_plant.png","plant_rock_cluster.png","plants_cluster.png","radio_tower.png","rare_minerals.png","regolith.png","resource_crate.png","ridge_1.png","ridge_2.png","robot_worker.png","rock_small_1.png","rock_small_2.png","rock_spire.png","rocket_export.png","rocks_mid.png","rover.png","satellite_dish.png","solar_array_large.png","solar_panel.png","spire_cluster.png","storage.png","storage_large.png","supply_box.png","tank_station_1.png","tank_station_2.png","terminal.png","terrain_1_1.png","terrain_1_2.png","terrain_1_3.png","terrain_1_4.png","terrain_1_5.png","terrain_2_1.png","terrain_2_2.png","terrain_2_3.png","terrain_2_4.png","terrain_2_5.png","terrain_3_1.png","terrain_3_2.png","terrain_3_3.png","terrain_3_4.png","terrain_3_5.png","ui_build_button.png","ui_demolish_button.png","ui_fast_button.png","ui_health_bars.png","ui_menu_button.png","ui_pause_button.png","ui_resources_panel.png","ui_selection.png","ui_sell_button.png","ui_settings_button.png","ui_upgrade_button.png","water_extractor.png","wind_sensor.png","command_center.png","base_gate.png","greenhouse_1.png","greenhouse_2.png","planter_1.png","planter_2.png","refinery.png","rover_garage.png","road_tile_1.png","road_tile_2.png","wall_1.png","wall_2.png","wall_3.png","wall_4.png","ore_crate.png","transport_rover.png"];
const baseBuilderFiles=["command_center.png","habitat_dome_small.png","habitat_dome_large.png","water_processing_complex.png","solar_power_station.png","life_support_complex.png","greenhouse_complex.png","storage_warehouse.png","industrial_refinery.png","satellite_comms_center.png","rover_garage.png","landing_pad.png","base_gate.png","wall_tower.png","wall_straight.png","wall_corner.png","road_straight.png","road_corner.png","road_cross.png","build_pad.png","garden_planter.png","fountain_plaza.png","exploration_rover.png","astronaut.png","utility_drone.png","cargo_crates.png"];
const images={};let loadedCount=0;
function loadOne(key,url){return new Promise(function(resolve){const img=new Image();img.onload=function(){images[key]=img;loadedCount++;statusEl.textContent="Loading colony art…";resolve()};img.onerror=function(){resolve()};img.src=url})}
function loadSprites(){
  const jobs=spriteFiles.map(function(file){return loadOne(file,ASSET+file)});
  baseBuilderFiles.forEach(function(file){jobs.push(loadOne("BB/"+file,BASE_ASSET+file))});
  return Promise.all(jobs);
}

const colony={credits:1500,iron:80,water:80,oxygen:110,power:80,population:3,hqLevel:1};
let selectedBuilding="miner",selectedPlaced=null,paused=false,speed=1,activeTab="economy",simulationAccumulator=0,lastTime=performance.now();
let gameMode="base";
const expedition={x:innerWidth*0.5,y:innerHeight*0.5,targetX:null,targetY:null,cargo:0,capacity:40,suitOxygen:100,harvestCooldown:0};

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
  const b=baseGeometry(),u=Math.min(b.w/12,b.h/8);
  return [
    {id:"hq",x:b.cx,y:b.cy+.05*u,fixed:"command",scale:1.45},
    {id:"habitat",x:b.cx-3.8*u,y:b.cy-.9*u,fixed:"habitat",scale:1.05},
    {id:"greenhouse",x:b.cx-4.0*u,y:b.cy-2.6*u,fixed:"greenhouse",scale:.95},
    {id:"solar",x:b.cx+3.7*u,y:b.cy-2.45*u,fixed:"solar",scale:1.0},
    {id:"oxygen",x:b.cx+3.95*u,y:b.cy-.65*u,fixed:"oxygen",scale:.92},
    {id:"water",x:b.cx+3.75*u,y:b.cy+1.2*u,fixed:"water",scale:.92},
    {id:"storage",x:b.cx-3.85*u,y:b.cy+1.7*u,fixed:"storage",scale:.9},
    {id:"garage",x:b.cx+2.0*u,y:b.cy+2.25*u,fixed:"roverGarage",scale:1.0},
    {id:"plotA",x:b.cx-1.9*u,y:b.cy-2.2*u,scale:.9},
    {id:"plotB",x:b.cx+1.75*u,y:b.cy-2.15*u,scale:.9},
    {id:"plotC",x:b.cx-1.9*u,y:b.cy+2.25*u,scale:.9},
    {id:"plotD",x:b.cx+4.4*u,y:b.cy+2.55*u,scale:.82},
    {id:"plotE",x:b.cx-4.5*u,y:b.cy+3.0*u,scale:.82}
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
function canUpgrade(b){const c=upgradeCost(b);return colony.credits>=c.credits&&colony.iron>=c.iron&&b.level<10}

function filteredKeys(){return Object.entries(buildingData).filter(function(entry){return entry[1].category===activeTab&&entry[1].placeable!==false}).map(function(entry){return entry[0]})}
function buildButtons(){buildMenu.innerHTML="";filteredKeys().forEach(function(key){const data=buildingData[key],locked=colony.hqLevel<data.unlock,button=document.createElement("button");button.className="build-card"+(key===selectedBuilding?" selected":"")+(locked?" locked":"");const primary=data.baseSprite?BASE_ASSET+data.baseSprite:ASSET+data.sprite;button.innerHTML='<img src="'+primary+'" onerror="this.onerror=null;this.src=\''+ASSET+data.sprite+'\'" alt=""><span>'+data.name+"<br>$"+data.cost+"</span>"+(locked?'<div class="level-lock">HQ '+data.unlock+"</div>":"");button.onclick=function(){if(locked){statusEl.textContent="Upgrade Command Hub to Lv."+data.unlock+" first.";return}selectedBuilding=key;selectedPlaced=null;refreshBuildSelection();hideSelectedPanel();statusEl.textContent="Place "+data.name+" on an empty tile."};buildMenu.appendChild(button)})}
function refreshBuildSelection(){const keys=filteredKeys();Array.from(buildMenu.children).forEach(function(b,i){b.classList.toggle("selected",keys[i]===selectedBuilding)})}
document.querySelectorAll(".tab").forEach(function(tab){tab.onclick=function(){document.querySelectorAll(".tab").forEach(function(t){t.classList.remove("active")});tab.classList.add("active");activeTab=tab.dataset.tab;buildButtons()}});

function buildingSprite(data){
  if(data&&data.baseSprite&&images["BB/"+data.baseSprite])return "BB/"+data.baseSprite;
  return data?data.sprite:null;
}
function baseArt(name,fallback){
  return images["BB/"+name]?"BB/"+name:fallback;
}
function spriteCatalog(){const grid=document.getElementById("catalogGrid");grid.innerHTML="";spriteFiles.forEach(function(file){const item=document.createElement("div");item.className="catalog-item";item.innerHTML='<img src="'+ASSET+file+'" alt=""><div>'+file+"</div>";grid.appendChild(item)})}
function drawImageCentered(file,cx,cy,maxW,maxH){const img=images[file];if(!img)return;const s=Math.min(maxW/img.width,maxH/img.height),w=img.width*s,h=img.height*s;ctx.drawImage(img,cx-w/2,cy-h/2,w,h)}
function drawTerrain(){
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
function drawBaseInfrastructure(){
  const b=baseGeometry(),u=Math.min(b.w/12,b.h/8);
  ctx.save();

  // Mars outside + hard colony footprint.
  ctx.fillStyle="rgba(171,158,136,.98)";
  ctx.strokeStyle="#55524c";ctx.lineWidth=4;
  ctx.beginPath();ctx.roundRect(b.left+u*.2,b.top+u*.15,b.w-u*.4,b.h-u*.28,22);ctx.fill();ctx.stroke();

  // Internal landscaped districts.
  ctx.fillStyle="rgba(84,112,61,.55)";
  [
    [b.cx-5*u,b.cy-3.25*u,2.8*u,1.55*u],
    [b.cx+2.25*u,b.cy-3.2*u,2.8*u,1.5*u],
    [b.cx-5*u,b.cy+.85*u,2.65*u,2.0*u],
    [b.cx+2.35*u,b.cy+.85*u,2.75*u,2.0*u]
  ].forEach(function(r){ctx.beginPath();ctx.roundRect(r[0],r[1],r[2],r[3],22);ctx.fill()});

  // Roads: use generated road sprites if present; otherwise clean vector roads.
  const roadStraight=baseArt("road_straight.png",null),roadCross=baseArt("road_cross.png",null);
  if(roadStraight&&images[roadStraight]){
    for(let x=b.cx-4.8*u;x<=b.cx+4.8*u;x+=u*.92)drawImageCentered(roadStraight,x,b.cy,u*1.12,u*.65);
    for(let y=b.cy-3.0*u;y<=b.cy+3.0*u;y+=u*.92){
      ctx.save();ctx.translate(b.cx,y);ctx.rotate(Math.PI/2);
      const im=images[roadStraight],s=Math.min((u*1.12)/im.width,(u*.65)/im.height),ww=im.width*s,hh=im.height*s;
      ctx.drawImage(im,-ww/2,-hh/2,ww,hh);ctx.restore();
    }
    if(roadCross&&images[roadCross])drawImageCentered(roadCross,b.cx,b.cy,u*1.25,u*1.25);
  }else{
    ctx.strokeStyle="#5d5b57";ctx.lineCap="round";ctx.lineWidth=u*.58;
    ctx.beginPath();ctx.moveTo(b.left+u*.8,b.cy);ctx.lineTo(b.right-u*.8,b.cy);ctx.stroke();
    ctx.beginPath();ctx.moveTo(b.cx,b.top+u*.55);ctx.lineTo(b.cx,b.bottom-u*.65);ctx.stroke();
    ctx.strokeStyle="#ddd6c9";ctx.lineWidth=2.5;ctx.setLineDash([13,11]);
    ctx.beginPath();ctx.moveTo(b.left+u*.8,b.cy);ctx.lineTo(b.right-u*.8,b.cy);ctx.stroke();
    ctx.beginPath();ctx.moveTo(b.cx,b.top+u*.55);ctx.lineTo(b.cx,b.bottom-u*.65);ctx.stroke();ctx.setLineDash([]);
  }

  // Central civic plaza / fountain under HQ.
  const fountain=baseArt("fountain_plaza.png",null);
  if(fountain&&images[fountain])drawImageCentered(fountain,b.cx,b.cy+u*.72,u*1.15,u*.78);
  else{ctx.fillStyle="#d7d0c2";ctx.strokeStyle="#716c63";ctx.lineWidth=3;ctx.beginPath();ctx.arc(b.cx,b.cy,u*1.06,0,Math.PI*2);ctx.fill();ctx.stroke()}

  // Perimeter uses new coherent wall kit.
  const wall=baseArt("wall_straight.png","wall_2.png"),corner=baseArt("wall_corner.png","wall_4.png"),gate=baseArt("base_gate.png","base_gate.png");
  const top=b.top+u*.08,bottom=b.bottom-u*.12,left=b.left+u*.12,right=b.right-u*.12;
  for(let x=left+u*.55;x<right-u*.4;x+=u*.98)drawImageCentered(wall,x,top,u, u*.55);
  for(let x=left+u*.55;x<right-u*.4;x+=u*.98){if(Math.abs(x-b.cx)>u*1.35)drawImageCentered(wall,x,bottom,u,u*.55)}
  for(let y=top+u*.8;y<bottom-u*.5;y+=u*.88){
    ctx.save();ctx.translate(left,y);ctx.rotate(Math.PI/2);const im=images[wall];if(im){const s=Math.min(u/im.width,(u*.55)/im.height);ctx.drawImage(im,-im.width*s/2,-im.height*s/2,im.width*s,im.height*s)}ctx.restore();
    ctx.save();ctx.translate(right,y);ctx.rotate(Math.PI/2);const im2=images[wall];if(im2){const s2=Math.min(u/im2.width,(u*.55)/im2.height);ctx.drawImage(im2,-im2.width*s2/2,-im2.height*s2/2,im2.width*s2,im2.height*s2)}ctx.restore();
  }
  drawImageCentered(gate,b.cx,bottom+u*.15,u*2.1,u*1.05);

  // Empty plots use the dedicated build-pad sprite.
  getBuildPlots().forEach(function(p){
    if(p.id==="hq"||buildings.some(function(bb){return bb.plotId===p.id}))return;
    const pad=baseArt("build_pad.png",null);
    if(pad&&images[pad])drawImageCentered(pad,p.x,p.y,u*.95,u*.72);
    else{ctx.fillStyle="rgba(223,216,202,.9)";ctx.strokeStyle="#777168";ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(p.x-u*.44,p.y-u*.33,u*.88,u*.66,12);ctx.fill();ctx.stroke()}
    ctx.fillStyle="rgba(50,49,45,.78)";ctx.font="bold 9px Arial";ctx.textAlign="center";ctx.fillText("BUILD",p.x,p.y+4);
  });
  ctx.restore();
}
function drawProps(){
  const b=baseGeometry(),u=Math.min(b.w/12,b.h/8);
  const planter=baseArt("garden_planter.png","planter_1.png"),crates=baseArt("cargo_crates.png","resource_crate.png");
  [
    [-1.25,-.9],[1.25,-.9],[-1.25,.95],[1.25,.95],[-.55,-2.8],[.55,-2.8]
  ].forEach(function(p){drawImageCentered(planter,b.cx+p[0]*u,b.cy+p[1]*u,u*.55,u*.55)});
  drawImageCentered(crates,b.cx-4.75*u,b.cy+2.65*u,u*.68,u*.55);
  drawImageCentered(crates,b.cx+4.55*u,b.cy+2.5*u,u*.68,u*.55);
}
function drawBuildings(){
  const plots=getBuildPlots();
  buildings.slice().sort(function(a,b){return a.y-b.y}).forEach(function(b){
    const index=buildings.indexOf(b),d=buildingData[b.type],plot=plots.find(function(p){return p.id===b.plotId});
    const scale=(plot&&plot.scale?plot.scale:1)*(1+Math.min((b.level-1)*.022,.15));
    const file=buildingSprite(d),u=Math.min(baseGeometry().w/12,baseGeometry().h/8);
    const size=u*1.75*d.size*scale;
    drawImageCentered(file,b.x+GRID/2,b.y+GRID/2,size,size);
    ctx.save();ctx.font="bold 10px Arial";ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillStyle=index===selectedPlaced?"#74ec69":"rgba(15,18,22,.88)";
    ctx.beginPath();ctx.roundRect(b.x+GRID/2+u*.28,b.y+GRID/2-u*.58,31,18,7);ctx.fill();
    ctx.fillStyle=index===selectedPlaced?"#132112":"#ffd174";ctx.fillText("Lv."+b.level,b.x+GRID/2+u*.28+15.5,b.y+GRID/2-u*.58+9);
    if(index===selectedPlaced){ctx.strokeStyle="#7cff5e";ctx.lineWidth=3;ctx.beginPath();ctx.arc(b.x+GRID/2,b.y+GRID/2,u*.62,0,Math.PI*2);ctx.stroke()}
    ctx.restore();
  });
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
    selectedPlaced=hit;showSelectedPanel();
    statusEl.textContent=buildingData[buildings[hit].type].name+" selected.";
    return;
  }
  const p=nearestFreePlot(x,y);
  if(!p){statusEl.textContent="Tap an empty build pad inside the colony.";return}
  const d=buildingData[selectedBuilding];
  if(!d)return;
  if(colony.hqLevel<d.unlock){statusEl.textContent="Requires Command Hub Lv."+d.unlock+".";return}
  if(colony.credits<d.cost){statusEl.textContent="Not enough credits.";return}
  colony.credits-=d.cost;
  buildings.push({type:selectedBuilding,plotId:p.id,x:p.x-GRID/2,y:p.y-GRID/2,level:1});
  selectedPlaced=buildings.length-1;
  showSelectedPanel();updateHUD();updateMissions();
  statusEl.textContent=d.name+" constructed.";
}
canvas.addEventListener("pointerdown",function(e){if(gameMode==="base")placeOrSelect(e.clientX,e.clientY)});

function showSelectedPanel(){const panel=document.getElementById("selectedPanel"),b=buildings[selectedPlaced];if(!b){panel.classList.add("hidden");return}const d=buildingData[b.type],c=upgradeCost(b),m=multiplier(b);panel.classList.remove("hidden");document.getElementById("selectedSprite").src=(d.baseSprite&&images["BB/"+d.baseSprite])?BASE_ASSET+d.baseSprite:ASSET+d.sprite;document.getElementById("selectedName").textContent=d.name;document.getElementById("selectedLevel").textContent=b.level;document.getElementById("selectedProgressText").textContent=b.level+"/10";document.getElementById("selectedProgressBar").style.width=(b.level/10*100)+"%";document.getElementById("statProduction").textContent=d.baseProd+" x"+m.toFixed(2);document.getElementById("statPower").textContent=(d.basePower>=0?"+":"")+Math.round(d.basePower*m)+"/s";document.getElementById("statCapacity").textContent=Math.round(d.capacity*m)||"—";document.getElementById("statScore").textContent=buildingScore(b);document.getElementById("upgradeCostText").textContent=b.level>=10?"MAX LEVEL":"$"+c.credits+" + "+c.iron+" iron";const req=document.getElementById("upgradeRequirements");req.innerHTML=b.level>=10?'<span class="req-ok">Maximum building level reached.</span>':'<div class="'+(colony.credits>=c.credits?"req-ok":"req-bad")+'">Credits: '+Math.floor(colony.credits)+" / "+c.credits+'</div><div class="'+(colony.iron>=c.iron?"req-ok":"req-bad")+'">Iron: '+Math.floor(colony.iron)+" / "+c.iron+'</div><div class="req-ok">Command Hub: Lv.'+colony.hqLevel+"</div>";document.getElementById("upgradeBtn").disabled=!canUpgrade(b)}
function hideSelectedPanel(){document.getElementById("selectedPanel").classList.add("hidden")}
document.getElementById("closeSelected").onclick=function(){selectedPlaced=null;hideSelectedPanel()};
document.getElementById("upgradeBtn").onclick=function(){const b=buildings[selectedPlaced];if(!b)return;const c=upgradeCost(b);if(!canUpgrade(b)){showSelectedPanel();return}colony.credits-=c.credits;colony.iron-=c.iron;b.level++;if(b.type==="habitat"&&b.level%2===0)colony.population++;if(b.type==="command"){colony.hqLevel=Math.min(3,b.level)}updateHUD();buildButtons();updateMissions();showSelectedPanel();statusEl.textContent=buildingData[b.type].name+" upgraded to Lv."+b.level+"."};

function productionTick(){if(paused)return;buildings.forEach(function(b){const m=multiplier(b);switch(b.type){case"miner":if(colony.power>=m){colony.iron+=2*m;colony.power-=m}break;case"solar":colony.power+=4*m;break;case"solarLarge":colony.power+=10*m;break;case"oxygen":case"lifeSupport":if(colony.power>=2*m){colony.oxygen+=3*m;colony.power-=2*m}break;case"water":case"tanksB":if(colony.power>=2*m){colony.water+=2*m;colony.power-=2*m}break;case"greenhouse":if(colony.power>=2*m){colony.oxygen+=.8*m;colony.power-=2*m}break;case"refinery":if(colony.power>=4*m){colony.credits+=1.25*m;colony.power-=4*m}break;case"roverGarage":colony.power=Math.max(0,colony.power-.25*m);break;case"export":if(colony.iron>=20){colony.iron-=20;colony.credits+=85*m}break}});colony.oxygen=Math.max(0,colony.oxygen-.12*colony.population);colony.water=Math.max(0,colony.water-.07*colony.population);colony.power=Math.max(0,colony.power);updateHUD();if(selectedPlaced!=null)showSelectedPanel();updateMissions()}
function updateHUD(){document.getElementById("credits").textContent=Math.floor(colony.credits);document.getElementById("iron").textContent=Math.floor(colony.iron);document.getElementById("water").textContent=Math.floor(colony.water);document.getElementById("oxygen").textContent=Math.floor(colony.oxygen);document.getElementById("power").textContent=Math.floor(colony.power);document.getElementById("population").textContent=colony.population;document.getElementById("hqLabel").textContent="Command Hub Lv."+colony.hqLevel;document.getElementById("colonyPowerScore").textContent=colonyScore().toLocaleString()}

const missions=[{label:"Build 5 structures",value:function(){return buildings.length},target:5},{label:"Upgrade a building to Lv.3",value:function(){return Math.max.apply(null,buildings.map(function(b){return b.level}))},target:3},{label:"Reach 150 iron",value:function(){return Math.floor(colony.iron)},target:150},{label:"Command Hub Lv.2",value:function(){return colony.hqLevel},target:2}];
function updateMissions(){const list=document.getElementById("missionList");list.innerHTML="";missions.forEach(function(m){const v=Math.min(m.value(),m.target),done=v>=m.target,el=document.createElement("div");el.className="mission"+(done?" done":"");el.innerHTML='<div class="mission-line"><span>'+(done?"✓ ":"")+m.label+"</span><b>"+v+"/"+m.target+'</b></div><div class="mission-progress"><div style="width:'+(v/m.target*100)+'%"></div></div>';list.appendChild(el)})}

document.getElementById("sellBtn").onclick=function(){if(colony.iron>=10){colony.iron-=10;colony.credits+=40;statusEl.textContent="Sold 10 iron for $40.";updateHUD()}else statusEl.textContent="You need at least 10 iron."};
document.getElementById("demolishBtn").onclick=function(){if(selectedPlaced==null||!buildings[selectedPlaced]){statusEl.textContent="Select a building first.";return}if(buildings[selectedPlaced].type==="command"){statusEl.textContent="The Command Center cannot be demolished.";return}const removed=buildings.splice(selectedPlaced,1)[0];colony.credits+=Math.floor(buildingData[removed.type].cost*.35);selectedPlaced=null;hideSelectedPanel();updateHUD();updateMissions();statusEl.textContent="Building demolished. 35% salvage returned."};
document.getElementById("pauseBtn").onclick=function(){paused=!paused;statusEl.textContent=paused?"Simulation paused.":"Simulation resumed."};
document.getElementById("speedBtn").onclick=function(){speed=speed===1?2:1;statusEl.textContent="Simulation speed: "+speed+"x"};
document.getElementById("menuBtn").onclick=function(){document.getElementById("catalog").classList.remove("hidden")};
document.getElementById("closeCatalog").onclick=function(){document.getElementById("catalog").classList.add("hidden")};

function setMode(mode){
  gameMode=mode;
  document.body.classList.toggle("outside-mode",mode==="outside");
  document.getElementById("baseModeBtn").classList.toggle("active",mode==="base");
  document.getElementById("outsideModeBtn").classList.toggle("active",mode==="outside");
  document.getElementById("expeditionPanel").classList.toggle("hidden",mode!=="outside");
  if(mode==="outside"){
    selectedPlaced=null;hideSelectedPanel();
    expedition.x=innerWidth*.5;expedition.y=innerHeight*.58;expedition.targetX=null;expedition.targetY=null;
    statusEl.textContent="Tap the terrain to move. Approach ore deposits to collect them.";
  }else{
    depositCargo();
    statusEl.textContent="Back at the colony base.";
  }
  updateExpeditionHUD();
}
document.getElementById("baseModeBtn").onclick=function(){setMode("base")};
document.getElementById("outsideModeBtn").onclick=function(){setMode("outside")};
document.getElementById("returnBaseBtn").onclick=function(){setMode("base")};

const outsideNodes=[
  {type:"iron",sprite:"iron_ore.png",x:.18,y:.28,amount:22,active:true},
  {type:"iron",sprite:"iron_ore.png",x:.78,y:.68,amount:26,active:true},
  {type:"ice",sprite:"ice_deposit.png",x:.72,y:.24,amount:18,active:true},
  {type:"regolith",sprite:"regolith.png",x:.28,y:.72,amount:16,active:true},
  {type:"rare",sprite:"rare_minerals.png",x:.52,y:.20,amount:10,active:true}
];
function resetOutsideNodes(){outsideNodes.forEach(function(n){n.active=true})}
function updateExpeditionHUD(){
  document.getElementById("cargoText").textContent=Math.floor(expedition.cargo)+" / "+expedition.capacity;
  document.getElementById("cargoBar").style.width=Math.min(100,expedition.cargo/expedition.capacity*100)+"%";
  document.getElementById("suitOxygenText").textContent=Math.max(0,Math.floor(expedition.suitOxygen))+"%";
  document.getElementById("suitOxygenBar").style.width=Math.max(0,expedition.suitOxygen)+"%";
}
function depositCargo(){
  if(expedition.cargo>0){colony.iron+=expedition.cargo;statusEl.textContent="Returned with "+Math.floor(expedition.cargo)+" ore.";expedition.cargo=0}
  expedition.suitOxygen=100;resetOutsideNodes();updateHUD();updateExpeditionHUD();
}
function drawOutsideTerrain(){
  ctx.fillStyle="#7f3524";ctx.fillRect(0,0,innerWidth,innerHeight);
  const tile=images["terrain_2_3.png"]||images["terrain_1_3.png"];
  if(tile){for(let y=0;y<innerHeight;y+=GRID)for(let x=0;x<innerWidth;x+=GRID)ctx.drawImage(tile,x,y,GRID+1,GRID+1)}
  worldProps.slice(0,14).forEach(function(p,i){drawImageCentered(p.sprite,(p.x*1.3+i*37)%innerWidth,(p.y*1.1+i*23)%innerHeight,GRID*.5,GRID*.5)});
  outsideNodes.forEach(function(n){if(n.active)drawImageCentered(n.sprite,n.x*innerWidth,n.y*innerHeight,GRID*1.25,GRID*1.25)});
  drawImageCentered("colonist_1.png",expedition.x,expedition.y,GRID*.65,GRID*.65);drawImageCentered("transport_rover.png",innerWidth*.5,innerHeight*.9,GRID*1.2,GRID*.8);
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
  if(gameMode==="outside"){expedition.targetX=e.clientX;expedition.targetY=e.clientY;return}
},true);

function loop(now){const dt=Math.min((now-lastTime)/1000,.05);lastTime=now;if(gameMode==="outside"){if(!paused)updateOutside(dt*speed);ctx.clearRect(0,0,innerWidth,innerHeight);drawOutsideTerrain();requestAnimationFrame(loop);return}if(!paused){updateUnits(dt*speed);simulationAccumulator+=dt*speed;while(simulationAccumulator>=1){productionTick();simulationAccumulator-=1}}ctx.clearRect(0,0,innerWidth,innerHeight);drawTerrain();drawBaseInfrastructure();drawProps();drawBuildings();drawUnits();requestAnimationFrame(loop)}
window.addEventListener("resize",function(){resizeCanvas();syncBuildingsToPlots()});
resizeCanvas();seedBaseLayout();(function(){const b=baseGeometry();units[0].x=b.cx-80;units[0].y=b.cy+80;units[1].x=b.cx+170;units[1].y=b.cy+160;units[2].x=b.cx+120;units[2].y=b.cy-120;units[3].x=b.cx-170;units[3].y=b.cy+150})();buildButtons();spriteCatalog();updateHUD();updateMissions();updateExpeditionHUD();
loadSprites().then(function(){statusEl.textContent="Tap a building to manage or upgrade it.";requestAnimationFrame(loop)});

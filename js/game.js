const canvas=document.getElementById("game");
const ctx=canvas.getContext("2d");
const statusEl=document.getElementById("status");
const buildMenu=document.getElementById("buildMenu");
const GRID=96,ASSET="Assets/sprites/",BASE_ASSET="Assets/sprites/BaseBuilder/",ROAD_ASSET=BASE_ASSET+"Roads/",WALL_ASSET=BASE_ASSET+"Walls/",PLAZA_ASSET=BASE_ASSET+"Plazas/",DECOR_ASSET=BASE_ASSET+"Decor/";
const spriteFiles=["barrel.png","colonist_1.png","colonist_2.png","colonist_3.png","colonist_4.png","colonist_5.png","crater_large.png","crater_small.png","drone_large.png","drone_small.png","dune_small.png","flag.png","habitat.png","habitat_small.png","ice_deposit.png","iron_ore.png","lamp_post.png","life_support_tower.png","miner.png","oxygen_plant.png","plant_rock_cluster.png","plants_cluster.png","radio_tower.png","rare_minerals.png","regolith.png","resource_crate.png","ridge_1.png","ridge_2.png","robot_worker.png","rock_small_1.png","rock_small_2.png","rock_spire.png","rocket_export.png","rocks_mid.png","rover.png","satellite_dish.png","solar_array_large.png","solar_panel.png","spire_cluster.png","storage.png","storage_large.png","supply_box.png","tank_station_1.png","tank_station_2.png","terminal.png","terrain_1_1.png","terrain_1_2.png","terrain_1_3.png","terrain_1_4.png","terrain_1_5.png","terrain_2_1.png","terrain_2_2.png","terrain_2_3.png","terrain_2_4.png","terrain_2_5.png","terrain_3_1.png","terrain_3_2.png","terrain_3_3.png","terrain_3_4.png","terrain_3_5.png","ui_build_button.png","ui_demolish_button.png","ui_fast_button.png","ui_health_bars.png","ui_menu_button.png","ui_pause_button.png","ui_resources_panel.png","ui_selection.png","ui_sell_button.png","ui_settings_button.png","ui_upgrade_button.png","water_extractor.png","wind_sensor.png","command_center.png","base_gate.png","greenhouse_1.png","greenhouse_2.png","planter_1.png","planter_2.png","refinery.png","rover_garage.png","road_tile_1.png","road_tile_2.png","wall_1.png","wall_2.png","wall_3.png","wall_4.png","ore_crate.png","transport_rover.png"];
const baseBuilderFiles=["command_center.png","habitat_dome_small.png","habitat_dome_large.png","water_processing_complex.png","solar_power_station.png","life_support_complex.png","greenhouse_complex.png","storage_warehouse.png","industrial_refinery.png","satellite_comms_center.png","rover_garage.png","landing_pad.png","base_gate.png","wall_tower.png","wall_straight.png","wall_corner.png","road_straight.png","road_corner.png","road_cross.png","build_pad.png","garden_planter.png","fountain_plaza.png","exploration_rover.png","astronaut.png","utility_drone.png","cargo_crates.png"];
const puzzleFiles={
  "P/Roads/road_straight.png":ROAD_ASSET+"road_straight.png",
  "P/Roads/road_corner.png":ROAD_ASSET+"road_corner.png",
  "P/Roads/road_t.png":ROAD_ASSET+"road_t.png",
  "P/Roads/road_cross.png":ROAD_ASSET+"road_cross.png",
  "P/Roads/road_end.png":ROAD_ASSET+"road_end.png",
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
  const b=baseGeometry(),u=Math.min(b.w/11.5,b.h/7.6);
  return [
    {id:"hq",x:b.cx,y:b.cy,fixed:"command",scale:1.6},
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

  ctx.fillStyle="#aaa08e";
  ctx.strokeStyle="#504b43";
  ctx.lineWidth=4;
  ctx.beginPath();
  ctx.roundRect(b.left+u*.15,b.top+u*.12,b.w-u*.30,b.h-u*.22,22);
  ctx.fill();ctx.stroke();

  // landscaped city blocks
  ctx.fillStyle="rgba(77,112,62,.62)";
  [
    [-4.5,-2.8,2.8,1.35],[1.75,-2.8,2.85,1.35],
    [-4.5,.55,2.75,1.8],[1.85,.55,2.85,1.9]
  ].forEach(function(r){
    ctx.beginPath();
    ctx.roundRect(b.cx+r[0]*u,b.cy+r[1]*u,r[2]*u,r[3]*u,18);
    ctx.fill();
  });

  const rs=baseArt("road_straight.png",null);
  const rc=baseArt("road_cross.png",null);
  const corner=baseArt("road_corner.png",null);
  const roadW=u*1.8, roadH=u*1.0, step=u*1.18;

  if(rs&&images[rs]){
    // main horizontal road
    for(let i=-4;i<=4;i++) drawImageCentered(rs,b.cx+i*step,b.cy,roadW,roadH);

    // main vertical road
    for(let i=-2;i<=2;i++) drawRotated(rs,b.cx,b.cy+i*step,roadW,roadH,Math.PI/2);

    // upper loop
    for(let i=-3;i<=3;i++) drawImageCentered(rs,b.cx+i*step,b.cy-2.15*u,roadW*.95,roadH*.95);
    // lower loop
    for(let i=-3;i<=3;i++) drawImageCentered(rs,b.cx+i*step,b.cy+2.05*u,roadW*.95,roadH*.95);

    // left and right connectors
    for(let i=-1;i<=1;i++){
      drawRotated(rs,b.cx-3.55*u,b.cy+i*step,roadW*.95,roadH*.95,Math.PI/2);
      drawRotated(rs,b.cx+3.55*u,b.cy+i*step,roadW*.95,roadH*.95,Math.PI/2);
    }

    if(rc&&images[rc]) drawImageCentered(rc,b.cx,b.cy,u*1.9,u*1.9);

    if(corner&&images[corner]){
      const cs=u*1.4;
      drawImageCentered(corner,b.cx-3.55*u,b.cy-2.15*u,cs,cs);
      drawRotated(corner,b.cx+3.55*u,b.cy-2.15*u,cs,cs,Math.PI/2);
      drawRotated(corner,b.cx-3.55*u,b.cy+2.05*u,cs,cs,-Math.PI/2);
      drawRotated(corner,b.cx+3.55*u,b.cy+2.05*u,cs,cs,Math.PI);
    }
  }

  // central civic plaza
  const plaza=images["P/Plazas/plaza.png"]?"P/Plazas/plaza.png":baseArt("fountain_plaza.png",null);
  if(plaza&&images[plaza]) drawImageCentered(plaza,b.cx,b.cy,u*3.25,u*2.45);

  // south entrance road to gate
  if(rs&&images[rs]){
    drawRotated(rs,b.cx,b.cy+3.0*u,roadW,roadH,Math.PI/2);
    drawRotated(rs,b.cx,b.cy+3.9*u,roadW,roadH,Math.PI/2);
  }

  // coherent perimeter (automatic only until the player creates a custom fort)
  if(fortPieces.length===0){
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

  // build pads snap directly beside roads
  getBuildPlots().forEach(function(p){
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
    const file=buildingSprite(d),u=Math.min(baseGeometry().w/12,baseGeometry().h/8);
    const size=u*1.95*d.size*scale;
    drawImageCentered(file,b.x+GRID/2,b.y+GRID/2,size,size);
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
  const b=baseGeometry();
  units.forEach(function(u){
    u.x+=u.vx*dt;u.y+=u.vy*dt;
    if(u.x<b.left+70||u.x>b.right-70)u.vx*=-1;
    if(u.y<b.top+70||u.y>b.bottom-95)u.vy*=-1;
  });
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
    selectedPlaced=hit;showSelectedPanel();
    statusEl.textContent=buildingData[buildings[hit].type].name+" selected.";
    return;
  }
  const d=buildingData[selectedBuilding];
  if(gameMode==="layout"){
    const bg=baseGeometry();
    if(x<bg.left+55||x>bg.right-55||y<bg.top+55||y>bg.bottom-70){statusEl.textContent="Place buildings inside the base walls.";return}
    buildings.push({type:selectedBuilding,plotId:null,x:x-GRID/2,y:y-GRID/2,level:1});
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
  buildings.push({type:selectedBuilding,plotId:p.id,x:p.x-GRID/2,y:p.y-GRID/2,level:1});
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

function fortSprite(type){
  if(type==="wall")return images["P/Walls/wall_straight.png"]?"P/Walls/wall_straight.png":baseArt("wall_straight.png","wall_2.png");
  if(type==="corner")return images["P/Walls/wall_corner.png"]?"P/Walls/wall_corner.png":baseArt("wall_corner.png","wall_4.png");
  if(type==="tower")return images["P/Walls/wall_tower.png"]?"P/Walls/wall_tower.png":baseArt("wall_tower.png",null);
  if(type==="gate")return images["P/Walls/gate.png"]?"P/Walls/gate.png":baseArt("base_gate.png","base_gate.png");
  return null;
}
function fortSize(type){
  const u=Math.min(baseGeometry().w/11.5,baseGeometry().h/7.6);
  if(type==="tower")return {w:u*1.0,h:u*1.5};
  if(type==="gate")return {w:u*2.2,h:u*1.25};
  if(type==="corner")return {w:u*1.15,h:u*1.15};
  return {w:u*1.2,h:u*.7};
}
function snapFortPoint(x,y){
  const b=baseGeometry(),step=24;
  return {x:Math.max(b.left-20,Math.min(b.right+20,Math.round(x/step)*step)),y:Math.max(b.top-20,Math.min(b.bottom+20,Math.round(y/step)*step))};
}
function drawCustomFort(){
  fortPieces.forEach(function(p){
    const file=fortSprite(p.type),s=fortSize(p.type);
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
  fortPieces.push({type:fortTool,x:p.x,y:p.y,rotation:fortRotation});
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

function exportLayoutData(){
  const b=baseGeometry();
  const data={
    version:1,
    canvas:{width:Math.round(innerWidth),height:Math.round(innerHeight)},
    base:{left:Math.round(b.left),top:Math.round(b.top),width:Math.round(b.w),height:Math.round(b.h)},
    fort:fortPieces.map(function(p){return {type:p.type,x:Math.round(p.x),y:Math.round(p.y),nx:+((p.x-b.left)/b.w).toFixed(4),ny:+((p.y-b.top)/b.h).toFixed(4),rotation:p.rotation};}),
    buildings:buildings.map(function(x){
      const cx=x.x+GRID/2,cy=x.y+GRID/2;
      return {
        type:x.type,
        level:x.level,
        plotId:x.plotId||null,
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
    expedition.x=innerWidth*.5;expedition.y=innerHeight*.58;expedition.targetX=null;expedition.targetY=null;
    statusEl.textContent="Tap the terrain to move. Approach ore deposits to collect them.";
  }else if(mode==="base"){
    paused=false;
    depositCargo();
    statusEl.textContent="Back at the colony base.";
  }
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
window.addEventListener("resize",function(){resizeCanvas();syncBuildingsToPlots();if(gameMode==="layout")refreshLayoutOutput()});
resizeCanvas();seedBaseLayout();(function(){const b=baseGeometry();units[0].x=b.cx-80;units[0].y=b.cy+80;units[1].x=b.cx+170;units[1].y=b.cy+160;units[2].x=b.cx+120;units[2].y=b.cy-120;units[3].x=b.cx-170;units[3].y=b.cy+150})();buildButtons();spriteCatalog();updateHUD();updateMissions();updateExpeditionHUD();
loadSprites().then(function(){statusEl.textContent="Tap a building to manage or upgrade it.";requestAnimationFrame(loop)});

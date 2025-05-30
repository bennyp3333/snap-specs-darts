//@input SceneObject root
//@input SceneObject dartContainer
//@input SceneObject[] dartSpawnPoints
//@input Asset.ObjectPrefab dartPrefab
//@ui {"widget":"separator"}
//@input Component.ScriptComponent smoothFollow
//@ui {"widget":"separator"}
//@input bool debug
//@input string debugName = "HolsterController" {"showIf":"debug"}
//@input Component.Text debugText {"showIf":"debug"}

var self = script.getSceneObject();
var selfTransform = self.getTransform();

const SPAWN_OFFSET = new vec3(0, 7, 0);
const DISTANCE_OFFSET = 15;

var dartsInHolster = [];
var dartCounter = 0;

global.darts = Array(global.maxPlayers);

var playerColors = [
    new vec4(0.502, 0.710, 1.000, 1.000),
    new vec4(1.000, 0.792, 0.502, 1.000),
    new vec4(1.000, 0.502, 0.957, 1.000),
    new vec4(0.502, 1.000, 0.541, 1.000),
    new vec4(1.000, 0.502, 0.502, 1.000),
]

function init(){
    script.root.enabled = false;
    for(var i = 0; i < global.darts.length; i++){
        global.darts[i] = [];
    }
    if(global.deviceInfoSystem.isEditor()){
        script.smoothFollow.posSmoothing = 10;
        script.smoothFollow.rotSmoothing = 10;
        script.smoothFollow.attachTo.getTransform().setLocalPosition(new vec3(0, -20, -45));
    }
    debugPrint("Initilized!");
}

script.show = function(bool){
    script.root.enabled = bool;
}

script.spawnDarts = function(playerIdx){
    debugPrint("Spawning new Darts");
    for(var i = 0; i < script.dartSpawnPoints.length; i++){
        spawnAtIndex(i, playerIdx);
    }
}

script.destroyPlayerDarts = function(playerIdx){
    debugPrint("Destroying player " + playerIdx + "'s darts");
    while(global.darts[playerIdx].length > 0){
        var dartToDestroy = global.darts[playerIdx].pop();
        if(!isNull(dartToDestroy)){
            dartToDestroy.getComponents("Component.ScriptComponent")[3].safeDestroy();
        }
    }
}

script.destroyAllDarts = function(){
    debugPrint("Destroying all darts");
    for(var i = 0; i < global.darts.length; i++){
        script.destroyPlayerDarts(i);
    }
}

function spawnAtIndex(idx, playerIdx){
    debugPrint("Spawning Dart at index " + idx + " for player " + playerIdx);
    var dartSpawnPoint = script.dartSpawnPoints[idx];
    var spawnPosition = dartSpawnPoint.getTransform().getWorldPosition().add(SPAWN_OFFSET);
    var newDart = script.dartPrefab.instantiate(script.dartContainer);
    newDart.getTransform().setWorldPosition(spawnPosition);
    var newDartScript = newDart.getComponents("Component.ScriptComponent")[3];
    newDartScript.dartIdx = dartCounter++;
    var color = playerColors[playerIdx];
    if(global.gameMode == global.GameModes.Practice){
        newDartScript.setSelfDestroy(true);
        color = global.utils.randomColorHue(1, 0.5);
    }
    newDartScript.setColor(color);
    dartsInHolster[idx] = newDart;
    global.darts[playerIdx].push(newDart);
}

function onUpdate(){
    for(var i = 0; i < dartsInHolster.length; i++){
        var dartSpawnPoint = script.dartSpawnPoints[i];
        var dart = dartsInHolster[i];
        
        if(!isNull(dart)){
            var spawnPosition = dartSpawnPoint.getTransform().getWorldPosition();
            var dartPosition = dart.getTransform().getWorldPosition();
            
            if(dartPosition.distance(spawnPosition) > DISTANCE_OFFSET){
                dartsInHolster[i] = null;
                debugPrint("Dart " + i + " picked up");
                global.events.trigger("dartPickedUp");
            }
        }else{
            dartsInHolster[i] = null;
        }
    }
}

script.createEvent("OnStartEvent").bind(init);
script.createEvent("UpdateEvent").bind(onUpdate);

// Debug
function debugPrint(text){
    if(script.debug){
        var newLog = script.debugName + ": " + text;
        if(global.textLogger){ global.logToScreen(newLog); }
        if(script.debugText){ script.debugText.text = newLog; }
        print(newLog);
    }
}

function errorPrint(text){
    var errorLog = "!!ERROR!! " + script.debugName + ": " + text;
    if(global.textLogger){ global.logError(errorLog); }
    if(script.debugText){ script.debugText.text = errorLog; }
    print(errorLog);
}
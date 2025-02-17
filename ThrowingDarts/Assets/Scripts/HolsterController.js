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

global.darts = [];

function init(){
    script.root.enabled = false;
    if(global.deviceInfoSystem.isEditor()){
        script.smoothFollow.posSmoothing = 10;
        script.smoothFollow.rotSmoothing = 10;
        script.smoothFollow.attachTo.getTransform().setLocalPosition(new vec3(0, -20, -45));
    }
    //script.spawnDarts();
    debugPrint("Initilized!");
}

script.show = function(bool){
    script.root.enabled = bool;
}

script.spawnDarts = function(){
    for(var i = 0; i < script.dartSpawnPoints.length; i++){
        spawnAtIndex(i);
    }
}

function spawnAtIndex(idx){
    var dartSpawnPoint = script.dartSpawnPoints[idx];
    var spawnPosition = dartSpawnPoint.getTransform().getWorldPosition().add(SPAWN_OFFSET);
    var newDart = script.dartPrefab.instantiate(script.dartContainer);
    newDart.getTransform().setWorldPosition(spawnPosition);
    var newDartScript = newDart.getComponents("Component.ScriptComponent")[2];
    newDartScript.dartIdx = dartCounter++;
    var randomColor = global.utils.randomColorHue(1, 0.5);
    newDartScript.setColor(randomColor);
    dartsInHolster[idx] = newDart;
    global.darts.push(newDart);
}

function onUpdate(){
    for(var i = 0; i < dartsInHolster.length; i++){
        var dartSpawnPoint = script.dartSpawnPoints[i];
        var dart = dartsInHolster[i];
        
        var spawnPosition = dartSpawnPoint.getTransform().getWorldPosition();
        var dartPosition = dart.getTransform().getWorldPosition();
        
        if(dartPosition.distance(spawnPosition) > DISTANCE_OFFSET){
            spawnAtIndex(i);
        }
    }
    //debugPrint("Updated!");
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
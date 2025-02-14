//@input SceneObject root
//@input SceneObject[] dartSpawnPoints
//@input Asset.ObjectPrefab dartPrefab
//@ui {"widget":"separator"}
//@input bool debug
//@input string debugName = "HolsterController" {"showIf":"debug"}
//@input Component.Text debugText {"showIf":"debug"}

var self = script.getSceneObject();
var selfTransform = self.getTransform();

function init(){
    script.root.enabled = false;
    debugPrint("Initilized!");
}

script.show = function(bool){
    script.root.enabled = bool;
}

script.spawnDarts = function(){
    for(var i = 0; i < script.dartSpawnPoints.length; i++){
        var dartSpawnPoint = script.dartSpawnPoints[i];
    }
}

function onUpdate(){

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
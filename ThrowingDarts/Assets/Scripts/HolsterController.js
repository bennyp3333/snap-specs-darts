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

var spawnOffset = new vec3(0, 7, 0);

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
        var dartSpawnPoint = script.dartSpawnPoints[i];
        var spawnPosition = dartSpawnPoint.getTransform().getWorldPosition().add(spawnOffset);
        var newDart = script.dartPrefab.instantiate(script.dartContainer);
        newDart.getTransform().setWorldPosition(spawnPosition);
        //newDart.setParentPreserveWorldTransform(null);
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
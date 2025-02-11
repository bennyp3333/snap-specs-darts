//@input SceneObject root
//@input SceneObject
//@ui {"widget":"separator"}
//@input bool debug
//@input string debugName = "MenuController" {"showIf":"debug"}
//@input Component.Text debugText {"showIf":"debug"}

var self = script.getSceneObject();
var selfTransform = self.getTransform();

var playersCount = 2;
var gameMode = "highScore"

function init(){

    debugPrint("Initilized!");
}

script.fade = function(inOut, time = 0.5){
    
}

script.pressStartButton = function(){
    //fire event [menu completed]
}

script.pressButtonUp = function(){
    //increment players count
    //set players count text
}

script.pressButtonDown = function(){
    //decrement players count
    //set players count text
}

script.setGameMode = function(toggle){
    //set game mode string
    //
}

script.createEvent("OnStartEvent").bind(init);

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
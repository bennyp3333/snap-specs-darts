//@input Component.ScriptComponent menuController
//@input Component.ScriptComponent wallDetector
//@input Component.ScriptComponent boardController
//@input Component.ScriptComponent holsterController
//@input SceneObject board
//@ui {"widget":"separator"}
//@input bool debug
//@input string debugName = "GameController" {"showIf":"debug"}
//@input Component.Text debugText {"showIf":"debug"}

var self = script.getSceneObject();
var selfTransform = self.getTransform();

var boardTransform = script.board.getTransform();

const enumValue = (name) => Object.freeze({toString: () => name});

global.GameModes = Object.freeze({
    HighScore: enumValue("GameModes.HighScore"),
    AroundTheClock: enumValue("GameModes.AroundTheClock")
});

global.playersCount = null;
global.gameMode = null;

var boardPlaced = false;

function init(){
    var openMenuDelay = script.createEvent("DelayedCallbackEvent");
    openMenuDelay.bind(() => {
        global.events.trigger("openMenu");
    })
    openMenuDelay.reset(0.1);
    
    global.events.add("menuClosed", onMenuClosed);
    
    debugPrint("Initilized!");
}

function onMenuClosed(gameParams){
    global.playersCount = gameParams.playersCount;
    global.gameMode = gameParams.gameMode;
    if(!boardPlaced){
        runPlacement();
    }else{
        startGame();
    }
}

function runPlacement(){
    debugPrint("Starting placement");
    script.wallDetector.startWallCalibration(onPlaced);
}

function onPlaced(position, rotation) {
    boardTransform.setWorldPosition(position);
    boardTransform.setWorldRotation(rotation);
    boardPlaced = true;
    script.boardController.show(true);
    debugPrint("Board placed");
    //TODO: move this?
    startGame();
}

function startGame(){
    //show holster
    script.holsterController.show(true);
    //queue darts
    script.holsterController.spawnDarts();
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
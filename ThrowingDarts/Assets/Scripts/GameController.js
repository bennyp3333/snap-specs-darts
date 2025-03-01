//@input Component.ScriptComponent menuController
//@input Component.ScriptComponent wallDetector
//@input Component.ScriptComponent boardController
//@input Component.ScriptComponent promptController
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
    AroundTheClock: enumValue("GameModes.AroundTheClock"),
    Practice: enumValue("GameModes.Practice"),
});

var started = false;

global.roundsCount = 4;
global.playersCount = null;
global.gameMode = null;

currentRound = 0;
currentPlayer = 0;
currentDart = 0;

playersSeenInstructions = 0;

var boardPlaced = false;

function init(){
    var openMenuDelay = script.createEvent("DelayedCallbackEvent");
    openMenuDelay.bind(() => {
        global.events.trigger("openMenu");
    })
    openMenuDelay.reset(0.1);
    
    global.events.add("menuClosed", onMenuClosed);
    global.events.add("dartHit", onDartHit);
    
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
    
    script.boardController.setPanel(global.gameMode, global.playersCount);
    script.boardController.show(true);
    
    debugPrint("Board placed");
    
    //TODO: move this to control resetting on start
    startGame(true);
}

function startGame(reset){
    started = true;
    
    if(reset){
        currentRound = 0;
        currentPlayer = 0;
        currentDart = 0;
        playersSeenInstructions = 0;
        
        script.boardController.resetScore();
        script.boardController.resetRound();
        script.boardController.setPlayer(currentPlayer);
    }
    
    script.holsterController.show(true);
    showInstructions();
    onNextPlayer();
}

function onDartHit(dartScript){
    debugPrint("Dart Hit!");
    currentDart += 1;
    
    debugPrint("Adding to score");
    script.boardController.addScore(dartScript, currentPlayer);
    
    if(currentDart > 2){
        if(global.gameMode == global.GameModes.Practice){
            onNextPlayer();
        }else{
            nextPlayerDelay.reset(1);
        }
    }
}

var nextPlayerDelay = script.createEvent("DelayedCallbackEvent");
nextPlayerDelay.bind(nextPlayer);

function nextPlayer(){
    currentPlayer += 1;
    debugPrint("Queueing next player: " + currentPlayer);
    
    if(currentPlayer >= global.playersCount){
        currentPlayer = 0;
        currentRound += 1;
        if(currentRound >= roundsCount){
            started = false;
        }
    }
    
    if(started){
        script.boardController.setRound(currentRound);
        script.promptController.setPlayerNumber(currentPlayer);
        if(global.playersCount < 2){
            onNextPlayer();
            return;
        }
        script.promptController.showPrompt("next1", null, 3, false, true);
        script.promptController.showPrompt("next3", () => {
            onNextPlayer();
        }, -1, false, true);
        showInstructions();
    }
}

function onNextPlayer(){
    debugPrint("Starting player " + currentPlayer + " turn");
    if(global.gameMode != global.GameModes.Practice){
        script.holsterController.destroyDarts();
    }
    script.boardController.setPlayer(currentPlayer);
    script.holsterController.spawnDarts(currentPlayer);
    currentDart = 0;
}

function showInstructions(){
    if(playersSeenInstructions < global.playersCount){
        debugPrint("Showing instructions");
        playersSeenInstructions += 1;
        if(global.gameMode == global.GameModes.HighScore){
            script.promptController.showPrompt("hisc1", null, 8, false, true);
            script.promptController.showPrompt("hisc2", null, 8, false, true);
        }else if(global.gameMode == global.GameModes.AroundTheClock){
            script.promptController.showPrompt("atcl", null, 8, false, true);
        }else{
            script.promptController.showPrompt("pract", null, 8, false, true);
        }
    }
}

function checkForWin(){
    //if high score
    //chacek after all rounds
    //get player with most points
    //show prompt
    //if aroundtheclock
    //check after each throw
    //check if any players are at 21
    //show prompt
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
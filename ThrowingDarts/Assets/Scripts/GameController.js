//@input Component.ScriptComponent menuController
//@input Component.ScriptComponent wallDetector
//@input Component.ScriptComponent boardController
//@input Component.ScriptComponent dartboardController
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
        script.menuController.openMenu(0);
    })
    openMenuDelay.reset(0.1);
    
    global.events.add("menuClosed", onMenuClosed);
    global.events.add("dartHit", onDartHit);
    
    global.events.add("menuButton", onMenuButton);
    global.events.add("rePlaceButton", onRePlaceButton);
    
    debugPrint("Initilized!");
}

script.show = function(bool){
    script.holsterController.show(bool);
    script.boardController.show(bool);
    script.promptController.show(bool);
}

function onMenuButton(){
    debugPrint("Opening Menu");
    script.show(false);
    script.menuController.openMenu(1);
}

function onRePlaceButton(){
    debugPrint("Queueing placement flow");
    runPlacement(() => {
        startGame(false);
    });
}

function onMenuClosed(gameParams){
    global.playersCount = gameParams.playersCount;
    global.gameMode = gameParams.gameMode;
    
    if(!boardPlaced){
        runPlacement(() => {
            startGame(gameParams.reset);
        });
    }else{
        startGame(gameParams.reset);
    }
}

function runPlacement(callback){
    debugPrint("Starting placement");
    script.show(false);
    script.wallDetector.startWallCalibration((pos, rot) => {
        boardTransform.setWorldPosition(pos);
        boardTransform.setWorldRotation(rot);
        boardPlaced = true;
        script.boardController.show(true);
        debugPrint("Board placed");
        if(callback){ callback(); }
    });
}

function startGame(reset){
    debugPrint("Starting Game");
    started = true;
    
    if(reset){
        debugPrint("Resetting Game");
        currentRound = 0;
        currentPlayer = 0;
        currentDart = 0;
        playersSeenInstructions = 0;
        
        script.promptController.skipPrompt();
        
        if(global.gameMode == global.GameModes.AroundTheClock){
            script.dartboardController.setNumbers(1);
        }else{
            script.dartboardController.setNumbers(0);
        }
        
        script.holsterController.destroyDarts();
        
        script.boardController.setPanel(global.gameMode, global.playersCount);
        script.boardController.resetScore();
        script.boardController.resetRound();
        script.boardController.setPlayer(currentPlayer);
    }
    
    script.show(true);
    
    if(reset){
        showInstructions();
        onNextPlayer();
    }
}

function onDartHit(dartScript){
    debugPrint("Dart Hit!");
    currentDart += 1;
    
    debugPrint("Adding to score");
    script.boardController.addScore(dartScript, currentPlayer);
    
    if(global.gameMode == global.GameModes.AroundTheClock){
        checkWinATC();
    }
    
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
        if(currentRound >= roundsCount && global.gameMode == global.GameModes.HighScore){
            debugPrint("Rounds Finished!");
            started = false;
            checkWinHighScore();
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
        var nextPrompt = script.promptController.showPrompt("next3", () => {
            onNextPlayer();
        }, -1, false, true);
        //nextPrompt.withParticles = true;
        showInstructions();
    }
}

function onNextPlayer(){
    debugPrint("Starting player " + currentPlayer + " turn");
    if(global.gameMode != global.GameModes.Practice){
        script.holsterController.destroyDarts();
        script.boardController.hideHitResults();
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

function checkWinHighScore(){
    var winner = global.utils.indexOfMax(global.playerScores);
    var winnerScore = global.playerScores[winner];
    
    debugPrint("Winner! Player " + winner + " with score: " + winnerScore);
    
    script.promptController.setPlayerNumber(winner);
    script.promptController.setNumber(winnerScore);
    
    script.promptController.showPrompt("win2", () => {
        debugPrint("Returning to Menu");
        script.show(false);
        script.menuController.openMenu(0);
    }, -1, false, true);
}

function checkWinATC(){
    var winner = -1
    for(var i = 0; i < global.playerScores.length; i++){
        if(global.playerScores[i] >= 21){
            winner = i;
        }
    }
    if(winner >= 0){
        debugPrint("Winner! Player " + winner);
        started = false;
        script.promptController.setPlayerNumber(winner);
        script.promptController.setNumber(currentRound);
        var winPrompt = script.promptController.showPrompt("win3", () => {
            debugPrint("Returning to Menu");
            script.show(false);
            script.menuController.openMenu(0);
        }, -1, false, true);
        winPrompt.withParticles = true;
    }
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
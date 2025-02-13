//@input Component.ScriptComponent smoothFollow
//@input Component.ScriptComponent billboard
//@input SceneObject root
//@input SceneObject panel
//@input Component.Text3D playersCountText
//@ui {"widget":"separator"}
//@input bool debug
//@input string debugName = "MenuController" {"showIf":"debug"}
//@input Component.Text debugText {"showIf":"debug"}

var self = script.getSceneObject();
var selfTransform = self.getTransform();

var playersCount = 2;
var gameMode = global.GameModes.HighScore;

var maxPlayers = 5;
var minPlayers = 1;

var playersBeginCopy = "Players: ";

var fadeTime = 0.5;

var tweens = [];

function init(){
    global.utils.recursiveAlpha(script.root, 0, true);
    script.root.enabled = false;
    global.events.add("openMenu", openMenu);
    debugPrint("Initilized!");
}

//TODO: switch to fading in panel sperate so no need for same root
//or put panel under root
function fade(inOut, callback){
    stopTweens();
    var startVal = script.panel.getComponent("Component.RenderMeshVisual").mainPass.baseColor.a;
    var endVal = inOut ? 1 : 0;
    tweens.push(global.simpleTween(startVal, endVal, fadeTime, 0, (val) => {
        global.utils.recursiveAlpha(script.root, val, true);
    }, () => {
        if(callback){ callback(); }
    }));
}

function openMenu(){
    debugPrint("Menu Opening");
    script.smoothFollow.start(true);
    script.billboard.start();
    script.root.enabled = true;
    fade(true, null);
}

function closeMenu(callback){
    debugPrint("Menu Closing");
    fade(false, () => {
        script.root.enabled = false;
        script.smoothFollow.stop();
        script.billboard.stop();
        if(callback){ callback(); }
    });
}

script.pressStartButton = function(){
    debugPrint("Start button pressed");
    closeMenu(() => {
        global.events.trigger("menuClosed", {
            playersCount: playersCount,
            gameMode: gameMode
        });
    });
}

script.pressButtonUp = function(){
    debugPrint("Up button pressed");
    playersCount = Math.min(maxPlayers, playersCount + 1);
    script.playersCountText.text = playersBeginCopy + playersCount;
    debugPrint("Incrementing playerCount to: " + playersCount);
}

script.pressButtonDown = function(){
    debugPrint("Down button pressed");
    playersCount = Math.max(minPlayers, playersCount - 1);
    script.playersCountText.text = playersBeginCopy + playersCount;
    debugPrint("Decrementing playerCount to: " + playersCount);
}

script.setGameMode = function(toggle){
    debugPrint("Game mode toggle pressed");
    if(toggle){
        gameMode = global.GameModes.AroundTheClock;
    }else{
        gameMode = global.GameModes.HighScore;
    }
    debugPrint("Set game mode to: " + gameMode);
}

function stopTweens(){
    debugPrint("Stopping Tweens");
    while(tweens.length > 0){
        tweens.pop().enabled = false;
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
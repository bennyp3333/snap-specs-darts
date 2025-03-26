//@input Component.ScriptComponent smoothFollow
//@input SceneObject root
//@input SceneObject panel
//@ui {"widget":"separator"}
//@input Component.Text3D playersCountText
//@ui {"widget":"separator"}
//@input SceneObject players3DText
//@input SceneObject upButton
//@input SceneObject downButton
//@ui {"widget":"separator"}
//@input SceneObject startButton
//@input SceneObject restartButton
//@input SceneObject continueButton
//@ui {"widget":"separator"}
//@input SceneObject secondPanel
//@input SceneObject[] subtitles
//@ui {"widget":"separator"}
//@input bool debug
//@input string debugName = "MenuController" {"showIf":"debug"}
//@input Component.Text debugText {"showIf":"debug"}

var self = script.getSceneObject();
var selfTransform = self.getTransform();

var playersCount = 2;
var gameMode = global.GameModes.HighScore;

global.maxPlayers = 4;
global.minPlayers = 1;

var playersBeginCopy = "Players: ";

var fadeTime = 0.5;

var tweens = [];

var subtitleIdx = 3;
var firstSubtitleSet = true;

function init(){
    global.utils.recursiveAlpha(script.root, 0, true);
    script.root.enabled = false;
    //subtitleIdx = 0;
    introSubtitle.reset(8);
    debugPrint("Initilized!");
}

var introSubtitle = script.createEvent("DelayedCallbackEvent");
introSubtitle.bind(function(eventData){
    if(subtitleIdx == 3){
        setSubtitle(0);
    }
});

function fade(inOut, callback){
    stopTweens();
    var startVal = global.utils.getAlphaObject(script.root.getChild(0));
    var endVal = inOut ? 1 : 0;
    tweens.push(global.simpleTween(startVal, endVal, fadeTime, 0, (val) => {
        global.utils.recursiveAlpha(script.root, val, true);
    }, () => {
        if(callback){ callback(); }
    }));
}

script.openMenu = function(mode){
    debugPrint("Menu Opening");
    setStartUI(mode);
    script.smoothFollow.start(true);
    script.root.enabled = true;
    fade(true, null);
}

function closeMenu(callback){
    debugPrint("Menu Closing");
    fade(false, () => {
        debugPrint("Menu Closed");
        script.root.enabled = false;
        script.smoothFollow.stop();
        if(callback){ callback(); }
    });
}

function reportMenuClosed(doesReset){
    closeMenu(() => {
        global.events.trigger("menuClosed", {
            playersCount: playersCount,
            gameMode: gameMode,
            reset: doesReset
        });
    });
}

script.pressStartButton = function(){
    debugPrint("Start button pressed");
    reportMenuClosed(true);
}

script.pressRestartButton = function(){
    debugPrint("Restart button pressed");
    reportMenuClosed(true);
}

script.pressContinueButton = function(){
    debugPrint("Continue button pressed");
    reportMenuClosed(false);
}

script.pressButtonUp = function(){
    debugPrint("Up button pressed");
    setSubtitle();
    playersCount = Math.min(global.maxPlayers, playersCount + 1);
    updatePlayerCountUI()
    debugPrint("Incrementing playerCount to: " + playersCount);
}

script.pressButtonDown = function(){
    debugPrint("Down button pressed");
    setSubtitle();
    playersCount = Math.max(global.minPlayers, playersCount - 1);
    updatePlayerCountUI()
    debugPrint("Decrementing playerCount to: " + playersCount);
}

function setSubtitle(idx){
    if(firstSubtitleSet){
        firstSubtitleSet = false;
        return;
    }

    if(idx != null){ subtitleIdx = idx; }
    for(var i = 0; i < script.subtitles.length; i++){
        if(i == subtitleIdx){
            script.subtitles[i].enabled = true;
        }else{
            script.subtitles[i].enabled = false;
        }
    }
}

function updatePlayerCountUI(){
    script.playersCountText.text = playersBeginCopy + playersCount;
}

script.setGameMode = function(mode){
    debugPrint("Game mode button pressed");
    switch(mode){
        case 0:
            gameMode = global.GameModes.HighScore;
            playersCount = 2;
            break;
        case 1:
            gameMode = global.GameModes.AroundTheClock;
            break;
        case 2:
            gameMode = global.GameModes.Practice;
            playersCount = 1;
            break;
    }
    setSubtitle(mode);
    updatePlayerCountUI()
    debugPrint("Set game mode to: " + gameMode);
    setMenuUI(gameMode);
}

function setMenuUI(mode){
    if(mode == global.GameModes.Practice){
        script.players3DText.enabled = false;
        script.upButton.enabled = false;
        script.downButton.enabled = false;
        script.panel.getComponent("Component.ScriptComponent").setSize(new vec2(4, 0.85), 0);
        script.panel.getTransform().setLocalPosition(new vec3(0, 0, 0));
        script.startButton.getTransform().setLocalPosition(new vec3(0, -5, 0));
        script.restartButton.getTransform().setLocalPosition(new vec3(-15, -5, 0));
        script.continueButton.getTransform().setLocalPosition(new vec3(15, -5, 0));
        script.secondPanel.getTransform().setLocalPosition(new vec3(0, -26, 0));
    }else{
        script.players3DText.enabled = true;
        script.upButton.enabled = true;
        script.downButton.enabled = true;
        script.panel.getComponent("Component.ScriptComponent").setSize(new vec2(4, 1.5), 0);
        script.panel.getTransform().setLocalPosition(new vec3(0, -5, 0));
        script.startButton.getTransform().setLocalPosition(new vec3(0, -15, 0));
        script.restartButton.getTransform().setLocalPosition(new vec3(-15, -15, 0));
        script.continueButton.getTransform().setLocalPosition(new vec3(15, -15, 0));
        script.secondPanel.getTransform().setLocalPosition(new vec3(0, -36, 0));
    }
}

function setStartUI(mode){
    if(mode){
        script.startButton.enabled = false;
        script.restartButton.enabled = true;
        script.continueButton.enabled = true; 
    }else{
        script.startButton.enabled = true;
        script.restartButton.enabled = false;
        script.continueButton.enabled = false; 
    }
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
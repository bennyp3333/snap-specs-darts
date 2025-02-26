//@input SceneObject panel
//@input SceneObject[] promptRoots
//@input SceneObject[] promptButtons
//@ui {"widget":"separator"}
//@input bool debug
//@input string debugName = "PromptController" {"showIf":"debug"}
//@input Component.Text debugText {"showIf":"debug"}

var self = script.getSceneObject();
var selfTransform = self.getTransform();

const FADE_TIME = 0.5;

var promptQueue = [];
var currentPrompt = null;

var panelScript = script.panel.getComponent("Component.ScriptComponent");
var panelTweens = [];

function prompt(promptName){
    this.name = promptName;
    this.object = null;
    this.button = null;
    this.panelSize = new vec2(1, 1);
    this.callback = null;
    this.timeOut = 0;
    this.override = false;
    this.canBeOverridden = true;
    
    this.started = false;
    this.stopped = false;
    this.canceled = false;
    this.completed = false;
    
    this.tweens = [];
    
    this.show = function(bool, withPanel, callback){
        if(withPanel){
            panelScript.setSize(this.panelSize, 0);
            fadePanel(bool);
        }else{
            panelScript.setSize(this.panelSize, FADE_TIME);
        }
        if(bool){ this.object.enabled = true; }
        this.tweens.push(fade(this.object, bool, () => {
            if(!bool){ this.object.enabled = false; }
            if(callback){ callback(); }
        }));
    }
}

var promptTypes = {
    hisc1: 0,
    hisc2: 1,
    atcl: 2,
    pract: 4,
    next1: 5,
    next2: 6,
    win1: 7,
    win2: 8,
}

var panelSizes = [
    new vec2(4.25, 3),
    new vec2(4.25, 3),
    new vec2(4.25, 3),
    new vec2(4, 1.75),
    new vec2(3, 1),
    new vec2(3, 1.25),
    new vec2(2.5, 1),
    new vec2(2.5, 1.25),
]

function init(){
    for(var i = 0; i < script.promptRoots.length; i++){
        global.utils.applyToDescendants(script.promptRoots[i], (obj) => {
            global.utils.makeMatUniqueObject(obj);
        });
        global.utils.recursiveAlpha(script.promptRoots[i], 0, false)
        script.promptRoots[i].enabled = false;
    }
    
    global.utils.setAlphaObject(script.panel, 0);
    script.panel.enabled = false;
    
    debugPrint("Initilized!");
    
    script.showPrompt("hisc1", () => {
        print("weiner!");
    }, 5);
}

script.showPrompt = function(promptName, callback, timeout, override, canBeOverridden){
    debugPrint("Queuing prompt: " + promptName);
    
    var newPrompt = new prompt(promptName);
    newPrompt.object = script.promptRoots[promptTypes[promptName]];
    newPrompt.panelSize = panelSizes[promptTypes[promptName]];
    newPrompt.callback = callback;
    newPrompt.timeout = timeout;
    newPrompt.override = override;
    newPrompt.canBeOverridden = canBeOverridden;
    promptQueue.push(newPrompt);
    
    checkQueue();
}

function checkQueue(){
    if(currentPrompt){
        if(promptQueue[0].override){
            currentPrompt.hide(false, false, null);
            
        }
    }else{
        currentPrompt = promptQueue.shift();
        currentPrompt.show(true, true, null);
    }
}

function fadePanel(inOut){
    stopPanelTweens();
    if(inOut){ script.panel.enabled = true; }
    panelTweens.push(fade(script.panel, inOut, () => {
        if(!inOut){ script.panel.enabled = false; }
    }));
}

function stopPanelTweens(){
    debugPrint("Stopping Panel Tweens")
    while(panelTweens.length > 0){
        panelTweens.pop().enabled = false;
    }
}

function fade(objRoot, inOut, callback){
    debugPrint("Fading " + objRoot.name + " " + (inOut ? "In" : "Out"));
    
    var startVal = global.utils.getAlphaObject(objRoot);
    if(startVal == null){
        startVal = global.utils.getAlphaObject(objRoot.getChild(0));
    }
    var endVal = inOut ? 1 : 0;
    
    return global.simpleTween(startVal, endVal, FADE_TIME, 0, (val) => {
        global.utils.recursiveAlpha(objRoot, val, true);
    }, () => {
        if(callback){ callback(); }
    });
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
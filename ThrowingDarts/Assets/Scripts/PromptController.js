//@input SceneObject panel
//@input SceneObject[] promptRoots
//@input SceneObject[] promptButtons
//@ui {"widget":"separator"}
//@input Component.Text3D[] playerTexts
//@ui {"widget":"separator"}
//@input bool debug
//@input string debugName = "PromptController" {"showIf":"debug"}
//@input Component.Text debugText {"showIf":"debug"}

/*
USAGE
script.showPrompt("hisc1", () => {
    print("callback 1");
}, 5, false, true);
*/

var self = script.getSceneObject();
var selfTransform = self.getTransform();

const FADE_TIME = 0.5;

var promptQueue = [];
var currentPrompt = null;

var panelScript = script.panel.getComponent("Component.ScriptComponent");
var panelTweens = [];

var counter = 0;

var playerTextCopy = [
["Pass the Spectacles\nto Player ", "."],
["Player ", ""],
["Player ", " Wins!"],
["Player ", " Wins!"],
]

function prompt(promptName, object){
    this.name = promptName;
    this.object = null;
    this.button = null;
    this.panelSize = new vec2(1, 1);
    this.callback = null;
    this.timeout = 0;
    this.hasNext = false;
    this.override = false;
    this.canBeOverridden = true;
    
    this.started = false;
    this.stopped = false;
    this.completed = false;
    
    this.tweens = [];
    
    this.show = function(withPanel, callback){
        this.fade(true, withPanel, callback);
    }
    
    this.hide = function(withPanel, callback){
        this.fade(false, withPanel, callback);
    }
    
    this.fade = function(inOut, withPanel, callback){
        debugPrint("" + (inOut ? "Showing" : "Hiding") + " prompt " + this.name);
        while(this.tweens.length > 0){
            this.tweens.pop().enabled = false;
        }
        
        if(withPanel){
            panelScript.setSize(this.panelSize, 0);
            fadePanel(inOut);
        }else{
            panelScript.setSize(this.panelSize, FADE_TIME);
        }
        
        if(inOut){
            this.started = true;
            this.object.enabled = true;
        }else{
            this.timer.enabled = false;
            this.timer.reset(0); 
            this.stopped = true;
        }
        
        this.tweens.push(fade(this.object, inOut, () => {
            if(callback){ callback(); }
            
            if(inOut){
                if(this.timeout > 0){
                    this.timer.enabled = true;
                    this.timer.reset(this.timeout);
                }
            }else{
                this.completed = true;
                this.object.enabled = false;
            }
        }));
    }
    
    this.timer = script.createEvent("DelayedCallbackEvent");
    this.timer.enabled = false;
    this.timer.bind((eventData) => {
        debugPrint("Prompt " + this.name + " Timer done");
        this.stop();
    });
    
    this.onButtonPinched = function(){
        debugPrint("Prompt " + this.name + " received pinch");
        this.stop();
    }
    
    this.stop = function(){
        if(this.started && !this.stopped){
            if(promptQueue.length > 0){
                this.hide(false, () => {
                    if(this.callback){ this.callback(); }
                    checkQueue();
                });
            }else{
                this.hide(true, this.callback);
            }
        }
    }
}

var promptTypes = {
    hisc1: 0,
    hisc2: 1,
    atcl: 2,
    pract: 3,
    next1: 4,
    next2: 5,
    next3: 6,
    win1: 7,
    win2: 8,
}

var panelSizes = [
    new vec2(4.25, 3),
    new vec2(4, 3),
    new vec2(4.25, 3),
    new vec2(4, 1.75),
    new vec2(3, 1),
    new vec2(3, 1.25),
    new vec2(3, 2),
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
    
    global.events.add("dartPickedUp", script.skipPrompt);
    
    debugPrint("Initilized!");
}

script.setPlayerNumber = function(idx){
    for(var i = 0; i < script.playerTexts.length; i++){
        script.playerTexts[i].text = playerTextCopy[i][0] + (idx + 1) + playerTextCopy[i][1];
    }
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

script.onPinchButton = function(interactorEvent){
    var button = interactorEvent.interactable.getSceneObject();
    debugPrint("Button for prompt " + button.getParent().name + " was pinched");
    if(button.getParent().isSame(currentPrompt.object)){
        currentPrompt.onButtonPinched();
    }
}

script.skipPrompt = function(){
    debugPrint("Skipping current prompt");
    if(currentPrompt && !currentPrompt.stopped){
        currentPrompt.hide(true, null);
    }
    while(promptQueue.length > 0){
        promptQueue.pop();
    }
}

function checkQueue(){
    //debugPrint("Checking prompt queue");
    if(currentPrompt){
        if(currentPrompt.stopped){
            if(currentPrompt.completed){
                debugPrint("Current prompt completed, Showing next prompt in queue");
                currentPrompt = promptQueue.shift();
                currentPrompt.show(true, null);
            }else{
                debugPrint("Current prompt stopped, Showing next prompt in queue");
                currentPrompt = promptQueue.shift();
                currentPrompt.show(false, null);
            }
        }else{
            if(promptQueue[0].override && currentPrompt.canBeOverridden){
                debugPrint("Overriding current prompt");
                currentPrompt.hide(false, null);
                currentPrompt = promptQueue.shift();
                currentPrompt.show(false, null);
            }
        }
    }else{
        debugPrint("Showing next prompt in queue");
        currentPrompt = promptQueue.shift();
        currentPrompt.show(true, null);
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
    //debugPrint("Stopping Panel Tweens")
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

//@ui {"widget":"separator"}
//@input bool debug
//@input string debugName = "PromptController" {"showIf":"debug"}
//@input Component.Text debugText {"showIf":"debug"}

var self = script.getSceneObject();
var selfTransform = self.getTransform();

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
new vec2(),
new vec2(),
new vec2(),
]

function init(){

    debugPrint("Initilized!");
}

script.showPrompt = function(promptNameList, timeout){
    
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
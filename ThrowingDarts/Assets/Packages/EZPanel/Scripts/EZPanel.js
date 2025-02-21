//@input string panelType = "panel" {"widget":"combobox", "values":[{"label":"panel", "value":"panel"}, {"label":"pill", "value":"pill"}, {"label":"sphere", "value":"sphere"}]}
//@ui {"widget":"separator"}
//@input bool debug
//@input string debugName = "EZPanel" {"showIf":"debug"}
//@input Component.Text debugText {"showIf":"debug"}

var self = script.getSceneObject();
var selfTransform = self.getTransform();

var panelRenderMesh;

function init(){
    panelRenderMesh = self.getComponent("Component.RenderMeshVisual");
    //TODO: make material unique?
    debugPrint("Initilized!");
}

script.setSize = function(size, time){
    panelRenderMesh.setBlendShapeWeight("X", size.x);
    panelRenderMesh.setBlendShapeWeight("Y", size.y);
    //TODO: add tweening using time
}

script.setColor = function(color, time){
    //TODO
}

script.fade = function(inOut, time, recursive){
    //TODO
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
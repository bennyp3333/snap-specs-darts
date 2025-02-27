//@input string panelType = "panel" {"widget":"combobox", "values":[{"label":"panel", "value":"panel"}, {"label":"pill", "value":"pill"}, {"label":"sphere", "value":"sphere"}]}
//@ui {"widget":"separator"}
//@input bool debug
//@input string debugName = "EZPanel" {"showIf":"debug"}
//@input Component.Text debugText {"showIf":"debug"}

var self = script.getSceneObject();
var selfTransform = self.getTransform();

var panelRenderMesh = self.getComponent("Component.RenderMeshVisual");

var sizeTweens = [];

function init(){
    //TODO: make material unique?
    debugPrint("Initilized!");
}

script.setSize = function(size, time){
    if(time > 0){
        var startX = panelRenderMesh.getBlendShapeWeight("X");
        var startY = panelRenderMesh.getBlendShapeWeight("Y");
        sizeTweens.push(global.simpleTween(0, 1, time, 0, (val) => {
            var lerpedSize = vec2.lerp(new vec2(startX, startY), size, val);
            panelRenderMesh.setBlendShapeWeight("X", lerpedSize.x);
            panelRenderMesh.setBlendShapeWeight("Y", lerpedSize.y);
        }, null));
    }else{
        panelRenderMesh.setBlendShapeWeight("X", size.x);
        panelRenderMesh.setBlendShapeWeight("Y", size.y); 
    }
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
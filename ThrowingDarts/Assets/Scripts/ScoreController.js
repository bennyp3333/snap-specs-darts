//@input Component.Text3D scoreText
//@ui {"widget":"separator"}
//@input bool debug
//@input string debugName = "ScoreController" {"showIf":"debug"}
//@input Component.Text debugText {"showIf":"debug"}

var self = script.getSceneObject();
var selfTransform = self.getTransform();

var score = 0;

var scoreBeginCopy = "Score: ";

var boardTransform = global.dartboardTransform;

var segmentScores = [6, 13, 4, 18, 1, 20, 5, 12, 9, 14, 11, 8, 16, 7, 19, 3, 17, 2, 15, 10];

var bullseyeInnerRadius = 1.71;
var bullseyeOuterRadius = 3.29;
var tripleRingInner = 18.25;
var tripleRingOuter = 20.15;
var doubleRingInner = 28.64;
var doubleRingOuter = 30.63;

function init(){
    global.events.add("dartHit", onDartHit);
    
    debugPrint("Initilized!");
}

function getDartScore(pos){
    var r = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
    var theta = Math.atan2(pos.y, pos.x);
    var thetaDeg = (theta * 180 / Math.PI + 360) % 360;
    
    var adjustedThetaDeg = (thetaDeg + 9 + 360) % 360;
    
    var segmentIndex = Math.floor(adjustedThetaDeg / 18);
    var baseScore = segmentScores[segmentIndex];

    if (r <= bullseyeInnerRadius) return 50; // Inner bullseye
    if (r <= bullseyeOuterRadius) return 25; // Outer bullseye
    if (r >= tripleRingInner && r <= tripleRingOuter) return baseScore * 3; // Triple ring
    if (r >= doubleRingInner && r <= doubleRingOuter) return baseScore * 2; // Double ring
    if (r <= doubleRingOuter) return baseScore; // Single

    return 0; // Out of bounds
}

function getDartboard2DPosition(dartPos){
    var boardPos = boardTransform.getWorldPosition();
    // Compute dart position relative to board
    var dartToBoard = dartPos.sub(boardPos);

    // Project dart onto the dartboard plane
    var depth = dartToBoard.dot(boardTransform.forward);
    var projectedPos = dartPos.sub(boardTransform.forward.uniformScale(depth));

    // Convert projected position to local 2D coordinates
    var local2D_x = projectedPos.sub(boardPos).dot(boardTransform.right);
    var local2D_y = projectedPos.sub(boardPos).dot(boardTransform.up);

    return new vec2(local2D_x, local2D_y);
}

function onDartHit(dartScript){
    var dartTipPosition = dartScript.tipTransform.getWorldPosition();
    var dart2DPosition = getDartboard2DPosition(dartTipPosition);
    var dartScore = getDartScore(dart2DPosition);
    debugPrint("Score: " + dartScore + " - 2D Position: " + dart2DPosition);
    score += dartScore;
    script.scoreText.text = scoreBeginCopy + score;
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
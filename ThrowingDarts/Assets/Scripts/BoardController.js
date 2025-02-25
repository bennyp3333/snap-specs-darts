//@input SceneObject root
//@input SceneObject boardPlane
//@ui {"widget":"separator"}
//@input SceneObject highScoreContent
//@input SceneObject aroundTheClockContent
//@input SceneObject practiceContent
//@ui {"widget":"separator"}
//@input bool debug
//@input string debugName = "BoardController" {"showIf":"debug"}
//@input Component.Text debugText {"showIf":"debug"}

var self = script.getSceneObject();
var selfTransform = self.getTransform();

var boardTransform = script.boardPlane.getTransform();
global.dartboardTransform = boardTransform;

global.playerScores = Array(global.maxPlayers);
var totalDarts = 0;
var hitDarts = 0;
var missedDarts = 0;

var playersCount = 2;
var gameMode = global.GameModes.HighScore;
var panelContent = null;

var gameModeToContent = {}
gameModeToContent[global.GameModes.HighScore] = script.highScoreContent;
gameModeToContent[global.GameModes.AroundTheClock] = script.aroundTheClockContent;
gameModeToContent[global.GameModes.Practice] = script.practiceContent;

var segmentScores = [6, 13, 4, 18, 1, 20, 5, 12, 9, 14, 11, 8, 16, 7, 19, 3, 17, 2, 15, 10];

var bullseyeInnerRadius = 1.71;
var bullseyeOuterRadius = 3.29;
var tripleRingInner = 18.25;
var tripleRingOuter = 20.15;
var doubleRingInner = 28.64;
var doubleRingOuter = 30.63;

var roundCopy = ["Round: ", " / " + global.roundsCount];
var hitCopy = "Hit: ";

var scoreTitlePositionsY = [
[0, 0, 0, 0, 7],
[4.5, -4.5, 0, 0, 18],
[9, 0, -9, 0, 26],
[13.5, 4.5, -4.5, -13.5, 35],
]

var playerTitleActiveColor = new vec4(1.00, 1.00, 1.00, 1.00);
var playerTitleInactiveColor = new vec4(0.65, 0.65, 0.65, 1.00);

function init(){
    [script.highScoreContent, script.aroundTheClockContent].forEach(contentRoot => {
        for(var i = 0; i < global.maxPlayers; i++){
            var scoreTitle = contentRoot.getChild(i);
            var scoreTitleText = scoreTitle.getComponent("Component.Text3D");
            global.utils.makeMatUnique(scoreTitleText);
            var playerTitle = scoreTitle.getChild(0);
            var playerTitleText = playerTitle.getComponent("Component.Text3D");
            global.utils.makeMatUnique(playerTitleText);
        }
    });

    script.root.enabled = false;
    
    debugPrint("Initilized!");
}

script.show = function(bool){
    script.root.enabled = bool;
}

script.setPanel = function(mode, players){
    playersCount = players;
    gameMode = mode;
    panelContent = gameModeToContent[mode];
    
    script.highScoreContent.enabled = false;
    script.aroundTheClockContent.enabled = false;
    script.practiceContent.enabled = false;
    
    panelContent.enabled = true; 
    
    var yOffset = 0;
    var playerCountOverride = playersCount;
    switch(gameMode){
        case global.GameModes.HighScore:
            yOffset = -5.5;
            break;
        case global.GameModes.AroundTheClock:
            yOffset = -1.0;
            break;
        case global.GameModes.Practice:
            yOffset = 4.0;
            playerCountOverride = 4;
            break;
    }
               
    for(var i = 0; i < global.maxPlayers; i++){
        var scoreTitle = panelContent.getChild(i);
        var scoreTitleTransform = scoreTitle.getTransform();
        var scoreTitlePosition = scoreTitleTransform.getLocalPosition();
        scoreTitleTransform.setLocalPosition(new vec3(scoreTitlePosition.x, 
            scoreTitlePositionsY[playerCountOverride - 1][i] + yOffset, 0));
        if(i > playerCountOverride - 1){
            scoreTitle.enabled = false;
        }
    }
    
    var line = panelContent.getChild(global.maxPlayers);
    var lineTransform = line.getTransform();
    var lineScale = lineTransform.getLocalScale();
    lineTransform.setLocalScale(new vec3(lineScale.x, 
        scoreTitlePositionsY[playersCount - 1][global.maxPlayers], lineScale.z));
}

script.setRound = function(roundNum){
    var roundText = script.highScoreContent.getChild(global.maxPlayers + 3).getComponent("Component.Text3D");
    roundText.text = roundCopy[0] + roundNum + roundCopy[1];
}

script.resetRound = function(){
    script.setRound(1);
}

script.setPlayer = function(playerIdx){
    if(gameMode == global.GameModes.HighScore || gameMode == global.GameModes.AroundTheClock){
        for(var i = 0; i < global.maxPlayers; i++){
            var scoreTitle = panelContent.getChild(i);
            var scoreTitleText = scoreTitle.getComponent("Component.Text3D");
            var playerTitle = scoreTitle.getChild(0);
            var playerTitleText = playerTitle.getComponent("Component.Text3D");
            if(i == playerIdx){
                scoreTitleText.mainPass.baseColor = playerTitleActiveColor;
                playerTitleText.mainPass.baseColor = playerTitleActiveColor;
            }else{
                scoreTitleText.mainPass.baseColor = playerTitleInactiveColor;
                playerTitleText.mainPass.baseColor = playerTitleInactiveColor;
            }
        }
    }
}

script.addScore = function(dart, playerIdx){
    var dartTipPosition = dart.tipTransform.getWorldPosition();
    var dart2DPosition = getDartboard2DPosition(dartTipPosition);
    var dartScore = getDartScore(dart2DPosition, gameMode == global.GameModes.AroundTheClock);
    debugPrint("Hit: " + dartScore);
    
    if(gameMode == global.GameModes.AroundTheClock){
        if(global.playerScores[playerIdx] == dartScore){
            global.playerScores[playerIdx] += 1;
        }
    }else{
        global.playerScores[playerIdx] += dartScore;
    }
    debugPrint("Player " + playerIdx + " score set to " + global.playerScores[playerIdx]);
    
    notifyHit(dartScore);
    refreshPanelText();
}

function notifyHit(score){
    totalDarts += 1;    
    if(score > 0){
        hitDarts += 1;
        panelContent.getChild(5).enabled = true;
        panelContent.getChild(6).enabled = false;
    }else{
        missedDarts += 1;
        panelContent.getChild(6).enabled = true;
        panelContent.getChild(5).enabled = false;
    }
    var hitTitle = panelContent.getChild(5).getComponent("Component.Text3D");
    hitTitle.text = hitCopy + score;
    //hideHitResultDelay.reset(5);
    //TODO: hide this on player switch
}

var hideHitResultDelay = script.createEvent("DelayedCallbackEvent");
hideHitResultDelay.bind(function(eventData){
    panelContent.getChild(5).enabled = false;
    panelContent.getChild(6).enabled = false;
});

function refreshPanelText(){
    if(gameMode == global.GameModes.HighScore || gameMode == global.GameModes.AroundTheClock){   
        for(var i = 0; i < global.maxPlayers; i++){
            var scoreTitle = panelContent.getChild(i);
            var scoreTitleText = scoreTitle.getComponent("Component.Text3D");
            scoreTitleText.text = global.playerScores[i].toString();
        }
    }else{
        var dartsTotalText = panelContent.getChild(0).getComponent("Component.Text3D");
        dartsTotalText.text = totalDarts.toString();
        var dartsHitText = panelContent.getChild(1).getComponent("Component.Text3D");
        dartsHitText.text = hitDarts.toString();
        var dartsMissText = panelContent.getChild(2).getComponent("Component.Text3D");
        dartsMissText.text = missedDarts.toString();
        var totalScoreText = panelContent.getChild(3).getComponent("Component.Text3D");
        totalScoreText.text = global.playerScores[0].toString();
    }
} 

script.resetScore = function(){
    var defaultNumber = 0;
    if(gameMode == global.GameModes.AroundTheClock){ defaultNumber = 1; }

    global.playerScores = Array(global.maxPlayers).fill(defaultNumber);
    totalDarts = 0;
    hitDarts = 0;
    missedDarts = 0;
    
    refreshPanelText();
}

function getDartScore(pos, onlyBaseScore){
    var r = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
    var theta = Math.atan2(pos.y, pos.x);
    var thetaDeg = (theta * 180 / Math.PI + 360) % 360;
    
    var adjustedThetaDeg = (thetaDeg + 9 + 360) % 360;
    
    var segmentIndex = Math.floor(adjustedThetaDeg / 18);
    var baseScore = segmentScores[segmentIndex];

    if(onlyBaseScore){
        if (r <= doubleRingOuter) return baseScore; 
    }else{
        if (r <= bullseyeInnerRadius) return 50; // Inner bullseye
        if (r <= bullseyeOuterRadius) return 25; // Outer bullseye
        if (r >= tripleRingInner && r <= tripleRingOuter) return baseScore * 3; // Triple ring
        if (r >= doubleRingInner && r <= doubleRingOuter) return baseScore * 2; // Double ring
        if (r <= doubleRingOuter) return baseScore; // Single
    }
    
    return 0; // Out of bounds
}

function getDartboard2DPosition(dartPos){
    var boardPos = boardTransform.getWorldPosition();
    
    var projectedPos = dartPos.projectOnPlane(boardTransform.forward);
    
    var local2D_x = projectedPos.sub(boardPos).dot(boardTransform.right);
    var local2D_y = projectedPos.sub(boardPos).dot(boardTransform.up);

    return new vec2(local2D_x, local2D_y);
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
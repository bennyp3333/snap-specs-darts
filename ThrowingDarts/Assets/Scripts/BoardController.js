//@input SceneObject root
//@input SceneObject boardPlane
//@input Component.ScriptComponent dartboardAnimator
//@ui {"widget":"separator"}
//@input SceneObject highScoreContent
//@input SceneObject aroundTheClockContent
//@input SceneObject practiceContent
//@ui {"widget":"separator"}
//@input Component.AudioComponent dingAudioComp
//@input Component.AudioComponent bullseyeAudioComp
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

var segmentScores = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5]
var segmentScoresAlt = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

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
    
    if(gameMode == global.GameModes.HighScore){
        script.dartboardAnimator.setNumbers(0);
        script.dartboardAnimator.script.setBaseColors(
            global.utils.hexToColorVec4("#7f7f7f"),
            global.utils.hexToColorVec4("#646464"),
            global.utils.hexToColorVec4("#967100"),
            global.utils.hexToColorVec4("#000000"),
            global.utils.hexToColorVec4("#ff0004"),
            global.utils.hexToColorVec4("#008c09"));
    }else if(gameMode == global.GameModes.AroundTheClock){
        script.dartboardAnimator.setNumbers(1);
        script.dartboardAnimator.script.setBaseColors(
            global.utils.hexToColorVec4("#7f7f7f"),
            global.utils.hexToColorVec4("#646464"),
            global.utils.hexToColorVec4("#005493"),
            global.utils.hexToColorVec4("#ff4043"),
            global.utils.hexToColorVec4("#005493"),
            global.utils.hexToColorVec4("#ff4043"));
    }else if(gameMode == global.GameModes.Practice){
        script.dartboardAnimator.setNumbers(0);
        script.dartboardAnimator.script.setBaseColors(
            global.utils.hexToColorVec4("#7f7f7f"),
            global.utils.hexToColorVec4("#646464"),
            global.utils.hexToColorVec4("#000000"),
            global.utils.hexToColorVec4("#BF945F"),
            global.utils.hexToColorVec4("#00448c"),
            global.utils.hexToColorVec4("#ff0004"));
    }
    
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
        }else{
            scoreTitle.enabled = true;
        }
    }
    
    var line = panelContent.getChild(global.maxPlayers);
    var lineTransform = line.getTransform();
    var lineScale = lineTransform.getLocalScale();
    lineTransform.setLocalScale(new vec3(lineScale.x, 
        scoreTitlePositionsY[playersCount - 1][global.maxPlayers], lineScale.z));
    
    debugPrint("Panel set to " + mode + " for " + players + " players");
}

script.setRound = function(roundNum){
    var roundText = script.highScoreContent.getChild(global.maxPlayers + 3).getComponent("Component.Text3D");
    roundText.text = roundCopy[0] + (roundNum + 1) + roundCopy[1];
}

script.resetRound = function(){
    script.setRound(0);
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
        
        script.dartboardAnimator.fan(2, 1.5, () => {
            script.dartboardAnimator.clearAddColors();
            if(gameMode == global.GameModes.AroundTheClock){
                script.dartboardAnimator.target(global.playerScores[playerIdx] - 1, null);
            }
        });
    }
}

script.addScore = function(dart, playerIdx){
    var dartTipPosition = dart.tipTransform.getWorldPosition();
    var dart2DPosition = getDartboard2DPosition(dartTipPosition);
    var [ring, segment, score] = getDartScore(dart2DPosition, gameMode == global.GameModes.AroundTheClock);
    debugPrint("Hit score: " + score);
    
    var bullseye = false;
    if(ring < 1){
        bullseye = true;
        script.bullseyeAudioComp.play(1);
        script.dartboardAnimator.wave(2, 1.5, null);
    }
    
    if(gameMode == global.GameModes.AroundTheClock){
        if(global.playerScores[playerIdx] == score){
            global.playerScores[playerIdx] += 1;
            if(!bullseye){
                script.dingAudioComp.play(1);
                script.dartboardAnimator.target(global.playerScores[playerIdx] - 1, null);
            }
        }
    }else{
        global.playerScores[playerIdx] += score;
        if(!bullseye){
            script.dartboardAnimator.hit(ring, segment, null);
        }
    }
    debugPrint("Player " + (playerIdx + 1) + " score set to " + global.playerScores[playerIdx]);
    
    notifyHit(score);
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
}

script.hideHitResults = function(){
    panelContent.getChild(5).enabled = false;
    panelContent.getChild(6).enabled = false;
}

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
    debugPrint("Resetting score");
    var defaultNumber = 0;
    if(gameMode == global.GameModes.AroundTheClock){ defaultNumber = 1; }

    global.playerScores = Array(global.maxPlayers).fill(defaultNumber);
    totalDarts = 0;
    hitDarts = 0;
    missedDarts = 0;
    
    refreshPanelText();
}

script.pressMenuButton = function(){
    debugPrint("Menu button pressed");
    global.events.trigger("menuButton");
}

script.pressRePlaceButton = function(){
    debugPrint("Re-Place button pressed");
    global.events.trigger("rePlaceButton");
}

function getDartScore(pos, onlyBaseScore){
    var r = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
    var theta = Math.atan2(pos.y, pos.x);
    var thetaDeg = (theta * 180 / Math.PI + 360) % 360;
    
    var adjustedThetaDeg = (-thetaDeg + 90 + 360 + 9) % 360;
    
    var segment = Math.floor(adjustedThetaDeg / 18);
    
    var baseScore = segmentScores[segment];
    if(onlyBaseScore){
        baseScore = segmentScoresAlt[segment];
    }
    
    var score = 0;
    var ring = 7;
    
    if (r <= bullseyeInnerRadius){ // Inner bullseye
        score = 50;
        ring = 0;
    }else if (r <= bullseyeOuterRadius){ // Outer bullseye
        score = 25;
        ring = 1;
    }else if(r <= tripleRingInner){
        score = baseScore;
        ring = 2;
    }else if(r <= tripleRingOuter){
        score = baseScore * 3;
        ring = 3;
    }else if(r <= doubleRingInner){
        score = baseScore;
        ring = 4;
    }else if(r <= doubleRingOuter){
        score = baseScore * 2; 
        ring = 5;
    }
    
    if(onlyBaseScore){
        if (r <= doubleRingOuter){
            score = baseScore;
        }
    }
    
    return [ring, segment, score];
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
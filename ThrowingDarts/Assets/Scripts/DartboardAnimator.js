//@input Asset.Material dartboardMat
//@input Asset.Texture[] numbersTex
//@ui {"widget":"separator"}
//@input bool debug
//@input string debugName = "Dartboard Animator" {"showIf":"debug"}
//@input Component.Text debugText {"showIf":"debug"}

var self = script.getSceneObject();
var selfTransform = self.getTransform();
var mainPass = script.dartboardMat.mainPass;

var baseColors;
var addColors;
var linesColor = new vec4(0, 0, 0, 1);

var effectMultiplier = 0;
var maxBrightness = 1;

var totalLayers = 7;
var totalSegments = 20;

var tweens = [];

var layerNames = [
    "center1Color",
    "center2Color",
    "singles1Colors",
    "tripplesColors",
    "singles2Colors",
    "doublesColors",
    "numbersColors"
]

function init(){
    baseColors = make2DArray();
    addColors = make2DArray();
    /*
    script.setBaseColors(
        global.utils.hexToColorVec4("#7f7f7f"),
        global.utils.hexToColorVec4("#646464"),
        global.utils.hexToColorVec4("#967100"),
        global.utils.hexToColorVec4("#000000"),
        global.utils.hexToColorVec4("#ff0004"),
        global.utils.hexToColorVec4("#008c09"))
    */
    //script.fan(4, 2, null);
    //script.hit(4, 10, null);
    //script.target(18, null);
}

function make2DArray(){
    var newArray = Array(totalSegments);
    for(var i = 0; i < newArray.length; i++){
        var segmentsCount = totalSegments;
        if(i < 2){ segmentsCount = 1 }
        newArray[i] = Array(segmentsCount);
        for(var j = 0; j < newArray[i].length; j++){
            newArray[i][j] = new vec4(0, 0, 0, 1);
        }
    }
    return newArray;
}

script.setBaseColors = function(
    lineColor, numbersColor, segment1Color, segment2Color, segment3Color, segment4Color){
    
    debugPrint("Setting base colors");
    for(var i = 0; i < baseColors.length; i++){
        for(var j = 0; j < baseColors[i].length; j++){
            if(i == 0){
                baseColors[i][j] = segment3Color;
            }else if(i == 1){
                baseColors[i][j] = segment4Color;
            }else if(i == 2 || i == 4){
                if(j % 2 == 0){
                    baseColors[i][j] = segment1Color;
                }else{
                    baseColors[i][j] = segment2Color;
                }
            }else if(i == 3 || i == 5){
                if(j % 2 == 0){
                    baseColors[i][j] = segment3Color;
                }else{
                    baseColors[i][j] = segment4Color;
                }
            }else{
                baseColors[i][j] = numbersColor;
            }
        }
    }
    linesColor = lineColor;
    
    script.clearAddColors();
    updateColors();
}

script.setNumbers = function(idx){
    debugPrint("Setting numbers map to " + idx);
    mainPass.numbersMap = script.numbersTex[idx];
}

script.fan = function(loops, duration, callback){
    var leadFadeDistance = 2;       // Fade distance ahead of val
    var trailFadeDistance = 10;     // Fade distance behind val
    var intensityMultiplier = 1;
    
    maxBrightness = 1.25;
    
    debugPrint("Starting fan animation");
    
    stopTweens();
    
    tweens.push(new global.simpleTween(
        0, 1, 0.25, 0, (val) => {
            effectMultiplier = val;
        }, null
    ));

    tweens.push(new global.simpleTween(
        0, 20 * loops, duration, 0, (val) => {
            var wrappedVal = val % 20;

            for (var i = 0; i < addColors.length; i++) {
                for (var j = 0; j < addColors[i].length; j++) {
                    if (i > 1) {
                        var distance = j - wrappedVal;

                        if (distance > 10) distance -= 20;
                        if (distance < -10) distance += 20;

                        var intensity = 0;

                        if (distance >= 0) {
                            var t = Math.max(0, 1 - distance / leadFadeDistance);
                            intensity = t;
                        } else {
                            var t = Math.max(0, 1 + distance / trailFadeDistance);
                            intensity = t;
                        }
                    
                        intensity *= intensityMultiplier;
                        
                        addColors[i][j] = new vec4(intensity, intensity, intensity, 1);
                    }
                }
            }
            updateColors();
        }, callback
    ));
    
    tweens.push(new global.simpleTween(
        1, 0, 0.5, duration - 0.5, (val) => {
            effectMultiplier = val;
        }, null
    ));
}

script.wave = function(loops, duration, callback){
    var leadFadeDistance = 0.5;       // Fade distance ahead of val
    var trailFadeDistance = 2;     // Fade distance behind val
    var intensityMultiplier = 1;
    
    maxBrightness = 1.25;
    
    debugPrint("Starting wave animation");
    
    stopTweens();
    
    tweens.push(new global.simpleTween(
        0, 1, 0.25, 0, (val) => {
            effectMultiplier = val;
        }, null
    ));

    tweens.push(new global.simpleTween(
        0, 7 * loops, duration, 0, (val) => {
            var wrappedVal = val % 7;

            for (var i = 0; i < addColors.length; i++) {
                for (var j = 0; j < addColors[i].length; j++) {
                    var distance = i - wrappedVal;

                    if (distance > 3.5) distance -= 7;
                    if (distance < -3.5) distance += 7;

                    var intensity = 0;

                    if (distance >= 0) {
                        var t = Math.max(0, 1 - distance / leadFadeDistance);
                        intensity = t;
                    } else {
                        var t = Math.max(0, 1 + distance / trailFadeDistance);
                        intensity = t;
                    }
                
                    intensity *= intensityMultiplier;

                    addColors[i][j] = new vec4(intensity, intensity, intensity, 1);
                }
            }
            updateColors();
        }, callback
    ));
    
    tweens.push(new global.simpleTween(
        1, 0, 0.5, duration - 0.5, (val) => {
            effectMultiplier = val;
        }, null
    ));
}

script.hit = function(ring, segment, callback){
    var blinkCount = 4;
    var blinkDuration = 1;
    
    maxBrightness = 1.5;
    
    if(ring < 2){
        segment = 0;
    }
    
    debugPrint("Starting hit animation");
    
    if(ring > 6){
        if(callback){
            callback();
        }
        return;
    }
    
    stopTweens();
    
    tweens.push(new global.simpleTween(
        0, 1, 0.25, 0, (val) => {
            effectMultiplier = val;
        }, null
    ));
    
    tweens.push(new global.simpleTween(
        0, blinkCount, blinkDuration, 0, (val) => {
            var intensity = 0.5 + 0.5 * Math.sin(val * Math.PI * 2);
            addColors[ring][segment] = new vec4(intensity, intensity, intensity, 1);
            if(ring > 1){
                addColors[6][segment] = new vec4(intensity, intensity, intensity, 1);
            }
            updateColors();
        }, callback
    ));
    
    tweens.push(new global.simpleTween(
        1, 0, 0.25, blinkDuration - 0.25, (val) => {
            effectMultiplier = val;
        }, () => {
             script.clearAddColors();
        }
    ));
}

script.target = function(segment, callback){
    var leadFadeDistance = 20 - segment;       // Fade distance ahead of val
    var trailFadeDistance = 1;     // Fade distance behind val
    var intensityPower = 0.5;

    var wrappedVal = segment % 20;
    
    var blinkCount = 3;
    var blinkDuration = 1;

    debugPrint("Starting target animation");
    
    stopTweens();
    
    effectMultiplier = 1;
    maxBrightness = 1;
    
    for (var i = 0; i < addColors.length; i++) {
        for (var j = 0; j < addColors[i].length; j++) {
            if (i > 1) {
                var distance = j - wrappedVal;

                if (distance > 10) distance -= 20;
                if (distance < -10) distance += 20;

                var intensity = 0;

                if (distance >= 0) {
                    var t = Math.max(0, 1 - distance / leadFadeDistance);
                    intensity = t;
                } else {
                    var t = Math.max(0, 1 + distance / trailFadeDistance);
                    intensity = t;
                }
            
                intensity = 1 - Math.pow(1 - intensity, intensityPower);
                
                if(i == 6){
                    intensity *= 0.5;
                }
                
                addColors[i][j] = new vec4(intensity, intensity, intensity, 1);
            }
        }
    }
    
    tweens.push(new global.simpleTween(
        0, blinkCount, blinkDuration, 0, (val) => {
            var intensity = 0.5 + 0.5 * Math.sin(val * Math.PI * 2);
            for (var i = 0; i < addColors.length; i++) {
                addColors[i][segment] = new vec4(intensity, intensity, intensity, 1);
            }
            updateColors();
        }, () => {
            for (var i = 0; i < addColors.length; i++) {
                for (var j = 0; j < addColors[i].length; j++) {
                    if (i > 1) {
                        var distance = j - wrappedVal;
        
                        if (distance > 10) distance -= 20;
                        if (distance < -10) distance += 20;
        
                        var intensity = 0;
        
                        if (distance >= 0) {
                            var t = Math.max(0, 1 - distance / leadFadeDistance);
                            intensity = t;
                        } else {
                            var t = Math.max(0, 1 + distance / trailFadeDistance);
                            intensity = t;
                        }
                    
                        intensity = 1 - Math.pow(1 - intensity, intensityPower);
                        
                        if(i == 6){
                            intensity *= 0.5;
                        }
                        
                        addColors[i][j] = new vec4(intensity, intensity, intensity, 1);
                    }
                }
            }
            updateColors();
            if(callback){
                callback();
            }
        }
    ));
}

function updateColors(){
    //debugPrint("Updating colors");
    for(var i = 0; i < baseColors.length; i++){
        for(var j = 0; j < baseColors[i].length; j++){
            var baseBrightness = global.utils.rgbToHsv(baseColors[i][j]).z;
            var adjBrightness = global.utils.lerp(baseBrightness * 0.5, maxBrightness, addColors[i][j].r);
            var multBrightness = global.utils.lerp(baseBrightness, adjBrightness, effectMultiplier);
            totalColor = setColorBrightness(baseColors[i][j], multBrightness);

            if(i < 2){
                mainPass[layerNames[i]] = totalColor;
            }else{
                mainPass[layerNames[i] + "[" + j + "]"] = totalColor;
            }
        }
    }
    mainPass.linesColor = linesColor;
}

script.clearAddColors = function(){
    for (var i = 0; i < addColors.length; i++) {
        for (var j = 0; j < addColors[i].length; j++) {
            addColors[i][j] = new vec4(0, 0, 0, 1);
        }
    }
}

function clampVec4(v, minVal, maxVal) {
  return new vec4(
    Math.max(minVal, Math.min(maxVal, v.x)),
    Math.max(minVal, Math.min(maxVal, v.y)),
    Math.max(minVal, Math.min(maxVal, v.z)),
    Math.max(minVal, Math.min(maxVal, v.w))
  );
}

function setColorBrightness(color, targetBrightness) {
    var hsl = global.utils.rgbToHsv(color);
    hsl.z = targetBrightness;
    return global.utils.hsvToRgb(hsl, color.w);
}

function stopTweens(){
    while(tweens.length > 0){
        tweens.pop().enabled = false;
    }
    effectMultiplier = 0;
}

init();

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
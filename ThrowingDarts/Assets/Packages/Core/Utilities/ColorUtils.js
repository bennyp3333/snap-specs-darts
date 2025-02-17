function rgbToHsv(color) {
    var r = color.r, g = color.g, b = color.b;
    
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var delta = max - min;
    
    var h = 0, s = 0, v = max;
    
    if (delta > 0) {
        if (max === r) {
            h = ((g - b) / delta) % 6;
        } else if (max === g) {
            h = (b - r) / delta + 2;
        } else {
            h = (r - g) / delta + 4;
        }
        
        h /= 6;
        if (h < 0) h += 1; // Ensure hue is in range [0,1]
        
        s = max === 0 ? 0 : delta / max;
    }
    
    return { h: h, s: s, v: v };
}

function hsvToRgb(h, s, v) {
    var c = v * s;
    var x = c * (1 - Math.abs((h * 6) % 2 - 1));
    var m = v - c;
    
    var r = 0, g = 0, b = 0;
    
    if (h < 1/6) { r = c; g = x; b = 0; }
    else if (h < 2/6) { r = x; g = c; b = 0; }
    else if (h < 3/6) { r = 0; g = c; b = x; }
    else if (h < 4/6) { r = 0; g = x; b = c; }
    else if (h < 5/6) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    
    return new vec4(r + m, g + m, b + m, 1.0);
}

function colorRandom(randomAlpha) {
    var alpha = 1.0;
    if(randomAlpha){ alpha = Math.random(); }
    return new vec4(Math.random(), Math.random(), Math.random(), alpha);
}

function randomColorHue(brightness, saturation) {
    var hue = Math.random();
    return hsvToRgb(hue, saturation, brightness);
}


// Exporting the functions
var exports = {
    rgbToHsv,
    hsvToRgb,
    colorRandom,
    randomColorHue
};

if(script){
    script.exports = exports;
    if(!global.utils){ global.utils = {}; }
    Object.assign(global.utils, exports);
}else{
    module.exports = exports;
}
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
            h = ((b - r) / delta) + 2;
        } else {
            h = ((r - g) / delta) + 4;
        }

        h /= 6;
        if (h < 0) h += 1; // Normalize to [0,1]
    }

    s = max === 0 ? 0 : delta / max;
    
    if (color.w !== undefined) {
        return new vec4(h, s, v, color.a);
    } else {
        return new vec3(h, s, v);
    }
    
}

function hsvToRgb(color) {
    var h = color.x;
    var s = color.y;
    var v = color.z;

    var c = v * s;
    var hh = h * 6; // Range [0,6)
    var x = c * (1 - Math.abs(hh % 2 - 1));
    var m = v - c;

    var r = 0, g = 0, b = 0;

    if (hh < 1) { r = c; g = x; b = 0; }
    else if (hh < 2) { r = x; g = c; b = 0; }
    else if (hh < 3) { r = 0; g = c; b = x; }
    else if (hh < 4) { r = 0; g = x; b = c; }
    else if (hh < 5) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    
    if (color.w !== undefined) {
        return new vec4(r + m, g + m, b + m, color.a);
    } else {
        return new vec3(r + m, g + m, b + m);
    }
}

function colorRandom(randomAlpha) {
    var alpha = 1.0;
    if(randomAlpha){ alpha = Math.random(); }
    return new vec4(Math.random(), Math.random(), Math.random(), alpha);
}

function randomColorHue(brightness, saturation, alpha) {
    var hue = Math.random();
    if(alpha == null){ alpha = 1.0 }
    return hsvToRgb(new vec4(hue, saturation, brightness, alpha));
}

function hexToColorVec4(hex, alpha) {
    // Remove the leading '#' if present
    if (hex.startsWith('#')) {
        hex = hex.slice(1);
    }

    // Default alpha if not specified
    if (hex.length === 6) {
        hex += 'FF'; // Add full opacity
    }

    if (hex.length !== 8) {
        print('Invalid hex color format');
        return new vec4(1, 1, 1, 1);
    }

    // Parse the hex string into normalized values
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    const a = parseInt(hex.slice(6, 8), 16) / 255;

    return new vec4(r, g, b, a);
}


// Exporting the functions
var exports = {
    rgbToHsv,
    hsvToRgb,
    colorRandom,
    randomColorHue,
    hexToColorVec4
};

if(script){
    script.exports = exports;
    if(!global.utils){ global.utils = {}; }
    Object.assign(global.utils, exports);
}else{
    module.exports = exports;
}
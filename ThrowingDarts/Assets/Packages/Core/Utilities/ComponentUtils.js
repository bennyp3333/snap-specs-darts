function getAlphaObject(obj){
    var meshVisComp = obj.getComponent("Component.RenderMeshVisual");
    var imageComp = obj.getComponent("Component.Image");
    var text3DComp = obj.getComponent("Component.Text3D");
    var textComp = obj.getComponent("Component.Text");
    
    if(meshVisComp){
        return getAlpha(meshVisComp)
    }else if(imageComp){
        return getAlpha(imageComp);
    }else if(text3DComp){
        return getAlpha(text3DComp);
    }else if(textComp){
        return textComp.textFill.color.a
    }
}

function getAlpha(meshVis){
    return meshVis.mainPass.baseColor.a;
}

function setAlphaObject(obj, alpha){
    var meshVisComp = obj.getComponent("Component.RenderMeshVisual");
    var imageComp = obj.getComponent("Component.Image");
    var text3DComp = obj.getComponent("Component.Text3D");
    var textComp = obj.getComponent("Component.Text");
    
    if(meshVisComp){
        return setAlpha(meshVisComp, alpha)
    }else if(imageComp){
        return setAlpha(imageComp, alpha);
    }else if(text3DComp){
        return setAlpha(text3DComp, alpha);
    }else if(textComp){
        var currColor = textComp.textFill.color;
        currColor.a = alpha;
        textComp.textFill.color = currColor;
    }
}

/**
 * Sets the alpha value for all materials in a MaterialMeshVisual object.
 * @param {MaterialMeshVisual} meshVis - The mesh visual object containing materials.
 * @param {number} alpha - The alpha value to set (0.0 to 1.0).
 * @returns {Array} An array of updated colors with the new alpha value.
 */
function setAlpha(meshVis, alpha) {
    var colors = [];
    for (var i = 0; i < meshVis.getMaterialsCount(); i++) {
        var currColor = meshVis.getMaterial(i).mainPass.baseColor;
        currColor.a = alpha;
        meshVis.getMaterial(i).mainPass.baseColor = currColor;
        colors.push(currColor);
    }
    return colors;
}

function makeMatUniqueObject(obj) {
    var meshVisComp = obj.getComponent("Component.RenderMeshVisual");
    var imageComp = obj.getComponent("Component.Image");
    var text3DComp = obj.getComponent("Component.Text3D");
    
    if(meshVisComp){
        return makeMatUnique(meshVisComp);
    }else if(imageComp){
        return makeMatUnique(imageComp);
    }else if(text3DComp){
        return makeMatUnique(text3DComp);
    }
}

/**
 * Makes all materials in a MaterialMeshVisual object unique by cloning them.
 * @param {MaterialMeshVisual} meshVis - The mesh visual object containing materials.
 * @returns {Array} An array of cloned materials.
 */
function makeMatUnique(meshVis) {
    var clonedMaterials = Array(meshVis.getMaterialsCount());
    for (var i = 0; i < clonedMaterials.length; i++) {
        clonedMaterials[i] = meshVis.getMaterial(i).clone();
    }
    meshVis.clearMaterials();
    for (var i = 0; i < clonedMaterials.length; i++) {
        meshVis.addMaterial(clonedMaterials[i]);
    }
    return clonedMaterials;
}

/**
 * Makes materials across an array of MaterialMeshVisual objects unique by cloning the materials from the first object.
 * @param {Array<MaterialMeshVisual>} meshVisArray - An array of mesh visual objects.
 * @returns {Array} An array of cloned materials from the first mesh visual object.
 */
function makeMatArrayUnique(meshVisArray) {
    var clonedMaterials = makeMatUnique(meshVisArray[0]);
    for (var i = 1; i < meshVisArray.length; i++) {
        var meshVis = meshVisArray[i];
        meshVis.clearMaterials();
        for (var j = 0; j < clonedMaterials.length; j++) {
            meshVis.addMaterial(clonedMaterials[j]);
        }
    }
    return clonedMaterials;
}

/**
 * Creates an AudioComponent for the given script and optionally sets its audio track.
 * @param {ScriptComponent} thatScript - The script component to which the AudioComponent will be added.
 * @param {AudioTrackAsset} [audioTrack] - The audio track asset to assign to the audio component (optional).
 * @returns {AudioComponent} The created audio component.
 */
function createAudioComp(thatScript, audioTrack) {
    var audioComp = thatScript.getSceneObject().createComponent("Component.AudioComponent");
    if (audioTrack) {
        audioComp.audioTrack = audioTrack;
    } else {
        print("Audiotrack is not set!");
    }
    return audioComp;
}

// Exporting the functions
var exports = {
    getAlphaObject,
    getAlpha,
    setAlphaObject,
    setAlpha,
    makeMatUniqueObject,
    makeMatUnique,
    makeMatArrayUnique,
    createAudioComp
};

if(script){
    script.exports = exports;
    if(!global.utils){ global.utils = {}; }
    Object.assign(global.utils, exports);
}else{
    module.exports = exports;
}
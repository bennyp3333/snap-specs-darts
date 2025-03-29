//@input vec3 worldRot

var self = script.getSceneObject();
var selfTransform = self.getTransform();

function onUpdate(){
    var worldRotRad = quat.fromEulerAngles(degToRad(script.worldRot.x), 
        degToRad(script.worldRot.y), degToRad(script.worldRot.z));

    selfTransform.setWorldRotation(worldRotRad);
}

script.createEvent("UpdateEvent").bind(onUpdate);

function degToRad(degrees) {
    return degrees * (Math.PI / 180);
}
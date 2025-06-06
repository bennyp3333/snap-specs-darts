//@input SceneObject forwardObj

var self = script.getSceneObject();
var selfTransform = self.getTransform();

var objTransform = script.forwardObj.getTransform();

function onUpdate(){
    //var worldRot = selfTransform.getWorldRotation();
    
    //var forward = worldRot.multiplyVec3(vec3.forward());
    var forward = objTransform.forward
    var yawQuat = quat.lookAt(new vec3(forward.x, 0, forward.z), vec3.up());

    selfTransform.setWorldRotation(yawQuat);
}

script.createEvent("UpdateEvent").bind(onUpdate);
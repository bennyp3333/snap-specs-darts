//@input Component.RenderMeshVisual dartMesh
//@input SceneObject tip
//@input Component.AudioComponent hitAudioComp
//@input Component.AudioComponent bounceAudioComp
//@input SceneObject light
//@ui{"widget":"separator"}
//@input bool debug
//@input string debugName = "Dart"{"showIf":"debug"}
//@input Component.Text debugText{"showIf":"debug"}

var Buffer = require("Scripts/Utils/Buffer").Buffer;
var Interactable = require("Packages/SpectaclesInteractionKit/Components/Interaction/Interactable/Interactable").Interactable;
var InteractorEvent = require("Packages/SpectaclesInteractionKit/Core/Interactor/InteractorEvent").InteractorEvent;
var InteractorInputType = require("Packages/SpectaclesInteractionKit/Core/Interactor/Interactor").InteractorInputType;
var WorldCameraFinderProvider = require("Packages/SpectaclesInteractionKit/Providers/CameraProvider/WorldCameraFinderProvider").default;
var SIK = require("Packages/SpectaclesInteractionKit/SIK").SIK;

var self = script.getSceneObject();
var selfTransform = self.getTransform();
script.tipTransform = script.tip.getTransform();

script.dartIdx = null;

var handInputData = SIK.HandInputData;
var hand = handInputData.getHand('right');
var objectHit = null;
var objectHitTransform = null;
var isDartBoardHit = false;
var reportedHit = false;

var isHolding = false;
var isFlying = false;
var startedFlyingAt = -1;
var accumulatedForce = vec3.zero();
var prevHandVelocity = vec3.zero();
var prevPos = vec3.zero();

var rotationBuffer = new Buffer(4);
var positionBuffer = new Buffer(4);

var velocityBuffer = new Buffer(4);
var accBuffer = new Buffer(4);

var physicsBody = null;
var interactable = null;

const OBJECT_MASS = 0.04;

const HAND_ACCELERATION_MULTIPLIER = 0.12;
const HAND_BASE_VELOCITY_MULTIPLIER = 0.3;
const BOARD_THICKNESS = 34.2;

// Aim assist
const CENTER_ADJUST_WEIGHT = 0.3;
const USER_FACING_WEIGHT = 0.5;
const WEIGHTS_LIFT_ASSIST = 0.125;

var dartMaterial = null;

function init(){
    script.hitAudioComp.playbackMode = Audio.PlaybackMode.LowLatency;
    script.bounceAudioComp.playbackMode = Audio.PlaybackMode.LowLatency;
    
    physicsBody = self.getComponent("Physics.BodyComponent");
    physicsBody.mass = OBJECT_MASS;
    physicsBody.onCollisionEnter.add(onCollisionEnter);

    interactable = self.getComponent(Interactable.getTypeName());
    interactable.onTriggerStart(onGrab);
    interactable.onTriggerEnd(onRelease);
    
    debugPrint("Initilized!");
}

function onGrab(event){
    debugPrint("Grabbed!");
    
    var inputType = event.interactor.inputType;
    hand = handInputData.getHand(inputType == InteractorInputType.LeftHand ? 'left' : 'right');
    
    var startPoint = hand.indexKnuckle.position.add(hand.thumbKnuckle.position).uniformScale(0.5);
    var nudgeLeftDir = hand.middleKnuckle.position.sub(hand.pinkyKnuckle.position);
    startPoint = startPoint.add(nudgeLeftDir.normalize().uniformScale(5));
    var nudgeUpDir = hand.indexKnuckle.position.sub(hand.wrist.position);
    startPoint = startPoint.add(nudgeUpDir.normalize().uniformScale(3));

    var endPoint = hand.indexTip.position.add(hand.thumbTip.position).uniformScale(0.5);
    var direction = startPoint.sub(endPoint).normalize();
    
    isHolding = true;
    prevHandVelocity = vec3.zero();
    accumulatedForce = vec3.zero();
    
    self.setParent(null);
    
    if(global.deviceInfoSystem.isEditor()){
        selfTransform.setWorldPosition(WorldCameraFinderProvider.getInstance().getWorldPosition());
        selfTransform.setWorldRotation(quat.lookAt(WorldCameraFinderProvider.getInstance().forward(), vec3.up()));
    }else{
        selfTransform.setWorldPosition(endPoint);
        selfTransform.setWorldRotation(quat.lookAt(direction, vec3.up()));
    }
}

function onRelease(){
    debugPrint("Released!");
    
    physicsBody.intangible = false;
    physicsBody.dynamic = true;

    var baseVelocity = getHandVelocity();
    if(global.deviceInfoSystem.isEditor()){
        physicsBody.velocity = baseVelocity;
    }else{
        baseVelocity = baseVelocity.uniformScale(HAND_BASE_VELOCITY_MULTIPLIER);
        var finalVelocity = baseVelocity.add(accumulatedForce);
        //physicsBody.velocity = finalVelocity;
        
        var dartPos = selfTransform.getWorldPosition();
        var dartboardCenter = global.dartboardTransform.getWorldPosition();
        var userFacing = WorldCameraFinderProvider.getInstance().forward().uniformScale(-1);
        userFacing = userFacing.add(global.dartboardTransform.up.uniformScale(WEIGHTS_LIFT_ASSIST)).normalize();
        
        var toDartboard = dartboardCenter.sub(dartPos).normalize();
        toDartboard = toDartboard.add(global.dartboardTransform.up.uniformScale(WEIGHTS_LIFT_ASSIST)).normalize();
        var velocityDir = finalVelocity.normalize();
        
        var adjustedDir = vec3.lerp(velocityDir, toDartboard, CENTER_ADJUST_WEIGHT).normalize();// Aim assist
        adjustedDir = vec3.lerp(adjustedDir, userFacing, USER_FACING_WEIGHT).normalize();
        
        var adjustedVelocity = adjustedDir.uniformScale(finalVelocity.length);
        //adjustedVelocity = toDartboard.uniformScale(1000);
        
        physicsBody.velocity = adjustedVelocity;
    }
    
    debugPrint("Velocity Set: " + physicsBody.velocity);

    isHolding = false;

    isFlying = true;
    startedFlyingAt = getTime();

    prevHandVelocity = vec3.zero();
    accumulatedForce = vec3.zero();
}

function getHandVelocity(){
    if(global.deviceInfoSystem.isEditor()){
        return WorldCameraFinderProvider.getInstance().forward().uniformScale(-2000);
    }
    
    const objectSpecificData = hand.objectTracking3D.objectSpecificData;
    if(objectSpecificData){
        const handVelocity = objectSpecificData['global'];
        if(handVelocity.length < 2){
            return vec3.zero();
        }
        return handVelocity;
    }
    return vec3.zero();
}

function onCollisionEnter(event){
    //debugPrint("Collission!");
    
    var collision = event.collision;

    if(collision.collider.getSceneObject().name == self.name){
        //debugPrint("Collided with another dart");
        return;
    }
    
    objectHit = collision.collider.getSceneObject();
    objectHitTransform = objectHit.getTransform();
    var isFlying = false;
    
    if(collision.collider.getSceneObject().name == "DartBoard"){
        isDartBoardHit = true;
    }
    
    var intersection = getTouchPointPlaneIntersections(selfTransform, objectHitTransform);
    var endPosition = intersection.position;
    var endRotation = intersection.rotation;
    var endScale = selfTransform.getWorldScale();
    
    if(isStraightHit(endRotation, objectHitTransform.forward)){
        //physicsBody.intangible = true;
        physicsBody.dynamic = false;
        physicsBody.velocity = vec3.zero();
        
        self.setParent(objectHit);
        
        selfTransform.setWorldPosition(endPosition);
        selfTransform.setWorldRotation(endRotation);
        selfTransform.setWorldScale(endScale);
        
        script.light.enabled = true;
        
        script.hitAudioComp.play(1);
        
        if(!reportedHit){
            global.events.trigger("dartHit", script);
            reportedHit = true;
        }
    }else{
        script.bounceAudioComp.play(1);
    }
}

function isStraightHit(objRot, refForward){
    var angle = refForward.angleTo(objRot.multiplyVec3(vec3.forward())) * (180/Math.PI);
    debugPrint("Angle: " + (angle).toFixed(1));
    return angle < 66 && angle > 0;
}

function getTouchPointPlaneIntersections(objTransform, refTransform){
    var curPos = objTransform.getWorldPosition();
    var curRot = objTransform.getWorldRotation();
    var positivePoint = null;
    var thicknessOffset = refTransform.forward.uniformScale(BOARD_THICKNESS/2);
    var frontPlanePos = refTransform.getWorldPosition().add(thicknessOffset);
    var negativeDist = -(frontPlanePos.sub(curPos).dot(refTransform.forward));
    var negativePoint = curPos;
    
    if(negativeDist > 0){
        return { position: curPos, rotation: curRot };
    }
    
    for(var i = 0; i < positionBuffer.size(); i++){
        var pos = positionBuffer.getMostRecentFromInd(i);
        //var rot = rotationBuffer.getOldestValue();
        var rot = rotationBuffer.getMostRecentFromInd(i);
        var newDist = -(frontPlanePos.sub(pos).dot(refTransform.forward));

        if(newDist < 0){
            negativePoint = pos
        }else{
            positivePoint = pos
            curRot = rot
            break;
        }
    }
    
    if(negativePoint != null && positivePoint != null){
        return { 
            position: getPlaneIntersectionsBetweenPoints(frontPlanePos, refTransform.forward, negativePoint, positivePoint), 
            rotation: curRot
        };
    }else{
        return { position: curPos, rotation: curRot };
    }
}

function getPlaneIntersectionsBetweenPoints(planePos, planeForward, pointA, pointB){
    var dir = pointB.sub(pointA).normalize();
    var dotProduct = dir.dot(planeForward);

    var dist = planePos.sub(pointA).dot(planeForward);
    var t = dist / dotProduct;
    var intersectionPoint = pointA.add(dir.uniformScale(t));
    
    return intersectionPoint;
}

function onUpdate(){
    if(isHolding && getDeltaTime() > 0){
        var handVelocity = getHandVelocity();
        var handAcceleration = (handVelocity.sub(prevHandVelocity)).uniformScale(1/(Math.max(0.016666, getDeltaTime())));
        accumulatedForce = accumulatedForce.add(handAcceleration.uniformScale(HAND_ACCELERATION_MULTIPLIER));
        
        velocityBuffer.add(handVelocity);
        accBuffer.add(accumulatedForce);

        prevHandVelocity = handVelocity;
    }
    
    if(isFlying){
        physicsBody.angularVelocity = vec3.zero();
    }
}

function onLateUpdate(){
    if(isHolding || isFlying){
        prevPos = selfTransform.getWorldPosition();
        rotationBuffer.add(selfTransform.getWorldRotation());
        positionBuffer.add(selfTransform.getWorldPosition());
    }
}

script.setColor = function(color){
    debugPrint("Setting color: " + color);
    if(!dartMaterial){
        dartMaterial = global.utils.makeMatUnique(script.dartMesh)[0];
    }
    dartMaterial.mainPass.baseColor = color;
}

script.createEvent("OnStartEvent").bind(init);
script.createEvent("UpdateEvent").bind(onUpdate);
script.createEvent("LateUpdateEvent").bind(onLateUpdate);

// Debug
function debugPrint(text){
    if(script.debug){
        var newLog = script.debugName + " " + script.dartIdx + ": " + text;
        if(global.textLogger){ global.logToScreen(newLog); }
        if(script.debugText){ script.debugText.text = newLog; }
        print(newLog);
    }
}

function errorPrint(text){
    var errorLog = "!!ERROR!! " + script.debugName + " " + script.dartIdx + ": " + text;
    if(global.textLogger){ global.logError(errorLog); }
    if(script.debugText){ script.debugText.text = errorLog; }
    print(errorLog);
}
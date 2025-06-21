import { CircleAnimation } from './CircleAnimation';

@component
export class WallDetection extends BaseScriptComponent {
    
    @input
    ignorePitch: boolean = false
    
    @input
    @allowUndefined
    camObj: SceneObject

    @input
    @allowUndefined
    visualObj: SceneObject

    @input
    @allowUndefined
    animation: CircleAnimation
    
    @input
    @allowUndefined
    altVisuals: SceneObject[]

    private worldQueryModule = require("LensStudio:WorldQueryModule") as WorldQueryModule;

    // Set min and max hit distance to walls
    private readonly MAX_HIT_DISTANCE = 1000;
    private readonly MIN_HIT_DISTANCE = 50;

    // Number of frames before wall detection completes
    private readonly CALIBRATION_FRAMES = 45;

    // Distance in cm the wall visual can move before canceling
    private readonly MOVE_DISTANCE_THRESHOLD = 5;

    // Distance in cm from camera to visual when no wall is hit
    private readonly DEFAULT_SCREEN_DISTANCE = 250;

    private readonly SPEED = 10;

    private camTrans;
    private visualTrans;

    private calibrationPosition = vec3.zero();
    private calibrationRotation = quat.quatIdentity();

    private desiredPosition = vec3.zero();
    private desiredRotation = quat.quatIdentity();

    private hitTestSession = null;
    private updateEvent = null;

    private history = [];
    private calibrationFrames = 0;

    private onWallFoundCallback = null;

    onAwake() {

        if (!this.camObj) {
            print("Please set Camera Obj input");
            return;
        }
        this.camTrans = this.camObj.getTransform();
        this.visualTrans = this.visualObj.getTransform();
        this.visualObj.enabled = false;

        try {
            const options = HitTestSessionOptions.create();
            options.filter = true;
            this.hitTestSession = this.worldQueryModule.createHitTestSessionWithOptions(options);
        } catch (e) {
            print(e);
        }
        
        for(var i = 0; i < this.altVisuals.length; i++){
            this.altVisuals[i].enabled = false;
        }

        this.createEvent("OnStartEvent").bind(() => {
            this.setDefaultPosition();
        });
    }

    startWallCalibration(callback: (pos: vec3, rot: quat) => void) {
        this.setDefaultPosition();
        this.hitTestSession?.start();
        this.visualObj.enabled = true;
        this.history = [];
        this.calibrationFrames = 0;
        this.onWallFoundCallback = callback;
        this.updateEvent = this.createEvent("UpdateEvent");
        this.updateEvent.bind(() => {
            this.update();
        });
        for(var i = 0; i < this.altVisuals.length; i++){
            this.altVisuals[i].enabled = true;
        }
        this.animation.startCalibration(() => {
            this.onCalibrationComplete()
        });
    }

    private setDefaultPosition() {
        const cameraForward = new vec3(this.camTrans.forward.x, 0, this.camTrans.forward.z).normalize();
        this.desiredPosition = this.camTrans.getWorldPosition().add(cameraForward.uniformScale(-this.DEFAULT_SCREEN_DISTANCE));
        this.desiredRotation = this.camTrans.getWorldRotation();
        this.visualTrans.setWorldPosition(this.desiredPosition);
        this.visualTrans.setWorldRotation(this.desiredRotation);
    }

    private update() {
        var rayDirection = this.camTrans.forward;
        if(this.ignorePitch){
            rayDirection.y = 0;
            rayDirection = rayDirection.normalize();
        }
        const camPos = this.camTrans.getWorldPosition();
        const rayStart = camPos.add(rayDirection.uniformScale(-this.MIN_HIT_DISTANCE));
        const rayEnd = camPos.add(rayDirection.uniformScale(-this.MAX_HIT_DISTANCE));
        this.hitTestSession.hitTest(rayStart, rayEnd, (hitTestResult) => {
            this.onHitTestResult(hitTestResult);
        });
    }

    private onHitTestResult(hitTestResult) {
        const cameraForward = new vec3(this.camTrans.forward.x, 0, this.camTrans.forward.z).normalize();
        let foundPosition = this.camTrans.getWorldPosition().add(cameraForward.uniformScale(-this.DEFAULT_SCREEN_DISTANCE));
        let foundNormal = cameraForward;
        if (hitTestResult != null) {
            foundPosition = hitTestResult.position;
            foundNormal = hitTestResult.normal;
        }
        this.updateCalibration(foundPosition, foundNormal);
    }

    private updateCalibration(foundPosition: vec3, foundNormal: vec3) {
        const currPosition = this.visualTrans.getWorldPosition();
        const currRotation = this.visualTrans.getWorldRotation();

        const cameraForward = new vec3(this.camTrans.forward.x, 0, this.camTrans.forward.z).normalize();
        this.desiredPosition = this.camTrans.getWorldPosition().add(cameraForward.uniformScale(-this.DEFAULT_SCREEN_DISTANCE));
        this.desiredRotation = this.camTrans.getWorldRotation();
        
        //check if vertical plane is being tracked
        if (Math.abs(foundNormal.dot(vec3.up())) < 0.1) {
            //make calibration face camera
            this.desiredPosition = foundPosition;
            
            const worldCameraForward = this.camTrans.forward; // Use the camera's forward vector
            const wallRight = foundNormal.cross(vec3.up()).normalize(); // Find the right direction of the wall
            const wallUp = wallRight.cross(foundNormal).normalize(); // Compute the correct up direction
            
            this.desiredRotation = quat.lookAt(foundNormal, wallUp);

            this.history.push(this.desiredPosition);
            if (this.history.length > this.CALIBRATION_FRAMES) {
                this.history.shift();
            }
            const distance = this.history[0].distance(this.history[this.history.length - 1]);
            if (distance < this.MOVE_DISTANCE_THRESHOLD) {
                this.calibrationFrames++;
            } else {
                this.calibrationFrames = 0;
            }
        } else {
            this.calibrationFrames = 0;
            this.history = [];
        }

        const calibrationAmount = this.calibrationFrames / this.CALIBRATION_FRAMES;

        this.animation.setLoadAmount(calibrationAmount);

        if (calibrationAmount > 0.999) {
            this.calibrationPosition = this.desiredPosition;
            //const rotOffset = quat.fromEulerVec(new vec3(Math.PI / 2, 0, 0));
            //this.calibrationRotation = this.desiredRotation.multiply(rotOffset);
            this.calibrationRotation = this.desiredRotation;
        }

        //interpolate
        this.visualTrans.setWorldPosition(vec3.lerp(currPosition, this.desiredPosition, getDeltaTime() * this.SPEED));
        this.visualTrans.setWorldRotation(quat.slerp(currRotation, this.desiredRotation, getDeltaTime() * this.SPEED));
    }

    private onCalibrationComplete() {
        for(var i = 0; i < this.altVisuals.length; i++){
            this.altVisuals[i].enabled = false;
        }
        this.removeEvent(this.updateEvent);
        this.hitTestSession?.stop();
        this.onWallFoundCallback?.(this.calibrationPosition, this.calibrationRotation);
    }
}

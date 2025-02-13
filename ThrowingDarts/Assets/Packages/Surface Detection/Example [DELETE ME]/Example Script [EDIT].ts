import { WallDetection } from '../Scripts/WallDetection';

@component
export class Test extends BaseScriptComponent {

    @input
    @allowUndefined
    objectVisuals: SceneObject

    @input
    @allowUndefined
    wallDetection: WallDetection

    private cubeTrans;

    onAwake() {
        this.cubeTrans = this.getSceneObject().getTransform();
        
        this.createEvent("OnStartEvent").bind(() => {
            this.startSurfaceDetection();
        });
    }

    startSurfaceDetection() {
        this.objectVisuals.enabled = false;
        this.wallDetection.startWallCalibration((pos, rot) => {
            this.onSurfaceDetected(pos, rot);
        });
    }

    private onSurfaceDetected(pos: vec3, rot: quat) {
        this.objectVisuals.enabled = true;
        this.cubeTrans.setWorldPosition(pos);
        this.cubeTrans.setWorldRotation(rot);
    }
}
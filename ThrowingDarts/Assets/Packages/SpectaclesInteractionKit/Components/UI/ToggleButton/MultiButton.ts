import {createCallback} from "../../../Utils/InspectorCallbacks"
import ReplayEvent from "../../../Utils/ReplayEvent"
import {Interactable} from "../../Interaction/Interactable/Interactable"

/**
 * This class provides basic toggle functionality for a prefab toggle button. It manages the toggle state and provides methods to handle toggle events and update the button's visual state.
 */
@component
export class MultiButton extends BaseScriptComponent {
  @input("SceneObject[]")
  @hint("Array of icons depending on state")
  @allowUndefined
  _icons: SceneObject[] | undefined
    
  @input('int')
  @hint("The initial state of the button.")
  private _state: number = 0
    
  @input
  @hint(
    "Enable this to add functions from another script to this component's callback events"
  )
  editEventCallbacks: boolean = false
  @ui.group_start("On State Changed Callbacks")
  @showIf("editEventCallbacks")
  @input("Component.ScriptComponent")
  @hint("The script containing functions to be called on toggle state change")
  @allowUndefined
  private customFunctionForOnStateChanged: ScriptComponent | undefined
  @input
  @hint(
    "The names for the functions on the provided script, to be called on toggle state change"
  )
  @allowUndefined
  private onStateChangedFunctionNames: string[] = []
  @ui.group_end
  private interactable: Interactable | null = null

  private onStateChangedEvent = new ReplayEvent<number>()
  public readonly onStateChanged = this.onStateChangedEvent.publicApi()

  onAwake() {
    this.interactable = this.getSceneObject().getComponent(
      Interactable.getTypeName()
    )

    this.createEvent("OnStartEvent").bind(() => {
      if (!this.interactable) {
        throw new Error(
          "Multi Button requires an Interactable Component on the same Scene object in order to work - please ensure one is added."
        )
      }
      this.interactable.onTriggerEnd.add(() => {
        if (this.enabled) {
          this.switchState(null)
        }
      })

      this.onStateChangedEvent.invoke(this._state)
    })

    if (this.editEventCallbacks && this.customFunctionForOnStateChanged) {
      this.onStateChanged.add(
        createCallback<number>(
          this.customFunctionForOnStateChanged,
          this.onStateChangedFunctionNames
        )
      )
    }

    this.refreshVisual()
  }

  /**
   * Switches the state of the button
   */
  switch(state: number): void {
    this.switchState(state)
  }

  /**
   * @returns the current state of the button
   */
  get state(): number {
    return this._state
  }

  /**
   * @param state - the new state of the button, invoking the switch event if different than current state.
   */
  set state(state: number) {
    // Return if the requested state is the same as the current state (no change)
    if (state === this._state) {
      return
    }
    this.switchState(state)
  }

  private refreshVisual() {
    for(var i = 0; i < this._icons.length; i++){
        if(i == this._state){
            this._icons[i].enabled = true;
        }else{
            this._icons[i].enabled = false;
        }
    }
  }

  private switchState(state: number) {
    if(state){
        this._state = state
    }else{
        this._state = (this._state + 1) % this._icons.length
    }
    this.refreshVisual()
    this.onStateChangedEvent.invoke(this._state)
  }
}

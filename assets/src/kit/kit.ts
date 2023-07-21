import PlatformSystem from "./framework/platform/PlatformSystem";
import AudioManager from "./manager/AudioManager";
import EventManager from "./manager/EventManager";
import ResourcesManager from "./manager/ResourcesManager";
import PopupManager from "./manager/popupManager/PopupManager";

/**
 * cocos-kit
 */
export namespace kit {
    export const Audio = AudioManager;
    export const Event = EventManager;
    export const Resources: ResourcesManager = ResourcesManager.instance;
    export const Platform: PlatformSystem = PlatformSystem.instance;
    export const Popup = PopupManager;
}
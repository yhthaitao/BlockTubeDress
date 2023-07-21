import { kit } from "../../../../src/kit/kit";
import PopupBase from "../../../../src/kit/manager/popupManager/PopupBase";
import CConst from "../../../../src/config/CConst";

const { ccclass, property } = cc._decorator;
@ccclass
export default class Setting extends PopupBase {

    @property(cc.Node) uiSignOn: cc.Node = null;
    @property(cc.Node) uiSignOff: cc.Node = null;

    protected onLoad(): void { }

    protected start(): void {
        this.initUI();
    }

    async initUI() {
        this.uiSignOn.active = false;
        this.uiSignOff.active = false;
        let config = kit.Audio.config;
        if (config.isPlayMusic) {
            this.uiSignOn.active = true;
        }
        else {
            this.uiSignOff.active = true;
        }
    }

    /** 按钮事件 音频 */
    eventBtnSound() {
        kit.Audio.playEffect(CConst.sound_path_click);

        this.uiSignOn.active = false;
        this.uiSignOff.active = false;
        let config = kit.Audio.config;
        if (config.isPlayMusic) {
            kit.Audio.setIsSound(false);
            this.uiSignOff.active = true;
        }
        else {
            kit.Audio.setIsSound(true);
            kit.Audio.playMusic(CConst.sound_path_music);
            this.uiSignOn.active = true;
        }
    }

    eventBtnExit() {
        kit.Audio.playEffect(CConst.sound_path_click);
        kit.Popup.hide();
    }
}

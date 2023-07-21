import { kit } from "../../../../src/kit/kit";
import PopupBase from "../../../../src/kit/manager/popupManager/PopupBase";
import CConst from "../../../../src/config/CConst";
import DataManager, { LangChars } from "../../../../src/config/DataManager";

const { ccclass, property } = cc._decorator;
@ccclass
export default class SpecialQuit extends PopupBase {

    @property(cc.Node) labelTitle: cc.Node = null;
    @property(cc.Node) labelSure: cc.Node = null;

    protected onLoad(): void {
        this.initLabel();
    }

    async initLabel() {
        let charsTitle = await DataManager.getString(LangChars.QUIT);
        this.labelTitle.getComponent(cc.Label).string = charsTitle + '?';

        let charsSure = await DataManager.getString(LangChars.OK);
        this.labelSure.getComponent(cc.Label).string = charsSure;
    }

    isSure: boolean = false;
    protected onHide(suspended: boolean): void {
        if (this.isSure) {
            kit.Event.emit(CConst.event_enter_nextLevel, false, false);
        }
    }

    eventBtnSure() {
        kit.Audio.playEffect(CConst.sound_path_click);
        this.isSure = true;
        kit.Popup.hide();
    }

    eventBtnExit() {
        kit.Audio.playEffect(CConst.sound_path_click);
        this.isSure = false;
        kit.Popup.hide();
    }
}

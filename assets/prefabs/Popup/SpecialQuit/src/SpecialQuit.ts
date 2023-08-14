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

    initLabel() {
        DataManager.setString(LangChars.QUIT, (chars: string)=>{
            this.labelTitle.getComponent(cc.Label).string = chars + '?';
        });

        DataManager.setString(LangChars.OK, (chars: string)=>{
            this.labelSure.getComponent(cc.Label).string = chars;
        });
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

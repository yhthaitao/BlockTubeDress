import { kit } from "../../../../src/kit/kit";
import { PopupCacheMode } from "../../../../src/kit/manager/popupManager/PopupManager";
import Common from "../../../../src/config/Common";
import CConst from "../../../../src/config/CConst";
import DataManager, { LangChars } from "../../../../src/config/DataManager";

const { ccclass, property } = cc._decorator;
@ccclass
export default class MainMenu extends cc.Component {

    @property(cc.Node) mask: cc.Node = null;
    @property(cc.Node) content: cc.Node = null;
    @property(cc.Node) nodeTitle: cc.Node = null;
    @property(cc.Node) nodeUI: cc.Node = null;
    @property(cc.Node) btnSet: cc.Node = null;
    @property(cc.Node) labelLevel: cc.Node = null;

    async init(callback: Function = null){
        Common.log('MainMenu init()');

        this.mask.setContentSize(cc.winSize);
        this.content.setContentSize(cc.winSize);
        this.nodeTitle.y = DataManager.getTitlePosY();
        this.btnSet.y = cc.winSize.height * 0.5 - 100;
        
        this.nodeUI.opacity = 0;
        cc.tween(this.nodeUI).to(0.383, {opacity: 255}).call(()=>{
            callback && callback();
        }).start();

        let chars = await DataManager.getString(LangChars.LEVEL); 
        this.labelLevel.getComponent(cc.Label).string = chars + ':' + DataManager.data.sortData.level;
    }

    /** 按钮事件 设置 */
    eventBtnSet() {
        kit.Audio.playEffect(CConst.sound_path_click);
        kit.Popup.show(CConst.popup_path_setting, {}, { mode: PopupCacheMode.Frequent });
    }

    /** 按钮事件 进入游戏sort */
    eventBtnStart() {
        kit.Audio.playEffect(CConst.sound_path_click);
        kit.Event.emit(CConst.event_enter_gameSort);
    }
}

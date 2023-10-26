import {kit} from "../../../../src/kit/kit";
import PopupBase from "../../../../src/kit/manager/popupManager/PopupBase";
import CConst from "../../../../src/config/CConst";
import DataManager, {LangChars} from "../../../../src/config/DataManager";

const {ccclass, property} = cc._decorator;
@ccclass
export default class Achieve extends PopupBase {

    AchieveName = '';
    protected onLoad(): void {

    }

    btnAchieve() {
        // 设置领取按钮不显示
        // this.node.getChildByName('').active = false;
        // 更新领取的itme
        // this.node.getChildByName('num').getComponent(cc.Label).string = '';
    }
}

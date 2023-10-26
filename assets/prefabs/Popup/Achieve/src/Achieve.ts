import {kit} from "../../../../src/kit/kit";
import PopupBase from "../../../../src/kit/manager/popupManager/PopupBase";
import CConst from "../../../../src/config/CConst";
import DataManager, {LangChars} from "../../../../src/config/DataManager";

const {ccclass, property} = cc._decorator;
@ccclass
export default class Achieve extends PopupBase {

    @property(cc.Node) itemAchieve: cc.Node = null;
    itemList = [];
    protected onLoad(): void {

    }

    initUI() {
        this.itemList = [];
        // 已经领取的
        let sortLV = Math.floor(DataManager.data.achieve.sortLV / 10) * 10 + 10;
        let specialLV = Math.floor(DataManager.data.achieve.specialLV / 10) * 10 + 10;
        let matchLV = Math.floor(DataManager.data.achieve.matchLV / 10) * 10 + 10;
        let tubeNum = Math.floor(DataManager.data.achieve.tubeNum / 5) * 5 + 5;
        let returnNum = Math.floor(DataManager.data.achieve.returnNum / 5) * 5 + 5;
        // 设置UI显示内容
        this.setUIShow(sortLV, DataManager.data.sortData.level, 'sort');
        this.setUIShow(specialLV, DataManager.data.specialData.level, 'special');
        this.setUIShow(matchLV, DataManager.data.match.level, 'match');
        this.setUIShow(tubeNum, DataManager.data.useTube, 'tube');
        this.setUIShow(returnNum, DataManager.data.useReturn, 'return');
    }

    setUIShow(target, cur, name) {
        let itemAchieve = cc.instantiate(this.itemAchieve);
        itemAchieve.getChildByName('' + name).active = true;
        if (target > cur) {
            // 已经领取后的下一级目标大于当前完成的，则显示还差多少
            this.itemList.push(itemAchieve);
        } else {
            // 显示可以领取
            this.itemList.splice(0, 0, itemAchieve);
        }
    }
}

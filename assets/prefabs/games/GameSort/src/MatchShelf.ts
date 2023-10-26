import {kit} from "../../../../src/kit/kit";
import Common from "../../../../src/config/Common";
import CConst from "../../../../src/config/CConst";
import SortBlock from "./SortBlock";
import DataManager from "../../../../src/config/DataManager";

const {ccclass, property} = cc._decorator;
@ccclass
export default class SortTube extends cc.Component {

    @property(cc.Node) nodeMain: cc.Node = null;// 动物父节点
    @property(cc.Node) imgBg: cc.Node = null;// 货架背景
    @property(cc.Node) imgMask: cc.Node = null;// 货架遮挡

    hStart: number = 40;// 瓶子放小动物 开始的长度
    hDis: number = 15;// 小动物之间的间距
    zIndexInit: number = 0;
    shelf_id: number = 0; //板子所在数组的位置

    init(blockNum: number) {
        this.node.stopAllActions();
        this.node.scale = 1;
        this.node.opacity = 255;
        this.clearBlocks();
    };

    initName(namePre: string, index: number) {
        this.zIndexInit = index;
        this.node.name = namePre + index;
        this.shelf_id = index;
    };

    resetIndex() {
        this.node.zIndex = this.zIndexInit;
    }


    getScriptMain() {
        let gameMain = this.node.parent.parent;
        if (gameMain) {
            return gameMain.getComponent('GameMatch');
        }
        return null;
    }

    clearBlocks(): void {
        for (let index = this.nodeMain.childrenCount - 1; index >= 0; index--) {
            this.nodeMain.children[index].destroy();
        }
    };

    clearShelf(): void {
        let self = this;
        let scriptMain = this.getScriptMain();
        for (let index = this.nodeMain.childrenCount - 1; index >= 0; index--) {
            let tubeMain = this.nodeMain.children[index].getChildByName('main');
            if (tubeMain.childrenCount > 0) return;
        }
        cc.tween(this.node).to(0.383, {opacity: 0, scale: 0}).call(function () {
            // DataManager.poolPut(self.node, scriptMain.poolMatchShelf);
        }).start();
    };

}
import {kit} from "../../../../src/kit/kit";
import Common from "../../../../src/config/Common";
import CConst from "../../../../src/config/CConst";
import SortTube from "./SortTube";
import {DataMove} from "./GameSort";

const {ccclass, property} = cc._decorator;
@ccclass
export default class SortBlock extends cc.Component {

    @property(cc.Node) nodeIcon: cc.Node = null;
    @property([cc.SpriteFrame]) textures: cc.SpriteFrame[] = [];
    @property(cc.Node) nodeCover: cc.Node = null;

    number: number = 0;
    isCover: boolean = false;

    width: number = 131;
    height: number = 99;

    shelf_id: number = 0; //block 几个板子里面的哪个
    tube_id: number = 0; //block  几个tube 中的哪个
    block_id: number = 0;//block tube 中的位置
    localParent: cc.Node = null;//最开始的父节点是谁

    init(type: number, cover: boolean) {
        this.node.stopAllActions();
        this.node.position = cc.v3(0, 0);
        this.node.scale = 1;
        this.node.opacity = 255;
        this.setColor(type);
        this.setCover(cover);
    };

    setColor(tNumber) {
        this.number = tNumber;
        let length = this.textures.length;
        if (this.number < 1) {
            this.number = 1;
        } else if (this.number > length) {
            this.number = length;
        }
        this.nodeIcon.getComponent(cc.Sprite).spriteFrame = this.textures[this.number - 1];
        this.nodeIcon.width = this.width;
        this.nodeIcon.height = this.height;
    };

    setCover(cover) {
        this.isCover = cover;
        this.nodeCover.opacity = this.isCover ? 255 : 0;
        if (this.nodeCover.opacity == 255) {
            this.nodeCover.width = this.width;
            this.nodeCover.height = this.height;
        }
    };

    hideCover() {
        this.isCover = false;
        this.nodeCover.opacity = 255;
        cc.tween(this.nodeCover).to(0.383, {opacity: 0}, cc.easeSineInOut()).start();
    };

    playAni() {
        // let animation = this.dragon.getComponent(dragonBones.ArmatureDisplay);
        // animation.timeScale = 1;
        // animation.playAnimation(this.actName, 1);
    };

    /** 返回到地图中取 */
    returnMap(localParent) {
        console.log("===localParent==", localParent)
        let scriptTube = localParent.getComponent("MatchTube");
        this.node.opacity = 255;
        this.node.zIndex = scriptTube.nodeMain.childrenCount;
        this.node.x = 0;
        this.node.y = -scriptTube.hStart + scriptTube.hDis * scriptTube.nodeMain.childrenCount;
        this.node.parent = scriptTube.nodeMain;
        cc.tween(this.node).to(0.02, {scale: 1}).start()
        // 再处理一下之前是覆盖的，现在都恢复回去
    };
}
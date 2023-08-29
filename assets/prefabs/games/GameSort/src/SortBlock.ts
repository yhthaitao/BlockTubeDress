import {kit} from "../../../../src/kit/kit";
import Common from "../../../../src/config/Common";
import CConst from "../../../../src/config/CConst";
import SortTube from "./SortTube";
import {DataMove} from "./GameSort";

const {ccclass, property} = cc._decorator;
@ccclass
export default class SortBlock extends cc.Component {

    @property(cc.Node) dragon: cc.Node = null;
    @property(cc.Node) nodeCover: cc.Node = null;
    @property(cc.Node) nodeUp: cc.Node = null;

    dress = [
        'hongyi', 'huangyi', 'lvyi', 'lanyi', 'ziyi', 'heiyi', 'baiyi', 'qingyi', 'juyi', 'tuhuang', 'yinguanglv'
    ];
    dress1 = [
        'hong', 'huang', 'lan', 'lv', 'zi', 'ju', 'qing', 'yingguanglv', 'fenzi', 'tuhuang', 'bai', 'qianqing'
    ];
    dataDress = [];
    actName = 'newAnimation';

    number: number = 0;
    isCover: boolean = false;

    init(type: number, cover: boolean) {
        this.dataDress = this.dress1;
        this.setColor(type);
        this.setCover(cover);
    };

    setColor(tNumber) {
        this.number = tNumber;
        let length = this.dataDress.length;
        if (this.number < 1) {
            this.number = 1;
        } else if (this.number > length) {
            this.number = length;
        }
        let animation = this.dragon.getComponent(dragonBones.ArmatureDisplay);
        animation.armatureName = this.dataDress[this.number - 1];
        animation.timeScale = 0;
        animation.playAnimation(this.actName, 1);
    };

    setCover(cover) {
        this.isCover = cover;
        if (this.isCover) {
            this.dragon.scale = 0;
            this.nodeCover.scale = 1;
        } else {
            this.dragon.scale = 1;
            this.nodeCover.scale = 0;
        }
    };

    hideCover() {
        this.isCover = false;
        this.dragon.scale = 0;
        cc.tween(this.dragon).to(0.383, {scale: 1}, cc.easeSineInOut()).start();
        this.nodeCover.scale = 1;
        cc.tween(this.nodeCover).to(0.253, {scale: 0}, cc.easeSineInOut()).start();
    };

    playAni() {
        let animation = this.dragon.getComponent(dragonBones.ArmatureDisplay);
        animation.timeScale = 1;
        animation.playAnimation(this.actName, 1);
    };

    /** 移动 */
    fly(objMove: DataMove, oldTube: cc.Node, newTube: cc.Node, baseTime, baseDis, nodeGame: cc.Node, adFunc: any): Promise<void> {
        let timeOld = Common.getMoveTime(objMove.old_p_start, objMove.old_p_finish, baseTime, baseDis);
        if (timeOld > 0.12) timeOld = 0.12
        // console.log("====timeOld===", timeOld)
        let timeGamePre = Common.getMoveTime(objMove.game_p_start, objMove.game_p_mid, baseTime, baseDis) * 0.7;
        let timeGameNext = Common.getMoveTime(objMove.game_p_mid, objMove.game_p_finish, baseTime, baseDis) * 0.7;
        // console.log("====过程中===", timeGamePre + timeGameNext)
        let timeNew = Common.getMoveTime(objMove.new_p_start, objMove.new_p_finish, baseTime, baseDis);
        let oldTubeScript = oldTube.getComponent(SortTube);
        let newTubeScript = newTube.getComponent(SortTube);
        let scaleTube = oldTube.scale;
        let scaleBlock = this.node.scale;
        let timeFinish = 0.08
        return new Promise(res => {
            cc.tween(this.node).to(timeOld, {position: objMove.old_p_finish}).call(() => {
                kit.Audio.playEffect(CConst.sound_path_ballSort);
                this.node.parent = nodeGame;
                this.node.position = objMove.game_p_start;
                this.node.scale = scaleTube;
                res();
            }).to(timeGamePre, {position: objMove.game_p_mid}).call(() => {
                // res();
            }).to(timeGameNext, {position: objMove.game_p_finish}).call(() => {
                this.playAni();
                this.node.parent = newTubeScript.nodeMain;
                this.node.position = objMove.new_p_start;
                this.node.scale = scaleBlock;
                this.node.zIndex = newTubeScript.nodeMain.childrenCount - 1;
                newTube.zIndex = 200;
            }).call(() => {
                newTube.getComponent('SortTube').isPutting = true;
                // console.log("======不可抬起=", newTube.name, "==isPutting==", newTube.getComponent('SortTube').isPutting)
                if (typeof adFunc == "function" && cc.isValid(adFunc)) adFunc();
                // console.log("=====放下的时间==", timeFinish)
            }).to(timeFinish, {position: objMove.new_p_finish}, cc.easeSineOut()).call(() => {
                oldTubeScript.resetIndex();
                newTubeScript.resetIndex();
                newTubeScript.zIndexBlocks();
                objMove.callback && objMove.callback();
            }).start();
        });
    };
}
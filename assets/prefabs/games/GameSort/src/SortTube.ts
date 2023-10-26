import {kit} from "../../../../src/kit/kit";
import Common from "../../../../src/config/Common";
import CConst from "../../../../src/config/CConst";
import SortBlock from "./SortBlock";

const {ccclass, property} = cc._decorator;
@ccclass
export default class SortTube extends cc.Component {

    @property(cc.Node) labelTip: cc.Node = null;// 提示节点
    @property(cc.Node) nodeMain: cc.Node = null;// 动物父节点
    @property(cc.Node) nodeMainUp: cc.Node = null;// 瓶子上层
    @property(cc.Node) nodeUI: cc.Node = null;// 瓶子上层
    @property(cc.Node) particle: cc.Node = null;// 锁定效果
    @property(cc.Node) dragon: cc.Node = null;// 星星闪烁

    hStart: number = 40;// 瓶子放小动物 开始的长度
    hEnd: number = 40;// 瓶子放完小动物 多出的长度
    hDis: number = 40;// 小动物之间的间距
    hElse: number = 180;// 点击范围增加
    zIndexInit: number = 0;
    isMovingTube: boolean = false;//瓶子是否正在移动
    isPutting: boolean = false;//瓶子是否正在放入羽毛球

    init(blockNum: number) {
        this.node.stopAllActions();
        let uiBottom = this.nodeUI.getChildByName('bottom');
        let uiMid = this.nodeUI.getChildByName('mid');
        let uiTop = this.nodeUI.getChildByName('top');
        uiMid.height = this.hStart + this.hDis * (blockNum - 1) + this.hEnd;
        uiTop.y = -uiBottom.height * 0.5 - uiMid.height - uiTop.height * 0.5;
        this.nodeUI.height = uiBottom.height * 0.5 + uiMid.height + uiTop.height + this.hElse;

        // 触摸区域
        let sprite = this.nodeUI.getChildByName('sprite');
        sprite.width = this.nodeUI.width;
        sprite.height = this.nodeUI.height;
        sprite.opacity = 0;

        this.particle.opacity = 0;
        this.isMovingTube = false;//瓶子是否正在移动
        this.isPutting = false;
        this.particle.y = -this.nodeUI.height * 0.1;
        this.dragon.opacity = 0;
        this.dragon.y = -this.nodeUI.height * 0.45;

        this.clearBlocks();
    };

    initName(namePre: string, index: number) {
        this.zIndexInit = index;
        this.node.name = namePre + index;
    };

    resetIndex() {
        this.node.zIndex = this.zIndexInit;
    }

    eventBtn() {
        let scriptMain = this.getScriptMain();
        if (scriptMain) {
            let isEnough = this.checkIsEnough(scriptMain.dataObj.blockTotal);
            if (isEnough) {
                Common.log(' 瓶子已满 name: ', this.node.name);
            } else {
                // console.log("===eventBtn===", this.node.name, '==isMovingTube==', this.isMovingTube)
                if (!this.isMovingTube) {
                    scriptMain.eventTouchTube(this.node);
                }
            }
        } else {
            Common.log(' 异常 找不到脚本 scriptMain ');
            return;
        }
    };

    protected update(dt: number): void {
        let length = this.nodeMain.childrenCount;
        this.nodeMainUp.children.forEach((item: cc.Node, index: number) => {
            if (index < length) {
                item.opacity = 255;
                item.position = this.nodeMain.children[index].position;
            } else {
                item.opacity = 0;
            }
        });
    }

    /** 瓶子选中效果 */
    tubeSelect(isSelect) {
        // let opaStart = isSelect ? 0 : 255;
        // let opaFinish = isSelect ? 255 : 0;
        // this.nodeLight.opacity = opaStart;
        // cc.tween(this.nodeLight).to(.383, {opacity: opaFinish}).start();
    };

    /** 瓶子时满的 不能移动 */
    tubeFull() {
        this.nodeMain.children.forEach((block) => {
            block.getComponent(SortBlock).playAni();
        });

        this.labelTip.opacity = 0;
        let anim = this.labelTip.getComponent(cc.Animation);
        anim.once(cc.Animation.EventType.FINISHED, () => {
            this.labelTip.opacity = 0;
        }, this);
        anim.setCurrentTime(0);
        anim.play();
    };

    /** 瓶子锁定效果 */
    tubesuccess(blocksTotal: number): Promise<boolean> {
        return new Promise(res => {
            // 第一个条件 4个小动物
            let isTubeEnough = this.checkIsEnough(blocksTotal);
            if (isTubeEnough) {
                kit.Audio.playEffect(CConst.sound_path_finish);
                this.particle.opacity = 255;
                this.particle.getComponent(cc.ParticleSystem).resetSystem();

                this.dragon.opacity = 0;
                cc.tween(this.dragon).delay(0.6).call(() => {
                    res(true);
                }).to(0.4, {opacity: 255}).start();
            } else {
                res(false);
            }
        });
    };

    checkIsEnough(blocksTotal) {
        // 第一个条件 4个小动物
        let isTubeEnough = this.nodeMain.childrenCount == blocksTotal;
        if (isTubeEnough) {
            // 第二个条件 小动物种类一致
            let blockOne = this.nodeMain.children[0];
            let blockNum = blockOne.getComponent(SortBlock).number;
            for (let i = 0; i < blocksTotal; i++) {
                let blockI = this.nodeMain.children[i];
                let scriptI = blockI.getComponent(SortBlock);
                if (scriptI.isCover || scriptI.number != blockNum) {
                    isTubeEnough = false;
                    break;
                }
            }
        }
        return isTubeEnough;
    };

    getScriptMain() {
        let gameMain = null;
        let tubeMain = this.node.parent;
        if (tubeMain) {
            gameMain = tubeMain.parent;
        }
        if (gameMain) {
            return gameMain.getComponent('GameSort');
        }
        return null;
    }

    clearBlocks(): void {
        for (let index = this.nodeMain.childrenCount - 1; index >= 0; index--) {
            this.nodeMain.children[index].destroy();
        }
    };

    getBlockTop() {
        let block: cc.Node;
        let blocks = Common.getArrByPosY(this.nodeMain);
        let length = blocks.length;
        if (length > 0) {
            block = blocks[length - 1];
        } else {
            block = null;
        }
        return block;
    };

    getCoverBlockTop() {
        let block: cc.Node;
        let covers = []
        let blocks = Common.getArrByPosY(this.nodeMain);
        let length = blocks.length;
        if (length > 0) {
            block = blocks[blocks.length - 1];
            let blockScript: SortBlock = block.getComponent(SortBlock);
            covers = [block]

            for (let i = blocks.length - 1; i >= 0; i--) {
                if (i != blocks.length - 1) {
                    let newScript: SortBlock = blocks[i].getComponent(SortBlock);
                    if (blockScript.number == newScript.number) {
                        covers.push(blocks[i])
                    } else break;
                }
            }
        }
        return covers;
    };

    initCover() {
        let blocks = Common.getArrByPosY(this.nodeMain);
        for (let index = 0, length = blocks.length; index < length; index++) {
            const block = blocks[index];
            let scriptBlock = block.getComponent('SortBlock');
            scriptBlock.setCover(index == length - 1 ? false : true);
        }
    };

    getTubeHeight() {
        return this.nodeUI.height - this.hElse;
    }

    hideBlockTopCover() {
        // console.log("===hideBlockTopCover===", this.node.name)
        let blockTop = this.getCoverBlockTop();
        // console.log("===blockTop===", blockTop)
        if (blockTop.length > 0) {
            for (let i = 0; i < blockTop.length; i++) {
                let scriptBlock = blockTop[i].getComponent('SortBlock');
                if (scriptBlock.isCover) {
                    scriptBlock.hideCover();
                }
            }
        }
    };

    zIndexBlocks(): void {
        // 衣服是 zIndex越大，y越小
        for (let index = this.nodeMain.childrenCount - 1; index >= 0; index--) {
            // this.nodeMain.children[index].zIndex = index;
            // this.nodeMain.children[index].y = -this.hStart - this.hDis * index;
            this.nodeMain.children[index].zIndex = this.nodeMain.children[index].getComponent(SortBlock).indexNumber - 1;
            this.nodeMain.children[index].y = -this.hStart - this.hDis * (this.nodeMain.children[index].getComponent(SortBlock).indexNumber - 1);
            // console.log("==2======indexNumber===", this.nodeMain.children[index].getComponent(SortBlock).indexNumber, ",index=", index, "=y==", this.nodeMain.children[index].y, "=zIndex==", this.nodeMain.children[index].zIndex)
        }
    };
}
import {kit} from "../../../../src/kit/kit";
import Common from "../../../../src/config/Common";
import CConst from "../../../../src/config/CConst";
import SortBlock from "./SortBlock";
import DragonBones = dragonBones.DragonBones;
import DataManager from "../../../../src/config/DataManager";

const {ccclass, property} = cc._decorator;
@ccclass
export default class SortTube extends cc.Component {

    @property(cc.Node) nodeMain: cc.Node = null;// 动物父节点
    @property(cc.Node) nodeClick: cc.Node = null;// 动物父节点

    hStart: number = 13;// 瓶子放小动物 开始的长度
    hDis: number = 16;// 小动物之间的间距；
    zIndexInit: number = 0;

    isMovingTube: boolean = false;//瓶子是否正在移动
    isPutting: boolean = false;//瓶子是否正在放入羽毛球

    shelf_id: number = 0; //tube 几个板子里面的哪个
    tube_id: number = 0; //tube  板子 中的哪个

    init(blockNum: number) {
        this.node.position = cc.v3(0, 0);
        this.node.scale = 1;
        this.node.opacity = 255;

        // 触摸区域
        if (this.nodeMain.childrenCount > 0) {
            this.nodeClick.width = this.nodeMain.children[0].width;
            this.nodeClick.height = this.nodeMain.children[0].height + this.nodeMain.childrenCount * this.hDis;
        }
        this.isMovingTube = false;//瓶子是否正在移动
        this.isPutting = false;

        this.clearBlocks();
    };

    initName(namePre: string, index: number) {
        this.zIndexInit = index;
        this.node.name = namePre + index;
        this.tube_id = index;
    };

    resetIndex() {
        this.node.zIndex = this.zIndexInit;
    }

    resetBlockPos(block) {
        // 判断下 这个block上面还有没有 block，有的话，就调整一下位置
        let scriptBlock = block.getComponent("MatchBlock");
        if (scriptBlock.block_id < 3) {
            for (let i = 0; i < this.nodeMain.childrenCount; i++) {
                let blockOne = this.nodeMain.children[i];
                let blockOneJS = blockOne.getComponent("MatchBlock");
                if (blockOneJS.block_id > scriptBlock.block_id) {
                    let target_y = blockOne.y - this.hDis;
                    cc.tween(blockOne).to(0.02, {y: target_y}).start();
                }
            }
        }
    }

    eventBtn() {
        let scriptMain = this.getScriptMain();
        if (scriptMain) {
            let isEnough = this.nodeMain.childrenCount == 0;
            if (isEnough) {
                Common.log(' tube空了 name: ', this.node.name);
            } else {
                console.log("===eventBtn===", this.node.name, '==isMovingTube==', this.isMovingTube)
                if (!this.isMovingTube) {
                    this.checkSaveSpace();
                }
            }
        } else {
            Common.log(' 异常 找不到脚本 scriptMain ');
            return;
        }
    };


    /** 检测剩余位置，如果有位置，则把最顶部的移动，并存储移动的block */
    checkSaveSpace() {
        let self = this;
        let scriptMain = this.getScriptMain();
        if (scriptMain.SaveCount.length == 7) {
            return false;
        }
        let block = this.getBlockTop();
        if (!scriptMain.SaveCount.includes(block)) {
            // 移动过去
            kit.Audio.playEffect(CConst.sound_path_click);
            this.sortSaveSpaceColor(block);
            let pos = block.convertToWorldSpaceAR(scriptMain.nodeMain);
            let newPosition = scriptMain.nodeMain.convertToNodeSpaceAR(pos);
            block.parent = scriptMain.SaveSpaceMain;//抬起，必须放这里面，方便返回去用。
            block.position = cc.v3(newPosition.x, newPosition.y - scriptMain.SaveSpaceMain.y);
            // 获取应该飞向SaveSpaceMain 的x坐标
            let indexToRemove = scriptMain.SaveCount.indexOf(block);
            let targetX = scriptMain.SavePos[indexToRemove];
            let scriptBlock = block.getComponent("MatchBlock");
            // 添加进去刚刚点击过的，返回时候直接处理这个就可以。并用这个去判断这个以前下面的block是否是cover的
            let obj = {
                type: "move", data:
                    [{
                        shelf_id: scriptBlock.shelf_id,
                        tube_id: scriptBlock.tube_id,
                        block_id: scriptBlock.block_id,
                        number: scriptBlock.number,
                        localParent: scriptBlock.localParent,
                    }]
            }
            // console.log("obj=move==", obj)
            scriptMain.fanhuidata.push(obj)
            cc.tween(block).to(0.2, {position: cc.v3(targetX, -3), scale: 0.5})
                .call(function () {
                    self.hideBlockTopCover();//解除遮盖
                    self.checkMatchBlock();//看是否有可以消除的
                })
                .start();
            for (let i = 0; i < scriptMain.SaveCount.length; i++) {
                if (scriptMain.SaveCount[i] != block) {
                    let index = scriptMain.SaveCount.indexOf(scriptMain.SaveCount[i]);
                    let xx = scriptMain.SavePos[index];
                    if (xx != scriptMain.SaveCount[i].x) {
                        cc.tween(scriptMain.SaveCount[i])
                            .to(0.16, {position: cc.v3(xx, -3), scale: 0.5})
                            .start()
                    }
                }
            }
        }
    }

    /** 移动指定的 block */
    moveTargetBlock(block) {
        let self = this;
        let scriptMain = this.getScriptMain();
        // 移动过去
        this.sortSaveSpaceColor(block);
        let pos = block.convertToWorldSpaceAR(scriptMain.nodeMain);
        let newPosition = scriptMain.nodeMain.convertToNodeSpaceAR(pos);
        block.parent = scriptMain.SaveSpaceMain;//抬起，必须放这里面，方便返回去用。
        block.position = cc.v3(newPosition.x, newPosition.y - scriptMain.SaveSpaceMain.y);
        // 获取应该飞向SaveSpaceMain 的x坐标
        let indexToRemove = scriptMain.SaveCount.indexOf(block);
        let targetX = scriptMain.SavePos[indexToRemove];
        let scriptBlock = block.getComponent("MatchBlock");
        // 添加进去刚刚点击过的，返回时候直接处理这个就可以。并用这个去判断这个以前下面的block是否是cover的
        let obj = {
            type: "move", data:
                [{
                    shelf_id: scriptBlock.shelf_id,
                    tube_id: scriptBlock.tube_id,
                    block_id: scriptBlock.block_id,
                    number: scriptBlock.number,
                    localParent: scriptBlock.localParent,
                }]
        }
        console.log("obj=move==", obj)
        scriptMain.fanhuidata.push(obj);
        this.resetBlockPos(block);
        cc.tween(block).to(0.2, {position: cc.v3(targetX, -3), scale: 0.5})
            .call(function () {
                self.hideBlockTopCover();//解除遮盖
                self.checkMatchBlock();//看是否有可以消除的
            })
            .start();
        for (let i = 0; i < scriptMain.SaveCount.length; i++) {
            if (scriptMain.SaveCount[i] != block) {
                let index = scriptMain.SaveCount.indexOf(scriptMain.SaveCount[i]);
                let xx = scriptMain.SavePos[index];
                if (xx != scriptMain.SaveCount[i].x) {
                    cc.tween(scriptMain.SaveCount[i])
                        .to(0.16, {position: cc.v3(xx, -3), scale: 0.5})
                        .start()
                }
            }
        }
    }

    /** 移动到底部，并拍一下位置 */
    sortSaveSpaceColor(block) {
        let scriptMain = this.getScriptMain();
        if (scriptMain.SaveCount.length == 0) {
            scriptMain.SaveCount.push(block);
        } else {
            let colorIndex = scriptMain.SaveCount.length;
            let blockNumber = block.getComponent('MatchBlock').number
            for (let i = 0; i < scriptMain.SaveCount.length; i++) {
                let number = scriptMain.SaveCount[i].getComponent('MatchBlock').number
                if (blockNumber == number) {
                    colorIndex = i + 1;
                }
            }
            scriptMain.SaveCount.splice(colorIndex, 0, block);
        }
    }

    /** 检测是否有满足3个的，并把三个消除 */
    checkMatchBlock() {
        console.log("======checkMatchBlock=====")
        let scriptMain = this.getScriptMain();
        let numberCounts = {}
        if (scriptMain.SaveCount.length == 0) return;
        for (let i = 0; i < scriptMain.SaveCount.length; i++) {
            let block = scriptMain.SaveCount[i]
            let number = block.getComponent('MatchBlock').number
            if (numberCounts[number]) {
                numberCounts[number].push(block);
            } else {
                numberCounts[number] = [block];
            }
            if (numberCounts[number].length >= 3) {
                this.destroyAnim(numberCounts[number])
                return;
            }
        }
        if (scriptMain.SaveCount.length == 7) {
            this.scheduleOnce(function () {
                scriptMain.matchGameOver();
            }, 0.1)
        }
    }

    /** 销毁动画以及 存储销毁掉的block */
    destroyAnim(numberCounts) {
        let self = this;
        let scriptMain = this.getScriptMain();
        scriptMain.destroyAnim.getChildByName('anim').x = numberCounts[1].x;
        // 消除也存一下，返回时候把消除的还要恢复回去
        let obj = {
            type: "destroy", data: []
        }
        for (let i = 0; i < numberCounts.length; i++) {
            let block = numberCounts[i];
            let indexToRemove = scriptMain.SaveCount.indexOf(block);
            console.log("==indexToRemove=", indexToRemove);
            // 把存储在列表里面的数先移除了，避免放置太快起冲突
            scriptMain.SaveCount.splice(indexToRemove, 1);
            block.parent = scriptMain.destroyAnim;
            let blockJS = block.getComponent("MatchBlock");
            let obj_one = {
                shelf_id: blockJS.shelf_id,
                tube_id: blockJS.tube_id,
                block_id: blockJS.block_id,
                number: blockJS.number,
                localParent: blockJS.localParent,
            }
            obj.data.push(obj_one)
            cc.tween(block).to(0.2, {x: numberCounts[1].x}).call(function () {
                DataManager.poolPut(block, scriptMain.poolMatchBlock);
            }).start()
        }
        // console.log("obj=destroy==", obj)
        scriptMain.fanhuidata.push(obj)
        cc.tween(scriptMain.destroyAnim).delay(0.16).call(function () {
            scriptMain.destroyAnim.getChildByName('anim').active = true;
            self.moveSaveSpace();
            let animation = scriptMain.destroyAnim.getChildByName('anim').getComponent(dragonBones.ArmatureDisplay);
            animation.once(dragonBones.EventObject.COMPLETE, function () {
                scriptMain.destroyAnim.getChildByName('anim').active = false;
                // 判断是否需要隐藏
                // let MatchShelfJS = self.node.parent.parent.getComponent('MatchShelf');
                // MatchShelfJS.clearShelf();
                scriptMain.checkLevelFinish();
            });
            kit.Audio.playEffect(CConst.sound_path_clean);
            animation.playAnimation('yundong', 1);
        }).start()
    }

    /** 底部移动一下，挨近了 */
    moveSaveSpace() {
        let scriptMain = this.getScriptMain();
        for (let i = 0; i < scriptMain.SaveCount.length; i++) {
            let index = scriptMain.SaveCount.indexOf(scriptMain.SaveCount[i]);
            let xx = scriptMain.SavePos[index];
            if (xx != scriptMain.SaveCount[i].x) {
                cc.tween(scriptMain.SaveCount[i])
                    .to(0.16, {position: cc.v3(xx, -3), scale: 0.5})
                    .start()
            }
        }
    }

    /** 瓶子选中效果 */
    tubeSelect(isSelect) {
        // let opaStart = isSelect ? 0 : 255;
        // let opaFinish = isSelect ? 255 : 0;
        // this.nodeLight.opacity = opaStart;
        // cc.tween(this.nodeLight).to(.383, {opacity: opaFinish}).start();
    };

    getScriptMain() {
        let gameMain = null;
        let tubeMain = this.node.parent.parent;
        if (tubeMain) {
            gameMain = tubeMain.parent.parent;
        }
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

    getBlockTop() {
        let block: cc.Node;
        let blocks = Common.getArrByPosY(this.nodeMain);
        let length = blocks.length;
        if (length > 0) {
            block = blocks[0];
        } else {
            block = null;
        }
        return block;
    };

    getCoverBlockTop() {
        let block: cc.Node;
        let covers = [];
        let blocks = Common.getArrByPosY(this.nodeMain);
        let length = blocks.length;
        if (length > 0) {
            block = blocks[0];
            covers = [block];
        }
        return covers;
    };

    initCover() {
        let blocks = Common.getArrByPosY(this.nodeMain);
        for (let index = 0, length = blocks.length; index < length; index++) {
            const block = blocks[index];
            let scriptBlock = block.getComponent('MatchBlock');
            scriptBlock.setCover(index == length - 1 ? false : true);
        }
    };

    hideBlockTopCover() {
        // console.log("===hideBlockTopCover===", this.node.name)
        let blockTop = this.getCoverBlockTop();
        // console.log("===blockTop===", blockTop)
        if (blockTop.length > 0) {
            for (let i = 0; i < blockTop.length; i++) {
                let scriptBlock = blockTop[i].getComponent('MatchBlock');
                if (scriptBlock.isCover) {
                    scriptBlock.hideCover();
                }
            }
        }
    };

    zIndexBlocks(): void {
        for (let index = this.nodeMain.childrenCount - 1; index >= 0; index--) {
            this.nodeMain.children[index].zIndex = index;
            this.nodeMain.children[index].y = -this.hStart + this.hDis * index;
        }
    };
}
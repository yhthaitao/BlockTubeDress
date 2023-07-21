import { kit } from "../../../../src/kit/kit";
import { PopupCacheMode } from "../../../../src/kit/manager/popupManager/PopupManager";
import Common from "../../../../src/config/Common";
import CConst from "../../../../src/config/CConst";
import GameDot from "../../../../src/config/GameDot";
import NativeCall from "../../../../src/config/NativeCall";
import DataManager, { LangChars } from "../../../../src/config/DataManager";
import SortTube from "./SortTube";
import SortBlock from "./SortBlock";
import SortTubePos from "./SortTubePos";
/** sort关卡数据 */
interface SortLevelData {
    /** 关卡编号 */
    id: number;
    /** 瓶子数量 */
    tube: number;
    /** 瓶子内小球数据 */
    balls: number[];
    /** 瓶子内小球数量 */
    number?: number;
}

/** sort关卡数据 */
interface BlockObj {
    /** 小动物类型 */
    number: number;
    /** 是否遮挡 */
    isCover: boolean;
}

interface ObjTube {
    startPos: { x: number, y: number, scale: number },
    arrDis: { xDis: number, yDis: number, col: number }[]
}

/** 小动物移动数据 */
export interface DataMove {
    old_p_start: cc.Vec3,
    old_p_finish: cc.Vec3,
    game_p_start: cc.Vec3,
    game_p_mid: cc.Vec3,
    game_p_finish: cc.Vec3,
    new_p_start: cc.Vec3,
    new_p_finish: cc.Vec3,
    moveNum: number,
    blocksNum: number,
    callback?: Function,
}

const { ccclass, property } = cc._decorator;
@ccclass
export default class GameSort extends cc.Component {

    @property(cc.Node) maskTop: cc.Node = null;// 顶部屏蔽
    @property(cc.Node) maskBottom: cc.Node = null;// 底部屏蔽
    @property(cc.Node) nodeMain: cc.Node = null;// 瓶子父节点
    @property(cc.Node) uiTop: cc.Node = null;// 底部节点
    @property(cc.Node) btnSet: cc.Node = null;// 按钮：返回菜单
    @property(cc.Node) btnBack: cc.Node = null;// 按钮：返回菜单
    @property(cc.Node) btnAddTube: cc.Node = null;// 按钮：添加瓶子
    @property(cc.Node) btnReturn: cc.Node = null;// 按钮：返回上一步
    @property(cc.Node) labelLevel: cc.Node = null;// 关卡等级
    @property(cc.Prefab) preTube: cc.Prefab = null;// 预制体：瓶子
    @property(cc.Prefab) preBlock: cc.Prefab = null;// 预制体：动物

    resPath = {
        levelPath: { bundle: 'prefabs', path: './games/GameSort/res/level/SortLevel' },
    }
    /** 是否为特殊关卡 */
    isLevelSpecial: boolean = false;
    /** 是否遮挡小动物 */
    isCoverBlock: boolean = false;

    /**
     * 游戏用数据
     * @param blockNum 每个瓶子的小动物
     * @param stepCount 步数统计
     * @param passTime 通关用时
     * @param returnCount 回退道具数量
     * @param addHeight 小动物提起距离
     * @param isMoving 是否正在移动
     * @param isFinish 游戏是否结束
     * @param tubeOld 提起的瓶子
     * @returns 
     */
    dataObj = {
        blockTotal: 0,
        stepCount: 0,
        passTime: 0,
        returnCount: 0,
        addHeight: 0,
        isMoving: false,
        isFinish: false,
        tubeOld: null,
    };
    levelData: SortLevelData[] = [];
    fanhuidata: { tubeNum: number, blocksObj: BlockObj[] }[] = [];

    baseTime = 1;// 基础时间 用于计算移动时间
    baseDis = 2000;// 基础距离 用于计算移动时间
    tubeName: string = 'tubePre';
    poolTube: cc.NodePool = null;
    poolBlock: cc.NodePool = null;

    protected onLoad(): void {
        Common.log('GameSort onLoad()');
        this.listernerRegist();
    }

    protected start(): void {
        this.poolTube = new cc.NodePool();//管子对象池
        this.poolBlock = new cc.NodePool();//动物对象池

        // 初始ui
        this.nodeMain.opacity = 0;
        this.maskTop.setContentSize(cc.winSize);
        this.maskTop.active = true;
        this.maskBottom.setContentSize(cc.winSize);
        this.maskBottom.active = false;

        this.enterLevel(false, true);
    }

    /**
     * 关卡入口
     * @param isSpecial 当前是否是特殊关卡
     * @param isCheck 是否需要检测特殊关卡
     */
    async enterLevel(isSpecial, isCheck) {
        NativeCall.logEventOne(GameDot.dot_levelStart);
        NativeCall.logEventOne(GameDot.dot_sortStart);
        //游戏初始化
        this.cleanTube();
        this.initData();
        await this.initUI(isSpecial);
        let asset: cc.JsonAsset = await this.loadLevel(isSpecial);
        this.initLevel(asset.json, isSpecial, isCheck);
        this.playAniNotMove();// 游戏重新开始之后，ui不再跳
        NativeCall.showBanner();
    }

    initData() {
        this.dataObj = {
            blockTotal: 4,
            stepCount: 0,
            passTime: new Date().getTime(),
            returnCount: 5,
            addHeight: 50,
            isMoving: false,
            isFinish: false,
            tubeOld: null,
        };
        this.fanhuidata = [];
    }

    async initUI(isSpecial) {
        this.uiTop.y = cc.winSize.height * 0.5 - 100;
        // 更新按钮状态ui
        this.btnSet.active = false;
        this.btnBack.active = false;
        if (isSpecial) {
            this.btnBack.active = true;
        }
        else {
            this.btnSet.active = true;
        }
        this.btnAddTube.active = true;
        this.updateBtnReturn();
        this.updateBtnAddTube();
        // 更新关卡等级ui
        let level = 'Lv.' + String(DataManager.data.sortData.level);
        if (isSpecial) {
            level = await DataManager.getString(LangChars.SPECIAL);
        }
        this.labelLevel.getComponent(cc.Label).string = level;
    }

    /** 刷新按钮 回退 */
    updateBtnReturn() {
        let nodeY = this.btnReturn.getChildByName('nodeY');
        let nodeN = this.btnReturn.getChildByName('nodeN');
        nodeY.opacity = 0;
        nodeN.opacity = 0;
        let count = this.dataObj.returnCount;
        if (count > 0) {
            nodeY.opacity = 255;
            let itemLabel = nodeY.getChildByName('label');
            itemLabel.getComponent(cc.Label).string = '' + count;
        }
        else {
            nodeN.opacity = 255;
        }
    }

    /** 刷新按钮 加瓶子 */
    updateBtnAddTube() {
        let nodeY = this.btnAddTube.getChildByName('nodeY');
        let nodeN = this.btnAddTube.getChildByName('nodeN');
        nodeY.opacity = 0;
        nodeN.opacity = 0;
        let count = DataManager.data.propAddTupe;
        if (count > 0) {
            nodeY.opacity = 255;
            let itemLabel = nodeY.getChildByName('label');
            itemLabel.getComponent(cc.Label).string = '' + count;
        }
        else {
            nodeN.opacity = 255;
        }
    }

    async loadLevel(isSpecial) {
        if (isSpecial) {
            let cfg = this.resPath.levelPath;
            let path = cfg.path + 'Else';
            let asset: cc.JsonAsset = await kit.Resources.loadRes(cfg.bundle, path, cc.JsonAsset);
            return asset;
        }
        else {
            let cfg = this.resPath.levelPath;
            let path = cfg.path;
            let sortLevel = DataManager.data.sortData.level;
            if (sortLevel > 2000) { path = path + '1'; }
            else if (sortLevel > 4000) { path = path + '2'; }
            else if (sortLevel > 6000) { path = path + '3'; }
            else if (sortLevel > 8000) { path = path + '4'; }
            else if (sortLevel > 10000) { path = path + '5'; }
            else if (sortLevel > 12000) { path = path + '6'; }
            else if (sortLevel > 14000) { path = path + '7'; }
            else if (sortLevel > 16000) { path = path + '8'; }
            else if (sortLevel > 18000) { path = path + '9'; }
            let asset: cc.JsonAsset = await kit.Resources.loadRes(cfg.bundle, path, cc.JsonAsset);
            return asset;
        }
    }

    /**
     * 初始化游戏关卡
     * @param data 关卡数据
     * @param isSpecial 是否未特殊关卡 
     * @param isCheck 是否需要检测特殊关卡
     */
    initLevel(dataLevels: SortLevelData[], isSpecial: boolean, isCheck: boolean) {
        let dataOne = null;
        // 特殊关卡 20关以后 从10开始循环
        this.isLevelSpecial = isSpecial;
        if (this.isLevelSpecial) {
            this.isCoverBlock = false;
            let specialData = DataManager.data.specialData;
            Common.log('开启特殊关卡 specialLevel: ', specialData.level);
            // 选择关卡数据
            let levelStart = specialData.level - 1;
            let levelMax = dataLevels.length;
            if (levelStart > levelMax - 1) {
                dataOne = dataLevels[levelMax - 10 + (levelStart - levelMax) % 10];
            }
            else {
                dataOne = dataLevels[levelStart];
            }
        }
        else {
            let levelStart = 4;
            let levelDis = 3;
            let sortData = DataManager.data.sortData;
            this.isCoverBlock = sortData.level >= levelStart && (sortData.level - levelStart) % levelDis == 0;
            if (this.isCoverBlock) {
                Common.log('开启遮罩关卡 sortLevel: ', sortData.level);
            }
            else {
                Common.log('开启普通关卡 sortLevel: ', sortData.level);
            }
            // 选择关卡数据
            dataOne = dataLevels[(sortData.level - 1) % 2000];
        }

        let tubeNum = dataOne.tube;// 管子个数
        let blockTypes = dataOne.balls;// 小球种类
        this.dataObj.blockTotal = dataOne.number || 4;
        //摆放关卡 也可以 swich
        for (let i = 0; i < tubeNum; i++) {
            let nodeTube = this.addTube(i);
            //添加球
            for (let j = 0; j < this.dataObj.blockTotal; j++) {
                let id = i * this.dataObj.blockTotal + j;
                if (blockTypes[id] > 0) {
                    this.addBlock(nodeTube, { number: blockTypes[id], isCover: false });
                }
            }
            // 特殊关卡 保留顶部 其他位置的覆盖
            if (this.isCoverBlock) {
                let scriptTube = nodeTube.getComponent(SortTube);
                scriptTube.initCover();
            }
        }
        this.refreshTubePos(tubeNum);
        this.saveData();//记录返回
        NativeCall.logEventOne(GameDot.dot_loadok_to_all);
        this.playAniShow(true, () => {
            // 新手引导
            let guideName = this.checkNewPlayerState();
            switch (guideName) {
                case CConst.newPlayer_guide_sort_1:
                    DataManager.data.sortData.newTip.cur++;
                    DataManager.setData();
                    kit.Event.emit(CConst.event_enter_newPlayer, CConst.newPlayer_guide_sort_1, true);
                    break;
                case CConst.newPlayer_guide_sort_3:
                    DataManager.data.sortData.newTip.cur++;
                    DataManager.setData();
                    kit.Event.emit(CConst.event_enter_newPlayer, CConst.newPlayer_guide_sort_3);
                    break;
                default:
                    break;
            }
            this.checkSpecial(isCheck);
            this.checkEvaluate(this.isLevelSpecial);
        });
    }

    /**
     * 检测 特殊关卡
     * @param isCheck 是否需要检测
     * @returns 
     */
    checkSpecial(isCheck) {
        if (!isCheck) {
            return;
        }
        if (this.isLevelSpecial) {
            return;
        }
        let sortData = DataManager.data.sortData;
        // 关卡检测 5关后 每隔5关检测
        let levelStart = 5;
        let levelDis = 5;
        let isCheckSpecial = sortData.level >= levelStart && (sortData.level - levelStart) % levelDis == 0;
        let specialData = DataManager.data.specialData;
        if (isCheckSpecial) {
            // 检测 已跳过的关卡
            isCheckSpecial = specialData.curLevelData.indexOf(sortData.level) < 0;
        }
        if (!isCheckSpecial) {
            return;
        }
        kit.Popup.show(CConst.popup_path_special_tip, {}, { mode: PopupCacheMode.Frequent });
    }

    /**
     * 检测 用户评价
     * @param isSpecial 特殊玩法 不检测
     * @returns 
     */
    checkEvaluate(isSpecial) {
        if (isSpecial) {
            return;
        }
        let _data = DataManager.data;
        if (_data.isAllreadyEvaluate) {
            return;
        }
        if (_data.sortData.level == 6 || _data.sortData.level == 26) {
            kit.Popup.show(CConst.popup_path_user_evaluate, {}, { mode: PopupCacheMode.Frequent });
        }
    }

    /**
     * 点击事件 瓶子
     * @param tubeNew 
     * @returns 
     */
    eventTouchTube(tubeNew: cc.Node) {
        if (this.dataObj.isFinish || this.dataObj.isMoving) return;//正在移动 或者 游戏结束
        let newTubeScript: SortTube = tubeNew.getComponent(SortTube);
        this.dataObj.stepCount += 1;
        let newBlockTop = newTubeScript.getBlockTop();
        let newBlockNum = newTubeScript.nodeMain.childrenCount;
        // 瓶子抬起
        let funcMoveUp = () => {
            if (newBlockNum > 0) {
                this.dataObj.isMoving = true;
                let yGoal = -newTubeScript.getTubeHeight() - this.dataObj.addHeight;
                let time = Common.getMoveTime(newBlockTop.position, cc.v3(0, yGoal), this.baseTime, this.baseDis);
                cc.tween(newBlockTop).call(() => {
                    newTubeScript.tubeSelect(true);
                    newBlockTop.getComponent(SortBlock).playAni();
                    // 瓶子zindex
                    this.nodeMain.children.forEach((tube: cc.Node) => {
                        if (tube.name == tubeNew.name) {
                            tube.zIndex = 100;
                        }
                        else {
                            tube.getComponent(SortTube).resetIndex();
                        }
                    });
                }).to(time, { y: yGoal }, cc.easeSineInOut()).call(() => {
                    this.dataObj.isMoving = false;
                    this.dataObj.tubeOld = tubeNew;
                }).start();
            }
        };
        // 点击过的瓶子 
        // 存在
        if (this.dataObj.tubeOld) {
            this.dataObj.isMoving = true;
            let oldTubeScript: SortTube = this.dataObj.tubeOld.getComponent(SortTube);
            let oldBlockTop = oldTubeScript.getBlockTop();
            let oldBlockNum = oldTubeScript.nodeMain.childrenCount;
            // 两次点击相同的瓶子
            let isTubeSame = this.dataObj.tubeOld.name == tubeNew.name;
            if (isTubeSame) {
                let yGoal = -oldTubeScript.hStart - oldTubeScript.hDis * (oldBlockNum - 1);
                let time = Common.getMoveTime(oldBlockTop.position, cc.v3(0, yGoal), this.baseTime, this.baseDis);
                cc.tween(oldBlockTop).call(() => {
                    oldTubeScript.tubeSelect(false);
                }).to(time, { y: yGoal }, cc.easeSineInOut()).call(() => {
                    this.dataObj.isMoving = false;
                    this.dataObj.tubeOld = null;
                }).start();
                return;
            }

            // 点击过的瓶子内 相同的小动物数组 包括最上面的一个
            let getArrOldBlockSame = () => {
                let arrOldBlockSame: cc.Node[] = [oldBlockTop];
                let arroldBlocks = Common.getArrByPosY(oldTubeScript.nodeMain);
                for (let i = oldBlockNum - 2; i >= 0; i--) {
                    let blockCount = newBlockNum + arrOldBlockSame.length;
                    if (blockCount >= this.dataObj.blockTotal) break;
                    let oldBlockElse = arroldBlocks[i];
                    let scriptBlockElse = oldBlockElse.getComponent(SortBlock);
                    // 没被覆盖 并且 种类一样
                    if (!scriptBlockElse.isCover && oldBlockTop.getComponent(SortBlock).number == scriptBlockElse.number) {
                        arrOldBlockSame.push(oldBlockElse);
                    }
                    else {
                        break;
                    }
                }
                return arrOldBlockSame;
            };

            // 旧瓶子恢复，新瓶子抬起
            let funcDownAndUp = () => {
                let yGoal = -oldTubeScript.hStart - oldTubeScript.hDis * (oldBlockNum - 1);
                let time = Common.getMoveTime(oldBlockTop.position, cc.v3(0, yGoal), this.baseTime, this.baseDis);
                let isFull = newTubeScript.nodeMain.childrenCount >= this.dataObj.blockTotal;
                cc.tween(oldBlockTop).call(() => {
                    oldTubeScript.tubeSelect(false);
                    if (isFull) {
                        newTubeScript.tubeFull();
                    }
                }).to(time, { y: yGoal }, cc.easeSineInOut()).call(() => {
                    this.dataObj.isMoving = false;
                    this.dataObj.tubeOld = null;
                    if (!isFull) {
                        funcMoveUp();
                    }
                }).start();
            };
            // 移动到目标位置
            let funcMoveGoal = () => {
                oldTubeScript.tubeSelect(false);
                let arrOldBlockSame = getArrOldBlockSame();

                let isFinish = this.checkFinishBefore(this.dataObj.tubeOld, tubeNew);
                // 游戏即将结束，禁止操作
                if (isFinish) {
                    this.maskBottom.active = true;
                }
                let moveAfter = () => {
                    // 去掉遮罩
                    oldTubeScript.hideBlockTopCover();
                    this.saveData();
                    newTubeScript.tubesuccess(this.dataObj.blockTotal);
                    if (isFinish) {
                        this.scheduleOnce(this.levelGameOver, 1.5);
                    }
                    else {
                        this.dataObj.isMoving = false;
                        this.dataObj.tubeOld = null;
                        this.playAniNotMove();
                    }
                };
                this.moveGoalBezier(this.dataObj.tubeOld, tubeNew, arrOldBlockSame, isFinish, moveAfter);
            };

            let isCanMove = false;
            if (newBlockNum == 0) {
                isCanMove = true;
            }
            else if (newBlockNum == this.dataObj.blockTotal) {
                isCanMove = false;
            }
            else {
                isCanMove = newBlockTop.getComponent(SortBlock).number == oldBlockTop.getComponent(SortBlock).number;
            }
            // 可以移动
            if (isCanMove) {
                funcMoveGoal();
            }
            else {
                kit.Audio.playEffect(CConst.sound_path_click);
                funcDownAndUp();
            }
        }
        // 不存在
        else {
            kit.Audio.playEffect(CConst.sound_path_click);
            // 瓶子里有小动物
            funcMoveUp();
            // 新手引导
            let guideName = this.checkNewPlayerState();
            if (guideName == CConst.newPlayer_guide_sort_2) {
                DataManager.data.sortData.newTip.cur++;
                DataManager.setData();

                let isTipRight = tubeNew.name == this.tubeName + 0;
                kit.Event.emit(CConst.event_enter_newPlayer, CConst.newPlayer_guide_sort_2, isTipRight);
            }
        }
    }

    /**
     * 移动到新的tube上去 移动分为三个阶段 向上+曲线+向下
     *  第一阶段：小球 以旧瓶子为根节点 进行移动
     *  第二节点：小球 以根节点为父节点 进行移动
     *  第三阶段：小球 以新瓶子为根节点 进行移动
     * @param oldTube 
     * @param newTube 
     * @param arrBlock 
     * @param callback 
     */
    async moveGoalBezier(oldTube: cc.Node, newTube: cc.Node, arrBlock: cc.Node[], isFinish: boolean, callback: Function) {
        let oldTubeScript = oldTube.getComponent(SortTube);
        let newTubeScript = newTube.getComponent(SortTube);
        let disNewY = -newTubeScript.getTubeHeight() - this.dataObj.addHeight;
        let have = newTubeScript.nodeMain.childrenCount;
        let hStart = newTubeScript.hStart;
        let hDis = newTubeScript.hDis;

        let new_p_start = cc.v3(0, disNewY);
        let old_p_finish = arrBlock[0].position;
        let game_p_start = Common.getLocalPos(oldTubeScript.nodeMain, old_p_finish, this.node);
        let game_p_finish = Common.getLocalPos(newTubeScript.nodeMain, new_p_start, this.node);
        let game_p_mid_down = cc.v3(game_p_start.x, game_p_finish.y);
        let game_p_mid_up = cc.v3(game_p_finish.x, game_p_start.y);
        let idDown = oldTube.y >= newTube.y;
        for (let index = 0, length = arrBlock.length; index < length; index++) {
            let block = arrBlock[index];
            let objMove: DataMove = {
                old_p_start: block.position,
                old_p_finish: old_p_finish,
                game_p_start: game_p_start,
                game_p_mid: idDown ? game_p_mid_down : game_p_mid_up,
                game_p_finish: game_p_finish,
                new_p_start: new_p_start,
                new_p_finish: cc.v3(0, -hStart - hDis * (index + have)),
                moveNum: length,
                blocksNum: this.dataObj.blockTotal,
                callback: index == length - 1 ? callback : null,
            };
            await block.getComponent(SortBlock).fly(objMove, oldTube, newTube, this.baseTime, this.baseDis, this.node);
            // 去掉遮罩
            oldTubeScript.hideBlockTopCover();
        }
    };

    /** 回收所有管子和球 */
    cleanTube() {
        for (let i = this.nodeMain.childrenCount - 1; i >= 0; i--) {
            let tubeOne = this.nodeMain.children[i];
            let blockMain = tubeOne.getComponent(SortTube).nodeMain;
            let blockLength = blockMain.childrenCount;
            if (blockLength > 0) {
                for (let j = blockLength - 1; j >= 0; j--) {
                    DataManager.poolPut(blockMain.children[j], this.poolBlock);
                }
            }
            DataManager.poolPut(tubeOne, this.poolTube);
        }
    }

    /**
     * 小动物移动之前，检测游戏是否可以结束（两个瓶子合并之后）
     * @param oldTube 
     * @param newTube 
     * @returns 
     */
    checkFinishBefore(oldTube: cc.Node, newTube: cc.Node) {
        let isEnoughCur = true;
        // 当前的两个瓶子 合并后 都符合条件
        let scriptTubeOld = oldTube.getComponent(SortTube);
        let scriptTubeNew = newTube.getComponent(SortTube);
        let arrBlock = scriptTubeOld.nodeMain.children.concat(scriptTubeNew.nodeMain.children);
        if (arrBlock.length == this.dataObj.blockTotal) {
            let isSame = true;
            let numberOfBlock = arrBlock[0].getComponent(SortBlock).number;
            for (let index = 0, length = arrBlock.length; index < length; index++) {
                let block = arrBlock[index];
                let script = block.getComponent(SortBlock);
                if (script.isCover || script.number != numberOfBlock) {
                    isSame = false;
                    break;
                }
            }
            isEnoughCur = isSame;
        }
        // 检测剩余瓶子
        let isEnoughElse = true;
        if (isEnoughCur) {
            for (let i = 0, lengthI = this.nodeMain.childrenCount; i < lengthI; i++) {
                let tube = this.nodeMain.children[i];
                if (tube.name == oldTube.name || tube.name == newTube.name) {
                    continue;
                }
                // 锁定
                let scriptTube = tube.getComponent(SortTube);
                if (scriptTube.checkIsEnough(this.dataObj.blockTotal)) {
                    continue;
                }
                // 空的
                let blockCount = scriptTube.nodeMain.childrenCount;
                if (blockCount == 0) {
                    continue;
                }
                isEnoughElse = false;
                break;
            }
        }
        return isEnoughCur && isEnoughElse;
    }

    /** 播放动画（没有可移动的位置时）*/
    playAniNotMove() {
        let isNotMove = true;
        for (let indexOld = 0, lengthOld = this.nodeMain.childrenCount; indexOld < lengthOld; indexOld++) {
            let tubeOld = this.nodeMain.children[indexOld];
            let scriptTubeOld = tubeOld.getComponent(SortTube);
            // 锁定
            if (scriptTubeOld.checkIsEnough(this.dataObj.blockTotal)) {
                continue;
            }
            // 空的
            let blockOldCount = scriptTubeOld.nodeMain.childrenCount;
            if (blockOldCount == 0) {
                isNotMove = false;
                break;
            }
            let blockOldTop = scriptTubeOld.getBlockTop();
            let arrTubeElse = this.nodeMain.children.filter((tube) => {
                return tube.name != tubeOld.name;
            });
            for (let indexNew = 0, lengthNew = arrTubeElse.length; indexNew < lengthNew; indexNew++) {
                let tubeNew = arrTubeElse[indexNew];
                let scriptTubeNew = tubeNew.getComponent(SortTube);
                let blockOldCount = scriptTubeNew.nodeMain.childrenCount;
                if (blockOldCount == 0) {
                    isNotMove = false;
                    break;
                }
                if (blockOldCount == this.dataObj.blockTotal) {
                    continue;
                }
                let blockNewTop = scriptTubeNew.getBlockTop();
                if (blockOldTop.getComponent(SortBlock).number == blockNewTop.getComponent(SortBlock).number) {
                    isNotMove = false;
                    break;
                }
            }
        }

        // 不能移动
        let aniTop = this.uiTop.getComponent(cc.Animation);
        if (isNotMove) {
            aniTop.play('aniUIBottom');
        }
        else {
            aniTop.setCurrentTime(0);
            aniTop.stop('aniUIBottom');
        }
    }

    /** 按钮事件 返回 */
    eventBtnBack() {
        kit.Audio.playEffect(CConst.sound_path_click);
        if (this.isLevelSpecial) {
            kit.Popup.show(CConst.popup_path_special_quit, {}, { mode: PopupCacheMode.Frequent });
        }
        else {
            kit.Event.emit(CConst.event_enter_mainMenu);
        }
    }

    /** 按钮事件 重玩 */
    eventBtnReplay() {
        kit.Audio.playEffect(CConst.sound_path_click);
        let funcReplay = () => {
            NativeCall.logEventOne(GameDot.dot_sortReStart);
            this.playAniShow(false, () => {
                this.enterLevel(this.isLevelSpecial, false);
            });
        };
        // 前30关，有一次免广告重玩的机会
        let levelSort = DataManager.data.sortData.level;
        if (levelSort <= 30 && DataManager.data.rePlayNum > 0) {
            DataManager.data.rePlayNum -= 1;
            DataManager.setData();
            funcReplay();
            return;
        }
        // 打点 插屏广告请求（过关）
        NativeCall.logEventThree(GameDot.dot_adReq, "inter_homeRestart", "Interstital");
        let funcA = () => {
            // 打点 插屏播放完成（点击重玩按钮）
            NativeCall.logEventTwo(GameDot.dot_ads_advert_succe_rePlay, String(levelSort));
            funcReplay();
        };
        let funcB = () => {
            kit.Event.emit(CConst.event_tip_noVideo);
        };
        let isReady = DataManager.playAdvert(funcA, funcA);
        if (!isReady) {
            funcA();
        }
    }

    /** 按钮事件 上一步 */
    eventBtnReturn() {
        kit.Audio.playEffect(CConst.sound_path_click);
        if (this.fanhuidata.length <= 1) {
            return;
        }
        if (this.dataObj.returnCount > 0) {
            // 刷新按钮ui
            this.dataObj.returnCount--;
            this.updateBtnReturn();

            // 重新布局游戏内容
            this.cleanTube();// 清除瓶子

            // 重置存储的数据 已经去掉遮罩的小动物，保持去掉的状态；
            let dataLast = this.fanhuidata[this.fanhuidata.length - 1];
            let dataCur = this.fanhuidata[this.fanhuidata.length - 2];
            dataCur.blocksObj.forEach((blockObj: BlockObj, index: number) => {
                let lastBlockObj = dataLast.blocksObj[index];
                if (blockObj.number == lastBlockObj.number && blockObj.isCover != lastBlockObj.isCover) {
                    blockObj.isCover = lastBlockObj.isCover;
                }
            });
            this.fanhuidata.pop();// 记录的数据变更

            let tubeNum = dataCur.tubeNum;
            let blocksObj = dataCur.blocksObj;
            this.refreshGame(true, tubeNum, blocksObj);
            this.playAniNotMove();
        } else {
            let funcA = () => {
                NativeCall.logEventOne(GameDot.dot_addSortReturn_succe);
                kit.Audio.playEffect(CConst.sound_path_reward);
                this.dataObj.returnCount = 5;
                this.updateBtnReturn();
            };
            let funcB = (err: any) => {
                kit.Event.emit(CConst.event_tip_noVideo);
            };
            // 打点 视频广告请求（加返回道具）
            NativeCall.logEventThree(GameDot.dot_adReq, "addPropReturn", "rewardVideo");
            let isReady = DataManager.playVideo(funcA, funcB);
            if (!isReady) {
                // 打点 插屏广告请求（加返回道具）
                NativeCall.logEventThree(GameDot.dot_adReq, "addPropReturn", "Interstital");
                isReady = DataManager.playAdvert(funcA, funcB);
            }
            if (!isReady) {
                funcB('err');
            }
        }
    }

    /** 按钮事件 添加瓶子 */
    eventBtnAddTube() {
        kit.Audio.playEffect(CConst.sound_path_click);
        let tubeNum = this.nodeMain.childrenCount;
        let tubeMax = this.isLevelSpecial ? tubeNum + 1 : 18;
        if (tubeNum >= tubeMax) {
            Common.log('瓶子数量已达上限');
            return;
        }
        // 添加瓶子（有道具）
        if (DataManager.data.propAddTupe > 0) {
            DataManager.data.propAddTupe--;
            this.updateBtnAddTube();
            this.addTube(tubeNum);
            this.playAniNotMove();
            this.saveData();

            tubeNum = this.nodeMain.childrenCount;
            this.refreshTubePos(tubeNum);
            if (tubeNum >= tubeMax) {
                this.btnAddTube.active = false;
            }
        }
        else {
            let funcA = () => {
                NativeCall.logEventOne(GameDot.dot_addTube_succ);
                this.addTube(tubeNum);
                this.playAniNotMove();
                this.saveData();

                tubeNum = this.nodeMain.childrenCount;
                this.refreshTubePos(tubeNum);
                if (tubeNum >= tubeMax) {
                    this.btnAddTube.active = false;
                }
            };

            let funcB = () => {
                kit.Event.emit(CConst.event_tip_noVideo);
            };
            // 打点 视频广告请求（加瓶子道具）
            NativeCall.logEventThree(GameDot.dot_adReq, "addPropTube", "rewardVideo");
            let isReady = DataManager.playVideo(funcA, funcB);
            if (!isReady) {
                // 打点 插屏广告请求（加瓶子道具）
                NativeCall.logEventThree(GameDot.dot_adReq, "addPropTube", "Interstital");
                isReady = DataManager.playAdvert(funcA, funcB);
            }
            if (!isReady) {
                funcB();
            }
        }
    }

    playAniShow(isShow, callback) {
        let opaStart = isShow ? 0 : 255;
        let opaFinish = isShow ? 255 : 0;
        this.nodeMain.opacity = opaStart;
        cc.tween(this.nodeMain).call(() => {
            this.maskBottom.active = true;
        }).to(0.383, { opacity: opaFinish }, cc.easeSineInOut()).call(() => {
            this.maskBottom.active = false;
            callback && callback();
        }).start();
    }

    /**
     * 刷新游戏内容
     * @param isAdd 是否添加 
     * @param tubeNum 瓶子数量
     * @param blocksObj 动物种类数组 空数组时，不添加动物
     */
    refreshGame(isAddTube: boolean, tubeNum: number, blocksObj: BlockObj[] = []) {
        //开始排列
        for (let i = 0; i < tubeNum; i++) {
            let nodeTube: cc.Node = null;
            if (isAddTube) {
                nodeTube = this.addTube(i);
            }
            else {
                nodeTube = this.nodeMain.children[i];
            }
            let blocksNum = blocksObj.length;
            if (blocksNum > 0) {
                //添加球
                for (let j = 0; j < this.dataObj.blockTotal; j++) {
                    let id = i * this.dataObj.blockTotal + j;
                    let blockObj = blocksObj[id];
                    if (blockObj.number > 0) {
                        this.addBlock(nodeTube, blockObj);
                    }
                }
            }
        }
        this.refreshTubePos(tubeNum);
    }

    /** 瓶子内布置 */
    refreshTubePos(tubeNum: number) {
        //获取位置
        let obj: ObjTube = SortTubePos['tube' + this.dataObj.blockTotal][tubeNum];
        //开始排列
        let startPos = obj.startPos;
        let arrDis = obj.arrDis;
        let rowLen = arrDis.length;
        let colStart = 0;
        let colFinish = 0;
        for (let row = 0; row < rowLen; row++) {
            let rowOne = arrDis[row];
            let colNum = rowOne.col;
            colFinish += colNum;
            let xDisReduce = rowOne.xDis * (colNum - 1) * 0.5;
            let yDisReduce = rowOne.yDis * (rowLen - 1) * 0.5;
            for (let col = colStart; col < colFinish; col++) {
                let tube: cc.Node = this.nodeMain.getChildByName(this.tubeName + col);
                tube.x = startPos.x + (col - colStart) * rowOne.xDis - xDisReduce;
                tube.y = startPos.y - row * rowOne.yDis + yDisReduce;
                tube.scale = startPos.scale;
            }
            colStart += colNum;
        }
    }

    /** 添加新的瓶子 */
    addTube(tubeId: number) {
        let nodeTube = this.getTube(this.dataObj.blockTotal);
        let script = nodeTube.getComponent(SortTube);
        script.initName(this.tubeName, tubeId);
        nodeTube.parent = this.nodeMain;
        return nodeTube;
    };

    /** 添加动物 */
    addBlock(nodeTube: cc.Node, blockObj: BlockObj) {
        let scriptTube = nodeTube.getComponent(SortTube);
        let block = this.getBlock(blockObj.number, blockObj.isCover);
        block.zIndex = scriptTube.nodeMain.childrenCount;
        block.y = -scriptTube.hStart - scriptTube.hDis * scriptTube.nodeMain.childrenCount;
        block.parent = scriptTube.nodeMain;
    };

    /** 获取 瓶子 */
    getTube(blockNum: number) {
        let nodeTube: cc.Node = this.poolTube.size() > 0 ? this.poolTube.get() : cc.instantiate(this.preTube);
        nodeTube.getComponent(SortTube).init(blockNum);
        return nodeTube;
    }

    /** 获取 动物 */
    getBlock(type: number, cover: boolean) {
        let nodeBlock: cc.Node = this.poolBlock.size() > 0 ? this.poolBlock.get() : cc.instantiate(this.preBlock);
        nodeBlock.getComponent(SortBlock).init(type, cover);
        return nodeBlock;
    }

    /**
     * 记录 当前关卡数据
     * @param tubeNode
     */
    saveData() {
        //确保有管子
        let tubeNum = this.nodeMain.childrenCount;
        if (tubeNum > 0) {
            //循环存储每个管子
            let arrTube = Common.getArrByName(this.nodeMain, this.tubeName);
            let blocksObj: BlockObj[] = [];
            for (let i = 0; i < tubeNum; i++) {
                let tube = arrTube[i];
                let scriptTube = tube.getComponent(SortTube);
                let blocks = Common.getArrByPosY(scriptTube.nodeMain);
                for (let j = 0; j < this.dataObj.blockTotal; j++) {
                    let block = blocks[j];
                    let blockObj: BlockObj;
                    if (block) {
                        let scriptBlock = block.getComponent(SortBlock);
                        blockObj = { number: scriptBlock.number, isCover: scriptBlock.isCover };
                    }
                    else {
                        blockObj = { number: 0, isCover: false };
                    }
                    blocksObj.push(blockObj);
                }
            }
            this.fanhuidata.push({ tubeNum: tubeNum, blocksObj: blocksObj });
        }
    }

    /** 检测新手引导状态 */
    checkNewPlayerState() {
        if (this.isLevelSpecial) {
            return null;
        }
        let gameData = DataManager.data.sortData;
        if (gameData.level == 1 && gameData.newTip.cur == 0) {
            return CConst.newPlayer_guide_sort_1;
        }
        else if (gameData.level == 1 && gameData.newTip.cur == 1) {
            return CConst.newPlayer_guide_sort_2;
        }
        else if (gameData.level == 2 && gameData.newTip.cur == 2) {
            return CConst.newPlayer_guide_sort_3;
        }
        return null;
    }

    /**
     * 关卡结束
     */
    levelGameOver() {
        // 打点
        NativeCall.sTsEvent();
        NativeCall.closeBanner();

        let levelSort = DataManager.data.sortData.level
        // 更新数据 特殊关卡 过关后，当前关卡不再提示 只提示一次
        if (this.isLevelSpecial) {
            DataManager.data.specialData.curLevelData.push(levelSort);
        }

        this.dataObj.isFinish = true;
        // 打点 过关
        NativeCall.logEventTwo(GameDot.dot_sortPass, String(levelSort));
        NativeCall.logEventOne(GameDot.dot_levelPass);
        let dot = GameDot['dot_pass_level_' + levelSort];
        if (dot) {
            let passTime = Math.floor(((new Date()).getTime() - this.dataObj.passTime) / 1000); //通关时间
            NativeCall.logEventFore(dot, String(levelSort), String(passTime), String(this.dataObj.stepCount));
        }
        NativeCall.logEventOne(GameDot.dot_pass_level_all);

        // 进入下一关
        let funcNext = () => {
            let gameData = this.isLevelSpecial ? DataManager.data.specialData : DataManager.data.sortData;
            gameData.level += 1;
            DataManager.setData(true);
            kit.Event.emit(CConst.event_enter_gameWin);
        };
        let isPlayAds = DataManager.checkIsPlayAdvert(levelSort);
        if (isPlayAds) {
            // 打点 插屏广告请求（过关）
            NativeCall.logEventThree(GameDot.dot_adReq, "inter_nextlevel", "Interstital");
            let funcA = () => {
                // 打点 插屏播放完成（游戏结束）
                NativeCall.logEventTwo(GameDot.dot_ads_advert_succe_win, String(levelSort));
                funcNext();

                // 广告计时
                DataManager.data.adRecord.time = Math.floor(new Date().getTime() * 0.001);
                DataManager.data.adRecord.level = levelSort;
                DataManager.setData();
            };
            let funcB = () => {
                funcNext();
            };
            let isReady = DataManager.playAdvert(funcA, funcB);
            if (!isReady) {
                funcB();
            }
        }
        else {
            funcNext();
        }
    }

    /** 监听-注册 */
    listernerRegist(): void {
        kit.Event.on(CConst.event_enter_nextLevel, this.enterLevel, this);
    }

    /** 监听-取消 */
    listernerIgnore(): void {
        kit.Event.removeByTarget(this);
    };

    protected onDestroy(): void {
        this.listernerIgnore();
    }
}
import {kit} from "../../../../src/kit/kit";
import {PopupCacheMode} from "../../../../src/kit/manager/popupManager/PopupManager";
import Common from "../../../../src/config/Common";
import CConst from "../../../../src/config/CConst";
import GameDot from "../../../../src/config/GameDot";
import NativeCall from "../../../../src/config/NativeCall";
import DataManager, {LangChars} from "../../../../src/config/DataManager";
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
    shilf_id: number;
    tube_id: number;
    block_id: number;
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

const {ccclass, property} = cc._decorator;
@ccclass
export default class GameSort extends cc.Component {

    @property(cc.Node) maskTop: cc.Node = null;// 顶部屏蔽
    @property(cc.Node) maskBottom: cc.Node = null;// 底部屏蔽
    @property(cc.Node) nodeMain: cc.Node = null;// 瓶子父节点
    @property(cc.Node) uiTop: cc.Node = null;// 底部节点
    @property(cc.Node) btnSet: cc.Node = null;// 按钮：返回菜单
    @property(cc.Node) btnBack: cc.Node = null;// 按钮：返回菜单
    @property(cc.Node) btnHelp: cc.Node = null;// 按钮：添加瓶子
    @property(cc.Node) btnReturn: cc.Node = null;// 按钮：返回上一步
    @property(cc.Node) labelLevel: cc.Node = null;// 关卡等级
    @property(cc.Prefab) preMatchTube: cc.Prefab = null;// 预制体：一摞
    @property(cc.Prefab) preMatchBlock: cc.Prefab = null;// 预制体：衣服
    @property(cc.Prefab) preMatchShelf: cc.Prefab = null;// 预制体：底板
    @property(cc.Node) SaveSpaceMain: cc.Node = null;// 存储空间
    @property(cc.Node) destroyAnim: cc.Node = null;// 消除
    @property(cc.Node) uiLine: cc.Node = null;// 进度控制

    resPath = {
        levelPath: {bundle: 'prefabs', path: './games/GameSort/res/level/MatchLevel'},
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
        shelfTotal: 0,//每个货架最多有多少个
        blockTotal: 0,//每个tube最多有多少个
        stepCount: 0,
        passTime: 0,
        returnCount: 0,
        addHeight: 0,
        isMoving: false,
        isFinish: false,
        tubeOld: null,
    };
    levelData: SortLevelData[] = [];
    fanhuidata = [];

    baseTime = 1;// 基础时间 用于计算移动时间
    baseDis = 2000;// 基础距离 用于计算移动时间
    tubeName: string = 'tubePre';
    poolMatchTube: cc.NodePool = null;
    poolMatchBlock: cc.NodePool = null;
    poolMatchShelf: cc.NodePool = null;
    SaveCount = [];//底板存放的block
    SavePos = [-292, -193, -95, 0, 95, 193, 292];//底板的位置

    protected onLoad(): void {
        Common.log('GameMatch onLoad()');
        this.listernerRegist();
    }

    protected start(): void {
        this.poolMatchTube = new cc.NodePool();//管子对象池
        this.poolMatchBlock = new cc.NodePool();//动物对象池
        // 初始ui
        this.poolMatchShelf = new cc.NodePool();//动物对象池
        // 初始ui
        this.nodeMain.opacity = 0;
        this.maskTop.setContentSize(cc.winSize);
        this.maskTop.active = true;
        this.maskBottom.setContentSize(cc.winSize);
        this.maskBottom.active = false;
        this.uiLine.getComponent('GameMatchLine').init();
        this.enterLevel(false, true);
    }

    /**
     * 关卡入口
     * @param isSpecial 当前是否是特殊关卡
     * @param isCheck 是否需要检测特殊关卡
     */
    enterLevel(isSpecial, isCheck) {
        console.log("====enterLevel=====");
        NativeCall.logEventOne(GameDot.dot_JigLevelStart);
        //游戏初始化
        this.cleanTube();
        this.initData();
        this.initUI(isSpecial);
        this.loadLevel(isSpecial, isCheck);
    }

    initData() {
        this.dataObj = {
            shelfTotal: 5,
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

    initUI(isSpecial) {
        this.uiTop.y = cc.winSize.height * 0.5 - 100;
        // 更新按钮状态ui
        this.btnBack.active = true;//返回到 gamesort
        this.btnHelp.active = true;
        this.updateBtnReturn();
        this.updatebtnHelp();
        // 更新关卡等级ui
        DataManager.setString(LangChars.SPECIAL, (chars: string) => {
            this.labelLevel.getComponent(cc.Label).string = chars;
        });
        // let level = 'Lv.' + String(DataManager.data.match.level);
        // if (isSpecial) {
        //     DataManager.setString(LangChars.SPECIAL, (chars: string) => {
        //         this.labelLevel.getComponent(cc.Label).string = chars;
        //     });
        // } else {
        //     this.labelLevel.getComponent(cc.Label).string = level;
        // }
    }

    /** 刷新按钮 回退 */
    updateBtnReturn() {
        let nodeY = this.btnReturn.getChildByName('nodeY');
        let nodeN = this.btnReturn.getChildByName('nodeN');
        nodeY.opacity = 0;
        nodeN.opacity = 0;
        let count = DataManager.data.returnCount;
        if (count > 0) {
            nodeY.opacity = 255;
            let itemLabel = nodeY.getChildByName('label');
            itemLabel.getComponent(cc.Label).string = '' + count;
        } else {
            nodeN.opacity = 255;
        }
    }

    /** 刷新按钮 加瓶子 */
    updatebtnHelp() {
        let nodeY = this.btnHelp.getChildByName('nodeY');
        let nodeN = this.btnHelp.getChildByName('nodeN');
        nodeY.opacity = 0;
        nodeN.opacity = 0;
        let count = DataManager.data.helpCount;
        if (count > 0) {
            nodeY.opacity = 255;
            let itemLabel = nodeY.getChildByName('label');
            itemLabel.getComponent(cc.Label).string = '' + count;
        } else {
            nodeN.opacity = 255;
        }
    }

    loadLevel(isSpecial, isCheck) {
        let cfg = this.resPath.levelPath;
        let path = '';
        if (isSpecial) {
            path = cfg.path + 'Else';
        } else {
            path = cfg.path;
        }
        DataManager.loadBundleRes(cfg.bundle, path, (asset: cc.JsonAsset) => {
            this.initLevel(asset.json, isSpecial, isCheck);
            NativeCall.showBanner();
        })
    }

    /**
     * 初始化游戏关卡
     * @param data 关卡数据
     * @param isSpecial 是否未特殊关卡
     * @param isCheck 是否需要检测特殊关卡
     */
    initLevel(dataLevels: SortLevelData[], isSpecial: boolean, isCheck: boolean) {
        let dataOne = null;
        this.dataObj.isFinish = false;
        this.SaveCount = [];
        this.SaveSpaceMain.removeAllChildren();
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
            } else {
                dataOne = dataLevels[levelStart];
            }
        } else {
            let levelStart = 5;
            let levelDis = 3;
            let matchData = DataManager.data.match;
            this.isCoverBlock = matchData.level >= levelStart && (matchData.level - levelStart) % levelDis == 0;
            if (this.isCoverBlock) {
                Common.log('开启遮罩关卡 matchData: ', matchData.level);
            } else {
                Common.log('开启普通关卡 matchData: ', matchData.level);
            }
            // 选择关卡数据
            let lv = matchData.level - 1
            if (lv >= 500) lv = Math.floor(200 + Math.random() * 300)
            dataOne = dataLevels[lv % 2000];
        }
        // {"id":1,"tube":3,"number":3,"balls":[[[1,1,2],[1,2,1],[1,2,1]]]}
        console.log("dataOne", dataOne)
        let balls = dataOne.balls;// 关卡数组
        let shilfCount = balls.length;// 管子个数
        this.dataObj.blockTotal = dataOne.number;//没用到
        this.dataObj.shelfTotal = 5;
        //摆放关卡 也可以 swich
        let sheftOjb = this.getShelfPos(shilfCount);
        // console.log("====sheftOjb==", sheftOjb);
        for (let shilf_i = 0; shilf_i < balls.length; shilf_i++) {
            //添加板子
            let nodeSheft = this.addShelf(shilf_i);
            nodeSheft.y = sheftOjb[shilf_i];
            for (let tube_i = 0; tube_i < balls[shilf_i].length; tube_i++) {
                //添加管子
                let nodeTube = this.addTube(nodeSheft, tube_i);
                for (let block_i = 0; block_i < balls[shilf_i][tube_i].length; block_i++) {
                    //添加衣服
                    let id = balls[shilf_i][tube_i][block_i]
                    if (id > 0) {
                        let blockObj = {
                            number: id,
                            isCover: false,
                            shilf_id: shilf_i,
                            tube_id: tube_i,
                            block_id: block_i
                        }
                        this.addBlock(nodeTube, blockObj);
                    }
                }
                // 特殊关卡 保留顶部 其他位置的覆盖
                if (this.isCoverBlock) {
                    let scriptTube = nodeTube.getComponent("MatchTube");
                    scriptTube.initCover();
                }
            }
            this.refreshTubePos(nodeSheft);//每个货架去排列
        }
        this.playAniShow(true, () => {
            // 新手引导
            let guideName = this.checkNewPlayerState();
            switch (guideName) {
                case CConst.newPlayer_guide_sort_1:
                    DataManager.data.sortData.newTip.cur++;
                    // DataManager.setData();
                    kit.Event.emit(CConst.event_enter_newPlayer, CConst.newPlayer_guide_sort_1, true);
                    break;
                case CConst.newPlayer_guide_sort_3:
                    DataManager.data.sortData.newTip.cur++;
                    // DataManager.setData();
                    kit.Event.emit(CConst.event_enter_newPlayer, CConst.newPlayer_guide_sort_3);
                    break;
                default:
                    break;
            }
        });
    }

    /** 回收所有扳子、衣服父节点、衣服 */
    cleanTube() {
        for (let i = this.nodeMain.childrenCount - 1; i >= 0; i--) {
            let shelfOne = this.nodeMain.children[i];
            let shelfMain = shelfOne.getComponent("MatchShelf").nodeMain;
            let shelfLength = shelfMain.childrenCount;
            if (shelfLength > 0) {
                for (let j = shelfLength - 1; j >= 0; j--) {
                    let tubeOne = shelfMain.children[j];
                    let blockMain = tubeOne.getComponent("MatchTube").nodeMain;
                    let blockLength = blockMain.childrenCount;
                    if (blockLength > 0) {
                        for (let t = blockLength - 1; t >= 0; t--) {
                            DataManager.poolPut(blockMain.children[t], this.poolMatchBlock);
                        }
                    }
                    DataManager.poolPut(tubeOne, this.poolMatchTube);
                }
            }
            DataManager.poolPut(shelfOne, this.poolMatchShelf);
        }
    }


    /** 按钮事件 返回 */
    eventBtnBack() {
        kit.Audio.playEffect(CConst.sound_path_click);
        kit.Event.emit(CConst.event_enter_gameSort);
        cc.tween(this.node).to(0.383, {opacity: 0}).start()
    }

    /** 按钮事件 重玩 */
    eventBtnReplay() {
        kit.Audio.playEffect(CConst.sound_path_click);
        let funcReplay = () => {
            NativeCall.logEventOne(GameDot.dot_JigReStart);
            this.playAniShow(false, () => {
                this.enterLevel(this.isLevelSpecial, false);
            });
        };
        // 前30关，有一次免广告重玩的机会,
        // 1.1.9 改成 前30关，有一次免广告重玩的机会,
        // 1.1.10 改成 前10关，有一次免广告重玩的机会,
        // 1.1.11 改成5关以前无限、10关以前1分钟间隔，10关以后30s间隔
        let levelSort = DataManager.data.match.level;
        if (levelSort <= 7 && DataManager.data.rePlayNum > 0) {
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
        if (this.fanhuidata.length < 1) {
            return;
        }
        if (DataManager.data.returnCount > 0) {
            // 刷新按钮ui
            DataManager.data.returnCount--;
            this.updateBtnReturn();
            let lastData = this.fanhuidata[this.fanhuidata.length - 1];
            let moveBlock = () => {
                let shelf_id = lastData.data[0].shelf_id;
                let tube_id = lastData.data[0].tube_id;
                let block_id = lastData.data[0].block_id;
                let localParent = lastData.data[0].localParent;
                // console.log("==SaveCount==", this.SaveCount.length)
                for (let i = this.SaveCount.length - 1; i >= 0; i--) {
                    let block = this.SaveCount[i]
                    let scriptBlock = block.getComponent("MatchBlock");
                    // console.log("==shelf_id==", scriptBlock.shelf_id, "==tube_id==", scriptBlock.tube_id, "==block_id==", scriptBlock.block_id)
                    if (scriptBlock.shelf_id == shelf_id && scriptBlock.tube_id == tube_id && scriptBlock.block_id == block_id) {
                        // console.log("==找到==block==")
                        // 把存储在列表里面的数先移除了，避免放置太快起冲突
                        this.SaveCount.splice(i, 1);
                        scriptBlock.returnMap(localParent);
                        this.fanhuidata.pop();
                        break;
                    }
                }
            }
            // console.log("==lastData==", lastData)
            // 1、检查底部有没有 刚挪下来的，如果有，直接移动回去
            if (lastData.type == 'move') {
                moveBlock();
            } else {
                // 如果是销毁，则先恢复到 SaveCount数组，以及底部。
                for (let i = 0; i < lastData.data.length; i++) {
                    let blockOne = lastData.data[i];
                    let block = this.getBlock(blockOne.number, false);
                    let scriptBlock = block.getComponent("MatchBlock");
                    scriptBlock.shelf_id = blockOne.shelf_id;
                    scriptBlock.tube_id = blockOne.tube_id;
                    scriptBlock.block_id = blockOne.block_id;
                    // console.log("=blockOne=shelf_id==", blockOne.shelf_id, "==tube_id==", blockOne.tube_id, "==block_id==", blockOne.block_id)
                    // console.log("==shelf_id==", scriptBlock.shelf_id, "==tube_id==", scriptBlock.tube_id, "==block_id==", scriptBlock.block_id)
                    block.scale = 0.5;
                    scriptBlock.localParent = blockOne.localParent;
                    block.parent = this.SaveSpaceMain;
                    this.SaveCount.push(block)
                    block.x = this.SavePos[this.SaveCount.length - 1];
                }
                this.fanhuidata.pop();
                // 然后再移动回去
                lastData = this.fanhuidata[this.fanhuidata.length - 1];
                moveBlock();
            }
        } else {
            let funcA = () => {
                NativeCall.logEventOne(GameDot.dot_JigReturn);
                kit.Audio.playEffect(CConst.sound_path_reward);
                DataManager.data.returnCount = 6;
                this.updateBtnReturn();
            };
            let funcB = (err: any) => {
                kit.Event.emit(CConst.event_tip_noVideo);
            };
            // 打点 视频广告请求（加返回道具）
            NativeCall.logEventThree(GameDot.dot_adReq, "video_JigReturn", "rewardVideo");
            let isReady = DataManager.playVideo(funcA, funcB);
            if (!isReady) {
                // 打点 插屏广告请求（加返回道具）
                NativeCall.logEventThree(GameDot.dot_adReq, "video_JigReturn", "Interstital");
                isReady = DataManager.playAdvert(funcA, funcB);
            }
            if (!isReady) {
                funcB('err');
            }
        }
    }


    /** 按钮事件 提示 */
    eventBtnHelp() {
        kit.Audio.playEffect(CConst.sound_path_click);
        if (DataManager.data.helpCount > 0) {
            let helpFun = (number, blockCount) => {
                console.log("=====blockCount=====", blockCount)
                DataManager.data.helpCount -= 1;
                this.updatebtnHelp();
                DataManager.setData(true);
                for (let i = 0; i < this.nodeMain.childrenCount; i++) {
                    let scriptShelf = this.nodeMain.children[i].getComponent("MatchShelf");
                    let shelfMain = scriptShelf.nodeMain;
                    let shelfLength = shelfMain.childrenCount;
                    if (shelfLength > 0) {
                        for (let j = shelfLength - 1; j >= 0; j--) {
                            let scriptTube = shelfMain.children[j].getComponent("MatchTube");
                            let tubeMain = scriptTube.nodeMain;
                            let tubeLength = tubeMain.childrenCount;
                            if (tubeLength > 0) {
                                for (let t = tubeLength - 1; t >= 0; t--) {
                                    let block = tubeMain.children[t];
                                    let scriptBlock = block.getComponent("MatchBlock");
                                    if (scriptBlock.number == number) {
                                        scriptTube.moveTargetBlock(block)
                                        blockCount--;
                                        // console.log("====1=blockCount=====", blockCount)
                                        if (blockCount <= 0) {
                                            return;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            if (this.SaveCount.length == 0) {
                let scriptShelf = this.nodeMain.children[0].getComponent("MatchShelf");
                let shelfMain = scriptShelf.nodeMain;
                let scriptTube = shelfMain.children[0].getComponent("MatchTube");
                let tubeMain = scriptTube.nodeMain;
                let block = tubeMain.children[0]
                let scriptBlock = block.getComponent("MatchBlock");
                helpFun(scriptBlock.number, 1);//不要给两个，1个就行
                return;
            }
            let numList = []; //只要有重复的，就是有两个的，可以直接用这个。
            for (let i = this.SaveCount.length - 1; i >= 0; i--) {
                let block = this.SaveCount[i]
                let scriptBlock = block.getComponent("MatchBlock");
                if (numList.includes(scriptBlock.number)) {
                    helpFun(scriptBlock.number, 1)
                    return;
                } else {
                    numList.push(scriptBlock.number)
                }
            }
            // 如果没有重复的，则判断是否有两个空余位置
            if (this.SaveCount.length <= 5) {
                let block = this.SaveCount[this.SaveCount.length - 1]
                let scriptBlock = block.getComponent("MatchBlock");
                helpFun(scriptBlock.number, 1);//不要给两个，1个就行
                return;
            }
            // 弹窗，无法消除了
        } else {
            let funcA = () => {
                NativeCall.logEventOne(GameDot.dot_JigHelpSucc);
                kit.Audio.playEffect(CConst.sound_path_reward);
                DataManager.data.helpCount = 2;
                this.updatebtnHelp();
            };
            let funcB = (err: any) => {
                kit.Event.emit(CConst.event_tip_noVideo);
            };
            // 打点 视频广告请求（加返回道具）
            NativeCall.logEventThree(GameDot.dot_adReq, "JigHelpSucc", "rewardVideo");
            let isReady = DataManager.playVideo(funcA, funcB);
            if (!isReady) {
                // 打点 插屏广告请求（加返回道具）
                NativeCall.logEventThree(GameDot.dot_adReq, "JigHelpSucc", "Interstital");
                isReady = DataManager.playAdvert(funcA, funcB);
            }
            if (!isReady) {
                funcB('err');
            }
        }
    }

    playAniShow(isShow, callback) {
        let opaStart = isShow ? 0 : 255;
        let opaFinish = isShow ? 255 : 0;
        this.nodeMain.opacity = opaStart;
        cc.tween(this.nodeMain).call(() => {
            this.maskBottom.active = true;
        }).to(0.383, {opacity: opaFinish}, cc.easeSineInOut()).call(() => {
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

    }


    getShelfPos(tubeNum) {
        let shelfSet = {};
        shelfSet[1] = [0];
        shelfSet[2] = [200, -200];
        shelfSet[3] = [300, 0, -300] ;
        return shelfSet[tubeNum];
    }

    /** 瓶子内布置 */
    refreshTubePos(nodeShelf: cc.Node) {
        //获取位置
        let posList = [];
        let shelfMain = nodeShelf.getComponent("MatchShelf").nodeMain;
        switch (shelfMain.childrenCount) {
            case 1:
                posList = [0];
                break;
            case 2:
                posList = [-100, 100];
                break;
            case 3:
                posList = [-150, 0, 150];
                break;
            case 4:
                posList = [-240, -80, 80, 240];
                break;
            case 5:
                posList = [-280, -140, 0, 140, 280];
                break;
        }
        for (let i = 0; i < shelfMain.childrenCount; i++) {
            shelfMain.children[i].x = posList[i]
        }
    }

    /** 添加新的瓶子 */
    addShelf(tubeId: number) {
        let nodeTube = this.getShelf(tubeId);
        let script = nodeTube.getComponent("MatchShelf");
        script.initName(this.tubeName, tubeId);
        nodeTube.parent = this.nodeMain;
        return nodeTube;
    };

    /** 添加新的瓶子 */
    addTube(nodeShelf: cc.Node, tubeId: number) {
        let nodeTube = this.getTube(this.dataObj.blockTotal);
        let script = nodeTube.getComponent("MatchTube");
        script.initName(this.tubeName, tubeId);
        script.shelf_id = nodeShelf.getComponent("MatchShelf").shelf_id;
        nodeTube.parent = nodeShelf.getChildByName('main');
        return nodeTube;
    };

    /** 添加动物 */
    addBlock(nodeTube: cc.Node, blockObj: BlockObj) {
        let scriptTube = nodeTube.getComponent("MatchTube");
        let block = this.getBlock(blockObj.number, blockObj.isCover);
        block.zIndex = scriptTube.nodeMain.childrenCount;
        block.y = -scriptTube.hStart + scriptTube.hDis * scriptTube.nodeMain.childrenCount;
        block.parent = scriptTube.nodeMain;
        let scriptBlock = block.getComponent("MatchBlock");
        scriptBlock.shelf_id = blockObj.shilf_id;
        scriptBlock.tube_id = blockObj.tube_id;
        scriptBlock.block_id = blockObj.block_id;
        scriptBlock.localParent = nodeTube;
    };

    /** 获取 瓶子 */
    getShelf(blockNum: number) {
        let nodeShelf: cc.Node = this.poolMatchShelf.size() > 0 ? this.poolMatchShelf.get() : cc.instantiate(this.preMatchShelf);
        nodeShelf.getComponent("MatchShelf").init(blockNum);
        return nodeShelf;
    }

    /** 获取 瓶子 */
    getTube(blockNum: number) {
        let nodeTube: cc.Node = this.poolMatchTube.size() > 0 ? this.poolMatchTube.get() : cc.instantiate(this.preMatchTube);
        nodeTube.getComponent("MatchTube").init(blockNum);
        return nodeTube;
    }

    /** 获取 动物 */
    getBlock(type: number, cover: boolean) {
        let nodeBlock: cc.Node = this.poolMatchBlock.size() > 0 ? this.poolMatchBlock.get() : cc.instantiate(this.preMatchBlock);
        nodeBlock.getComponent("MatchBlock").init(type, cover);
        return nodeBlock;
    }


    /** 检测新手引导状态 */
    checkNewPlayerState() {
        if (this.isLevelSpecial) {
            return null;
        }
        let gameData = DataManager.data.sortData;
        if (gameData.level == 1 && gameData.newTip.cur == 0) {
            return CConst.newPlayer_guide_sort_1;
        } else if (gameData.level == 1 && gameData.newTip.cur == 1) {
            return CConst.newPlayer_guide_sort_2;
        } else if (gameData.level == 2 && gameData.newTip.cur == 2) {
            return CConst.newPlayer_guide_sort_3;
        }
        return null;
    }

    /** 检测关卡完成 */
    checkLevelFinish() {
        console.log("=====checkLevelFinish====1==", this.SaveCount.length);
        if (this.dataObj.isFinish) return;
        if (this.SaveCount.length > 0) return;
        for (let i = this.nodeMain.childrenCount - 1; i >= 0; i--) {
            let shelfOne = this.nodeMain.children[i];
            let shelfMain = shelfOne.getComponent("MatchShelf").nodeMain;
            let shelfLength = shelfMain.childrenCount;
            if (shelfLength > 0) {
                for (let j = shelfLength - 1; j >= 0; j--) {
                    let tubeOne = shelfMain.children[j];
                    let blockMain = tubeOne.getComponent("MatchTube").nodeMain;
                    let blockLength = blockMain.childrenCount;
                    console.log("=====checkLevelFinish====2==", blockLength)
                    if (blockLength > 0) return;
                }
            }
        }
        this.dataObj.isFinish = true;
        this.scheduleOnce(this.levelGameOver, 0.5);
    }

    /**
     * 关卡结束
     */
    levelGameOver() {
        console.log("=====levelGameOver======")
        // 打点
        NativeCall.sTsEvent();
        // NativeCall.closeBanner();

        let levelSort = DataManager.data.match.level;

        this.dataObj.isFinish = true;
        // 打点 过关
        NativeCall.logEventOne(GameDot.dot_JigLevelPass);
        NativeCall.logEventOne(GameDot.dot_pass_level_all);

        // 进入下一关
        let funcNext = () => {
            let gameData = DataManager.data.match;
            gameData.level += 1;
            gameData.passLevel += 1;
            gameData.lastTime = Math.floor(new Date().valueOf() / 1000);
            this.uiLine.getComponent('GameMatchLine').playLineAnim();
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
        } else {
            funcNext();
        }
    }

    /**
     * 关卡失败
     */
    matchGameOver() {
        if (this.dataObj.isFinish) return;
        console.log("=====matchGameOver======")
        // 打点
        NativeCall.sTsEvent();
        this.dataObj.isFinish = true;
        let levelSort = DataManager.data.match.level;
        // 打点 过关
        NativeCall.logEventOne(GameDot.dot_JigLevelOver);

        // 进入下一关
        let funcNext = () => {
            kit.Event.emit(CConst.event_enter_gameOver);
        };
        let isPlayAds = DataManager.checkIsPlayAdvert(levelSort);
        if (isPlayAds) {
            // 打点 插屏广告请求（过关）
            NativeCall.logEventThree(GameDot.dot_adReq, "inter_gameover", "Interstital");
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
        } else {
            funcNext();
        }
    }

    /** 监听-注册 */
    listernerRegist(): void {
        kit.Event.on(CConst.event_enter_nextMatchLevel, this.enterLevel, this);
    }

    /** 监听-取消 */
    listernerIgnore(): void {
        kit.Event.removeByTarget(this);
    };

    nextLevel() {
        DataManager.data.match.level += 1
        this.enterLevel(false, true);
    };

    protected onDestroy(): void {
        this.listernerIgnore();
    }
}
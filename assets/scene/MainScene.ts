import {kit} from "./../src/kit/kit";
import Common from "../src/config/Common";
import CConst from "../src/config/CConst";
import GameDot from "../src/config/GameDot";
import NativeCall from "../src/config/NativeCall";
import DataManager, {GameState, LangChars} from "../src/config/DataManager";
import Loading from "../res/prefab/Loading/src/Loading";
import MainMenu from "../res/prefab/MainMenu/src/MainMenu";

/** 资源路径（层、弹窗预制体） */
export const ResPath = {
    // 公用
    preGameWin: {bundle: 'prefabs', path: './components/GameWin/res/prefab/GameWin'},
    preGameOver: {bundle: 'prefabs', path: './components/GameOver/res/prefab/GameOver'},
    preNewPlayer: {bundle: 'prefabs', path: './components/NewPlayer/res/prefab/NewPlayer'},
    // 游戏
    preGameSort: {bundle: 'prefabs', path: './games/GameSort/res/prefab/GameSort'},
    preGameMatch: {bundle: 'prefabs', path: './games/GameSort/res/prefab/GameMatch'},
}

const {ccclass, property} = cc._decorator;
@ccclass
export default class MainScene extends cc.Component {

    /** loading */
    @property(cc.Prefab) preLoading: cc.Prefab = null;
    /** mainmenu */
    @property(cc.Prefab) preMainMenu: cc.Prefab = null;
    /** video */
    @property(cc.Node) nodeVideo: cc.Node = null;
    /** noVideoTip */
    @property(cc.Node) noVideoTip: cc.Node = null;

    // 不需要动态加载
    nodeLoading: cc.Node = null;
    NodeMainMenu: cc.Node = null;

    // 动态加载
    nodeGame: cc.Node = null;
    // 动态加载
    nodeMatchGame: cc.Node = null;
    // 当前玩的游戏S
    gameType: String = '';

    /** 节点-弹窗父节点 */
    nodePopup: cc.Node = null;

    /** 是否完成-loading动画 */
    isCompleteLoading: Boolean = false;
    /** 是否完成-数据加载 */
    isCompleteLoadData: Boolean = false;

    protected onLoad(): void {
        cc.macro.ENABLE_MULTI_TOUCH = false;//关闭多点触控
        this.windowsFit();
        this.listernerRegist();
    }

    protected start(): void {
        this.init();
    }

    windowsFit() {
        let isNotFit = cc.winSize.height / cc.winSize.width <= 1.78;
        let canvas = this.node.getComponent(cc.Canvas);
        console.log("canvas size:", cc.view.getCanvasSize());
        //视图中窗口可见区域尺寸
        console.log("visible Size:", cc.view.getVisibleSize());
        //设计分辨率
        console.log("DesignResolutionSize Size:", cc.view.getDesignResolutionSize());
        //屏幕尺寸
        console.log("frame size", cc.view.getFrameSize());
        if (isNotFit) {
            canvas.fitHeight = true;
            canvas.fitWidth = true;
        }
        console.log("height pre", cc.winSize.height / cc.view.getFrameSize().height);
        this.node.getChildByName('bg').width = cc.view.getFrameSize().width * cc.winSize.height / cc.view.getFrameSize().height
        // this.node.getChildByName('bg').height = cc.view.getFrameSize().height
    };

    init() {
        // 应用内评价（启动游戏时调用）
        let funcEvaluate = () => {
            let _data = DataManager.data;
            if (_data.isAllreadyEvaluate) {
                return;
            }
            NativeCall.evaluateFirst();
        };
        // 初始化音频
        let funcMusic = () => {
            kit.Audio.initAudio();
            kit.Audio.playMusic(CConst.sound_path_music);
        };
        // 初始化游戏数据
        DataManager.initData(this.nodeVideo, () => {
            funcEvaluate();
            funcMusic();
            this.initUI();
        });
    }

    /** 初始化 数据*/
    initData(funcUI: Function) {
        // 初始化游戏数据
        DataManager.initData(this.nodeVideo, funcUI);
    };

    /** 初始化 ui */
    initUI(): void {
        this.initLoading();
        this.initNoVideo();
        this.initPopup();
        this.loadComponents();
    };

    /** 加载界面 初始化 */
    initLoading(): void {
        DataManager.setGameState(GameState.stateLoading);
        this.nodeLoading = cc.instantiate(this.preLoading);
        this.nodeLoading.zIndex = CConst.zIndex_loading;
        this.nodeLoading.parent = this.node;
    };

    /** 无视频提示 */
    initNoVideo() {
        DataManager.setString(LangChars.CannotWatchAds, (chars: string) => {
            this.noVideoTip.getComponent(cc.Label).string = chars;
        });
        this.noVideoTip.zIndex = CConst.zIndex_noVideo;
        this.noVideoTip.opacity = 0;
    }

    /** 弹窗父节点 初始化 */
    initPopup(): void {
        this.nodePopup = new cc.Node();
        this.nodePopup.zIndex = CConst.zIndex_popup;
        this.nodePopup.parent = this.node;
        kit.Popup.container = this.nodePopup;
    };

    /** 加载公用资源 */
    loadComponents() {
        let arrName = Object.keys(ResPath);
        let lenPrefab = arrName.length;
        let loadBundleRes = (index, callback) => {
            if (index < lenPrefab) {
                let cfg: { bundle: string, path: string } = ResPath[arrName[index]];
                DataManager.loadBundleRes(cfg.bundle, cfg.path, (asset) => {
                    index++;
                    loadBundleRes(index, callback);
                });
            } else {
                callback && callback();
            }
        };
        loadBundleRes(0, () => {
            NativeCall.logEventOne(GameDot.dot_resource_load_success);
            this.isCompleteLoadData = true;
            this.enterMenuLayer();
        });
    }

    /** 进入主菜单 */
    enterMenuLayer() {
        if (!this.isCompleteLoading || !this.isCompleteLoadData) {
            return;
        }

        // 进入 主菜单
        let funcEnterMenu = () => {
            this.NodeMainMenu = cc.instantiate(this.preMainMenu);
            this.NodeMainMenu.zIndex = CConst.zIndex_menu;
            this.NodeMainMenu.parent = this.node;
            let script = this.NodeMainMenu.getComponent(MainMenu);
            script.init(() => {
                DataManager.setGameState(GameState.stateMainMenu);
                if (DataManager.stateLast == GameState.stateLoading) {
                    this.nodeLoading.active = false;
                }
            });
        }
        let script = this.nodeLoading.getComponent(Loading);
        let dataSort = DataManager.data.sortData;
        let isNewPlayer = dataSort.newTip.cur < dataSort.newTip.max;
        script.playAniLeave(this.eventBack_enterGameSort.bind(this));
        // script.playAniLeave(this.eventBack_enterGameMatch.bind(this));

        // if (isNewPlayer) {
        //     Common.log('新手 进入游戏');
        //     script.playAniLeave(this.eventBack_enterGameSort.bind(this));
        // }
        // else {
        //     Common.log('非新手 进入主界面');
        //     script.playAniLeave(funcEnterMenu);
        // }
    }

    /** 监听-注册 */
    listernerRegist(): void {
        kit.Event.on(CConst.event_complete_loading, this.eventBack_loadingComplete, this);
        kit.Event.on(CConst.event_enter_mainMenu, this.eventBack_enterMainMenu, this);
        kit.Event.on(CConst.event_enter_gameSort, this.eventBack_enterGameSort, this);
        kit.Event.on(CConst.event_enter_newPlayer, this.eventBack_enterNewPlayer, this);
        kit.Event.on(CConst.event_enter_gameWin, this.eventBack_enterGameWin, this);
        kit.Event.on(CConst.event_enter_gameOver, this.eventBack_enterGameOver, this);
        kit.Event.on(CConst.event_tip_noVideo, this.eventBack_noVideoTip, this);
    }

    /** 事件回调：loading完成 */
    eventBack_loadingComplete() {
        this.isCompleteLoading = true;
        this.enterMenuLayer();
    };

    /** 事件回调：进入菜单 */
    eventBack_enterMainMenu() {
        DataManager.setGameState(GameState.stateMainMenu);
        if (DataManager.stateLast == GameState.stateGame) {
            if (this.nodeGame) this.nodeGame.active = false;
            if (this.nodeMatchGame) this.nodeMatchGame.active = false;
            // NativeCall.closeBanner();
        }

        if (this.NodeMainMenu) {
            this.NodeMainMenu.active = true;
        } else {
            this.NodeMainMenu = cc.instantiate(this.preMainMenu);
            this.NodeMainMenu.zIndex = CConst.zIndex_menu;
            this.NodeMainMenu.parent = this.node;
        }
        let script = this.NodeMainMenu.getComponent(MainMenu);
        script.init();
    };

    /** 事件回调：进入游戏sort */
    eventBack_enterGameSort() {
        DataManager.setGameState(GameState.stateGame);
        this.gameType = 'GameSort';
        if (DataManager.stateLast == GameState.stateMainMenu) {
            this.NodeMainMenu.active = false;
        } else if (DataManager.stateLast == GameState.stateLoading) {
            this.nodeLoading.active = false;
        }
        if (this.nodeMatchGame) this.nodeMatchGame.active = false;

        if (this.nodeGame) {
            this.nodeGame.active = true;
            this.nodeGame.opacity = 255;
            let script = this.nodeGame.getComponent('GameSort');
            script.enterLevel(false, true);
        } else {
            let cfg = ResPath.preGameSort;
            DataManager.loadBundleRes(cfg.bundle, cfg.path, (prefab: cc.Prefab) => {
                if (!prefab) {
                    return;
                }
                this.nodeGame = cc.instantiate(prefab);
                this.nodeGame.setContentSize(cc.winSize);
                this.nodeGame.position = cc.v3();
                this.nodeGame.zIndex = CConst.zIndex_game;
                this.nodeGame.parent = this.node;
            });
        }
    }

    /** 事件回调：进入游戏Match */
    eventBack_enterGameMatch() {
        DataManager.setGameState(GameState.stateGame);
        this.gameType = 'GameMatch';
        if (DataManager.stateLast == GameState.stateMainMenu) {
            this.NodeMainMenu.active = false;
        } else if (DataManager.stateLast == GameState.stateLoading) {
            this.nodeLoading.active = false;
        }

        if (this.nodeMatchGame) {
            this.nodeMatchGame.active = true;
            this.nodeMatchGame.opacity = 255;
            let script = this.nodeMatchGame.getComponent('GameMatch');
            script.enterLevel(false, true);
        } else {
            let cfg = ResPath.preGameMatch;
            DataManager.loadBundleRes(cfg.bundle, cfg.path, (prefab: cc.Prefab) => {
                if (!prefab) {
                    return;
                }
                this.nodeMatchGame = cc.instantiate(prefab);
                this.nodeMatchGame.setContentSize(cc.winSize);
                this.nodeMatchGame.position = cc.v3();
                this.nodeMatchGame.zIndex = CConst.zIndex_gameMatch;
                this.nodeMatchGame.parent = this.node;
            });
        }
    }

    /** 事件回调：进入新手引导 */
    eventBack_enterNewPlayer(type: string, isRight: boolean = false) {
        let cfg = ResPath.preNewPlayer;
        DataManager.loadBundleRes(cfg.bundle, cfg.path, (prefab: cc.Prefab) => {
            if (!prefab) {
                return;
            }
            let nodeNewPLayer = cc.instantiate(prefab);
            nodeNewPLayer.zIndex = CConst.zIndex_newPlayer;
            nodeNewPLayer.parent = this.node;
            let script = nodeNewPLayer.getComponent('NewPlayer');
            switch (type) {
                case CConst.newPlayer_guide_sort_1:
                case CConst.newPlayer_guide_sort_2:
                case CConst.newPlayer_guide_sort_3:
                    script.show(type, isRight);
                    break;
                default:
                    nodeNewPLayer.removeFromParent();
                    break;
            }
        });
    };

    /** 事件回调：进入胜利界面 */
    eventBack_enterGameWin() {
        let cfg = ResPath.preGameWin;
        DataManager.loadBundleRes(cfg.bundle, cfg.path, (prefab: cc.Prefab) => {
            if (!prefab) {
                return;
            }
            let nodeGameWin = cc.instantiate(prefab);
            nodeGameWin.zIndex = CConst.zIndex_gameWin;
            nodeGameWin.parent = this.node;
            nodeGameWin.getComponent('GameWin').gameType = this.gameType;
        });
    };

    /** 事件回调：进入胜利界面 */
    eventBack_enterGameOver() {
        let cfg = ResPath.preGameOver;
        DataManager.loadBundleRes(cfg.bundle, cfg.path, (prefab: cc.Prefab) => {
            if (!prefab) {
                return;
            }
            let nodeGameOver = cc.instantiate(prefab);
            nodeGameOver.zIndex = CConst.zIndex_gameOver;
            nodeGameOver.parent = this.node;
            nodeGameOver.getComponent('GameOver').gameType = this.gameType;
        });
    };

    /** 事件回调：无视频提示 */
    eventBack_noVideoTip(): void {
        this.noVideoTip.opacity = 255;
        let anim = this.noVideoTip.getComponent(cc.Animation);
        anim.stop();
        anim.once(cc.Animation.EventType.FINISHED, () => {
            this.noVideoTip.opacity = 0;
        }, this);
        anim.play();
    }

    /** 监听-取消 */
    listernerIgnore(): void {
        kit.Event.removeByTarget(this);
    };

    protected onDestroy(): void {
        this.listernerIgnore();
    }
}
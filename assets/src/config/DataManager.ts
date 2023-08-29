import CConst from "./CConst";
import Common from "./Common";
import GameDot from "./GameDot";
import NativeCall from "./NativeCall";

/** 游戏状态 */
export const GameState = {
    stateLoading: 1,
    stateMainMenu: 1 << 1,
    stateGame: 1 << 2,
}

/** 本地化 文字 文件 */
export const LangFile = {
    en: 'en',// 英文
    zh: 'zh',// 繁体中文
    jp: 'jp',// 日文
    kr: 'kr',// 韩文
};

/** 本地化 文字 字段 */
export const LangChars = {
    Loading: "Loading",
    sort1: "sort1",
    sort2: "sort2",
    sort3: "sort3",
    SPECIAL: "SPECIAL",
    REVIEW: "REVIEW",
    PleaseRateUs: "PleaseRateUs",// 未使用
    CannotWatchAds: "CannotWatchAds",
    LEVEL: "LEVEL",
    QUIT: "QUIT",
    OK: "OK",
    SETTING: "SETTING",
    ON: "ON",
    OFF: "OFF",
    SPECIALLEVEL: "SPECIALLEVEL",
    PLAY: "PLAY",
    SKIP: "SKIP",
    Next: "Next",
};

/** 本地化 资源类型 */
export const ResType = {
    PNG: "png",
    DRAGON: "dragon",
};

/** 本地化 图片 名字 */
export const LangImg = {
    word_logo_title: "word_logo_title",
    word_win_title: "word_win_title",
};

/** 道具 */
export enum PropType {
    /** 道具 返回步数 */
    propBack = 'back',
    /** 道具 瓶子 */
    propTube = 'tube',
}

/** 数据管理类 */
class DataManager {
    private static _instance: DataManager;
    public static get instance(): DataManager {
        if (!this._instance) {
            this._instance = new DataManager();
        }
        return this._instance;
    };

    isDebug: boolean = false;
    /** 当前状态 */
    stateCur: number = 0;
    /** 上一个状态 */
    stateLast: number = 0;
    /** 视频节点 */
    nodeVideo: cc.Node = null;
    /** 资源 */
    objResources: any = {};
    /** objBundle */
    objBundle: any = {};
    /** 本地语言 */
    langCur: string = LangFile.en;
    /** 云加载 */
    isCloudLoad: boolean = false;
    /** 插屏广告开启关卡 */
    adStartLevel: number = 4;

    /** 初始数据 */
    data = {
        // 用户初始化数据
        userInfo: { id: 0, name: "Tony" },
        adsRemove: false,// 是否去除广告
        adRecord: { time: 0, level: 0 },// 上一次广告计时
        adCount: 0,// 广告计数
        s2sCount: 0,// 回传计数
        checkAdCpe: true,// 打点记录 只打一次
        coin: 300,// 金币数量
        isAllreadyEvaluate: false,// 是否已经评价
        installtime: new Date().valueOf(),
        revenue: '0',// 收入
        propAddTupe: 2,// 初始有两个加瓶子的道具
        rePlayNum: 1,// 可以重玩的次数，限30关之前；
        returnCount: 6,
        // 关卡数据 基础
        sortData: {
            level: 1,// 当前关卡====添加粒子效果 后面的
            newTip: {
                cur: 0,
                max: 3,
            },
            curLevelData: [],// 存放关卡数据
        },
        // 关卡数据 特殊
        specialData: {
            level: 1,// 特殊关卡
            isFirst: true,
            curLevelData: [],// 存放关卡数据
        }
    };

    /** 初始化数据 */
    public initData(nodeAni: cc.Node, callback) {
        let _data = JSON.parse(cc.sys.localStorage.getItem('gameData'));
        if (_data) {
            // this.data = Common.clone(_data);
            let data = Common.clone(_data);
            for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    this.data[key] = data[key];
                }
            }
        }
        else {
            cc.sys.localStorage.setItem('gameData', JSON.stringify(_data));
        }
        // 初始化视频动画
        this.nodeVideo = nodeAni;
        this.nodeVideo.zIndex = CConst.zIndex_video;
        this.nodeVideo.active = false;
        // 初始化收入
        NativeCall.setRevenue(this.data.revenue);
        // 初始化语言
        this.initLanguage();
        // 提前加载 本地化 文本
        let pathText = './language/text/' + this.langCur;
        // 提前加载 本地化 图片
        let arrName = Object.keys(LangImg);
        let lenPng = arrName.length;
        let loadLocalPng = (index) => {
            if (index < lenPng) {
                let pathPng = './language/img/' + this.langCur + '/' + arrName[index];
                this.loadRes(pathPng, (asset: any) => {
                    index++;
                    loadLocalPng(index);
                });
            }
            else {
                callback && callback();
            }
        };
        // 资源下载 先下载text 再下载png
        this.loadRes(pathText, (asset: any)=>{
            loadLocalPng(0);
        });
    }

    /** 多语言设置 */
    public initLanguage() {
        let language = NativeCall.checkLang(LangFile.en);
        switch (language) {
            case 'ja':
            case 'JA':
            case 'jp':
            case 'JP':
                this.langCur = LangFile.jp;
                break;
            case 'ko':
            case 'KO':
            case 'kr':
            case 'KR':
                this.langCur = LangFile.kr;
                break;
            case 'cn':
            case 'CN':
            case 'zh':
            case 'ZH':
            case 'tw':
            case 'TW':
                this.langCur = LangFile.zh;
                break;
            default:
                this.langCur = LangFile.en;
                break;
        }
        Common.log(' 初始化语言：', this.langCur);
        return this.langCur;
    }

    /** 设置游戏状态 */
    public setGameState(state: number) {
        this.stateLast = this.stateCur;
        this.stateCur = state;
    }

    /**
     * 存储数据
     * @param isSaveCloud 是否存储到云端
     * @returns 
     */
    public setData(isSaveCloud = false) {
        let dataString = JSON.stringify(this.data);
        cc.sys.localStorage.setItem('gameData', dataString);
        if (typeof (jsb) === 'undefined' || !isSaveCloud) {
            return;
        }
    }

    /** 检测是否有banner */
    public checkBanner() {
        if (this.data.adsRemove) {
            return false;
        }
        return this.data.sortData.level > 3;
    }

    /**
     * 检测插屏是否开启(针对游戏结束自动弹出的广告)
     * @param levelNow 检测时的关卡 
     * @returns 
     */
    public checkIsPlayAdvert(levelNow: number) {
        let levelLimit = this.adStartLevel + 1;
        Common.log(' cocos checkIsPlayAds() 插屏检测 levelNow: ', levelNow, '; levelLimit: ', levelLimit);
        if (levelNow < levelLimit) {
            return false;
        }
        else if (levelNow == levelLimit) {
            return true;
        }

        let timeNow = Math.floor(new Date().getTime() * 0.001);
        let timeRecord = this.data.adRecord.time;
        let timeLast = timeNow - timeRecord;
        let levelRecord = this.data.adRecord.level;
        let levelLast = levelNow - levelRecord;
        Common.log(' 检测 时间 timeLast: ', timeLast, '; timeNow: ', timeNow, '; timeRecord: ', timeRecord);
        if (levelNow > 20) {
            return timeLast >= 30;
        }
        else {
            Common.log(' 检测 关卡 levelLast: ', levelLast, '; levelNow: ', levelNow, '; levelRecord: ', levelRecord);
            return timeLast >= 90 || levelLast >= 3;
        }
    };

    /**
     * 播放奖励视频
     * @param funcA 
     * @param funcB 
     * @returns
     */
    public playVideo(funcA: Function, funcB: Function): boolean {
        let isReady = NativeCall.videoCheck();
        if (isReady) {
            // NativeCall.closeBanner();
            this.adAnimPlay(NativeCall.videoShow.bind(NativeCall, funcA, funcB));
        }
        return isReady;
    };

    /**
     * 播放广告视频
     * @param funcA 
     * @param funcB 
     * @returns 
     */
    public playAdvert(funcA: Function, funcB: Function): boolean {
        let isReady = NativeCall.advertCheck();
        if (isReady) {
            // NativeCall.closeBanner();
            this.adAnimPlay(NativeCall.advertShow.bind(NativeCall, funcA, funcB));
        }
        return isReady;
    }

    /** 播放动画 */
    public adAnimPlay(callback: Function = null) {
        this.nodeVideo.active = true;
        let animation = this.nodeVideo.getChildByName("dragon").getComponent(dragonBones.ArmatureDisplay)
        animation.once(dragonBones.EventObject.COMPLETE, () => {
            this.nodeVideo.active = false;
            if (typeof callback == "function" && cc.isValid(callback)) callback();
        })
        animation.playAnimation('newAnimation', 1);
    };

    /** 更新广告计数 */
    public updateAdCount() {
        this.data.adCount++;
        let dot = GameDot['dot_ad_revenue_track_flag_' + this.data.adCount];
        dot && NativeCall.logEventOne(dot);
        // 过完35关、看广告次数达到50次打点，只记一次；
        if (this.data.checkAdCpe && this.data.sortData.level > 35 && this.data.adCount >= 50) {
            this.data.checkAdCpe = false;
            NativeCall.logEventOne(GameDot.dot_applovin_cpe);
        }
        this.setData(false);
    };

    /** 更新回传计数 */
    public updateS2SCount(): number {
        this.data.s2sCount++;
        this.setData(false);
        return this.data.s2sCount;
    };

    /** 缓冲池处理 */
    public poolPut(node: cc.Node, pool: cc.NodePool) {
        if (pool.size() <= 100) {
            pool.put(node);
        } else {
            node.destroy();
        }
    };

    /** titleY */
    public getTitlePosY() {
        let heightMax = cc.winSize.height * 0.5;
        return heightMax * 0.3 + 50;
    };

    public setString(key: string, callback) {
        let path = './language/text/' + this.langCur;
        this.loadRes(path, (jsonAsset: cc.JsonAsset) => {
            if (jsonAsset) {
                callback && callback(jsonAsset.json[key]);
            }
        });
    };

    /**
     * 加载resource资源
     * @param path 
     * @returns 
     */
    public loadRes(path: string, callback: Function) {
        let assetOld = this.objResources[path];
        if (assetOld) {
            callback && callback(assetOld);
        }
        else {
            cc.resources.load(path, (err: Error, assetNew: any) => {
                if (err) {
                    Common.log("加载失败：", path);
                }
                else {
                    Common.log("加载资源：", path);
                    this.objResources[path] = assetNew;
                    callback && callback(assetNew);
                }
            });
        }
    }

    /** 加载bundle资源 */
    public loadBundleRes(bundleName: string, pathName: string, callback: Function) {
        let funcAfter = (bundle: cc.AssetManager.Bundle)=>{
            let asset = this.objResources[pathName];
            if (asset) {
                callback && callback(asset);
            }
            else{
                bundle.load(pathName, (e, asset)=>{
                    if (asset) {
                        this.objResources[pathName] = asset;
                        callback && callback(asset);
                    }
                });
            }
        };
        let bundle: cc.AssetManager.Bundle = this.objBundle[bundleName];
        if (bundle) {
            funcAfter(bundle);
        }
        else{
            cc.assetManager.loadBundle(bundleName, (e, bundle: cc.AssetManager.Bundle)=>{
                if (bundle) {
                    this.objBundle[bundleName] = bundle;
                    funcAfter(this.objBundle[bundleName]);
                }
            });
        }
    }
};
export default DataManager.instance;

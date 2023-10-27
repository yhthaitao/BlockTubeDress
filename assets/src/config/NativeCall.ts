import {kit} from "../kit/kit";
import CConst from "./CConst";
import Common from "./Common";
import DataManager, {PropType} from "./DataManager";
import GameDot from "./GameDot";

/** 原生交互 */
class NativeCall {
    private static _instance: NativeCall;
    public static get instance(): NativeCall {
        if (!this._instance) {
            this._instance = new NativeCall();
            cc["NativeCall"] = NativeCall;
        }
        return this._instance;
    };

    noAdsTime = 60;//广告时间限制
    backGameAdsTime = 0;//切出去的时间戳
    backGameAdsLevel = 0;//切出去时候，成功播放广告的关卡数，同一关只播放一次
    backGameNoAdsTime = 30;//记录播放间隔时间

    /** 云加载 开始 */
    public cloudLoadStart(): void {
        if (typeof (jsb) == "undefined" || cc.sys.os == cc.sys.OS_IOS) return;
        Common.log(' cocosToJava cocos method: cloudLoadStart() 云加载 开始 ');
        if (jsb && jsb.reflection && jsb.reflection.callStaticMethod) {
            let methodName = "loadGame";
            let methodSignature = "()V";
            jsb.reflection.callStaticMethod(CConst.javaClassName, methodName, methodSignature);
        }
    }

    /** 云加载 成功 */
    public cloudLoadSucce(data: string) {
        Common.log(' 未实现 javaToCocos cocos method: cloudLoadSucce() ');
        DataManager.isCloudLoad = true;
        if (data.length <= 0) {
            return;
        }
    }

    /** 云加载 失败 */
    public cloudLoadError() {
        Common.log(' javaToCocos cocos method: cloudLoadError() ');
        DataManager.isCloudLoad = false;
    }

    /** 分享 */
    public share(level: string): void {
        if (typeof (jsb) == "undefined" || cc.sys.os == cc.sys.OS_IOS) return;
        Common.log(' cocosToJava cocos method: share() 分享 ');
        this.logEventOne(CConst.event_log_share_click);
        if (jsb && jsb.reflection && jsb.reflection.callStaticMethod) {
            let methodName = "share";
            let methodSignature = "(Ljava/lang/String;)V";
            jsb.reflection.callStaticMethod(CConst.javaClassName, methodName, methodSignature, level);
        }
    }

    /** 显示banner */
    public showBanner() {
        if (typeof (jsb) == "undefined" || cc.sys.os == cc.sys.OS_IOS) return;
        if (!DataManager.checkBanner()) {
            return;
        }
        Common.log(' cocosToJava cocos method: showBanner() 显示banner ');
        if (jsb && jsb.reflection && jsb.reflection.callStaticMethod) {
            let methodName = "showBanner";
            let methodSignature = "()V";
            jsb.reflection.callStaticMethod(CConst.javaClassName, methodName, methodSignature);
        }
    };

    /** 隐藏banner */
    public closeBanner = function () {
        if (typeof (jsb) == "undefined" || cc.sys.os == cc.sys.OS_IOS) return;
        if (!DataManager.checkBanner()) {
            return;
        }
        Common.log(' cocosToJava cocos method: closeBanner() 隐藏banner ');
        if (jsb && jsb.reflection && jsb.reflection.callStaticMethod) {
            let methodName = "closeBanner";
            let methodSignature = "()V";
            jsb.reflection.callStaticMethod(CConst.javaClassName, methodName, methodSignature);
        }
    };

    /** 视频 检测 */
    public videoCheck(): boolean {
        if (typeof (jsb) == "undefined" || cc.sys.os == cc.sys.OS_IOS) return false;
        if (jsb && jsb.reflection && jsb.reflection.callStaticMethod) {
            let methodName = "checkMopubRewardVideo";
            let methodSignature = "()Z";
            let isReady = jsb.reflection.callStaticMethod(CConst.javaClassName, methodName, methodSignature);
            Common.log(' cocosToJava cocos method: videoCheck() 视频 检测 ready：', isReady);
            return isReady;
        }
        return false;
    }

    funcVideoSuccess: Function = null;
    funcVideoFail: Function = null;

    /** 视频 播放 */
    public videoShow(funcA: Function, funcB: Function): void {
        if (typeof (jsb) == "undefined" || cc.sys.os == cc.sys.OS_IOS) return;

        this.funcVideoSuccess = funcA;
        this.funcVideoFail = funcB;
        Common.log(' cocosToJava cocos method: videoShow() 视频 播放 ');
        if (jsb && jsb.reflection && jsb.reflection.callStaticMethod) {
            let methodName = "showMopubRewardVideo";
            let methodSignature = "()V";
            jsb.reflection.callStaticMethod(CConst.javaClassName, methodName, methodSignature);
        }
        this.logEventOne(GameDot.dot_ads_request_video);
        this.logEventOne(GameDot.dot_ads_request_all);
    }

    public videoStart() {
        Common.log(' javaToCocos cocos method: videoStart() 视频 播放 开始 ');
    }

    /** 视频 播放完成 */
    public videoFinish() {
        Common.log(' javaToCocos cocos method: videoFinish() 视频 播放 完成 ');
        // 看完视频
        this.funcVideoSuccess && this.funcVideoSuccess();
        DataManager.updateAdCount();
        this.sTsEvent();
        DataManager.data.adRecord.time = Math.floor(new Date().getTime() * 0.001) + this.noAdsTime / 2;
        Common.log(' cocosToJava cocos method: advertCheck()：=====videoFinish=lastAdsTime=', DataManager.data.adRecord.time, ",noAdsTime=", this.noAdsTime);
    }

    /** 视频 播放失败 */
    public videoFailClosed() {
        Common.log(' javaToCocos cocos method: videoFailClosed() 视频 播放 被关闭 ');
        this.funcVideoFail && this.funcVideoFail();
    }

    /** 视频 播放失败 */
    public videoFailLoad() {
        Common.log(' javaToCocos cocos method: videoFailLoad() 视频 播放 加载失败 ');
        this.funcVideoFail && this.funcVideoFail();
    }

    /** 视频 播放失败 */
    public videoFailError() {
        Common.log(' javaToCocos cocos method: videoFailError() 视频 播放 出错 ');
        this.funcVideoFail && this.funcVideoFail();
    }

    /** 广告 检测 */
    public advertCheck(): boolean {
        if (typeof (jsb) == "undefined" || cc.sys.os == cc.sys.OS_IOS) return false;
        if (DataManager.data.sortData.level > 10) this.noAdsTime = 30;
        let timeNow = Math.floor(new Date().getTime() * 0.001);
        let lastAdTime = timeNow - DataManager.data.adRecord.time
        console.log("======lastAdTime====", lastAdTime, ",noAdsTime=", this.noAdsTime, ",lastAdsTime=", DataManager.data.adRecord.time)
        if (lastAdTime <= this.noAdsTime) {
            Common.log(' cocosToJava cocos method: advertCheck()：======noAdsTime时间内不播=timeNow=', timeNow, ",lastAdsTime=", DataManager.data.adRecord.time, ",noAdsTime=", this.noAdsTime);
            return false;
        }
        let methodName = "interAdReady";
        let methodSignature = "()Z";
        if (jsb && jsb.reflection && jsb.reflection.callStaticMethod) {
            let isReady = jsb.reflection.callStaticMethod(CConst.javaClassName, methodName, methodSignature);
            Common.log(' cocosToJava cocos method: advertCheck() ready：', isReady);
            return isReady;
        }
        return false;
    }

    funcAdvertSuccess: Function = null;
    funcAdvertFail: Function = null;

    /** 广告 播放 */
    public advertShow(funcA: Function, funcB: Function) {
        if (typeof (jsb) == "undefined" || cc.sys.os == cc.sys.OS_IOS) return;

        this.funcAdvertSuccess = funcA;
        this.funcAdvertFail = funcB;
        Common.log(' cocosToJava cocos method: advertShow() 广告 播放 ');
        if (jsb && jsb.reflection && jsb.reflection.callStaticMethod) {
            let methodName = "showInterstitial";
            let methodSignature = "()V";
            jsb.reflection.callStaticMethod(CConst.javaClassName, methodName, methodSignature);
        }
        this.logEventOne(GameDot.dot_ads_request_advert);
        this.logEventOne(GameDot.dot_ads_request_all);
    }

    /** 广告 播放完成 */
    public advertFinish() {
        Common.log(' javaToCocos cocos method: advertFinish() 广告 播放完成 ');
        this.funcAdvertSuccess && this.funcAdvertSuccess();
        DataManager.updateAdCount();
        this.sTsEvent();
        DataManager.data.adRecord.time = Math.floor(new Date().getTime() * 0.001)
        Common.log(' cocosToJava cocos method: advertCheck()：=====advertFinish=lastAdsTime=', DataManager.data.adRecord.time, ",noAdsTime=", this.noAdsTime);
    }

    /** 切出去后，记录时间 */
    public outGameSaveTime() {
        this.backGameAdsTime = Math.floor(new Date().getTime() * 0.001);//切出去后，记录一下当前时间戳
        console.log("=====outGameSaveTime=backGameAdsTime====", this.backGameAdsTime)
    }

    /** 游戏从后台返回的调用 */
    public adsTimeTrue() {
        Common.log(' javaToCocos cocos method: adsTimeTrue() ');
        // 打点 插屏广告请求（游戏从后台返回）
        let adsDays = ((new Date().valueOf() - DataManager.data.installtime) / 1000);
        console.log("=====adsTimeTrue=adsDays====", adsDays, "s====", adsDays / 86400, "天===")
        if (adsDays <= 86400) {
            //新用户 首日用户
            return
        } else {
            // if (nowTime - this.lastAdsTime <= 60) {
            //     return;
            // } 原来的版本
            /** 超过2日的,切回游戏给广告 */
            let timeNow = Math.floor(new Date().getTime() * 0.001);//当前时间戳
            // 小于10级不播
            if (DataManager.data.sortData.level <= 10) {
                console.log("=====adsTimeTrue=小于十级不播====")
                return;
            }
            // 同一关不会出现2次
            if (this.backGameAdsLevel == DataManager.data.sortData.level) {
                console.log("=====adsTimeTrue=同等级不播====")
                return;
            }
            console.log("=====adsTimeTrue=backGameNoAdsTime====", this.backGameNoAdsTime, "s=backGameAdsTime===", timeNow - this.backGameAdsTime, "s===")
            if (timeNow - this.backGameAdsTime < this.backGameNoAdsTime) {
                console.log("=====adsTimeTrue=时间不够不播====")
                return;
            }
            this.logEventThree(GameDot.dot_adReq, "inter_backGame", "Interstital");
            let isReady = this.advertCheck();
            if (isReady) {
                this.backGameAdsLevel = DataManager.data.sortData.level;//成功播放，才记录一下这次播放的关卡，下一次不播放。
                // 第一次是30s
                if (this.backGameNoAdsTime == 30) this.backGameNoAdsTime = 60;// 第二次是1分钟
                else if (this.backGameNoAdsTime == 60) this.backGameNoAdsTime = 600;// 第三次是6分钟
                let funcA = () => {
                    // 打点 插屏播放成功（游戏从后台返回）
                    this.logEventTwo(GameDot.dot_ads_advert_succe_back, String(DataManager.data.sortData.level));
                };
                let funcB = (err: any) => {
                };
                DataManager.playAdvert(funcA, funcB);
            }
        }
        // // 打点 插屏广告请求（游戏从后台返回）
        // this.logEventThree(GameDot.dot_adReq, "inter_backGame", "Interstital");
        // let isReady = this.advertCheck();
        // if (isReady) {
        //     let funcA = () => {
        //         // 打点 插屏播放成功（游戏从后台返回）
        //         this.logEventTwo(GameDot.dot_ads_advert_succe_back, String(DataManager.data.sortData.level));
        //     };
        //     let funcB = (err: any) => {
        //     };
        //     DataManager.playAdvert(funcA, funcB);
        // }
    }

    public advertFail() {
        Common.log(' javaToCocos cocos method: advertFail() 广告 播放失败 ');
        this.funcAdvertFail && this.funcAdvertFail();
    }

    /** 无视频 */
    public NoVideo() {
        Common.log(' javaToCocos cocos method: NoVideo() 无视频 ');
        kit.Event.emit(CConst.event_tip_noVideo);
    }

    public NoNetwork() {
        Common.log(' javaToCocos cocos method: NoNetwork() 无网络 ');
        kit.Event.emit(CConst.event_tip_noNetwork);
    }

    /** 打点 回传计数 */
    public sTsEvent() {
        if (typeof (jsb) == "undefined" || cc.sys.os == cc.sys.OS_IOS) return;
        let count = DataManager.updateS2SCount();
        Common.log(' cocosToJava cocos method: sTsEvent() count: ', count);
        if (jsb && jsb.reflection && jsb.reflection.callStaticMethod) {
            let methodName = "reportInstall2";
            let methodSignature = "(Ljava/lang/String;)V";
            jsb.reflection.callStaticMethod(CConst.javaClassName, methodName, methodSignature, String(count));
        }
    }

    /** 打点 带一个 字符串类型参数 */
    public logEventOne(param1: string): void {
        if (typeof (jsb) == "undefined" || cc.sys.os == cc.sys.OS_IOS) return;
        Common.log(' cocosToJava cocos method: logEventOne() name: ', param1);
        if (jsb && jsb.reflection && jsb.reflection.callStaticMethod) {
            let methodName = "facebookLogEvent";
            let methodSignature = "(Ljava/lang/String;)V";
            jsb.reflection.callStaticMethod(CConst.javaClassName, methodName, methodSignature, param1);
        }
    }

    /** 打点 带两个 字符串类型参数 */
    public logEventTwo(param1: string, param2: string): void {
        if (typeof (jsb) == "undefined" || cc.sys.os == cc.sys.OS_IOS) return;
        Common.log(' cocosToJava cocos method: logEventTwo() name: ', param1, '; param1: ', param2);
        if (jsb && jsb.reflection && jsb.reflection.callStaticMethod) {
            let methodName = "valueLogEvent";
            let methodSignature = "(Ljava/lang/String;Ljava/lang/String;)V";
            jsb.reflection.callStaticMethod(CConst.javaClassName, methodName, methodSignature, param1, param2);
        }
    }

    /** 打点 带三个 字符串类型参数 */
    public logEventThree(param1: string, param2: string, param3: string): void {
        if (typeof (jsb) == "undefined" || cc.sys.os == cc.sys.OS_IOS) return;
        Common.log(' cocosToJava cocos method: logEventThree() name: ', param1, '; param1: ', param2, '; param2: ', param3);
        if (jsb && jsb.reflection && jsb.reflection.callStaticMethod) {
            let methodName = "reqLogEvent";
            let methodSignature = "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V";
            jsb.reflection.callStaticMethod(CConst.javaClassName, methodName, methodSignature, param1, param2, param3);
        }
    }

    /** 打点 带四个 字符串类型参数 */
    public logEventFore(param1: string, param2: string, param3: string, param4: string): void {
        if (typeof (jsb) == "undefined" || cc.sys.os == cc.sys.OS_IOS) return;
        Common.log(' cocosToJava cocos method: logEventFore() name: ', param1, '; param1: ', param2, '; param2: ', param3, '; param3: ', param4);
        if (jsb && jsb.reflection && jsb.reflection.callStaticMethod) {
            let methodName = "passLevelLogEvent";
            let methodSignature = "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V";
            jsb.reflection.callStaticMethod(CConst.javaClassName, methodName, methodSignature, param1, param2, param3, param4);
        }
    }

    /** 应用内评价 */
    public evaluateFirst() {
        if (typeof (jsb) == "undefined" || cc.sys.os == cc.sys.OS_IOS) return;
        Common.log(' cocosToJava cocos method: evaluateFirst() 进入游戏时调用 ');
        if (jsb && jsb.reflection && jsb.reflection.callStaticMethod) {
            let methodName = "onCreateReview";
            let methodSignature = "()V";
            jsb.reflection.callStaticMethod(CConst.javaClassName, methodName, methodSignature);
        }
    }

    /** 评价 */
    public evaluateShow() {
        if (typeof (jsb) == "undefined" || cc.sys.os == cc.sys.OS_IOS) return;
        Common.log(' cocosToJava cocos method: evaluateShow() 用户评价');
        if (jsb && jsb.reflection && jsb.reflection.callStaticMethod) {
            let methodName = "showComment";
            let methodSignature = "()V";
            jsb.reflection.callStaticMethod(CConst.javaClassName, methodName, methodSignature);
        }
    }

    /** 收入设置 */
    public setRevenue(revenue: string) {
        if (typeof (jsb) == "undefined" || cc.sys.os == cc.sys.OS_IOS) return;
        Common.log(' cocosToJava cocos method: setRevenue() ');
        if (jsb && jsb.reflection && jsb.reflection.callStaticMethod) {
            let methodName = "setAdRevenue";
            let methodSignature = "(F)V";
            jsb.reflection.callStaticMethod(CConst.javaClassName, methodName, methodSignature, parseFloat(revenue));
        }
    }

    /** 收入增加 */
    public adRevenueAdd(revenue: string) {
        Common.log(' javaToCocos cocos method: adRevenueAdd() revenue: ', revenue);
        DataManager.data.revenue = revenue;
        DataManager.setData();
    }

    /**
     * 检测 本地语言
     * @param langDefault 默认语言
     * @returns
     */
    public checkLang(langDefault: string) {
        if (typeof (jsb) == "undefined" || cc.sys.os == cc.sys.OS_IOS) return langDefault;
        Common.log(' cocosToJava cocos method: checkLang() ');
        if (jsb && jsb.reflection && jsb.reflection.callStaticMethod) {
            let methodName = "getLanguage";
            let methodSignature = "()Ljava/lang/String;";
            let language = jsb.reflection.callStaticMethod(CConst.javaClassName, methodName, methodSignature);
            return language;
        }
        return langDefault;
    }

    /*************************************************  暂无  *************************************************/
    /** 购买道具 */
    public buyItem(prop: PropType) {
        if (typeof (jsb) == "undefined" || cc.sys.os == cc.sys.OS_IOS) return;
        Common.log(' javaToCocos cocos method: buyItem() params: ', prop);
        switch (prop) {
            case PropType.propBack:
                this.logEventTwo(GameDot.dot_buy_back_click, String(DataManager.data.sortData.level));
                break;
            case PropType.propTube:
                this.logEventTwo(GameDot.dot_buy_bottle_click, String(DataManager.data.sortData.level));
                break;
            default:
                break;
        }
        if (jsb && jsb.reflection && jsb.reflection.callStaticMethod) {
            let methodName = "buyItem";
            let methodSignature = "(Ljava/lang/String;)V";
            jsb.reflection.callStaticMethod(CConst.javaClassName, methodName, methodSignature, prop);
        }
    }

    /** 购买成功 */
    public buySucc(prop: PropType) {
        Common.log(' 未实现 javaToCocos cocos method: buySucc() params: ', prop);
        switch (prop) {
            case PropType.propBack:
                this.logEventTwo(GameDot.dot_buy_back_succe, String(DataManager.data.sortData.level));
                break;
            case PropType.propTube:
                this.logEventTwo(GameDot.dot_buy_bottle_succe, String(DataManager.data.sortData.level));
                break;
            default:
                break;
        }
        DataManager.setData();
    }

    /** 购买失败 */
    public buyFail(...params: any[]) {
        // Notifier.emit('BuyFailTips');
        Common.log(' 未实现 javaToCocos cocos method: buyFail() params: ', params);
    }

    /** 设置更新 */
    public outGamePage() {
        Common.log(' 未实现 javaToCocos cocos method: outGamePage() ');
    }

    /** 加载云数据 */
    public loadGameDataDone() {
        Common.log(' 未实现 javaToCocos cocos method: loadGameDataDone() ');
    }
};
export default NativeCall.instance;
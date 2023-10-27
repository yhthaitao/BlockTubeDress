import {kit} from "../../../../src/kit/kit";
import CConst from "../../../../src/config/CConst";
import Common from "../../../../src/config/Common";
import DataManager, {LangChars} from "../../../../src/config/DataManager";
import NativeCall from "../../../../src/config/NativeCall";
import GameDot from "../../../../src/config/GameDot";

const {ccclass, property} = cc._decorator;
@ccclass
export default class GameWin extends cc.Component {

    @property(cc.Node) mask: cc.Node = null;
    @property(cc.Node) content: cc.Node = null;

    @property(cc.Node) nodeGreen: cc.Node = null;
    @property(cc.Node) nodeTitle: cc.Node = null;
    @property(cc.Node) nodeParticle: cc.Node = null;
    @property(cc.Node) nodeNext: cc.Node = null;
    @property(cc.Node) labelNext: cc.Node = null;

    isLock: boolean = false;
    initMask: number = 0;
    gameType: string = 'GameSort';

    protected onLoad(): void {
        this.initMask = this.mask.opacity;
        this.mask.opacity = 0;
        Common.log('GameWin onLoad()');
    }

    protected start(): void {
        this.initData();
        this.playAniEnter();
    }

    initData() {
        this.mask.width = cc.winSize.width;
        this.mask.height = cc.winSize.height;

        this.nodeGreen.children.forEach((item) => {
            item.opacity = 0
        });

        this.nodeTitle.y = cc.winSize.height * 0.2;
        let titleBack = this.nodeTitle.getChildByName('back');
        titleBack.x = -cc.winSize.width * 0.5;
        titleBack.width = 0;
        let titleIcon = this.nodeTitle.getChildByName('icon');
        titleIcon.opacity = 0;

        this.nodeParticle.y = this.nodeTitle.y - 100;
        this.nodeParticle.children.forEach((item) => {
            item.opacity = 0
        });

        this.nodeNext.opacity = 0;
        DataManager.setString(LangChars.Next, (chars: string) => {
            this.labelNext.getComponent(cc.Label).string = chars;
        });
    };

    /** 播放动画 进入结算界面 */
    playAniEnter() {
        kit.Audio.playEffect(CConst.sound_path_win);

        let time_mask_opa = 0.383;
        let time_title_back_width = 0.35;
        let time_title_icon_opa = 0.35;
        let time_particle_red = 0.5;
        let time_next_up = 0.5;
        let time_next_down = 0.383;
        let time_particle_green = 0.5;
        // 按时播放动画
        cc.tween(this.node).call(() => {
            // node mask
            this.mask.opacity = 0;
            cc.tween(this.mask).to(time_mask_opa, {opacity: this.initMask}).start();
        }).delay(0.5).call(() => {
            // node title
            let titleBack = this.nodeTitle.getChildByName('back');
            cc.tween(titleBack).to(time_title_back_width, {width: cc.winSize.width}).start();
            let titleIcon = this.nodeTitle.getChildByName('icon');
            cc.tween(titleIcon).delay(time_title_back_width).to(time_title_icon_opa, {opacity: 255}).start();
        }).delay(time_title_back_width + time_title_icon_opa).call(() => {
            // node particle
            this.nodeParticle.children.forEach((item) => {
                item.opacity = 255;
                item.getComponent(cc.ParticleSystem).resetSystem();
            });
        }).delay(time_particle_red).call(() => {
            // node next
            let yNext = this.nodeNext.y;
            cc.tween(this.nodeNext).parallel(
                cc.tween().to(time_next_up, {y: yNext + 50}, cc.easeSineOut()),
                cc.tween().to(time_next_up, {opacity: 255}),
            ).to(time_next_down, {y: yNext}, cc.easeSineIn()).start();
        }).delay(time_next_up + time_next_down).call(() => {
            // node green
            this.schedule(this.cycleParticle, time_particle_green);
        }).start();
    }

    cycleParticle() {
        let arrParticle = this.nodeGreen.children;
        let random = Math.floor(Math.random() * arrParticle.length);
        arrParticle.forEach((item, index) => {
            item.opacity = index == random ? 255 : 0;
            if (item.opacity == 0) {
                item.getComponent(cc.ParticleSystem).resetSystem();
            }
        });
    }

    eventBtnNext() {
        if (this.nodeNext.opacity <= 150) return;
        if (this.isLock) {
            return;
        }
        this.isLock = true;
        kit.Audio.playEffect(CConst.sound_path_click);
        let self = this;
        let levelSort = DataManager.data.sortData.level
        if (this.gameType == 'GameMatch') {
            // console.log("======levelSort=====", levelSort, DataManager.data.match.level, (levelSort + DataManager.data.match.level - 2))
            levelSort = levelSort + DataManager.data.match.level - 2;
        }
        if (levelSort > 5) {
            // 打点 插屏广告请求（过关）
            NativeCall.logEventThree(GameDot.dot_adReq, "inter_nextlevel", "Interstital");
            let funcA = () => {
                // 打点 插屏播放完成（游戏结束）
                NativeCall.logEventTwo(GameDot.dot_ads_advert_succe_win, String(levelSort));
                // 广告计时
                DataManager.data.adRecord.time = Math.floor(new Date().getTime() * 0.001);
                DataManager.data.adRecord.level = levelSort;
                DataManager.setData();
                self.playAniLeave();
            };
            let funcB = () => {
                self.playAniLeave();
            };
            let isReady = DataManager.playAdvert(funcA, funcB);
            if (!isReady) {
                funcB();
            }
        }else {
            this.playAniLeave();
        }
    }

    /** 播放动画 离开结算界面 */
    playAniLeave() {
        // 动画结束后 进入下一关
        let self = this;
        let funcAfter = () => {
            this.node.removeFromParent();
            if (this.gameType == 'GameSort') {
                kit.Event.emit(CConst.event_enter_nextLevel, false, true, false);
            } else {
                kit.Event.emit(CConst.event_enter_nextMatchLevel, false, true);
                if (DataManager.data.match.passLevel >= 5) {
                    kit.Event.emit(CConst.event_enter_gameSort, false, true, false);
                }
            }
        };
        // funcAfter()
        cc.tween(this.nodeNext).to(0.5, {opacity: 0}).start();
        // cc.tween(this.nodeTitle).parallel(
        //     cc.tween().to(0.5, { y: cc.winSize.height * 0.5 }, cc.easeSineInOut()),
        //     cc.tween().to(0.5, { opacity: 0 }),
        // ).call(funcAfter).start();
        cc.tween(this.nodeTitle).call(function () {
            cc.tween(self.nodeTitle.getChildByName("icon")).to(0.3, {opacity: 0}).start();
        }).to(0.3, {x: cc.winSize.width}).call(funcAfter).start();
    }
}

import { kit } from "../../../../src/kit/kit";
import CConst from "../../../../src/config/CConst";
import Common from "../../../../src/config/Common";
import DataManager, { LangChars } from "../../../../src/config/DataManager";

const { ccclass, property } = cc._decorator;
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

    protected onLoad(): void {
        Common.log('GameWin onLoad()');
    }

    protected start(): void {
        this.initData();
        this.playAniEnter();
    }

    async initData() {
        this.mask.width = cc.winSize.width;
        this.mask.height = cc.winSize.height;

        this.nodeGreen.children.forEach((item) => { item.opacity = 0 });

        this.nodeTitle.y = cc.winSize.height * 0.25;
        let titleBack = this.nodeTitle.getChildByName('back');
        titleBack.x = -cc.winSize.width * 0.5;
        titleBack.width = 0;
        let titleIcon = this.nodeTitle.getChildByName('icon');
        titleIcon.opacity = 0;

        this.nodeParticle.y = this.nodeTitle.y - 100;
        this.nodeParticle.children.forEach((item) => { item.opacity = 0 });

        this.nodeNext.opacity = 0;
        let chars = await DataManager.getString(LangChars.Next);
        this.labelNext.getComponent(cc.Label).string = chars;
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
            let opaMask = this.mask.opacity;
            this.mask.opacity = 0;
            cc.tween(this.mask).to(time_mask_opa, { opacity: opaMask }).start();
        }).delay(0.5).call(() => {
            // node title
            let titleBack = this.nodeTitle.getChildByName('back');
            cc.tween(titleBack).to(time_title_back_width, { width: cc.winSize.width }).start();
            let titleIcon = this.nodeTitle.getChildByName('icon');
            cc.tween(titleIcon).delay(time_title_back_width).to(time_title_icon_opa, { opacity: 255 }).start();
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
                cc.tween().to(time_next_up, { y: yNext + 50 }, cc.easeSineOut()),
                cc.tween().to(time_next_up, { opacity: 255 }),
            ).to(time_next_down, { y: yNext }, cc.easeSineIn()).start();
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
        if (this.isLock) {
            return;
        }
        this.isLock = true;
        kit.Audio.playEffect(CConst.sound_path_click);
        this.playAniLeave();
    }

    /** 播放动画 离开结算界面 */
    playAniLeave() {
        // 动画结束后 进入下一关
        let funcAfter = () => {
            this.node.removeFromParent();
            kit.Event.emit(CConst.event_enter_nextLevel, false, true);
        };
        cc.tween(this.nodeNext).to(0.5, { opacity: 0 }).start();
        cc.tween(this.nodeTitle).parallel(
            cc.tween().to(0.5, { y: cc.winSize.height * 0.5 }, cc.easeSineInOut()),
            cc.tween().to(0.5, { opacity: 0 }),
        ).call(funcAfter).start();
    }
}

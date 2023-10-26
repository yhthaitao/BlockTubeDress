import {kit} from "../../../../src/kit/kit";
import CConst from "../../../../src/config/CConst";
import Common from "../../../../src/config/Common";
import DataManager, {LangChars} from "../../../../src/config/DataManager";

const {ccclass, property} = cc._decorator;
@ccclass
export default class GameWin extends cc.Component {

    @property(cc.Node) mask: cc.Node = null;
    @property(cc.Node) content: cc.Node = null;

    @property(cc.Node) nodeTitle: cc.Node = null;
    @property(cc.Node) nodeReplay: cc.Node = null;
    @property(cc.Node) nodeExit: cc.Node = null;
    @property(cc.Node) labelReplay: cc.Node = null;
    @property(cc.Node) labelExit: cc.Node = null;

    isLock: boolean = false;
    initMask: number = 0;
    gameType: string = 'GameSort';

    protected onLoad(): void {
        this.initMask = this.mask.opacity;
        this.mask.opacity = 0;
        Common.log('GameOver onLoad()');
    }

    protected start(): void {
        this.initData();
        this.playAniEnter();
    }

    initData() {
        this.mask.width = cc.winSize.width;
        this.mask.height = cc.winSize.height;

        // this.nodeTitle.y = cc.winSize.height * 0.2;
        // let titleBack = this.nodeTitle.getChildByName('back');
        // titleBack.x = -cc.winSize.width * 0.5;
        // titleBack.width = 0;
        // let titleIcon = this.nodeTitle.getChildByName('icon');
        // titleIcon.opacity = 0;
        //
        // this.nodeReplay.opacity = 0;
        this.content.opacity = 0;
        DataManager.setString(LangChars.Restart, (chars: string) => {
            this.labelReplay.getComponent(cc.Label).string = chars;
        });
        DataManager.setString(LangChars.Exit, (chars: string) => {
            this.labelExit.getComponent(cc.Label).string = chars;
        });
    };

    /** 播放动画 进入结算界面 */
    playAniEnter() {
        // kit.Audio.playEffect(CConst.sound_path_win);

        let time_mask_opa = 0.383;
        // 按时播放动画
        cc.tween(this.node).call(() => {
            // node mask
            this.mask.opacity = 0;
            cc.tween(this.mask).to(time_mask_opa, {opacity: this.initMask}).start();
        }).delay(0.5).call(() => {
            cc.tween(this.content).to(0.1, {opacity: 255}).start();
        }).start();
    }

    eventBtnExit() {
        if (this.nodeReplay.opacity != 255) return;
        if (this.isLock) {
            return;
        }
        this.isLock = true;
        kit.Audio.playEffect(CConst.sound_path_click);
        this.playAniExit();
    }

    eventBtnReplay() {
        if (this.nodeReplay.opacity != 255) return;
        if (this.isLock) {
            return;
        }
        this.isLock = true;
        kit.Audio.playEffect(CConst.sound_path_click);
        this.playAniReplay();
    }

    /** 播放动画 离开结算界面 */
    playAniExit() {
        // 动画结束后 进入下一关
        let self = this;
        let funcAfter = () => {
            this.node.removeFromParent();
            kit.Event.emit(CConst.event_enter_gameSort, false, true)
        };
        cc.tween(this.nodeReplay).to(0.5, {opacity: 0}).start();
        cc.tween(this.nodeExit).to(0.5, {opacity: 0}).start();
        cc.tween(this.nodeTitle).call(function () {
            cc.tween(self.nodeTitle.getChildByName("icon")).to(0.3, {opacity: 0}).start();
        }).to(0.3, {x: cc.winSize.width}).call(funcAfter).start();
    }

    /** 播放动画 离开结算界面 */
    playAniReplay() {
        // 动画结束后 进入下一关
        let self = this;
        let funcAfter = () => {
            this.node.removeFromParent();
            kit.Event.emit(CConst.event_enter_nextMatchLevel, false, true);
        };
        cc.tween(this.nodeReplay).to(0.5, {opacity: 0}).start();
        cc.tween(this.nodeExit).to(0.5, {opacity: 0}).start();
        cc.tween(this.nodeTitle).call(function () {
            cc.tween(self.nodeTitle.getChildByName("icon")).to(0.3, {opacity: 0}).start();
        }).to(0.3, {x: cc.winSize.width}).call(funcAfter).start();
    }
}

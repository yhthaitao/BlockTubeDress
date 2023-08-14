import { kit } from "../../../../src/kit/kit";
import CConst from "../../../../src/config/CConst";
import Common from "../../../../src/config/Common";
import DataManager, { LangChars } from "../../../../src/config/DataManager";

const { ccclass, property } = cc._decorator;
@ccclass
export default class Loading extends cc.Component {

    @property(cc.Node) nodeLogo: cc.Node = null;
    @property(cc.Node) nodeProcess: cc.Node = null;

    width: number = 596;

    protected onLoad(): void {
        Common.log('LayerLoading');
        this.initLabel();
        this.node.setContentSize(cc.winSize);
        this.nodeLogo.opacity = 0;
        this.nodeProcess.opacity = 0;
        this.nodeProcess.getChildByName('bar').width = 0;
    }

    initLabel() {
        let itemLabel = this.nodeProcess.getChildByName('label');
        DataManager.setString(LangChars.Loading, (chars: string)=>{
            itemLabel.getComponent(cc.Label).string = chars;
        });
    }

    protected start(): void {
        this.playAniEnter();
    }

    /** 动画 loading 进入 */
    playAniEnter() {
        let tDelay = .55;
        let tMove = .383;
        let tOpa = .383;
        let heightMax = cc.winSize.height * 0.5;
        let y0 = heightMax + 100;
        let y2 = DataManager.getTitlePosY();
        let y1 = y2 - 50;
        this.nodeLogo.active = true;
        this.nodeLogo.y = y0;
        let tween = cc.tween;
        tween(this.nodeLogo).delay(tDelay)
            .parallel(
                tween().to(tMove, { y: y1 }, cc.easeSineOut()),
                tween().to(tOpa, { opacity: 255 })
            )
            .to(.4, { y: y2 }, cc.easeSineInOut())
            .start();

        this.nodeProcess.active = true;
        tween(this.nodeProcess).delay(tDelay)
            .to(tOpa, { opacity: 255 }).call(this.playAniProcess.bind(this))
            .start();
    }

    /** 动画 loading 进度 */
    playAniProcess() {
        let tShow = .383;
        let processBar = this.nodeProcess.getChildByName('bar');
        cc.tween(processBar).to(tShow * 4, { width: this.width * 0.8 }, cc.easeSineInOut()).call(() => {
            kit.Event.emit(CConst.event_complete_loading);
        }).start();

        // loading字符显示
        let itemLabel = this.nodeProcess.getChildByName('label');
        let label = itemLabel.getComponent(cc.Label);
        let funcLabel = () => {
            DataManager.setString(LangChars.Loading, (chars: string)=>{
                if (label.string == chars) label.string = chars + '.';
                else if (label.string == chars + '.') label.string = chars + '..';
                else if (label.string == chars + '..') label.string = chars + '...';
                else label.string = chars;
            });
        };
        this.schedule(funcLabel, tShow);
    }

    /** 动画 loading 离开 */
    playAniLeave(callback: Function) {
        let tShow = .383;
        let tDelay = .383;
        let processBar = this.nodeProcess.getChildByName('bar');
        let tween = cc.tween;
        tween(processBar)
            .to(tShow, { width: this.width }, cc.easeSineInOut())
            .delay(tDelay)
            .call(() => {
                this.unscheduleAllCallbacks();
                // 离开动画
                let tOpa = .2;
                tween(this.nodeProcess).to(tOpa, { opacity: 0 }).call(() => {
                    callback && callback();
                }).start();
            })
            .start();
    }
}

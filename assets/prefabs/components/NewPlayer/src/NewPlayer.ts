import CConst from "../../../../src/config/CConst";
import GameDot from "../../../../src/config/GameDot";
import NativeCall from "../../../../src/config/NativeCall";
import DataManager, { LangChars } from "../../../../src/config/DataManager";

const { ccclass, property } = cc._decorator;
@ccclass
export default class NewPlayer extends cc.Component {

    @property(cc.Node) mask: cc.Node = null;
    @property(cc.Node) content: cc.Node = null;
    @property(cc.Node) hand: cc.Node = null;
    @property(cc.Node) sign: cc.Node = null;
    @property(cc.Node) btnExit: cc.Node = null;

    guideType: string = '';

    show(type: string, isRight: boolean = false) {
        this.guideType = type;
        let itemLabel = this.sign.getChildByName('label');
        let icon = this.hand.getChildByName("icon");
        switch (type) {
            case CConst.newPlayer_guide_sort_1:
                NativeCall.logEventOne(GameDot.dot_guide_adventure_01);
                DataManager.setString(LangChars.sort1, (chars: string)=>{
                    itemLabel.getComponent(cc.Label).string = chars;
                });

                this.hand.position = isRight ? cc.v3(0, 25) : cc.v3(-220, 100);
                cc.tween(icon).to(0.383, { opacity: 255 }).call(() => {
                    this.hand.getChildByName("icon").getComponent(cc.Animation).play("handSort1");
                }).start();
                break;
            case CConst.newPlayer_guide_sort_2:
                NativeCall.logEventOne(GameDot.dot_guide_adventure_02);
                NativeCall.logEventTwo('sortFirstPlay', String(2));
                DataManager.setString(LangChars.sort2, (chars: string)=>{
                    itemLabel.getComponent(cc.Label).string = chars;
                });

                this.hand.position = isRight ? cc.v3(0, 25) : cc.v3(-220, 100);
                cc.tween(icon).to(0.383, { opacity: 255 }).call(() => {
                    this.hand.getChildByName("icon").getComponent(cc.Animation).play("handSort1");
                }).start();
                break;
            case CConst.newPlayer_guide_sort_3:
                NativeCall.logEventOne(GameDot.dot_guide_adventure_03);
                NativeCall.logEventTwo('sortFirstPlay', String(3));
                DataManager.setString(LangChars.sort3, (chars: string)=>{
                    itemLabel.getComponent(cc.Label).string = chars;
                });
                this.sign.y = -400
                break;
            default:
                break;
        }
        this.content.opacity = 0;
        cc.tween(this.content).to(0.383, { opacity: 255 }).start();
    }

    button() {
        switch (this.guideType) {
            case CConst.newPlayer_guide_sort_1:
                break;
            case CConst.newPlayer_guide_sort_2:
                break;
            case CConst.newPlayer_guide_sort_3:
                break;
            default:
                break;
        }
        this.node.removeFromParent();
    }
}

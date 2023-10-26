import DataManager, {LangChars} from "../../../../src/config/DataManager";

const {ccclass, property} = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {

    @property(cc.Node)
    passLine: cc.Node = null;
    @property(cc.Node)
    iconFlower: cc.Node = null;
    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {

    }

    init() {
        let passLevel = DataManager.data.match.passLevel;
        if (passLevel > 5) passLevel = 5;
        this.passLine.width = passLevel * this.node.width / 5;
        this.iconFlower.x = this.passLine.width - 231;
        this.passLine.stopAllActions();
    }

    playLineAnim() {
        let passLevel = DataManager.data.match.passLevel;
        let width = passLevel * this.node.width / 5;
        cc.tween(this.passLine).to(0.1, {width: width}).start()
    }

    update(dt) {
        if (this.iconFlower.x == this.passLine.width - 231) return;
        this.iconFlower.x = this.passLine.width - 231;
    }
}

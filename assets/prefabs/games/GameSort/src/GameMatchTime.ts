import DataManager, {LangChars} from "../../../../src/config/DataManager";

const {ccclass, property} = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {

    @property(cc.Label)
    timeLabel: cc.Label = null;

    isRun: boolean = false;
    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {

    }

    timeStop() {
        this.isRun = false;
        this.node.parent.getChildByName('btn').active = true;
        this.timeLabel.getComponent(cc.Label).unscheduleAllCallbacks();
        this.node.active = false;
    }

    timeRun() {
        this.initEnergy();
    }

    initEnergy() {
        let self = this;
        if (this.isRun) return;
        let timeCDLabel = this.timeLabel.getComponent(cc.Label);
        let shi, fen, miao;
        let runTimeCount = function () {
            if (self.node.active && self.isRun) {
                let lastPlayTime = 7200 - Math.floor(new Date().valueOf() / 1000 - DataManager.data.match.lastTime);
                if (lastPlayTime <= 0) {
                    self.isRun = false;
                    self.node.active = false;
                    self.enterAnimRestart();
                    DataManager.data.match.passLevel = 0;
                    timeCDLabel.unscheduleAllCallbacks();
                }
                // console.log("===lastPlayTime===", lastPlayTime)
                fen = Math.floor(lastPlayTime % 3600 / 60);
                shi = Math.floor(lastPlayTime / 3600);
                miao = Math.floor(lastPlayTime % 3600 % 60);
                if (fen < 10) {
                    fen = "0" + fen
                }
                if (shi < 10) {
                    shi = "0" + shi
                }
                if (miao < 10) {
                    miao = "0" + miao
                }
                timeCDLabel.string = "" + shi + ":" + fen + ":" + miao;
            } else {
                self.isRun = false;
                self.node.active = false;
                self.enterAnimRestart();
                timeCDLabel.unscheduleAllCallbacks();
            }
        };
        this.isRun = true;
        timeCDLabel.schedule(runTimeCount, 1);
    }

    enterAnimRestart(){
        this.node.parent.getChildByName('btn').active = true;
        this.node.parent.getChildByName('spine').active = true;
        this.node.parent.getChildByName('time').active = false;
        this.node.parent.getChildByName('hui').active = false;
        DataManager.data.match.passLevel = 0;
        DataManager.data.match.lastTime = 0;
        DataManager.setData(true);
    }
    // update (dt) {}
}

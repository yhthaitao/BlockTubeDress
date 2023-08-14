import DataManager, { ResType } from "./DataManager";

const { ccclass, property } = cc._decorator;
@ccclass
export default class LocalImg extends cc.Component {

    @property({ displayName: '资源类型' })
    resType: string = '类型';

    @property({ displayName: '资源名字' })
    resName: string = '名字';

    /** 资源路径 */
    path: string = './language/img/' + DataManager.langCur + '/';

    onLoad() {
        this.setRes();
    }

    setRes() {
        let funcSet = (asset)=>{
            switch (this.resType) {
                case ResType.PNG:
                    this.setTexture(asset);
                    break;
                case ResType.DRAGON:
                    this.setDragon(asset);
                    break;
                default:
                    break;
            }
        };
        DataManager.loadRes(this.path + this.resName, funcSet);
    }

    /** 设置素材 sprite */
    setTexture(obj) {
        if (obj) {
            this.node.getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(obj);
        }
    }

    /** 设置 素材 龙骨 */
    setDragon(obj) {
        if (obj && obj.asset && obj.atlasAsset) {
            let armatureDisplay = this.node.getComponent(dragonBones.ArmatureDisplay);
            armatureDisplay.dragonAsset = obj.asset;
            armatureDisplay.dragonAtlasAsset = obj.atlasAsset;
            armatureDisplay.armatureName = obj.armatureName;
        }
    }
}

import ResLoader from "../framework/load/ResLoader";

class BundleTemplate {
    public bundle: cc.AssetManager.Bundle;
    private assetMap: Map<string, cc.Asset>;

    constructor() {
        this.assetMap = new Map();
    }

    public loadBundle(bundleName): Promise<any> {
        return new Promise((reslove, reject) => {
            ResLoader.loadBundle(bundleName, (e, bundle: cc.AssetManager.Bundle) => {
                if (e) {
                    reject(e);
                    return;
                }
                this.bundle = bundle;
                reslove(bundle);
            })
        }).catch(e => cc.log(e))
    }

    public loadRes(path: string, type: typeof cc.Asset, finishCb: (e, asset) => void) {
        if (this.assetMap.has(path)) {
            let asset = this.assetMap.get(path);
            if (finishCb) {
                finishCb(null, asset);
            }
            return;
        }
        ResLoader.loadRes(path, type, (e, res: cc.Asset) => {
            this.assetMap.set(path, res);
            if (finishCb) {
                finishCb(null, this.assetMap.get(path));
                return;
            }
        }, this.bundle);
    }

    public release(): string {
        this.assetMap.forEach((res, key) => {
            cc.log(`释放${res.name}`);
            cc.assetManager.releaseAsset(res)
            this.bundle.release(key);
        });
        this.assetMap.clear();

        cc.log(`释放bundle${this.bundle.name}`);
        cc.assetManager.removeBundle(this.bundle);
        return this.bundle.name;
    }

    public releaseWithOutBundle(): string {
        this.assetMap.forEach((res, key) => {
            cc.log(`释放${res.name}`);
            cc.assetManager.releaseAsset(res)
            this.bundle.release(key);
        });
        this.assetMap.clear();

        return this.bundle.name;
    }
}

export default class ResourcesManager {
    private static _instance: ResourcesManager;

    private templateMap: Map<string, BundleTemplate>;

    public static get instance(): ResourcesManager {
        if (!ResourcesManager._instance) {
            ResourcesManager._instance = new ResourcesManager();
        }
        return ResourcesManager._instance;
    }

    constructor() {
        this.templateMap = new Map();
    }

    /**
     * 加载单个资源
     * @param {string} bundleName
     * @param {string} resPath 
     * @param {typeof cc.Asset} assetType 
     * @param {(error, res) => void} finishCb  加载完成回调
     * @returns 
     */
    public loadRes(bundleName: string, resPath: string, assetType: typeof cc.Asset, finishCb: Function = null): Promise<any> {
        return new Promise(async (resolve, rej) => {
            if (bundleName == "" || resPath == "") {
                rej();
                return;
            }

            if (this.templateMap.has(bundleName)) {
                let template = this.templateMap.get(bundleName);
                template.loadRes(resPath, assetType, (e, res) => {
                    if (finishCb) {
                        finishCb(e, res);
                    }
                    if (e) {
                        rej(e);
                    } else {
                        resolve(res);
                    }
                })
                return;
            }

            let template = new BundleTemplate();
            await template.loadBundle(bundleName);
            template.loadRes(resPath, assetType, (e, asset) => {
                this.templateMap.set(bundleName, template);
                if (finishCb) {
                    finishCb(e, asset);
                }
                if (e) {
                    rej(e);
                } else {
                    resolve(asset);
                }

            });

        }).catch(e => () => {
            if (finishCb) {
                finishCb(e, null);
            }
        })
    }

    /**
     * 加载bundle list
     * @param nameList 
     * @returns 
     */
    public loadBundleList (nameList: string[]): Promise<cc.AssetManager.Bundle[] | void> {
        let list: Promise<any>[] = [];
        for (let key in nameList) {
            list.push(
                this.loadBundle(nameList[key])
            )
        }
        return Promise.all(list).catch((e) => cc.log(e));
    }

    /** 加载单个bundle */
    public loadBundle(bundleName: string): Promise<cc.AssetManager.Bundle | void> {
        return new Promise<cc.AssetManager.Bundle>(async (res, rej) => {
            if (this.templateMap.has(bundleName)) {
                let bundle = this.templateMap.get(bundleName).bundle;
                res(bundle);
                return;
            }
            let template = new BundleTemplate();
            await template.loadBundle(bundleName);
            this.templateMap.set(bundleName, template);
            res(template.bundle);
        }).catch(e => {
            cc.log(e);
        })
    }

    /**
     * 释放资源
     * @param {?string | string[]} bundleName 传入null或者“”释放加载过的所有资源， 传入bundleName string 释放对应bundleName以及加载的资源，传入bundleName list释放对应的资源和bundle
     * @returns 
     */
    public releaseAsset(bundleName?: string | string[]) {
        cc.log("释放资源", bundleName);
        if (bundleName && typeof bundleName == "string" && bundleName != "") {
            let template = this.templateMap.get(bundleName);
            let releaseKey = template.release();
            if (releaseKey) {
                this.templateMap.delete(releaseKey);
            }
            return;
        }
        // 多个释放
        if (bundleName && typeof bundleName == "object") {
            bundleName.forEach((item) => {
                let template = this.templateMap.get(item);
                let releaseKey = template.release();
                if (releaseKey != '') {
                    this.templateMap.delete(releaseKey);
                }
            })
            return;
        }
        this.templateMap.forEach(template => {
            let releaseKey = template.release();
            if (releaseKey != '') {
                this.templateMap.delete(releaseKey);
            }
        });
    }

    public releaseRes(bundle?: cc.AssetManager.Bundle) {
        if (bundle) {
            let template = this.templateMap.get(bundle.name);
            if (!template) {
                cc.assetManager.removeBundle(bundle);
                return;
            }
            let releaseKey = template.releaseWithOutBundle();
            if (releaseKey) {
                this.templateMap.delete(releaseKey);
            }
            cc.log(this.templateMap);
            cc.assetManager.removeBundle(bundle);
        }
    }
}

import BaseLoader from "./base/BaseLoader";
import { AtlasLoader, AudioLoader, DefaultLoader, ImageLoader, JsonLoader, PrefabLoader, SpineLoader, TextLoader } from "./base/loader-index";

export default class ResLoader {

    // 加载器map集合
    private static _defaultMap: Map<{prototype: cc.Asset}, BaseLoader>;
    // 默认loader
    private static _defaultLoader: DefaultLoader = null;
    // 是否初始化
    private static _init: boolean = false;

    /** 初始化加载器 */
    public static init (): void {
        if (!ResLoader._init) {
            ResLoader._defaultMap = new Map();
            ResLoader._defaultMap.set(cc.SpriteFrame, new ImageLoader());
            ResLoader._defaultMap.set(cc.SpriteAtlas, new AtlasLoader());
            ResLoader._defaultMap.set(cc.AudioClip, new AudioLoader());
            ResLoader._defaultMap.set(cc.JsonAsset, new JsonLoader());
            ResLoader._defaultMap.set(cc.TextAsset, new TextLoader());
            ResLoader._defaultMap.set(cc.Prefab, new PrefabLoader());
            ResLoader._defaultMap.set(sp.SkeletonData, new SpineLoader());
            // 默认加载器
            ResLoader._defaultLoader = new DefaultLoader();
        }
        ResLoader._init = true;
    }

    
    /**
     * 通用资源加载接口（包括本地资源、网络资源和远程资源）
     * @param {string} path 资源路径，可以是本地资源、网络资源和远程资源
     * @param {cc.Asset} type 资源类型
     * @param {(err, res) => void} onComplete 加载完成回调
     * @param {cc.AssetManager.Bundle} bundle 资源所属bundle，可选。
     * @param {(finish: number, total: number, item: cc.AssetManager.RequestItem) => void} onProgress 加载进度
     */
    public static loadRes (
        path: string, 
        type: typeof cc.Asset, 
        onComplete: (err, res) => void, 
        bundle?: cc.AssetManager.Bundle, 
        onProgress?: (finish: number, total: number, item: cc.AssetManager.RequestItem) => void): void {
        // 初始化resloader
        ResLoader.init();
        let loader = ResLoader._defaultMap.get(type);
        if (!loader) {
            cc.log(`assets type: ${type} is not exists, default loader insteaded!`);
            loader = ResLoader._defaultLoader;
        }
        loader.loadRes(path, type, (_err, _res) => {
            if (onComplete) {
                onComplete(_err, _res);
            }
        }, bundle, onProgress);
    }

    /**
     * 加载目录
     * @param {string} dir 资源目录
     * @param {cc.Asset} type 资源类型
     * @param {(finish: number, total: number, item: cc.AssetManager.RequestItem) => void} onProgress 加载进度回调
     * @param {(error: Error, assets: Array<T>) => void} onComplete 加载完成回调
     * @param {cc.AssetManager.Bundle | string} bundle 资源所属bundle，可选。 
     */
    public static loadDir<T extends cc.Asset> (dir: string, type: typeof cc.Asset, onProgress: (finish: number, total: number, item: cc.AssetManager.RequestItem) => void, onComplete: (error: Error, assets: Array<T>) => void, bundle?: cc.AssetManager.Bundle | string): void {
        let curBundle: cc.AssetManager.Bundle = null;
        if (bundle && typeof bundle === "string" && bundle !== "") {
            curBundle = cc.assetManager.getBundle(bundle);
        } else if (bundle && typeof bundle !== "string") {
            curBundle = bundle as cc.AssetManager.Bundle;
        } else {
            curBundle = cc.resources as cc.AssetManager.Bundle;
        }
        if (!curBundle) {
            onComplete(new Error(`bundle ${bundle} is not exists!`), null);
            return;
        }
        curBundle.loadDir(dir, type, onProgress, onComplete);
    }

    /**
     * 加载bundle
     * @param {string} nameOrUrl bundle名称或地址
     * @param {(err: Error, bundle: cc.AssetManager.Bundle) => void} onComplete 加载完成回调
     */
    public static loadBundle (nameOrUrl: string, onComplete: (err: Error, bundle: cc.AssetManager.Bundle) => void): void {
        cc.assetManager.loadBundle(nameOrUrl, (_err, _bundle) => {
            if (onComplete) {
                onComplete(_err, _bundle);
            }
        });
    }
}
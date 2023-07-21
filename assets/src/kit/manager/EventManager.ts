/**
 * 事件管理器
 * // 注册事件
 * EventManager.on('game-start', this.onGameStart, this);
 * // 发射事件
 * EventManager.emit('game-start', 666);
 */
export default class EventManager {

    /** 普通事件容器 */
    private static events: Map<string, Subscription[]> = new Map<string, Subscription[]>();

    /**
     * 注册事件
     * @param name 事件名
     * @param callback 回调
     * @param target 目标
     */
    public static on(name: string, callback: Function, target: any, once: boolean = false) {
        let sub: Subscription = { callback, target, once };
        if (!this.events.has(name)) {
            this.events.set(name, [sub]);
            return;
        }
        this.events.get(name).push(sub);
    }

    /**
     * 取消注册事件
     * @param name 事件名
     * @param callback 回调
     * @param target 目标
     */
    public static off(name: string, callback: Function, target?: any) {
        // 普通事件
        let subArr = this.events.get(name);
        if (subArr) {
            for (let index = 0, length = subArr.length; index < length; index++) {
                if (this.compare(subArr[index], callback, target)) {
                    subArr.splice(index, 1);
                    break;
                }
            }
            if (subArr.length === 0) {
                this.events.delete(name);
            }
        }
    }

    /**
     * 通过事件名发送事件
     * @param name 事件名
     * @param args 参数
     */
    public static emit(name: string, ...args: any[]) {
        // 普通事件
        let subArr = this.events.get(name);
        if (subArr) {
            for (let index = subArr.length - 1; index >= 0; index--) {
                console.log('执行事件：', name, '; 参数：', args);
                let sub: Subscription = subArr[index];
                sub.callback.apply(sub.target, args);
                if (sub.once) {
                    subArr.splice(index, 1);
                }
            }
            if (subArr.length === 0) {
                this.events.delete(name);
            }
        }
    }

    /**
     * 移除事件 指定名称
     * @param name 事件名
     */
    public static remove(name: string) {
        // 普通事件
        if (this.events.has(name)) {
            this.events.delete(name);
        }
    }

    /**
     * 移除事件 指定对象
     * @param target 事件对象
     */
    public static removeByTarget(target: any) {
        // 普通事件
        this.events.forEach((subscription: Subscription[], name: string)=>{
            console.log('移除前 事件名：', name, "; 事件数组：", subscription);
            subscription.filter((sub)=>{
                return sub.target != target;
            });
            console.log('移除后 事件名：', name, "; 事件数组：", subscription);
        })
    }

    /**
     * 移除所有事件
     */
    public static removeAll() {
        // 普通事件
        this.events.clear();
    }

    /**
     * 对比
     * @param subscription 订阅
     * @param inCallback 回调
     * @param inTarget 目标
     */
    private static compare(subscription: Subscription, inCallback: Function, inTarget: any) {
        const { callback, target } = subscription;
        return target === inTarget && (callback === inCallback || callback.toString() === inCallback.toString());
    }

}

/** 订阅 */
interface Subscription {
    /** 回调 */
    callback: Function;
    /** 目标 */
    target: any;
    /** 是否为一次性事件 */
    once: boolean;
}

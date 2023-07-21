class Common {
    private static _instance: Common;
    public static get instance(): Common {
        if (!this._instance) {
            this._instance = new Common();
        }
        return this._instance;
    };

    /** 从节点上获取数组 */
    getArrByName(node: cc.Node, name: string): cc.Node[] {
        let child = node.children;
        let arrObj = [];
        for (let index = 0, length = child.length; index < length; index++) {
            const element = child[index];
            if (element.name.indexOf(name) < 0) {
                continue;
            }
            arrObj.push(element);
        }
        let strlen = name.length;
        arrObj.sort((a, b) => {
            let indexA = Number(a.name.slice(strlen, a.name.length));
            let indexB = Number(b.name.slice(strlen, b.name.length));
            return indexA - indexB;
        });
        return [].concat(arrObj);
    };

    /** 从节点上获取数组  y：从大到小*/
    getArrByPosY(node: cc.Node): cc.Node[] {
        let arrObj = [].concat(node.children);
        arrObj.sort((a, b) => {
            return b.y - a.y;
        });
        return arrObj;
    };

    /**
     * 获取 父节点上的当前坐标 在 目标节点上的 相对坐标
     * @param nodeParent 父节点
     * @param pointCur 父节点上的坐标
     * @param nodeGoal 目标节点
     * @returns 
     */
    getLocalPos(nodeParent: cc.Node, pointCur: cc.Vec3, nodeGoal: cc.Node) {
        let pointWorld = nodeParent.convertToWorldSpaceAR(pointCur);
        return nodeGoal.convertToNodeSpaceAR(pointWorld);
    };

    /**
     * 给定速度，和距离，计算移动时间
     * @param p1 
     * @param p2 
     * @param baseTime 基础时间
     * @param baseDis 基础距离
     * @returns 
     */
    getMoveTime(p1: cc.Vec3, p2: cc.Vec3, baseTime: number, baseDis: number) {
        let dis = p1.sub(p2).mag();
        return baseTime * dis / baseDis;
    };

    /** 获取贝塞尔参数 */
    getBezierObj(p1: cc.Vec3, p2: cc.Vec3, isHigh: boolean): { p1: cc.Vec2, p2: cc.Vec2, pTo: cc.Vec2 } {
        let disY = isHigh ? 350 : 0;
        let obj = {
            p1: cc.v2(p1.x, p1.y),
            p2: cc.v2(),
            pTo: cc.v2(p2.x, p2.y),
        };
        let x = 0;
        let y = 0;
        if (p1.x == p2.x) {
            x = p1.x;
            y = Math.max(p1.y, p2.y) + disY;
        }
        else {
            x = (p1.x + p2.x) * 0.5;
            y = Math.max(p1.y, p2.y) + disY;
        }
        obj.p2 = cc.v2(x, y);
        return obj;
    };

    getBezierTime(obj: { p1: cc.Vec2, p2: cc.Vec2, pTo: cc.Vec2 }, baseTime: number, baseDis: number) {
        let t1 = this.getMoveTime(cc.v3(obj.p1.x, obj.p1.y), cc.v3(obj.p2.x, obj.p2.y), baseTime, baseDis);
        let t2 = this.getMoveTime(cc.v3(obj.p2.x, obj.p2.y), cc.v3(obj.pTo.x, obj.pTo.y), baseTime, baseDis);
        return t1 + t2;
    };

    /**
     * 获取两点的角度
     * @param {*} p1 
     * @param {*} p2 
     */
    getAngleFromPoints(p1: cc.Vec2, p2: cc.Vec2) {
        let hudu = Math.atan2((p2.y - p1.y), (p2.x - p1.x));  //弧度
        return hudu * (180 / Math.PI);  //角度
    };

    /**
     * 深拷贝
     * @param {*} Obj 
     * @returns 
     */
    clone(Obj: any) {
        var buf;
        if (Obj instanceof Array) {
            buf = [];
            var i = Obj.length;
            while (i--) {
                buf[i] = this.clone(Obj[i]);
            }
            return buf;
        }
        else if (Obj instanceof Object) {
            buf = {};
            for (var k in Obj) {
                buf[k] = this.clone(Obj[k]);
            }
            return buf;
        } else {
            return Obj;
        }
    };

    log(...params: any[]): void {
        try {
            var logContent = [];
            for (var i in params) {
                var content = params[i];
                if (typeof (params[i]) == "object") {
                    content = JSON.stringify(params[i]);
                }
                logContent.push(content);
            }
            console.log("--输出：" + logContent.join(""));
        }
        catch (e) {
            console.log("--输出：" + logContent.join(""));
        }
    };
};
export default Common.instance;
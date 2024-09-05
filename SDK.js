/**
 * 日期时间格式化函数
 * @param {string|function} n 
 * @returns 
 */
function _formatNormalize(n) {
    if (typeof n === 'function') {
        return n
    }
    if (typeof n !== 'string') {
        throw new Error('必须传入字符串或函数')
    }
    if (n === 'date') {
        n = 'YYYY-MM-DD'
    } else if (n === 'datetime') {
        n = 'YYYY-MM-DD HH:mm:ss'
    } else if (n === 'time') {
        n = 'HH:mm:ss'
    }
    const f = (dateInfo) => {
        const { yyyy, MM, dd, HH, mm, ss, ms } = dateInfo
        return n
            .replaceAll('YYYY', yyyy)
            .replaceAll('MM', MM)
            .replaceAll('DD', dd)
            .replaceAll('HH', HH)
            .replaceAll('mm', mm)
            .replaceAll('ss', ss)
            .replaceAll('ms', ms)
    }
    return f
}

/**
 * 日期是否有效
 * @param {*} d 
 * @returns 
 */
function isValidDate(d) {
    return d instanceof Date && !isNaN(d);
}

/**
 * 格式化日期函数
 * @param {Date} date 日期对象
 * @param {string|function} fmt 格式化字符串或函数
 * @param {boolean} isPad 是否补零
 * @returns
 */
function formatDate(time, fmt, isPad = false) {
    const formatter = _formatNormalize(fmt)
    if (!isValidDate(time)) {
        throw new Error('日期格式不正确')
    }
    const date = new Date(time)
    const dataInfo = {
        yyyy: date.getFullYear().toString(),
        MM: (date.getMonth() + 1).toString(),
        dd: date.getDate().toString(),
        HH: date.getHours().toString(),
        mm: date.getMinutes().toString(),
        ss: date.getSeconds().toString(),
        ms: date.getMilliseconds().toString()
    }
    if (isPad) {
        dataInfo.yyyy = dataInfo.yyyy.padStart(4, '0')
        dataInfo.MM = dataInfo.MM.padStart(2, '0')
        dataInfo.dd = dataInfo.dd.padStart(2, '0')
        dataInfo.HH = dataInfo.HH.padStart(2, '0')
        dataInfo.mm = dataInfo.mm.padStart(2, '0')
        dataInfo.ss = dataInfo.ss.padStart(2, '0')
        dataInfo.ms = dataInfo.ms.padStart(3, '0')
    }
    return formatter(dataInfo)
}

/**
 * 构造树型结构数据
 * @param {*} data 数据源
 * @param {*} id id字段 默认 'id'
 * @param {*} parentId 父节点字段 默认 'parentId'
 * @param {*} children 子节点合集字段 默认 'children'
 */
function handleTree(data, id, parentId, children) {
    var tree = [] // 存储树型结构数据
    const config = {
        id: id || 'id',
        parentId: parentId || 'parentId',
        childrenList: children || 'children'
    }
    for (const d of data) {
        const parentId = d[config.parentId]
        if (parentId) {
            const parent = data.find(item => item[config.id] === parentId)
            if (parent) {
                if (parent[config.childrenList] == null) {
                    parent[config.childrenList] = []
                }
                parent[config.childrenList].push(d)
            }
        } else {
            tree.push(d)
        }
    }
    return tree
}

/**
 * 格式化树型结构为列表数据
 * @param {Array} data 树型结构数据
 * @param {string} id 节点 id 字段
 * @param {string} children 子节点字段
 * @param {string} parentId 父节点字段
 * @param {string} rootId 根节点 id
 */
function formatTree(data, id, children, parentId, rootId) {
    const config = {
        id: id || 'id',
        children: children || 'children',
        parentId: parentId || 'parentId',
        rootId: rootId || null
    }
    const result = []
    traverse(data, config.rootId)
    // 递归遍历
    function traverse(item, parentId) {
        for (const i of item) {
            result.push({
                ...i,
                [config.parentId]: parentId,
            })
            const children = item[config.children]
            if (children) {
                traverse(children, i[config.id])
            }
        }
    }
    return result
}


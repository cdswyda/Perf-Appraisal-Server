const mongoose = require('mongoose')
const Schema = mongoose.Schema
const bcrypt = require('bcrypt')

/**
 * 如果是base64编码则解码
 * @param {String} str string
 */
function decodeBase64(str) {
    if (/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$/.test(str)) {
        return new Buffer(str, 'base64').toString();
    }
    return str;
}

mongoose.Promise = global.Promise

const SALT_WORK_FACTOR = 10

const userSchema = new Schema({
    email: {
        type: String,
        unique: true,
    },
    name: {
        type: String,
        required: true
    },
    pwd: String,
    pwdSalt: String,
    role: {
        // type: String,
        // enum: ['unverified', 'normal', 'admin'],
        // default: 'unverified'
        // 枚举值不利于做权限判断，改成以数字表示 越大权限越高 也方便后期扩展
        // 0 unverified 已经注册、未验证
        // 1 normal 已经验证通过的普通用户
        // 100 admin 管理员
        // 1000 superAdmin 超级管理员
        type: Number,
        default: 0
    },
    type: {
        type: String,
        enum: ['site', 'third'],
        default: 'site'
    },
    meta: {
        createAt: {
            type: Date,
            default: Date.now()
        },
        updateAt: {
            type: Date,
            default: Date.now()
        }
    }
})
/**
 * 比较密码是否匹配
 * @param {String} pwd 用户提交的密码，经过 base64 编码的
 * @returns {Promise<Boolean>} 密码是否匹配
 */
userSchema.methods.comparePwd = function (pwd) {
    pwd = decodeBase64(pwd);
    return bcrypt.compare(pwd, this.pwd)
}
/**
 * 获取可返回客户端的用户数据
 * 
 * @returns {Object}
 */
userSchema.methods.getClientData = function(){
    return {
        name: this.name,
        email: this.email,
        id: this._id,
        type: this.type,
        role: this.role
    }
};
// userSchema.statics.find = function (condition, sort) {
//     return this.find(condition).sort(sort || 'meta.updateAt')
// }
// userSchema.statics.findOne = function (condition) {
//     return this.findOne(condition).sort()
// }

userSchema.pre('save', function (next) {
    // const user = this

    if (this.isNew) {
        this.meta.createAt = this.meta.updateAt = Date.now()
        this.pwd = decodeBase64(this.pwd);
    } else {
        this.meta.updateAt = Date.now()
    }

    // 加盐
    // bcrypt.genSalt(SALT_WORK_FACTOR).then((salt) => {
    //     // 
    //     return bcrypt.hash(user.pwd, salt)
    // }).then((hash) => {
    //     user.pwd = hash
    //     next()
    // }).catch((err) => {
    //     next(err)
    // })
    // 自动加盐并hash
    // bcrypt.hash(this.pwd, SALT_WORK_FACTOR).then((hash) => {
    //     this.pwd = hash;
    //     next()
    // }).catch((err) => {
    //     next(err)
    // })
    bcrypt.genSalt(SALT_WORK_FACTOR)
        .then((salt) => {
            this.pwdSalt = salt;
            return bcrypt.hash(this.pwd, salt);
        }).then((hash) => {
            this.pwd = hash;
            next();
        }).catch(err => {
            next(err);
        })
})


module.exports = userSchema
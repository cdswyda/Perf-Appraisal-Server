const mongoose = require('mongoose')
const Schema = mongoose.Schema
const bcrypt = require('bcrypt')

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
    role: {
        type: String,
        enum: ['unverified', 'normal', 'admin'],
        default: 'unverified'
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

userSchema.methods.comparePwd = function (pwd) {
    // return new Promise((resolve,reject) => {

    // })
    return bcrypt.compare(pwd, this.pwd);
}

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
    bcrypt.hash(this.pwd, SALT_WORK_FACTOR).then((hash) => {
        this.pwd = hash;
        next()
    }).catch((err) => {
        next(err)
    })
})


module.exports = userSchema
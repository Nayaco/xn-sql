/*
+--------------------------------------------+
|                                            |
|     Database visitor based on co-mysql     |
|                                            |
+--------------------------------------------+
*/
'use strict'
const util = require('util')
const mysql = require('mysql2')
const wrapper = require('co-mysql')
const crypto = require('create-hmac')
const ciphermethod = ['md5','sha1','sha256','sha512','adler32','crc32','crc32b','fnv132','fnv164','fnv1a32','fnv1a64','gost','gost-crypto','haval128,3','haval128,4','haval128,5','haval160,3','haval160,4','haval160,5','haval192,3','haval192,4','haval192,5','haval224,3','haval224,4','haval224,5','haval256,3','haval256,4','haval256,5','joaat','md2','md4','ripemd128','ripemd160','ripemd256','ripemd320','sha224','sha384','snefru','snefru256','tiger128,3','tiger128,4','tiger160,3','tiger160,4','tiger192,3','tiger192,4','whirlpool']
const autoconfig = {
    'host' : 'localhost',
    'port' : 3306,
    'database' : 'defult',
    'user' : 'root',
    'password' : 'defult'    
}

function xiannvsql(config, Reg){
    this.config = config?config:autoconfig
    this.Reg = Reg
    this.pool = mysql.createPool(this.config)
    this.mp = wrapper(this.pool)
    
    //RegExp legalcheck*
    this.legalcheck = name =>{
        if(util.isNumber(name))return true
        let reg =  this.Reg || /\w*\+|\-|\/|\'|\=|\"\w*/
        return !(reg.test(name))
    }

    //cipher*
    this.cipher = (data, key ,encoding) =>{
        const method = (encoding in ciphermethod)?encoding:'md5'
        const hmac = crypto(method, key)
        const datastring = (util.isString(data))?data:data.toString()
        hmac.update(datastring)
        return hmac.digest('hex')
    }

    //create a table*
    this.lcreatetable = (tablename, structure, flag) =>{
        if(!util.isObject(structure) || !util.isString(tablename)){
            return new Promise((resolve,reject)=>{
                err = {
                    errmessage: 'Input type error'
                }
                reject(err)
            })
        }
        let strucstring = ''
        const fpasskey = (flag == 'c')?',\npasskey VARCHAR(255)':''
        for(let col in structure)strucstring += `,\n${col} ${structure[col]}`
        strucstring = strucstring.substring(2)
        strucstring += fpasskey
        return this.mp.query(`CREATE TABLE ${tablename}(${strucstring})`)
    }

    //column command*
    this.ldowithcol = (table , colob, flag) =>{
        if(!util.isObject(colob) || !util.isString(colob.name) || !util.isString(flag)){
            return new Promise((resolve,reject)=>{
                const err = {
                    errmessage: 'Input type error'
                }
                reject(err)
           })
        }
        let dbflag
        switch(flag){
            case 'a': {dbflag = 'ADD';break}
            case 'd': {dbflag = 'DROP COLUMN';break}
            default: return new Promise((resolve,reject)=>{
                const err = {
                    errmessage: 'No such command'
                }
                reject(err)
            })
        }
        return this.mp.query(`ALTER TABLE ${table} ${dbflag} ${colob.name} ${colob.type}`)
    }

    //insert a row*
    this.linsertdata  = (table, data) =>{
        if(!util.isObject(data) || !util.isString(table)){
            return new Promise((resolve,reject)=>{
                err = {
                    errmessage: 'Input type error'
                }
                reject(err)
            })
        }
        let datastring  = ''
        let colstring = ''
        for(let col in data)colstring += `,${col}`
        colstring = colstring.substring(1)
        for(let key in data){
            if(this.legalcheck(data[key])){
                let keystring = (util.isNumber(data[key]))?data[key]:`'${data[key]}'`
                datastring += `, ${keystring}`
            }else return new Promise((resolve,reject)=>{
                const err = {
                    errmessage: 'Illegal input'
                }
                reject(err)
            })
        }
        datastring = datastring.substring(1)
        return this.mp.query(`INSERT INTO ${table} (${colstring}) VALUES (${datastring})`)
    }

    //insert a cipher row*
    this.linscipherdata  = (table, data, ciphercol, passkey, method) =>{
        if(!util.isString(table) || !util.isObject(data) || !util.isString(ciphercol) || !util.isString(passkey)){
            return new Promise((resolve,reject)=>{
                const err = {
                    errmessage: 'Input type error or lacked input'
                }
                reject(err)
            })
        }
        let datastring  = ''
        let colstring = ''
        for(let col in data)colstring += `,${col}`
        colstring = colstring.substring(1)
        colstring += `,passkey`
        for(let key in data){
            if(this.legalcheck(data[key])){
                let keystring
                if(key == ciphercol)keystring = `'${this.cipher(data[key], passkey, method)}'`
                    else keystring = (util.isNumber(data[key]))?data[key]:`'${data[key]}'`
                datastring += `, ${keystring}`
            }else return new Promise((resolve,reject)=>{
                const err = {
                    errmessage: 'Illegal input'
                }
                reject(err)
            })
        }
        datastring = datastring.substring(1)
        datastring += `, '${passkey}'`
        return this.mp.query(`INSERT INTO ${table} (${colstring}) VALUES (${datastring})`)
    }

    //show the whole table*
    this.lshowtable = (table, setting) =>{
        if(!util.isString(table) || !(util.isString(setting) || util.isUndefined(setting))){
            return new Promise((resolve, reject)=>{
                const err = {
                    errmessage: 'Inout type error'
                }
                reject(err)
            })
        }
        const order = setting?`ORDER BY ${setting}`:''
        return this.mp.query(`SELECT * FROM ${table} ${order}`)
    }

    //get rows by ID/name*
    this.lgetdatabyID = (table, target, col, name) =>{
        if(!util.isString(table) || !util.isString(target) || !util.isString(col)){
            return new Promise((resolve,reject)=>{
                const err = {
                    errmessage: 'Input type error'
                }
                resolve(err)
            })
        }
        const colname = (util.isNumber(name))?name:`'${name}'`
        return this.mp.query(`SELECT ${target} FROM ${table} WHERE ${col}=${colname}`)
    }

    //original getdata*
    this.lgetdata = (table ,target , _sql)=>{
        if(!util.isString(table) || !util.isString(target) || !util.isString(_sql)){
            return new Promise((resolve,reject)=>{
                const err = {
                    errmessage: 'Input type error'
                }
                resolve(err)
            })
        }
        return this.mp.query(`SELECT ${target} FROM ${table} WHERE ${_sql}`)
    }

    //get uniquedata by ID/name (return a the target col or *)*
    this.lgetunique = (table, target, col, name) =>{
        if(!util.isString(table) || !util.isString(target) || !util.isString(col)){
            return new Promise((resolve,reject)=>{
                const err = {
                    errmessage: 'Input type error'
                }
                resolve(err)
            })
        }
        const colname = (util.isNumber(name))?name:`'${name}'`
        return this.mp.query(`SELECT DISTINCT ${target} FROM ${table} WHERE ${col}=${colname}`)
    }

    //update a row by ID*
    this.lupdate = (table, col, name, data) =>{
        if(!util.isString(table) || !util.isObject(data)){
            return new Promise((resolve,reject)=>{
                const err = {
                    errmessage: 'Input type error or lacked input'
                }
                reject(err)
            })
        }
        let datastring  = ''
        const colname = (util.isNumber(name))?name:`'${name}'`
        for(let key in data){
            if(this.legalcheck(data[key])){
            let keystring = (util.isNumber(data[key]))?data[key]:`'${data[key]}'`
            datastring += `, ${key}=${keystring}`
            }else return new Promise((resolve,reject)=>{
                const err = {
                    errmessage: 'Illegal input'
                }
                reject(err)
            })
        }
        datastring = datastring.substring(1)
        return this.mp.query(`UPDATE ${table} SET ${datastring} WHERE ${col}=${colname}`)
    }

    //cipher update
    this.lcipherupdate = (table, col, name, data, ciphercol, passkey, method) =>{
        if(!util.isString(table) || !util.isObject(data) || !util.isString(name) || !util.isString(col) || !util.isString(passkey) || util.isString(ciphercol)){
            return new Promise((resolve,reject)=>{
                const err = {
                     errmessage: 'Input type error or lacked input'
                }
                reject(err)
            })
        }
        let datastring = ''
        for(let key in data){
            if(!util.isNumber(data[key])){
                let keystring
                if(ciphercol == key)keystring = `'${this.cipher(data[key],passkey,method)}'`
                 else keystring = (util.isNumber(data[key]))?data[key]:`'${data[key]}'`
                datastring += `, ${key}=${keystring}`
            }else return new Promise((resolve,reject)=>{
                const err = {
                    errmessage: 'Illegal input'
                }
                reject(err)
            })
            datastring = datastring.substring(1)
            datastring += `, '${passkey}'`
            return this.mp.query(`UPDATE ${table} SET ${datastring} WHERE ${col}=${colname}`)
        }
    }
    //delete a row by ID*
    this.ldeletedata = (table, col, name) =>{
        if(!util.isString(table) || !util.isString(col)){
            return new Promise((resolve,reject)=>{
                const err = {
                    errmessage: 'Input type error'
                }
                resolve(err)
            })
        }
        const colname = (util.isNumber(name))?name:`'${name}'`
        return this.mp.query(`DELETE FROM ${table} WHERE ${col} = ${colname}`)
    }

    //'count' by ID/* the whole table*
    this.lcount = (table, col) =>{
        if(!util.isString(table) || !util.isString(col)){
            return new Promise((resolve,reject)=>{
                const err = {
                    errmessage: 'Input type error'
                }
                resolve(err)
            })
        }
        return this.mp.query(`SELECT COUNT(${col}) AS ANSWER FROM ${table}`)
    }

    //'count' by ID/* the whole table(unique)*
    this.lunicount = (table, target, col, name) =>{
        if(!util.isString(table) || !util.isString(target) || !util.isString(col)){
            return new Promise((resolve,reject)=>{
                const err = {
                    errmessage: 'Input type error'
                }
                resolve(err)
            })
        }
        const colname = (util.isNumber(name))?name:`'${name}'`
        return this.mp.query(`SELECT COUNT(DISTINCT ${target}) AS ANSWER FROM ${table} WHERE ${col}=${colname}`)
    }

    //sum a col
    this.lcolsum = (table , target, _sql) =>{
        if(!util.isString(table) || !util.isString(target) || !(util.isString(_sql) || util.isUndefined(_sql))){
            return new Promise((resolve,reject)=>{
                const err = {
                    errmessage: 'Input type error'
                }
                resolve(err)
            })
        }
        const sqlcom = _sql?`WHERE ${_sql}`: '' 
        return this.mp.query(`SELECT SUM(${target}) AS ANSWER FROM ${table} ${sqlcom}`)
    }
}

module.exports = xiannvsql
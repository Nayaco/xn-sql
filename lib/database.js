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
const crypto = require('crypto')

function xiannvsql(config, Reg){
    this.config = config
    this.Reg = Reg
    this.pool = mysql.createPool(this.config)
    this.mp = wrapper(this.pool)
    
    //RegExp legalcheck
    this.legalcheck = name =>{
        let reg =  this.Reg || /\w*\+|\-|\/|\'|\=|\"\w*/
        return !(reg.test(name))
    }

    //cipher
    this.cipher = (data, key ,encoding) =>{
        const method = encoding || 'md5'
        const hamac = crypto.createHmac(method, key)
        hamac.update(data)
        return hamac.digest('hex')
    }

    //create a table
    this.lcreatetable = (tablename, structure, flag) =>{
        if(!util.isObject(structure)){
            return new Promise((resolve,reject)=>{
                err = {
                    errmessage: 'Structure type error'
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
    this.ldowithcol = (table , colob, encoding) =>{
        if(!util.isObject(colob) || !util.isString(colob.name)){
            return new Promise((resolve,reject)=>{
                const err = {
                    errmessage: 'Column name/type error'
                }
                reject(err)
           })
        }
        let flag
        switch(encoding){
            case 'a': {flag = 'ADD';break}
            case 'd': {flag = 'DROP COLUMN';break}
            default: return new Promise((resolve,reject)=>{
                const err = {
                    errmessage: 'No such command'
                }
                reject(err)
            })
        }
        return this.mp.query(`ALTER TABLE ${table} ${flag} ${colob.name} ${colob.type}`)
    }

    //insert a row*
    this.linsertdata  = (table, data) =>{
        if(!util.isObject(data)){
            return new Promise((resolve,reject)=>{
                err = {
                    errmessage: 'Data type error'
                }
                reject(err)
            })
        }
        let datastring  = ''
        let colstring = ''
        for(let col in data)colstring += `,${col}`
        colstring = colstring.substring(1)
        for(let key in data){
            if(!util.isNumber(data[key]))if(this.legalcheck(data[key])){
                let keystring = (util.isNumber(data[key]))?data[key]:`'${data[key]}'`
                datastring += `, ${keystring}`
            }else return new Promise((resolve,reject)=>{
                const err = {
                    errmessage: 'illegal input'
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
            if(!util.isNumber(data[key]))if(this.legalcheck(data[key])){
                let keystring
                if(key == ciphercol)keystring = `'${(method?this.cipher(data[key],passkey,method):this.cipher(data[key],passkey))}'`
                    else keystring = (util.isNumber(data[key]))?data[key]:`'${data[key]}'`
                datastring += `, ${keystring}`
            }else return new Promise((resolve,reject)=>{
                const err = {
                    errmessage: 'illegal input'
                }
                reject(err)
            })
        }
        datastring = datastring.substring(1)
        datastring += `, '${passkey}'`
        console.log(datastring)
        return this.mp.query(`INSERT INTO ${table} (${colstring}) VALUES (${datastring})`)
    }

    //show the whole table*
    this.lshowtable = (table, setting) =>{
        const order = setting?`ORDER BY ${setting}`:''
        return this.mp.query(`SELECT * FROM ${table} ${order}`)
    }

    //get rows by ID/name*
    this.lgetdatabyID = (table, target, col, name) =>{
        const colname = (util.isNumber(name))?name:`'${name}'`
        return this.mp.query(`SELECT ${target} FROM ${table} WHERE ${col}=${colname}`)
    }

    //original getdata
    this.lgetdata = (table ,target , _sql)=>{
        return this.mp.query(`SELECT ${target} FROM ${table} WHERE ${_sql}`)
    }

    //get uniquedata by ID/name (return a the target col or *)*
    this.lgetunique = (table, target, col, name) =>{
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
            if(!util.isNumber(data[key]))if(this.legalcheck(data[key])){
            let keystring = (util.isNumber(data[key]))?data[key]:`'${data[key]}'`
            datastring += `, ${key}=${keystring}`
            }else return new Promise((resolve,reject)=>{
                const err = {
                    errmessage: 'illegal input'
                }
                reject(err)
            })
        }
        datastring = datastring.substring(1)
        return this.mp.query(`UPDATE ${table} SET ${datastring} WHERE ${col}=${colname}`)
    }

    //delete a row by ID*
    this.ldeletedata = (table, col, name) =>{
        const colname = (util.isNumber(name))?name:`'${name}'`
        return this.mp.query(`DELETE FROM ${table} WHERE ${col} = ${colname}`)
    }

    //'count' by ID/* the whole table*
    this.lcount = (table, col) =>{
        return this.mp.query(`SELECT COUNT(${col}) AS ANSWER FROM ${table}`)
    }

    //'count' by ID/* the whole table(unique)*
    this.lunicount = (table, target, col, name) =>{
        const colname = (util.isNumber(name))?name:`'${name}'`
        return this.mp.query(`SELECT COUNT(DISTINCT ${target}) AS ANSWER FROM ${table} WHERE ${col}=${colname}`)
    }

    //sum a col
    this.lcolsum = (table , target, _sql) =>{
        const sqlcom = _sql?`WHERE ${_sql}`: '' 
        return this.mp.query(`SELECT SUM(${target}) AS ANSWER FROM ${table} ${sqlcom}`)
    }
}

module.exports = xiannvsql
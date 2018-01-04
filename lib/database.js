/*
+--------------------------------------------+
|                                            |
|  Database visitor frame based on co-mysql  |
|                                            |
+--------------------------------------------+
*/
'use strict'
const util = require('util')
const mysql = require('mysql2')
const wrapper = require('co-mysql')
const crypto = require('crypto')

function xiannvsql(config){
    this.config = config
    this.pool = mysql.createPool(this.config)
    this.mp = wrapper(this.pool)
    
    //RegExp legalcheck
    this.legalcheck = name =>{
        let reg = /\w*\+|\-|\/|\'|\=|\"\w*/
        return !(reg.test(name))
    }

    //cipher
    this.cipher = (data, key) =>{
        const hamac = crypto.createHmac('md5',key)
        hamac.update(data)
        return hamac.digest('hex')
    }

    //create a database
    this.lcreatedatabase = basename =>{
        return mp.query(`CREATE DATABASE ${basename}`)
    }

    //create a table
    this.lcreatetable = (tablename, structure) =>{
        let strucstring = ''
        for(let col in structure)strucstring += `,\n${col} ${structure[col]}`
        strucstring = strucstring.substring(2)
        return mp.query(`CREATE TABLE ${tablename}(${strucstring})`)
    }

    //insert a row*
    this.linsertdata  = (table, data) =>{
        let datastring  = ''
        let colstring = ''
        for(let col in data)colstring += `,${col}`
        colstring = colstring.substring(1)
        for(let key in data){
            if(!util.isNumber(data[key]))if(legalcheck(data[key])){
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
        return mp.query(`INSERT INTO ${table} (${colstring}) VALUES (${datastring})`)
    }

    //insert a cipher row*
    this.linscipherdata  = (table, data, ciphercol, passkey) =>{
        let datastring  = ''
        let colstring = ''
        for(let col in data)colstring += `,${col}`
        colstring = colstring.substring(1)
        colstring += `,passkey`
        for(let key in data){
            if(!util.isNumber(data[key]))if(legalcheck(data[key])){
                let keystring
                if(key == ciphercol)keystring = `'${cipher(data[key],passkey)}'`
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
        return mp.query(`INSERT INTO ${table} (${colstring}) VALUES (${datastring})`)
    }

    //show the whole table*
    this.lshowtable = table =>{
        return mp.query(`SELECT * FROM ${table}`)
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
        return mp.query(`SELECT DISTINCT ${target} FROM ${table} WHERE ${col}=${colname}`)
    }

    //update a row by ID*
    this.lupdate = (table, col, name, data) =>{
        let datastring  = ''
        const colname = (util.isNumber(name))?name:`'${name}'`
        for(let key in data){
            if(!util.isNumber(data[key]))if(legalcheck(data[key])){
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
        return mp.query(`UPDATE ${table} SET ${datastring} WHERE ${col}=${colname}`)
    }

    //delete a row by ID*
    this.ldeletedata = (table, col, name) =>{
        const colname = (util.isNumber(name))?name:`'${name}'`
        return mp.query(`DELETE FROM ${table} WHERE ${col} = ${colname}`)
    }

    //'count' by ID/* the whole table*
    this.lcount = (table, col) =>{
        return mp.query(`SELECT COUNT(${col}) AS ANSWER FROM ${table}`)
    }

    //'count' by ID/* the whole table(unique)*
    this.lunicount = (table, target, col, name) =>{
        this.colname = (util.isNumber(name))?name:`'${name}'`
        return mp.query(`SELECT COUNT(DISTINCT ${target}) AS ANSWER FROM ${table} WHERE ${col}=${colname}`)
    }
}

module.exports = xiannvsql




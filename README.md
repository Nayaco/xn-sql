# xnv-sql

## description

仙女-sql，你值得拥有

## Install
```

    npm install

```

##API document

### lcreatetable(table:String,structrure:Object)

### ldowhithcol(table:String,colob:{name:String,[type:String]},[flag:String])

### linsertdata(table:String,data:Object)

### linscipherdata(table:String,data:Object,ciphercol:String,passkey:String,[method:String])

### lshowtable(table:String,setting:String<ORDER BY>)

### lgetdatabyID(table:String,target:String/'*')

### lgetdata(table:String,target:String/'*',_sql:String<SQL>)

### lgetunique(table:String,target:String/'*',col:String,name:any)

### lupdate(table:String,col:String,name:any,data:Object)

### lcipherupdate(table:String,col:String,name:any,data:Object,ciphercol:String,passkey:String,[method:String])

### ldeleteata(table:String,col:String,name:any)

### lcount(table:String,col:String)

### lunicount(table:String,target:String,col:String,name:any)

### lcolsum(table:String,target:String,[_sql:String<SQL>])

## Update Log

### v1.0.0 2018/1/6 pubished

### v1.0.1 2018/1/6 development committed

### v1.0.2 2018/1/11 fix somebugs, it's wrapped by a class

### v1.0.3 2018/1/11 Hah, sorry for this quickly update...

### Maybe I will restruct it one day 
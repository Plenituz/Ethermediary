const fs = require('fs');
const dust = require('hoffman').dust;
const path = require('path');
const Q = require('q');
const mailFolder = path.join(__dirname, "mail");

module.exports = {
    cache: {},

    cacheTemplates: function(){
      return new Promise((resolve, reject) => {
        return Q.nfcall(fs.readdir, mailFolder)
        .then(function(files){
            for(let i = 0; i < files.length; i++){
                let fullPath = path.join(mailFolder, files[i]);
                let fileContent = fs.readFileSync(fullPath).toString();
                let compiled = dust.compile(fileContent);
                let template = dust.loadSource(compiled);
                module.exports.cache[path.parse(files[i]).name] = template;
            }
        })
        .then(function(){ return resolve() })
        .catch(function(err){
            console.log("error caching mail templates:", err);
        });
      })
    },

    renderTemplate: function(name, args){
        if(!(name in module.exports.cache))
            throw new Error("mail template " + name + " doesn't exist");
        let defer = Q.defer();

        dust.render(module.exports.cache[name], args,
        function(err, out){
            if(err)
                return defer.reject(err);
            defer.resolve(out);
        });

        return defer.promise
    }
}

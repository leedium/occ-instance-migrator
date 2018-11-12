define(

    ['knockout', 'CCi18n', 'ccRestClient'],

    function(ko, CCi18n, ccRestClient) {

        "use strict";
        
        var SSE_BASE =  '/ccstorex/custom/v1/';
        
         function request(url, options) {
             return fetch(url, options)
                        .then(function(res){
                           return res.json();
                        })
                        .then(function(json){
                            console.log(json);
                            document.querySelector('#responseOutput').innerHTML = JSON.stringify(json,null,4);
                        })
                        .catch(function(err){
                            console.log(Error(err));
                        });
        }

        return {
            ssePath: ko.observable(''),
            sseData: ko.observable(''),
            method: ko.observable(''),
            onLoad : function(widget) {
                widget.onSubmit = function(e) {
                    console.log(widget.sseData(), widget.sseData(), widget.method())
                    var jsonData;
                    var options = {
                        method: widget.method(),
                        headers: {
                            'content-type': 'application/json'
                        }
                    }
                    
                    if(widget.method() === "POST" || widget.method() === "PUT"){
                        try{
                            jsonData =  JSON.parse(widget.sseData());
                            options['body'] = JSON.stringify(jsonData);
                        }catch(err){
                            alert('JSON data is invalid');
                            return ;
                        }
                        
                    }
                    
                    if(widget.user().loggedIn()){
                        options.headers['Authorization'] = 'Bearer ' +  ccRestClient.tokenSecret;
                    }
                    
                    request('/ccstorex/custom/v1' + widget.ssePath(), options);
                    // request('https://hc.leedium.com/v1' + widget.ssePath(), options);
                };
            }
        }
    }
);

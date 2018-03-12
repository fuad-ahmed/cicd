var AWS = require('aws-sdk');

//Region: ap-southeast-1
AWS.config.update({region: 'ap-southeast-1'});

exports.handler = (event, context, callback) => {
    // TODO implement
    console.log(JSON.stringify(event));
    
    getOrganizationInfo(event.headers['X-APP-Key'],function (data){
        
        if(data.Item!==undefined){
            
            var payment_id=getPaymentID()+Date.now();
            event.body.payment_id=payment_id;
            event.body.execution_status='initiated';
            event.body.otpStatus=false;//this should be false and made true when otp success
            event.body.pinStatus=false;//this should be false and made true when pin success
            event.body.initiation_time=new Date()+"";
            event.body.execution_time="null";
            
            saveMandateInfo(event.body,function(saved){
                var createMandateResponse={};
                createMandateResponse.paymentID=payment_id;
                createMandateResponse.createTime= new Date();
                createMandateResponse.paymentStatus='new';
                createMandateResponse.orgName=data.Item.org_name;
                createMandateResponse.orgLogo=data.Item.org_logo;
               // createMandateResponse.saved=saved;
                callback(null, createMandateResponse);
            });
        }
        else {
            var createMandateResponse={};
            createMandateResponse.paymentStatus='failed';            
            createMandateResponse.orgName='Invalid App Key';
            createMandateResponse.createTime= new Date();
            callback(null, createMandateResponse);
        }
    });
};

function saveMandateInfo(mandateData,callback){
    var docClient = new AWS.DynamoDB.DocumentClient();
    var params = 
    {
        TableName:'pgw_mandate_info',
        Item:mandateData
    };
    docClient.put(params, function(err, data) {
  if (err) {
      callback(err);
        console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        callback(data);
        console.log("Added item:", JSON.stringify(data, null, 2));
    }
});
}

function getOrganizationInfo(app_key,callback){
    var docClient = new AWS.DynamoDB.DocumentClient();
    //Get Item from Dynamo DB
    var params = {
        TableName: 'pgw_merchant_config',
        Key:{
            "app_key": app_key
        }
    };
    docClient.get(params, function(err, data) {
        if (err) {
            callback(err);
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            callback(data);
            console.log("Merchant Config succeeded:", JSON.stringify(data, null, 2));
        }
    });
}

function getPaymentID() {
    var text = "";
    var possible = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (var i = 0; i < 7; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}
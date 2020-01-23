'use strict';

const crypto = require('crypto');
const axios = require("axios");
const userModel = require('../models/user');
const userTransactionModel = require('../models/user_transaction')

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // Must be 256 bytes (32 characters)
const IV_LENGTH = 16; // For AES, this is always 16
var allAddress = []
const async = require('async')

function encrypt(text) {
    // console.log("texy---->", text, ENCRYPTION_KEY)
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv('aes-256-cbc', new Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);

    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    try {
        let textParts = text.split(':');
        let iv = new Buffer.from(textParts.shift(), 'hex');
        let encryptedText = new Buffer.from(textParts.join(':'), 'hex');
        let decipher = crypto.createDecipheriv('aes-256-cbc', new Buffer.from(ENCRYPTION_KEY), iv);
        let decrypted = decipher.update(encryptedText);

        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString();
    } catch (error) {
        return false
    }
}

function getNewWallet(url, username, password, userid, param, coinname) {
    console.log("in Crete New Wallet : ", url, username, password, userid, param, coinname);
    return new Promise((resolve, reject) => {
        axios({
            method: 'post',
            url,
            data: {
                "method": param,
                "params": [
                    userid
                ]
            },
            auth: { username, password }
        }).then(response => {
            // console.log("get wallet address response : ", response.data);
            console.log("resposne===>", response.data.result)
            if (response.data.result) {
                // console.log("resposne===>",response.data)
                resolve(response.data)
                return;
            } else {
                reject();
                return;
            }
        }).catch(err => {
            if (err.response && err.response.status) {
                // console.log("Err--->",err)
                console.log("get new wallet err with status new wallet : ", err.response.status, err.response.statusText)
            } else {
                console.log("get new wallet err : ", err);
            }
            reject({ error: true });
        })
    });
}

function getNewAddress(url, username, password, userid, param, coinname) {
    // console.log("in getNewAddress : ", url, username, password, userid, param, coinname);
    url = url + "/wallet/" + userid
    // console.log("NEWUSRL---->",url)
    return new Promise((resolve, reject) => {
        axios({
            method: 'post',
            url,
            data: {
                "method": param,
                "params": [
                    userid,
                ]
            },
            auth: { username, password }
        }).then(response => {
            // console.log("get wallet address response : ", response.data);
            if (!response.data.error) {
                resolve(response.data)
            } else {
                reject();
                return;
            }
        }).catch(err => {
            if (err.response && err.response.status) {
                console.log("get wallet address err with status : ", err.response.status, err.response.statusText, err)
            } else {
                console.log("get wallet address err : ", err);
            }
            reject({ error: true });
        })
    });
}

function getPrivateKey(url, username, password, userid, param, coinname, address) {
    // console.log("in get privatekey : ", url, username, password, userid, param, coinname, address);
    url = url + "/wallet/" + userid
    return new Promise((resolve, reject) => {
        axios({
            method: 'post',
            url,
            data: {
                "method": param,
                "params": [
                    address
                ]
            },
            auth: { username, password }
        }).then(response => {
            // console.log("get wallet address response : ", response.data);
            // console.log("resposne===>",response.data.result)
            if (response.data.result) {
                // console.log("resposne===>",response.data)
                resolve(response.data)
                return;
            } else {
                reject();
                return;
            }
        }).catch(err => {
            if (err.response && err.response.status) {
                console.log("get new wallet err with status private key : ", err.response.status, err.response.statusText)
            } else {
                console.log("get new wallet err : ", err);
            }
            reject({ error: true });
        })
    });
}

function getTransaction(url, username, password, txid, coinname, method) {
    // console.log("in getTransaction : ", url, username, password, txid, coinname, method);
    return new Promise((resolve, reject) => {
        axios({
            method: 'post',
            url,
            data: {
                "method": method,
                "params": [
                    txid
                ]
            },
            auth: { username, password }
        }).then(response => {
            // console.log("get transaction response : ", response.data);
            if (response.data.error) {
                reject();
                return;
            }
            //store wallet address in database
            resolve(response.data)
        }).catch(err => {
            if (err.response && err.response.status) {
                console.log("get transaction err with status : ", err.response.status, err.response.statusText)
            } else {
                console.log("get transaction err : ", err);
            }
            reject({ error: true });
        })
    });
}

function decodeRawTransaction(url, username, password, txhash, coinname, method) {
    // console.log("in decode Transaction : ", url, username, password, txhash, coinname, method);
    return new Promise((resolve, reject) => {
        axios({
            method: 'post',
            url,
            data: {
                "method": method,
                "params": [
                    txhash
                ]
            },
            auth: { username, password }
        }).then(response => {
            // console.log("decode transaction response : ", response.data);
            if (response.data.error) {
                reject();
                return;
            }
            //store wallet address in database
            resolve(response.data)
        }).catch(err => {
            if (err.response && err.response.status) {
                console.log("decode raw transaction err with status : ", err.response.status, err.response.statusText)
            } else {
                console.log("get transaction err : ", err);
            }
            reject({ error: true });
        })
    });
}

function storeDepositeTransaction(data) {
    // console.log("in decode Transaction : ", url, username, password, txhash, coinname, method);
    return new Promise((resolve, reject) => {
        async.eachOf(data.allAddress, (item, key, callback) => {
            var address = Object.keys(item)[0]
            // console.log("==============>",allAddress.includes(address))
            if (allAddress.includes(address)) {
                userModel.getUsersByPublicAddress(address, (err, user_result) => {
                    if (err) {
                        console.log("Error in get user : ", err)
                        callback()
                    } else {
                        // console.log(user_result)
                        if (user_result.length > 0) {
                            let transaction = new userTransactionModel({
                                user_id: user_result[0]._id,
                                user_wallet_address: address,
                                dest_wallet_address: address,
                                transaction_hash: data.tx.txid,
                                amount: item[address],
                                trans_type: "Deposit"
                            });
                            userTransactionModel.addNewTransaction(transaction, (err, result) => {
                                if (err) {
                                    console.log("Error in add data", err)
                                    callback()
                                } else {
                                    callback()
                                }
                            })
                        } else {
                            callback()
                        }
                    }
                })
            } else {
                callback()
            }
        }, function (err) {
            if (err) {
                console.log("Error--->", err)
                reject({ error: true });
            } else {
                resolve({status : 1})
            }
        })
    });
}

function getBlock(url, username, password, blockid, coinname, method) {
    // console.log("in getBlock : ", url, username, password, blockid, coinname, method);
    return new Promise((resolve, reject) => {
        axios({
            method: 'post',
            url,
            data: {
                "method": method,
                "params": [
                    blockid
                ]
            },
            auth: { username, password }
        }).then(response => {
            // console.log("get block response : ", response.data);
            if (response.data.error) {
                reject();
                return;
            }
            //store wallet address in database
            resolve(response.data)
        }).catch(err => {
            if (err.response && err.response.status) {
                console.log("get block err with status : ", err.response.status, err.response.statusText)
            } else {
                console.log("get block err : ", err);
            }
            reject({ error: true });
        })
    });
}

function getReceivedByAddress(url, username, password, userid, wallet_add, method) {
    // console.log("in getreceivedbyaddress : ", url,"--", username,"--", password,"--", userid,"--", wallet_add,"--", method);
    url = url + "/wallet/" + userid
    return new Promise((resolve, reject) => {
        axios({
            method: 'post',
            url,
            data: {
                "method": method,
                // "params": [
                //     wallet_add
                // ]
            },
            auth: { username, password }
        }).then(response => {
            // console.log("get balance response : ", response.data);
            if (response.data.error) {
                reject();
                return;
            }
            //store wallet address in database
            resolve(response.data)
        }).catch(err => {
            if (err.response && err.response.status) {
                console.log("Error---->", err)
                console.log("get balance err with status : ", err.response.status, "==", err.response.statusText)
            } else {
                console.log("get balance err : ", err);
            }
            reject({ error: true });
        })
    });
}

function withdrawBTCFromWallet(url, username, password, userid, wallet_dest_add, withdrawAmount, method, coinname) {
    // console.log("url--", url, "--username--", username, "--password--", password, "--userid--", userid, "--wallet_dest_add--", wallet_dest_add, "--withdrawAmount--", withdrawAmount, "--method--", method, "--coinname--", coinname)
    url = url + "/wallet/" + userid
    return new Promise((resolve, reject) => {
        axios({
            method: 'post',
            url,
            data: {
                "method": method,
                "params": [
                    wallet_dest_add,
                    withdrawAmount,
                ]
            },
            auth: { username, password }
        }).then(response => {
            // console.log("Send BTC from one account to another account : ", response.data);
            if (!response.data.error) {
                resolve(response.data)
            } else {
                reject();
                return;
            }
        }).catch(err => {
            if (err.response && err.response.status) {
                console.log("Send BTC err with status : ", err.response.status, err.response.statusText, err)
            } else {
                console.log("get wallet address err : ", err);
            }
            reject({ error: true });
        })
    });

}

function getAllUserWalletAddress(cb) {
    allAddress = []
    userModel.find({}).select("publicAddress").then(function (response) {
        allAddress = response.map(a => a.publicAddress).filter((el) => {
            return el != ''
        })
        // console.log("Alladdress---->",allAddress)
    }).catch(err => {
        console.log("Error in get all address :", err)
    })
}

module.exports = { decrypt, encrypt, getNewAddress, getTransaction, decodeRawTransaction, storeDepositeTransaction, getBlock, getReceivedByAddress, getNewWallet, getPrivateKey, withdrawBTCFromWallet, getAllUserWalletAddress };
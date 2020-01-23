"use strict";
const express = require("express");
const router = express.Router();
const axios = require("axios");
const { body, validationResult } = require("express-validator/check");
const func = require("../common/common");
const async = require("async")
const auth = require('../services/general').func();
const userModel = require('../models/user');
const userTransactionModel = require('../models/user_transaction');
// var moment = require('moment');

//Get new bitcoin wallet address if not available
router.post("/getNewAddress", auth.verifyToken, async (req, res) => {
    var user_id = req.user_id
    let url = process.env.BIT_DEAMON_URL;
    let username = process.env.BIT_USERNAME;
    let password = process.env.BIT_PASSWORD;
    let newAddress = process.env.BIT_NEWADDRESS;
    let createWalelt = process.env.BIT_CREATEWALLET;
    let getPrivateKey = process.env.BIT_GET_PRIVATEKEY;
    let coinname = process.env.BIT_COINNAME

    userModel.getUsersById(user_id, (err, user_result) => {
        if (err) {
            console.log("Error in get user : ", err)
            res.json({ status: 0, message: "Failed" })
        } else {
            if (user_result.length > 0) {
                if (user_result[0].publicAddress) {
                    res.json({ status: 0, message: "Wallet already created", address: user_result[0].publicAddress });
                } else {
                    //for Get New BTC Wallet Address
                    func["getNewWallet"](url, username, password, user_id, createWalelt, coinname).then(resCreateWallet => {
                        if (!resCreateWallet.error) {
                            func["getNewAddress"](url, username, password, user_id, newAddress, coinname).then(resGetAdd => {
                                if (!resGetAdd.error) {
                                    var newWalletAdd = resGetAdd.result;
                                    func["getPrivateKey"](url, username, password, user_id, getPrivateKey, coinname, newWalletAdd).then(resGetPriv => {
                                        // var privateKey = func["encrypt"](resGetPriv.result)
                                        if (!resGetPriv.error) {
                                            var data = {
                                                publicAddress: newWalletAdd
                                            }
                                            userModel.updateUserPublicAddress(user_id, data, (err, profile_result) => {
                                                if (err) {
                                                    res.json({ status: 0, message: "Something went wrong to store wallet address." });
                                                } else {
                                                    let send_data = {
                                                        wallet: newWalletAdd,
                                                        privateKey: resGetPriv.result
                                                    }
                                                    res.json({ status: 1, data: send_data, message: "Success" });
                                                    func.getAllUserWalletAddress()
                                                }

                                            })
                                        } else {
                                            res.json({ status: 0, data: resGetPriv, message: "Something went wrong in getting private key" });
                                        }
                                    }).catch(error => {
                                        console.log("Error in get private key : ", error);
                                        res.json({ status: 0, error, message: "Something went wrong in getting private key" });
                                    });
                                } else {
                                    res.json({ status: 0, data: resGetAdd, message: "Something went wrong in getting address" });
                                }
                            }).catch(error => {
                                console.log("Error in get new address : ", error);
                                res.json({ status: 0, error, message: "Something went wrong in getting wallet address" });
                            });
                        } else {
                            res.json({ status: 0, data: resCreateWallet, message: "Something went wrong in creating new wallet" });
                        }
                    }).catch(error => {
                        console.log("Error in create wallet : ", error);
                        res.json({ status: 0, error, message: "Something went wrong in createing new wallet" });
                    });
                }
            } else {
                res.json({ status: 0, message: "Account not found." })
            }
        }
    })
})

//for get BTC wallet balance withdrawalBalance
router.post("/getBTCWalletBalance", auth.verifyToken, (req, res) => {
    // console.log("Post------>", req.body)
    let coinname = process.env.BIT_COINNAME;
    let userid = req.user_id;
    let url = process.env.BIT_DEAMON_URL;
    let username = process.env.BIT_USERNAME;
    let password = process.env.BIT_PASSWORD;
    let param = process.env.BIT_GET_BALANCE

    userModel.getUsersById(userid, (err, user_result) => {
        if (err) {
            console.log("Error in get user : ", err)
            res.json({ status: 0, message: "Failed" })
        } else {
            if (user_result.length > 0) {
                if (user_result[0].publicAddress) {
                    //call method
                    func["getReceivedByAddress"](url, username, password, userid, user_result[0].publicAddress, param, coinname).then(bal_response => {
                        console.log("response : ", bal_response);
                        if (!bal_response.error) {
                            var balance = bal_response.result
                            res.json({ status: 1, data: balance, message: "Success" })
                        } else {
                            res.json({ status: 0, data: bal_response, message: "Something went wrong" });
                        }
                    }).catch(error => {
                        console.log("error : ", error);
                        res.json({ status: 0, message: "Error in get balance" });
                    });
                } else {
                    res.json({ status: 0, message: "Wallet not found" });
                }
            } else {
                res.json({ status: 0, message: "User not found" });
            }
        }
    })
})

//Export Private Key
router.post('/export_wallet_privatekey', auth.verifyToken, function (req, res) {
    var user_id = req.user_id
    let url = process.env.BIT_DEAMON_URL;
    let username = process.env.BIT_USERNAME;
    let password = process.env.BIT_PASSWORD;
    let getPrivateKey = process.env.BIT_GET_PRIVATEKEY;
    let coinname = process.env.BIT_COINNAME

    userModel.getUsersById(user_id, (err, user_result) => {
        if (err) {
            console.log("Error in get user : ", err)
            res.json({ status: 0, message: "Failed" })
        } else {
            if (user_result.length > 0) {
                if (user_result[0].publicAddress) {
                    //for Get New BTC Wallet Address
                    func["getPrivateKey"](url, username, password, user_id, getPrivateKey, coinname, user_result[0].publicAddress).then(resGetPriv => {
                        // var privateKey = func["encrypt"](resGetPriv.result)
                        if (!resGetPriv.error) {
                            var data = {
                                privateKey: resGetPriv.result
                            }
                            res.json({ status: 1, data: data, message: "Success" });
                        } else {
                            res.json({ status: 0, data: resGetPriv, message: "Something went wrong in getting private key" });
                        }
                    }).catch(error => {
                        console.log("Error in get private key : ", error);
                        res.json({ status: 0, error, message: "Something went wrong in getting private key" });
                    });
                } else {
                    res.json({ status: 0, message: "Wallet not found" });
                }
            } else {
                res.json({ status: 0, message: "Account not found." })
            }
        }
    })
})

//For withdraw/send BTC
router.post("/withdrawalBalance", auth.verifyToken, (req, res) => {
    var post = req.body;
    var dest_address = post.dest_address
    var withdrawAmount = parseFloat(post.withdrawAmount)
    let coinname = process.env.BIT_COINNAME;
    let userid = req.user_id;
    let url = process.env.BIT_DEAMON_URL;
    let username = process.env.BIT_USERNAME;
    let password = process.env.BIT_PASSWORD;
    let param = process.env.BIT_GET_BALANCE
    let withdrawParam = process.env.BIT_WITHDRAW

    userModel.getUsersById(userid, (err, user_result) => {
        if (err) {
            console.log("Error in get user : ", err)
            res.json({ status: 0, message: "Failed" })
        } else {
            if (user_result.length > 0) {
                if (user_result[0].publicAddress) {
                    //call method
                    func["getReceivedByAddress"](url, username, password, userid, user_result[0].publicAddress, param, coinname).then(bal_response => {
                        // console.log("response : ", bal_response);
                        if (!bal_response.error) {
                            var balance = bal_response.result
                            if (balance < withdrawAmount) {
                                res.json({ status: 2, message: "Withdraw amount is higher then wallet balance" })
                            } else {
                                func["withdrawBTCFromWallet"](url, username, password, userid, dest_address, withdrawAmount, withdrawParam, coinname).then(send_resp => {
                                    let transaction = new userTransactionModel({
                                        user_id: userid,
                                        user_wallet_address: user_result[0].publicAddress,
                                        dest_wallet_address: dest_address,
                                        transaction_hash: send_resp.result,
                                        amount: withdrawAmount,
                                        trans_type: "Withdraw"
                                    });
                                    userTransactionModel.addNewTransaction(transaction, (err, result) => {
                                        if (err) {
                                            console.log("Error in add data", err)
                                            res.json({ "status": 0, message: "Error in store transaction data in database" })
                                        } else {
                                            // res.json({ "status": 1, message: "Token successfully transfered", data: transfer_result })
                                            res.json({ status: 1, data: send_resp.result, message: "Bitcoin successfully transferred " });
                                        }
                                    })
                                }).catch((error) => {
                                    console.log("Error : ", error)
                                    res.json({ status: 0, message: "Error in get balance" });
                                })
                            }
                        } else {
                            res.json({ status: 0, message: "Error in get wallet balance." })
                        }
                    }).catch(error => {
                        console.log("Error in gettting admin wallet : ", error)
                        res.json({ status: 0, data: bal_response, message: "Something went wrong" });
                    })
                } else {
                    res.json({ status: 0, message: "User wallet address not found." })
                }
            } else {
                res.json({ status: 0, message: "User not found." })
            }
        }
    });
});

router.get("/block/notify/BTC/:blockid", async (req, res) => {
    var blockid = req.params.blockid;
    var data = await getBlock("BTC", req.params.blockid)
    if (data.status == 0) {
        return false;
    }
    var block = data.data.result;
    var block_number = block.height;
    // console.log("block_number : ", block_number);
    // console.log("Transaction in block   : ", data.data.result.tx)
    if (data.data.result.tx.length > 0) {
        async.forEach(data.data.result.tx, (txid, callback) => {
            // console.log("txid======>", txid, "\n\n")
            getTransaction(txid).then(result => {
                // console.log("result---->", result)
                if (result.status == 1) {
                    getDecodeRawTransaction(result.data.result).then(result => {
                        // console.log("result---->", result)
                        if (result.status == 1) {
                            let allAddress = []
                            async.forEach(result.data.result.vout, (vout, cb) => {
                                // console.log("VOUT----->",vout)
                                if (vout.scriptPubKey.addresses) {
                                    allAddress.push({[vout.scriptPubKey.addresses] : vout.value})
                                    cb()
                                } else {
                                    cb()
                                }
                            }, function (err) {
                                if (err) {
                                    callback()
                                    console.log("err : ", err);
                                    throw err;
                                } else {
                                    var data = {
                                        tx : result.data.result,
                                        allAddress : allAddress
                                    }
                                    storeDepositeTransaction(data)
                                    callback()
                                }
                            })
                        } else {
                            callback()
                        }
                    }).catch(err => {
                        callback()
                        console.log("Error in decode transaction : ", err)
                    })
                } else {
                    callback()
                }
            }).catch(err => {
                console.log("Error in get transaction : ", err)
                callback()
            })
        }, function (err) {
            if (err) {
                console.log("err : ", err);
                throw err;
            } else {
                console.log("Success")
            }
        })
    } else {
        console.log("No transaction found")
    }

});

function getBlock(coinname, blockid) {
    return new Promise((resolve, reject) => {

        let url = process.env.BIT_DEAMON_URL;
        let username = process.env.BIT_USERNAME;
        let password = process.env.BIT_PASSWORD;
        let method = process.env.BIT_GET_BLOCK;

        //call method
        func["getBlock"](url, username, password, blockid, coinname, method).then(response => {
            // console.log("response : ", response);
            if (!response.error) {
                resolve({ status: 1, data: response });
            } else {
                resolve({ status: 0, data: response });
            }
        }).catch(error => {
            console.log("error : ", error);
            resolve({ status: 0, error });
        });
    })
}

function getTransaction(txid) {
    return new Promise((resolve, reject) => {

        let url = process.env.BIT_DEAMON_URL;
        let username = process.env.BIT_USERNAME;
        let password = process.env.BIT_PASSWORD;
        let coinname = process.env.BIT_COINNAME
        let method = process.env.BIT_GET_TRANSACTION

        //call method
        func["getTransaction"](url, username, password, txid, coinname, method).then(response => {
            // console.log("response : ", response);
            if (!response.error) {
                resolve({ status: 1, data: response });
            } else {
                resolve({ status: 0, data: response });
            }
        }).catch(error => {
            console.log("error : ", error);
            resolve({ status: 0, error });
        });
    })
}

function getDecodeRawTransaction(txhash) {
    return new Promise((resolve, reject) => {

        let url = process.env.BIT_DEAMON_URL;
        let username = process.env.BIT_USERNAME;
        let password = process.env.BIT_PASSWORD;
        let coinname = process.env.BIT_COINNAME
        let method = process.env.BIT_DECODE_RAW_TRANSACTION

        //call method
        func["decodeRawTransaction"](url, username, password, txhash, coinname, method).then(response => {
            // console.log("response : ", response);
            if (!response.error) {
                resolve({ status: 1, data: response });
            } else {
                resolve({ status: 0, data: response });
            }
        }).catch(error => {
            console.log("error : ", error);
            resolve({ status: 0, error });
        });
    })
}

function storeDepositeTransaction(data) {
    return new Promise((resolve, reject) => {

        //call method
        func["storeDepositeTransaction"](data).then(response => {
            // console.log("response : ", response);
            if (!response.error) {
                resolve({ status: 1, data: response });
            } else {
                resolve({ status: 0, data: response });
            }
        }).catch(error => {
            console.log("error : ", error);
            resolve({ status: 0, error });
        });
    })
}

module.exports = router;
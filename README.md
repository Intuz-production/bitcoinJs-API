# bitcoinJs-API
Integrate Bitcoin in your Application seamlessly with ready made API


Technology Stack: 

    • Node (10.15.1)
    • MongoDb

Prerequisites:

    • Bitcoin daemon :
        Used for interaction with testnet/mainnet.
    • Bitcoin Full Node:
        You check how to setup Bitcoin Node here - https://github.com/bitcoin/bitcoin/blob/master/doc/build-unix.md

NPM Dependencies:

These dependencies will be installed by default using *npm i* command by navigating inside project directory

    • Swagger :
        Swagger is used for API documentation for users, teams, and enterprises.


Deployment instructions:

Upload code on the server and run below command:
    
    npm i
    
After all node_modules are installed, run below command to start application:


    npm run start - 
This will start application in development mode. You can refer to.ENV to setup a new environment as per your requirement.

To run the application inside PM2 container, install PM2 first and then run below command: 

    pm2 start npm -- run start 
     
How to setup local Bitcoin environment : 

- After setting up Bitcoin daemon open bitcoin.conf file and set following:

      rpcuser=<set your rpc user here>
      rpcpassword=<use a strong password here>
      txindex=1
      testnet=0 (use 1 to switch to testnest)
      rpcallowip=<IP address of the node app> 
      blocknotify=curl http://<node application IP address here>:5001/block/notify/BTC/%s'
  
    
Now store this rpcuser and password in .ENV file to execute all the RPC function. Txindex is set as 1 because we will need notification of every new block to check transaction of our wallet. If txindex is set to 0, the API will not receive new incoming transcation for wallets. 

API Path:

Once you have successfully installed node modules and deployed the app on server, you can navigate to below path to view all API documentation using Swagger. 

    • http://localhost:5001/api-calls/

Please note: 

- If you have setup the project on cloud, replace localhost with the IP address of your host.
- In bitcoin blockchain, all the functions are predefined in JSON-RPC, and we use only those functions that defined in RPC.
- Function name are stored in .ENV file which is used in this demo. You can add new feature by adding new RPC calls to the .ENV files, but you may need to add logic to execute new features. 

Functionality

    • **File** : common.js

        In this file, store all the functions related to bitcoin blockchain interaction.

        **getNewWallet** : This function is used to create a new wallet in the blockchain.
            - We used multi-wallet functionality in this demo.
            - Using multi-wallet functionality, we create a separate wallet for every user.

        **getNewAddress** : This function is used get new address for the created wallet from the blockchain.

        **getPrivateKey** : This function is used get private key of the wallet from the blockchain.

        **getBlock** : This function is used get new block details from the blockchain.

        **getTransaction** : This function is used get new transaction details inside new block from the blockchain.

        **decodeRawTransaction** : This function is used decode new rawatransaction and get details of the transaction in redable format from the blockchain.

        **storeDepositeTransaction** : This function is used to store transactions in the database if the wallet address matched with the transaction address.

        **getReceivedByAddress** : This function is used to get wallet balance of the user from blockchain.

        **withdrawBTCFromWallet** : This function is used to transfer bitcoin from user wallet to destination wallet address from blockchain.

        **getAllUserWalletAddress** : This function is used to get all user wallet public address for the compare with addresses of the transaction and if match found then store transaction in the database.

API End-Point

    • /register
        - Register new users in the system and store email and password in the database.
        - Params : Email, Password
         
    • /login
        - Login existing users into the system and get token in response.
        - A token is used for authentication in all API.
        - Params : Email, Password

    • /getNewAddress
        - Create a new wallet address for the user and send public address, private key user.
        - Params : User id(Get from token).

    • /withdrawalBalance
        - It is used to transfer bitcoin from user wallet to destination wallet using blockchain. In this function, we get the amount and destination wallet address from the user and send using the predefined function of the bitcoin JSON-RPC - "sendtoaddress".
        - Params : Dest Address, Amount.

    •  /getBTCWalletBalance
        - It is used to get the balance of the user wallet from the blockchain.
        - Params:  Token

    • /export_wallet_privatekey
        - It is used to export the private key of the wallet from the blockchain.
        - Params : Token

Example

    • Call /getNewAddress API and pass token in headers.
    • Response : {
        "status": 1,
        "data": {
            "wallet": "2N9JboygNJMEdXMMwz6KQsPYa3VuyVmUyp4",
            "privateKey": "cVZFJYuhiiiXJVmzrdmGdszTz8Y7dpMeWadeXHxTpMNbH9FCmY5t"
            },
        "message": "Success"
        }
    • If error then response :
        {
            "status": "0",
            "message": "Print error",
            "data": "Response data if require"
        }
    }

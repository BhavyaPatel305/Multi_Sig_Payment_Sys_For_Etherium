# Multi_Signature_Payment_System_For_Etherium

This is a fourth-year university group project repository. In this project, we attempt to deliver a multi-signature Ethereum wallet that produces a compact signature for storing on the blockchain, as well as consuming less gas to validate and execute transactions. We did not need to know anything about blockchain or Web3 before starting as the professor gave us lectures going over the fundamentals. All we needed was a passion for learning.

**Contributors:**
1. Alicia Bashura
2. Bhavya Patel
3. Shubham Mehta

**Steps to deploy:**

1. Download the repository locally.

2. In `app.js` file make the following changes:
   - Make an account on ETHERSCAN.
   - Create a new API.
   - GET API key and URL and copy paste in `app.js`.
   - Connect to MongoDB (replace `'mongodb_connection_string'` with your actual connection string).

3. Download Ganache and do the following:
   - Create a new workspace.

4. Open Remix and do the following to connect Ganache and Remix:
   - Open Remix in your browser.
   - Go to the "Deploy & Run Transactions" tab on the left sidebar.
   - Under the "Environment" section, select "Web3 Provider" from the dropdown menu.
   - Paste your Ganache RPC URL in the input field labeled "Web3 Provider Endpoint."
   - Click on the "OK" button to apply the changes.

   After specifying the Ganache RPC URL, Remix will connect to your Ganache instance, and you can deploy and interact with your smart contracts using Remix.

5. Deploy the `MultiSig.sol` contract from the contracts folder on Ganache using remix.

6. Once the contract is successfully deployed, copy paste the contract ABI and contract address into `script.js`.

7. Copy paste the RPC server address into `script.js`.

**To run:**

1. Open MongoDB and connect to the MongoDB deployment (basically the URL used).

2. Once MongoDB is connected, open Ganache and open the workspace.

3. In terminal, go to the following: `..\Multi_Sig_Payment_Sys_For_Etherium\frontendPart`.

4. Type in `node app.js`, and it should open the browser with the frontend code running.

**To use frontend:**
Refer to the video: [link](https://github.com/BhavyaPatel305/Multi_Sig_Payment_Sys_For_Etherium/assets/93842768/f4c780bd-34c3-4268-bb50-ba691f0ca350).

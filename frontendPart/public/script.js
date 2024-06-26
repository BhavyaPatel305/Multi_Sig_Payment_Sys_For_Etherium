console.log('Script loaded and executed!');
document.addEventListener("DOMContentLoaded", async function () {
    const { ethers } = window;
    const navLinks = document.querySelector('.nav-links');
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const createTransactionButton = document.getElementById('createTransactionButton');
    const submitTransactionButton = document.getElementById('submitTransaction');
    const recipientAddressInput = document.getElementById('recipientAddress');
    const ethAmountInput = document.getElementById('ethAmount');
    const numPeopleSelect = document.getElementById('numPeople');
    let provider;
    let publicAddress;

    const EC = elliptic.ec;
    const ec = new EC('secp256k1');

    hamburgerMenu.addEventListener('click', function () {
        navLinks.classList.toggle('show');
    });

    if (window.ethereum) {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        try {
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            if (accounts.length > 0) {
                publicAddress = accounts[0];
            } else {
                console.error('No accounts found.');
                return;
            }
        } catch (error) {
            console.error('User denied account access:', error);
            return;
        }
    } else {
        console.error('MetaMask is not installed.');
        return;
    }

    const publicAddressElement = document.getElementById('publicAddress');
    const currentBalanceElement = document.getElementById('currentBalance');

    async function updateUI() {
        publicAddressElement.textContent = publicAddress;
        const balance = await provider.getBalance(publicAddress);
        const formattedBalance = ethers.utils.formatEther(balance);
        currentBalanceElement.textContent = `${formattedBalance} ETH`;
    }

    function generateFields(numPeople) {
        const form = document.querySelector('.transaction-form');
        form.innerHTML = ''; // Clear the form

        for (let i = 0; i < numPeople; i++) {
            const inputGroup = document.createElement('div');
            inputGroup.className = 'input-group';

            const label = document.createElement('label');
            label.htmlFor = `address${i}`;
            label.textContent = `Address ${i + 1}:`;

            const input = document.createElement('input');
            input.type = 'text';
            input.id = `address${i}`;
            input.placeholder = `Enter address ${i + 1}`;

            inputGroup.appendChild(label);
            inputGroup.appendChild(input);
            form.appendChild(inputGroup);
        }

        const saveAddressesButton = document.createElement('button');
        saveAddressesButton.textContent = 'Save Addresses';
        saveAddressesButton.addEventListener('click', saveAddresses);
        form.appendChild(saveAddressesButton);
    }

    // Contract ABI: Copy Paste Your Contract ABI Here
    const contractABI = [];
    const contractAddress = ""; // Your contract address here

    // Connect to the Ethereum network
    provider = new ethers.providers.JsonRpcProvider(""); // Use your RPC server address
    const signer = provider.getSigner();

    // Connect to the contract
    const contract = new ethers.Contract(contractAddress, contractABI, signer);


    // Fetch transaction data from database
    async function getPaymentData() {
        try {
            const response = await fetch('http://localhost:3000/transactions');
            if (!response.ok) {
                throw new Error('Failed to fetch data');
            }
            const transactions = await response.json();
            if (transactions.length === 0) {
                throw new Error('No transactions found');
            }
    
            // Use the latest transaction for payment data
            const latestTransaction = transactions[transactions.length - 1];
            const { recipient, amount } = latestTransaction.message;
            const pkx = latestTransaction.PKpoint[0]; // Assuming PKpoint is an array containing the pkx value
            const pky = latestTransaction.PKpoint[1]; // Assuming PKpoint is an array containing the pky value
            const xx = latestTransaction.Xpoint[0]; // Assuming Xpoint is an array containing the xx value
            const xy = latestTransaction.Xpoint[1]; // Assuming Xpoint is an array containing the xy value
            const z = latestTransaction.zbar; // Assuming zbar is the correct key for z
            
    
            // Assuming other values are already in string format
            const from = latestTransaction.PKaddress; // Sender's address
            const to = recipient; // Recipient's address
            const message = 1; // Message value
            
            
            console.log('Amount is, ', ethers.utils.parseEther(amount))
            const parsedAmount = ethers.utils.parseEther(amount);
            
            console.log("Working perfectly till here")
            const pkxBigNumber = ethers.BigNumber.from('0x' + pkx);
            const pkyBigNumber = ethers.BigNumber.from('0x' + pky);
            const xxBigNumber = ethers.BigNumber.from('0x' + xx);
            const xyBigNumber = ethers.BigNumber.from('0x' + xy);
            const zBigNumber = ethers.BigNumber.from('0x' + z);


            console.log("pkxBIgNumber:, ", pkxBigNumber)
            console.log("pkyBigNumber:, ", pkyBigNumber)
            console.log("xxBigNumber:, ", xxBigNumber)
            console.log("xyBigNumber:, ", xyBigNumber)
            console.log("zBigNumber:, ", zBigNumber)


            
            return {
                from,
                amount: parsedAmount,
                to,
                pkx: pkxBigNumber,
                pky: pkyBigNumber,
                xx: xxBigNumber,
                xy: xyBigNumber,
                z: zBigNumber,
                message
            };
        } catch (err) {
            console.error(err);
        }
    }

    
    // Function to call the pay function
    async function makePayment() {
        try {
            // Get the payment data
            const paymentData = await getPaymentData();
            console.log("Payment data:", paymentData);
            // Call the pay function on the contract
            const tx1 = await contract.recvPay(paymentData.from, { value: paymentData.amount });
            const tx = await contract.pay(paymentData.from, paymentData.amount, paymentData.to, paymentData.pkx, paymentData.pky, paymentData.xx, paymentData.xy, paymentData.z, { gasLimit: 3000000 });
            console.log("Transaction hash:", tx.hash);
            await tx1.wait();
            await tx.wait();
            console.log("Transaction confirmed");
            alert("Transaction Successful")
        } catch (error) {
            console.error("Error making payment:", error);
        }
    }


    async function sha256(message) {
        // Convert the message to a Uint8Array
        const msgBuffer = new TextEncoder().encode(message);

        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    async function validateXis(transactionId) {
        fetch(`/api/transactions/${transactionId}/validateXi`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    transactionId: transactionId
                })
            })
            .then(response => {
                if (!response.ok) throw new Error('Failed to validate Xi\'s');
                return response.json();
            })
            .then(result => {
                alert(result.message); // Show a success message
            })
            .catch(error => {
                console.error('Error validating Xi\'s:', error);
                alert('Error validating Xi\'s: ' + error.message); // Show an error message
            });
    }

    async function verifyPrivateKeyAndReturnPublicKey(privateKey, metamaskAddress) {
        try {
            // Ensure privateKey has the correct format (0x prefix)
            if (!privateKey.startsWith('0x')) {
                privateKey = '0x' + privateKey;
            }

            // Create a new Wallet instance using the private key
            const wallet = new ethers.Wallet(privateKey);

            // Verify the address generated from the private key matches the MetaMask address
            const isValid = wallet.address.toLowerCase() === metamaskAddress.toLowerCase();

            // Extract the public key; note that Ethers.js provides the public key in uncompressed format
            const publicKey = wallet.publicKey;

            return {
                isValid,
                publicKey
            };
        } catch (error) {
            console.error('Error verifying private key and extracting public key:', error);
            return {
                isValid: false,
                publicKey: null
            };
        }
    }

    async function generateAndSubmitHashXiPki(transactionId, containerElement) {
        // Generate xi and Xi
        const xiKeyPair = ec.genKeyPair();
        const xi = xiKeyPair.getPrivate();
        const Xi = ec.g.mul(xi);
        const XiHex = Xi.encode('hex');

        const siKeyPair = ec.genKeyPair();
        const si = siKeyPair.getPrivate();
        const pk = siKeyPair.getPublic();
        const pkHex = siKeyPair.getPublic().encode('hex');

        const metaSi = prompt("Enter MetaMask Private Key:");
        let {
            isValid,
            publicKey
        } = await verifyPrivateKeyAndReturnPublicKey(metaSi, publicAddress);
        if (isValid) {
            console.log(`Public Key: ${publicKey.slice(2)}`);
        } else {
            console.error('The private key does not match the MetaMask address or an error occurred in generateAndSubmitHashXiPki.');
            return;
        }
        const pkiPoint = ec.curve.decodePoint(publicKey.slice(2), 'hex');
        const XiPoint = ec.curve.decodePoint(XiHex, 'hex');

        const pkiX = '0x' + pkiPoint.getX().toString(16);
        const pkiY = '0x' + pkiPoint.getY().toString(16);
        const xiX = '0x' + XiPoint.getX().toString(16);
        const xiY = '0x' + XiPoint.getY().toString(16);

        const concatenated = ethers.utils.solidityPack(
            ["uint256", "uint256", "uint256", "uint256"],
            [xiX, xiY, pkiX, pkiY]
        );

        const hashXiPki = ethers.utils.keccak256(concatenated);

        fetch(`/api/transactions/${transactionId}/submitParticipantData`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    publicKey: publicAddress, // Ethereum address
                    ecPublicKey: publicKey.slice(2), // Elliptic curve public key as a string
                    Xi: [XiHex],
                    hashXiPki: hashXiPki,
                }),
            })
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok.');
                return response.json();
            })
            .then(data => {
                console.log("Participant hashXiPki and public key submitted successfully:", data);
                const keys = `Transaction ID: ${transactionId}\nPrivate nonce (xi): ${xi.toString(16)}`;

                // Create a button for user to click to copy keys
                const copyButton = document.createElement("button");
                copyButton.textContent = "Copy Keys to Clipboard";
                copyButton.className = 'copy-keys-button'; // Add class for styling

                // Append the button to the specified container element
                containerElement.appendChild(copyButton);

                copyButton.addEventListener('click', () => {
                    navigator.clipboard.writeText(keys).then(() => {
                        alert('Private nonce (xi) has been copied to your clipboard.');
                        copyButton.remove();
                    }, (err) => {
                        console.error('Could not copy keys to clipboard: ', err);
                    });
                });
            })
            .catch(error => console.error('Error submitting participant data:', error));
    }

    async function saveAddresses() {
        const addresses = Array.from(document.querySelectorAll('.transaction-form input[type="text"]')).map(input => input.value);
        const transactionMessage = {
            recipient: recipientAddressInput.value,
            amount: ethAmountInput.value,
            counter: 0
        };

        const participantData = addresses.map(address => ({
            publicKey: address,
            ecPublicKey: "",
            Xi: [],
            hashXiPki: "",
            zi: ""
        }));

        const filteredParticipantData = participantData.filter(participant => participant.publicKey !== publicAddress);

        fetch('/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: transactionMessage,
                    participantAddresses: addresses,
                    initiatorAddress: publicAddress,
                    PK: "",
                    pkbar: [],
                    Xbar: [],
                    c: "",
                    zbar: "",
                    round1: {
                        initiator: {
                            publicKey: publicAddress, // Ethereum address
                            ecPublicKey: "", // Elliptic curve public key
                            Xi: [],
                            hashXiPki: "",
                            zi: "" // Placeholder for zi
                        },
                        participants: filteredParticipantData
                    },
                }),
            })
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok.');
                return response.json();
            })
            .then(result => {
                console.log("Transaction saved:", result);
                window.location.href = 'transaction-status.html';
            })
            .catch(error => console.error('Error saving addresses and Round 1 data:', error));

    }

    async function fetchAndDisplayTransactions() {
        try {
            const response = await fetch(`/api/transactions/${publicAddress}`);
            if (!response.ok) throw new Error('Failed to fetch transactions');

            const transactions = await response.json();
            const transactionsContainer = document.getElementById('transactionsContainer');
            transactionsContainer.innerHTML = '';

            transactions.forEach(transaction => {
                const transactionElement = document.createElement('div');
                transactionElement.classList.add('transaction');

                let participantDetailsHtml = `<ul class="participant-details">`;
                transaction.round1.participants.forEach(participant => {
                    participantDetailsHtml += `<li>
                    Public Address: ${participant.publicKey}<br>
                    EC Public Key: ${participant.ecPublicKey || 'Not yet provided'}<br>`;
                    if (transaction.round1Complete) {
                        participantDetailsHtml += `Xi: <span class="hash-xi-details">${participant.Xi.join(', ')}</span><br>
                    hashXiPki: <span class="hash-xi-details">${participant.hashXiPki || 'Not yet submitted'}</span>`;
                    } else {
                        participantDetailsHtml += `hashXiPki: <span class="hash-xi-details">${participant.hashXiPki || 'Not yet submitted'}</span>`;
                    }
                    participantDetailsHtml += `</li>`;
                });
                participantDetailsHtml += `</ul>`;

                // Adding initiator's Xi if round 1 is complete and their EC Public Key
                let initiatorXiHtml = '';
                let validateButton = '';
                if (transaction.round1Complete) {
                    initiatorXiHtml = `<p><strong>Initiator EC Public Key:</strong> ${transaction.round1.initiator.ecPublicKey || 'Not yet provided'}</p>
                    <p><strong>Initiator Xi:</strong> ${transaction.round1.initiator.Xi.join(', ')}</p>`;
                    validateButton = `<button class="validate-xi-button" data-transaction-id="${transaction._id}">Validate Xi's</button>`
                }

                const messageDetailsHtml = `
                <p><strong>Recipient Address:</strong> ${transaction.message.recipient}</p>
                <p class="pk-details"><strong>PK (Concatenated Public Keys):</strong> ${transaction.PK}</p>
                `;

                const isInitiator = transaction.initiatorAddress === publicAddress;
                const round3Complete = transaction.round3Complete;

                let aggregateZiButton = '';
                if (isInitiator && round3Complete) {
                    aggregateZiButton = `<button class="aggregate-zi-button" data-transaction-id="${transaction._id}">Aggregate zi</button>`;
                }

                transactionElement.innerHTML = `
            <p><strong>Transaction ID:</strong> ${transaction._id.toString()}</p>
            <div class="details">
            ${messageDetailsHtml}
            <p><strong>Amount:</strong> ${transaction.message.amount} ETH </p>
                <p><strong>Initiator:</strong> ${transaction.initiatorAddress}</p>
                ${initiatorXiHtml}
                <p><strong>Initiator hashXiPki:</strong> ${transaction.round1.initiator.hashXiPki}</p>
                <p><strong>Participants:</strong> ${transaction.participantAddresses.join(', ')}</p>
                ${participantDetailsHtml}
                <button class="update-hash-button" data-transaction-id="${transaction._id}">Generate & Submit My hashXiPki</button>
                ${validateButton}
                ${aggregateZiButton}
            </div>`;

                if (aggregateZiButton) {
                    transactionElement.querySelector('.aggregate-zi-button').addEventListener('click', async function () {
                        await calculateAndSubmitZbarClient(this.getAttribute('data-transaction-id')).catch(console.error);
                        await verifySignature(this.getAttribute('data-transaction-id')).catch(console.error);
                        await makePayment();
                    });
                }

                transactionElement.querySelector('.update-hash-button').addEventListener('click', async function () {
                    const transactionId = this.getAttribute('data-transaction-id');
                    await generateAndSubmitHashXiPki(transactionId, transactionElement);
                });

                const validateButtonElement = transactionElement.querySelector('.validate-xi-button');
                if (validateButtonElement) {
                    validateButtonElement.addEventListener('click', async function () {
                        const transactionId = this.getAttribute('data-transaction-id');

                        await validateXis(transactionId);
                        await calculateAndSubmitPkbarXbar(transactionId);
                        await calculateAndSubmitZi(transactionId);
                    });
                }

                transactionElement.addEventListener('click', function () {
                    this.classList.toggle('expanded');
                });

                transactionsContainer.appendChild(transactionElement);
            });

        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    }


    async function fetchTransactionData(transactionId) {
        const response = await fetch(`/api/transactions/get/${transactionId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch transaction data');
        }
        const transaction = await response.json();
        return transaction;
    }

    async function calculatePkBar(participants, PK) {
        const EC = elliptic.ec;
        const ec = new EC('secp256k1');

        let pkbar = ec.curve.g.mul(0);

        for (let participantPublicKey of participants) {
            const pkiPoint = ec.keyFromPublic(participantPublicKey, 'hex').getPublic();
            const pkiX = '0x' + pkiPoint.getX().toString(16);
            const pkiY = '0x' + pkiPoint.getY().toString(16);
            const concatenated = ethers.utils.solidityPack(
                ["uint256", "uint256", "bytes"],
                [pkiX, pkiY, PK]
            );
            const hash = ethers.utils.keccak256(concatenated);
            const hashInt = new BN(hash.slice(2), 16); // Convert hash to a big number
            try {
                const participantPoint = ec.curve.decodePoint(participantPublicKey, 'hex'); // Directly decode the point from hex
                const hashTimesParticipant = participantPoint.mul(hashInt); // Multiply
                pkbar = pkbar.add(hashTimesParticipant); // Add to the total
            } catch (error) {
                console.error("Error decoding public key or performing elliptic curve operations:", participantPublicKey, error);
                return null;
            }
        }
        return pkbar.encode('hex'); // Return pkbar as hex string, uncompressed by default
    }

    async function calculateXbar(participants, PK, transaction) {
        const EC = elliptic.ec;
        const ec = new EC('secp256k1');

        let Xbar = ec.curve.g.mul(0);

        // Include initiator in the participants list for the calculation
        const allParticipants = [{
            ecPublicKey: transaction.round1.initiator.ecPublicKey,
            Xi: transaction.round1.initiator.Xi[0]
        }].concat(
            transaction.round1.participants.map(participant => ({
                ecPublicKey: participant.ecPublicKey,
                Xi: participant.Xi[0]
            }))
        );

        for (let {
                ecPublicKey,
                Xi
            } of allParticipants) {
            const pkiPoint = ec.keyFromPublic(ecPublicKey, 'hex').getPublic();
            const pkiX = '0x' + pkiPoint.getX().toString(16);
            const pkiY = '0x' + pkiPoint.getY().toString(16);
            const concatenated = ethers.utils.solidityPack(
                ["uint256", "uint256", "bytes"],
                [pkiX, pkiY, PK]
            );
            const hash = ethers.utils.keccak256(concatenated);
            const hashInt = new BN(hash.slice(2), 16); // Convert hash to integer using BigNumber

            // Decode Xi from the hex-encoded string
            try {
                const XiPoint = ec.curve.decodePoint(Xi, 'hex'); // Directly decode the point from hex
                const hashTimesXi = XiPoint.mul(hashInt); // Multiply hash value with Xi point
                Xbar = Xbar.add(hashTimesXi); // Add to the running total
            } catch (error) {
                console.error("Error decoding Xi or performing elliptic curve operations:", Xi, error);
                return null;
            }
        }
        return Xbar.encode('hex'); // Return Xbar as hex string, uncompressed by default
    }



    async function getCount(address) {
        try {
            const count = await contract.getCount(address);
            console.log('Counter value:', count.toString());
            return count;
        } catch (error) {
            console.error('Error getting counter value:', error);
            throw error;
        }
    }

    function publicKeyToAddress(publicKey) {
        const address = ethers.utils.computeAddress(publicKey);
        return address.toLowerCase();
    }

    async function calculateAndSubmitPkbarXbar(transactionId) {
        const EC = elliptic.ec;
        const ec = new EC('secp256k1');

        const transaction = await fetchTransactionData(transactionId);
        const PK = transaction.PK;
        const participants = [transaction.round1.initiator.ecPublicKey, ...transaction.round1.participants.map(participant => participant.ecPublicKey)];

        const pkbar = await calculatePkBar(participants, PK);
        if (pkbar == null) {
            throw new Error('Failed to update transaction with pkbar and Xbar');
        }

        const pkbarWithPrefix = pkbar.startsWith('0x') ? pkbar : `0x${pkbar}`;
        const address = publicKeyToAddress(pkbarWithPrefix);
        const contractCount = await getCount(address);
        const contractCountNum = Number(contractCount.toString());

        const Xbar = await calculateXbar(participants, PK, transaction);
        if (Xbar == null) {
            throw new Error('Failed to update transaction with pkbar and Xbar');
        }

        const pkPoint = ec.curve.decodePoint(pkbar, 'hex');
        const xPoint = ec.curve.decodePoint(Xbar, 'hex');

        const pkBarX = '0x' + pkPoint.getX().toString(16);
        const pkBarY = '0x' + pkPoint.getY().toString(16);
        const xBarX = '0x' + xPoint.getX().toString(16);
        const xBarY = '0x' + xPoint.getY().toString(16);

        const recipient = transaction.message.recipient;
        const amount = ethers.utils.parseUnits(transaction.message.amount, 'ether');
        const counter = transaction.message.counter; // Ensure this is an integer
        const M = ethers.utils.solidityPack(
            ["address", "uint256", "uint256"],
            [recipient, amount, contractCountNum]
        );

        //abi.encodePacked(pkBar.x, pkBar.y, xBar.x, xBar.y, message)
        const inputForC = ethers.utils.solidityPack(
            ["uint256", "uint256", "uint256", "uint256", "bytes"],
            [pkBarX, pkBarY, xBarX, xBarY, M]
        );

        const c = ethers.utils.keccak256(inputForC);

        const updateResponse = await fetch(`/api/transactions/${transactionId}/updatePkbarXbarC`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                pkbar,
                Xbar,
                c,
                contractCountNum
            })
        })

        if (!updateResponse.ok) {
            throw new Error('Failed to update transaction with pkbar, Xbar, and c');
        } else {
            const successResponse = await updateResponse.json();
            console.log("Response message:", successResponse.message);
        }
    }

    function verifyPrivateKey(si, pkiHex) {
        // Generate the public key from the private key
        const generatedPublicKey = ec.g.mul(si); // si should be a BN instance
        const generatedPublicKeyHex = generatedPublicKey.encode('hex');

        // Compare the generated public key with the provided public key
        if (generatedPublicKeyHex === pkiHex) {
            console.log("The private key is valid and matches the public key.");
            return true;
        } else {
            console.error("The private key does not match the public key.");
            return false;
        }
    }

    async function verifyXi(transactionId, ethereumAddress, xiInput) {
        // Fetch transaction to get Xi for the address
        const transaction = await fetchTransactionData(transactionId);
        let XiStored;

        if (transaction.initiatorAddress === ethereumAddress) {
            XiStored = transaction.round1.initiator.Xi[0];
        } else {
            const participant = transaction.round1.participants.find(p => p.publicKey === ethereumAddress);
            XiStored = participant ? participant.Xi[0] : undefined;
        }

        if (!XiStored) {
            console.error('Xi not found for this user.');
            return false;
        }

        // Convert xiInput to a big number and generate Xi from it
        const XiGenerated = ec.g.mul(xiInput).encode('hex');

        // Compare generated Xi with stored Xi
        if (XiGenerated === XiStored) {
            console.log('xi is correct.');
            return true;
        } else {
            console.error('xi is incorrect.');
            return false;
        }
    }


    async function calculateAndSubmitZi(transactionId) {
        const q = ec.curve.n; // Order of the base point

        // Fetch transaction to get `c` and participant's public key
        const transaction = await fetchTransactionData(transactionId);

        let existingZi;
        if (transaction.initiatorAddress === publicAddress) {
            existingZi = transaction.round1.initiator.zi;
        } else {
            const participant = transaction.round1.participants.find(p => p.publicKey === publicAddress);
            existingZi = participant ? participant.zi : undefined;
        }
        if (existingZi) {
            console.log('zi value already submitted for this user.');
            return; // Exit the function if zi already exists
        }
        const hexString = transaction.c.startsWith('0x') ? transaction.c.slice(2) : transaction.c;
        const c = new BN(hexString, 16);

        // Find the participant's elliptic curve public key using their Ethereum address
        let participantEcPublicKey;
        if (transaction.initiatorAddress === publicAddress) {
            participantEcPublicKey = transaction.round1.initiator.ecPublicKey;
        } else {
            const participant = transaction.round1.participants.find(p => p.publicKey === publicAddress);
            if (participant) {
                participantEcPublicKey = participant.ecPublicKey;
            }
        }

        if (!participantEcPublicKey) {
            console.error('Could not find participant EC public key');
            return; // Exit if participant's EC public key is not found
        }

        // Prompt user for si and xi
        const xiInput = prompt("Please enter your private nonce (xi):");

        const siInput = prompt("Enter MetaMask Private Key:");


        if (!siInput || !xiInput) {
            console.error('Inputs are required');
            return; // Exit if inputs are not provided
        }

        let {
            isValid,
            publicKey
        } = await verifyPrivateKeyAndReturnPublicKey(siInput, publicAddress);
        if (isValid) {
            console.log('The private key matches the MetaMask address.');
            console.log(`Public Key: ${publicKey.slice(2)}`);
        } else {
            console.error('The private key does not match the MetaMask address or an error occurred in calculateAndSubmitZi.');
            return;
        }

        const si = new BN(siInput, 16);
        const xi = new BN(xiInput, 16);

        const xiValid = await verifyXi(transactionId, publicAddress, xi);

        if (!xiValid) {
            console.error('Invalid private nonce');
            return;
        }

        // Calculate zi = si * c + xi (mod q)
        const zi = si.mul(c).add(xi).mod(q);
        // Submit zi to the server along with the participant's Ethereum address
        const response = await fetch(`/api/transactions/${transactionId}/submitZi`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ethereumAddress: publicAddress,
                zi: zi.toString(16)
            })
        });

        if (!response.ok) {
            console.error('Failed to submit zi');
        } else {
            console.log('zi submitted successfully');
        }
    }

    if (createTransactionButton) {
        createTransactionButton.addEventListener('click', () => {
            window.location.href = './create-transaction.html';
        });
    }

    if (submitTransactionButton) {
        submitTransactionButton.addEventListener('click', async () => {
            const numPeople = parseInt(numPeopleSelect.value);
            generateFields(numPeople);

            const recipientAddress = recipientAddressInput.value;
            const ethAmount = ethAmountInput.value;

            if (parseFloat(ethAmount) > parseFloat(ethers.utils.formatEther(await provider.getBalance(publicAddress)))) {
                alert("Insufficient funds. Please enter a valid ETH amount.");
                return;
            }

            alert(`Transaction Details:\nRecipient Address: ${recipientAddress}\nETH Amount: ${ethAmount}\nNumber of People: ${numPeople}`);
        });
    }

    async function calculateAndSubmitZbarClient(transactionId) {
        try {
            // Trigger server-side calculation of zbar
            const response = await fetch(`/api/transactions/${transactionId}/calculateZbar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
            });

            if (!response.ok) {
                throw new Error('Failed to calculate or update zbar');
            }

            const data = await response.json();
            console.log('zbar calculated and saved successfully:', data);

            alert(data.message + " Zbar: " + data.zbar);
        } catch (error) {
            console.error('Error calculating or submitting zbar:', error);
            alert('Error: ' + error.message);
        }
    }

    async function verifySignature(transactionId) {
        try {
            const response = await fetch(`/api/transactions/${transactionId}/verifySignature`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to verify signature');
            }

            const result = await response.json();
            if (result.verified) {
                console.log('Signature is valid');
            } else {
                console.error('Signature verification failed');
            }
        } catch (error) {
            console.error('Verification error:', error.message);
        }
    }

    if (window.location.href.includes('transaction-status.html')) {
        await fetchAndDisplayTransactions();
    }

    if (publicAddressElement && currentBalanceElement) {
        updateUI();
    }
});
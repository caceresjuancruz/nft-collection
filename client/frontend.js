const JSON_CONTRACT_PATH = '../artifacts/contracts/NFTCollection.sol/NFTCollection.json';
const contractAddress = '0x4dB59B72588f71bb32C353396d68467cd13f85B8'; 
var currentAccount;
var contract;
const rinkebyId = '0x4';
var web3 = new Web3(Web3.givenProvider);

function metamaskReloadCallback()
{
  window.ethereum.on('accountsChanged', (accounts) => {
    document.getElementById("web3_message").textContent="Accounts changed, realoading...";
    window.location.reload()
  })
  window.ethereum.on('chainChanged', (accounts) => {
    document.getElementById("web3_message").textContent="Network changed, realoading...";
    window.location.reload()
  })
};

const getContract = async () => {
    const response = await fetch(JSON_CONTRACT_PATH);
    const data = await response.json();
    contract = new web3.eth.Contract(data.abi, contractAddress);
    setEventListener();
    getCurrentMints();
    return contract
};

const connectWallet = async () => {
    if (window.ethereum) {
        let chainId = await window.ethereum.request({method: "eth_chainId"});
        console.log("connected to chain: " + chainId);
        if(chainId !== rinkebyId){
            alert("You are not connected to the Rinkeby Testnet!");
        } else {
            await window.ethereum.request({ method: "eth_requestAccounts" });
            window.web3 = new Web3(window.ethereum);
            const account = web3.eth.accounts;
            //Get the current MetaMask selected/active wallet
            currentAccount = account.givenProvider.selectedAddress;
            console.log(`Successfully connected! - Wallet: ${currentAccount}`);
            document.getElementById("connectWalletBtn").textContent = currentAccount;
            
        }
    } else {
        console.log("No wallet");
        document.getElementById("connectWalletBtn").textContent = "No wallet installed :(";
    }
};

const setEventListener = async () => {
  contract.events.NewMint({fromBlock:"latest"}, function(error, event){})
  .on('data', function(event){
    getCurrentMints();
    $("#nftsContainer").empty();
    $("#nftsContainer").append("<h3>Your new NFT: </h3>");
    $("#nftsContainer").append(event.returnValues[2]);
  })
  .on('error', function(error, receipt) {
    $("#nftsContainer").append("Error!");
  });
}

const mintNFT = async () => {

    web3.eth.sendTransaction({
        from: currentAccount,
        to: contractAddress,
        data: contract.methods.mintNFT().encodeABI()
      })
      .on('transactionHash', function(hash){
        document.getElementById("web3_message").textContent="Minting NFT...";
      })
      .on('receipt', function(receipt){
        document.getElementById("web3_message").textContent="Success! New NFT Minted.";
        setTimeout(function(){ document.getElementById("web3_message").textContent="";}, 2000);
        console.log(receipt);
      })
      .catch((revertReason) => {
        console.log("ERROR! Transaction reverted: " + revertReason)
      });

};

const getCurrentMints = async () => {

  web3.eth.call({
    to: contractAddress, 
    data: contract.methods.currentMints().encodeABI()
  })
  .then(function(receipt1){
    web3.eth.call({
      to: contractAddress, 
      data: contract.methods.mintLimit().encodeABI()
    })
    .then(function(receipt2){
      $("#currentMints").empty();
      $("#currentMints").append("Current mints: " + parseInt(receipt1, 16) + "/" + parseInt(receipt2, 16));
    });
  });
}

const startDapp = () => {
  metamaskReloadCallback();
  getContract();
  
}

startDapp();
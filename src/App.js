import * as React from "react";
import { ethers } from "ethers";
import './App.css';
import wavePortal from "./utils/WavePortal.json";

export default function App() {

  const [currentAccount, setCurrentAccount] = React.useState("");

  const [allWaves, setAllWaves] = React.useState([]);

  const [message, setMessage] = React.useState("");
  const [count, setCount] = React.useState(0);

  const contractAddress = '0x5919C8A8723270dB033DF385b03CC786Aa784071';

  const contractABI = wavePortal.abi;

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log('Download Metamask before using app');
      } else {
        console.log('We have the ethereum object : ', ethereum);
      }

      const accounts = await ethereum.request({ method: "eth_accounts" })

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("This account is authorized : ", account);
      } else {
        console.log('No authorized accounts detected.')
      }

    } catch (e) {
      console.log(e)
    }
  }

  const connectToWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        return alert("Download Metamask")
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" })

      console.log("Connected account : ", accounts[0].slice(0, 6), "...");

    if(accounts.length){
      const account = accounts[0];
      console.log('Accounts : ', accounts);
      
      setCurrentAccount(account)

      getTotalWaves();
      getAllWaves();
    }
    } catch { }
  }

  const sendMessage =(event)=>{
    const value = event.target.value;
    setMessage(value);
  }

  React.useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave : ", from, message, timestamp);
      setAllWaves(prevState => [
        ...prevState, {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message
        }
      ])
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on("NewWave", onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave)
      }
    }

    checkIfWalletIsConnected();
  }, []);

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, wavePortal.abi, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        let waveMessage = message ? message : "Howdy";

        let waveTxn = await wavePortalContract.wave(waveMessage, { gasLimit: 300000 });
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
      } else {
        console.log('No Eth objects detected!')
      }
    } catch (error) {
      console.log(error)
    }
  }

  const sortAllWaves = (allWaves) => {
    let waves = allWaves.map((wave) => ({
      address: wave.waver,
      message: wave.message,
      timestamp: wave.timestamp,
      createdAt: new Date(wave.timestamp * 1000).toLocaleDateString('en-US', { year: 'numeric', day: '2-digit', month: "2-digit" })
    }));

    let sortedWaves = waves.sort((a, b) => b.timestamp - a.timestamp);
    console.log('sortedWaves == ', sortedWaves);
    return sortedWaves;
  }

const getTotalWaves = async () => {
    const { ethereum } = window;

    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const wavePortalContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );

      let count = await wavePortalContract.getTotalWaves();
      console.log('total count', count.toNumber());
      setCount(count.toNumber());
    }
  };

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        const allWaves = await wavePortalContract.getAllWaves();
        let sortedWaves = sortAllWaves(allWaves);

        setAllWaves(sortedWaves);
      } else {
        console.log('Ethereum object was not detected!')
      }
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
          👋🤠 Howdy there!
        </div>

        <div className="bio">
          Call me Cowboy and I work on fintech apps so that's pretty cool right? Connect your Ethereum wallet and wave at me!
        </div>

        <div>
          <textarea
            rows='3'
            onChange={sendMessage}
            value={message}
            placeholder='Hey partner, leave a message and wave'/>
        </div>
        <button className="waveButton" onClick={wave}>
          Wave at Me
        </button>

        
        {!currentAccount ? (
          <button className='waveButton' onClick={connectToWallet}>Connect Wallet</button>
        ):(
          <p>Recieved {count} waves.</p>
    )
        }

        {allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: 'Oldlace', marginTop: '16px', padding: '8px' }}>
              <div>Address : {wave.address}</div>
              <div>Time : {new Date(wave.timestamp * 1000).toLocaleDateString('en-US', { year: 'numeric', day: '2-digit', month: "2-digit" })}</div>
              <div>Message : {wave.message}</div>
            </div>
          )
        })}
      </div>
    </div>
  );
}

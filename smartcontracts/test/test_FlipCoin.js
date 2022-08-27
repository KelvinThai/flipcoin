const { BigNumber } =require('@ethersproject/bignumber');
const { Contract } =require( '@ethersproject/contracts');
const { SignerWithAddress } =require ('@nomiclabs/hardhat-ethers/signers');
const { formatEther } =require ("@ethersproject/units")
const chai =require ("chai");
const { expect } =require ('chai');
const chaiAsPromised =require ('chai-as-promised');
const { ethers }=require('hardhat');
const { keccak256 } =require ('ethers/lib/utils');

chai.use(chaiAsPromised);

function parseEther(amount) {
    return ethers.utils.parseUnits(amount.toString(), 18);
}
function getbyte(strinput) {
    var bytes = [];
    for (var i = 0; i < strinput.length; ++i) {
        bytes.push(strinput.charCodeAt(i));
    }
    return bytes;
}
describe("Flipcoin Contract", () => {

    let owner,
        alice,
        bob,
        carol;

    let flipcoin;
    let token;
    let usdt;
    beforeEach(async () => {

        await ethers.provider.send("hardhat_reset", []);

        [owner, alice, bob, carol] = await ethers.getSigners();
        
        const FlipCoin = await ethers.getContractFactory("FlipCoin", owner);
        flipcoin = await FlipCoin.deploy(1685,'0x6a2aad07396b36fe02a22b33cf443582f682c82f');


        //lending.setToken();
    })

    it('Should flip', async () => {
       await alice.sendTransaction({
            to:flipcoin.address,
            value: parseEther(5)
        });

        let requestid= await flipcoin.connect(alice).flip(0,{value:parseEther(0.5)});
        const [Flip]=(await requestid.wait()).events;
        //const args=lend.args;
        console.log({Flip});
        // setTimeout(async ()=>{
        //     const result=await flipcoin.requestInfors(requestid);
        //     console.log({result});
        // //

        // },1000*10);
    })

});

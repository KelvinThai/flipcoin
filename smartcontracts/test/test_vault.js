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
describe("Floppy Contract", () => {

    let owner,
        alice,
        bob,
        carol;

    let vault;
    let token;


    beforeEach(async () => {

        await ethers.provider.send("hardhat_reset", []);

        [owner, alice, bob, carol] = await ethers.getSigners();

        const Vault = await ethers.getContractFactory("Vault", owner);
        vault = await Vault.deploy();
        const Token = await ethers.getContractFactory("Floppy", owner);
        token = await Token.deploy();

        vault.setToken(token.address);
    })

    it('Should deposit', async () => {
        await token.transfer(alice.address, parseEther(1 * 10 ** 6));
        await token.connect(alice).approve(vault.address, token.balanceOf(alice.address));
        await vault.connect(alice).deposit(parseEther(500 * 10 ** 3));
        expect(await token.balanceOf(vault.address)).equal(parseEther(500 * 10 ** 3));

    })

    it('Should withdraw', async () => {
        let WITHDRAWER_ROLE = keccak256(Buffer.from("WITHDRAWER_ROLE")).toString();
        await vault.grantRole(WITHDRAWER_ROLE, bob.address);
        await token.transfer(alice.address, parseEther(1 * 10 ** 6));
        await token.connect(alice).approve(vault.address, token.balanceOf(alice.address));

        await vault.connect(alice).deposit(parseEther(500 * 10 ** 3));
        await vault.setWithdrawEnable(true);
        await vault.setMaxWithdrawAmount(parseEther(1 * 10 ** 6));


        await vault.connect(bob).withdraw(parseEther(300 * 10 ** 3), alice.address);
        expect(await token.balanceOf(vault.address)).equal(parseEther(200 * 10 ** 3));
        expect(await token.balanceOf(alice.address)).equal(parseEther(800 * 10 ** 3));

        await expect(vault.connect(alice).withdraw(parseEther(300 * 10 ** 3), alice.address)).revertedWith('Caller is not a withdrawer');

    })

    it('Should emergency withdraw', async () => {
        await token.transfer(alice.address, parseEther(1 * 10 ** 6));
        await token.connect(alice).approve(vault.address, token.balanceOf(alice.address));

        await vault.connect(alice).deposit(parseEther(500 * 10 ** 3));
        let ownerblanceBefore = await token.balanceOf(owner.address);

        await vault.emergencyWithdraw();
        expect(await token.balanceOf(vault.address)).equal(parseEther(0));
        let ownerblanceAfter = await token.balanceOf(owner.address);

        expect(ownerblanceAfter.sub(ownerblanceBefore)).equal(parseEther(500 * 10 ** 3));

    })

});

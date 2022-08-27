import { ethers, hardhatArguments } from 'hardhat';
import * as Config from './config';

async function main() {
    await Config.initConfig();
    const network = hardhatArguments.network ? hardhatArguments.network : 'dev';
    const [deployer] = await ethers.getSigners();
    console.log('deploy from address: ', deployer.address);

    const FlipCoin = await ethers.getContractFactory("FlipCoin");
    const flipCoin = await FlipCoin.deploy(1685,'0x6a2aad07396b36fe02a22b33cf443582f682c82f');
    console.log('FlipCoin address: ', flipCoin.address);
    Config.setConfig(network + '.flipCoin', flipCoin.address);

    await Config.updateConfig();
}

main().then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });

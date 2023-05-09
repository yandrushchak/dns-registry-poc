import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import '@nomiclabs/hardhat-solhint';
import '@openzeppelin/hardhat-upgrades';

import { getRequiredEnvVar } from './config.utils';

require('dotenv').config();

const config: HardhatUserConfig = {
  solidity: '0.8.18',
  networks: {
    sepolia: {
      url: getRequiredEnvVar('API_URL'),
      accounts: [getRequiredEnvVar('DEV_PRIVATE_KEY')],
    },
  },
};

export default config;

import { Address, BigDecimal, BigInt} from '@graphprotocol/graph-ts'
import { OlympusERC20 } from '../../generated/OlympusStakingV1/OlympusERC20';
import { CirculatingSupply } from '../../generated/OlympusStakingV1/CirculatingSupply';
import { BondingCalculator } from '../../generated/OlympusStakingV1/BondingCalculator';
import { ERC20 } from '../../generated/OlympusStakingV1/ERC20';

import { ProtocolMetric, Transaction } from '../../generated/schema'
import { BONDING_CALCULATOR, BONDING_CALCULATOR_BLOCK, CIRCULATING_SUPPLY_CONTRACT, CIRCULATING_SUPPLY_CONTRACT_BLOCK, DAIBOND_CONTRACTS1, ERC20DAI_CONTRACT, ERC20FRAX_CONTRACT, ERC20OHM_DAI_CONTRACT, ERC20OHM_FRAX_CONTRACT, OHM_ERC20_CONTRACT, SOHM_ERC20_CONTRACT, STAKING_CONTRACT_V1, STAKING_CONTRACT_V2, TREASURY_ADDRESS, TREASURY_ADDRESS_V2, TREASURY_ADDRESS_V2_BLOCK } from './Constants';
import { dayFromTimestamp } from './Dates';
import { toDecimal } from './Decimals';
import { getOHMUSDRate } from './Price';

export function loadOrCreateProtocolMetric(timestamp: BigInt): ProtocolMetric{
    let dayTimestamp = dayFromTimestamp(timestamp);

    let protocolMetric = ProtocolMetric.load(dayTimestamp)
    if (protocolMetric == null) {
        protocolMetric = new ProtocolMetric(dayTimestamp)
        protocolMetric.timestamp = timestamp
        protocolMetric.circulatingSupply = BigDecimal.fromString("0")
        protocolMetric.totalSupply = BigDecimal.fromString("0")
        protocolMetric.ohmPrice = BigDecimal.fromString("0")
        protocolMetric.marketCap = BigDecimal.fromString("0")
        protocolMetric.totalValueLocked = BigDecimal.fromString("0")
        protocolMetric.totalOHMstaked = BigDecimal.fromString("0")
        protocolMetric.treasuryRiskFreeValue = BigDecimal.fromString("0")
        protocolMetric.treasuryMarketValue = BigDecimal.fromString("0")
        protocolMetric.save()
    }
    return protocolMetric as ProtocolMetric
}


export function updateProtocolMetrics(transaction: Transaction): void{
    let pm = loadOrCreateProtocolMetric(transaction.timestamp);

    //Total Supply
    let ohm_contract = OlympusERC20.bind(Address.fromString(OHM_ERC20_CONTRACT))
    pm.totalSupply = toDecimal(ohm_contract.totalSupply(), 9)

    //Circ Supply
    if(transaction.blockNumber.gt(BigInt.fromString(CIRCULATING_SUPPLY_CONTRACT_BLOCK))){
        let circulatingsupply_contract = CirculatingSupply.bind(Address.fromString(CIRCULATING_SUPPLY_CONTRACT))
        let circ_supply = circulatingsupply_contract.OHMCirculatingSupply()
        pm.circulatingSupply = toDecimal(circ_supply, 9)
    }
    else{
        pm.circulatingSupply = pm.totalSupply;
    }

    //OHM Price
    pm.ohmPrice = getOHMUSDRate()

    //OHM Market Cap
    pm.marketCap = pm.circulatingSupply.times(pm.ohmPrice)

    //Total Value Locked
    let v1balance = toDecimal(ohm_contract.balanceOf(Address.fromString(STAKING_CONTRACT_V1)), 9)
    let v2balance = toDecimal(ohm_contract.balanceOf(Address.fromString(STAKING_CONTRACT_V2)), 9)
    pm.totalOHMstaked = v1balance.plus(v2balance)
    pm.totalValueLocked = pm.totalOHMstaked.times(pm.ohmPrice)

    //Treasury RFV and MV
    if(transaction.blockNumber.gt(BigInt.fromString(BONDING_CALCULATOR_BLOCK))){
        let bondingCalculator_contract = BondingCalculator.bind(Address.fromString(BONDING_CALCULATOR))
        let daiERC20 = ERC20.bind(Address.fromString(ERC20DAI_CONTRACT))
        let fraxERC20 = ERC20.bind(Address.fromString(ERC20FRAX_CONTRACT))
        let ohmdaiERC20 = ERC20.bind(Address.fromString(ERC20OHM_DAI_CONTRACT))
        let ohmfraxERC20 = ERC20.bind(Address.fromString(ERC20OHM_FRAX_CONTRACT))

        let treasury_address = TREASURY_ADDRESS;
        if(transaction.blockNumber.gt(BigInt.fromString(TREASURY_ADDRESS_V2_BLOCK))){
            treasury_address = TREASURY_ADDRESS_V2;
        }

        let daiBalance = daiERC20.balanceOf(Address.fromString(treasury_address))
        let fraxBalance = fraxERC20.balanceOf(Address.fromString(treasury_address))
        let ohmdaiBalance = ohmdaiERC20.balanceOf(Address.fromString(treasury_address))
        let ohmfraxBalance = ohmfraxERC20.balanceOf(Address.fromString(treasury_address))

        let ohmdai_value = bondingCalculator_contract.valuation(Address.fromString(ERC20OHM_DAI_CONTRACT), ohmdaiBalance)
        let ohmfrax_value = bondingCalculator_contract.valuation(Address.fromString(ERC20OHM_FRAX_CONTRACT), ohmfraxBalance)

        pm.treasuryMarketValue = toDecimal(daiBalance.plus(fraxBalance).plus(ohmdai_value).plus(ohmfrax_value),18)

        let ohmdai_rfv = ohmdai_value.times(BigInt.fromI32(3)).div(BigInt.fromI32(100))
        let ohmfrax_rfv = ohmfrax_value.times(BigInt.fromI32(3)).div(BigInt.fromI32(100))
        pm.treasuryRiskFreeValue = toDecimal(daiBalance.plus(fraxBalance).plus(ohmdai_rfv).plus(ohmfrax_rfv),18)
    }

    pm.save()
    
}
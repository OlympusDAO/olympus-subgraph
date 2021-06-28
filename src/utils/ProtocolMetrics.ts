import { Address, BigDecimal, BigInt} from '@graphprotocol/graph-ts'
import { OlympusERC20 } from '../../generated/OlympusStakingV1/OlympusERC20';
import { CirculatingSupply } from '../../generated/OlympusStakingV1/CirculatingSupply';

import { ProtocolMetric, Transaction } from '../../generated/schema'
import { CIRCULATING_SUPPLY_CONTRACT, CIRCULATING_SUPPLY_CONTRACT_BLOCK, OHM_ERC20_CONTRACT, SOHM_ERC20_CONTRACT, STAKING_CONTRACT_V1, STAKING_CONTRACT_V2 } from './Constants';
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
    let totalOHMLocked = v1balance.plus(v2balance)
    pm.totalValueLocked = totalOHMLocked.times(pm.ohmPrice)

    pm.save()
    
}